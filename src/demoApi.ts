// Live-data layer shared by the three AIM demo apps.
//
// Reads: Supabase REST with the public (publishable) key. Row Level Security returns the sample
// rows plus this browser's own rows, identified by the random session id in the x-demo-session header.
// Writes: always through the "demo-data" Edge Function, which validates, rate-limits and uses the
// service role on the server. No secret keys exist in this code.
import { useCallback, useEffect, useState } from 'react';

const SUPABASE_URL = 'https://xlxyphqzdzhipmllhxaq.supabase.co';
// Public by design: this key can only read what Row Level Security allows.
const PUBLISHABLE_KEY = 'sb_publishable_a-yFjZrXu_966OQGPN8UyQ_Upp3wWXy';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/demo-data`;

export type AppKey = 'suppliers' | 'leads' | 'properties';
const TABLES: Record<AppKey, string> = { suppliers: 'demo_suppliers', leads: 'demo_leads', properties: 'demo_properties' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = { id: string; session_id: string | null; seed_key: string | null; created_at: string } & Record<string, any>;
export type Record_ = Record<string, unknown>;

const STORAGE_KEY = 'aim-demo-session';
let memorySession: string | null = null;

function newUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
}

/** A random id per browser, kept in localStorage (falls back to memory if storage is blocked). */
export function getSessionId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
    const fresh = newUuid();
    localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    memorySession ??= newUuid();
    return memorySession;
  }
}

export class DemoError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function fetchRows(app: AppKey): Promise<Row[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLES[app]}?select=*&order=seed_key.asc.nullslast,created_at.asc`, {
    headers: { apikey: PUBLISHABLE_KEY, 'x-demo-session': getSessionId() },
  });
  if (!res.ok) throw new DemoError('Could not load data', 'load_failed', res.status);
  return (await res.json()) as Row[];
}

type WriteArgs = { app: AppKey; action: 'add' | 'update' | 'delete' | 'reset'; id?: string; record?: Record_ };

async function writeRow(args: WriteArgs): Promise<{ row?: Row; removed?: number }> {
  let res: Response;
  try {
    res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...args, session: getSessionId() }),
    });
  } catch {
    throw new DemoError('Could not reach the demo service. Check your connection and try again.', 'network', 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new DemoError(body?.error ?? 'Something went wrong. Please try again.', body?.code ?? 'error', res.status);
  return body;
}

/**
 * Rows for one app plus add/update/remove/reset. If the service cannot be reached, the bundled
 * sample rows are shown read-only (status "offline").
 */
export function useDemoRows(app: AppKey, fallback: Row[]) {
  const [rows, setRows] = useState<Row[]>(fallback);
  const [status, setStatus] = useState<'loading' | 'live' | 'offline'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchRows(app)
      .then((data) => { if (alive) { setRows(data); setStatus('live'); } })
      .catch(() => { if (alive) setStatus('offline'); });
    return () => { alive = false; };
  }, [app]);

  const run = useCallback(async <T,>(job: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError('');
    try {
      return await job();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  const add = (record: Record_) => run(async () => {
    const { row } = await writeRow({ app, action: 'add', record });
    if (row) setRows((prev) => [...prev, row]);
    return row;
  });
  const update = (id: string, record: Record_) => run(async () => {
    const { row } = await writeRow({ app, action: 'update', id, record });
    if (row) setRows((prev) => prev.map((r) => (r.id === id ? row : r)));
    return row;
  });
  const remove = (id: string) => run(async () => {
    await writeRow({ app, action: 'delete', id });
    setRows((prev) => prev.filter((r) => r.id !== id));
    return true;
  });
  const reset = () => run(async () => {
    await writeRow({ app, action: 'reset' });
    setRows((prev) => prev.filter((r) => r.session_id === null));
    return true;
  });

  return {
    rows, status, busy, error,
    clearError: () => setError(''),
    add, update, remove, reset,
    ownCount: rows.filter((r) => r.session_id !== null).length,
    canWrite: status === 'live',
  };
}
