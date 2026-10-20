import { AnimatePresence, motion, useMotionValueEvent, useSpring, useTransform } from 'framer-motion';
import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceArea, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Chip, Insight, Panel, Section, Segmented, Select, Slider } from '../components/ui';
import { useApi, useDebounced } from '../lib/api';
import { fmt, pretty } from '../lib/util';

const MODELS = [
  { value: 'gb', label: 'Gradient Boosting (champion)' },
  { value: 'rf', label: 'Random Forest' },
  { value: 'lr', label: 'Logistic Regression' },
  { value: 'dt', label: 'Decision Tree' },
  { value: 'mlp', label: 'Neural Network (MLP)' },
];
const ZONE_META: Record<string, { c: string; icon: any }> = {
  Low: { c: '#2ee6c8', icon: ShieldCheck },
  Moderate: { c: '#4cc3ff', icon: ShieldQuestion },
  High: { c: '#ffb547', icon: ShieldAlert },
  Critical: { c: '#ff4d6d', icon: ShieldX },
};
const NUM_FMT: Record<string, (v: number) => string> = {
  Income: (v) => `$${fmt.int(v)}`, LoanAmount: (v) => `$${fmt.int(v)}`, InterestRate: (v) => `${v.toFixed(1)}%`,
  DTIRatio: (v) => v.toFixed(2), CreditScore: (v) => String(Math.round(v)), MonthsEmployed: (v) => `${Math.round(v)} mo`,
  Age: (v) => `${Math.round(v)} yrs`, NumCreditLines: (v) => String(Math.round(v)), LoanTerm: (v) => `${Math.round(v)} mo`,
};
const STEP: Record<string, number> = { Income: 1000, LoanAmount: 1000, InterestRate: 0.1, DTIRatio: 0.01, CreditScore: 1, MonthsEmployed: 1, Age: 1, NumCreditLines: 1, LoanTerm: 12 };

