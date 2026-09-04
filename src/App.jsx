import React, { useState, useEffect } from 'react';
import { 
  Users, Utensils, Target, CheckSquare, Settings, Dumbbell, 
  ShoppingCart, Camera, Plus, Trash2, Edit3, Send, Key, RefreshCw, Layers
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function App() {
  // --- ÉTAT GLOBAL ---
  const [activeTab, setActiveTab] = useState('meals');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('gemini_api_key'));

  // 1. MODULE FAMILLE
  const [family, setFamily] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_family');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: "Pablo", role: "Principal", age: 35, notes: "Pas de laitages" },
        { id: 2, name: "Pauline", role: "Conjointe", age: 32, notes: "Repas équilibrés" },
        { id: 3, name: "Enfant", role: "Enfant", age: 4, notes: "Couper fin, peu d'épices" }
      ];
    } catch (e) {
      return [];
    }
  });

  // 2. MODULE OBJECTIFS
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_goals');
      return saved ? JSON.parse(saved) : {
        1: { type: "Perte de gras & Tonification", target: "Réduire graisse abdominale", diet: "Hyperprotéiné" },
        2: { type: "Forme & Vitalité", target: "Maintien de l'énergie", diet: "Équilibré" },
        3: { type: "Croissance", target: "Développement sain", diet: "Adapté âge" }
      };
    } catch (e) {
      return {};
    }
  });

  // 3. MODULE STOCKS (Texte brut, SANS JSON.parse)
  const [inventory, setInventory] = useState(() => {
    return localStorage.getItem('fe_inventory') || "Œufs, Riz, Pâtes, Poulet, Brocolis, Saumon, Haricots verts";
  });

  // 4. MODULE SPORTS
  const [sportCatalog, setSportCatalog] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_sports');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: "Corde à sauter", category: "Cardio", defaultDuration: "20 min", notes: "Prendre en compte corde lourde 500g" },
        { id: 2, name: "Renforcement Musculaire", category: "Renforcement", defaultDuration: "30 min", notes: "Poids du corps" },
        { id: 3, name: "Course à pied", category: "Endurance", defaultDuration: "45 min", notes: "Allure modérée" }
      ];
    } catch (e) {
      return [];
    }
  });

  // 5. MODULE PLANNING
  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_plan');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [mealPhoto, setMealPhoto] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Sauvegardes
  useEffect(() => { localStorage.setItem('fe_family', JSON.stringify(family)); }, [family]);
  useEffect(() => { localStorage.setItem('fe_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('fe_inventory', inventory); }, [inventory]);
  useEffect(() => { localStorage.setItem('fe_sports', JSON.stringify(sportCatalog)); }, [sportCatalog]);
  useEffect(() => { localStorage.setItem('fe_plan', JSON.stringify(weeklyPlan)); }, [weeklyPlan]);

  const saveApiKey = (key) => {
    const cleanKey = key.trim();
    setApiKey(cleanKey);
    localStorage.setItem('gemini_api_key', cleanKey);
    setShowSettings(false);
  };

  const addFamilyMember = () => {
    const newId = Date.now();
    const newMember = { id: newId, name: "Nouveau membre", role: "Enfant", age: 5, notes: "" };
    setFamily([...family, newMember]);
    setGoals({ ...goals, [newId]: { type: "Maintien", target: "", diet: "Standard" } });
  };

  const removeFamilyMember = (id) => {
    setFamily(family.filter(m => m.id !== id));
    const updatedGoals = { ...goals };
    delete updatedGoals[id];
    setGoals(updatedGoals);
  };

  const addSportActivity = () => {
    const newActivity = {
      id: Date.now(),
      name: "Nouvelle activité",
      category: "Cardio",
      defaultDuration: "30 min",
      notes: "Ajustements spécifiques"
    };
    setSportCatalog([...sportCatalog, newActivity]);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMealPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // APPEL IA GEMINI (Utilisation forcée de gemini-3.6-flash)
  const callGeminiEngine = async () => {
    if (!apiKey) {
      alert("Veuillez renseigner votre clé API Gemini.");
      setShowSettings(true);
      return;
    }

    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.6-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const promptSystem = `
Tu es un coach expert en nutrition, entraînement physique et organisation familiale.
Génère ou adapte le programme complet de la semaine.

FAMILLE & MEMBRES :
${family.map(m => `- ${m.name} (${m.role}, ${m.age} ans) | Objectif: ${goals[m.id]?.type || 'N/A'} (${goals[m.id]?.target || ''}) | Notes: ${m.notes}`).join('\n')}

STOCKS D'ALIMENTS DISPONIBLES :
${inventory}

CATALOGUE DE SPORTS DISPONIBLES :
${sportCatalog.map(s => `- ${s.name} (${s.category}, ${s.defaultDuration}) : ${s.notes}`).join('\n')}

INSTRUCTIONS UTILISATEUR :
${chatInput ? chatInput : "Génère le programme de la semaine."}
${mealPhoto ? "NOTE: Une photo de repas consommé a été envoyée. Adapte les repas suivants." : ""}

Formate STRICTEMENT en JSON :
{
  "summary": "Synthèse de la stratégie globale",
  "days": [
    {
      "day": "Lundi",
      "sport": { "type": "Nom sport", "duration": "Durée", "intensity": "Haute/Moyenne", "notes": "Conseil" },
      "meal": {
        "name": "Nom du plat principal",
        "userPortion": "Portion utilisateur principal",
        "familyAdjustments": [
          { "member": "Nom membre", "note": "Déclinaison spécifique" }
        ]
      }
    }
  ],
  "groceryList": ["Ingrédient 1", "Ingrédient 2"]
}
      `;

      let result;
      if (mealPhoto) {
        const base64Data = mealPhoto.split(',')[1];
        const imagePart = { inlineData: { data: base64Data, mimeType: "image/jpeg" } };
        result = await model.generateContent([promptSystem, imagePart]);
      } else {
        result = await model.generateContent(promptSystem);
      }

      const responseText = result.response.text();
      const data = JSON.parse(responseText.trim());
      
      setWeeklyPlan(data);
      setChatInput("");
      setMealPhoto(null);
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion avec Gemini.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12">
      <header className="bg-slate-900 text-white p-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-900 font-bold">
              <Utensils size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">Fit&Feast Pro</h1>
              <p className="text-xs text-slate-400">Plateforme Synergique Famille, Nutrition & Sport</p>
            </div>
          </div>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs border border-slate-700 transition"
          >
            <Settings size={16} /> Clé API
          </button>
        </div>
      </header>

      {showSettings && (
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
            <button onClick={() => saveApiKey(apiKey)} className="bg-amber-800 text-white px-4 py-2 rounded-xl font-bold">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex overflow-x-auto text-xs font-bold text-slate-600 no-scrollbar">
          <button 
            onClick={() => setActiveTab('meals')} 
            className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap transition ${activeTab === 'meals' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' : 'border-transparent hover:text-slate-900'}`}
          >
            <RefreshCw size={16} /> Planning & Coach
          </button>
          <button 
            onClick={() => setActiveTab('family')} 
            className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap transition ${activeTab === 'family' ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent hover:text-slate-900'}`}
          >
            <Users size={16} /> Foyer ({family.length})
          </button>
          <button 
            onClick={() => setActiveTab('goals')} 
            className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap transition ${activeTab === 'goals' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent hover:text-slate-900'}`}
          >
            <Target size={16} /> Objectifs Membres
          </button>
          <button 
            onClick={() => setActiveTab('inventory')} 
            className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap transition ${activeTab === 'inventory' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent hover:text-slate-900'}`}
          >
            <CheckSquare size={16} /> Stocks Frigo
          </button>
          <button 
            onClick={() => setActiveTab('sports')} 
            className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap transition ${activeTab === 'sports' ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent hover:text-slate-900'}`}
          >
            <Dumbbell size={16} /> Catalogue Sports ({sportCatalog.length})
          </button>
          <button 
            onClick={() => setActiveTab('grocery')} 
            className={`flex items-center gap-2 px-5 py-4 border-b-2 whitespace-nowrap transition ${activeTab === 'grocery' ? 'border-purple-500 text-purple-600 bg-purple-50/50' : 'border-transparent hover:text-slate-900'}`}
          >
            <ShoppingCart size={16} /> Courses
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {activeTab === 'family' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Users className="text-indigo-500"/> Composition de la Famille</h2>
              <button onClick={addFamilyMember} className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-bold">
                <Plus size={14}/> Ajouter un membre
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
                    <button onClick={() => removeFamilyMember(member.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16}/>
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
        )}

        {activeTab === 'goals' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2"><Target className="text-amber-500"/> Objectifs Personnalisés par Membre</h2>
            <div className="space-y-4">
              {family.map((member) => (
                <div key={member.id} className="p-4 border border-amber-100 bg-amber-50/30 rounded-xl space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm">{member.name} ({member.role})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-500 block mb-1">Type d'objectif :</label>
                      <input 
                        type="text" 
                        value={goals[member.id]?.type || ''} 
                        onChange={(e) => setGoals({...goals, [member.id]: {...goals[member.id], type: e.target.value}})}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-500 block mb-1">Cible / Précisions :</label>
                      <input 
                        type="text" 
                        value={goals[member.id]?.target || ''} 
                        onChange={(e) => setGoals({...goals, [member.id]: {...goals[member.id], target: e.target.value}})}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-500 block mb-1">Régime / Orientation :</label>
                      <input 
                        type="text" 
                        value={goals[member.id]?.diet || ''} 
                        onChange={(e) => setGoals({...goals, [member.id]: {...goals[member.id], diet: e.target.value}})}
                        className="w-full p-2 border rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2"><CheckSquare className="text-blue-500"/> Gestion des Stocks Frigo & Placards</h2>
            <textarea 
              rows={6}
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {activeTab === 'sports' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Dumbbell className="text-orange-500"/> Catalogue d'Activités Sportives</h2>
              <button onClick={addSportActivity} className="bg-orange-600 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1 font-bold">
                <Plus size={14}/> Ajouter une activité
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sportCatalog.map((sport) => (
                <div key={sport.id} className="p-4 border border-orange-100 bg-orange-50/20 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <input 
                      type="text" 
                      value={sport.name} 
                      onChange={(e) => setSportCatalog(sportCatalog.map(s => s.id === sport.id ? {...s, name: e.target.value} : s))}
                      className="font-bold text-slate-800 bg-transparent border-b outline-none"
                    />
                    <button onClick={() => setSportCatalog(sportCatalog.filter(s => s.id !== sport.id))} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 font-semibold block">Catégorie :</label>
                      <input 
                        type="text" 
                        value={sport.category} 
                        onChange={(e) => setSportCatalog(sportCatalog.map(s => s.id === sport.id ? {...s, category: e.target.value} : s))}
                        className="w-full p-1.5 border rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold block">Durée type :</label>
                      <input 
                        type="text" 
                        value={sport.defaultDuration} 
                        onChange={(e) => setSportCatalog(sportCatalog.map(s => s.id === sport.id ? {...s, defaultDuration: e.target.value} : s))}
                        className="w-full p-1.5 border rounded bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold block">Notes :</label>
                    <input 
                      type="text" 
                      value={sport.notes} 
                      onChange={(e) => setSportCatalog(sportCatalog.map(s => s.id === sport.id ? {...s, notes: e.target.value} : s))}
                      className="w-full p-1.5 border rounded bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><RefreshCw className="text-emerald-500"/> Coach Intelligique (Ajustement Dynamique)</h2>
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ex: J'ai mangé une pizza ce midi..."
                  className="flex-1 p-3 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <label className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-xl text-xs font-bold text-slate-700 cursor-pointer border border-slate-200 transition">
                  <Camera size={16}/> {mealPhoto ? "Photo jointe ✓" : "Photo du repas"}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <button 
                  onClick={callGeminiEngine}
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
                      <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-orange-800">
                          <span className="flex items-center gap-1"><Dumbbell size={14}/> {d.sport.type} ({d.sport.duration})</span>
                          <span className="bg-orange-200 px-2 py-0.5 rounded-full text-[10px]">{d.sport.intensity}</span>
                        </div>
                        <p className="text-slate-600">{d.sport.notes || d.sport.advice}</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Utensils size={14} className="text-emerald-600"/> Dîner : {d.meal.name}
                        </div>
                        <p className="text-slate-700"><strong>Portion principale :</strong> {d.meal.userPortion}</p>
                        <div className="pt-2 border-t space-y-1">
                          <span className="font-bold text-indigo-600 text-[10px] uppercase">Ajustements Foyer :</span>
                          {d.meal.familyAdjustments?.map((adj, aIdx) => (
                            <p key={aIdx} className="text-slate-600 pl-2 border-l-2 border-indigo-300">
                              <strong>{adj.member} :</strong> {adj.note}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl shadow-sm text-center text-slate-400 space-y-2">
                <Layers size={40} className="mx-auto text-slate-300"/>
                <p className="font-semibold text-slate-600 text-sm">Aucun programme actif</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'grocery' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2"><ShoppingCart className="text-purple-500"/> Liste de Courses à Acheter</h2>
            {weeklyPlan?.groceryList ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {weeklyPlan.groceryList.map((item, idx) => (
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
        )}
      </main>
    </div>
  );
}
