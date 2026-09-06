import React, { useState, useRef } from 'react';
import { 
  ChevronDown, ChevronRight, ChevronLeft, X, Camera, Zap, 
  Footprints, Leaf, Waves, Dumbbell, Activity,
  MessageSquare, RefreshCw, AlertTriangle, Play, CheckCircle, MapPin, CalendarClock
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
  const [selectedItem, setSelectedItem] = useState(null); 
  // Modes: view, input_local, loading_local, proposal_local, reschedule_sport
  const [modalMode, setModalMode] = useState('view'); 
  const [interactionType, setInteractionType] = useState('');
  const [userInput, setUserInput] = useState('');
  const [localProposal, setLocalProposal] = useState(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const scrollRef = useRef(null);

  const toggleRow = (row) => setExpandedRows(prev => ({ ...prev, [row]: !prev[row] }));
  const scrollTable = (dir) => scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });

  const openModal = (item, dayIndex, type, dayName) => {
    setSelectedItem({ ...item, dayIndex, itemType: type, dayName });
    setModalMode('view');
    setUserInput('');
    setLocalProposal(null);
  };

  const isPast = selectedItem?.dayIndex < 0;
  const isToday = selectedItem?.dayIndex === 0;
  const isFuture = selectedItem?.dayIndex > 0;
  const isSport = selectedItem?.itemType === 'sport';
  const isOutside = selectedItem?.isOutside || selectedItem?.name?.toLowerCase().includes('restaurant');

  // TRADUCTION DES TYPES
  const mealLabel = selectedItem?.itemType === 'breakfast' ? 'Petit-déjeuner' : 
                    selectedItem?.itemType === 'lunch' ? 'Déjeuner' : 
                    selectedItem?.itemType === 'dinner' ? 'Dîner' : 'Activité sportive';

  // ACTIONS SPORT
  const handleCancelSport = () => {
    const newPlan = { ...weeklyPlan };
    const sportsArr = newPlan.days[selectedItem.dayIndex].sports;
    if (sportsArr.length > 1) {
      newPlan.days[selectedItem.dayIndex].sports = sportsArr.filter(s => s.name !== selectedItem.name);
    } else {
      newPlan.days[selectedItem.dayIndex].sports = [{ name: "Repos", duration: "-", intensity: "-", program: "" }];
    }
    setWeeklyPlan(newPlan);
    setSelectedItem(null);
  };

  const handleRescheduleSport = (targetIndex, mode) => {
    const newPlan = { ...weeklyPlan };
    const sportToMove = { ...selectedItem };
    delete sportToMove.dayIndex; delete sportToMove.itemType; delete sportToMove.dayName;
    
    // Retirer du jour d'origine
    const originalSports = newPlan.days[selectedItem.dayIndex].sports;
    if (originalSports.length > 1) {
      newPlan.days[selectedItem.dayIndex].sports = originalSports.filter(s => s.name !== selectedItem.name);
    } else {
      newPlan.days[selectedItem.dayIndex].sports = [{ name: "Repos", duration: "-", intensity: "-", program: "" }];
    }
    
    // Ajouter au jour cible
    if (mode === 'replace' || !newPlan.days[targetIndex].sports || newPlan.days[targetIndex].sports[0].name === "Repos") {
      newPlan.days[targetIndex].sports = [sportToMove];
    } else {
      newPlan.days[targetIndex].sports.push(sportToMove);
    }
    setWeeklyPlan(newPlan);
    setSelectedItem(null); // FERMETURE IMMÉDIATE DU POP-UP
  };

  // APPEL IA LOCAL
  const handleLocalSubmit = async () => {
    setIsLocalLoading(true); setModalMode('loading_local');
    try {
      const proposal = await adaptSingleItem({
        apiKey: localStorage.getItem('gemini_api_key'),
        item: selectedItem, itemType: selectedItem.itemType,
        userInput, interactionType, inventory: localStorage.getItem('fe_inventory')
      });
      setLocalProposal(proposal);
      setModalMode('proposal_local');
    } catch (err) {
      alert("Erreur de format depuis l'IA. Essayez une consigne plus courte.");
      setModalMode('input_local');
    } finally {
      setIsLocalLoading(false);
    }
  };

  const acceptLocalProposal = (triggerGlobalReplan) => {
    const updatedPlan = { ...weeklyPlan };
    if (isSport) {
      const sportsArr = updatedPlan.days[selectedItem.dayIndex].sports;
      const targetIdx = sportsArr.findIndex(s => s.name === selectedItem.name);
      if(targetIdx >= 0) sportsArr[targetIdx] = localProposal.item;
      else sportsArr[0] = localProposal.item;
    } else {
      updatedPlan.days[selectedItem.dayIndex][selectedItem.itemType] = localProposal.item;
    }
    setWeeklyPlan(updatedPlan);
    setSelectedItem(null);
    
    if (triggerGlobalReplan) {
      setChatInput(`Suite à mon changement sur le ${mealLabel} du ${selectedItem.dayName}, réajuste la suite.`);
      setTimeout(() => onGenerate(), 300);
    }
  };

  const getPlaceholder = () => {
    if (interactionType === 'sport_modify') return "Ex: Je n'aurai que 10 minutes / Je n'ai pas mes cordes...";
    if (interactionType === 'missing') return "Ex: Je n'ai plus d'œufs...";
    if (interactionType === 'change') return "Ex: Je n'ai pas envie de poisson / Finalement au resto...";
    if (interactionType === 'deviation') return "Ex: J'ai mangé une pizza finalement...";
    return "";
  };

  const summaryWeek = typeof weeklyPlan?.summary === 'string' ? weeklyPlan.summary : weeklyPlan?.summary?.week;
  const summaryToday = weeklyPlan?.summary?.today;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border-2 border-emerald-100">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw className={`text-emerald-500 ${loading ? 'animate-spin' : ''}`} /> Générateur Global
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Instruction globale..." className="flex-1 p-3 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"/>
          <button onClick={() => onGenerate()} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition flex items-center gap-2">
            {loading ? "Calcul en cours..." : <><Play size={16}/> Lancer le plan</>}
          </button>
        </div>
      </div>

      {!weeklyPlan ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center text-slate-400 border"><p className="font-semibold text-slate-600">Aucun programme généré.</p></div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-lg border-b border-emerald-200/50 pb-3 mb-3"><MessageSquare size={20} className="text-emerald-600" /> Le mot du coach</div>
            <div className="space-y-3 relative z-10">
              {summaryWeek && <p className="text-sm text-slate-700"><strong className="text-emerald-900 block mb-1">Vision de la semaine :</strong> {summaryWeek}</p>}
              {summaryToday && <div className="mt-2 bg-white/70 p-4 rounded-xl border border-teal-100"><p className="text-sm text-teal-900"><strong className="block text-teal-700 mb-1 flex items-center gap-2"><Zap size={16}/> Focus Aujourd'hui :</strong> {summaryToday}</p></div>}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planning détaillé</span>
              <div className="flex gap-2">
                <button onClick={() => scrollTable('left')} className="p-1.5 bg-white border rounded-lg hover:bg-slate-100"><ChevronLeft size={16} /></button>
                <button onClick={() => scrollTable('right')} className="p-1.5 bg-white border rounded-lg hover:bg-slate-100"><ChevronRight size={16} /></button>
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
                      {weeklyPlan.days.map((d, i) => {
                        const meal = d[mealType];
                        const outside = meal?.isOutside || meal?.name?.toLowerCase().includes('restaurant');
                        return expandedRows[mealType] ? (
                          <td key={i} className={`p-2 border-r align-top ${i === 0 ? 'bg-indigo-50/30' : ''}`}>
                            {meal && (
                              <div onClick={() => openModal(meal, i, mealType, d.dayName)} className={`p-2 border rounded-xl cursor-pointer transition h-full flex flex-col justify-between ${outside ? 'bg-slate-100 border-slate-300' : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}>
                                <span className={`font-bold ${outside ? 'text-slate-700 flex items-center gap-1' : 'text-emerald-900'}`}>
                                  {outside && <MapPin size={12}/>} {meal.name}
                                </span>
                              </div>
                            )}
                          </td>
                        ) : <td key={i} className="border-r bg-slate-50"></td>
                      })}
                    </tr>
                  ))}
                  <tr className="border-b-2">
                    <td className="p-3 border-r font-bold text-orange-700 sticky left-0 bg-white z-10 cursor-pointer" onClick={() => toggleRow('sports')}>
                      <div className="flex items-center gap-2">{expandedRows.sports ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Activité</div>
                    </td>
                    {weeklyPlan.days.map((d, i) => (
                      expandedRows.sports ? (
                        <td key={i} className={`p-2 border-r align-top ${i === 0 ? 'bg-indigo-50/30' : ''}`}>
                          {d.sports.map((sport, sIdx) => {
                            const Icon = sport.name !== "Repos" ? getSportIcon(sport.name) : Zap;
                            return sport.name !== "Repos" ? (
                              <div key={sIdx} onClick={() => openModal(sport, i, 'sport', d.dayName)} className="p-2 mb-1 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition">
                                <div className="font-bold text-orange-900 flex items-center gap-1"><Icon size={12} className="text-orange-600"/> {sport.name}</div>
                                {sport.duration && <div className="text-[10px] text-orange-700 mt-1">{sport.duration}</div>}
                              </div>
                            ) : (
                              <div key={sIdx} onClick={() => openModal({name: "Repos"}, i, 'sport', d.dayName)} className="p-2 text-center text-[10px] text-slate-400 cursor-pointer hover:bg-slate-50 rounded-xl border border-dashed transition">Repos</div>
                            )
                          })}
                        </td>
                      ) : <td key={i} className="border-r"></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'INTERACTION */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{modalMode === 'reschedule_sport' ? "Reprogrammer" : `${mealLabel} (${selectedItem.dayName})`}</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {modalMode === 'view' && (
                <>
                  <div className="space-y-3">
                    <h2 className={`text-2xl font-bold ${isSport ? 'text-orange-700' : isOutside ? 'text-slate-700' : 'text-emerald-700'}`}>{selectedItem.name}</h2>
                    {isOutside && <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={14}/> Repas extérieur, menu non défini.</p>}
                    
                    <div className="flex gap-4 border-b pb-3">
                      {selectedItem.portion && <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">Portion : {selectedItem.portion}</div>}
                      {selectedItem.duration && <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">Durée totale : {selectedItem.duration}</div>}
                    </div>

                    {(selectedItem.recipe || selectedItem.program) && (
                      <div className="bg-slate-50 p-4 rounded-xl border">
                        <strong className="block text-xs uppercase text-slate-500 mb-2">{isSport ? "Programme" : "Préparation"}</strong>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedItem.recipe || selectedItem.program}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* LES BOUTONS D'ACTION DIRECTS */}
                  <div className="pt-4 mt-4 grid grid-cols-1 gap-2 border-t">
                    
                    {isSport && selectedItem.name !== "Repos" && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button onClick={handleCancelSport} className="p-3 bg-red-50 text-red-700 font-bold text-sm rounded-xl border border-red-200">Annuler (Repos)</button>
                        <button onClick={() => setModalMode('reschedule_sport')} className="p-3 bg-orange-50 text-orange-700 font-bold text-sm rounded-xl border border-orange-200 flex items-center justify-center gap-1"><CalendarClock size={16}/> Déplacer</button>
                      </div>
                    )}
                    {isSport && (
                      <button onClick={() => { setInteractionType('sport_modify'); setModalMode('input_local'); }} className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold border transition">
                        <RefreshCw size={16} className="text-blue-500"/> Modifier avec l'IA
                      </button>
                    )}

                    {/* REPAS */}
                    {!isSport && (isToday || isFuture) && !isOutside && (
                      <button onClick={() => { setInteractionType('missing'); setModalMode('input_local'); }} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border rounded-xl text-sm font-bold transition">
                        <AlertTriangle size={18} className="text-amber-500" /> Ingrédient manquant
                      </button>
                    )}
                    {!isSport && (isToday || isFuture) && (
                      <button onClick={() => { setInteractionType('change'); setModalMode('input_local'); }} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border rounded-xl text-sm font-bold transition">
                        <RefreshCw size={18} className="text-blue-500" /> Changement d'envie / plan
                      </button>
                    )}
                    {!isSport && (isToday || isPast) && (
                      <button onClick={() => { setInteractionType('deviation'); setModalMode('input_local'); }} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border rounded-xl text-sm font-bold transition">
                        <Camera size={18} className="text-purple-500" /> Déclarer un écart réalisé
                      </button>
                    )}
                  </div>
                </>
              )}

              {modalMode === 'reschedule_sport' && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700 mb-2">Choisir le jour cible :</p>
                  {weeklyPlan.days.map((d, i) => {
                    if (i === selectedItem.dayIndex) return null; // Ne pas afficher le jour actuel
                    const targetSport = d.sports && d.sports[0];
                    const hasSport = targetSport && targetSport.name !== "Repos";
                    
                    return (
                      <div key={i} className="flex justify-between items-center p-3 border rounded-xl hover:bg-slate-50">
                        <span className="font-semibold text-sm">{d.dayName} {d.dateString}</span>
                        <div className="flex gap-2">
                          {hasSport ? (
                            <>
                              <button onClick={() => handleRescheduleSport(i, 'replace')} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Remplacer</button>
                              <button onClick={() => handleRescheduleSport(i, 'add')} className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg">Ajouter</button>
                            </>
                          ) : (
                            <button onClick={() => handleRescheduleSport(i, 'replace')} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Déplacer</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => setModalMode('view')} className="w-full mt-2 p-3 text-slate-500 font-bold">Annuler</button>
                </div>
              )}

              {modalMode === 'input_local' && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">Expliquez au coach :</label>
                  <textarea autoFocus rows={3} className="w-full p-4 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none" placeholder={getPlaceholder()} value={userInput} onChange={(e) => setUserInput(e.target.value)} />
                  
                  {interactionType === 'deviation' && !isSport && (
                    <label className="flex items-center justify-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border rounded-xl text-sm font-bold cursor-pointer">
                      <Camera size={16} /> {mealPhoto ? "Photo jointe ✓" : "Joindre photo"}
                      <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
                    </label>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setModalMode('view')} className="flex-1 p-3 bg-slate-100 font-bold rounded-xl text-sm">Annuler</button>
                    <button onClick={handleLocalSubmit} disabled={!userInput} className="flex-[2] p-3 bg-emerald-600 text-white font-bold rounded-xl text-sm">Demander à l'IA</button>
                  </div>
                </div>
              )}

              {modalMode === 'loading_local' && (
                <div className="py-12 flex flex-col items-center space-y-4 text-emerald-600">
                  <RefreshCw size={32} className="animate-spin" />
                  <p className="font-bold text-sm">Ajustement intelligent...</p>
                </div>
              )}

              {modalMode === 'proposal_local' && localProposal && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border relative ${isSport ? 'bg-orange-50 border-orange-200' : localProposal.item.isOutside ? 'bg-slate-100 border-slate-300' : 'bg-emerald-50 border-emerald-200'}`}>
                    <h3 className="font-bold text-lg mb-2">{localProposal.item.name}</h3>
                    {localProposal.rationale && (
                      <p className="text-sm italic text-slate-600 border-t pt-2 mt-2">Coach : "{localProposal.rationale}"</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-2">
                    <button onClick={() => acceptLocalProposal(false)} className="w-full p-3 bg-slate-800 text-white font-bold rounded-xl text-sm shadow-md">
                      Valider uniquement cet élément
                    </button>
                    {localProposal.impactsFuture && (
                      <button onClick={() => acceptLocalProposal(true)} className="w-full p-3 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md flex justify-center gap-2">
                        <Zap size={16}/> Valider ET Re-planifier la suite
                      </button>
                    )}
                    <button onClick={() => setModalMode('input_local')} className="w-full p-3 mt-2 text-slate-500 font-bold text-sm">Annuler</button>
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
