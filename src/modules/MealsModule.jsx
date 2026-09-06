import React, { useState, useRef } from 'react';
import { 
  ChevronDown, ChevronRight, ChevronLeft, X, Camera, Zap, 
  Footprints, Leaf, Waves, Dumbbell, Activity,
  MessageSquare, RefreshCw, AlertTriangle, Play, Edit3
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
  // Modes: 'view' (consultation), 'edit_menu' (choix du type de modification), 'input' (saisie texte/photo)
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

  const summaryWeek = typeof weeklyPlan?.summary === 'string' ? weeklyPlan.summary : weeklyPlan?.summary?.week;
  const summaryToday = weeklyPlan?.summary?.today;

  const isSport = selectedItem?.itemType === 'sport';
  const getPlaceholder = () => {
    if (isSport) return "Ex: Fait 15 min au lieu de 25 / Remplacé par du footing / Pas eu le temps...";
    return "Ex: J'ai mangé une pizza finalement... / Je n'ai plus d'oeufs...";
  };

  return (
    <div className="space-y-6">
      {/* BARRE GLOBALE */}
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
          
          {/* LE MOT DU COACH */}
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
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planning détaillé</span>
              <div className="flex gap-2">
                <button onClick={() => scrollTable('left')} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 shadow-sm"><ChevronLeft size={16} /></button>
                <button onClick={() => scrollTable('right')} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 shadow-sm"><ChevronRight size={16} /></button>
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

      {/* MODALE D'AJUSTEMENT (UX en 3 étapes) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {modalMode === 'view' ? `Détail du programme (${selectedItem.dayName})` : `Modification (${selectedItem.dayName})`}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* ÉTAPE 1 : CONSULTATION ÉPURÉE */}
              {modalMode === 'view' && (
                <>
                  <div className="space-y-3">
                    <h2 className={`text-2xl font-bold ${isSport ? 'text-orange-700' : 'text-emerald-700'}`}>{selectedItem.name}</h2>
                    
                    <div className="flex gap-4 border-b pb-3">
                      {selectedItem.portion && <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">Portion : {selectedItem.portion}</div>}
                      {selectedItem.duration && <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">Durée : {selectedItem.duration}</div>}
                    </div>

                    {/* Nouveau champ : Programme ou Recette */}
                    {(selectedItem.recipe || selectedItem.program) && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <strong className="block text-xs uppercase text-slate-500 mb-2">
                          {isSport ? "Programme de la séance" : "Instructions de préparation"}
                        </strong>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {selectedItem.recipe || selectedItem.program}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {selectedItem.family && selectedItem.family.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mt-4">
                      <span className="font-bold text-indigo-800 text-xs uppercase mb-2 block">Indications Foyer</span>
                      <ul className="space-y-2">
                        {selectedItem.family.map((f, idx) => (
                          <li key={idx} className="text-sm text-indigo-800 flex items-start gap-2">
                            <span className="font-bold min-w-[80px]">{f.member} :</span> 
                            <span>{f.note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bouton Unique d'Action */}
                  <div className="pt-4 border-t mt-4">
                    <button 
                      onClick={() => setModalMode('edit_menu')} 
                      className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-sm"
                    >
                      <Edit3 size={16} /> Modifier ou Signaler un écart
                    </button>
                  </div>
                </>
              )}

              {/* ÉTAPE 2 : CHOIX DU TYPE DE MODIFICATION */}
              {modalMode === 'edit_menu' && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-700 mb-4 text-center">Que souhaitez-vous signaler au coach ?</p>
                  
                  {!isSport && (
                    <button onClick={() => startInteraction('missing')} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition text-left">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><AlertTriangle size={18} /></div>
                      <div>
                        <div className="font-bold">Il me manque un ingrédient</div>
                        <div className="text-xs text-slate-500 font-normal">Adapter la recette avec vos stocks</div>
                      </div>
                    </button>
                  )}
                  
                  <button onClick={() => startInteraction('change')} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition text-left">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><RefreshCw size={18} /></div>
                    <div>
                      <div className="font-bold">Changement d'envie ou de plan</div>
                      <div className="text-xs text-slate-500 font-normal">Demander une autre proposition à l'IA</div>
                    </div>
                  </button>

                  <button onClick={() => startInteraction('deviation')} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold transition text-left">
                    <div className={`p-2 rounded-lg ${isSport ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                      <Camera size={18} />
                    </div>
                    <div>
                      <div className="font-bold">Déclarer un écart réalisé</div>
                      <div className="text-xs text-slate-500 font-normal">Renseigner ce que vous avez vraiment fait</div>
                    </div>
                  </button>
                  
                  <button onClick={() => setModalMode('view')} className="w-full mt-4 p-3 text-slate-500 text-sm font-bold hover:text-slate-700 text-center">
                    Retour
                  </button>
                </div>
              )}

              {/* ÉTAPE 3 : SAISIE TEXTE / PHOTO */}
              {modalMode === 'input' && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">Précisez votre demande :</label>
                  <textarea 
                    autoFocus rows={3}
                    className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                    placeholder={getPlaceholder()}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                  
                  {interactionType === 'deviation' && !isSport && (
                    <label className="flex items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-sm font-bold cursor-pointer transition">
                      <Camera size={18} /> {mealPhoto ? "Photo jointe avec succès ✓" : "Joindre une photo de votre repas"}
                      <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
                    </label>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setModalMode('edit_menu')} className="flex-1 p-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200">Retour</button>
                    <button onClick={handleGlobalReplan} disabled={!userInput} className="flex-[2] flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50">
                      <MessageSquare size={16} /> Envoyer au coach
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
