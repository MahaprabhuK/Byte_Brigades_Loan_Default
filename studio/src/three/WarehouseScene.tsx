import { Billboard, Edges, Html, RoundedBox, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { MotionValue } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { COL, FONT, easeInOut } from './common';

export type TableInfo = { name: string; rows: number; kind: string };

const DIMS = [
  { name: 'Dim_Borrower', pos: [-4.2, 0, -2.6], color: '#4cc3ff' },
  { name: 'Dim_Loan_Purpose', pos: [4.2, 0, -2.6], color: '#ffb547' },
  { name: 'Dim_Credit_Profile', pos: [-4.2, 0, 2.6], color: '#8b7dff' },
  { name: 'Dim_Risk_Tier', pos: [4.2, 0, 2.6], color: '#ff4d6d' },
] as const;

const W = 12, D = 9, H = 3.6;

function Shelf({ name, color, rows, selected, onSelect, reveal }: any) {
  const ref = useRef<THREE.Group>(null!);
  const [hover, setHover] = useState(false);
  const boxes = useMemo(() => {
    const n = Math.max(3, Math.min(24, Math.round(Math.log10(rows + 1) * 5)));
    return Array.from({ length: n }, (_, i) => [((i % 4) - 1.5) * 0.48, 0.32 + Math.floor(i / 4) * 0.42, 0] as [number, number, number]);
  }, [rows]);
  useFrame((s) => {
    const k = selected ? 1.12 : hover ? 1.06 : 1;
    ref.current.scale.lerp(new THREE.Vector3(k, k * reveal, k), 0.12);
    ref.current.position.y = selected ? Math.sin(s.clock.elapsedTime * 2) * 0.05 + 0.08 : 0;
  });
  return (
    <group ref={ref}
      onClick={(e) => { e.stopPropagation(); onSelect(name); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}>
      {/* shelf frame */}
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 1.35, 0]}>
          <boxGeometry args={[0.07, 2.7, 0.7]} />
          <meshStandardMaterial color="#1e2b45" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {[0.1, 0.52, 0.94, 1.36, 1.78, 2.2, 2.62].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[2.2, 0.04, 0.7]} />
          <meshStandardMaterial color="#26375a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {boxes.map((p, i) => (
        <RoundedBox key={i} args={[0.4, 0.3, 0.5]} radius={0.03} position={p}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected || hover ? 0.7 : 0.25} roughness={0.5} />
        </RoundedBox>
      ))}
      <Billboard position={[0, 3.25, 0]}>
        <Text font={FONT} position={[0, 0.12, 0]} fontSize={0.3} color={color} anchorX="center" outlineWidth={0.012} outlineColor="#04060c">
          {name}
        </Text>
        <Text font={FONT} position={[0, -0.18, 0]} fontSize={0.19} color="#cbd5e1" anchorX="center" outlineWidth={0.01} outlineColor="#04060c">
          {rows.toLocaleString()} rows
        </Text>
      </Billboard>
    </group>
  );
}

