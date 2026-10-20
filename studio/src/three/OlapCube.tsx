import { Billboard, Html, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FONT, riskColor3 } from './common';

export type Cell = { x: string; y: string; z: string; v: number; n: number };
type Props = {
  cells: Cell[];
  levels: string[][];
  axisLabels: string[];
  min: number;
  max: number;
  highlight?: (c: Cell) => boolean; // slice / dice
  mode: 'normal' | 'slice' | 'dice';
  sliceAxis?: number;
  transition: { kind: 'none' | 'rollup' | 'drill' | 'pivot'; axis: number; id: number };
  measureLabel: string;
  fast: boolean;
};

const GAP = 1.08;
const SIZE = 0.86;

function CellBox({ c, pos, color, ghost, lift, born, fast, onHover, hovered, collapseTo }: any) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshStandardMaterial>(null!);
  const edge = useRef<THREE.LineSegments>(null!);
  const start = useRef(born);
  const targetPos = useMemo(() => new THREE.Vector3(...pos).add(new THREE.Vector3(0, lift, 0)), [pos, lift]);
  const col = useMemo(() => new THREE.Color(color), [color]);
  useEffect(() => {
    if (ref.current && start.current) {
      ref.current.scale.setScalar(0.001);
      if (collapseTo) ref.current.position.set(...(collapseTo as [number, number, number]));
    }
  }, []);
  useFrame((_, dt) => {
    const k = Math.min(1, dt * (fast ? 18 : 6));
    ref.current.position.lerp(targetPos, k);
    const s = (ghost ? 0.55 : hovered ? 1.08 : 1) * SIZE;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), k);
    mat.current.color.lerp(col, k);
    mat.current.emissive.lerp(col, k);
    mat.current.opacity += ((ghost ? 0.08 : 0.92) - mat.current.opacity) * k;
    mat.current.emissiveIntensity += ((ghost ? 0 : hovered ? 0.9 : lift > 0 ? 0.6 : 0.28) - mat.current.emissiveIntensity) * k;
    edge.current.position.copy(ref.current.position);
    edge.current.scale.copy(ref.current.scale);
  });
  return (
    <>
      <mesh ref={ref} position={pos}
        onPointerOver={(e) => { e.stopPropagation(); onHover(c); }}
        onPointerOut={() => onHover(null)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial ref={mat} transparent opacity={0.92} roughness={0.35} metalness={0.1} toneMapped={false} />
      </mesh>
      <lineSegments ref={edge} position={pos}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.001, 1.001, 1.001)]} />
        <lineBasicMaterial color={ghost ? '#22304f' : '#e2e8f0'} transparent opacity={ghost ? 0.5 : 0.18} />
      </lineSegments>
    </>
  );
}

