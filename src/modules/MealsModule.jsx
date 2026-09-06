import React, { useState, useRef } from 'react';
import { 
  ChevronDown, ChevronRight, ChevronLeft, X, Camera, Zap, 
  Footprints, Leaf, Waves, Dumbbell, Activity,
  MessageSquare, RefreshCw, AlertTriangle, Play, Edit3, CheckCircle
} from 'lucide-react';
import { adaptSingleItem } from '../services/geminiService';

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
  onGenerate, loading, weeklyPlan, setWeeklyPlan 
}) {
  const [expandedRows, setExpandedRows] = useState({ breakfast: true, lunch: true, dinner: true, sports: true });
  
  // États de la modale
  const [selectedItem, setSelectedItem] = useState(null); 
  // Modes: view, edit_menu, input_local, loading_local, proposal_local
  const [modalMode, setModalMode] = useState('view'); 
  const [interactionType, setInteractionType] = useState('');
  const [userInput, setUserInput] = useState('');
  const [localProposal, setLocalProposal] = useState(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  
  const scrollRef = useRef(null);

  const toggleRow = (row) => setExpandedRows(prev => ({ ...prev, [row]: !prev[row] }));
  const scrollTable = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const openModal = (item, dayIndex, type, dayName) => {
    setSelectedItem({ ...item, dayIndex, itemType: type, dayName });
    setModalMode('view');
    setUserInput('');
    setLocalProposal(null);
  };

  // --- LOGIQUE TEMPORELLE ---
  // Pour l'instant, on se base sur l'index (0 = Aujourd'hui)
  const isPast = selectedItem?.dayIndex < 0;
  const isToday = selectedItem?.dayIndex === 0;
  const isFuture = selectedItem?.dayIndex > 0;
  const isSport = selectedItem?.itemType === 'sport';
  const isRestaurant = selectedItem?.name?.toLowerCase().includes('restaurant');

  // --- PLACEHOLDERS DYNAMIQUES ---
  const getPlaceholder = () => {
    if (isSport) {
      if (interactionType === 'deviation') return "Ex: J'ai fait 30 min de course à la place / Pas eu le temps de le faire...";
      return "Ex: Je n'aurai que 10 minutes / Je n'ai que ma corde rapide aujourd'hui...";
    }
    if (interactionType === 'missing') return "Ex: Je n'ai plus d'œufs...";
    if (interactionType === 'change') return "Ex: Je n'ai pas envie de poisson / Finalement je dîne au restaurant...";
    return "Ex: J'ai finalement mangé une pizza...";
  };

  // --- ACTION : ADAPTATION UNITAIRE LOCALE ---
  const handleLocalSubmit = async () => {
    setIsLocalLoading(true);
    setModalMode('loading_local');
    
    try {
      const apiKey = localStorage.getItem('gemini_api_key');
      const inventory = localStorage.getItem('fe_inventory');
      
      const proposal = await adaptSingleItem({
        apiKey,
        item: selectedItem,
        itemType: selectedItem.itemType,
        userInput,
        inventory
      });
      
      setLocalProposal(proposal);
      setModalMode('proposal_local');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'adaptation.");
      setModalMode('input_local');
    } finally {
      setIsLocalLoading(false);
    }
  };

  // --- ACTION : VALIDATION DE LA PROPOSITION ---
  const acceptLocalProposal = () => {
    // 1. Mettre à jour l'élément dans l'état local
    const updatedPlan = { ...weeklyPlan };
    if (isSport) {
      updatedPlan.days[selectedItem.dayIndex].sports[0] = localProposal;
    } else {
      updatedPlan.days[selectedItem.dayIndex][selectedItem.itemType] = localProposal;
    }
    
    // 2. Fermer la modale
    setSelectedItem(null);
    
    // 3. (Optionnel) Déclencher une regénération globale silencieuse en fond
    // On passe un mot clé spécial pour que App.jsx le gère en mode silencieux plus tard
    // onGenerate({ silentUpdate: true }); 
  };

  const summaryWeek = typeof weeklyPlan?.summary === 'string' ? weeklyPlan.summary : weeklyPlan?.summary?.week;
  const summaryToday = weeklyPlan?.summary?.today;

  return (
    <div className="space-y-6">
      
      {/* BARRE GLOBALE DE GÉNÉRATION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border-2 border-emerald-100">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw className={`text-emerald-500 ${loading ? 'animate-spin' : ''}`} /> 
          Générateur de Semaine
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input 
            type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ex: Génère la semaine, j'ai envie de pâtes..."
            className="flex-1 p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <label className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 cursor-pointer border transition">
            <Camera size={16} /> {mealPhoto ? "Photo jointe ✓" : "Photo"}
            <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
          </label>
          <button 
            onClick={() => onGenerate()} disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? "Calcul en cours..." : <><Play size={16}/> Lancer le plan</>}
          </button>
        </div>
      </div>

      {!weeklyPlan ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center text-slate-400 space-y-2 border">
          <p className="font-semibold text-slate-600">Aucun programme généré.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* LE MOT DU COACH */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><MessageSquare size={80} /></div>
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-lg border-b border-emerald-200/50 pb-3 mb-3">
              <MessageSquare size={20} className="text-emerald-600" /> Le mot du coach
            </div>
            <div className="space-y-3 relative z-10">
              {summaryWeek && <p className="text-sm text-slate-700 leading-relaxed"><strong className="text-emerald-900 block mb-1">Vision de la semaine :</strong> {summaryWeek}</p>}
              {summaryToday && (
                <div className="mt-2 bg-white/70 p-4 rounded-xl border border-teal-100 shadow-sm">
                  <p className="text-sm text-teal-900 leading-relaxed"><strong className="block text-teal-700 mb-1 flex items-center gap-2"><Zap size={16}/> Focus sur Aujourd'hui :</strong> {summaryToday}</p>
                </div>
              )}
            </div>
          </div>

          {/* GRILLE CALENDRIER */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planning détaillé</span>
              <div className="flex gap-2">
                <button onClick={() => scrollTable('left')} className="p-1.5 bg-white border rounded-lg hover:bg-slate-100 text-slate-600 shadow-sm"><ChevronLeft size={16} /></button>
                <button onClick={() => scrollTable('right')} className="p-1.5 bg-white border rounded-lg hover:bg-slate-100 text-slate-600 shadow-sm"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar" ref={scrollRef}>
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 text-xs text-slate-600 uppercase tracking-wide">
                    <th className="p-3 w-32 border-b border-r sticky left-0 bg-slate-100 z-10">Catégorie</th>
                    {weeklyPlan.days.map((d, i) => (
                      <th key={i} className={`p-3 w-44 border-b border-r text-center ${i === 0 ? 'bg-indigo-600 text-white' : ''}`}>
                        <div className="font-bold text-sm">{d.dayName}</div>
                        <div className={`text-[10px] ${i === 0 ? 'text-indigo-200' : 'font-normal'}`}>{d.dateString}</div>
                        {i === 0 && <div className="text-[9px] bg-indigo-800 text-white rounded-full px-2 py-0.5 mt-1 inline-block">AUJOURD'HUI</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-800">
                  {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                    <tr key={mealType} className="border-b">
                      <td className="p-3 border-r font-bold text-slate-700 sticky left-0 bg-white z-10 cursor-pointer shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" onClick={() => toggleRow(mealType)}>
                        <div className="flex items-center gap-2 capitalize">{expandedRows[mealType] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} {mealType === 'breakfast' ? 'Petit-déj' : mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}</div>
                      </td>
                      {weeklyPlan.days.map((d, i) => (
                        expandedRows[mealType] ? (
                          <td key={i} className={`p-2 border-r align-top ${i === 0 ? 'bg-indigo-50/30' : ''}`}>
                            {d[mealType] && (
                              <div onClick={() => openModal(d[mealType], i, mealType, d.dayName)} className={`p-2 hover:bg-emerald-100 border rounded-xl cursor-pointer transition h-full flex flex-col justify-between ${d[mealType].name.includes('Restaurant') ? 'bg-purple-50 border-purple-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <span className="font-bold text-emerald-900">{d[mealType].name}</span>
                              </div>
                            )}
                          </td>
                        ) : <td key={i} className="border-r bg-slate-50"></td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b-2">
                    <td className="p-3 border-r font-bold text-orange-700 sticky left-0 bg-white z-10 cursor-pointer" onClick={() => toggleRow('sports')}>
                      <div className="flex items-center gap-2">{expandedRows.sports ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Activité</div>
                    </td>
                    {weeklyPlan.days.map((d, i) => {
                      const sport = d.sports && d.sports[0];
                      const Icon = sport ? getSportIcon(sport.name) : Zap;
                      return expandedRows.sports ? (
                        <td key={i} className={`p-2 border-r align-top ${i === 0 ? 'bg-indigo-50/30' : ''}`}>
                          {sport && sport.name !== "Repos" ? (
                            <div onClick={() => openModal(sport, i, 'sport', d.dayName)} className="p-2 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition">
                              <div className="font-bold text-orange-900 flex items-center gap-1"><Icon size={12} className="text-orange-600"/> {sport.name}</div>
                            </div>
                          ) : (
                            <div onClick={() => openModal({name: "Repos"}, i, 'sport', d.dayName)} className="p-2 text-center text-[10px] text-slate-400 cursor-pointer hover:bg-slate-50 rounded-xl border border-dashed transition">Repos</div>
                          )}
                        </td>
                      ) : <td key={i} className="border-r"></td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'INTERACTION ITÉRATIVE */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {modalMode === 'view' ? "Détail" : "Ajustement unitaire"}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* VUE DÉTAIL */}
              {modalMode === 'view' && (
                <>
                  <div className="space-y-3">
                    <h2 className={`text-2xl font-bold ${isSport ? 'text-orange-700' : 'text-emerald-700'}`}>{selectedItem.name}</h2>
                    {(selectedItem.recipe || selectedItem.program) && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <strong className="block text-xs uppercase text-slate-500 mb-2">{isSport ? "Programme" : "Préparation"}</strong>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedItem.recipe || selectedItem.program}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t mt-4">
                    <button onClick={() => setModalMode('edit_menu')} className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition">
                      <Edit3 size={16} /> Modifier ou Signaler
                    </button>
                  </div>
                </>
              )}

              {/* MENU DE CHOIX CONDITIONNEL (Passé / Présent / Futur) */}
              {modalMode === 'edit_menu' && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 text-center">Que souhaitez-vous faire ?</p>
                  
                  {isRestaurant && (isPast || isToday) && (
                    <button onClick={() => { setInteractionType('deviation'); setModalMode('input_local'); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Camera size={18} /></div>
                      <div>
                        <div className="font-bold text-sm">Déclarer le plat mangé au restaurant</div>
                        <div className="text-xs text-slate-500">Mettre à jour l'historique</div>
                      </div>
                    </button>
                  )}

                  {!isSport && (isFuture || isToday) && !isRestaurant && (
                    <button onClick={() => { setInteractionType('missing'); setModalMode('input_local'); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><AlertTriangle size={18} /></div>
                      <div>
                        <div className="font-bold text-sm">Ingrédient manquant</div>
                        <div className="text-xs text-slate-500">Adapter cette recette</div>
                      </div>
                    </button>
                  )}
                  
                  {(isFuture || isToday) && (
                    <button onClick={() => { setInteractionType('change'); setModalMode('input_local'); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><RefreshCw size={18} /></div>
                      <div>
                        <div className="font-bold text-sm">Changement de plan {isSport && " / d'envie"}</div>
                        <div className="text-xs text-slate-500">Générer une alternative pour ce jour</div>
                      </div>
                    </button>
                  )}

                  {(isPast || isToday) && !isRestaurant && (
                    <button onClick={() => { setInteractionType('deviation'); setModalMode('input_local'); }} className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left border">
                      <div className={`p-2 rounded-lg ${isSport ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                        {isSport ? <CheckCircle size={18} /> : <Camera size={18} />}
                      </div>
                      <div>
                        <div className="font-bold text-sm">Déclarer un écart réalisé</div>
                        <div className="text-xs text-slate-500">Renseigner ce qui a été fait</div>
                      </div>
                    </button>
                  )}
                  
                  <button onClick={() => setModalMode('view')} className="w-full mt-2 p-3 text-slate-500 font-bold hover:text-slate-700">Retour</button>
                </div>
              )}

              {/* SAISIE & CHARGEMENT LOCAL */}
              {modalMode === 'input_local' && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">Précisez :</label>
                  <textarea 
                    autoFocus rows={3}
                    className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                    placeholder={getPlaceholder()}
                    value={userInput} onChange={(e) => setUserInput(e.target.value)}
                  />
                  
                  {interactionType === 'deviation' && !isSport && (
                    <label className="flex items-center justify-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border rounded-xl text-sm font-bold cursor-pointer">
                      <Camera size={16} /> {mealPhoto ? "Photo jointe ✓" : "Joindre photo"}
                      <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
                    </label>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setModalMode('edit_menu')} className="flex-1 p-3 bg-slate-100 font-bold rounded-xl text-sm hover:bg-slate-200">Retour</button>
                    <button onClick={handleLocalSubmit} disabled={!userInput} className="flex-[2] flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                      Demander à l'IA
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'loading_local' && (
                <div className="py-12 flex flex-col items-center space-y-4 text-emerald-600">
                  <RefreshCw size={32} className="animate-spin" />
                  <p className="font-bold text-sm">Ajustement en cours...</p>
                </div>
              )}

              {/* VALIDATION DE LA PROPOSITION LOCALE */}
              {modalMode === 'proposal_local' && localProposal && (
                <div className="space-y-4 animate-fade-in">
                  <div className={`p-4 rounded-xl border relative ${isSport ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`absolute -top-3 -right-2 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm ${isSport ? 'bg-orange-500' : 'bg-emerald-500'}`}>Nouveau</div>
                    <h3 className={`font-bold text-lg mb-2 ${isSport ? 'text-orange-900' : 'text-emerald-900'}`}>{localProposal.name}</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{localProposal.recipe || localProposal.program}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setModalMode('input_local')} className="flex-1 p-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm border hover:bg-slate-200">Autre chose</button>
                    <button onClick={acceptLocalProposal} className="flex-[2] flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-emerald-700">
                      <CheckCircle size={16} /> Valider l'ajustement
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
