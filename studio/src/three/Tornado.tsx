import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { COL, dotTexture, easeInOut, easeOut } from './common';

type Props = { runId: number; testSize: number; defaultRate: number; fast: boolean; onDone?: () => void; trainN?: number; testN?: number };

const N = 1800;
const RAW = new THREE.Color('#5b6474');

/**
 * Preprocessing tornado: messy raw rows get pulled into a vortex (clean → scale → encode)
 * and land as two neat, stratified piles (train / test). Red cards = defaulters.
 */
export default function Tornado({ runId, testSize, defaultRate, fast, onDone, trainN, testN }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dust = useRef<THREE.Points>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const start = useRef<number | null>(null);
  const done = useRef(false);
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle');
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  const plan = useMemo(() => {
    const rnd = mulberry(7);
    const idx = Array.from({ length: N }, (_, i) => i).sort(() => rnd() - 0.5);
    const nDef = Math.round(N * defaultRate);
    const isDef = new Uint8Array(N);
    idx.slice(0, nDef).forEach((i) => (isDef[i] = 1));
    // stratified split: same share of defaulters goes to test
    const isTest = new Uint8Array(N);
    const defIdx = idx.slice(0, nDef), okIdx = idx.slice(nDef);
    defIdx.slice(0, Math.round(nDef * testSize)).forEach((i) => (isTest[i] = 1));
    okIdx.slice(0, Math.round((N - nDef) * testSize)).forEach((i) => (isTest[i] = 1));
    const startPos: number[][] = [], endPos: number[][] = [], delay: number[] = [], rot: number[][] = [];
    let tr = 0, te = 0;
    const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => isDef[b] - isDef[a] || a - b);
    const slot = new Map<number, number[]>();
    for (const i of order) {
      if (isTest[i]) {
        const k = te++;
        slot.set(i, [2.9 + (k % 9) * 0.17 - 0.68, -2.05 + Math.floor(k / 81) * 0.075, (Math.floor(k / 9) % 9) * 0.17 - 0.68]);
      } else {
        const k = tr++;
        slot.set(i, [-2.9 + (k % 14) * 0.17 - 1.1, -2.05 + Math.floor(k / 196) * 0.075, (Math.floor(k / 14) % 14) * 0.17 - 1.1]);
      }
    }
    for (let i = 0; i < N; i++) {
      startPos.push([-1 + (rnd() - 0.5) * 9, -2.1 + rnd() * 0.5, (rnd() - 0.5) * 3.5]);
      rot.push([rnd() * 3, rnd() * 3, rnd() * 3]);
      endPos.push(slot.get(i)!);
      delay.push(rnd());
    }
    return { isDef, isTest, startPos, endPos, delay, rot };
  }, [testSize, defaultRate]);

  const dustGeo = useMemo(() => {
    const n = 1400;
    const p = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) seed[i] = Math.random();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    (g as any).userData = { seed, n };
    return g;
  }, []);

  useEffect(() => {
    if (runId > 0) {
      start.current = null;
      done.current = false;
      setPhase('run');
    }
  }, [runId]);

  useFrame((state) => {
    const speed = fast ? 6 : 1;
    let T = 0;
    if (phase !== 'idle') {
      if (start.current === null) start.current = state.clock.elapsedTime;
      T = (state.clock.elapsedTime - start.current) * speed;
    }
    const spread = 1.9, dur = 2.7;
    for (let i = 0; i < N; i++) {
      const [sx, sy, sz] = plan.startPos[i];
      const [ex, ey, ez] = plan.endPos[i];
      let x = sx, y = sy, z = sz, rx = plan.rot[i][0], ry = plan.rot[i][1], rz = plan.rot[i][2];
      let mix = 0;
      if (phase === 'idle') {
        // gentle jitter, waiting
        y = sy + Math.sin(state.clock.elapsedTime * 1.5 + i) * 0.02;
      } else {
        const p = Math.max(0, Math.min(1, (T - plan.delay[i] * spread) / dur));
        if (p < 0.25) {
          const e = easeInOut(p / 0.25);
          x = sx + (0 - sx) * e; y = sy + (-2 - sy) * e; z = sz + (0 - sz) * e;
          rx += e * 2;
        } else if (p < 0.78) {
          const s = (p - 0.25) / 0.53;
          const a = s * Math.PI * 9 + i * 0.37;
          const r = 0.25 + s * 1.7;
          x = Math.cos(a) * r; z = Math.sin(a) * r; y = -2 + s * 4.6;
          rx = a; ry = a * 0.7; rz = 0;
          mix = s;
        } else {
          const s = easeOut((p - 0.78) / 0.22);
          const a = Math.PI * 9 + i * 0.37, r = 1.95;
          const fx = Math.cos(a) * r, fz = Math.sin(a) * r, fy = 2.6;
          x = fx + (ex - fx) * s; y = fy + (ey - fy) * s + Math.sin(s * Math.PI) * 0.8; z = fz + (ez - fz) * s;
          rx = (1 - s) * a; ry = (1 - s) * a * 0.7; rz = 0;
          mix = 1;
        }
      }
      tmp.position.set(x, y, z);
      tmp.rotation.set(rx, ry, rz);
      tmp.scale.setScalar(1);
      tmp.updateMatrix();
      mesh.current.setMatrixAt(i, tmp.matrix);
      const target = plan.isDef[i] ? COL.risk : plan.isTest[i] ? COL.volt : COL.safe;
      col.copy(plan.isDef[i] ? COL.risk.clone().multiplyScalar(0.55) : RAW).lerp(target, mix);
      mesh.current.setColorAt(i, col);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;

    // vortex dust
    const { seed, n } = (dustGeo as any).userData;
    const arr = dustGeo.attributes.position.array as Float32Array;
    const active = phase === 'run' ? 1 : 0;
    const el = state.clock.elapsedTime;
    for (let k = 0; k < n; k++) {
      const s = (seed[k] + el * 0.25) % 1;
      const a = s * Math.PI * 14 + seed[k] * 50 + el * 3;
      const r = (0.2 + s * 2.1) * (0.7 + 0.3 * Math.sin(seed[k] * 20));
      arr[k * 3] = Math.cos(a) * r;
      arr[k * 3 + 1] = -2.1 + s * 5;
      arr[k * 3 + 2] = Math.sin(a) * r;
    }
    dustGeo.attributes.position.needsUpdate = true;
    const mat = dust.current.material as THREE.PointsMaterial;
    const totalT = (spread + dur) ;
    const fade = phase === 'run' ? Math.min(1, T / 0.5) * Math.max(0, Math.min(1, (totalT - T) / 0.6)) : 0;
    mat.opacity = fade * 0.9 * active + 0.0;
    ring.current.rotation.z += 0.05;
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + fade * 0.6;

    if (phase === 'run' && !done.current && T > totalT + 0.05) {
      done.current = true;
      setPhase('done');
      onDone?.();
    }
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined as any, undefined as any, N]}>
        <boxGeometry args={[0.14, 0.05, 0.1]} />
        <meshStandardMaterial roughness={0.35} metalness={0.2} emissive={'#0b1220'} toneMapped={false} />
      </instancedMesh>
      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial size={0.06} color={'#9ff7ea'} map={dotTexture()} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
      </points>
      <mesh ref={ring} position={[0, -2.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.05, 2.18, 96]} />
        <meshBasicMaterial color={'#2ee6c8'} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <gridHelper args={[14, 28, '#1b2a45', '#101a2e']} position={[0, -2.15, 0]} />
      {phase === 'done' && (
        <>
          <Html position={[-2.9, -0.9, 0]} center>
            <div className="whitespace-nowrap rounded-lg border border-safe/40 bg-ink-950/80 px-3 py-1.5 text-center font-mono text-[11px] text-safe backdrop-blur">
              TRAIN · {trainN?.toLocaleString() ?? `${Math.round((1 - testSize) * 100)}%`}
            </div>
          </Html>
          <Html position={[2.9, -1.2, 0]} center>
            <div className="whitespace-nowrap rounded-lg border border-volt/40 bg-ink-950/80 px-3 py-1.5 text-center font-mono text-[11px] text-volt backdrop-blur">
              TEST · {testN?.toLocaleString() ?? `${Math.round(testSize * 100)}%`}
            </div>
          </Html>
        </>
      )}
      {phase === 'idle' && (
        <Html position={[-1, -1.2, 0]} center>
          <div className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">raw rows · unscaled · text categories</div>
        </Html>
      )}
    </group>
  );
}

function mulberry(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
