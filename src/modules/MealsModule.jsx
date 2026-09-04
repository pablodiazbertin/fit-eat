import React from 'react';
import { RefreshCw, Camera, Dumbbell, Utensils, Layers } from 'lucide-react';

export default function MealsModule({ 
  chatInput, setChatInput, mealPhoto, setMealPhoto, onPhotoUpload, 
  onGenerate, loading, weeklyPlan 
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw className="text-emerald-500" /> Coach Intelligique (Ajustement Dynamique)
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ex: J'ai mangé une pizza ce midi..."
            className="flex-1 p-3 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <label className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 cursor-pointer border border-slate-200 transition">
            <Camera size={16} /> {mealPhoto ? "Photo jointe ✓" : "Photo du repas"}
            <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
          </label>
          <button 
            onClick={onGenerate}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Calcul..." : "Générer / Adapter"}
          </button>
        </div>
      </div>

      {weeklyPlan ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
          <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs border border-emerald-100">
            <strong>Orientation globale :</strong> {weeklyPlan.summary}
          </div>
          <div className="space-y-4">
            {weeklyPlan.days?.map((d, idx) => (
              <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">{d.day}</h3>
                
                {d.sport && (
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-orange-800">
                      <span className="flex items-center gap-1">
                        <Dumbbell size={14} /> {d.sport.type || "Activité"} ({d.sport.duration || "-"})
                      </span>
                      <span className="bg-orange-200 px-2 py-0.5 rounded-full text-[10px]">
                        {d.sport.intensity || "Normale"}
                      </span>
                    </div>
                    <p className="text-slate-600">{d.sport.notes || d.sport.advice || "Séance adaptée à votre planning."}</p>
                  </div>
                )}

                {d.meal && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Utensils size={14} className="text-emerald-600" /> Dîner : {d.meal.name || "Plat équilibré"}
                    </div>
                    <p className="text-slate-700"><strong>Portion principale :</strong> {d.meal.userPortion || "Portion standard"}</p>
                    
                    {d.meal.familyAdjustments && d.meal.familyAdjustments.length > 0 && (
                      <div className="pt-2 border-t space-y-1">
                        <span className="font-bold text-indigo-600 text-[10px] uppercase">Ajustements Foyer :</span>
                        {d.meal.familyAdjustments.map((adj, aIdx) => (
                          <p key={aIdx} className="text-slate-600 pl-2 border-l-2 border-indigo-300">
                            <strong>{adj.member} :</strong> {adj.note}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center text-slate-400 space-y-2">
          <Layers size={40} className="mx-auto text-slate-300" />
          <p className="font-semibold text-slate-600 text-sm">Aucun programme actif</p>
        </div>
      )}
    </div>
  );
}
