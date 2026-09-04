import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Service d'appel à l'API Google Gemini 3.6-flash
 */
export const generateWeeklyPlan = async ({ apiKey, family, goals, inventory, sportCatalog, chatInput, mealPhoto }) => {
  if (!apiKey) {
    throw new Error("Clé API manquante");
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

  const responseText = result.response.text();
  return JSON.parse(responseText.trim());
};
