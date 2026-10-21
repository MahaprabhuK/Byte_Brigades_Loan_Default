import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { Gauge, Zap } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { onSnapshotMiss, useApiMode } from '../lib/api';
import { MotionCtx } from '../lib/util';

const LINKS = [
  ['data', '01', 'Data'],
  ['warehouse', '02', 'Warehouse'],
  ['olap', '03', 'OLAP'],
  ['classification', '04', 'Classify'],
  ['clustering', '05', 'Cluster'],
  ['association', '06', 'Rules'],
  ['prediction', '07', 'Predict'],
];

export default function Nav() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const mode = useApiMode();
  const { fast, setFast } = useContext(MotionCtx);
  const [active, setActive] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let t: any;
    const off = onSnapshotMiss((m) => { setNotice(m); clearTimeout(t); t = setTimeout(() => setNotice(null), 3500); });
    return () => { off(); clearTimeout(t); };
  }, []);

  useEffect(() => {
    const els = LINKS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const pill = {
    live: { c: 'text-safe border-safe/30 bg-safe/10', t: 'Live API', dot: 'bg-safe' },
    snapshot: { c: 'text-warn border-warn/30 bg-warn/10', t: 'Precomputed', dot: 'bg-warn' },
    unknown: { c: 'text-slate-400 border-white/10 bg-white/5', t: 'Connecting', dot: 'bg-slate-400' },
  }[mode];

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 md:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-safe to-volt text-ink-950">
              <Gauge size={16} strokeWidth={2.5} />
            </span>
            <span className="hidden font-display text-sm font-semibold tracking-tight text-white sm:block">
              Byte Brigades <span className="text-slate-500">/ Loan Default Studio</span>
            </span>
          </a>
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {LINKS.map(([id, n, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className={`rounded-lg px-2.5 py-1.5 text-xs transition ${active === id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <span className="mr-1 font-mono text-[10px] text-safe/70">{n}</span>
                {label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-3">
            <button
              onClick={() => setFast(!fast)}
              title="Skip long animations (useful when re-running demos)"
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition ${fast ? 'border-volt/40 bg-volt/15 text-volt' : 'border-white/10 text-slate-400 hover:text-white'}`}
            >
              <Zap size={11} /> {fast ? 'Fast' : 'Cinematic'}
            </button>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${pill.c}`}>
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${pill.dot}`} /> {pill.t}
            </span>
          </div>
        </div>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/5 bg-ink-950/80 px-3 py-1.5 backdrop-blur-xl lg:hidden">
        {LINKS.map(([id, n, label]) => (
          <a key={id} href={`#${id}`}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs transition ${active === id ? 'bg-white/10 text-white' : 'text-slate-400'}`}>
            <span className="mr-1 font-mono text-[10px] text-safe/70">{n}</span>{label}
          </a>
        ))}
      </nav>
      <motion.div style={{ scaleX: x }} className="h-[2px] origin-left bg-gradient-to-r from-safe via-sky2 to-risk" />
      <AnimatePresence>
        {notice && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-3 w-fit max-w-[92vw] rounded-full border border-warn/40 bg-ink-900/95 px-4 py-2 text-center text-xs text-warn shadow-xl backdrop-blur">
            {notice}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
