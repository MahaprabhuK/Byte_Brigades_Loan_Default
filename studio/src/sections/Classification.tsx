import { AnimatePresence, animate, motion } from 'framer-motion';
import { Brain, GitBranch, Layers3, Play, Trees, TrendingUp } from 'lucide-react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Busy, Button, Chip, Insight, Panel, Section, Segmented, Select, Slider } from '../components/ui';
import { api, useApi } from '../lib/api';
import { fmt, pretty, useFast } from '../lib/util';
import { BoostViz, ForestViz, MlpViz, SigmoidViz, TreeViz } from '../viz/ModelViz';

type M = 'lr' | 'dt' | 'rf' | 'gb' | 'mlp';
const MODELS: { v: M; name: string; icon: any; tag: string; busy: string }[] = [
  { v: 'lr', name: 'Logistic Regression', icon: TrendingUp, tag: 'linear baseline', busy: 'Fitting the sigmoid…' },
  { v: 'dt', name: 'Decision Tree', icon: GitBranch, tag: 'CART · Gini', busy: 'Growing the tree…' },
  { v: 'rf', name: 'Random Forest', icon: Trees, tag: 'bagging', busy: 'Planting the forest…' },
  { v: 'gb', name: 'Gradient Boosting', icon: Layers3, tag: 'project champion', busy: 'Boosting stage by stage…' },
  { v: 'mlp', name: 'Neural Network', icon: Brain, tag: 'MLP', busy: 'Back-propagating…' },
];
const DEFAULTS: Record<M, any> = {
  lr: { C: 1, penalty: 'l2', class_weight: 'balanced' },
  dt: { max_depth: 8, min_samples_split: 2, criterion: 'gini', class_weight: 'balanced' },
  rf: { n_estimators: 100, max_depth: 12, max_features: 'sqrt', class_weight: 'balanced' },
  gb: { n_estimators: 100, learning_rate: 0.1, max_depth: 5, subsample: 1.0 },
  mlp: { hidden: '64,32', alpha: 0.0001, learning_rate_init: 0.001, activation: 'relu' },
};

