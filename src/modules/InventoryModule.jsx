import React from 'react';
import { CheckSquare } from 'lucide-react';

export default function InventoryModule({ inventory, setInventory }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
      <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
        <CheckSquare className="text-blue-500" /> Gestion des Stocks Frigo & Placards
      </h2>
      <textarea 
        rows={6}
        value={inventory}
        onChange={(e) => setInventory(e.target.value)}
        className="w-full p-4 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
