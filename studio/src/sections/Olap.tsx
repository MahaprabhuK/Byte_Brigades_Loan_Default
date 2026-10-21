import Orbit from '../three/Orbit';

import { Canvas } from '@react-three/fiber';
import { ArrowDownToLine, ArrowUpFromLine, Box, Code2, Layers, RefreshCcw, Scissors, Shuffle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Busy, Button, Chip, Insight, Lazy3D, Panel, Section, Select, Slider } from '../components/ui';
import { useApi, useDebounced } from '../lib/api';
import { riskColor, useFast } from '../lib/util';
import OlapCube, { Cell } from '../three/OlapCube';

type Op = 'explore' | 'rollup' | 'drill' | 'slice' | 'dice' | 'pivot';
const OPS: { v: Op; label: string; icon: any; desc: string }[] = [
  { v: 'explore', label: 'Explore', icon: Box, desc: 'Pick any three dimensions and a measure. Each cube cell is one GROUP BY bucket.' },
  { v: 'rollup', label: 'Roll-up', icon: ArrowUpFromLine, desc: 'Climb a concept hierarchy (5-yr band → age group) or collapse an axis to ALL. Cells merge into coarser aggregates.' },
  { v: 'drill', label: 'Drill-down', icon: ArrowDownToLine, desc: 'The reverse of roll-up: step down a hierarchy, or expand an ALL axis into a new dimension. Cells split into finer detail.' },
  { v: 'slice', label: 'Slice', icon: Scissors, desc: 'Fix one dimension to a single value. One layer of the cube lifts out and the rest fades.' },
  { v: 'dice', label: 'Dice', icon: Layers, desc: 'Select values on several dimensions at once (plus a credit-score cut). A sub-cube detaches.' },
  { v: 'pivot', label: 'Pivot', icon: Shuffle, desc: 'Rotate the cube by swapping two axes. Cell values stay identical and only the view changes.' },
];

const PRESETS: { name: string; op: Op; axes: string[]; slice?: [number, string]; dice?: Record<number, string[]>; credit?: number }[] = [
  { name: 'Roll-up · Age band → Age group', op: 'rollup', axes: ['AgeBand', 'Education', 'ALL'] },
  { name: 'Drill-down · Employment → Purpose', op: 'drill', axes: ['EmploymentType', 'ALL', 'ALL'] },
  { name: "Slice · LoanPurpose = 'Home'", op: 'slice', axes: ['AgeGroup', 'CreditScoreGroup', 'LoanPurpose'], slice: [2, 'Home'] },
  { name: 'Dice · Bach/Mast × Full-time × CS ≥ 650', op: 'dice', axes: ['Education', 'EmploymentType', 'LoanPurpose'], dice: { 0: ["Bachelor's", "Master's"], 1: ['Full-time'] }, credit: 650 },
  { name: 'Pivot · Education × Employment', op: 'pivot', axes: ['Education', 'EmploymentType', 'ALL'] },
];

