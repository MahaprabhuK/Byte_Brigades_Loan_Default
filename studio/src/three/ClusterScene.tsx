import Orbit from './Orbit';
import {Html} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SEG_COLORS } from '../lib/util';
import { COL, dotTexture } from './common';

type Pt = { x: number; y: number; z: number; c: number; d: number };
const S = 1.15;
const GREY = new THREE.Color('#3b4659');
const GA = GREY.toArray();

function Cloud({ points, colorBy, nSeg, runId, fast, history, centroids, names }: any) {
  const ref = useRef<THREE.Points>(null!);
  const t0 = useRef<number | null>(null);
  const cents = useRef<THREE.Mesh[]>([]);
  const { pos, target, cur } = useMemo(() => {
    const pos = new Float32Array(points.length * 3);
    const target = new Float32Array(points.length * 3);
    const cur = new Float32Array(points.length * 3);
    points.forEach((p: Pt, i: number) => {
      pos.set([p.x * S, p.y * S, p.z * S], i * 3);
      const c = colorBy === 'default' ? (p.d ? COL.risk : COL.safe.clone().multiplyScalar(0.55))
        : p.c < 0 ? new THREE.Color('#475569') : new THREE.Color(SEG_COLORS[p.c % SEG_COLORS.length]);
      target.set([c.r, c.g, c.b], i * 3);
      cur.set([GREY.r, GREY.g, GREY.b], i * 3);
    });
    return { pos, target, cur };
  }, [points, colorBy]);

  useEffect(() => { t0.current = null; }, [runId, points]);

  const hist = history as number[][][] | null;
  useFrame((s, dt) => {
    if (t0.current === null) t0.current = s.clock.elapsedTime;
    const el = (s.clock.elapsedTime - t0.current) * (fast ? 10 : 1);
    const steps = hist ? hist.length : 1;
    const moveDur = hist ? Math.min(3.2, 0.25 * steps) : 0.6;
    const prog = Math.min(1, el / moveDur);
    // centroids walk through their history
    centroids.forEach((c: any, k: number) => {
      const m = cents.current[k];
      if (!m) return;
      let p = [c.x, c.y, c.z];
      if (hist && hist.length > 1) {
        const f = prog * (steps - 1);
        const i = Math.min(steps - 2, Math.floor(f));
        const a = hist[i][k], b = hist[i + 1][k], u = f - i;
        if (a && b) p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * u];
      }
      m.position.set(p[0] * S, p[1] * S, p[2] * S);
      const pulse = 1 + Math.sin(s.clock.elapsedTime * 3 + k) * 0.08;
      m.scale.setScalar(pulse);
    });
    // colours fade in once centroids settle
    const colorT = Math.max(0, Math.min(1, (el - moveDur * 0.6) / 1.0));
    const g = ref.current.geometry.attributes.color as THREE.BufferAttribute;
    const arr = g.array as Float32Array;
    const kk = Math.min(1, dt * 8);
    for (let i = 0; i < arr.length; i++) { const g0 = GA[i % 3]; arr[i] += (g0 + (target[i] - g0) * colorT - arr[i]) * kk; }
    g.needsUpdate = true;
  });

  return (
    <group>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[cur, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.13} vertexColors map={dotTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {centroids.map((c: any, k: number) => (
        <mesh key={k} ref={(m) => { if (m) cents.current[k] = m; }} position={[c.x * S, c.y * S, c.z * S]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshBasicMaterial color={SEG_COLORS[c.rank % SEG_COLORS.length]} toneMapped={false} />
          {nSeg <= 6 && (
            <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
              <div className="-translate-y-6 whitespace-nowrap rounded-md border border-white/15 bg-ink-950/85 px-2 py-0.5 font-mono text-[11px]" style={{ color: SEG_COLORS[c.rank % SEG_COLORS.length] }}>
                {names[k]}
              </div>
            </Html>
          )}
        </mesh>
      ))}
      <axesHelper args={[3]} />
    </group>
  );
}

export default function ClusterScene(props: any) {
  return (
    <Canvas camera={{ position: [5.5, 3.5, 6.5], fov: 45 }} dpr={[1, 2]}>
      <Cloud {...props} />
      <Orbit autoRotate autoRotateSpeed={0.6} enablePan={false} minDistance={3} maxDistance={18} />
    </Canvas>
  );
}