function Conveyor({ from, color, reveal }: { from: number[]; color: string; reveal: number }) {
  const dots = useRef<THREE.InstancedMesh>(null!);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const a = new THREE.Vector3(from[0] * 0.72, 0.12, from[2] * 0.72);
  const b = new THREE.Vector3(from[0] * 0.25, 0.12, from[2] * 0.3);
  const len = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const ang = Math.atan2(b.x - a.x, b.z - a.z);
  useFrame((s) => {
    for (let i = 0; i < 6; i++) {
      const t = (s.clock.elapsedTime * 0.35 + i / 6) % 1;
      tmp.position.copy(a).lerp(b, t);
      tmp.position.y = 0.22;
      tmp.scale.setScalar(reveal);
      tmp.updateMatrix();
      dots.current.setMatrixAt(i, tmp.matrix);
    }
    dots.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh position={mid} rotation={[0, ang, 0]}>
        <boxGeometry args={[0.35, 0.08, len]} />
        <meshStandardMaterial color="#121c30" emissive={color} emissiveIntensity={0.15 * reveal} />
      </mesh>
      <instancedMesh ref={dots} args={[undefined as any, undefined as any, 6]}>
        <boxGeometry args={[0.16, 0.12, 0.16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

export default function WarehouseScene({ progress, tables, selected, onSelect }: {
  progress: MotionValue<number>; tables: TableInfo[]; selected: string | null; onSelect: (n: string | null) => void;
}) {
  const { camera } = useThree();
  const building = useRef<THREE.Group>(null!);
  const roof = useRef<THREE.Group>(null!);
  const walls = useRef<THREE.MeshStandardMaterial[]>([]);
  const world = useRef<THREE.Group>(null!);
  const [reveal, setReveal] = useState(0);
  const rows = (n: string) => tables.find((t) => t.name === n)?.rows ?? 0;

  useFrame((_, dt) => {
    const p = progress.get();
    // 0 → .4 : exterior orbit; .4 → .62 : fly in + roof lift; .62 → 1 : interior
    const orbit = Math.min(1, p / 0.4);
    const fly = easeInOut(Math.min(1, Math.max(0, (p - 0.4) / 0.22)));
    const inside = Math.min(1, Math.max(0, (p - 0.6) / 0.15));
    world.current.rotation.y = orbit * Math.PI * 1.25 + fly * 0.0 + (p > 0.62 ? (p - 0.62) * 1.4 : 0);
    const radius = 22 - fly * 9;
    const height = 8 + fly * 6;
    camera.position.lerp(new THREE.Vector3(0, height, radius), 0.15);
    camera.lookAt(0, fly * -0.5 + 0.8, 0);
    roof.current.position.y = H + fly * 9;
    roof.current.rotation.z = fly * 0.4;
    walls.current.forEach((m) => { if (m) m.opacity = 1 - fly * 0.88; });
    const r = Math.round(inside * 100) / 100;
    if (r !== reveal) setReveal(r);
    if (selected === null && p < 0.55) building.current.rotation.y += dt * 0.0;
  });

  const wallMat = (i: number) => (
    <>
      <meshStandardMaterial ref={(m) => { if (m) walls.current[i] = m; }} color="#1b2b4a" emissive="#0b1730" metalness={0.35} roughness={0.55} transparent />
      <Edges color="#2ee6c8" threshold={15} />
    </>
  );

  return (
    <group ref={world}>
      <group ref={building}>
        {/* floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onClick={() => onSelect(null)}>
          <planeGeometry args={[W + 6, D + 6]} />
          <meshStandardMaterial color="#070d19" metalness={0.3} roughness={0.8} />
        </mesh>
        <gridHelper args={[W, 24, '#1b2a45', '#0e1830']} position={[0, 0.01, 0]} />
        {/* walls */}
        <mesh position={[0, H / 2, -D / 2]}><boxGeometry args={[W, H, 0.15]} />{wallMat(0)}</mesh>
        <mesh position={[-W / 2, H / 2, 0]}><boxGeometry args={[0.15, H, D]} />{wallMat(1)}</mesh>
        <mesh position={[W / 2, H / 2, 0]}><boxGeometry args={[0.15, H, D]} />{wallMat(2)}</mesh>
        {/* front wall with door */}
        <mesh position={[-3.6, H / 2, D / 2]}><boxGeometry args={[4.8, H, 0.15]} />{wallMat(3)}</mesh>
        <mesh position={[3.6, H / 2, D / 2]}><boxGeometry args={[4.8, H, 0.15]} />{wallMat(4)}</mesh>
        <mesh position={[0, H - 0.5, D / 2]}><boxGeometry args={[2.4, 1, 0.15]} />{wallMat(5)}</mesh>
        {/* light strips on walls */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (W / 2 + 0.09), H - 0.3, 0]}>
            <boxGeometry args={[0.03, 0.06, D]} />
            <meshBasicMaterial color={COL.safe} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, H - 0.3, -D / 2 - 0.09]}>
          <boxGeometry args={[W, 0.06, 0.03]} />
          <meshBasicMaterial color={COL.safe} toneMapped={false} />
        </mesh>
        <Text font={FONT} position={[0, H + 0.0, D / 2 + 0.12]} fontSize={0.42} color="#2ee6c8" anchorX="center" anchorY="bottom">
          LOAN_DW.DB
        </Text>
        {/* roof */}
        <group ref={roof} position={[0, H, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * W / 4, 0.9, 0]} rotation={[0, 0, -s * 0.29]}>
              <boxGeometry args={[W / 2 + 0.3, 0.12, D + 0.4]} />
              <meshStandardMaterial color="#22345a" emissive="#0d1a33" metalness={0.5} roughness={0.45} />
              <Edges color="#4cc3ff" threshold={15} />
            </mesh>
          ))}
        </group>

        {/* interior: fact table loading dock */}
        <group scale={[1, Math.max(0.001, reveal), 1]} visible={reveal > 0.03}>
          <group onClick={(e) => { e.stopPropagation(); onSelect('Fact_Loan_Performance'); }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
            <RoundedBox args={[2.6, 0.5, 2.0]} radius={0.08} position={[0, 0.25, 0]}>
              <meshStandardMaterial color="#0f2a2a" emissive="#2ee6c8" emissiveIntensity={selected === 'Fact_Loan_Performance' ? 0.9 : 0.35} />
            </RoundedBox>
            {Array.from({ length: 12 }).map((_, i) => (
              <RoundedBox key={i} args={[0.5, 0.36, 0.5]} radius={0.04} position={[((i % 4) - 1.5) * 0.6, 0.7 + Math.floor(i / 8) * 0.4, (Math.floor(i / 4) % 2 - 0.5) * 0.6]}>
                <meshStandardMaterial color="#2ee6c8" emissive="#2ee6c8" emissiveIntensity={0.4} />
              </RoundedBox>
            ))}
          </group>
          <Billboard position={[0, 2.35, 0]}>
            <Text font={FONT} position={[0, 0.15, 0]} fontSize={0.36} color="#ffffff" anchorX="center" outlineWidth={0.014} outlineColor="#04060c">
              Fact_Loan_Performance
            </Text>
            <Text font={FONT} position={[0, -0.2, 0]} fontSize={0.2} color="#2ee6c8" anchorX="center" outlineWidth={0.01} outlineColor="#04060c">
              {rows('Fact_Loan_Performance').toLocaleString()} rows · 9 measures + 4 FKs
            </Text>
          </Billboard>
        </group>
        {DIMS.map((d) => (
          <group key={d.name} visible={reveal > 0.03}>
            <group position={d.pos as any} rotation={[0, d.pos[0] < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              <Shelf name={d.name} color={d.color} rows={rows(d.name)} selected={selected === d.name} onSelect={onSelect} reveal={Math.max(0.001, reveal)} />
            </group>
            <Conveyor from={d.pos as any} color={d.color} reveal={reveal} />
          </group>
        ))}
        {reveal > 0.9 && !selected && (
          <Html position={[0, 0.2, 3.6]} center>
            <div className="whitespace-nowrap rounded-full border border-white/10 bg-ink-950/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
              click a shelf or the dock
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
