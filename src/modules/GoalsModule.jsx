import React from 'react';
import { Target } from 'lucide-react';

export default function GoalsModule({ family, goals, setGoals }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
      <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
        <Target className="text-amber-500" /> Objectifs Personnalisés par Membre
      </h2>
      <div className="space-y-4">
        {family.map((member) => (
          <div key={member.id} className="p-4 border border-amber-100 bg-amber-50/30 rounded-xl space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">{member.name} ({member.role})</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Type d'objectif :</label>
                <input 
                  type="text" 
                  value={goals[member.id]?.type || ''} 
                  onChange={(e) => setGoals({...goals, [member.id]: {...goals[member.id], type: e.target.value}})}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Cible / Précisions :</label>
                <input 
                  type="text" 
                  value={goals[member.id]?.target || ''} 
                  onChange={(e) => setGoals({...goals, [member.id]: {...goals[member.id], target: e.target.value}})}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-500 block mb-1">Régime / Orientation :</label>
                <input 
                  type="text" 
                  value={goals[member.id]?.diet || ''} 
                  onChange={(e) => setGoals({...goals, [member.id]: {...goals[member.id], diet: e.target.value}})}
                  className="w-full p-2 border rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
