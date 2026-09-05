import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateWeeklyPlan = async ({ apiKey, family, goals, inventory, sportCatalog, chatInput, mealPhoto }) => {
  if (!apiKey || !apiKey.trim()) throw new Error("Clé API manquante ou invalide");

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.6-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const promptSystem = `
Tu es un coach expert en nutrition, entraînement physique et organisation familiale.
Génère ou adapte le programme pour 7 jours. 

RÈGLE D'OR : TU DOIS CONSTRUIRE LES REPAS EN PRIORITÉ AVEC LES STOCKS D'ALIMENTS DISPONIBLES CI-DESSOUS.

FAMILLE & MEMBRES :
${family && family.length > 0 ? family.map(m => `- ${m.name} (${m.role}, ${m.age} ans) | Objectif:${goals[m.id]?.type || 'N/A'} | Notes:${m.notes || ''}`).join('\n') : 'Aucun membre'}

STOCKS D'ALIMENTS DISPONIBLES :
${inventory || 'Aucun stock renseigné'}

CATALOGUE DE SPORTS DISPONIBLES :
${sportCatalog && sportCatalog.length > 0 ? sportCatalog.map(s => `- ${s.name} (${s.defaultDuration})`).join('\n') : 'Aucun sport'}

INSTRUCTIONS UTILISATEUR :
${chatInput ? chatInput : "Génère le programme de la semaine à partir d'aujourd'hui."}
${mealPhoto ? "NOTE: Une photo d'un écart/repas a été envoyée. Adapte la suite du programme." : ""}

Formate ta réponse STRICTEMENT sous cette structure JSON :
{
  "summary": "Synthèse de la stratégie (ex: 'Utilisation des stocks de poulet, focus cardio')",
  "days": [
    {
      "dateString": "JJ/MM",
      "dayName": "NomDuJour",
      "breakfast": { "name": "Plat", "portion": "Portion principale", "family": [{"member": "Nom", "note": "Ajustement"}] },
      "lunch": { "name": "Plat", "portion": "Portion principale", "family": [] },
      "dinner": { "name": "Plat", "portion": "Portion principale", "family": [] },
      "sports": [
        { "user": "Nom utilisateur 1", "name": "Nom sport ou Repos", "duration": "Durée", "intensity": "Intensité" }
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
