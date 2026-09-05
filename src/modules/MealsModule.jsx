import React, { useState, useRef } from 'react';
import { 
  ChevronDown, ChevronRight, ChevronLeft, X, Camera, Zap, 
  Footprints, Leaf, Waves, Dumbbell, Activity,
  MessageSquare, RefreshCw, AlertTriangle, Play
} from 'lucide-react';

const getSportIcon = (sportName) => {
  const name = (sportName || "").toLowerCase();
  if (name.includes('muscu') || name.includes('poids')) return Dumbbell;
  if (name.includes('corde') || name.includes('hiit') || name.includes('cardio')) return Activity;
  if (name.includes('course') || name.includes('jogging')) return Footprints;
  if (name.includes('natation')) return Waves;
  if (name.includes('yoga') || name.includes('pilates')) return Leaf;
  return Zap;
};

export default function MealsModule({ 
  chatInput, setChatInput, mealPhoto, setMealPhoto, onPhotoUpload, 
  onGenerate, loading, weeklyPlan 
}) {
  const [expandedRows, setExpandedRows] = useState({ breakfast: true, lunch: true, dinner: true, sports: true });
  const [selectedItem, setSelectedItem] = useState(null); 
  const [modalMode, setModalMode] = useState('view'); 
  const [interactionType, setInteractionType] = useState('');
  const [userInput, setUserInput] = useState('');
  
  const scrollRef = useRef(null);

  const toggleRow = (row) => setExpandedRows(prev => ({ ...prev, [row]: !prev[row] }));

  const scrollTable = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openModal = (item, dayIndex, type, dayName) => {
    setSelectedItem({ ...item, dayIndex, itemType: type, dayName });
    setModalMode('view');
    setUserInput('');
  };

  const startInteraction = (type) => {
    setInteractionType(type);
    setModalMode('input');
  };

  const handleGlobalReplan = () => {
    const mealLabel = selectedItem.itemType === 'breakfast' ? 'petit-déjeuner' : selectedItem.itemType === 'lunch' ? 'déjeuner' : selectedItem.itemType === 'dinner' ? 'dîner' : 'sport';
    const contextText = interactionType === 'deviation' 
      ? `J'ai fait un écart le ${selectedItem.dayName} au ${mealLabel} : ${userInput}. Adapte le reste de la semaine.`
      : `Le ${selectedItem.dayName} au ${mealLabel}, ${userInput}. Modifie ceci et ajuste le reste si besoin.`;
    
    setChatInput(contextText);
    setSelectedItem(null); 
    setTimeout(() => { onGenerate(); }, 100); 
  };

  // Rétrocompatibilité avec les anciens plans sauvegardés qui avaient un summary texte
  const summaryWeek = typeof weeklyPlan?.summary === 'string' ? weeklyPlan.summary : weeklyPlan?.summary?.week;
  const summaryToday = weeklyPlan?.summary?.today;

  // Placeholders dynamiques selon le type (Sport vs Alimentaire)
  const isSport = selectedItem?.itemType === 'sport';
  const getPlaceholder = () => {
    if (isSport) return "Ex: Fait 15 min au lieu de 25 / Remplacé par du footing / Pas eu le temps...";
    return "Ex: J'ai mangé une pizza finalement... / Je n'ai plus d'oeufs...";
  };

  return (
    <div className="space-y-6">
      {/* BARRE GLOBALE DE GÉNÉRATION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border-2 border-emerald-100">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw className={`text-emerald-500 ${loading ? 'animate-spin' : ''}`} /> 
          Générateur de Semaine & Ajustements
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" 
            value={chatInput} 
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ex: Génère la semaine, j'ai envie de pâtes..."
            className="flex-1 p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <label className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 cursor-pointer border border-slate-200 transition">
            <Camera size={16} /> {mealPhoto ? "Photo jointe ✓" : "Photo"}
            <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
          </label>
          <button 
            onClick={onGenerate}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? "Calcul en cours..." : <><Play size={16}/> Générer le plan</>}
          </button>
        </div>
      </div>

      {!weeklyPlan ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center text-slate-400 space-y-2 border border-slate-200">
          <p className="font-semibold text-slate-600">Aucun programme généré pour le moment.</p>
          <p className="text-sm">Cliquez sur "Générer le plan" pour créer votre semaine.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* LE MOT DU COACH (Design Amélioré) */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MessageSquare size={80} />
            </div>
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-lg border-b border-emerald-200/50 pb-3 mb-3">
              <MessageSquare size={20} className="text-emerald-600" /> Le mot du coach
            </div>
            <div className="space-y-3 relative z-10">
              {summaryWeek && (
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-emerald-900 block mb-1">Vision de la semaine :</strong> 
                  {summaryWeek}
                </p>
              )}
              {summaryToday && (
                <div className="mt-2 bg-white/70 p-4 rounded-xl border border-teal-100 shadow-sm">
                  <p className="text-sm text-teal-900 leading-relaxed">
                    <strong className="block text-teal-700 mb-1 flex items-center gap-2"><Zap size={16}/> Focus sur Aujourd'hui :</strong> 
                    {summaryToday}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* GRILLE CALENDRIER */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            {/* Header de Navigation du Calendrier */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planning détaillé</span>
              <div className="flex gap-2">
                <button onClick={() => scrollTable('left')} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 shadow-sm">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => scrollTable('right')} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 shadow-sm">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar" ref={scrollRef}>
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 text-xs text-slate-600 uppercase tracking-wide">
                    <th className="p-3 w-32 border-b border-r border-slate-200 font-bold sticky left-0 bg-slate-100 z-10">Catégorie</th>
                    {weeklyPlan.days.map((d, i) => {
                      const isToday = i === 0; 
                      return (
                        <th key={i} className={`p-3 w-44 border-b border-r border-slate-200 text-center ${isToday ? 'bg-indigo-600 text-white border-b-indigo-700 shadow-inner' : ''}`}>
                          <div className="font-bold text-sm">{d.dayName}</div>
                          <div className={`text-[10px] ${isToday ? 'text-indigo-200' : 'font-normal'}`}>{d.dateString}</div>
                          {isToday && <div className="text-[9px] bg-indigo-800 text-white rounded-full px-2 py-0.5 mt-1 inline-block">AUJOURD'HUI</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-800">
                  
                  {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                    <tr key={mealType} className="border-b border-slate-200">
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-700 sticky left-0 bg-white z-10 cursor-pointer shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" onClick={() => toggleRow(mealType)}>
                        <div className="flex items-center gap-2 capitalize">
                          {expandedRows[mealType] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} 
                          {mealType === 'breakfast' ? 'Petit-déj' : mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}
                        </div>
                      </td>
                      {weeklyPlan.days.map((d, i) => (
                        expandedRows[mealType] ? (
                          <td key={i} className={`p-2 border-r border-slate-200 align-top ${i === 0 ? 'bg-indigo-50/30' : ''}`}>
                            {d[mealType] && (
                              <div onClick={() => openModal(d[mealType], i, mealType, d.dayName)} className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl cursor-pointer transition h-full flex flex-col justify-between">
                                <span className="font-bold text-emerald-900">{d[mealType].name}</span>
                                {d[mealType].family && d[mealType].family.length > 0 && <span className="text-[9px] text-indigo-600 mt-1 block">+ {d[mealType].family.length} Adapt.</span>}
                              </div>
                            )}
                          </td>
                        ) : <td key={i} className="border-r border-slate-200 bg-slate-50"></td>
                      ))}
                    </tr>
                  ))}

                  <tr className="border-b-2 border-slate-300">
                    <td className="p-3 border-r border-slate-200 font-bold text-orange-700 sticky left-0 bg-white z-10 cursor-pointer shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" onClick={() => toggleRow('sports')}>
                      <div className="flex items-center gap-2">{expandedRows.sports ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Activité</div>
                    </td>
                    {weeklyPlan.days.map((d, i) => {
                      const sport = d.sports && d.sports[0];
                      const Icon = sport ? getSportIcon(sport.name) : Zap;
                      
                      return expandedRows.sports ? (
                        <td key={i} className={`p-2 border-r border-slate-200 align-top ${i === 0 ? 'bg-indigo-50/30' : ''}`}>
                          {sport && sport.name !== "Repos" ? (
                            <div onClick={() => openModal(sport, i, 'sport', d.dayName)} className="p-2 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition">
                              <div className="font-bold text-orange-900 flex items-center gap-1">
                                <Icon size={12} className="text-orange-600"/> {sport.name}
                              </div>
                              <div className="text-[10px] text-orange-700 mt-1">{sport.duration}</div>
                            </div>
                          ) : (
                            <div onClick={() => openModal({name: "Repos"}, i, 'sport', d.dayName)} className="p-2 text-center text-[10px] text-slate-400 cursor-pointer hover:bg-slate-50 rounded-xl border border-dashed transition">Repos</div>
                          )}
                        </td>
                      ) : <td key={i} className="border-r border-slate-200"></td>;
                    })}
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'AJUSTEMENT */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Détail & Ajustement ({selectedItem.dayName})</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {modalMode === 'view' && (
                <>
                  <div className="space-y-1">
                    <h2 className={`text-xl font-bold ${isSport ? 'text-orange-700' : 'text-emerald-700'}`}>{selectedItem.name}</h2>
                    {selectedItem.portion && <p className="text-sm text-slate-600">Portion : {selectedItem.portion}</p>}
                    {selectedItem.duration && <p className="text-sm text-slate-600">Durée : {selectedItem.duration}</p>}
                  </div>
                  
                  {selectedItem.family && selectedItem.family.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                      <span className="font-bold text-indigo-800 text-xs uppercase mb-1 block">Indications Foyer</span>
                      {selectedItem.family.map((f, idx) => (
                        <p key={idx} className="text-xs text-indigo-700"><strong>{f.member} :</strong> {f.note}</p>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 grid grid-cols-1 gap-2 border-t mt-4">
                    {!isSport && (
                      <button onClick={() => startInteraction('missing')} className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
                        <AlertTriangle size={16} className="text-amber-500" /> Il me manque un ingrédient
                      </button>
                    )}
                    <button onClick={() => startInteraction('change')} className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
                      <RefreshCw size={16} className="text-blue-500" /> Modifier (Envie, changement)
                    </button>
                    <button onClick={() => startInteraction('deviation')} className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
                      <Camera size={16} className={isSport ? "text-orange-500" : "text-purple-500"} /> 
                      Déclarer un écart réalisé
                    </button>
                  </div>
                </>
              )}

              {modalMode === 'input' && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">Précisez votre demande :</label>
                  <textarea 
                    autoFocus rows={3}
                    className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={getPlaceholder()}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                  
                  {interactionType === 'deviation' && !isSport && (
                    <label className="flex items-center justify-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-sm font-bold cursor-pointer transition">
                      <Camera size={16} /> {mealPhoto ? "Photo jointe ✓" : "Joindre une photo du repas"}
                      <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
                    </label>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setModalMode('view')} className="flex-1 p-3 bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">Annuler</button>
                    <button onClick={handleGlobalReplan} disabled={!userInput} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                      <MessageSquare size={16} /> Adapter le plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
