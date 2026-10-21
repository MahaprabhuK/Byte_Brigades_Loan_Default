import Orbit from '../three/Orbit';
import { Canvas, useFrame } from '@react-three/fiber';

import { motion } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as THREE from 'three';
import { fmt, riskColor } from '../lib/util';
import { COL } from '../three/common';

/* ---------------------------------------------------- Logistic regression: sigmoid draws itself */
export function SigmoidViz({ data, threshold, runKey, fast }: { data: any; threshold: number; runKey: string; fast: boolean }) {
  const pts = data.viz.sigmoid as { z: number; p: number; y: number }[];
  const W = 640, H = 300, P = 36;
  const zmin = -10, zmax = 10;
  const sx = (z: number) => P + ((Math.max(zmin, Math.min(zmax, z)) - zmin) / (zmax - zmin)) * (W - 2 * P);
  const sy = (p: number) => H - P - p * (H - 2 * P);
  const path = useMemo(() => {
    let d = '';
    for (let z = zmin; z <= zmax; z += 0.1) d += `${d ? 'L' : 'M'}${sx(z).toFixed(1)},${sy(1 / (1 + Math.exp(-z))).toFixed(1)}`;
    return d;
  }, []);
  const zt = Math.log(threshold / (1 - threshold));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" key={runKey}>
      <defs>
        <linearGradient id="sg" x1="0" x2="1">
          <stop offset="0" stopColor="#2ee6c8" /><stop offset="1" stopColor="#ff4d6d" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <g key={p}>
          <line x1={P} x2={W - P} y1={sy(p)} y2={sy(p)} stroke="rgba(255,255,255,.05)" />
          <text x={P - 8} y={sy(p) + 3} textAnchor="end" className="fill-slate-500 font-mono text-[9px]">{p}</text>
        </g>
      ))}
      <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-slate-500 font-mono text-[10px]">z = β₀ + Σ βᵢxᵢ (log-odds)</text>
      {pts.map((d, i) => (
        <motion.circle key={i} cx={sx(d.z)} cy={sy(d.p) + (d.y ? -1 : 1) * (((i * 37) % 13) / 13) * 7} r={2.6}
          fill={d.y ? '#ff4d6d' : '#2ee6c8'} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.75, scale: 1 }}
          transition={{ delay: fast ? 0 : 1.2 + i * 0.002 }} />
      ))}
      <motion.path d={path} fill="none" stroke="url(#sg)" strokeWidth={3.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: fast ? 0.2 : 1.4, ease: 'easeInOut' }} style={{ filter: 'drop-shadow(0 0 6px rgba(76,195,255,.6))' }} />
      <line x1={P} x2={W - P} y1={sy(threshold)} y2={sy(threshold)} stroke="#ffb547" strokeDasharray="5 4" />
      <line x1={sx(zt)} x2={sx(zt)} y1={P} y2={H - P} stroke="#ffb547" strokeOpacity={0.4} strokeDasharray="2 4" />
      <text x={W - P} y={sy(threshold) - 6} textAnchor="end" className="fill-warn font-mono text-[10px]">threshold {threshold.toFixed(2)}</text>
      <text x={P + 4} y={P - 10} className="fill-slate-400 font-mono text-[10px]">σ(z) = 1 / (1 + e^−z) = P(Default)</text>
    </svg>
  );
}

