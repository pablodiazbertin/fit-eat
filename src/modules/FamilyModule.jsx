import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';

export default function FamilyModule({ family, setFamily, onAddMember, onRemoveMember }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="text-indigo-500" /> Composition de la Famille
        </h2>
        <button onClick={onAddMember} className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-bold">
          <Plus size={14} /> Ajouter un membre
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {family.map((member) => (
          <div key={member.id} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <input 
                type="text" 
                value={member.name} 
                onChange={(e) => setFamily(family.map(m => m.id === member.id ? {...m, name: e.target.value} : m))}
                className="font-bold text-slate-800 bg-transparent border-b border-slate-300 outline-none text-sm"
              />
              <button onClick={() => onRemoveMember(member.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block">Rôle :</label>
                <input 
                  type="text" 
                  value={member.role} 
                  onChange={(e) => setFamily(family.map(m => m.id === member.id ? {...m, role: e.target.value} : m))}
                  className="w-full p-1.5 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold block">Âge :</label>
                <input 
                  type="number" 
                  value={member.age} 
                  onChange={(e) => setFamily(family.map(m => m.id === member.id ? {...m, age: parseInt(e.target.value) || 0} : m))}
                  className="w-full p-1.5 border rounded-lg bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-400 font-semibold block text-xs">Aversions / Spécificités :</label>
              <input 
                type="text" 
                value={member.notes} 
                onChange={(e) => setFamily(family.map(m => m.id === member.id ? {...m, notes: e.target.value} : m))}
                className="w-full p-1.5 text-xs border rounded-lg bg-white"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
