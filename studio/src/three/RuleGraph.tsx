import { Html, Line, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type Rule = { antecedent: string[]; consequent: string[]; support: number; confidence: number; lift: number };

const groupColor = (item: string) => {
  if (item.startsWith('Default=Yes')) return '#ff4d6d';
  if (item.startsWith('Default=No')) return '#2ee6c8';
  if (item.startsWith('Income')) return '#4cc3ff';
  if (item.startsWith('LoanAmount')) return '#ffb547';
  if (item.startsWith('CreditScore')) return '#8b7dff';
  if (item.startsWith('DTIRatio')) return '#ff7ad9';
  if (item.startsWith('InterestRate')) return '#a3e635';
  if (item.startsWith('Employment')) return '#38bdf8';
  return '#94a3b8';
};

function Graph({ rules, itemSupport, focus, setFocus }: { rules: Rule[]; itemSupport: Record<string, number>; focus: number | null; setFocus: (i: number | null) => void }) {
  const group = useRef<THREE.Group>(null!);
  const pulses = useRef<THREE.InstancedMesh>(null!);
  const tmp = useMemo(() => new THREE.Object3D(), []);

  const { nodes, edges } = useMemo(() => {
    const top = rules.slice(0, 24);
    const items = new Set<string>();
    top.forEach((r) => [...r.antecedent, ...r.consequent].forEach((i) => items.add(i)));
    const cons = top.flatMap((r) => r.consequent);
    const center = new Set<string>(cons.includes('Default=Yes') ? ['Default=Yes'] : cons.slice(0, 1));
    const outer = [...items].filter((i) => !center.has(i));
    const pos = new Map<string, THREE.Vector3>();
    [...center].forEach((c, i) => pos.set(c, new THREE.Vector3((i - (center.size - 1) / 2) * 1.4, 0, 0)));
    const g = Math.PI * (3 - Math.sqrt(5));
    outer.forEach((it, i) => {
      const y = 1 - (i / Math.max(1, outer.length - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      pos.set(it, new THREE.Vector3(Math.cos(g * i) * r * 4.6, y * 2.4, Math.sin(g * i) * r * 4.6));
    });
    const nodes = [...pos.entries()].map(([id, p]) => ({ id, p, s: itemSupport[id] ?? 0.05, hub: center.has(id) }));
    const maxLift = Math.max(...top.map((r) => r.lift));
    const edges: { a: THREE.Vector3; b: THREE.Vector3; w: number; rule: number; color: string }[] = [];
    top.forEach((r, ri) => r.antecedent.forEach((a) => r.consequent.forEach((c) => {
      edges.push({ a: pos.get(a)!, b: pos.get(c)!, w: r.lift / maxLift, rule: ri, color: groupColor(a) });
    })));
    return { nodes, edges };
  }, [rules, itemSupport]);

  useFrame((s, dt) => {
    group.current.rotation.y += dt * 0.08;
    edges.forEach((e, i) => {
      const t = (s.clock.elapsedTime * (0.25 + e.w * 0.35) + i * 0.137) % 1;
      tmp.position.copy(e.a).lerp(e.b, t);
      const on = focus === null || focus === e.rule;
      tmp.scale.setScalar(on ? 0.6 + e.w * 0.8 : 0.001);
      tmp.updateMatrix();
      pulses.current.setMatrixAt(i, tmp.matrix);
    });
    pulses.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      {edges.map((e, i) => {
        const on = focus === null || focus === e.rule;
        return <Line key={i} points={[e.a, e.b]} color={e.color} lineWidth={on ? 0.6 + e.w * 3 : 0.4} transparent opacity={on ? 0.25 + e.w * 0.55 : 0.05} />;
      })}
      <instancedMesh ref={pulses} args={[undefined as any, undefined as any, Math.max(1, edges.length)]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      {nodes.map((n) => (
        <group key={n.id} position={n.p}>
          <mesh onPointerOver={() => { const idx = rules.findIndex((r) => r.antecedent.includes(n.id)); if (idx >= 0 && idx < 24) setFocus(idx); }} onPointerOut={() => setFocus(null)}>
            <sphereGeometry args={[n.hub ? 0.45 : 0.1 + Math.sqrt(n.s) * 0.32, 24, 24]} />
            <meshStandardMaterial color={groupColor(n.id)} emissive={groupColor(n.id)} emissiveIntensity={n.hub ? 1.2 : 0.5} toneMapped={false} />
          </mesh>
          <Html center style={{ pointerEvents: 'none' }}>
            <div className={`-translate-y-6 whitespace-nowrap rounded px-1.5 py-0.5 font-mono ${n.hub ? 'bg-risk/20 text-[12px] font-bold text-risk' : 'bg-ink-950/70 text-[10px] text-slate-300'}`}>{n.id}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

export default function RuleGraph(props: { rules: Rule[]; itemSupport: Record<string, number>; focus: number | null; setFocus: (i: number | null) => void }) {
  return (
    <Canvas camera={{ position: [0, 3, 9.5], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={20} color="#ff4d6d" />
      <Graph {...props} />
      <OrbitControls enablePan={false} minDistance={4} maxDistance={18} />
    </Canvas>
  );
}

export { groupColor };
export function useFocus() { return useState<number | null>(null); }
