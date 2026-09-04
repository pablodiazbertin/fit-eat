import React from 'react';
import { Dumbbell, Plus, Trash2 } from 'lucide-react';

export default function SportsModule({ sportCatalog, setSportCatalog, onAddSport }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Dumbbell className="text-orange-500" /> Catalogue d'Activités Sportives
        </h2>
        <button onClick={onAddSport} className="bg-orange-600 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-bold">
          <Plus size={14} /> Ajouter une activité
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sportCatalog.map((sport) => (
          <div key={sport.id} className="p-4 border border-orange-100 bg-orange-50/20 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <input 
                type="text" 
                value={sport.name} 
                onChange={(e) => setSportCatalog(sportCatalog.map(s => s.id === sport.id ? {...s, name: e.target.value} : s))}
                className="font-bold text-slate-800 bg-transparent border-b outline-none"
              />
              <button onClick={() => setSportCatalog(sportCatalog.filter(s => s.id !== sport.id))} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-semibold block">Catégorie :</label>
                <input 
                  type="text" 
                  value={sport.category} 
                  onChange={(e) => setSportCatalog(sportCatalog.map(s => s.id === sport.id ? {...s, category: e.target.value} : s))}
                  className="w-full p-1.5 border rounded bg-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold block">Durée type :</label>
                <input 
                  type="text" 
                  value={sport.defaultDuration} 
                  onChange={(e) => setSportCatalog(sportCatalog.map(s => s.id === sport.id ? {...s, defaultDuration: e.target.value} : s))}
                  className="w-full p-1.5 border rounded bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-400 font-semibold block">Notes :</label>
              <input 
                type="text" 
                value={sport.notes} 
                onChange={(e) => setSportCatalog(sportCatalog.map(s => s.id === sport.id ? {...s, notes: e.target.value} : s))}
                className="w-full p-1.5 border rounded bg-white"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
