import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateWeeklyPlan = async ({ apiKey, family, goals, inventory, sportCatalog, chatInput, mealPhoto }) => {
  if (!apiKey || !apiKey.trim()) throw new Error("Clé API manquante ou invalide");

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.6-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  // On récupère la date réelle du système pour l'imposer à Gemini
  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const promptSystem = `
Tu es un coach expert en nutrition, entraînement physique et organisation familiale.
Génère ou adapte le programme pour 7 jours. 

DATE D'AUJOURD'HUI : ${todayStr}. Le 1er jour du planning DOIT IMPÉRATIVEMENT correspondre à cette date (format JJ/MM).

RÈGLES D'OR : 
1. Construis les repas EN PRIORITÉ avec les stocks d'aliments disponibles ci-dessous.
2. ADAPTATIONS FAMILLE : S'il y a 1 seul membre au total dans le foyer, le tableau "family" des repas DOIT être vide []. S'il y a plusieurs membres, fournis UNIQUEMENT des indications culinaires concrètes dans "note" (ex: "ajouter 50g de riz", "sans sauce", "portion double"), aucun blabla nutritionnel.

FAMILLE & MEMBRES :
${family && family.length > 0 ? family.map(m => `- ${m.name} (${m.role}, ${m.age} ans) | Objectif:${goals[m.id]?.type || 'N/A'} | Notes:${m.notes || ''}`).join('\n') : 'Aucun membre'}

STOCKS D'ALIMENTS DISPONIBLES :
${inventory || 'Aucun stock renseigné'}

CATALOGUE DE SPORTS DISPONIBLES :
${sportCatalog && sportCatalog.length > 0 ? sportCatalog.map(s => `- ${s.name} (${s.defaultDuration})`).join('\n') : 'Aucun sport'}

INSTRUCTIONS UTILISATEUR :
${chatInput ? chatInput : "Génère le programme de la semaine."}
${mealPhoto ? "NOTE: Une photo d'un écart/repas a été envoyée. Adapte la suite du programme." : ""}

Formate ta réponse STRICTEMENT sous cette structure JSON :
{
  "summary": {
    "week": "Synthèse de la stratégie de la semaine (gestion des stocks, objectif)",
    "today": "Focus spécifique sur aujourd'hui (pourquoi ces repas précis, lien avec l'entraînement du jour ou d'hier)"
  },
  "days": [
    {
      "dateString": "JJ/MM",
      "dayName": "NomDuJour",
      "breakfast": { "name": "Plat", "portion": "Portion principale", "family": [{"member": "Nom", "note": "Instruction culinaire"}] },
      "lunch": { "name": "Plat", "portion": "Portion", "family": [] },
      "dinner": { "name": "Plat", "portion": "Portion", "family": [] },
      "sports": [
        { "user": "Nom", "name": "Nom sport ou Repos", "duration": "Durée", "intensity": "Intensité" }
      ]
    }
  ],
  "groceryList": ["Ingrédient manquant 1", "Ingrédient manquant 2"]
}
  `;

  let result = mealPhoto 
    ? await model.generateContent([promptSystem, { inlineData: { data: mealPhoto.split(',')[1], mimeType: "image/jpeg" } }])
    : await model.generateContent(promptSystem);

  let cleanText = (await result.response.text()).trim();
  if (cleanText.startsWith("```")) cleanText = cleanText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  
  return JSON.parse(cleanText);
};
