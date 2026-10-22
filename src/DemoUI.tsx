// Shared controls for the live demos: note banner, toolbar, add/edit form and delete confirmation.
import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import type { Record_ } from './demoApi';

export const LIVE_NOTE = "Live demo: your changes are saved for 24 hours. Sample data is fictional. Please don't enter personal or confidential information.";

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'int' | 'num' | 'select' | 'textarea' | 'check' | 'heading';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  required?: boolean;
  help?: string;
  wide?: boolean;
};

const inputClass = 'w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0B1F33] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20';

/** A slim note about the live demo, plus connection status. */
export function DemoNote({ status }: { status: 'loading' | 'live' | 'offline' }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-3" aria-label="About this live demo" id="live-demo-note">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#475569]">
        <span aria-hidden="true">ⓘ</span>
        <span>{LIVE_NOTE}</span>
        {status === 'loading' && <span className="font-semibold" role="status">Connecting…</span>}
        {status === 'offline' && <span className="font-semibold text-[#991b1b]" role="status">The live service is unavailable, so you are seeing the sample data read-only.</span>}
      </p>
    </section>
  );
}

type ToolbarProps = {
  addLabel: string;
  onAdd: () => void;
  onReset: () => void;
  busy: boolean;
  canWrite: boolean;
  ownCount: number;
  error: string;
  onDismissError: () => void;
};

/** Add and "Reset to sample data" controls, with an error message area. */
export function DemoToolbar({ addLabel, onAdd, onReset, busy, canWrite, ownCount, error, onDismissError }: ToolbarProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="space-y-3" id="demo-toolbar">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onAdd} disabled={busy || !canWrite} className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" id="btn-add">
          + {addLabel}
        </button>
        <button type="button" onClick={() => setConfirmReset(true)} disabled={busy || !canWrite || ownCount === 0} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1F33] hover:border-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" id="btn-reset">
          Reset to sample data
        </button>
        <span className="text-xs text-[#475569]" aria-live="polite">
          {ownCount === 0 ? 'Showing the sample data only.' : `You have added ${ownCount} record${ownCount === 1 ? '' : 's'} (up to 50).`}
        </span>
      </div>
      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#7f1d1d]">
          <span>{error}</span>
          <button type="button" onClick={onDismissError} className="font-semibold underline cursor-pointer">Dismiss</button>
        </div>
      )}
      {confirmReset && (
        <ConfirmModal
          title="Reset to sample data?"
          text="This removes every record you added or edited in this demo and restores the original sample data."
          confirmLabel="Reset"
          busy={busy}
          onCancel={() => setConfirmReset(false)}
          onConfirm={async () => { await onReset(); setConfirmReset(false); }}
        />
      )}
    </div>
  );
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
}

