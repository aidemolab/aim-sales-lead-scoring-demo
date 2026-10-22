// Shared what-if building blocks for the three AIM demo apps: animated numbers, accessible sliders,
// weight sliders that always add up to 100%, and a panel with presets and a Reset button.
// Everything here is view-only: nothing is saved to the database.
import { Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import './scenario.css';

/** Counts up (or down) to the new value. Respects "reduce motion". */
export function AnimatedNumber({ value, format = (n: number) => String(Math.round(n)), duration = 0.7, className }: { value: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    if (reduce) { current.current = value; setShown(value); return; }
    const controls = animate(current.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => { current.current = v; setShown(v); },
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <span className={className} data-value={value}>{format(shown)}</span>;
}

/** A labelled range slider with its current value shown. Large touch target, keyboard accessible. */
export function SliderField({ id, label, value, min, max, step = 1, onChange, format = (v: number) => String(v), hint, disabled }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string; hint?: string; disabled?: boolean;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={`scn-field${disabled ? ' is-disabled' : ''}`}>
      <div className="scn-field-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="scn-value" data-testid={`${id}-value`}>{format(value)}</output>
      </div>
      <input
        id={id} type="range" className="scn-range" min={min} max={max} step={step} value={value} disabled={disabled}
        aria-valuetext={format(value)} style={{ ['--fill' as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="scn-hint">{hint}</p>}
    </div>
  );
}

/** Moves one weight to `value` and rescales the others so the total stays exactly 100. */
export function normalizeWeights(weights: number[], index: number, value: number): number[] {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const others = weights.map((w, i) => (i === index ? 0 : w));
  const otherTotal = others.reduce((a, b) => a + b, 0);
  const remaining = 100 - v;
  const raw = others.map((w, i) => {
    if (i === index) return v;
    return otherTotal > 0 ? (w / otherTotal) * remaining : remaining / (weights.length - 1);
  });
  const floored = raw.map((r) => Math.floor(r));
  let diff = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).filter((x) => x.i !== index).sort((a, b) => b.frac - a.frac);
  for (let k = 0; diff > 0 && order.length; k = (k + 1) % order.length, diff--) floored[order[k].i] += 1;
  return floored;
}

/** A group of sliders whose values always add up to 100%. */
export function WeightSliders({ idPrefix, names, values, onChange }: { idPrefix: string; names: string[]; values: number[]; onChange: (next: number[]) => void }) {
  return (
    <div className="scn-weights">
      {names.map((name, i) => (
        <Fragment key={name}>
          <SliderField id={`${idPrefix}-${i}`} label={name} value={values[i]} min={0} max={100} step={1} format={(v) => `${v}%`}
            onChange={(v) => onChange(normalizeWeights(values, i, v))} />
        </Fragment>
      ))}
      <p className="scn-total" aria-live="polite">Weights always total <strong>{values.reduce((a, b) => a + b, 0)}%</strong>. Move one and the others rebalance.</p>
    </div>
  );
}

export type Preset = { id: string; label: string; hint: string };

/** Panel frame: title, preset buttons, Reset, and a results strip. */
export function ScenarioPanel({ title, subtitle, presets, activePreset, onPreset, onReset, changed, results, children, note }: {
  title: string; subtitle: string; presets: Preset[]; activePreset: string | null; onPreset: (id: string) => void; onReset: () => void; changed: boolean; results: ReactNode; children: ReactNode; note: string;
}) {
  return (
    <section className="scn-panel" aria-labelledby="scn-title" id="scenario-panel">
      <div className="scn-head">
        <div>
          <p className="scn-eyebrow">What-if scenario · view only, not saved</p>
          <h2 id="scn-title">{title}</h2>
          <p className="scn-sub">{subtitle}</p>
        </div>
        <div className="scn-actions">
          <div className="scn-presets" role="group" aria-label="Scenario presets">
            {presets.map((p) => (
              <button key={p.id} type="button" onClick={() => onPreset(p.id)} aria-pressed={activePreset === p.id} title={p.hint} data-preset={p.id}>{p.label}</button>
            ))}
          </div>
          <button type="button" className="scn-reset" onClick={onReset} disabled={!changed} id="scn-reset">Reset</button>
        </div>
      </div>
      <div className="scn-body">{children}</div>
      <div className="scn-results" role="region" aria-label="Scenario results">{results}</div>
      <p className="scn-note">{note}</p>
    </section>
  );
}

/** One result tile with an animated number and an optional change versus the baseline. */
export function ResultTile({ label, value, format, delta, deltaFormat, goodWhen = 'down', tone = 'navy', testId }: {
  label: string; value: number; format: (n: number) => string; delta?: number; deltaFormat?: (n: number) => string; goodWhen?: 'up' | 'down'; tone?: 'navy' | 'green' | 'amber' | 'red'; testId?: string;
}) {
  const showDelta = delta !== undefined && Math.abs(delta) > 0.0001;
  const good = delta !== undefined && (goodWhen === 'up' ? delta > 0 : delta < 0);
  return (
    <div className={`scn-tile tone-${tone}`} data-testid={testId}>
      <span className="scn-tile-label">{label}</span>
      <strong className="scn-tile-value"><AnimatedNumber value={value} format={format} /></strong>
      {showDelta && <span className={`scn-delta ${good ? 'is-good' : 'is-bad'}`}>{delta! > 0 ? '▲' : '▼'} {(deltaFormat ?? format)(Math.abs(delta!))} vs baseline</span>}
    </div>
  );
}
