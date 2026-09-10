import React, { useState } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { OverviewTab } from './components/OverviewTab';
import { EdaTab } from './components/EdaTab';
import { OlapTab } from './components/OlapTab';
import { ClassificationTab } from './components/ClassificationTab';
import { ClusteringTab } from './components/ClusteringTab';
import { AssociationRulesTab } from './components/AssociationRulesTab';
import { PredictorTab } from './components/PredictorTab';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16 lg:pb-0">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'eda' && <EdaTab />}
        {activeTab === 'olap' && <OlapTab />}
        {activeTab === 'classification' && <ClassificationTab />}
        {activeTab === 'clustering' && <ClusteringTab />}
        {activeTab === 'rules' && <AssociationRulesTab />}
        {activeTab === 'predictor' && <PredictorTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4">
          <p>Byte Brigades © 2026 — End-to-End Data Warehousing & Data Mining System</p>
          <p className="mt-1 text-slate-600">Built with React, Tailwind CSS, Recharts & Vercel Serverless Architecture</p>
        </div>
      </footer>

      {/* Mobile Handheld Bottom Navigation Bar */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
