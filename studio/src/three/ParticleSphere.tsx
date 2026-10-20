import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { COL, dotTexture, easeInOut } from './common';

/** One particle per loan (sampled). Defaulters glow red. They swirl in from chaos into a globe. */
export default function ParticleSphere({ count = 16000, defaultRate = 0.117, fast = false }) {
  const ref = useRef<THREE.Points>(null!);
  const t0 = useRef<number | null>(null);
  const { start, target, colors, phase } = useMemo(() => {
    const start = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      // chaotic start: wide disc
      const r0 = 6 + Math.random() * 10;
      const a0 = Math.random() * Math.PI * 2;
      start[i * 3] = Math.cos(a0) * r0;
      start[i * 3 + 1] = (Math.random() - 0.5) * 8;
      start[i * 3 + 2] = Math.sin(a0) * r0;
      // fibonacci sphere with a little thickness
      const y = 1 - (i / (count - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      const R = 2.6 + (Math.random() - 0.5) * 0.35;
      target[i * 3] = Math.cos(th) * rad * R;
      target[i * 3 + 1] = y * R;
      target[i * 3 + 2] = Math.sin(th) * rad * R;
      const isDef = Math.random() < defaultRate;
      const c = isDef ? COL.risk : COL.safe.clone().lerp(COL.sky, Math.random() * 0.6);
      colors.set([c.r, c.g, c.b], i * 3);
      phase[i] = Math.random();
    }
    return { start, target, colors, phase };
  }, [count, defaultRate]);

  const pos = useMemo(() => new Float32Array(start), [start]);

  useFrame((state, dt) => {
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const el = state.clock.elapsedTime - t0.current;
    const dur = fast ? 0.4 : 3.2;
    const g = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = g.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const delay = phase[i] * (fast ? 0.1 : 1.2);
      const p = Math.min(1, Math.max(0, (el - delay) / dur));
      const e = easeInOut(p);
      const swirl = (1 - e) * 4.0;
      const sx = start[i * 3], sz = start[i * 3 + 2];
      const cs = Math.cos(swirl), sn = Math.sin(swirl);
      const rx = sx * cs - sz * sn, rz = sx * sn + sz * cs;
      arr[i * 3] = rx + (target[i * 3] - rx) * e;
      arr[i * 3 + 1] = start[i * 3 + 1] + (target[i * 3 + 1] - start[i * 3 + 1]) * e;
      arr[i * 3 + 2] = rz + (target[i * 3 + 2] - rz) * e;
    }
    g.needsUpdate = true;
    ref.current.rotation.y += dt * 0.08;
    const m = state.pointer;
    ref.current.rotation.x += (m.y * 0.25 - ref.current.rotation.x) * 0.03;
    ref.current.rotation.z += (-m.x * 0.15 - ref.current.rotation.z) * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        map={dotTexture()}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
