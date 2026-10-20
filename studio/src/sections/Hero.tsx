import { Canvas } from '@react-three/fiber';
import { animate, motion, useInView } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '../lib/api';
import { fmt, useFast, useInView as useVisible } from '../lib/util';
import ParticleSphere from '../three/ParticleSphere';

function Counter({ to, format, delay = 0 }: { to: number; format: (v: number) => string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView || !to) return;
    const c = animate(0, to, { duration: 2, delay, ease: [0.2, 0.7, 0.2, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, to, delay]);
  return <span ref={ref}>{format(v)}</span>;
}

export default function Hero() {
  const { data } = useApi<any>('/api/overview');
  const fast = useFast();
  const [vis, visible] = useVisible<HTMLDivElement>('100px');
  const stats = [
    { label: 'Loan records', v: data?.rows ?? 50000, f: fmt.int, tone: 'text-white' },
    { label: 'Attributes', v: data?.attributes ?? 18, f: (x: number) => Math.round(x).toString(), tone: 'text-white' },
    { label: 'Default rate', v: (data?.default_rate ?? 0.117) * 100, f: (x: number) => `${x.toFixed(1)}%`, tone: 'text-risk' },
    { label: 'Class imbalance', v: data?.imbalance_ratio ?? 7.55, f: (x: number) => `${x.toFixed(2)} : 1`, tone: 'text-warn' },
    { label: 'Portfolio value', v: data?.portfolio_value ?? 6.39e9, f: fmt.money, tone: 'text-safe' },
  ];
  return (
    <section id="top" className="relative h-[100svh] min-h-[640px] overflow-hidden">
      <div className="absolute inset-0" ref={vis}>
        <Canvas frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 0, 7.2], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
          <ParticleSphere fast={fast} defaultRate={data?.default_rate ?? 0.117} />
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#04060c_78%)]" />
      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-4 pb-14 md:px-8 md:pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: fast ? 0 : 1.2 }}>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-safe">CSI3010 · DWDM capstone · Review 3</div>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold leading-[0.95] tracking-tight text-white md:text-7xl lg:text-8xl">
            Every dot is a loan.<br />
            <span className="text-gradient">The red ones default.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-400 md:text-lg">
            An end-to-end walkthrough of the Byte Brigades pipeline: preprocessing, a star-schema warehouse, OLAP,
            and four data-mining modules you can retrain live, right here.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: fast ? 0 : 1.6 }}
          className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-3 lg:grid-cols-5"
        >
          {stats.map((s, i) => (
            <div key={s.label} className="bg-ink-950/80 px-5 py-4 backdrop-blur">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{s.label}</div>
              <div className={`mt-1 font-display text-2xl font-semibold tabular-nums md:text-3xl ${s.tone}`}>
                <Counter to={s.v} format={s.f} delay={(fast ? 0 : 1.6) + i * 0.1} />
              </div>
            </div>
          ))}
        </motion.div>
        <a href="#data" className="pointer-events-auto mt-8 inline-flex w-fit items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowDown size={16} className="animate-bounce" /> Start the walkthrough
        </a>
      </div>
    </section>
  );
}
