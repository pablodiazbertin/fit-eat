import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function GroceryModule({ groceryList }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
      <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
        <ShoppingCart className="text-purple-500" /> Liste de Courses à Acheter
      </h2>
      {groceryList && groceryList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {groceryList.map((item, idx) => (
            <label key={idx} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-medium">
              <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Générez un plan pour afficher la liste de courses.</p>
      )}
    </div>
  );
}