/* ---------------------------------------------------- Decision tree: grows level by level */
export function TreeViz({ data, fast }: { data: any; fast: boolean }) {
  const nodes = data.viz.tree as any[];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const W = 900, H = 330;
  // layout: assign x by in-order traversal of the truncated tree
  const pos = new Map<number, { x: number; y: number }>();
  let leafX = 0;
  const maxDepth = Math.max(...nodes.map((n) => n.depth));
  const walk = (id: number): number => {
    const n = byId.get(id);
    if (!n) return 0;
    let x: number;
    if (n.leaf || n.left === undefined) {
      x = leafX++;
    } else {
      const a = walk(n.left), b = walk(n.right);
      x = (a + b) / 2;
    }
    pos.set(id, { x, y: n.depth });
    return x;
  };
  walk(0);
  const nLeaves = Math.max(1, leafX);
  const X = (x: number) => 30 + (x / Math.max(1, nLeaves - 1)) * (W - 60);
  const Y = (d: number) => 48 + (d / Math.max(1, maxDepth)) * (H - 96);
  const delay = (d: number) => (fast ? 0 : d * 0.45);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" key={JSON.stringify(data.params)}>
      {nodes.filter((n) => !n.leaf && n.left !== undefined).map((n) => (
        [n.left, n.right].map((c, k) => {
          const a = pos.get(n.id)!, b = pos.get(c);
          if (!b) return null;
          return (
            <motion.path key={`${n.id}-${c}`} d={`M${X(a.x)},${Y(a.y)} C${X(a.x)},${(Y(a.y) + Y(b.y)) / 2} ${X(b.x)},${(Y(a.y) + Y(b.y)) / 2} ${X(b.x)},${Y(b.y)}`}
              fill="none" stroke={k === 0 ? 'rgba(46,230,200,.35)' : 'rgba(255,77,109,.35)'} strokeWidth={1.5}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay(n.depth) + 0.15, duration: fast ? 0.1 : 0.4 }} />
          );
        })
      ))}
      {nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        const r = 5 + Math.sqrt(n.samples / nodes[0].samples) * 14;
        return (
          <motion.g key={n.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: delay(n.depth), type: 'spring', stiffness: 200, damping: 18 }}
            style={{ transformOrigin: `${X(p.x)}px ${Y(p.y)}px` }}>
            <circle cx={X(p.x)} cy={Y(p.y)} r={r} fill={riskColor(Math.min(1, n.rate / 0.5))} fillOpacity={0.85} stroke="#04060c" strokeWidth={2}>
              <title>{`${n.label ?? 'leaf'}\nsamples ${n.samples}\ndefault rate ${(n.rate * 100).toFixed(1)}%`}</title>
            </circle>
            {!n.leaf && n.depth <= 2 && (
              <text x={X(p.x)} y={Y(p.y) - r - 5} textAnchor="middle" className="fill-slate-200 font-mono text-[10px]">{n.label}</text>
            )}
            {n.leaf && <text x={X(p.x)} y={Y(p.y) + r + 11} textAnchor="middle" className="fill-slate-500 font-mono text-[8px]">{(n.rate * 100).toFixed(0)}%</text>}
          </motion.g>
        );
      })}
      <text x={10} y={H - 6} className="fill-slate-500 font-mono text-[10px]">
        Top {maxDepth} levels shown · full tree: depth {data.viz.depth}, {data.viz.leaves} leaves · left branch = condition true · colour = default rate
      </text>
    </svg>
  );
}

/* ---------------------------------------------------- Random forest: a forest sprouts (3D) */
function Forest({ trees, runKey, fast }: { trees: any[]; runKey: string; fast: boolean }) {
  const n = Math.min(100, trees.length);
  const group = useRef<THREE.Group>(null!);
  const items = useMemo(() => Array.from({ length: n }, (_, i) => {
    const t = trees[i % trees.length];
    const a = i * 2.399, r = 0.4 + Math.sqrt(i) * 0.42;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: 0.6 + (t.depth / 14) * 1.3, auc: t.auc, d: i };
  }), [trees, n]);
  const born = useRef<number | null>(null);
  const meshes = useRef<THREE.Group[]>([]);
  useFrame((s, dt) => {
    if (born.current === null) born.current = s.clock.elapsedTime;
    const el = (s.clock.elapsedTime - born.current) * (fast ? 8 : 1);
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const p = Math.max(0, Math.min(1, (el - i * 0.03) / 0.5));
      const e = 1 - Math.pow(1 - p, 3);
      m.scale.set(e, e, e);
    });
    group.current.rotation.y += dt * 0.12;
  });
  return (
    <group ref={group} key={runKey}>
      {items.map((t, i) => {
        const c = COL.safe.clone().lerp(COL.volt, Math.max(0, Math.min(1, (0.95 - t.auc) / 0.15)));
        return (
          <group key={i} position={[t.x, 0, t.z]} ref={(m) => { if (m) meshes.current[i] = m; }} scale={0.001}>
            <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.04, 0.06, 0.3, 6]} /><meshStandardMaterial color="#5b4636" /></mesh>
            <mesh position={[0, 0.3 + t.h / 2, 0]}><coneGeometry args={[0.28, t.h, 7]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} flatShading /></mesh>
          </group>
        );
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[5, 64]} /><meshStandardMaterial color="#070d19" /></mesh>
    </group>
  );
}

