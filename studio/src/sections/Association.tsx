import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Busy, Button, Chip, Insight, Lazy3D, Panel, Section, Segmented, Slider } from '../components/ui';
import { api, useApi, useDebounced } from '../lib/api';
import { fmt } from '../lib/util';
import RuleGraph, { groupColor } from '../three/RuleGraph';

type A = 'apriori' | 'fpgrowth' | 'eclat';
const ALGOS: { v: A; label: string; desc: string }[] = [
  { v: 'apriori', label: 'Apriori', desc: 'Level-wise, breadth-first. Builds k-itemset candidates from frequent (k−1)-itemsets and prunes any candidate with an infrequent subset (anti-monotonicity).' },
  { v: 'fpgrowth', label: 'FP-Growth', desc: 'Compresses transactions into an FP-tree, then mines conditional pattern bases recursively. No candidate generation.' },
  { v: 'eclat', label: 'ECLAT', desc: 'Depth-first on a vertical layout: each item keeps its set of transaction IDs, and support comes from intersecting TID-sets.' },
];

export default function Association() {
  const [algo, setAlgo] = useState<A>('apriori');
  const [sup, setSup] = useState(0.03);
  const [conf, setConf] = useState(0.3);
  const [lift, setLift] = useState(1.0);
  const [bins, setBins] = useState(3);
  const [maxLen, setMaxLen] = useState(4);
  const [target, setTarget] = useState<'default' | 'any'>('default');
  const [focus, setFocus] = useState<number | null>(null);
  const [sort, setSort] = useState<'lift' | 'confidence' | 'support'>('lift');
  const [bench, setBench] = useState<any>(null);
  const [benching, setBenching] = useState(false);

  const body = useDebounced({ algo, min_support: sup, min_confidence: conf, min_lift: lift, bins, max_len: maxLen, target }, 400);
  const { data, loading } = useApi<any>('/api/associate', body);
  const rules = useMemo(() => [...(data?.rules ?? [])].sort((a: any, b: any) => b[sort] - a[sort]), [data, sort]);

  const runBench = async () => {
    setBenching(true);
    try { setBench(await api('/api/associate/benchmark', { min_support: sup, bins, max_len: maxLen })); } finally { setBenching(false); }
  };

  const insights = useMemo(() => {
    if (!data) return [];
    const out: any[] = [];
    const base = data.baseline_default;
    const top = data.rules[0];
    out.push(<>{ALGOS.find((a) => a.v === data.algo)!.label} scanned {fmt.int(data.n_transactions)} training transactions over {data.n_items} items and found <b className="text-white">{fmt.int(data.n_itemsets)}</b> frequent itemsets in {(data.mine_time * 1000).toFixed(0)} ms. That produced {fmt.int(data.n_rules)} rules that pass your thresholds.</>);
    if (top) {
      const isDef = top.consequent.includes('Default=Yes');
      out.push(<>Strongest rule: borrowers with <b className="text-white">{top.antecedent.join(' + ')}</b> {isDef ? 'default' : `show ${top.consequent.join(' + ')}`} {fmt.pct(top.confidence)} of the time{isDef && base ? <>, against a baseline of {fmt.pct(base)}</> : null}. That is a lift of <b className="text-risk">{top.lift.toFixed(2)}×</b>, covering {fmt.pct(top.support, 2)} of all loans.</>);
    }
    const items = new Map<string, number>();
    data.rules.slice(0, 20).forEach((r: any) => r.antecedent.forEach((i: string) => items.set(i, (items.get(i) ?? 0) + 1)));
    const common = [...items.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (common.length) out.push(<>The items that recur most in the top 20 rules are {common.map(([i, n]) => `${i} (${n})`).join(', ')}. These are the risk drivers behind the strongest patterns.</>);
    out.push(<>Lower min_support finds rarer and often sharper patterns, at the cost of more itemsets. Apriori, FP-Growth and ECLAT always return the same itemsets. Only speed and memory differ.</>);
    return out;
  }, [data]);

  return (
    <Section
      id="association"
      index="06"
      kicker="Association rule mining"
      title={<>Which combinations <span className="text-risk">predict default?</span></>}
      lead="Continuous columns are binned into items (quantiles for income, loan amount, DTI and interest; domain bands for credit score), and each borrower becomes a transaction. The miner keeps rules X ⇒ Y that clear your support, confidence and lift thresholds."
    >
      <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
        <Panel title="Miner settings" className="self-start xl:sticky xl:top-20">
          <div className="grid grid-cols-3 gap-1.5">
            {ALGOS.map((a) => (
              <button key={a.v} onClick={() => setAlgo(a.v)}
                className={`rounded-xl border px-2 py-2.5 text-xs transition ${algo === a.v ? 'border-risk/60 bg-risk/10 text-white' : 'border-white/5 bg-white/[0.02] text-slate-400 hover:text-white'}`}>
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">{ALGOS.find((a) => a.v === algo)!.desc}</p>
          <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
            <Slider label="min_support" value={sup} min={0.01} max={0.2} step={0.005} onChange={setSup} format={(v) => fmt.pct(v, 1)} hint="Share of all transactions containing the itemset" />
            <Slider label="min_confidence" value={conf} min={0.1} max={0.9} step={0.05} onChange={setConf} format={(v) => fmt.pct(v, 0)} hint="P(Y | X)" />
            <Slider label="min_lift" value={lift} min={1} max={5} step={0.1} onChange={setLift} format={(v) => `${v.toFixed(1)}×`} hint="Confidence ÷ P(Y). 1 = independent" />
            <Slider label="Bins per numeric feature" value={bins} min={3} max={5} onChange={setBins} />
            <Slider label="Max itemset length" value={maxLen} min={2} max={5} onChange={setMaxLen} />
            <div>
              <div className="mb-1.5 text-xs text-slate-300">Consequent</div>
              <Segmented size="sm" value={target} onChange={setTarget} options={[{ value: 'default', label: '⇒ Default=Yes' }, { value: 'any', label: 'any rule' }]} />
            </div>
            <Button variant="ghost" className="w-full" onClick={runBench} disabled={benching}><Timer size={14} /> Race all three algorithms</Button>
            {bench && (
              <div className="space-y-1.5">
                {bench.results.map((r: any) => {
                  const max = Math.max(...bench.results.map((x: any) => x.time));
                  return (
                    <div key={r.algo}>
                      <div className="flex justify-between font-mono text-[10px] text-slate-400"><span>{r.algo}</span><span>{(r.time * 1000).toFixed(0)} ms · {r.itemsets} sets</span></div>
                      <div className="h-1.5 rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${(r.time / max) * 100}%` }} className="h-full rounded-full bg-risk" /></div>
                    </div>
                  );
                })}
                <div className="text-[10px] leading-snug text-slate-500">Same itemset count from all three, so they agree. At this tiny scale (~25 items) Python overhead dominates, which is why the textbook speed order may not hold.</div>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel pad={false} className="relative">
            <Lazy3D height={500}>
              {data && data.rules.length > 0 && <RuleGraph rules={rules} itemSupport={data.item_support} focus={focus} setFocus={setFocus} />}
              {data && data.rules.length === 0 && <div className="grid h-full place-items-center text-sm text-slate-500">No rules pass these thresholds. Loosen support, confidence or lift.</div>}
            </Lazy3D>
            <Busy show={loading} label={`Mining with ${ALGOS.find((a) => a.v === algo)!.label}…`} />
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
              {data && <Chip tone="risk">{fmt.int(data.n_rules)} rules</Chip>}
              {data && <Chip>{fmt.int(data.n_itemsets)} itemsets</Chip>}
              {data && <Chip>{(data.mine_time * 1000).toFixed(0)} ms</Chip>}
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 text-[11px] text-slate-500">Edge thickness = lift · pulses flow toward the consequent · hover a node to isolate its rule</div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <Panel title="Rules" pad={false} right={
              <Segmented size="sm" value={sort} onChange={setSort} options={[{ value: 'lift', label: 'lift' }, { value: 'confidence', label: 'conf' }, { value: 'support', label: 'support' }]} />
            }>
              <div className="max-h-[340px] overflow-auto">
                <table className="data w-full">
                  <thead><tr><th>#</th><th>If (antecedent)</th><th>Then</th><th>Support</th><th>Conf.</th><th>Lift</th></tr></thead>
                  <tbody>
                    {rules.slice(0, 40).map((r: any, i: number) => (
                      <tr key={i} onMouseEnter={() => setFocus(i < 24 ? i : null)} onMouseLeave={() => setFocus(null)} className="cursor-default hover:bg-white/[0.03]">
                        <td className="text-slate-600">{i + 1}</td>
                        <td className="whitespace-normal">
                          <div className="flex flex-wrap gap-1">{r.antecedent.map((a: string) => <span key={a} className="rounded px-1.5 py-0.5" style={{ background: groupColor(a) + '22', color: groupColor(a) }}>{a}</span>)}</div>
                        </td>
                        <td className="text-risk">{r.consequent.join(', ')}</td>
                        <td>{fmt.pct(r.support, 2)}</td>
                        <td>{fmt.pct(r.confidence, 1)}</td>
                        <td className="font-semibold text-white">{r.lift.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title="Level-wise itemsets (Lk)">
              <div className="h-[220px]">
                <ResponsiveContainer>
                  <BarChart data={data?.levels ?? []} margin={{ left: -16, right: 6, top: 8 }}>
                    <XAxis dataKey="k" tickFormatter={(v) => `L${v}`} />
                    <YAxis tickFormatter={fmt.compact} />
                    <Tooltip formatter={(v: any) => fmt.int(v)} labelFormatter={(v) => `${v}-itemsets`} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1200}>
                      {(data?.levels ?? []).map((_: any, i: number) => <Cell key={i} fill={['#4cc3ff', '#8b7dff', '#ff7ad9', '#ff4d6d', '#ffb547'][i % 5]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[11px] leading-snug text-slate-500">Apriori climbs these levels one at a time. Each level only extends itemsets that survived the level below.</div>
            </Panel>
          </div>
          <Insight items={insights} />
        </div>
      </div>
    </Section>
  );
}
