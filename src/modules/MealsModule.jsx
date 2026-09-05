import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, X, Camera, Zap, 
  Footprints, Leaf, Waves, Dumbbell, Activity,
  MessageSquare, Check, RefreshCw, AlertTriangle
} from 'lucide-react';

// --- HELPER : Icônes dynamiques pour le sport ---
const getSportIcon = (sportName) => {
  const name = sportName.toLowerCase();
  if (name.includes('muscu') || name.includes('poids') || name.includes('renforcement')) return Dumbbell;
  if (name.includes('corde') || name.includes('hiit') || name.includes('cardio')) return Activity;
  if (name.includes('course') || name.includes('jogging') || name.includes('footing')) return Footprints;
  if (name.includes('natation') || name.includes('piscine')) return Waves;
  if (name.includes('yoga') || name.includes('pilates') || name.includes('étirement')) return Leaf;
  return Zap;
};

// --- HELPER : Génération de données fictives pour la démo ---
const generateMockPlan = () => {
  const days = [];
  const today = new Date();
  for (let i = -2; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      dayName: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dateString: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      breakfast: { name: "Flocons d'avoine & Fruits", portion: "80g avoine, 1 banane", family: [{member: "Enfant 1", note: "Sans banane"}] },
      lunch: { name: "Poulet grillé & Riz", portion: "150g poulet, 60g riz cru", family: [] },
      dinner: { name: "Saumon & Brocolis", portion: "130g saumon, 200g brocolis", family: [{member: "Conjoint", note: "Portion double"}] },
      sports: [
        { user: "Utilisateur principal", name: i % 2 === 0 ? "Corde à sauter" : "Repos", duration: i % 2 === 0 ? "20 min" : "-", intensity: "Haute" }
      ]
    });
  }
  return days;
};