export function ForestViz({ data, fast }: { data: any; fast: boolean }) {
  const growth = data.viz.growth as any[];
  return (
    <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr]">
      <div className="h-[300px] md:h-full">
        <Canvas camera={{ position: [0, 3.6, 6.2], fov: 50 }} dpr={[1, 2]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 8, 5]} intensity={1.4} />
          <Forest trees={data.viz.trees} runKey={JSON.stringify(data.params)} fast={fast} />
          <Orbit enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.2} />
        </Canvas>
      </div>
      <div className="flex flex-col">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">Forest ROC-AUC as trees are added</div>
        <div className="min-h-[180px] flex-1">
          <ResponsiveContainer>
            <LineChart data={growth} margin={{ left: -10, right: 10, top: 6 }}>
              <CartesianGrid />
              <XAxis dataKey="trees" />
              <YAxis domain={['auto', 1]} tickFormatter={(v) => v.toFixed(3)} />
              <Tooltip formatter={(v: any) => v.toFixed(4)} />
              <Line dataKey="auc" stroke="#2ee6c8" strokeWidth={2.5} dot={false} animationDuration={fast ? 200 : 2000} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[11px] leading-snug text-slate-500">
          A single tree scores about {fmt.num(Math.min(...data.viz.trees.map((t: any) => t.auc)), 3)} to {fmt.num(Math.max(...data.viz.trees.map((t: any) => t.auc)), 3)} AUC. Averaging {data.params.n_estimators} de-correlated trees reaches {fmt.num(data.auc, 4)}.
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- Gradient boosting: trees stack, loss drops */
export function BoostViz({ data, fast }: { data: any; fast: boolean }) {
  const st = data.viz.stages as any[];
  const n = st.length;
  const maxL = Math.max(...st.map((s) => s.test));
  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
      <div className="relative flex h-[280px] flex-col-reverse items-center gap-[3px] overflow-hidden rounded-xl border border-white/5 bg-ink-950/60 p-3 md:h-full">
        {st.map((s, i) => (
          <motion.div key={i + JSON.stringify(data.params)} initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: fast ? 0 : i * (2.4 / n), type: 'spring', stiffness: 260, damping: 22 }}
            className="h-[3px] min-h-[2px] flex-1 rounded-sm" style={{
              width: `${20 + (s.test / maxL) * 80}%`,
              background: `linear-gradient(90deg, ${riskColor(s.test / maxL)}, ${riskColor(Math.max(0, s.test / maxL - 0.3))})`,
              boxShadow: `0 0 10px ${riskColor(s.test / maxL)}55`,
            }} />
        ))}
        <div className="absolute left-3 top-2 font-mono text-[10px] text-slate-500">stage {data.params.n_estimators}</div>
        <div className="absolute bottom-1 left-3 font-mono text-[10px] text-slate-500">stage 1</div>
      </div>
      <div className="flex flex-col">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">Log-loss per boosting stage (each tree fits the previous residuals)</div>
        <div className="min-h-[200px] flex-1">
          <ResponsiveContainer>
            <LineChart data={st} margin={{ left: -6, right: 10, top: 6 }}>
              <CartesianGrid />
              <XAxis dataKey="stage" />
              <YAxis tickFormatter={(v) => v.toFixed(2)} />
              <Tooltip formatter={(v: any) => v.toFixed(4)} />
              <Line dataKey="train" name="train loss" stroke="#4cc3ff" strokeWidth={2} dot={false} animationDuration={fast ? 200 : 2400} />
              <Line dataKey="test" name="test loss" stroke="#ff4d6d" strokeWidth={2.5} dot={false} animationDuration={fast ? 200 : 2400} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Test loss goes from {fmt.num(st[0].test, 3)} to {fmt.num(st[n - 1].test, 3)}.
          {st[n - 1].test > Math.min(...st.map((s) => s.test)) * 1.02 ? ' It rises again at the end, which is overfitting: try fewer stages or a lower learning rate.' : ' It is still falling or flat, so there is no sign of overfitting.'}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- MLP: signals pulse through the network */