function Overlay({ labelId, onClose, children }: { labelId: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-[#0B1F33]/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={labelId} className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border-t-4 border-[#F59E0B] my-4">
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, text, confirmLabel, busy, onConfirm, onCancel }: { title: string; text: string; confirmLabel: string; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Overlay labelId="confirm-title" onClose={onCancel}>
      <div className="p-6 space-y-4">
        <h2 id="confirm-title" className="text-lg font-bold text-[#0B1F33]">{title}</h2>
        <p className="text-sm text-[#475569]">{text}</p>
        <div className="flex justify-end gap-3">
          <button type="button" autoFocus onClick={onCancel} className="rounded-lg border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#0B1F33] cursor-pointer">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="rounded-lg bg-[#991b1b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7f1d1d] disabled:opacity-60 cursor-pointer" id="btn-confirm">{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </div>
    </Overlay>
  );
}

type FormProps = {
  title: string;
  submitLabel: string;
  fields: FieldDef[];
  initial: Record_;
  busy: boolean;
  error: string;
  onSubmit: (values: Record_) => void;
  onClose: () => void;
};

/** Add / edit form generated from a field list. */
export function RecordModal({ title, submitLabel, fields, initial, busy, error, onSubmit, onClose }: FormProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(fields.filter((f) => f.type !== 'heading').map((f) => [f.key, f.type === 'check' ? Boolean(initial[f.key]) : String(initial[f.key] ?? '')])),
  );
  const first = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>(null);
  useEffect(() => { first.current?.focus(); }, []);

  const set = (key: string, v: string | boolean) => setValues((prev) => ({ ...prev, [key]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const out: Record_ = {};
    for (const f of fields) {
      if (f.type === 'heading') continue;
      const v = values[f.key];
      if (f.type === 'check') out[f.key] = Boolean(v);
      else if (f.type === 'int') out[f.key] = Math.round(Number(v));
      else if (f.type === 'num') out[f.key] = Number(v);
      else out[f.key] = String(v).trim();
    }
    onSubmit(out);
  };

  return (
    <Overlay labelId="form-title" onClose={onClose}>
      <form onSubmit={submit} className="p-5 sm:p-6 space-y-5">
        <div>
          <h2 id="form-title" className="text-xl font-bold text-[#0B1F33]">{title}</h2>
          <p className="mt-1 text-xs text-[#475569]">{LIVE_NOTE} <a className="underline underline-offset-2 text-[#2563EB]" href="https://aimsmartsolutions.tech/privacy/" target="_blank" rel="noopener noreferrer">Privacy policy</a></p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f, i) => {
            if (f.type === 'heading') return <h3 key={f.key} className="sm:col-span-2 border-b border-[#e2e8f0] pb-1 text-xs font-bold uppercase tracking-wider text-[#2563EB]">{f.label}</h3>;
            const id = `field-${f.key}`;
            const common = { id, name: f.key, required: f.required !== false && f.type !== 'check', className: inputClass };
            const ref = i === fields.findIndex((x) => x.type !== 'heading') ? (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => { first.current = el; } : undefined;
            return (
              <div key={f.key} className={f.wide || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                {f.type === 'check' ? (
                  <label htmlFor={id} className="flex items-start gap-2 text-sm text-[#0B1F33] cursor-pointer">
                    <input id={id} name={f.key} type="checkbox" checked={Boolean(values[f.key])} onChange={(e) => set(f.key, e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#2563EB]" />
                    <span><span className="font-semibold">{f.label}</span>{f.help && <span className="block text-xs text-[#475569]">{f.help}</span>}</span>
                  </label>
                ) : (
                  <>
                    <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#475569]">{f.label}</label>
                    {f.type === 'select' ? (
                      <select {...common} ref={ref as never} value={String(values[f.key])} onChange={(e) => set(f.key, e.target.value)}>
                        {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea {...common} required={f.required === true} ref={ref as never} rows={3} maxLength={f.maxLength} value={String(values[f.key])} onChange={(e) => set(f.key, e.target.value)} />
                    ) : (
                      <input {...common} ref={ref as never}
                        type={f.type === 'text' ? 'text' : 'number'}
                        inputMode={f.type === 'int' ? 'numeric' : f.type === 'num' ? 'decimal' : undefined}
                        min={f.min} max={f.max} step={f.type === 'int' ? 1 : f.step ?? 'any'} maxLength={f.maxLength}
                        value={String(values[f.key])} onChange={(e) => set(f.key, e.target.value)} />
                    )}
                    {f.help && <p className="mt-1 text-xs text-[#475569]">{f.help}</p>}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {error && <p role="alert" className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-sm text-[#7f1d1d]">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-[#0B1F33] cursor-pointer">Cancel</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer" id="btn-save">{busy ? 'Saving…' : submitLabel}</button>
        </div>
      </form>
    </Overlay>
  );
}

/** Edit / Delete buttons for a visitor's own record; sample rows show a read-only note. */
export function OwnRowActions({ own, onEdit, onDelete, busy }: { own: boolean; onEdit: () => void; onDelete: () => void; busy: boolean }) {
  if (!own) return <p className="text-xs text-[#475569]">Sample record (read-only). Add your own record to edit or delete it.</p>;
  return (
    <div className="flex gap-2">
      <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={busy} className="rounded-lg border border-[#2563EB] px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#2563EB]/10 disabled:opacity-50 cursor-pointer" data-action="edit">Edit</button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={busy} className="rounded-lg border border-[#991b1b] px-3 py-1.5 text-xs font-semibold text-[#991b1b] hover:bg-[#991b1b]/10 disabled:opacity-50 cursor-pointer" data-action="delete">Delete</button>
    </div>
  );
}

/** Small tag shown next to a record name. */
export function OwnTag({ own }: { own: boolean }) {
  return own
    ? <span className="ml-2 inline-block rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#2563EB]">Yours</span>
    : <span className="ml-2 inline-block rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold uppercase text-[#475569]">Sample</span>;
}
