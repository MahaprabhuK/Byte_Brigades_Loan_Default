import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Busy, Button, Chip, Insight, Lazy3D, Legend, Panel, Section, Segmented, Slider, Stat } from '../components/ui';
import { useApi, useDebounced } from '../lib/api';
import { SEG_COLORS, fmt, useFast } from '../lib/util';
import ClusterScene from '../three/ClusterScene';

type A = 'kmeans' | 'agglomerative' | 'gmm' | 'dbscan';
const ALGOS: { v: A; label: string; desc: string }[] = [
  { v: 'kmeans', label: 'K-Means', desc: "Lloyd's algorithm: assign each point to the nearest centroid, move each centroid to its cluster mean, repeat until stable. Minimises WCSS." },
  { v: 'agglomerative', label: 'Hierarchical', desc: 'Bottom-up: every borrower starts as its own cluster and the closest pair merges until K remain. The dendrogram records every merge.' },
  { v: 'gmm', label: 'Gaussian Mixture', desc: 'Soft clustering: each segment is a Gaussian, fitted by Expectation-Maximisation. Every borrower gets a probability of belonging to each segment.' },
  { v: 'dbscan', label: 'DBSCAN', desc: 'Density-based: a cluster is a dense region (≥ min_samples neighbours within eps). No K needed, and sparse points become noise.' },
];
const FEATS = ['Income', 'CreditScore', 'LoanAmount', 'DTIRatio', 'MonthsEmployed', 'InterestRate', 'Age', 'NumCreditLines', 'LoanTerm'];
const DEF_FEATS = ['Income', 'CreditScore', 'LoanAmount', 'DTIRatio', 'MonthsEmployed'];