export default function OlapCube({ cells, levels, axisLabels, min, max, highlight, mode, sliceAxis = 2, transition, measureLabel, fast }: Props) {
  const group = useRef<THREE.Group>(null!);
  const [hover, setHover] = useState<Cell | null>(null);
  const born = useRef(false);
  useEffect(() => { const t = setTimeout(() => (born.current = true), 50); return () => clearTimeout(t); }, []);

  const [nx, ny, nz] = levels.map((l) => Math.max(1, l.length));
  const posOf = (c: Cell): [number, number, number] => {
    const ix = levels[0].indexOf(c.x), iy = levels[1].indexOf(c.y), iz = levels[2].indexOf(c.z);
    return [(ix - (nx - 1) / 2) * GAP, (iy - (ny - 1) / 2) * GAP, (iz - (nz - 1) / 2) * GAP];
  };

  // pivot spin
  const spin = useRef({ id: -1, t: 1, axis: 0 });
  useEffect(() => {
    if (transition.kind === 'pivot') spin.current = { id: transition.id, t: 0, axis: transition.axis };
  }, [transition.id]);
  useFrame((_, dt) => {
    const s = spin.current;
    if (s.t < 1) {
      s.t = Math.min(1, s.t + dt * (fast ? 4 : 1.1));
      const e = 1 - Math.pow(1 - s.t, 3);
      const ang = (1 - e) * Math.PI / 2;
      group.current.rotation.set(s.axis === 2 ? ang : 0, s.axis === 1 ? ang : 0, s.axis === 0 ? ang : 0);
    }
  });

  const range = max - min || 1;
  const collapseFor = (p: [number, number, number]): [number, number, number] | null => {
    if (transition.kind === 'rollup' || transition.kind === 'drill') {
      const q = [...p] as [number, number, number];
      const a = transition.axis === 0 ? 0 : transition.axis === 1 ? 1 : 2;
      q[a] = 0;
      return q;
    }
    return null;
  };

  const ext = [nx * GAP / 2 + 0.4, ny * GAP / 2 + 0.4, nz * GAP / 2 + 0.4];

  return (
    <group ref={group}>
      {cells.map((c) => {
        const p = posOf(c);
        const hl = highlight ? highlight(c) : true;
        const ghost = (mode === 'slice' || mode === 'dice') && !hl;
        const lift = 0;
        const pp: [number, number, number] = [...p];
        if (hl && mode === 'slice') pp[sliceAxis] += 1.3;
        if (hl && mode === 'dice') { pp[0] += 0.9; pp[1] += 0.9; pp[2] += 0.9; }
        const key = `${transition.id}|${c.x}|${c.y}|${c.z}`;
        return (
          <CellBox key={key} c={c} pos={pp} lift={lift} ghost={ghost} fast={fast}
            color={'#' + riskColor3((c.v - min) / range).getHexString()}
            born={born.current} collapseTo={collapseFor(p)} hovered={hover === c} onHover={setHover} />
        );
      })}

      {/* axis labels */}
      {levels[0].length > 1 && levels[0].map((l, i) => (
        <Billboard key={'x' + l} position={[(i - (nx - 1) / 2) * GAP, -ext[1] - 0.35, ext[2] + 0.2]}>
          <Text font={FONT} fontSize={0.21} color="#a7f3e8" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#04060c">{short(l)}</Text>
        </Billboard>
      ))}
      {levels[1].length > 1 && levels[1].map((l, i) => (
        <Billboard key={'y' + l} position={[-ext[0] - 0.2, (i - (ny - 1) / 2) * GAP, ext[2]]}>
          <Text font={FONT} fontSize={0.21} color="#bae6fd" anchorX="right" anchorY="middle" outlineWidth={0.01} outlineColor="#04060c">{short(l)}</Text>
        </Billboard>
      ))}
      {levels[2].length > 1 && levels[2].map((l, i) => (
        <Billboard key={'z' + l} position={[ext[0] + 0.25, -ext[1] - 0.2, (i - (nz - 1) / 2) * GAP]}>
          <Text font={FONT} fontSize={0.21} color="#ddd6fe" anchorX="left" anchorY="middle" outlineWidth={0.01} outlineColor="#04060c">{short(l)}</Text>
        </Billboard>
      ))}
      {levels[0].length > 1 && <Billboard position={[0, -ext[1] - 1.25, ext[2] + 0.9]}><Text font={FONT} fontSize={0.27} color="#2ee6c8" anchorX="center" outlineWidth={0.012} outlineColor="#04060c">X · {axisLabels[0]}</Text></Billboard>}
      {levels[1].length > 1 && <Billboard position={[-ext[0] - 0.4, ext[1] + 0.6, ext[2]]}><Text font={FONT} fontSize={0.27} color="#4cc3ff" anchorX="center" outlineWidth={0.012} outlineColor="#04060c">Y · {axisLabels[1]}</Text></Billboard>}
      {levels[2].length > 1 && <Billboard position={[ext[0] + 1.2, -ext[1] - 1.0, 0]}><Text font={FONT} fontSize={0.27} color="#8b7dff" anchorX="center" outlineWidth={0.012} outlineColor="#04060c">Z · {axisLabels[2]}</Text></Billboard>}

      {hover && (
        <Html position={posOf(hover)} center style={{ pointerEvents: 'none' }}>
          <div className="-translate-y-14 whitespace-nowrap rounded-lg border border-white/15 bg-ink-950/95 px-3 py-2 font-mono text-[11px] text-slate-200 shadow-xl">
            <div className="text-slate-400">{[hover.x, hover.y, hover.z].filter((s) => s !== 'All').join(' · ') || 'All'}</div>
            <div className="mt-0.5 text-sm text-white">{measureLabel}: <b className="text-safe">{hover.v?.toLocaleString()}</b></div>
            <div className="text-slate-500">{hover.n.toLocaleString()} loans</div>
          </div>
        </Html>
      )}
    </group>
  );
}

const short = (s: string) => s.replace(' (<580)', '').replace(' (580-669)', '').replace(' (670-739)', '').replace(' (740-799)', '').replace(' (800+)', '').replace('Self-employed', 'Self-emp.');
