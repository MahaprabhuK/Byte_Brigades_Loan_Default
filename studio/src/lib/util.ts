import { createContext, useContext, useEffect, useRef, useState } from 'react';

export const fmt = {
  int: (v: number) => Math.round(v).toLocaleString('en-US'),
  pct: (v: number, d = 1) => `${(v * 100).toFixed(d)}%`,
  num: (v: number, d = 2) => (v == null || Number.isNaN(v) ? '—' : v.toFixed(d)),
  money: (v: number) =>
    v >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v / 1e3).toFixed(0)}k` : `$${v.toFixed(0)}`,
  compact: (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${+v.toFixed(2)}`),
};

export const pretty = (s: string) =>
  s
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace('DTI Ratio', 'DTI')
    .replace('Has Co Signer', 'Co-signer');

/** Diverging risk colour: teal (safe) → amber → red (risk). t in [0,1] */
export function riskColor(t: number) {
  t = Math.max(0, Math.min(1, t));
  const stops = [
    [46, 230, 200],
    [190, 235, 90],
    [255, 181, 71],
    [255, 77, 109],
  ];
  const seg = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(seg));
  const f = seg - i;
  const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export const SEG_COLORS = ['#2ee6c8', '#4cc3ff', '#8b7dff', '#ffb547', '#ff4d6d', '#ff7ad9', '#a3e635', '#f97316', '#38bdf8', '#e879f9'];

// ---- global "reduce motion" switch (skip long animations during the demo)
export const MotionCtx = createContext<{ fast: boolean; setFast: (v: boolean) => void }>({ fast: false, setFast: () => {} });
export const useFast = () => useContext(MotionCtx).fast;

export function useInView<T extends Element>(rootMargin = '200px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}