export default function Clustering() {
  const fast = useFast();
  const [algo, setAlgo] = useState<A>('kmeans');
  const [k, setK] = useState(3);
  const [feats, setFeats] = useState<string[]>(DEF_FEATS);
  const [nInit, setNInit] = useState(10);
  const [linkage, setLinkage] = useState('ward');
  const [cov, setCov] = useState('full');
  const [eps, setEps] = useState(0.8);
  const [minS, setMinS] = useState(15);
  const [colorBy, setColorBy] = useState<'segment' | 'default'>('segment');
  const [runId, setRunId] = useState(0);

  const body = useDebounced({ algo, k, features: feats, n_init: nInit, linkage, covariance: cov, eps, min_samples: minS }, 400);
  const { data, loading } = useApi<any>('/api/cluster', body);
  const elbowBody = useDebounced({ algo: algo === 'dbscan' ? 'kmeans' : algo, features: feats }, 400);
  const { data: elbow, loading: eLoading } = useApi<any>(algo === 'dbscan' ? null : '/api/cluster/elbow', elbowBody);

  const profiles = data?.profiles ?? [];
  const many = profiles.length > 8;
  const shownProfiles = many ? [...profiles].sort((a: any, b: any) => b.size - a.size).slice(0, 6) : profiles;

  const insights = useMemo(() => (data ? buildInsights(data, elbow) : []), [data, elbow]);
  const toggleFeat = (f: string) => setFeats((s) => (s.includes(f) ? (s.length > 2 ? s.filter((x) => x !== f) : s) : [...s, f]));

  return (
    <Section
      id="clustering"
      index="05"
      kicker="Clustering"
      title={<>Segment borrowers <span className="text-volt">without labels</span></>}
      lead="Unsupervised learning on scaled financial indicators. The Default flag is never shown to the algorithm. We only check afterwards whether the segments it finds differ in risk. Points are projected to 3D with PCA."
    >
      <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
        <Panel title="Algorithm & parameters" className="self-start xl:sticky xl:top-20">
          <div className="grid grid-cols-2 gap-1.5">
            {ALGOS.map((a) => (
              <button key={a.v} onClick={() => setAlgo(a.v)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs transition ${algo === a.v ? 'border-volt/60 bg-volt/10 text-white' : 'border-white/5 bg-white/[0.02] text-slate-400 hover:text-white'}`}>
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">{ALGOS.find((a) => a.v === algo)!.desc}</p>
          <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
            {algo !== 'dbscan' && <Slider label="Number of segments K" value={k} min={2} max={10} onChange={setK} hint="Watch silhouette and the elbow chart as you change it" />}
            {algo === 'kmeans' && <Slider label="n_init (restarts)" value={nInit} min={1} max={20} onChange={setNInit} hint="Best of N k-means++ initialisations" />}
            {algo === 'agglomerative' && (
              <div><div className="mb-1.5 text-xs text-slate-300">Linkage</div>
                <Segmented size="sm" value={linkage} onChange={setLinkage} options={['ward', 'complete', 'average', 'single'].map((v) => ({ value: v, label: v }))} /></div>
            )}
            {algo === 'gmm' && (
              <div><div className="mb-1.5 text-xs text-slate-300">Covariance type</div>
                <Segmented size="sm" value={cov} onChange={setCov} options={['full', 'tied', 'diag', 'spherical'].map((v) => ({ value: v, label: v }))} /></div>
            )}
            {algo === 'dbscan' && (
              <>
                <Slider label="eps (neighbourhood radius)" value={eps} min={0.2} max={2} step={0.05} onChange={setEps} format={(v) => v.toFixed(2)} />
                <Slider label="min_samples" value={minS} min={3} max={60} onChange={setMinS} />
              </>
            )}
            <div>
              <div className="mb-1.5 text-xs text-slate-300">Features ({feats.length})</div>
              <div className="flex flex-wrap gap-1">
                {FEATS.map((f) => (
                  <button key={f} onClick={() => toggleFeat(f)}
                    className={`rounded-md border px-2 py-0.5 font-mono text-[10px] transition ${feats.includes(f) ? 'border-volt/50 bg-volt/15 text-volt' : 'border-white/10 text-slate-500 hover:text-white'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs text-slate-300">Colour points by</div>
              <Segmented size="sm" value={colorBy} onChange={setColorBy} options={[{ value: 'segment', label: 'Segment' }, { value: 'default', label: 'Actual default' }]} />
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setRunId((r) => r + 1)}><RotateCcw size={14} /> Replay animation</Button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel pad={false} className="relative">
            <Lazy3D height={520}>
              {data && (
                <ClusterScene points={data.points} colorBy={colorBy} nSeg={profiles.length} runId={runId + JSON.stringify(body).length}
                  fast={fast} history={data.history} centroids={data.centroids} names={profiles.map((p: any) => p.name)} key={JSON.stringify(body)} />
              )}
            </Lazy3D>
            <Busy show={loading} label={algo === 'kmeans' ? 'Iterating centroids…' : algo === 'gmm' ? 'Running EM…' : algo === 'dbscan' ? 'Scanning densities…' : 'Merging clusters…'} />
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
              {data && <Chip tone="volt">{data.n_clusters} clusters</Chip>}
              {data && <Chip>{fmt.int(data.n_points)} borrowers</Chip>}
              {data?.extra?.iterations && <Chip>{data.extra.iterations} iterations</Chip>}
              {data && <Chip>PCA explains {fmt.pct(data.explained.reduce((a: number, b: number) => a + b, 0), 0)} of variance</Chip>}
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4">
              {colorBy === 'default'
                ? <Legend items={[{ color: '#ff4d6d', label: 'defaulted' }, { color: '#1f7f6e', label: 'repaid' }]} />
                : <Legend items={shownProfiles.map((p: any) => ({ color: SEG_COLORS[p.rank % SEG_COLORS.length], label: p.name }))} />}
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Silhouette" value={data?.quality.silhouette != null ? data.quality.silhouette.toFixed(3) : 'n/a'} sub="−1 … 1, higher = better separated" tone="volt" />
            <Stat label="Davies-Bouldin" value={data?.quality.davies_bouldin != null ? data.quality.davies_bouldin.toFixed(2) : 'n/a'} sub="lower = more compact" tone="plain" />
            <Stat label="Calinski-Harabasz" value={data?.quality.calinski != null ? fmt.int(data.quality.calinski) : 'n/a'} sub="higher = denser, better split" tone="plain" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <Panel title="Segment profiles · sorted by default rate" right={many ? <Chip tone="warn">{profiles.length} micro-clusters, top 6 by size</Chip> : null}>
              <div className="space-y-3">
                {shownProfiles.map((p: any, i: number) => (
                  <motion.div key={p.cluster + '-' + p.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEG_COLORS[p.rank % SEG_COLORS.length] }} />
                        <span className="font-display text-sm font-semibold text-white">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{fmt.int(p.size)} · {fmt.pct(p.share, 1)}</span>
                      </div>
                      <span className="font-mono text-sm" style={{ color: p.default_rate > 0.15 ? '#ff4d6d' : p.default_rate > 0.08 ? '#ffb547' : '#2ee6c8' }}>{fmt.pct(p.default_rate, 1)} default</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, p.default_rate * 300)}%` }} className="h-full rounded-full bg-gradient-to-r from-warn to-risk" />
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-1 font-mono text-[10px] text-slate-400">
                      <span>Inc {fmt.compact(p.Income)}</span><span>CS {p.CreditScore.toFixed(0)}</span><span>Loan {fmt.compact(p.LoanAmount)}</span><span>DTI {p.DTIRatio.toFixed(2)}</span><span>Emp {p.MonthsEmployed.toFixed(0)}m</span>
                    </div>
                  </motion.div>
                ))}
                {data?.noise && <div className="font-mono text-[11px] text-slate-500">Noise: {fmt.int(data.noise.size)} points · {fmt.pct(data.noise.default_rate)} default</div>}
              </div>
            </Panel>
            <Panel title={algo === 'gmm' ? 'BIC & silhouette vs K' : algo === 'agglomerative' ? 'Dendrogram (last 30 merges)' : algo === 'dbscan' ? 'k-distance plot (choose eps at the knee)' : 'Elbow (WCSS) & silhouette vs K'} className="relative">
              {algo === 'agglomerative' && data?.extra?.dendrogram ? <Dendrogram d={data.extra.dendrogram} cut={data.extra.cut_height} />
                : algo === 'dbscan' && data?.extra?.kdist ? <KDist d={data.extra.kdist} eps={eps} />
                  : <ElbowChart data={elbow} k={k} algo={algo} />}
              <Busy show={eLoading} label="Scanning K = 2…10" />
            </Panel>
          </div>
          <Insight items={insights} />
          {data?.notes?.length > 0 && <div className="text-[11px] text-slate-500">{data.notes.join(' ')}</div>}
        </div>
      </div>
    </Section>
  );
}

function buildInsights(d: any, elbow: any) {
  const out: any[] = [];
  const s = d.quality.silhouette;
  if (d.n_clusters < 2) {
    out.push(<>DBSCAN found {d.n_clusters} cluster(s). At this eps nearly every borrower sits in one dense blob, so the data has <b className="text-white">no natural density gaps</b>. That fits a dataset whose features are drawn independently.</>);
    out.push(<>Silhouette is undefined with fewer than 2 clusters. Lower eps and you get a swarm of tiny clusters instead. Neither result is a useful segmentation, which is why the project uses K-Means.</>);
    return out;
  }
  if (s != null) out.push(<>Silhouette {s.toFixed(3)}: {s < 0.25 ? 'weak structure. The segments overlap heavily, which is expected when the borrower features are spread fairly evenly.' : s < 0.5 ? 'moderate structure, with reasonably distinct segments.' : 'strong, well-separated segments.'}</>);
  const p = d.profiles;
  if (p.length >= 2 && p.length <= 10) {
    const lo = p[0], hi = p[p.length - 1];
    out.push(<>The algorithm never saw the Default flag, yet <b className="text-white">{hi.name}</b> defaults at {fmt.pct(hi.default_rate)} against {fmt.pct(lo.default_rate)} for <b className="text-white">{lo.name}</b>, a {(hi.default_rate / Math.max(lo.default_rate, 0.001)).toFixed(1)}× gap. The segments carry real risk signal.</>);
    const diffs = ['Income', 'CreditScore', 'LoanAmount', 'DTIRatio', 'MonthsEmployed', 'InterestRate'].map((f) => {
      const vals = p.map((x: any) => x[f]); const m = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
      return { f, spread: (Math.max(...vals) - Math.min(...vals)) / (Math.abs(m) || 1) };
    }).sort((a, b) => b.spread - a.spread);
    out.push(<>What separates the segments most: <b className="text-white">{diffs[0].f}</b> and {diffs[1].f}. Compare those columns in the profile cards.</>);
  }
  if (elbow?.curve) {
    const best = elbow.curve.filter((c: any) => c.silhouette != null).reduce((a: any, b: any) => (b.silhouette > a.silhouette ? b : a));
    out.push(<>Across K = 2 to 10, silhouette peaks at K = {best.k} ({best.silhouette.toFixed(3)}). The project uses K = 3 because three segments map onto business tiers (prime / standard / subprime). Here K = {d.k}.</>);
  }
  if (d.algo === 'gmm' && d.extra?.uncertain_share != null) out.push(<>GMM is unsure about {fmt.pct(d.extra.uncertain_share)} of borrowers (top membership probability below 60%). Those borrowers sit on segment boundaries.</>);
  return out;
}

function ElbowChart({ data, k, algo }: { data: any; k: number; algo: string }) {
  if (!data) return <div className="h-[280px]" />;
  const key = algo === 'gmm' ? 'bic' : algo === 'agglomerative' ? 'height' : 'inertia';
  return (
    <div className="h-[280px]">
      <ResponsiveContainer>
        <LineChart data={data.curve} margin={{ left: 0, right: 0, top: 8 }}>
          <CartesianGrid />
          <XAxis dataKey="k" />
          <YAxis yAxisId="a" tickFormatter={fmt.compact} />
          <YAxis yAxisId="b" orientation="right" domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(2)} />
          <Tooltip formatter={(v: any) => (+v).toFixed(3)} />
          <Line yAxisId="a" dataKey={key} name={key === 'inertia' ? 'WCSS' : key.toUpperCase()} stroke="#8b7dff" strokeWidth={2.5} />
          <Line yAxisId="b" dataKey="silhouette" stroke="#2ee6c8" strokeWidth={2.5} />
          <ReferenceLine yAxisId="a" x={k} stroke="#ffb547" strokeDasharray="4 3" label={{ value: `K=${k}`, fill: '#ffb547', fontSize: 10, position: 'top' }} />
        </LineChart>
      </ResponsiveContainer>
      <Legend items={[{ color: '#8b7dff', label: key === 'inertia' ? 'WCSS (left)' : key === 'bic' ? 'BIC (left, lower = better)' : 'merge height' }, { color: '#2ee6c8', label: 'silhouette (right)' }]} />
    </div>
  );
}

function Dendrogram({ d, cut }: { d: any; cut: number }) {
  const W = 520, H = 280;
  const xs = d.icoord.flat(), ys = d.dcoord.flat();
  const xmin = Math.min(...xs), xmax = Math.max(...xs), ymax = Math.max(...ys);
  const X = (x: number) => 10 + ((x - xmin) / (xmax - xmin)) * (W - 20);
  const Y = (y: number) => H - 20 - (y / ymax) * (H - 40);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[280px] w-full">
      {d.icoord.map((ic: number[], i: number) => (
        <motion.path key={i} d={`M${X(ic[0])},${Y(d.dcoord[i][0])} L${X(ic[1])},${Y(d.dcoord[i][1])} L${X(ic[2])},${Y(d.dcoord[i][2])} L${X(ic[3])},${Y(d.dcoord[i][3])}`}
          fill="none" stroke={d.dcoord[i][1] > cut ? '#64748b' : '#8b7dff'} strokeWidth={1.6}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * 0.03, duration: 0.4 }} />
      ))}
      <line x1={0} x2={W} y1={Y(cut)} y2={Y(cut)} stroke="#ffb547" strokeDasharray="5 4" />
      <text x={W - 6} y={Y(cut) - 5} textAnchor="end" className="fill-warn font-mono text-[10px]">cut → K clusters</text>
    </svg>
  );
}

function KDist({ d, eps }: { d: any[]; eps: number }) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer>
        <LineChart data={d} margin={{ left: -10, right: 10, top: 8 }}>
          <CartesianGrid />
          <XAxis dataKey="x" tickFormatter={fmt.compact} />
          <YAxis tickFormatter={(v) => v.toFixed(1)} />
          <Line dataKey="y" stroke="#4cc3ff" strokeWidth={2.5} dot={false} />
          <ReferenceLine y={eps} stroke="#ffb547" strokeDasharray="4 3" label={{ value: `eps ${eps}`, fill: '#ffb547', fontSize: 10 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
