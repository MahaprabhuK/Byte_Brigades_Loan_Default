import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Database, KeyRound, Link2, Play, Terminal, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Chip, Panel } from '../components/ui';
import { api, useApi } from '../lib/api';
import { useInView } from '../lib/util';
import WarehouseScene from '../three/WarehouseScene';

const STAGES = [
  { t: 'One SQLite file, five tables', d: 'loan_dw.db is a ROLAP warehouse: relational tables queried with SQL GROUP BY, with no separate cube engine.' },
  { t: 'Inside: a star schema', d: 'One central fact table holds the measures. Four dimension tables hold the descriptive context. Each dimension joins to the fact table with a single foreign key.' },
  { t: 'Explore the tables', d: 'Click the loading dock (fact) or any shelf (dimension) to see its columns, keys and real rows from the warehouse.' },
];

const PRESETS = [
  { name: 'Default rate by purpose', q: `SELECT p.LoanPurpose, COUNT(*) AS loans,\n       ROUND(AVG(f.DefaultStatus)*100, 2) AS default_pct\nFROM Fact_Loan_Performance f\nJOIN Dim_Loan_Purpose p ON f.PurposeID = p.PurposeID\nGROUP BY p.LoanPurpose\nORDER BY default_pct DESC` },
  { name: 'Credit band × employment', q: `SELECT c.CreditScoreGroup, b.EmploymentType,\n       COUNT(*) AS loans, ROUND(AVG(f.DefaultStatus)*100,2) AS default_pct\nFROM Fact_Loan_Performance f\nJOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID\nJOIN Dim_Credit_Profile c ON f.CreditProfileID = c.CreditProfileID\nGROUP BY 1, 2\nORDER BY default_pct DESC\nLIMIT 10` },
  { name: 'Co-signer effect', q: `SELECT c.HasCoSigner, COUNT(*) AS loans,\n       ROUND(AVG(f.DefaultStatus)*100,2) AS default_pct,\n       ROUND(AVG(f.LoanAmount),0) AS avg_loan\nFROM Fact_Loan_Performance f\nJOIN Dim_Credit_Profile c ON f.CreditProfileID = c.CreditProfileID\nGROUP BY c.HasCoSigner` },
  { name: 'Top 10 riskiest loans', q: `SELECT f.LoanID, f.CreditScore, f.DTIRatio, f.InterestRate,\n       f.DefaultRiskScore, f.DefaultStatus\nFROM Fact_Loan_Performance f\nORDER BY f.DefaultRiskScore DESC\nLIMIT 10` },
];

