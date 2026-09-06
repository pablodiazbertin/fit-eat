import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateWeeklyPlan = async ({ apiKey, family, goals, inventory, sportCatalog, chatInput, mealPhoto, existingPlan }) => {
  if (!apiKey || !apiKey.trim()) throw new Error("Clé API manquante ou invalide");

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash", generationConfig: { responseMimeType: "application/json" } });

  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const promptSystem = `
Tu es un coach expert en nutrition et sport. 
DATE D'AUJOURD'HUI : ${todayStr}. 

RÈGLES D'OR :
1. RESPECT DU PASSÉ : Si un plan existant est fourni, NE MODIFIE JAMAIS les jours antérieurs à aujourd'hui.
2. REPAS EXTÉRIEUR : Si l'utilisateur mange hors domicile (restaurant, amis, parents) sans menu précis, définis "isOutside": true, vide la recette et la portion.
3. SPORT : Précise TOUJOURS la "duration" (durée totale) et respecte le matériel demandé dans "program".
4. PÉDAGOGIE : Explique tes choix de conception dans le "summary".

INSTRUCTIONS UTILISATEUR :
${chatInput ? chatInput : "Génère le programme à partir d'aujourd'hui."}

PLAN EXISTANT :
${existingPlan ? JSON.stringify(existingPlan) : "Aucun"}

STOCKS : ${inventory || 'Aucun'}
SPORTS DISPOS : ${sportCatalog && sportCatalog.length > 0 ? sportCatalog.map(s => `- ${s.name} (${s.defaultDuration})`).join('\n') : 'Aucun'}

Formate ta réponse STRICTEMENT sous cette structure JSON :
{
  "summary": { "week": "Vision globale", "today": "Focus aujourd'hui avec explication des choix" },
  "days": [
    {
      "dateString": "JJ/MM",
      "dayName": "NomDuJour",
      "breakfast": { "name": "Plat", "portion": "Portion", "recipe": "Instructions", "isOutside": false, "family": [] },
      "lunch": { "name": "Plat", "portion": "Portion", "recipe": "Instructions", "isOutside": false, "family": [] },
      "dinner": { "name": "Plat", "portion": "Portion", "recipe": "Instructions", "isOutside": false, "family": [] },
      "sports": [{ "user": "Nom", "name": "Nom sport", "duration": "Durée totale", "intensity": "Intensité", "program": "Détail séance" }]
    }
  ],
  "groceryList": ["Ingrédient"]
}
  `;

  let result = mealPhoto 
    ? await model.generateContent([promptSystem, { inlineData: { data: mealPhoto.split(',')[1], mimeType: "image/jpeg" } }])
    : await model.generateContent(promptSystem);

  let cleanText = (await result.response.text()).trim();
  if (cleanText.startsWith("```")) cleanText = cleanText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(cleanText);
};

export const adaptSingleItem = async ({ apiKey, item, itemType, userInput, inventory }) => {
  if (!apiKey || !apiKey.trim()) throw new Error("Clé API manquante ou invalide");
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash", generationConfig: { responseMimeType: "application/json" } });

  const promptSystem = `
Tu es un assistant JSON strict. Tu adaptes un SEUL élément (${itemType === 'sport' ? 'sport' : 'repas'}).
Tu NE DOIS RENVOYER QUE DU JSON VALIDE. AUCUN TEXTE AVANT OU APRÈS.

ÉLÉMENT ACTUEL : ${JSON.stringify(item)}
DEMANDE : "${userInput}"
STOCKS : ${inventory}

RÈGLES :
1. Si la demande implique un repas à l'extérieur (resto, amis), mets "isOutside": true, "name": "Restaurant / Extérieur", vide la recette et la portion, et précise dans "rationale" qu'il faudra déclarer le contenu plus tard.
2. Si c'est un écart calorique ou un changement justifiant d'adapter le reste de la semaine, mets "impactsFuture": true. Sinon false.
3. Remplis "rationale" avec une explication de coach (ex: "J'ai remplacé par X car Y.").

FORMAT JSON ATTENDU :
{
  "item": { 
    // Reprendre la structure exacte de l'élément fourni avec tes modifications
    "name": "...", "portion": "...", "recipe": "...", "isOutside": boolean, 
    // Si c'est du sport, inclure "duration", "program", "intensity"
  },
  "rationale": "Explication de ton choix",
  "impactsFuture": boolean
}
  `;

  let result = await model.generateContent(promptSystem);
  let cleanText = (await result.response.text()).trim();
  if (cleanText.startsWith("```")) cleanText = cleanText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(cleanText);
};
