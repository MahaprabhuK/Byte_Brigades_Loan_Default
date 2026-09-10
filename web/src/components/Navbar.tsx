import React from 'react';
import { 
  BarChart3, 
  Database, 
  BrainCircuit, 
  PieChart, 
  GitMerge, 
  Zap, 
  Menu, 
  X, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';

export type TabType = 'overview' | 'eda' | 'olap' | 'classification' | 'clustering' | 'rules' | 'predictor';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview & KPIs', icon: Layers },
  { id: 'eda', label: 'Data Analysis (EDA)', icon: BarChart3 },
  { id: 'olap', label: 'DW & OLAP Engine', icon: Database },
  { id: 'classification', label: 'ML Benchmarks', icon: BrainCircuit },
  { id: 'clustering', label: 'Borrower Clusters', icon: PieChart },
  { id: 'rules', label: 'Association Rules', icon: GitMerge },
  { id: 'predictor', label: 'Real-Time Predictor', icon: Zap },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-2xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Container */}
        <div className="py-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          
          {/* Top Line: Brand Logo & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5 shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/25">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Layers className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="font-black text-xl sm:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-400 whitespace-nowrap leading-none">
                    Byte Brigades
                  </h1>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full whitespace-nowrap">
                    v2.0 DW/DM
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 whitespace-nowrap font-medium">Loan Default Predictive Analytics</p>
              </div>
            </div>

            {/* Right Status Badge (Mobile/Tablet visible) */}
            <div className="flex items-center space-x-3 xl:hidden">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verified</span>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Flexible Scrollable Navigation Bar (Desktop & Wide Screen) */}
          <nav className="hidden xl:flex items-center space-x-1.5 overflow-x-auto py-1 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Desktop Verified Badge */}
          <div className="hidden xl:flex items-center shrink-0">
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <ShieldCheck className="w-4 h-4" />
              <span>Pipeline Verified</span>
            </div>
          </div>
        </div>

        {/* Scrollable Sub-bar for medium screens (Tablet / Laptop < 1280px) */}
        <div className="hidden sm:flex xl:hidden overflow-x-auto py-2 gap-2 border-t border-slate-900 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden glass-panel border-b border-slate-800 px-4 pt-3 pb-5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-900 border border-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
