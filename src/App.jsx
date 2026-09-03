import React, { useState, useEffect } from 'react';
import { Users, Utensils, Activity, Target, RefreshCw, Send, CheckSquare, Edit2, Key, Settings, Dumbbell } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('gemini_api_key'));

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('fit_feast_profile');
    return saved ? JSON.parse(saved) : {
      name: "Pablo",
      goal: {
        type: "Perte de masse grasse & Tonification",
        target: "Réduction graisse abdominale et ballonnements",
        dietType: "Riche en protéines, pauvre en aliments fermentescibles",
        updatedAt: new Date().toISOString().split('T')[0]
      },
      familyMembers: [
        { id: 1, name: "Pauline", role: "Conjointe", age: 32, goal: "Forme générale", notes: "Même repas de base" },
        { id: 2, name: "Enfant", role: "Enfant", age: 4, goal: "Croissance", notes: "Couper fin, assaisonnement doux" }
      ]
    };
  });

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState({ ...profile.goal });

  const [inventoryText, setInventoryText] = useState("Œufs, Riz, Pâtes complètes, Coquillettes petit épeautre, Poulet, Brocolis, Poisson blanc, Poireaux, Haricots verts, Filet mignon de porc");
  const [sportsHistory] = useState([
    { id: 1, date: "Habitude", type: "Corde à sauter & Renforcement", duration: "20 min", details: "Corde 500g" }
  ]);

  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    localStorage.setItem('fit_feast_profile', JSON.stringify(profile));
  }, [profile]);

  const saveApiKey = (key) => {
    const cleanKey = key.trim();
    setApiKey(cleanKey);
    localStorage.setItem('gemini_api_key', cleanKey);
    setShowSettings(false);
  };

  const generateOrUpdatePlan = async (customPrompt = "") => {
    const activeKey = apiKey.trim();
    if (!activeKey) {
      alert("Veuillez saisir votre clé API Google Gemini dans la configuration.");
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setStatusMessage("Génération du plan Sport & Alimentation en cours...");

    try {
      const genAI = new GoogleGenerativeAI(activeKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const promptSystem = `
Tu es un coach expert en nutrition sportive et entraînement physique sur-mesure.
Ta mission est de générer une planification cohérente associant SÉANCES DE SPORT et REPAS FAMILIAUX.

PROFIL UTILISATEUR :
- Nom : ${profile.name}
- Objectif principal : ${profile.goal.type} (${profile.goal.target})
- Régime : ${profile.goal.dietType}

COMPOSITION FAMILIALE :
${profile.familyMembers.map(m => `- ${m.name} (${m.role}, ${m.age} ans) : Notes = ${m.notes}`).join('\n')}

STOCKS D'ALIMENTS DISPONIBLES :
${inventoryText}

HABITUDES SPORTIVES :
${sportsHistory.map(s => `- ${s.type} (${s.duration})`).join('\n')}

DEMANDE DE L'UTILISATEUR :
${customPrompt ? customPrompt : "Génère un programme complet sur plusieurs jours combinant sport et repas adaptés."}

CONSIGNES STRICTES :
1. SYNERGIE SPORT & REPAS : Propose une séance de sport adaptée et ajuste directement le repas du jour.
2. BASE COMMUNE FAMILIALE : Propose UN SEUL plat de base pour la famille avec des déclinaisons pour les enfants/conjoints.
3. UTILISATION DES STOCKS : Utilise en priorité les aliments de la liste des stocks.

Formate ta réponse STRICTEMENT sous cette structure JSON :
{
  "summary": "Résumé de la stratégie nutrition & sport pour le cycle",
  "days": [
    {
      "day": "Jour 1",
      "sport": { 
        "type": "Nom de l'activité (ex: Corde à sauter & HIIT)", 
        "duration": "20-30 min", 
        "intensity": "Moyenne / Élevée", 
        "advice": "Conseils d'exécution" 
      },
      "meal": {
        "name": "Nom du plat principal",
        "userPortion": "Portion spécifique pour l'utilisateur principal",
        "familyAdjustments": [
          { "member": "Nom du membre", "note": "Conseil de préparation ou portion spécifique" }
        ]
      }
    }
  ],
  "groceryList": ["Ingrédient manquant 1", "Ingrédient manquant 2"]
}
      `;

      const result = await model.generateContent(promptSystem);
      const responseText = result.response.text();
      const resultData = JSON.parse(responseText.trim());
      
      setWeeklyPlan(resultData);
      setChatPrompt("");
      setStatusMessage("Plan Sport & Nutrition généré avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion avec Gemini : vérifiez votre clé API ou le modèle.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = () => {
    setProfile({
      ...profile,
      goal: {
        ...tempGoal,
        updatedAt: new Date().toISOString().split('T')[0]
      }
    });
    setIsEditingGoal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      
      {/* EN-TÊTE */}
      <header className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-2.5 rounded-xl">
            <Utensils size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fit&Feast AI</h1>
            <p className="text-xs text-slate-500">Coach Synergique Sport, Nutrition & Repas Familiaux</p>
          </div>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold"
        >
          <Settings size={16} /> Clé API Gemini
        </button>
      </header>

      {/* BANNIÈRE CLÉ API */}
      {showSettings && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold">
            <Key size={16} /> Configuration de l'accès Google Gemini AI (Gratuit)
          </div>
          <p className="text-amber-700">
            Collez votre clé API récupérée sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a>.
          </p>
          <div className="flex gap-2">
            <input 
              type="password"
              placeholder="Collez votre clé API Gemini ici (ex: AIzaSy...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 p-2.5 border border-amber-300 rounded-xl outline-none bg-white"
            />
            <button 
              onClick={() => saveApiKey(apiKey)}
              className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2.5 rounded-xl font-bold transition"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PANNEAU DE GAUCHE : OBJECTIFS, FAMILLE & STOCKS */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          
          {/* OBJECTIF */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Target className="text-emerald-600" size={16} /> Objectif Principal
              </h2>
              <button 
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Edit2 size={12} /> {isEditingGoal ? "Fermer" : "Ajuster"}
              </button>
            </div>

            {isEditingGoal ? (
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
                <div>
                  <label className="font-semibold block mb-1">Type d'objectif :</label>
                  <select 
                    value={tempGoal.type} 
                    onChange={(e) => setTempGoal({...tempGoal, type: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="Perte de masse grasse & Tonification">Perte de masse grasse & Tonification</option>
                    <option value="Prise de masse musculaire">Prise de masse musculaire</option>
                    <option value="Préparation endurance & Cardio">Préparation endurance & Cardio</option>
                    <option value="Maintien & Vitalité">Maintien & Vitalité</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Détails / Précisions :</label>
                  <input 
                    type="text" 
                    value={tempGoal.target} 
                    onChange={(e) => setTempGoal({...tempGoal, target: e.target.value})}
                    className="w-full p-2 border rounded-lg bg-white"
                  />
                </div>
                <button 
                  onClick={handleSaveGoal}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold"
                >
                  Enregistrer
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-emerald-900">{profile.goal.type}</div>
                <p className="text-slate-600">{profile.goal.target}</p>
                <p className="text-[10px] text-slate-400 pt-1">Mis à jour le {profile.goal.updatedAt}</p>
              </div>
            )}
          </div>

          {/* FAMILLE */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-900">
              <Users className="text-indigo-500" size={16} /> Composition Familiale
            </h2>

            {profile.familyMembers.map((member) => (
              <div key={member.id} className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{member.name} ({member.age} ans)</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{member.role}</span>
                </div>
                <p className="text-slate-600"><strong>Note :</strong> {member.notes}</p>
              </div>
            ))}
          </div>

          {/* STOCKS */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
              <CheckSquare className="text-amber-500" size={14} /> Stocks d'aliments disponibles
            </h3>
            <textarea
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              value={inventoryText}
              onChange={(e) => setInventoryText(e.target.value)}
            />
          </div>

        </section>

        {/* PANNEAU CENTRAL & DROIT */}
        <section className="md:col-span-2 space-y-6">
          
          {/* ZONE DE DIALOGUE */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-md font-bold flex items-center gap-2 text-slate-900">
              <RefreshCw className="text-emerald-500" size={18} /> Coach Conversationnel Sport & Nutrition
            </h2>
            <p className="text-xs text-slate-500">
              Demandez à l'IA d'adapter le programme selon votre état de forme, vos séances prévues ou vos stocks.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Ex: Génère le plan pour la semaine (sport et alimentation)..."
                className="flex-1 p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                onClick={() => generateOrUpdatePlan(chatPrompt)}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                <Send size={14} /> {loading ? "Analyse..." : "Générer"}
              </button>
            </div>
            {statusMessage && <p className="text-xs text-emerald-600 font-medium">{statusMessage}</p>}
          </div>

          {/* RÉSULTAT GÉNÉRÉ */}
          {weeklyPlan ? (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                <strong>Stratégie Globale :</strong> {weeklyPlan.summary}
              </div>

              {weeklyPlan.days.map((item, idx) => (
                <div key={idx} className="space-y-4 border-b border-slate-100 pb-5 last:border-0">
                  <h3 className="font-bold text-slate-900 text-sm">{item.day}</h3>

                  {/* VIGNETTE SPORT */}
                  <div className="p-3.5 bg-orange-50/70 border border-orange-100 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-orange-700 flex items-center gap-1.5 uppercase text-[10px]">
                        <Dumbbell size={14} /> Séance de Sport
                      </span>
                      <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        {item.sport.intensity}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs">{item.sport.type} ({item.sport.duration})</div>
                    <p className="text-xs text-slate-600">{item.sport.advice}</p>
                  </div>

                  {/* VIGNETTE REPAS */}
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-100">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Utensils className="text-emerald-600" size={14} /> Dîner : {item.meal.name}
                    </div>
                    <p className="text-slate-700"><strong>Portion pour vous ({profile.name}) :</strong> {item.meal.userPortion}</p>

                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <span className="font-bold text-indigo-600 text-[10px] uppercase">Ajustements Famille :</span>
                      {item.meal.familyAdjustments.map((adj, aIdx) => (
                        <p key={aIdx} className="text-slate-600 pl-2 border-l-2 border-indigo-300">
                          <strong>{adj.member} :</strong> {adj.note}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* LISTE DE COURSES */}
              {weeklyPlan.groceryList && (
                <div className="pt-2">
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Inspirations / Ingrédients à acheter</h4>
                  <div className="flex flex-wrap gap-2">
                    {weeklyPlan.groceryList.map((ing, gIdx) => (
                      <span key={gIdx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center space-y-3">
              <Activity className="mx-auto text-slate-300" size={40} />
              <p className="text-sm font-semibold text-slate-600">Aucun programme généré</p>
              <p className="text-xs text-slate-400">Tapez un message dans la boîte ci-dessus ou cliquez sur "Générer" pour obtenir votre plan Sport & Repas.</p>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
