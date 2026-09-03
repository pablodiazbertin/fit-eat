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
${profile.familyMembers.map(m => `- ${m.name} (${m.role}, ${m.age} ans) : Notes =${m.notes}`).join('\n')}

STOCKS D'ALIMENTS DISPONIBLES :
${inventoryText}

HABITUDES SPORTIVES :
${sportsHistory.map(s => `- ${s.type} (${s.duration})`).join('\n')}

DEMANDE DE L'UTILISATEUR :
${customPrompt ? customPrompt : "Génère un programme complet sur plusieurs jours combinant sport et repas adaptés."}

CONSIGNES STRICTES :
1. SYNERGIE SPORT & REPAS : Propose une séance de sport adaptée et ajuste directement le repas du jour (ex: plus de glucides les jours de sport, plus léger les jours de repos).
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

      // Grâce à responseMimeType: "application/json", Gemini renvoie directement un JSON valide
      const resultData = JSON.parse(responseText.trim());
      
      setWeeklyPlan(resultData);
      setChatPrompt("");
      setStatusMessage("Plan Sport & Nutrition généré avec succès !");
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion avec Gemini : vérifiez votre clé API ou réessayez dans quelques secondes.");
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
            <Utensils size="{22}"/>
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
          <Settings size="{16}"/> Clé API Gemini
        </button>
      </header>

      {/* BANNIÈRE CLÉ API */}
      {showSettings && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold">
            <Key size="{16}"/> Configuration de l'accès Google Gemini AI (Gratuit)
          </div>
          <p className="text-amber-700">
            Collez votre clé API récupérée sur <a href="[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a>.
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
                <Target className="text-emerald-600" size="{16}"/> Objectif Principal
              </h2>
              <button 
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Edit2 size="{12}"/> {isEditingGoal ? "Fermer" : "Ajuster"}
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
                    <option value="Perte de masse grasse & Tonification">Perte de