export default function Warehouse() {
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] });
  const [stage, setStage] = useState(0);
  const [vis, visible] = useInView<HTMLDivElement>('100px');
  const [selected, setSelected] = useState<string | null>(null);
  const { data: schema } = useApi<any>('/api/warehouse/schema');
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStage(v < 0.38 ? 0 : v < 0.6 ? 1 : 2));
  const tables = schema?.tables ?? [];
  const sel = tables.find((t: any) => t.name === selected);

  return (
    <div id="warehouse" className="relative scroll-mt-14">
      <div ref={wrap} className="relative h-[320vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div className="absolute inset-0" ref={vis}>
            <Canvas frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 8, 22], fov: 42 }} dpr={[1, 2]}>
              <color attach="background" args={['#04060c']} />
              <fog attach="fog" args={['#04060c', 18, 42]} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[6, 12, 8]} intensity={1.2} />
              <pointLight position={[0, 3, 0]} intensity={30} color="#2ee6c8" distance={12} />
              <WarehouseScene progress={scrollYProgress} tables={tables} selected={selected} onSelect={setSelected} />
            </Canvas>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#04060c_0%,rgba(4,6,12,.6)_30%,transparent_55%)]" />

          <div className="pointer-events-none relative mx-auto flex h-full max-w-[1400px] flex-col justify-center px-4 md:px-8">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-safe/80">
              <span className="rounded border border-safe/30 bg-safe/5 px-2 py-0.5 text-safe">02</span>
              <span>Data warehouse</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={stage} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }} className="mt-4 max-w-md">
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">{STAGES[stage].t}</h2>
                <p className="mt-4 text-base leading-relaxed text-slate-400">{STAGES[stage].d}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex max-w-md flex-wrap gap-2">
              {tables.map((t: any) => (
                <span key={t.name} className="pointer-events-auto">
                  <button onClick={() => setSelected(t.name)} className={`rounded-md border px-2 py-1 font-mono text-[11px] transition ${selected === t.name ? 'border-safe bg-safe/15 text-safe' : 'border-white/10 bg-ink-900/70 text-slate-400 hover:text-white'}`}>
                    {t.name} · {t.rows.toLocaleString()}
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-6 flex gap-1.5">
              {STAGES.map((_, i) => <span key={i} className={`h-1 rounded-full transition-all ${i === stage ? 'w-10 bg-safe' : 'w-4 bg-white/15'}`} />)}
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-slate-600">keep scrolling to walk inside</div>
          </div>

          <AnimatePresence>
            {sel && (
              <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                className="absolute bottom-4 right-4 top-20 w-[min(440px,calc(100%-2rem))] overflow-auto rounded-2xl panel">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{sel.kind} table</div>
                    <div className="font-display text-lg font-semibold text-white">{sel.name}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"><X size={16} /></button>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex gap-2"><Chip tone="safe">{sel.rows.toLocaleString()} rows</Chip><Chip>{sel.columns.length} columns</Chip></div>
                  <div className="space-y-1">
                    {sel.columns.map((c: any) => (
                      <div key={c.name} className="flex items-center justify-between rounded-md bg-white/[0.02] px-2.5 py-1.5 font-mono text-[11px]">
                        <span className="flex items-center gap-2 text-slate-200">
                          {c.pk && <KeyRound size={11} className="text-warn" />}
                          {c.fk && <Link2 size={11} className="text-sky2" />}
                          {c.name}
                        </span>
                        <span className="text-slate-500">{c.fk ? `→ ${c.fk}` : c.type}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">Sample rows</div>
                    <div className="overflow-auto rounded-lg border border-white/5">
                      <table className="data">
                        <thead><tr>{Object.keys(sel.sample[0] ?? {}).map((k) => <th key={k}>{k}</th>)}</tr></thead>
                        <tbody>{sel.sample.map((r: any, i: number) => <tr key={i}>{Object.values(r).map((v: any, j) => <td key={j} className="text-slate-300">{String(v)}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                  {sel.name === 'Dim_Risk_Tier' && (
                    <div className="rounded-lg border border-warn/30 bg-warn/10 p-3 text-[11px] leading-relaxed text-warn">
                      Note: "Critical Risk" is assigned from the historical default flag, so tier and DefaultStatus overlap by construction.
                      Use this tier for reporting only. Never feed it to a model.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-10 md:px-8">
        <SqlConsole />
      </div>
    </div>
  );
}

function SqlConsole() {
  const [q, setQ] = useState(PRESETS[0].q);
  const [res, setRes] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const run = async (query = q) => {
    setBusy(true);
    try { setRes(await api('/api/sql', { query })); } finally { setBusy(false); }
  };
  return (
    <Panel title={<span className="flex items-center gap-2"><Terminal size={13} /> Live SQL console · read-only</span>}
      right={<span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500"><Database size={11} /> loan_dw.db</span>}>
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.name} onClick={() => { setQ(p.q); run(p.q); }} className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-safe/40 hover:text-white">
            {p.name}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <textarea value={q} onChange={(e) => setQ(e.target.value)} spellCheck={false}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); }}
            className="h-56 w-full resize-none rounded-xl border border-white/10 bg-ink-950 p-4 font-mono text-[12px] leading-relaxed text-safe/90 outline-none focus:border-safe/40" />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Ctrl + Enter to run · SELECT / WITH / PRAGMA only</span>
            <Button onClick={() => run()} disabled={busy}><Play size={14} /> Run</Button>
          </div>
        </div>
        <div className="h-[268px] overflow-auto rounded-xl border border-white/5 bg-ink-950/60">
          {!res && <div className="grid h-full place-items-center text-xs text-slate-600">Results appear here</div>}
          {res?.error && <div className="p-4 font-mono text-xs text-risk">{res.error}</div>}
          {res?.columns && (
            <>
              <table className="data w-full">
                <thead><tr>{res.columns.map((c: string) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{res.rows.map((r: any[], i: number) => <tr key={i}>{r.map((v, j) => <td key={j} className="text-slate-300">{v === null ? 'NULL' : String(v)}</td>)}</tr>)}</tbody>
              </table>
              <div className="px-3 py-2 font-mono text-[10px] text-slate-500">{res.rows.length} rows · {res.ms} ms</div>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