export default function Olap() {
  const fast = useFast();
  const { data: meta } = useApi<any>('/api/olap/meta');
  const [axes, setAxes] = useState<string[]>(['Education', 'EmploymentType', 'LoanPurpose']);
  const [measure, setMeasure] = useState('default_rate');
  const [op, setOp] = useState<Op>('explore');
  const [opAxis, setOpAxis] = useState(0);
  const [drillTo, setDrillTo] = useState('LoanPurpose');
  const [slice, setSlice] = useState<[number, string]>([2, 'Home']);
  const [dice, setDice] = useState<Record<number, string[]>>({});
  const [credit, setCredit] = useState(300);
  const [transition, setTransition] = useState({ kind: 'none' as any, axis: 0, id: 0 });
  const prevCells = useRef<number | null>(null);
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  const creditD = useDebounced(credit, 300);

  const base = useApi<any>('/api/olap/cube', { axes, measure }, []);
  const filters = useMemo(() => {
    const f: Record<string, string[]> = {};
    if (op === 'slice' && axes[slice[0]] !== 'ALL') f[axes[slice[0]]] = [slice[1]];
    if (op === 'dice') Object.entries(dice).forEach(([i, v]) => { if (axes[+i] !== 'ALL' && v.length) f[axes[+i]] = [...v].sort(); });
    return f;
  }, [op, slice, dice, axes]);
  const filtered = useApi<any>(op === 'slice' || op === 'dice' ? '/api/olap/cube' : null,
    { axes, measure, filters, credit_min: op === 'dice' && creditD > 300 ? creditD : null }, []);

  const cube = base.data;
  const dims = meta?.dims ?? {};
  const hier = meta?.hierarchies ?? {};
  const dimOptions = [{ value: 'ALL', label: 'ALL (collapsed)' }, ...Object.entries(dims).map(([k, v]: any) => ({ value: k, label: v.label }))];

  const parentOf = (d: string) => { const h = dims[d]?.hierarchy; if (!h) return null; const arr = hier[h]; const i = arr.indexOf(d); return i < arr.length - 1 ? arr[i + 1] : null; };
  const childOf = (d: string) => { const h = dims[d]?.hierarchy; if (!h) return null; const arr = hier[h]; const i = arr.indexOf(d); return i > 0 ? arr[i - 1] : null; };

  const label = (d: string) => (d === 'ALL' ? 'ALL' : dims[d]?.label ?? d);

  const doRollup = () => {
    const d = axes[opAxis];
    if (d === 'ALL') return;
    const p = parentOf(d);
    const next = [...axes]; next[opAxis] = p ?? 'ALL';
    prevCells.current = cube?.cells.length ?? null;
    setLastMsg(`Rolled ${['X', 'Y', 'Z'][opAxis]} up from ${label(d)} to ${label(next[opAxis])}`);
    setAxes(next); setTransition({ kind: 'rollup', axis: opAxis, id: transition.id + 1 });
  };
  const doDrill = () => {
    const d = axes[opAxis];
    const c = d === 'ALL' ? drillTo : childOf(d);
    if (!c) return;
    const next = [...axes]; next[opAxis] = c;
    prevCells.current = cube?.cells.length ?? null;
    setLastMsg(`Drilled ${['X', 'Y', 'Z'][opAxis]} down from ${label(d)} to ${label(c)}`);
    setAxes(next); setTransition({ kind: 'drill', axis: opAxis, id: transition.id + 1 });
  };
  const doPivot = (a: number, b: number) => {
    const next = [...axes]; [next[a], next[b]] = [next[b], next[a]];
    prevCells.current = cube?.cells.length ?? null;
    setLastMsg(`Pivoted: swapped ${['X', 'Y', 'Z'][a]} and ${['X', 'Y', 'Z'][b]}`);
    setTransition({ kind: 'pivot', axis: a === 0 && b === 1 ? 0 : a === 1 ? 2 : 1, id: transition.id + 1 });
    setAxes(next);
  };
  const applyPreset = (p: typeof PRESETS[number]) => {
    setOp(p.op); setAxes(p.axes); setMeasure('default_rate'); setLastMsg(null);
    if (p.slice) setSlice(p.slice);
    if (p.dice) setDice(p.dice); else setDice({});
    setCredit(p.credit ?? 300);
    setOpAxis(0);
    setTransition({ kind: 'drill', axis: 1, id: transition.id + 1 });
  };

  // merge filtered values into the full cube for highlighting
  const fmap = useMemo(() => {
    const m = new Map<string, Cell>();
    filtered.data?.cells.forEach((c: Cell) => m.set(`${c.x}|${c.y}|${c.z}`, c));
    return m;
  }, [filtered.data]);
  const showCells: Cell[] = useMemo(() => {
    if (!cube) return [];
    if (op !== 'slice' && op !== 'dice') return cube.cells;
    return cube.cells.map((c: Cell) => fmap.get(`${c.x}|${c.y}|${c.z}`) ?? c);
  }, [cube, fmap, op]);
  const highlight = (op === 'slice' || op === 'dice') && filtered.data ? (c: Cell) => fmap.has(`${c.x}|${c.y}|${c.z}`) : undefined;
  const result = (op === 'slice' || op === 'dice') ? filtered.data : cube;
  const vals = showCells.map((c) => c.v).filter((v) => v != null);
  const vmin = vals.length ? Math.min(...vals) : 0, vmax = vals.length ? Math.max(...vals) : 1;

  const sorted = useMemo(() => [...(result?.cells ?? [])].sort((a: Cell, b: Cell) => (b.v ?? 0) - (a.v ?? 0)), [result]);
  const activeAxes = axes.map((a, i) => ({ a, i })).filter((x) => x.a !== 'ALL');

  const insights = useMemo(() => {
    if (!result || !sorted.length) return [];
    const hi = sorted[0], lo = sorted[sorted.length - 1];
    const name = (c: Cell) => [c.x, c.y, c.z].filter((s) => s !== 'All').join(' · ') || 'All loans';
    const out: any[] = [];
    const ml = result.measure_label;
    out.push(<>Highest {ml.toLowerCase()}: <b className="text-white">{name(hi)}</b> at <b className="text-risk">{hi.v}</b> ({hi.n.toLocaleString()} loans). Lowest: <b className="text-white">{name(lo)}</b> at <b className="text-safe">{lo.v}</b>.</>);
    if (measure === 'default_rate' && lo.v > 0) out.push(<>The riskiest cell defaults at {(hi.v / lo.v).toFixed(1)}× the rate of the safest. Portfolio baseline is 11.70%.</>);
    if ((op === 'rollup' || op === 'drill') && lastMsg && prevCells.current != null)
      out.push(<>{lastMsg}: the cube went from {prevCells.current} to {result.cells.length} cells. Every one of the {result.rows_covered.toLocaleString()} loans is still counted, only at a {op === 'rollup' ? 'coarser' : 'finer'} grain.</>);
    if (op === 'slice') out.push(<>The slice keeps {result.rows_covered.toLocaleString()} loans ({((result.rows_covered / 50000) * 100).toFixed(1)}% of the portfolio): one {label(axes[slice[0]])} layer of the cube.</>);
    if (op === 'dice') out.push(<>The sub-cube covers {result.rows_covered.toLocaleString()} loans ({((result.rows_covered / 50000) * 100).toFixed(1)}% of the portfolio) across {result.cells.length} cells.</>);
    if (op === 'pivot') out.push(<>Pivot check: {result.cells.length} cells and {result.rows_covered.toLocaleString()} loans, the same as before the swap. Only the orientation changed.</>);
    if (axes.includes('RiskCategory') && measure === 'default_rate') out.push(<span className="text-warn">Risk Tier's "Critical" bucket is defined by the default flag itself, so its 100% default rate is true by construction. That is not a finding.</span>);
    return out;
  }, [result, sorted, op, lastMsg, measure, axes, slice]);

  const opInfo = OPS.find((o) => o.v === op)!;
  const currentLevels = (i: number) => cube?.levels?.[i] ?? [];

  return (
    <Section
      id="olap"
      index="03"
      kicker="OLAP operations"
      title={<>The cube, <span className="text-gradient">literally</span></>}
      lead="Every operation below runs as real SQL against loan_dw.db. Drag to orbit, hover a cell to read it, and use the panel to roll up, drill down, slice, dice or pivot."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.name} onClick={() => applyPreset(p)} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-safe/40 hover:text-white">
            {p.name}
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Panel title="Cube controls" className="self-start xl:sticky xl:top-20">
          <div className="grid grid-cols-3 gap-1.5">
            {OPS.map((o) => (
              <button key={o.v} onClick={() => { setOp(o.v); setLastMsg(null); }}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] transition ${op === o.v ? 'border-safe/60 bg-safe/10 text-safe' : 'border-white/5 bg-white/[0.02] text-slate-400 hover:text-white'}`}>
                <o.icon size={16} /> {o.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">{opInfo.desc}</p>

          <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
            {['X axis', 'Y axis', 'Z axis'].map((l, i) => (
              <Select key={l} label={l} value={axes[i]} options={dimOptions}
                onChange={(v) => { const n = [...axes]; n[i] = v; setAxes(n); setTransition({ kind: 'drill', axis: i, id: transition.id + 1 }); }} />
            ))}
            <Select label="Measure (cell colour)" value={measure} onChange={setMeasure}
              options={Object.entries(meta?.measures ?? {}).map(([k, v]: any) => ({ value: k, label: v }))} />
          </div>

          <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
            {(op === 'rollup' || op === 'drill') && (
              <>
                <Select label="Apply to axis" value={String(opAxis)} onChange={(v) => setOpAxis(+v)}
                  options={axes.map((a, i) => ({ value: String(i), label: `${['X', 'Y', 'Z'][i]} · ${label(a)}` }))} />
                {op === 'drill' && axes[opAxis] === 'ALL' && (
                  <Select label="Expand ALL into" value={drillTo} onChange={setDrillTo} options={dimOptions.filter((d) => d.value !== 'ALL')} />
                )}
                <div className="text-[11px] text-slate-500">
                  {op === 'rollup'
                    ? axes[opAxis] === 'ALL' ? 'Already at the top (ALL).' : `${label(axes[opAxis])} → ${parentOf(axes[opAxis]) ? label(parentOf(axes[opAxis])!) : 'ALL'}`
                    : axes[opAxis] === 'ALL' ? `ALL → ${label(drillTo)}` : childOf(axes[opAxis]) ? `${label(axes[opAxis])} → ${label(childOf(axes[opAxis])!)}` : 'Lowest level of this hierarchy reached.'}
                </div>
                <Button className="w-full" onClick={op === 'rollup' ? doRollup : doDrill}
                  disabled={op === 'rollup' ? axes[opAxis] === 'ALL' : axes[opAxis] !== 'ALL' && !childOf(axes[opAxis])}>
                  {op === 'rollup' ? <ArrowUpFromLine size={15} /> : <ArrowDownToLine size={15} />} {op === 'rollup' ? 'Roll up' : 'Drill down'}
                </Button>
              </>
            )}
            {op === 'slice' && (
              <>
                <Select label="Slice along" value={String(slice[0])}
                  onChange={(v) => setSlice([+v, currentLevels(+v)[0] ?? ''])}
                  options={axes.map((a, i) => ({ value: String(i), label: `${['X', 'Y', 'Z'][i]} · ${label(a)}` })).filter((o) => axes[+o.value] !== 'ALL')} />
                <Select label="Fix value" value={slice[1]} onChange={(v) => setSlice([slice[0], v])} options={currentLevels(slice[0])} />
              </>
            )}
            {op === 'dice' && (
              <>
                {activeAxes.map(({ a, i }) => (
                  <div key={i}>
                    <div className="mb-1.5 text-xs text-slate-300">{['X', 'Y', 'Z'][i]} · {label(a)}</div>
                    <div className="flex flex-wrap gap-1">
                      {currentLevels(i).map((l: string) => {
                        const on = (dice[i] ?? []).includes(l);
                        return (
                          <button key={l} onClick={() => setDice({ ...dice, [i]: on ? (dice[i] ?? []).filter((x) => x !== l) : [...(dice[i] ?? []), l] })}
                            className={`rounded-md border px-2 py-0.5 font-mono text-[10px] transition ${on ? 'border-volt/60 bg-volt/15 text-volt' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Slider label="Credit score ≥" value={credit} min={300} max={800} step={10} onChange={setCredit} format={(v) => (v <= 300 ? 'any' : String(v))} />
              </>
            )}
            {op === 'pivot' && (
              <div className="grid gap-2">
                <Button variant="ghost" onClick={() => doPivot(0, 1)}><RefreshCcw size={14} /> Swap X ↔ Y</Button>
                <Button variant="ghost" onClick={() => doPivot(1, 2)}><RefreshCcw size={14} /> Swap Y ↔ Z</Button>
                <Button variant="ghost" onClick={() => doPivot(0, 2)}><RefreshCcw size={14} /> Swap X ↔ Z</Button>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel pad={false} className="relative">
            <Lazy3D height={typeof window !== 'undefined' && window.innerWidth < 640 ? 440 : 560}>
              <Canvas camera={{ position: [8.5, 6.5, 11.5], fov: typeof window !== 'undefined' && window.innerWidth < 640 ? 54 : 42 }} dpr={[1, 2]}>
                <ambientLight intensity={0.7} />
                <pointLight position={[8, 10, 8]} intensity={80} />
                <pointLight position={[-8, -4, -6]} intensity={40} color="#8b7dff" />
                {cube && (
                  <OlapCube cells={showCells} levels={cube.levels} axisLabels={cube.axis_labels} min={vmin} max={vmax}
                    highlight={highlight} mode={op === 'slice' ? 'slice' : op === 'dice' ? 'dice' : 'normal'} sliceAxis={slice[0]}
                    transition={transition} measureLabel={cube.measure_label} fast={fast} />
                )}
                <Orbit autoRotate autoRotateSpeed={0.45} enablePan={false} minDistance={5} maxDistance={26} />
              </Canvas>
            </Lazy3D>
            <Busy show={base.loading || filtered.loading} label="Running SQL on loan_dw.db" />
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
              <Chip tone="safe">{cube?.cells.length ?? 0} cells</Chip>
              <Chip>{(result?.rows_covered ?? 0).toLocaleString()} loans</Chip>
              <Chip>{result?.ms ?? 0} ms</Chip>
            </div>
            <div className="pointer-events-none absolute right-4 top-14 flex w-[min(320px,calc(100%-2rem))] items-center gap-3 sm:top-4">
              <span className="font-mono text-[10px] text-slate-500">{cube?.measure_label}</span>
              <span className="font-mono text-[10px] text-safe">{vmin}</span>
              <div className="h-1.5 flex-1 max-w-[260px] rounded-full" style={{ background: `linear-gradient(90deg, ${riskColor(0)}, ${riskColor(0.33)}, ${riskColor(0.66)}, ${riskColor(1)})` }} />
              <span className="font-mono text-[10px] text-risk">{vmax}</span>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Result set" right={<Chip>{sorted.length} rows</Chip>} pad={false}>
              <div className="max-h-[300px] overflow-auto">
                <table className="data w-full">
                  <thead>
                    <tr>
                      {activeAxes.map(({ a }) => <th key={a}>{label(a)}</th>)}
                      <th>Loans</th>
                      <th>{result?.measure_label}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.slice(0, 60).map((c: Cell, i: number) => (
                      <tr key={i}>
                        {activeAxes.map(({ i: k }) => <td key={k} className="text-slate-300">{[c.x, c.y, c.z][k]}</td>)}
                        <td className="text-slate-400">{c.n.toLocaleString()}</td>
                        <td style={{ color: riskColor((c.v - vmin) / ((vmax - vmin) || 1)) }}>{c.v?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title={<span className="flex items-center gap-2"><Code2 size={13} /> Generated SQL</span>}>
              <pre className="max-h-[268px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-safe/90">{result?.sql}</pre>
            </Panel>
          </div>
          <Insight items={insights} />
        </div>
      </div>
    </Section>
  );
}