export function MlpViz({ data, fast }: { data: any; fast: boolean }) {
  const layers = (data.viz.layers as number[]).map((n) => Math.min(n, 12));
  const real = data.viz.layers as number[];
  const W = 560, H = 290;
  const lx = (i: number) => 50 + (i / (layers.length - 1)) * (W - 100);
  const ly = (j: number, n: number) => H / 2 + (j - (n - 1) / 2) * Math.min(22, (H - 50) / n);
  const edges: [number, number, number, number][] = [];
  layers.forEach((n, i) => {
    if (i === layers.length - 1) return;
    for (let a = 0; a < n; a++) for (let b = 0; b < layers[i + 1]; b++) edges.push([i, a, b, layers[i + 1]]);
  });
  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
        {edges.map(([i, a, b, nb], k) => (
          <line key={k} x1={lx(i)} y1={ly(a, layers[i])} x2={lx(i + 1)} y2={ly(b, nb)} stroke="rgba(139,125,255,.12)" />
        ))}
        {!fast && edges.filter((_, k) => k % 7 === 0).map(([i, a, b, nb], k) => (
          <motion.circle key={'p' + k} r={2} fill="#2ee6c8"
            initial={{ cx: lx(i), cy: ly(a, layers[i]), opacity: 0 }}
            animate={{ cx: [lx(i), lx(i + 1)], cy: [ly(a, layers[i]), ly(b, nb)], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, delay: i * 0.6 + (k % 10) * 0.12, repeat: Infinity, repeatDelay: 1.5 }} />
        ))}
        {layers.map((n, i) => (
          <g key={i}>
            {Array.from({ length: n }).map((_, j) => (
              <motion.circle key={j} cx={lx(i)} cy={ly(j, n)} r={6} fill={i === 0 ? '#4cc3ff' : i === layers.length - 1 ? '#ff4d6d' : '#8b7dff'}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: fast ? 0 : i * 0.25 + j * 0.02 }} />
            ))}
            <text x={lx(i)} y={H - 6} textAnchor="middle" className="fill-slate-500 font-mono text-[10px]">
              {i === 0 ? `${real[i]} inputs` : i === layers.length - 1 ? 'P(default)' : `${real[i]} ${data.params.activation}`}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-col">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">Training loss per epoch ({data.viz.epochs} epochs, early stopping)</div>
        <div className="min-h-[200px] flex-1">
          <ResponsiveContainer>
            <LineChart data={data.viz.loss} margin={{ left: -6, right: 10, top: 6 }}>
              <CartesianGrid />
              <XAxis dataKey="epoch" />
              <YAxis tickFormatter={(v) => v.toFixed(2)} />
              <Tooltip formatter={(v: any) => v.toFixed(4)} />
              <Line dataKey="loss" stroke="#8b7dff" strokeWidth={2.5} dot={false} animationDuration={fast ? 200 : 2000} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
