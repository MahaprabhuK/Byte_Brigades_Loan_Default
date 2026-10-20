import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useInView } from '../lib/util';

export function Section({ id, index, kicker, title, lead, children }: {
  id: string; index: string; kicker: string; title: ReactNode; lead?: ReactNode; children: ReactNode;
}) {
  return (
    <section id={id} className="relative scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
          className="mb-10 md:mb-14"
        >
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-safe/80">
            <span className="rounded border border-safe/30 bg-safe/5 px-2 py-0.5 text-safe">{index}</span>
            <span>{kicker}</span>
          </div>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">{title}</h2>
          {lead && <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-400 md:text-lg">{lead}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

export function Panel({ children, className = '', title, right, pad = true }: {
  children: ReactNode; className?: string; title?: ReactNode; right?: ReactNode; pad?: boolean;
}) {
  return (
    <div className={`panel relative overflow-hidden rounded-2xl ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">{title}</div>
          {right}
        </div>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format, hint }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
  format?: (v: number) => string; hint?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-safe">{format ? format(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="range w-full"
        style={{ ['--pct' as any]: `${pct}%` }}
      />
      {hint && <div className="mt-1 text-[11px] text-slate-500">{hint}</div>}
    </label>
  );
}

export function Select({ label, value, options, onChange }: {
  label?: string; value: string; options: { value: string; label: string }[] | string[]; onChange: (v: string) => void;
}) {
  const opts = (options as any[]).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <label className="block text-xs">
      {label && <div className="mb-1.5 text-slate-300">{label}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-ink-800 px-3 py-2 font-mono text-[12px] text-slate-100 outline-none transition focus:border-safe/50"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: {
  value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-ink-900/80 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative rounded-lg ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'} font-medium transition ${active ? 'text-ink-950' : 'text-slate-300 hover:text-white'}`}
          >
            {active && (
              <motion.span layoutId={undefined} className="absolute inset-0 rounded-lg bg-safe shadow-[0_0_20px_-4px_rgba(46,230,200,.7)]" />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Stat({ label, value, sub, tone = 'safe' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'safe' | 'risk' | 'warn' | 'volt' | 'plain' }) {
  const c = { safe: 'text-safe', risk: 'text-risk', warn: 'text-warn', volt: 'text-volt', plain: 'text-white' }[tone];
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold tabular-nums ${c}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', disabled, className = '' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; className?: string;
}) {
  const v = {
    primary: 'bg-safe text-ink-950 hover:shadow-[0_0_30px_-4px_rgba(46,230,200,.8)]',
    ghost: 'border border-white/10 bg-white/[0.03] text-slate-200 hover:border-safe/40 hover:text-white',
    danger: 'bg-risk text-white hover:shadow-[0_0_30px_-4px_rgba(255,77,109,.8)]',
  }[variant];
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

/** Interpretation card: text generated from the live numbers. */
export function Insight({ title = 'What this means', items }: { title?: string; items: ReactNode[] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-volt/25 bg-gradient-to-br from-volt/[0.08] to-transparent p-5">
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-volt">
        <Sparkles size={14} /> {title}
      </div>
      <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
        {items.filter(Boolean).map((it, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex gap-2.5">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-volt" />
            <span>{it}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function Busy({ show, label = 'Training on the server…' }: { show: boolean; label?: string }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!show) return setT(0);
    const s = Date.now();
    const id = setInterval(() => setT((Date.now() - s) / 1000), 100);
    return () => clearInterval(id);
  }, [show]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-ink-950/50 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-full border border-safe/30 bg-ink-900/90 px-4 py-2 font-mono text-xs text-safe shadow-[0_0_40px_-8px_rgba(46,230,200,.6)]">
            <Loader2 size={14} className="animate-spin" /> {label} <span className="text-slate-500">{t.toFixed(1)}s</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Chip({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'safe' | 'risk' | 'warn' | 'volt' }) {
  const c = {
    plain: 'border-white/10 text-slate-300 bg-white/[0.03]',
    safe: 'border-safe/30 text-safe bg-safe/10',
    risk: 'border-risk/30 text-risk bg-risk/10',
    warn: 'border-warn/30 text-warn bg-warn/10',
    volt: 'border-volt/30 text-volt bg-volt/10',
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] ${c}`}>{children}</span>;
}

/** Mounts children (a WebGL canvas) only while near the viewport to keep GPU contexts low. */
export function Lazy3D({ children, className = '', height }: { children: ReactNode; className?: string; height: number | string }) {
  const [ref, inView] = useInView<HTMLDivElement>('300px');
  return (
    <div ref={ref} className={className} style={{ height }}>
      {inView ? children : null}
    </div>
  );
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: i.color }} /> {i.label}
        </span>
      ))}
    </div>
  );
}