export default function MealsModule() {
  const [plan, setPlan] = useState(generateMockPlan());
  const [expandedRows, setExpandedRows] = useState({ breakfast: true, lunch: true, dinner: true, sports: true });
  
  // États pour la modale
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // view, input, loading, proposal
  const [interactionType, setInteractionType] = useState('');
  const [userInput, setUserInput] = useState('');
  const [proposedMeal, setProposedMeal] = useState(null);

  const today = new Date();
  today.setHours(0,0,0,0);

  const toggleRow = (row) => setExpandedRows(prev => ({ ...prev, [row]: !prev[row] }));

  // --- GESTION DE LA MODALE & SIMULATION IA ---
  const openModal = (meal, dayIndex, type) => {
    setSelectedMeal({ ...meal, dayIndex, mealType: type });
    setModalMode('view');
    setUserInput('');
  };

  const startInteraction = (type) => {
    setInteractionType(type);
    setModalMode('input');
  };

  const handleAiRequest = () => {
    setModalMode('loading');
    // Simulation d'un appel à l'API Gemini (2 secondes)
    setTimeout(() => {
      setProposedMeal({
        name: "Omelette aux champignons & Salade",
        portion: "3 oeufs, 150g champignons",
        family: selectedMeal.family,
        reason: "Remplacement sans poulet, riche en protéines."
      });
      setModalMode('proposal');
    }, 2000);
  };

  const acceptProposal = () => {
    const newPlan = [...plan];
    newPlan[selectedMeal.dayIndex][selectedMeal.mealType] = proposedMeal;
    setPlan(newPlan);
    setSelectedMeal(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER CALENDRIER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw className="text-emerald-500" /> Planning de la semaine
        </h2>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-200"></span> Passé
          <span className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-300 ml-2"></span> Aujourd'hui
        </div>
      </div>

      {/* GRILLE CALENDRIER */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 text-xs text-slate-600 uppercase tracking-wide">
                <th className="p-3 w-32 border-b border-r border-slate-200 font-bold sticky left-0 bg-slate-100 z-10">Catégorie</th>
                <th className="p-3 w-24 border-b border-r border-slate-200 font-bold text-center">Cible</th>
                {plan.map((d, i) => {
                  const isToday = d.date.getTime() === today.getTime();
                  const isPast = d.date < today && !isToday;
                  return (
                    <th key={i} className={`p-3 w-40 border-b border-r border-slate-200 text-center ${isToday ? 'bg-indigo-50 text-indigo-700 border-b-2 border-b-indigo-400' : ''} ${isPast ? 'opacity-60 bg-slate-50' : ''}`}>
                      <div className="font-bold">{d.dayName}</div>
                      <div className="text-[10px] font-normal">{d.dateString}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="text-xs text-slate-800">
              
              {/* LIGNE PETIT-DEJEUNER */}
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <td className="p-3 border-r border-slate-200 font-bold text-slate-700 sticky left-0 bg-slate-50/90 z-10 cursor-pointer" onClick={() => toggleRow('breakfast')}>
                  <div className="flex items-center gap-2">{expandedRows.breakfast ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Petit-Déj</div>
                </td>
                <td className="p-3 border-r border-slate-200 text-center font-semibold text-slate-500">Principal</td>
                {plan.map((d, i) => {
                  const isPast = d.date < today && !(d.date.getTime() === today.getTime());
                  return expandedRows.breakfast ? (
                    <td key={i} className={`p-2 border-r border-slate-200 align-top ${isPast ? 'opacity-60 grayscale-[30%] bg-slate-50' : ''}`}>
                      <div onClick={() => openModal(d.breakfast, i, 'breakfast')} className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl cursor-pointer transition h-full flex flex-col justify-between">
                        <span className="font-bold text-emerald-900">{d.breakfast.name}</span>
                        {d.breakfast.family.length > 0 && <span className="text-[9px] text-indigo-600 mt-1 block">+ Adaptations</span>}
                      </div>
                    </td>
                  ) : <td key={i} className="border-r border-slate-200 bg-slate-50"></td>;
                })}
              </tr>

              {/* LIGNE DÉJEUNER */}
              <tr className="border-b border-slate-200">
                <td className="p-3 border-r border-slate-200 font-bold text-slate-700 sticky left-0 bg-white z-10 cursor-pointer" onClick={() => toggleRow('lunch')}>
                  <div className="flex items-center gap-2">{expandedRows.lunch ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Déjeuner</div>
                </td>
                <td className="p-3 border-r border-slate-200 text-center font-semibold text-slate-500">Principal</td>
                {plan.map((d, i) => {
                  const isPast = d.date < today && !(d.date.getTime() === today.getTime());
                  return expandedRows.lunch ? (
                    <td key={i} className={`p-2 border-r border-slate-200 align-top ${isPast ? 'opacity-60 grayscale-[30%] bg-slate-50' : ''}`}>
                      <div onClick={() => openModal(d.lunch, i, 'lunch')} className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl cursor-pointer transition h-full flex flex-col justify-between">
                        <span className="font-bold text-emerald-900">{d.lunch.name}</span>
                        {d.lunch.family.length > 0 && <span className="text-[9px] text-indigo-600 mt-1 block">+ {d.lunch.family.length} Adapt.</span>}
                      </div>
                    </td>
                  ) : <td key={i} className="border-r border-slate-200"></td>;
                })}
              </tr>

              {/* LIGNE DÎNER */}
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <td className="p-3 border-r border-slate-200 font-bold text-slate-700 sticky left-0 bg-slate-50/90 z-10 cursor-pointer" onClick={() => toggleRow('dinner')}>
                  <div className="flex items-center gap-2">{expandedRows.dinner ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Dîner</div>
                </td>
                <td className="p-3 border-r border-slate-200 text-center font-semibold text-slate-500">Principal</td>
                {plan.map((d, i) => {
                  const isPast = d.date < today && !(d.date.getTime() === today.getTime());
                  return expandedRows.dinner ? (
                    <td key={i} className={`p-2 border-r border-slate-200 align-top ${isPast ? 'opacity-60 grayscale-[30%] bg-slate-50' : ''}`}>
                      <div onClick={() => openModal(d.dinner, i, 'dinner')} className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl cursor-pointer transition h-full flex flex-col justify-between">
                        <span className="font-bold text-emerald-900">{d.dinner.name}</span>
                        {d.dinner.family.length > 0 && <span className="text-[9px] text-indigo-600 mt-1 block">+ {d.dinner.family.length} Adapt.</span>}
                      </div>
                    </td>
                  ) : <td key={i} className="border-r border-slate-200 bg-slate-50"></td>;
                })}
              </tr>

              {/* LIGNES SPORT (Générées dynamiquement par utilisateur suivi) */}
              <tr className="border-b-2 border-slate-300">
                <td className="p-3 border-r border-slate-200 font-bold text-slate-700 sticky left-0 bg-white z-10 cursor-pointer" onClick={() => toggleRow('sports')}>
                  <div className="flex items-center gap-2 text-orange-600">{expandedRows.sports ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Activité Physique</div>
                </td>
                <td className="p-3 border-r border-slate-200 text-center text-[10px] font-semibold text-orange-600">Utilisateur Principal</td>
                {plan.map((d, i) => {
                  const sport = d.sports[0];
                  const isPast = d.date < today && !(d.date.getTime() === today.getTime());
                  const Icon = getSportIcon(sport.name);
                  
                  return expandedRows.sports ? (
                    <td key={i} className={`p-2 border-r border-slate-200 align-top ${isPast ? 'opacity-60 grayscale-[30%] bg-slate-50' : ''}`}>
                      {sport.name !== "Repos" ? (
                        <div className="p-2 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition">
                          <div className="font-bold text-orange-900 flex items-center gap-1">
                            <Icon size={12} className="text-orange-600"/> {sport.name}
                          </div>
                          <div className="text-[10px] text-orange-700 mt-1">{sport.duration}</div>
                        </div>
                      ) : (
                        <div className="p-2 text-center text-[10px] text-slate-400 cursor-pointer hover:bg-slate-50 rounded-xl transition">Repos / Ajouter</div>
                      )}
                    </td>
                  ) : <td key={i} className="border-r border-slate-200"></td>;
                })}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE INTERACTIVE REPAS & IA */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            
            {/* Header Modale */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {modalMode === 'view' ? "Détail du repas" : modalMode === 'proposal' ? "Proposition de l'IA" : "Ajustement IA"}
              </h3>
              <button onClick={() => setSelectedMeal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Contenu de la Modale */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {modalMode === 'view' && (
                <>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-emerald-700">{selectedMeal.name}</h2>
                    <p className="text-sm text-slate-600">Portion cible : {selectedMeal.portion}</p>
                  </div>
                  
                  {selectedMeal.family.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                      <span className="font-bold text-indigo-800 text-xs uppercase mb-1 block">Adaptations Foyer</span>
                      {selectedMeal.family.map((f, idx) => (
                        <p key={idx} className="text-xs text-indigo-700"><strong>{f.member} :</strong> {f.note}</p>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 grid grid-cols-1 gap-2 border-t mt-4">
                    <button onClick={() => startInteraction('missing')} className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
                      <AlertTriangle size={16} className="text-amber-500" /> Il me manque un ingrédient
                    </button>
                    <button onClick={() => startInteraction('change')} className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
                      <RefreshCw size={16} className="text-blue-500" /> J'ai envie d'autre chose
                    </button>
                    <button onClick={() => startInteraction('deviation')} className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
                      <Camera size={16} className="text-purple-500" /> J'ai fait un écart (Photo/Texte)
                    </button>
                  </div>
                </>
              )}

              {modalMode === 'input' && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">
                    {interactionType === 'missing' ? "Quel ingrédient vous manque-t-il ?" : 
                     interactionType === 'change' ? "Une envie particulière ?" : "Que s'est-il passé ?"}
                  </label>
                  <textarea 
                    autoFocus
                    rows={3}
                    className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Ex: Je n'ai plus de poulet, mais j'ai des oeufs..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                  {interactionType === 'deviation' && (
                    <button className="w-full flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-sm font-bold">
                      <Camera size={16} /> Joindre une photo
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setModalMode('view')} className="flex-1 p-3 bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">Annuler</button>
                    <button onClick={handleAiRequest} disabled={!userInput} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                      <MessageSquare size={16} /> Demander à l'IA
                    </button>
                  </div>
                </div>
              )}

              {modalMode === 'loading' && (
                <div className="py-8 flex flex-col items-center justify-center space-y-4 text-emerald-600">
                  <RefreshCw size={32} className="animate-spin" />
                  <p className="font-bold text-sm">Gemini recalcule votre repas...</p>
                </div>
              )}

              {modalMode === 'proposal' && proposedMeal && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 relative">
                    <div className="absolute -top-3 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">Nouveau</div>
                    <h3 className="font-bold text-emerald-900 text-lg">{proposedMeal.name}</h3>
                    <p className="text-sm text-slate-700">{proposedMeal.portion}</p>
                    <p className="text-xs text-emerald-700 italic border-t border-emerald-200 pt-2 mt-2">
                      " {proposedMeal.reason} "
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setModalMode('input')} className="flex-1 p-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm border hover:bg-slate-200">
                      Non, autre chose
                    </button>
                    <button onClick={acceptProposal} className="flex-1 flex items-center justify-center gap-2 p-3 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-emerald-700">
                      <Check size={16} /> Valider ce plat
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
