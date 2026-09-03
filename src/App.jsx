import React, { useState, useEffect } from 'react';
import { Users, Utensils, Activity, Plus, Target, RefreshCw, Send, CheckSquare, Edit2, Calendar, Key, Settings } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('gemini_api_key'));

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('fit_feast_profile');
    return saved ? JSON.parse(saved) : {
      name: "Alex",
      goal: {
        type: "Perte de masse grasse",
        target: "Viser -3 kg d'ici 2 mois tout en maintenant l'endurance",
        dietType: "Riche en protéines, modéré en glucides",
        updatedAt: new Date().toISOString().split('T')[0]
      },
      familyMembers: [
        { id: 1, name: "Lucas", role: "Enfant", age: 4, goal: "Croissance", notes: "Pas d'épices, couper fin" },
        { id: 2, name: "Sophie", role: "Conjoint", age: 34, goal: "Maintien de forme", notes: "Aucune restriction" }
      ]
    };
  });

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState({ ...profile.goal });

  const [inventoryText, setInventoryText] = useState("Œufs, Riz, Pâtes, Poulet, Brocolis, Saumon, Pommes de terre");
  const [sportsHistory] = useState([
    { id: 1, date: "Hier", type: "Corde à sauter", duration: "20 min", details: "Corde lourde 500g" }
  ]);

  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    localStorage.setItem('fit_feast_profile', JSON.stringify(profile));
  }, [profile]);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowSettings(false);
  };

  const generateOrUpdatePlan = async (customPrompt = "") => {
    if (!apiKey) {
      alert("Veuillez saisir votre clé API Google Gemini dans les paramètres.");
      setShowSettings(true);
      return;
    }

    setLoading(true);
    setStatusMessage("Génération du plan personnalisé en cours...");

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const promptSystem = `
Tu es un coach expert en nutrition sportive et organisation familiale.
Génère un plan de repas et de sport cohérent.

PROFIL UTILISATEUR :
- Nom : ${profile.name}
- Objectif principal : ${profile.goal.type} (${profile.goal.target})
- Régime : ${profile.goal.dietType}

COMPOSITION FAMILIALE :
${profile.familyMembers.map(m => `- ${m.name} (${m.role}, ${m.age} ans) : Objectif/Notes = ${m.goal} / ${m.notes}`).join('\n')}

STOCKS D'ALIMENTS DISPONIBLES :
${inventoryText}

ACTIVITES SPORTIVES RECENTES :
${sportsHistory.map(s => `- ${s.type} (${s.duration}) : ${s.details}`).join('\n')}

DEMANDE PARTICULIÈRE DE L'UTILISATEUR :
${customPrompt ? customPrompt : "Génère le programme idéal pour les prochains jours."}

CONSIGNES STRICTES :
1. SYNERGIE SPORT/NUTRITION : Adapte les repas aux dépenses sportives (plus de glucides/protéines les jours de séance).
2. BASE COMMUNE FAMILIALE : Propose UN SEUL plat de base pour tout le foyer avec des ajustements précis pour chaque membre.
3. UTILISATION DES STOCKS : Priorise les aliments en stock.

Formate ta réponse en JSON STRICT avec la structure exacte suivante (ne rajoute aucun texte avant ou après le JSON) :
{
  "summary": "Résumé de l'orientation du plan",
  "days": [
    {
      "day": "Aujourd'hui",
      "sport": { "type": "Nom du sport", "duration": "Durée", "intensity": "Faible/Moyenne/Haute", "advice": "Conseil spécifique" },
      "meal": {
        "name": "Nom du plat principal",
        "userPortion": "Portion exacte pour l'utilisateur principal",
        "familyAdjustments": [
          { "member": "Nom du membre", "note": "Conseil de préparation ou portion spécifique" }
        ]
      }
    }
  ],
  "groceryList": ["Article 1", "Article 2"]
}
      `;

      const result = await model.generateContent(promptSystem);
      const responseText = result.response.text();

      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const resultData = JSON.parse(cleanText);

      setWeeklyPlan(resultData);
      setChatPrompt("");
      setStatusMessage("Plan mis à jour avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la communication avec Gemini. Vérifiez votre clé API.");
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
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-2.5 rounded-xl">
            <Utensils size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fit&Feast AI</h1>
            <p className="text-xs text-slate-500">Coach Sport, Nutrition & Repas Familiaux</p>
          </div>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 text-xs font-semibold"
        >
          <Settings size={16} /> Clé API Gemini
        </button>
      </header>

      {showSettings && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold">
            <Key size={16} /> Configuration de l'accès Google Gemini AI (Gratuit)
          </div>
          <p className="text-amber-700">
            Obtenez votre clé gratuite sur <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a> et collez-la ci-dessous.
          </p>
          <div className="flex gap-2">
            <input 
              type="password"
              placeholder="Collez votre clé API Gemini ici..."
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

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6">
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
                    <option value="Perte de masse grasse">Perte de masse grasse</option>
                    <option value="Prise de masse musculaire">Prise de masse musculaire</option>
                    <option value="Préparation endurance">Préparation endurance</option>
                    <option value="Maintien & Santé">Maintien & Santé</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Précisions :</label>
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

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1">
              <CheckSquare size={14} className="text-amber-500" /> Stocks d'aliments
            </h3>
            <textarea
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              value={inventoryText}
              onChange={(e) => setInventoryText(e.target.value)}
            />
          </div>
        </section>

        <section className="md:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-md font-bold flex items-center gap-2 text-slate-900">
              <RefreshCw className="text-emerald-500" size={18} /> Ajustement Conversationnel
            </h2>
            <p className="text-xs text-slate-500">
              Demandez une modification ponctuelle, signalez un ingrédient manquant ou une séance supplémentaire.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Ex: Mon fils refuse le brocoli ce soir / J'ai fait 25 min de corde à sauter..."
                className="flex-1 p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                onClick={() => generateOrUpdatePlan(chatPrompt)}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                <Send size={14} /> {loading ? "Analyse..." : "Adapter"}
              </button>
            </div>
            {statusMessage && <p className="text-xs text-emerald-600 font-medium">{statusMessage}</p>}
          </div>

          {weeklyPlan ? (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                <strong>Orientation du Coach :</strong> {weeklyPlan.summary}
              </div>

              {weeklyPlan.days.map((item, idx) => (
                <div key={idx} className="space-y-4 border-b border-slate-100 pb-4 last:border-0">
                  <h3 className="font-bold text-slate-800 text-sm">{item.day}</h3>

                  <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-orange-600 uppercase text-[10px]">Séance Sport</span>
                      <p className="font-bold text-slate-800">{item.sport.type} ({item.sport.duration})</p>
                      <p className="text-slate-600">{item.sport.advice}</p>
                    </div>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-[10px] font-semibold">
                      {item.sport.intensity}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-slate-800">Repas : {item.meal.name}</div>
                    <p className="text-slate-600"><strong>Votre portion :</strong> {item.meal.userPortion}</p>

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

              {weeklyPlan.groceryList && (
                <div className="pt-2">
                  <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Liste de courses suggérée</h4>
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
              <Utensils className="mx-auto text-slate-300" size={40} />
              <p className="text-sm font-semibold text-slate-600">Aucun plan généré pour le moment</p>
              <p className="text-xs text-slate-400">Cliquez sur "Adapter" ci-dessus pour lancer la première planification par l'IA.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
