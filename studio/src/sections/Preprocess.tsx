import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Play, RotateCcw, Wind } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Busy, Button, Chip, Insight, Lazy3D, Panel, Section, Segmented, Select, Slider, Stat } from '../components/ui';
import { api, useApi } from '../lib/api';
import { fmt, riskColor, useFast } from '../lib/util';
import Tornado from '../three/Tornado';

const NUM = ['Age', 'Income', 'LoanAmount', 'CreditScore', 'MonthsEmployed', 'NumCreditLines', 'InterestRate', 'LoanTerm', 'DTIRatio'];

export default function Preprocess() {
  const fast = useFast();
  const { data: samples } = useApi<any>('/api/samples?n=8');
  const [scaler, setScaler] = useState<'standard' | 'minmax' | 'robust'>('standard');
  const [testSize, setTestSize] = useState(0.2);
  const [focus, setFocus] = useState('Income');
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [animDone, setAnimDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setAnimDone(false);
    setResult(null);
    setRunId((r) => r + 1);
    setLoading(true);
    try {
      setResult(await api('/api/preprocess', { scaler, test_size: testSize, focus }));
    } finally {
      setLoading(false);
    }
  };
  const refocus = async (f: string) => {
    setFocus(f);
    if (result) setResult(await api('/api/preprocess', { scaler, test_size: testSize, focus: f }));
  };
  const show = result && animDone;

  return (
    <Section
      id="data"
      index="01"
      kicker="Data & preprocessing"
      title={<>From messy rows to <span className="text-safe">model-ready</span> features</>}
      lead="Raw borrower records go in: unscaled numbers and text categories. Hit run and the pipeline checks quality, does a stratified split, scales numbers and one-hot encodes categories. Fitting happens on the training split only, so nothing leaks from the test set."
    >
      {/* raw sample table */}
      <Panel title={<>Raw sample · data/raw/Loan_default.csv</>} right={<Chip>{samples ? `${samples.rows.length} of 50,000 rows` : '…'}</Chip>} pad={false}>
        <div className="max-h-[260px] overflow-auto">
          <table className="data w-full">
            <thead>
              <tr>{samples?.columns.map((c: string) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {samples?.rows.map((r: any, i: number) => (
                <motion.tr key={r.LoanID} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  {samples.columns.map((c: string) => (
                    <td key={c} className={c === 'Default' ? (r[c] ? 'text-risk' : 'text-safe') : typeof r[c] === 'string' ? 'text-warn/90' : 'text-slate-300'}>
                      {typeof r[c] === 'number' && c !== 'Default' ? r[c].toLocaleString() : String(r[c])}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel title="Pipeline settings">
          <div className="space-y-5">
            <div>
              <div className="mb-1.5 text-xs text-slate-300">Scaler (numeric columns)</div>
              <Segmented value={scaler} onChange={setScaler} size="sm"
                options={[{ value: 'standard', label: 'Z-score' }, { value: 'minmax', label: 'Min-Max' }, { value: 'robust', label: 'Robust' }]} />
              <div className="mt-1.5 text-[11px] leading-snug text-slate-500">
                {scaler === 'standard' && 'z = (x − μ) / σ  → mean 0, std 1 (project default)'}
                {scaler === 'minmax' && 'x′ = (x − min) / (max − min)  → range [0, 1]'}
                {scaler === 'robust' && 'x′ = (x − median) / IQR  → resistant to outliers'}
              </div>
            </div>
            <Slider label="Test split" value={testSize} min={0.1} max={0.4} step={0.05} onChange={setTestSize} format={(v) => `${Math.round((1 - v) * 100)} / ${Math.round(v * 100)}`} hint="Stratified on Default, random_state = 42" />
            <Select label="Feature to inspect" value={focus} onChange={refocus} options={NUM} />
            <Button onClick={run} className="w-full" disabled={loading && !animDone}>
              {runId ? <RotateCcw size={16} /> : <Play size={16} />} {runId ? 'Run again' : 'Run preprocessing'}
            </Button>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Wind size={12} /> Red cards are defaulters. Watch them split evenly between the two piles.
            </div>
          </div>
        </Panel>

        <Panel pad={false} className="min-h-[440px]">
          <Lazy3D height={440}>
            <Canvas camera={{ position: [0, 1.6, 8.5], fov: 45 }} dpr={[1, 2]}>
              <ambientLight intensity={0.6} />
              <pointLight position={[0, 4, 4]} intensity={40} color="#9ff7ea" />
              <pointLight position={[-5, 2, -3]} intensity={25} color="#8b7dff" />
              <Tornado runId={runId} testSize={testSize} defaultRate={0.117} fast={fast} onDone={() => setAnimDone(true)}
                trainN={result?.split.train} testN={result?.split.test} />
              <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.1} />
            </Canvas>
          </Lazy3D>
          <Busy show={runId > 0 && !animDone} label="Cleaning · splitting · scaling · encoding" />
        </Panel>
      </div>

      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  t: '1 · Quality check', body: (
                    <div className="grid grid-cols-2 gap-2">
                      <Stat label="Missing" value={result.quality.missing} tone="safe" />
                      <Stat label="Duplicates" value={result.quality.duplicates} tone="safe" />
                    </div>
                  ), note: `${fmt.int(result.quality.rows)} rows scanned across 18 columns.`,
                },
                {
                  t: '2 · Stratified split', body: (
                    <div className="space-y-2">
                      <SplitBar label="Train" n={result.split.train} rate={result.split.train_default_rate} total={result.quality.rows} color="#2ee6c8" />
                      <SplitBar label="Test" n={result.split.test} rate={result.split.test_default_rate} total={result.quality.rows} color="#8b7dff" />
                    </div>
                  ), note: `Default share is ${fmt.pct(result.split.train_default_rate, 2)} in train and ${fmt.pct(result.split.test_default_rate, 2)} in test.`,
                },
                {
                  t: '3 · Scaling', body: (
                    <div className="grid grid-cols-2 gap-2">
                      <Stat label={`${focus} before`} value={fmt.compact(result.scale_stats.find((s: any) => s.feature === focus).raw_mean)} sub={`σ ${fmt.compact(result.scale_stats.find((s: any) => s.feature === focus).raw_std)}`} tone="plain" />
                      <Stat label="after" value={fmt.num(result.scale_stats.find((s: any) => s.feature === focus).new_mean, 2)} sub={`σ ${fmt.num(result.scale_stats.find((s: any) => s.feature === focus).new_std, 2)}`} tone="safe" />
                    </div>
                  ), note: `9 numeric columns rescaled with ${scaler === 'standard' ? 'StandardScaler' : scaler === 'minmax' ? 'MinMaxScaler' : 'RobustScaler'}.`,
                },
                {
                  t: '4 · One-hot encoding', body: (
                    <div className="grid grid-cols-2 gap-2">
                      <Stat label="Columns in" value={result.features_before} tone="plain" />
                      <Stat label="Features out" value={result.features_after} tone="volt" />
                    </div>
                  ), note: '7 categoricals expanded with drop="first" to avoid the dummy-variable trap.',
                },
              ].map((c, i) => (
                <motion.div key={c.t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fast ? 0 : i * 0.25 }}>
                  <Panel title={<span className="flex items-center gap-2"><CheckCircle2 size={13} className="text-safe" /> {c.t}</span>}>
                    {c.body}
                    <div className="mt-3 text-[11px] leading-snug text-slate-500">{c.note}</div>
                  </Panel>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel title={`Distribution of ${focus}: raw vs scaled`}>
                <div className="grid grid-cols-2 gap-3">
                  <Hist data={result.hist_before} color="#64748b" label="raw" />
                  <Hist data={result.hist_after} color="#2ee6c8" label={scaler} />
                </div>
                <div className="mt-2 text-[11px] text-slate-500">The shape stays the same and only the axis changes. Scaling moves and stretches values without reordering them.</div>
              </Panel>
              <Panel title="One-hot expansion (reference level dropped)">
                <div className="max-h-[230px] space-y-2 overflow-auto pr-1">
                  {result.onehot.map((o: any) => (
                    <div key={o.column} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="w-28 shrink-0 font-mono text-warn/90">{o.column}</span>
                      <span className="text-slate-600">→</span>
                      <Chip>{o.dropped} <span className="text-slate-600">(dropped)</span></Chip>
                      {o.new_columns.map((n: string) => <Chip key={n} tone="volt">{n}</Chip>)}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <Panel title="After preprocessing · same rows, model-ready" pad={false}>
              <div className="max-h-[260px] overflow-auto">
                <table className="data w-full">
                  <thead>
                    <tr>{Object.keys(result.after[0]).map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.after.map((r: any) => (
                      <tr key={r.LoanID}>
                        {Object.entries(r).map(([k, v]: any) => (
                          <td key={k} className={k === 'Default' ? (v ? 'text-risk' : 'text-safe') : k.includes('_') ? (v ? 'text-volt' : 'text-slate-600') : 'text-safe/90'}>
                            {typeof v === 'number' ? (Number.isInteger(v) && k.includes('_') ? v : v.toFixed?.(3) ?? v) : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <Panel title="Pearson correlation · numeric features + Default">
                <Heatmap labels={result.corr.labels} m={result.corr.matrix} />
              </Panel>
              <Insight items={prepInsights(result)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

function prepInsights(r: any) {
  const lab = r.corr.labels as string[];
  const di = lab.indexOf('Default');
  const cors = lab.map((l, i) => ({ l, v: r.corr.matrix[i][di] })).filter((x) => x.l !== 'Default').sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const top = cors[0], second = cors[1];
  const f = r.scale_stats.find((s: any) => s.feature === r.focus);
  return [
    <>Data is clean: <b className="text-white">{r.quality.missing}</b> missing values and <b className="text-white">{r.quality.duplicates}</b> duplicates, so no imputation was needed.</>,
    <>Stratification worked. Train holds {fmt.int(r.split.train_defaults)} defaulters and test holds {fmt.int(r.split.test_defaults)}, both at {fmt.pct(r.split.train_default_rate, 2)}. A random split could drift away from that rate.</>,
    <>{r.focus} went from a range of {fmt.compact(f.raw_min)} to {fmt.compact(f.raw_max)} down to {fmt.num(f.new_min, 2)} to {fmt.num(f.new_max, 2)}. Without scaling, Income (values up to ~150k) would swamp DTI (0 to 1) in distance-based methods like K-Means and logistic regression.</>,
    <>The strongest linear link to Default is <b className="text-white">{top.l}</b> (r = {top.v.toFixed(2)}), then {second.l} (r = {second.v.toFixed(2)}). Each single correlation is weak, which is why the models need several features together.</>,
  ];
}

function SplitBar({ label, n, rate, total, color }: { label: string; n: number; rate: number; total: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[11px]">
        <span style={{ color }}>{label} · {fmt.int(n)}</span>
        <span className="text-risk">{fmt.pct(rate, 2)} default</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(n / total) * 100}%` }} transition={{ duration: 1 }} className="relative h-full rounded-full" style={{ background: color }}>
          <div className="absolute right-0 top-0 h-full bg-risk" style={{ width: `${rate * 100}%` }} />
        </motion.div>
      </div>
    </div>
  );
}

function Hist({ data, color, label }: { data: any[]; color: string; label: string }) {
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="h-40">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -24, right: 4, top: 4, bottom: 0 }}>
            <XAxis dataKey="x" tickFormatter={(v) => fmt.compact(v)} interval={5} />
            <YAxis tickFormatter={(v) => fmt.compact(v)} />
            <Tooltip formatter={(v: any) => fmt.int(v)} labelFormatter={(v) => `≈ ${fmt.compact(v as number)}`} />
            <Bar dataKey="count" fill={color} radius={[2, 2, 0, 0]} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Heatmap({ labels, m }: { labels: string[]; m: number[][] }) {
  const short = (s: string) => s.replace('NumCreditLines', 'CredLines').replace('MonthsEmployed', 'MonthsEmp').replace('InterestRate', 'IntRate').replace('LoanAmount', 'LoanAmt').replace('CreditScore', 'Credit');
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `78px repeat(${labels.length}, minmax(30px,1fr))` }}>
        <div />
        {labels.map((l) => <div key={l} className="h-16 origin-bottom-left translate-x-3 -rotate-45 whitespace-nowrap font-mono text-[9px] text-slate-500">{short(l)}</div>)}
        {m.map((row, i) => (
          <Fragment key={i}>
            <div className="flex items-center justify-end pr-2 font-mono text-[9px] text-slate-500">{short(labels[i])}</div>
            {row.map((v, j) => (
              <div key={i + '-' + j} title={`${labels[i]} × ${labels[j]}: ${v}`}
                className="grid h-8 place-items-center rounded-[3px] font-mono text-[9px]"
                style={{ background: v >= 0 ? `rgba(255,77,109,${Math.abs(v) * 0.9})` : `rgba(46,230,200,${Math.abs(v) * 0.9})`, color: Math.abs(v) > 0.5 ? '#04060c' : '#94a3b8' }}>
                {i === j ? '' : v.toFixed(2)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
        <span className="h-2 w-6 rounded" style={{ background: riskColor(0) }} /> negative
        <span className="ml-3 h-2 w-6 rounded bg-risk" /> positive
      </div>
    </div>
  );
}
