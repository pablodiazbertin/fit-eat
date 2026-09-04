import React from 'react';
import { RefreshCw, Users, Target, CheckSquare, Dumbbell, ShoppingCart } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, familyCount, sportsCount }) {
  const tabs = [
    { id: 'meals', label: 'Planning & Coach', icon: RefreshCw, color: 'emerald' },
    { id: 'family', label: `Foyer (${familyCount})`, icon: Users, color: 'indigo' },
    { id: 'goals', label: 'Objectifs Membres', icon: Target, color: 'amber' },
    { id: 'inventory', label: 'Stocks Frigo', icon: CheckSquare, color: 'blue' },
    { id: 'sports', label: `Catalogue Sports (${sportsCount})`, icon: Dumbbell, color: 'orange' },
    { id: 'grocery', label: 'Courses', icon: ShoppingCart, color: 'purple' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto flex overflow-x-auto text-xs font-bold text-slate-600 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap transition ${
                isActive 
                  ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50/50` 
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
