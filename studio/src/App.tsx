import { useState } from 'react';
import Nav from './components/Nav';
import { MotionCtx } from './lib/util';
import Hero from './sections/Hero';
import Preprocess from './sections/Preprocess';
import Warehouse from './sections/Warehouse';
import Olap from './sections/Olap';
import Classification from './sections/Classification';
import Clustering from './sections/Clustering';
import Association from './sections/Association';
import Prediction from './sections/Prediction';

export default function App() {
  const [fast, setFast] = useState(false);
  return (
    <MotionCtx.Provider value={{ fast, setFast }}>
      <div className="pointer-events-none fixed inset-0 grid-bg" />
      <Nav />
      <main className="relative">
        <Hero />
        <Preprocess />
        <Warehouse />
        <Olap />
        <Classification />
        <Clustering />
        <Association />
        <Prediction />
      </main>
      <footer className="relative border-t border-white/5 py-10 text-center">
        <div className="font-display text-lg text-white">Byte Brigades</div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
          CSI3010 · Data Warehousing &amp; Data Mining · Loan Default Studio
        </div>
        <div className="mx-auto mt-3 max-w-xl text-[11px] text-slate-600">
          Dataset: 50,000-row synthetic benchmark generated to the Kaggle Loan Default schema (18 attributes). Every
          number on this page is computed live by the project&apos;s Python backend.
        </div>
      </footer>
    </MotionCtx.Provider>
  );
}
