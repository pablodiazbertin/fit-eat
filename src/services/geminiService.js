import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Service d'appel à l'API Google Gemini 3.6-flash
 */
export const generateWeeklyPlan = async ({ apiKey, family, goals, inventory, sportCatalog, chatInput, mealPhoto }) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Clé API manquante ou invalide");
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.6-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const promptSystem = `
Tu es un coach expert en nutrition, entraînement physique et organisation familiale.
Génère ou adapte le programme complet de la semaine.

FAMILLE & MEMBRES :
${family && family.length > 0 
  ? family.map(m => \- ${m.name} (${m.role}, ${m.age} ans) \vert{} Objectif:${goals[m.id]?.type || 'N/A'} (${goals[m.id]?.target \vert{}\vert{} ''}) \vert{} Notes:${m.notes || ''}`).join('\n')`
  : 'Aucun membre renseigné'}

STOCKS D'ALIMENTS DISPONIBLES :
${inventory || 'Aucun stock renseigné'}

CATALOGUE DE SPORTS DISPONIBLES :
${sportCatalog && sportCatalog.length > 0 
  ? sportCatalog.map(s => `- ${s.name} (${s.category}, ${s.defaultDuration}) :${s.notes || ''}`).join('\n')
  : 'Aucun sport renseigné'}

INSTRUCTIONS UTILISATEUR :
${chatInput ? chatInput : "Génère le programme de la semaine."}
${mealPhoto ? "NOTE: Une photo de repas consommé a été envoyée. Adapte les repas suivants." : ""}

Formate ta réponse STRICTEMENT sous cette structure JSON :
{
  "summary": "Synthèse de la stratégie globale",
  "days": [
    {
      "day": "Lundi",
      "sport": { "type": "Nom sport ou Repos", "duration": "Durée ou -", "intensity": "Haute/Moyenne/Repos", "notes": "Conseil" },
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

  const responseText = await result.response.text();
  
  // Nettoyage de sécurité au cas où des balises markdown entourent le JSON
  let cleanText = responseText.trim();
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  }

  return JSON.parse(cleanText);
};