export default function Classification() {
  const fast = useFast();
  const [model, setModel] = useState<M>('gb');
  const [params, setParams] = useState<Record<M, any>>(DEFAULTS);
  const [results, setResults] = useState<Partial<Record<M, any>>>({});
  const [busy, setBusy] = useState(false);
  const [threshold, setThreshold] = useState(0.5);
  const [showCompare, setShowCompare] = useState(false);
  const { data: compare } = useApi<any>('/api/classify/compare');
  const res = results[model];

  const train = async (m: M = model, p = params[m]) => {
    setBusy(true);
    try {
      const r = await api('/api/classify', { model: m, params: p });
      setResults((s) => ({ ...s, [m]: r }));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => { if (!results[model]) train(model); }, [model]);

  const P = params[model];
  const set = (k: string, v: any) => setParams((s) => ({ ...s, [model]: { ...s[model], [k]: v } }));
  const dirty = res && JSON.stringify(res.params) !== JSON.stringify(normalize(model, P));

  const row = useMemo(() => res?.sweep.reduce((a: any, b: any) => (Math.abs(b.t - threshold) < Math.abs(a.t - threshold) ? b : a)), [res, threshold]);
  const rocPoint = row ? { x: row.fp / (row.fp + row.tn), y: row.recall } : null;

  const insights = useMemo(() => (res && row ? buildInsights(res, row, compare) : []), [res, row, compare]);

  return (
    <Section
      id="classification"
      index="04"
      kicker="Classification"
      title={<>Pick a model. <span className="text-safe">Tune it.</span> Watch it learn.</>}
      lead="Five supervised classifiers trained on the 40,000-row training split and scored on the 10,000-row holdout. Change hyperparameters and retrain on the server, then drag the decision threshold to trade missed defaulters against rejected good borrowers."
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {MODELS.map((m) => {
          const c = compare?.models.find((x: any) => x.model === m.v);
          const active = model === m.v;
          return (
            <button key={m.v} onClick={() => setModel(m.v)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition ${active ? 'border-safe/60 bg-safe/[0.07] shadow-[0_0_40px_-12px_rgba(46,230,200,.6)]' : 'border-white/5 bg-white/[0.02] hover:border-white/15'}`}>
              <m.icon size={20} className={active ? 'text-safe' : 'text-slate-500 group-hover:text-slate-300'} />
              <div className="mt-3 font-display text-sm font-semibold text-white">{m.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{m.tag}</div>
              {c && <div className="mt-2 font-mono text-[11px] text-slate-400">AUC <span className="text-safe">{c.auc.toFixed(4)}</span></div>}
              {active && <motion.div layoutId="mbar" className="absolute inset-x-0 bottom-0 h-0.5 bg-safe" />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr]">
        <Panel title="Hyperparameters" className="self-start xl:sticky xl:top-20" right={res && <Chip>{res.train_time}s train</Chip>}>
          <div className="space-y-4">
            <ParamForm model={model} p={P} set={set} />
            <Button className="w-full" onClick={() => train()} disabled={busy}>
              <Play size={15} /> {dirty ? 'Retrain with new settings' : 'Retrain'}
            </Button>
            <button onClick={() => setParams((s) => ({ ...s, [model]: DEFAULTS[model] }))} className="w-full text-center text-[11px] text-slate-500 hover:text-slate-300">
              reset to project defaults
            </button>
            <div className="border-t border-white/5 pt-4">
              <Slider label="Decision threshold" value={threshold} min={0.01} max={0.99} step={0.01} onChange={setThreshold}
                format={(v) => v.toFixed(2)} hint="P(Default) ≥ threshold → flagged as defaulter. Updates instantly." />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[0.2, 0.3, 0.5, 0.7].map((t) => (
                  <button key={t} onClick={() => setThreshold(t)} className="rounded-md border border-white/10 px-2 py-0.5 font-mono text-[10px] text-slate-400 hover:text-white">{t}</button>
                ))}
                {res && (
                  <button onClick={() => setThreshold(bestF1(res).t)} className="rounded-md border border-volt/40 bg-volt/10 px-2 py-0.5 font-mono text-[10px] text-volt">best F1</button>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title={<>{MODELS.find((m) => m.v === model)!.name} · how it learns</>} className="relative"
            right={res && <div className="flex gap-2"><Chip tone="safe">AUC {res.auc.toFixed(4)}</Chip><Chip>PR-AUC {res.ap.toFixed(4)}</Chip></div>}>
            <div className="h-[340px]">
              {res && res.model === model && (
                <>
                  {model === 'lr' && <SigmoidViz data={res} threshold={threshold} runKey={JSON.stringify(res.params)} fast={fast} />}
                  {model === 'dt' && <TreeViz data={res} fast={fast} />}
                  {model === 'rf' && <ForestViz data={res} fast={fast} />}
                  {model === 'gb' && <BoostViz data={res} fast={fast} />}
                  {model === 'mlp' && <MlpViz data={res} fast={fast} />}
                </>
              )}
            </div>
            <Busy show={busy} label={MODELS.find((m) => m.v === model)!.busy} />
          </Panel>

          {res && row && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
              <Panel title={`Confusion matrix @ ${threshold.toFixed(2)} · ${fmt.int(res.n_test)} test loans`}>
                <Confusion row={row} />
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[['Precision', row.precision], ['Recall', row.recall], ['F1', row.f1], ['Accuracy', row.accuracy]].map(([l, v]: any) => (
                    <div key={l} className="rounded-lg bg-white/[0.03] px-2 py-2 text-center">
                      <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{l}</div>
                      <AnimNum v={v} className="font-display text-lg font-semibold text-white" />
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Predicted probability by true class">
                <div className="h-[250px]">
                  <ResponsiveContainer>
                    <BarChart data={res.hist} margin={{ left: -8, right: 8, top: 8 }} barCategoryGap={1}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="x" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                      <YAxis scale="sqrt" tickFormatter={fmt.compact} />
                      <Tooltip formatter={(v: any) => fmt.int(v)} labelFormatter={(v) => `P ≈ ${(+v).toFixed(2)}`} />
                      <Bar dataKey="neg" name="non-default" stackId="a" fill="#2ee6c8" fillOpacity={0.75} />
                      <Bar dataKey="pos" name="default" stackId="a" fill="#ff4d6d" />
                      <ReferenceLine x={threshold} stroke="#ffb547" strokeDasharray="4 3" label={{ value: 'threshold', fill: '#ffb547', fontSize: 10, position: 'top' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[11px] text-slate-500">√-scaled counts. The more the red and teal piles separate, the better the model ranks risk.</div>
              </Panel>
            </div>
          )}

          {res && rocPoint && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Panel title="ROC curve">
                <div className="h-[220px]">
                  <ResponsiveContainer>
                    <AreaChart data={res.roc} margin={{ left: -14, right: 8, top: 8 }}>
                      <CartesianGrid />
                      <XAxis dataKey="x" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                      <YAxis domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                      <Area dataKey="y" stroke="#2ee6c8" fill="#2ee6c8" fillOpacity={0.12} strokeWidth={2} isAnimationActive={!fast} />
                      <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#334155" strokeDasharray="4 4" />
                      <ReferenceDot x={rocPoint.x} y={rocPoint.y} r={6} fill="#ffb547" stroke="#04060c" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="font-mono text-[10px] text-slate-500">FPR {fmt.num(rocPoint.x, 3)} · TPR {fmt.num(rocPoint.y, 3)} at the current threshold</div>
              </Panel>
              <Panel title="Precision–recall curve">
                <div className="h-[220px]">
                  <ResponsiveContainer>
                    <AreaChart data={res.pr} margin={{ left: -14, right: 8, top: 8 }}>
                      <CartesianGrid />
                      <XAxis dataKey="x" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                      <YAxis domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} />
                      <Area dataKey="y" stroke="#8b7dff" fill="#8b7dff" fillOpacity={0.12} strokeWidth={2} isAnimationActive={!fast} />
                      <ReferenceLine y={res.base_rate} stroke="#334155" strokeDasharray="4 4" />
                      <ReferenceDot x={row.recall} y={row.precision} r={6} fill="#ffb547" stroke="#04060c" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="font-mono text-[10px] text-slate-500">dashed = random baseline ({fmt.pct(res.base_rate)})</div>
              </Panel>
              <Panel title={res.importance.kind}>
                <div className="h-[240px]">
                  <ResponsiveContainer>
                    <BarChart data={res.importance.items.slice(0, 8)} layout="vertical" margin={{ left: 40, right: 10 }}>
                      <XAxis type="number" tickFormatter={(v) => v.toFixed(2)} />
                      <YAxis type="category" dataKey="feature" width={100} tickFormatter={(v) => pretty(v).slice(0, 18)} />
                      <Tooltip formatter={(v: any) => (+v).toFixed(4)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={!fast}>
                        {res.importance.items.slice(0, 8).map((it: any, i: number) => <Cell key={i} fill={it.value >= 0 ? '#ff4d6d' : '#2ee6c8'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Insight items={insights} />
            <Panel title="Benchmark all five" right={<button onClick={() => setShowCompare(!showCompare)} className="font-mono text-[10px] uppercase tracking-wider text-safe">{showCompare ? 'hide curves' : 'overlay ROC'}</button>}>
              <div className="overflow-x-auto"><table className="data w-full">
                <thead><tr><th>Model</th><th>AUC</th><th>F1@.5</th><th>Recall</th><th>Brier</th></tr></thead>
                <tbody>
                  {compare?.models.slice().sort((a: any, b: any) => b.auc - a.auc).map((m: any) => (
                    <tr key={m.model} className={m.model === model ? 'bg-safe/5' : ''}>
                      <td className="text-slate-200">{m.label}</td>
                      <td className="text-safe">{m.auc.toFixed(4)}</td>
                      <td>{m.f1.toFixed(3)}</td>
                      <td>{m.recall.toFixed(3)}</td>
                      <td>{m.brier.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              <AnimatePresence>
                {showCompare && compare && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 220, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3">
                    <ResponsiveContainer>
                      <LineChart margin={{ left: -14, right: 8, top: 8 }}>
                        <CartesianGrid />
                        <XAxis dataKey="x" type="number" domain={[0, 0.3]} allowDataOverflow tickFormatter={(v) => v.toFixed(2)} />
                        <YAxis domain={[0.6, 1]} allowDataOverflow tickFormatter={(v) => v.toFixed(2)} />
                        <Tooltip formatter={(v: any) => (+v).toFixed(3)} />
                        {compare.models.map((m: any, i: number) => (
                          <Line key={m.model} data={m.roc} dataKey="y" name={m.label} dot={false} strokeWidth={2}
                            stroke={['#4cc3ff', '#ffb547', '#8b7dff', '#2ee6c8', '#ff7ad9'][i]} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="font-mono text-[10px] text-slate-500">zoomed to FPR ≤ 0.3 so the curves separate</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </div>
        </div>
      </div>
    </Section>
  );
}

function normalize(model: M, p: any) {
  const d = { ...DEFAULTS[model], ...p };
  if ('class_weight' in d) d.class_weight = d.class_weight === 'balanced' ? 'balanced' : null;
  return d;
}

function bestF1(res: any) {
  return res.sweep.reduce((a: any, b: any) => (b.f1 > a.f1 ? b : a));
}

function buildInsights(res: any, row: any, compare: any) {
  const pos = row.tp + row.fn;
  const best = bestF1(res);
  const hiRecall = [...res.sweep].reverse().find((s: any) => s.recall >= 0.95);
  const out: any[] = [
    <>ROC-AUC <b className="text-white">{res.auc.toFixed(4)}</b>: pick one defaulter and one non-defaulter at random, and the model ranks the defaulter as riskier {fmt.pct(res.auc, 1)} of the time.</>,
    <>At threshold {row.t.toFixed(2)} it catches <b className="text-safe">{fmt.int(row.tp)}</b> of {fmt.int(pos)} defaulters (recall {fmt.pct(row.recall)}) and misses <b className="text-risk">{fmt.int(row.fn)}</b>. It also wrongly flags {fmt.int(row.fp)} good borrowers (precision {fmt.pct(row.precision)}).</>,
    <>Best F1 is {best.f1.toFixed(3)} at threshold {best.t.toFixed(2)}.{hiRecall ? <> To catch 95% of defaulters, use {hiRecall.t.toFixed(2)}. Precision there is {fmt.pct(hiRecall.precision)}.</> : null}</>,
  ];
  const top = res.importance.items[0];
  if (res.model === 'lr') out.push(<>Largest coefficient: {pretty(top.feature)} ({top.value > 0 ? '+' : ''}{top.value.toFixed(2)} log-odds per std). Positive pushes risk up, negative pulls it down.</>);
  if (res.model === 'dt') out.push(<>The first split is on <b className="text-white">{res.viz.tree[0]?.label}</b>, the single question that best separates defaulters. Depth {res.viz.depth} with {res.viz.leaves} leaves.{res.params.max_depth > 12 ? ' Deep trees memorise the training set, so expect a weaker test AUC.' : ''}</>);
  if (res.model === 'rf') out.push(<>Bagging lifts AUC from about {Math.max(...res.viz.trees.map((t: any) => t.auc)).toFixed(3)} for the best single tree to {res.auc.toFixed(4)} for the forest. Averaging cancels out the noise of individual trees.</>);
  if (res.model === 'gb') {
    const st = res.viz.stages; const minS = st.reduce((a: any, b: any) => (b.test < a.test ? b : a));
    out.push(<>Lowest test loss arrives at stage {minS.stage} of {res.params.n_estimators}. Each tree corrects the residual errors of the ensemble before it, with learning rate {res.params.learning_rate}.</>);
  }
  if (res.model === 'mlp') {
    const gb = compare?.models.find((m: any) => m.model === 'gb');
    if (gb && res.auc > gb.auc) out.push(<span className="text-warn">The MLP beats Gradient Boosting on AUC ({res.auc.toFixed(4)} vs {gb.auc.toFixed(4)}). The project keeps GB as champion because it is more interpretable (feature importances, staged loss) and nearly as accurate. Be ready to defend that choice.</span>);
  }
  if (res.auc > 0.97) out.push(<span className="text-slate-500">Context: the benchmark dataset is synthetic and its label is a clean function of the features, so near-perfect AUCs are expected. Models on the original Kaggle data usually land around 0.75.</span>);
  return out;
}

function Confusion({ row }: { row: any }) {
  const cells = [
    { k: 'tn', label: 'True negative', sub: 'good loan approved', tone: 'safe' },
    { k: 'fp', label: 'False positive', sub: 'good borrower rejected', tone: 'warn' },
    { k: 'fn', label: 'False negative', sub: 'missed defaulter', tone: 'risk' },
    { k: 'tp', label: 'True positive', sub: 'default caught', tone: 'safe' },
  ];
  const total = row.tp + row.tn + row.fp + row.fn;
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
      <div />
      <div className="text-center font-mono text-[10px] uppercase tracking-wider text-slate-500">predicted: no default</div>
      <div className="text-center font-mono text-[10px] uppercase tracking-wider text-slate-500">predicted: default</div>
      {[0, 1].map((r) => (
        <Fragment key={r}>
          <div className="flex items-center font-mono text-[10px] uppercase tracking-wider text-slate-500 [writing-mode:vertical-rl] rotate-180">{r ? 'actual: default' : 'actual: ok'}</div>
          {cells.slice(r * 2, r * 2 + 2).map((c) => {
            const v = row[c.k];
            const color = c.tone === 'safe' ? '46,230,200' : c.tone === 'warn' ? '255,181,71' : '255,77,109';
            return (
              <div key={c.k} className="relative overflow-hidden rounded-xl border p-3" style={{ borderColor: `rgba(${color},.3)`, background: `rgba(${color},${0.05 + (v / total) * 0.6})` }}>
                <AnimNum v={v} int className="font-display text-3xl font-semibold text-white" />
                <div className="mt-1 text-[11px] font-medium" style={{ color: `rgb(${color})` }}>{c.label}</div>
                <div className="text-[10px] text-slate-400">{c.sub}</div>
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function AnimNum({ v, int, className }: { v: number; int?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(v);
  useEffect(() => {
    const c = animate(prev.current, v, {
      duration: 0.5, onUpdate: (x) => { if (ref.current) ref.current.textContent = int ? Math.round(x).toLocaleString() : x.toFixed(3); },
    });
    prev.current = v;
    return () => c.stop();
  }, [v, int]);
  return <span ref={ref} className={className}>{int ? Math.round(v).toLocaleString() : v.toFixed(3)}</span>;
}

function ParamForm({ model, p, set }: { model: M; p: any; set: (k: string, v: any) => void }) {
  const cw = (
    <div>
      <div className="mb-1.5 text-xs text-slate-300">Class weight (imbalance handling)</div>
      <Segmented size="sm" value={p.class_weight === 'balanced' ? 'balanced' : 'none'} onChange={(v) => set('class_weight', v === 'balanced' ? 'balanced' : null)}
        options={[{ value: 'balanced', label: 'balanced' }, { value: 'none', label: 'none' }]} />
    </div>
  );
  if (model === 'lr') return (
    <>
      <Slider label="C (inverse regularisation)" value={Math.log10(p.C)} min={-2} max={2} step={0.1} onChange={(v) => set('C', +Math.pow(10, v).toFixed(3))} format={() => String(p.C)} hint="Smaller C = stronger penalty = simpler model" />
      <div><div className="mb-1.5 text-xs text-slate-300">Penalty</div>
        <Segmented size="sm" value={p.penalty} onChange={(v) => set('penalty', v)} options={[{ value: 'l2', label: 'L2 ridge' }, { value: 'l1', label: 'L1 lasso' }]} /></div>
      {cw}
    </>
  );
  if (model === 'dt') return (
    <>
      <Slider label="max_depth" value={p.max_depth} min={1} max={20} onChange={(v) => set('max_depth', v)} />
      <Slider label="min_samples_split" value={p.min_samples_split} min={2} max={200} onChange={(v) => set('min_samples_split', v)} />
      <div><div className="mb-1.5 text-xs text-slate-300">Split criterion</div>
        <Segmented size="sm" value={p.criterion} onChange={(v) => set('criterion', v)} options={[{ value: 'gini', label: 'Gini' }, { value: 'entropy', label: 'Entropy' }]} /></div>
      {cw}
    </>
  );
  if (model === 'rf') return (
    <>
      <Slider label="n_estimators (trees)" value={p.n_estimators} min={10} max={300} step={10} onChange={(v) => set('n_estimators', v)} />
      <Slider label="max_depth" value={p.max_depth} min={2} max={25} onChange={(v) => set('max_depth', v)} />
      <div><div className="mb-1.5 text-xs text-slate-300">max_features per split</div>
        <Segmented size="sm" value={p.max_features} onChange={(v) => set('max_features', v)} options={[{ value: 'sqrt', label: '√p' }, { value: 'log2', label: 'log₂p' }]} /></div>
      {cw}
    </>
  );
  if (model === 'gb') return (
    <>
      <Slider label="n_estimators (stages)" value={p.n_estimators} min={10} max={300} step={10} onChange={(v) => set('n_estimators', v)} hint="~0.1 s per stage on the server" />
      <Slider label="learning_rate" value={p.learning_rate} min={0.01} max={1} step={0.01} onChange={(v) => set('learning_rate', v)} format={(v) => v.toFixed(2)} />
      <Slider label="max_depth" value={p.max_depth} min={1} max={8} onChange={(v) => set('max_depth', v)} />
      <Slider label="subsample" value={p.subsample} min={0.5} max={1} step={0.05} onChange={(v) => set('subsample', v)} format={(v) => v.toFixed(2)} hint="< 1.0 = stochastic gradient boosting" />
    </>
  );
  return (
    <>
      <Select label="Hidden layers" value={p.hidden} onChange={(v) => set('hidden', v)} options={[
        { value: '16', label: '16' }, { value: '32,16', label: '32 → 16' }, { value: '64,32', label: '64 → 32 (default)' }, { value: '128,64,32', label: '128 → 64 → 32' },
      ]} />
      <div><div className="mb-1.5 text-xs text-slate-300">Activation</div>
        <Segmented size="sm" value={p.activation} onChange={(v) => set('activation', v)} options={[{ value: 'relu', label: 'ReLU' }, { value: 'tanh', label: 'tanh' }, { value: 'logistic', label: 'sigmoid' }]} /></div>
      <Slider label="alpha (L2)" value={Math.log10(p.alpha)} min={-6} max={-1} step={0.5} onChange={(v) => set('alpha', +Math.pow(10, v).toPrecision(2))} format={() => String(p.alpha)} />
      <Select label="Learning rate" value={String(p.learning_rate_init)} onChange={(v) => set('learning_rate_init', +v)} options={['0.0001', '0.001', '0.01', '0.05']} />
    </>
  );
}

