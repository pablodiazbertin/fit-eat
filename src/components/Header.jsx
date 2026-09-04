import React from 'react';
import { Utensils, Settings } from 'lucide-react';

export default function Header({ onToggleSettings }) {
  return (
    <header className="bg-slate-900 text-white p-5 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-slate-900 font-bold">
            <Utensils size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Fit&Feast Pro</h1>
            <p className="text-xs text-slate-400">Plateforme Synergique Famille, Nutrition & Sport</p>
          </div>
        </div>

        <button 
          onClick={onToggleSettings}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs border border-slate-700 transition"
        >
          <Settings size={16} /> Clé API
        </button>
      </div>
    </header>
  );
}
