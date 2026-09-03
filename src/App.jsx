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
      // Utilisation du modèle actif gemini-2.5-flash
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
1. SYNERGIE SPORT & REPAS : Propose une séance de sport adaptée et ajuste directement le repas du jour (ex: plus de glucides les jours de sport, plus léger les jours de repos).
2. BASE COMMUNE FAMILIALE : Propose UN SEUL plat de base pour la famille avec des déclinaisons pour les enfants/conjoints.
3. UTILISATION DES STOCKS : Utilise en priorité les aliments de la liste des stocks.

Formate ta réponse sous forme de JSON STRICT UNIQUEMENT (aucun texte ou balise markdown autour) :
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

      // Nettoyage de la réponse au cas où des balises markdown entourent le JSON
      const cleanText = responseText.replace(/```json/gi, '').replace(/
