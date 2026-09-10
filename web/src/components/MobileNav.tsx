import React from 'react';
import { TabType, navItems } from './Navbar';

interface MobileNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  // Select top 4 key tabs for bottom bar
  const mainTabs = navItems.filter(item => ['overview', 'olap', 'classification', 'predictor'].includes(item.id));

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-800 bg-slate-950/90 backdrop-blur-xl px-2 py-1.5">
      <div className="flex items-center justify-around">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all ${
                isActive ? 'text-blue-400 font-semibold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
