import React from 'react';
import { Key } from 'lucide-react';

export default function ApiKeyBanner({ apiKey, setApiKey, onSave }) {
  return (
    <div className="max-w-6xl mx-auto my-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
      <div className="font-bold text-amber-900 flex items-center gap-2">
        <Key size={16} /> Configuration Clé API Google AI Studio
      </div>
      <div className="flex gap-2">
        <input 
          type="password" 
          placeholder="Collez votre clé API Gemini..." 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)}
          className="flex-1 p-2 border rounded-xl bg-white outline-none"
        />
        <button onClick={() => onSave(apiKey)} className="bg-amber-800 text-white px-4 py-2 rounded-xl font-bold">
          Enregistrer
        </button>
      </div>
    </div>
  );
}
