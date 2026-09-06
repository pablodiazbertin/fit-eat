import { GoogleGenerativeAI } from '@google/generative-ai';

// Fonction 1 : Génération ou Re-génération Globale
export const generateWeeklyPlan = async ({ apiKey, family, goals, inventory, sportCatalog, chatInput, mealPhoto, existingPlan }) => {
  if (!apiKey || !apiKey.trim()) throw new Error("Clé API manquante ou invalide");

  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash", generationConfig: { responseMimeType: "application/json" } });

  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const promptSystem = `
Tu es un coach expert en nutrition et sport. 
DATE D'AUJOURD'HUI : ${todayStr}. 

RÈGLES D'OR ABSOLUES :
1. RESPECT DU PASSÉ : Si un plan existant est fourni, NE MODIFIE JAMAIS les jours antérieurs à aujourd'hui. 
2. SPORT : Tu DOIS IMPÉRATIVEMENT respecter les consignes de durée ou d'équipement (ex: cordes lestées) demandées par l'utilisateur et les détailler dans le champ "program".
3. STOCKS : Utilise les stocks disponibles.
4. RESTAURANT : Si l'utilisateur mange dehors, nomme le plat "Restaurant" ou "Repas extérieur" et laisse la recette vide.

INSTRUCTIONS UTILISATEUR :
${chatInput ? chatInput : "Génère le programme de la semaine à partir d'aujourd'hui."}

PLAN EXISTANT (à mettre à jour à partir d'aujourd'hui uniquement si pertinent) :
${existingPlan ? JSON.stringify(existingPlan) : "Aucun"}

STOCKS : ${inventory || 'Aucun'}
SPORTS DISPOS : ${sportCatalog && sportCatalog.length > 0 ? sportCatalog.map(s => `- ${s.name} (${s.defaultDuration})`).join('\n') : 'Aucun'}

Formate ta réponse STRICTEMENT sous cette structure JSON (Même format pour la semaine complète) :
{
  "summary": { "week": "Vision globale", "today": "Focus aujourd'hui" },
  "days": [
    {
      "dateString": "JJ/MM",
      "dayName": "NomDuJour",
      "breakfast": { "name": "Plat", "portion": "Portion", "recipe": "Instructions", "family": [] },
      "lunch": { "name": "Plat", "portion": "Portion", "recipe": "Instructions", "family": [] },
      "dinner": { "name": "Plat", "portion": "Portion", "recipe": "Instructions", "family": [] },
      "sports": [{ "user": "Nom", "name": "Nom sport", "duration": "Durée", "intensity": "Intensité", "program": "Détail séance" }]
    }
  ],
  "groceryList": ["Ingrédient manquant"]
}
  `;

  let result = mealPhoto 
    ? await model.generateContent([promptSystem, { inlineData: { data: mealPhoto.split(',')[1], mimeType: "image/jpeg" } }])
    : await model.generateContent(promptSystem);

  let cleanText = (await result.response.text()).trim();
  if (cleanText.startsWith("```")) cleanText = cleanText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(cleanText);
};

// Fonction 2 : Adaptation Unitaire Locale (Mini-chat)
export const adaptSingleItem = async ({ apiKey, item, itemType, userInput, inventory, family }) => {
  if (!apiKey || !apiKey.trim()) throw new Error("Clé API manquante ou invalide");
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash", generationConfig: { responseMimeType: "application/json" } });

  const promptSystem = `
Tu es un assistant d'adaptation à la volée. 
L'utilisateur veut modifier un SEUL élément : un ${itemType === 'sport' ? 'entraînement sportif' : 'repas'}.

ÉLÉMENT ACTUEL :
${JSON.stringify(item)}

DEMANDE DE L'UTILISATEUR :
"${userInput}"

RÈGLES :
- Si l'utilisateur signale aller au restaurant, nomme le plat "Restaurant" et vide la recette.
- Si c'est du sport et qu'il mentionne un temps réduit ou un équipement, modifie la durée et le "program" en conséquence.
- STOCKS : ${inventory}

Renvoie UNIQUEMENT l'objet JSON modifié correspondant à cet élément, avec la même structure que l'élément actuel.
  `;

  let result = await model.generateContent(promptSystem);
  let cleanText = (await result.response.text()).trim();
  if (cleanText.startsWith("```")) cleanText = cleanText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(cleanText);
};