export default function Prediction() {
  const { data: schema } = useApi<any>('/api/predict/schema');
  const [b, setB] = useState<any>(null);
  const [model, setModel] = useState('gb');
  const [zones, setZones] = useState([0.2, 0.45, 0.7]);
  const [whatif, setWhatif] = useState('CreditScore');
  useEffect(() => { if (schema && !b) setB(schema.presets['Borderline']); }, [schema]);
  const body = useDebounced(b ? { borrower: b, model, zones } : null, 220);
  const { data: res } = useApi<any>(body ? '/api/predict' : null, body);

  const set = (k: string, v: any) => setB((s: any) => ({ ...s, [k]: v }));
  const insights = useMemo(() => (res ? buildInsights(res) : []), [res]);

  return (
    <Section
      id="prediction"
      index="07"
      kicker="Real-time risk engine"
      title={<>Score a borrower <span className="text-gradient">live</span></>}
      lead="The applicant goes through the same fitted preprocessor (preprocessor.joblib), then into the chosen model's predict_proba. Move any slider and the gauge, the risk drivers and the what-if curve all update."
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Panel title="Applicant" right={<Chip>16 inputs</Chip>}>
          {schema && b && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(schema.presets).map((p) => (
                  <button key={p} onClick={() => setB(schema.presets[p])} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-slate-300 transition hover:border-safe/40 hover:text-white">{p}</button>
                ))}
              </div>
              <div className="space-y-3.5">
                {['CreditScore', 'Income', 'LoanAmount', 'DTIRatio', 'InterestRate', 'MonthsEmployed', 'Age', 'LoanTerm', 'NumCreditLines'].map((k) => (
                  <Slider key={k} label={pretty(k)} value={b[k]} min={schema.numeric[k].min} max={schema.numeric[k].max} step={STEP[k]} onChange={(v) => set(k, v)} format={NUM_FMT[k]} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
                {Object.entries(schema.categorical).map(([k, opts]: any) => (
                  <Select key={k} label={pretty(k)} value={b[k]} options={opts} onChange={(v) => set(k, v)} />
                ))}
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <Panel title="Default probability" right={<div className="w-56"><Select value={model} onChange={setModel} options={MODELS} /></div>}>
              {res && <Gauge p={res.probability} zone={res.zone} zones={zones} action={res.action} />}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                {['Low → Moderate', 'Moderate → High', 'High → Critical'].map((l, i) => (
                  <Slider key={l} label={l} value={zones[i]} min={0.05} max={0.95} step={0.01}
                    onChange={(v) => { const z = [...zones]; z[i] = v; setZones(z.sort((a, b) => a - b)); }} format={(v) => `${Math.round(v * 100)}%`} />
                ))}
              </div>
            </Panel>
            <Panel title="What drove this score">
              {res && (
                <>
                  <div className="h-[250px]">
                    <ResponsiveContainer>
                      <BarChart data={res.contributions.slice(0, 8)} layout="vertical" margin={{ left: 30, right: 16 }}>
                        <XAxis type="number" tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(Math.abs(v) < 0.2 ? 1 : 0)}`} />
                        <YAxis type="category" dataKey="feature" width={110} tickFormatter={(v) => pretty(v)} />
                        <Tooltip formatter={(v: any) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)} pts`} labelFormatter={(l) => pretty(l as string)} />
                        <Bar dataKey="delta" radius={4} animationDuration={500}>
                          {res.contributions.slice(0, 8).map((c: any, i: number) => <Cell key={i} fill={c.delta > 0 ? '#ff4d6d' : '#2ee6c8'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[11px] leading-snug text-slate-500">Each bar shows how many points P(Default) would drop (red) or rise (teal) if that one input were reset to the portfolio's typical value.</div>
                </>
              )}
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Panel title="What-if: sweep one input, hold the rest" right={<div className="w-44"><Select value={whatif} onChange={setWhatif} options={Object.keys(NUM_FMT).map((k) => ({ value: k, label: pretty(k) }))} /></div>}>
              {res && (
                <div className="h-[240px]">
                  <ResponsiveContainer>
                    <ComposedChart data={res.whatif[whatif]} margin={{ left: -6, right: 10, top: 8 }}>
                      <CartesianGrid />
                      <ReferenceArea y1={0} y2={zones[0]} fill="#2ee6c8" fillOpacity={0.05} />
                      <ReferenceArea y1={zones[0]} y2={zones[1]} fill="#4cc3ff" fillOpacity={0.05} />
                      <ReferenceArea y1={zones[1]} y2={zones[2]} fill="#ffb547" fillOpacity={0.06} />
                      <ReferenceArea y1={zones[2]} y2={1} fill="#ff4d6d" fillOpacity={0.07} />
                      <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(v) => (NUM_FMT[whatif] ? NUM_FMT[whatif](v) : v).replace('$', '')} />
                      <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                      <Tooltip formatter={(v: any) => fmt.pct(v)} labelFormatter={(v) => `${pretty(whatif)} = ${NUM_FMT[whatif](+v)}`} />
                      <Area dataKey="p" stroke="none" fill="#8b7dff" fillOpacity={0.15} />
                      <Line dataKey="p" stroke="#8b7dff" strokeWidth={2.5} dot={false} animationDuration={500} />
                      <ReferenceDot x={b?.[whatif]} y={res.probability} r={7} fill="#ffb547" stroke="#04060c" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
            <Panel title="Do the models agree?">
              {res && (
                <div className="space-y-2.5">
                  {MODELS.map((m) => {
                    const p = res.all_models[m.value];
                    if (p == null) return null;
                    return (
                      <div key={m.value}>
                        <div className="flex justify-between text-[11px]"><span className={m.value === model ? 'text-white' : 'text-slate-400'}>{m.label.replace(' (champion)', '')}</span><span className="font-mono text-slate-300">{fmt.pct(p)}</span></div>
                        <div className="relative mt-1 h-2 rounded-full bg-white/5">
                          {zones.map((z) => <div key={z} className="absolute top-0 h-full w-px bg-white/20" style={{ left: `${z * 100}%` }} />)}
                          <motion.div animate={{ width: `${p * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="h-full rounded-full" style={{ background: zoneColor(p, zones) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {res?.warnings?.length > 0 && (
                <div className="mt-5 space-y-1.5 border-t border-white/5 pt-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-warn">Underwriting flags</div>
                  {res.warnings.map((w: string) => (
                    <motion.div key={w} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-[12px] text-slate-300">
                      <AlertTriangle size={13} className="shrink-0 text-warn" /> {w}
                    </motion.div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
          <Insight items={insights} />
        </div>
      </div>
    </Section>
  );
}

const zoneColor = (p: number, z: number[]) => (p < z[0] ? '#2ee6c8' : p < z[1] ? '#4cc3ff' : p < z[2] ? '#ffb547' : '#ff4d6d');

function Gauge({ p, zone, zones, action }: { p: number; zone: string; zones: number[]; action: string }) {
  const spring = useSpring(p, { stiffness: 70, damping: 14 });
  useEffect(() => { spring.set(p); }, [p]);
  const [needle, setNeedle] = useState(p);
  useMotionValueEvent(spring, 'change', (v) => setNeedle(v));
  const pct = useTransform(spring, (v) => `${(v * 100).toFixed(1)}%`);
  const R = 120, cx = 160, cy = 150;
  const arc = (a0: number, a1: number) => {
    const t0 = ((-120 + a0 * 240) - 90) * (Math.PI / 180), t1 = ((-120 + a1 * 240) - 90) * (Math.PI / 180);
    return `M${cx + R * Math.cos(t0)},${cy + R * Math.sin(t0)} A${R},${R} 0 ${a1 - a0 > 0.75 ? 1 : 0} 1 ${cx + R * Math.cos(t1)},${cy + R * Math.sin(t1)}`;
  };
  const bands = [[0, zones[0], '#2ee6c8'], [zones[0], zones[1], '#4cc3ff'], [zones[1], zones[2], '#ffb547'], [zones[2], 1, '#ff4d6d']] as const;
  const Z = ZONE_META[zone];
  return (
    <div className="relative">
      <AnimatePresence>
        {zone === 'Critical' && (
          <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0.15, 0.4, 0.15] }} exit={{ opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity }}
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_60%,rgba(255,77,109,.35),transparent_65%)]" />
        )}
      </AnimatePresence>
      <svg viewBox="0 0 320 230" className="mx-auto w-full max-w-[420px]">
        {bands.map(([a, b, c]) => <path key={c} d={arc(a, b)} stroke={c} strokeWidth={18} fill="none" strokeOpacity={zone && Z.c === c ? 1 : 0.25} />)}
        {Array.from({ length: 11 }).map((_, i) => {
          const t = ((-120 + (i / 10) * 240) - 90) * (Math.PI / 180);
          return (
            <g key={i}>
              <line x1={cx + (R - 16) * Math.cos(t)} y1={cy + (R - 16) * Math.sin(t)} x2={cx + (R - 24) * Math.cos(t)} y2={cy + (R - 24) * Math.sin(t)} stroke="#475569" />
              <text x={cx + (R - 36) * Math.cos(t)} y={cy + (R - 36) * Math.sin(t) + 3} textAnchor="middle" className="fill-slate-500 font-mono text-[9px]">{i * 10}</text>
            </g>
          );
        })}
        <g transform={`rotate(${-120 + Math.max(0, Math.min(1, needle)) * 240} ${cx} ${cy})`}>
          <path d={`M${cx - 5},${cy} L${cx},${cy - R + 8} L${cx + 5},${cy} Z`} fill="#e2e8f0" style={{ filter: `drop-shadow(0 0 6px ${Z.c})` }} />
        </g>
        <circle cx={cx} cy={cy} r={12} fill="#0a101c" stroke={Z.c} strokeWidth={3} />
        <motion.text x={cx} y={cy + 52} textAnchor="middle" className="fill-white font-display text-[34px] font-semibold">{pct}</motion.text>
      </svg>
      <div className="-mt-2 flex flex-col items-center gap-1.5">
        <motion.div key={zone} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-display text-sm font-semibold" style={{ borderColor: Z.c + '66', color: Z.c, background: Z.c + '18', boxShadow: `0 0 30px -6px ${Z.c}` }}>
          <Z.icon size={16} /> {zone} risk
        </motion.div>
        <div className="text-[12px] text-slate-400">Recommended action: <span className="text-slate-200">{action}</span></div>
      </div>
    </div>
  );
}

function buildInsights(r: any) {
  const ups = r.contributions.filter((c: any) => c.delta > 0.01).slice(0, 3);
  const downs = r.contributions.filter((c: any) => c.delta < -0.01).slice(0, 2);
  const vals = Object.values(r.all_models) as number[];
  const spread = Math.max(...vals) - Math.min(...vals);
  const out: any[] = [
    <>{r.label} puts this applicant at <b className="text-white">{fmt.pct(r.probability)}</b>, which is <b style={{ color: ZONE_META[r.zone].c }}>{r.zone}</b> risk. The rule for that band is: {r.action.toLowerCase()}.</>,
  ];
  if (ups.length) out.push(<>Pushing risk up: {ups.map((c: any) => `${pretty(c.feature)} (+${(c.delta * 100).toFixed(0)} pts)`).join(', ')}.</>);
  if (downs.length) out.push(<>Holding risk down: {downs.map((c: any) => `${pretty(c.feature)} (${(c.delta * 100).toFixed(0)} pts)`).join(', ')}.</>);
  out.push(spread > 0.3
    ? <>The models disagree by {(spread * 100).toFixed(0)} points on this applicant. That usually means a borderline or unusual profile, so a human underwriter should look at it.</>
    : <>All five models land within {(spread * 100).toFixed(0)} points of each other, so the score is stable whichever algorithm you choose.</>);
  if (r.champion_source) out.push(<span className="text-slate-500">Model source: {r.champion_source}.</span>);
  return out;
}
