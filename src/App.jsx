import React, { useState, useEffect } from 'react';

// Composants de mise en page
import Header from './components/Header';
import Navigation from './components/Navigation';
import ApiKeyBanner from './components/ApiKeyBanner';

// Modules métier
import FamilyModule from './modules/FamilyModule';
import GoalsModule from './modules/GoalsModule';
import InventoryModule from './modules/InventoryModule';
import SportsModule from './modules/SportsModule';
import MealsModule from './modules/MealsModule';
import GroceryModule from './modules/GroceryModule';

// Services
import { generateWeeklyPlan } from './services/geminiService';

export default function App() {
  const [activeTab, setActiveTab] = useState('meals');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('gemini_api_key'));

  // --- ÉTATS PERSISTANTS & DYNAMIQUES (Initialisés vides si 1ère visite, ou rechargés depuis le stockage) ---
  const [family, setFamily] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_family');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: "Utilisateur principal", role: "Principal", age: 35, notes: "Pas de laitages" }
      ];
    } catch (e) { return []; }
  });

  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_goals');
      return saved ? JSON.parse(saved) : {
        1: { type: "Perte de gras & Tonification", target: "Réduire graisse abdominale", diet: "Hyperprotéiné" }
      };
    } catch (e) { return {}; }
  });

  const [inventory, setInventory] = useState(() => {
    return localStorage.getItem('fe_inventory') || "Œufs, Riz, Pâtes, Poulet, Brocolis, Saumon, Haricots verts";
  });

  const [sportCatalog, setSportCatalog] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_sports');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: "Corde à sauter", category: "Cardio", defaultDuration: "20 min", notes: "Corde 500g" },
        { id: 2, name: "Renforcement Musculaire", category: "Renforcement", defaultDuration: "30 min", notes: "Poids du corps" }
      ];
    } catch (e) { return []; }
  });

  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('fe_plan');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [mealPhoto, setMealPhoto] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Synchronisation automatique dans le stockage local à chaque modification
  useEffect(() => { localStorage.setItem('fe_family', JSON.stringify(family)); }, [family]);
  useEffect(() => { localStorage.setItem('fe_goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('fe_inventory', inventory); }, [inventory]);
  useEffect(() => { localStorage.setItem('fe_sports', JSON.stringify(sportCatalog)); }, [sportCatalog]);
  useEffect(() => { localStorage.setItem('fe_plan', JSON.stringify(weeklyPlan)); }, [weeklyPlan]);

  const saveApiKey = (key) => {
    const cleanKey = key.trim();
    setApiKey(cleanKey);
    localStorage.setItem('gemini_api_key', cleanKey);
    setShowSettings(false);
  };

  // Actions de modification dynamique
  const handleAddFamilyMember = () => {
    const newId = Date.now();
    setFamily([...family, { id: newId, name: "Nouveau membre", role: "Membre", age: 0, notes: "" }]);
    setGoals({ ...goals, [newId]: { type: "Maintien", target: "", diet: "Standard" } });
  };

  const handleRemoveFamilyMember = (id) => {
    setFamily(family.filter(m => m.id !== id));
    const updatedGoals = { ...goals };
    delete updatedGoals[id];
    setGoals(updatedGoals);
  };

  const handleAddSport = () => {
    setSportCatalog([...sportCatalog, {
      id: Date.now(), name: "Nouvelle activité", category: "Cardio", defaultDuration: "30 min", notes: ""
    }]);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMealPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Envoi dynamique de TOUTES les données saisies par l'utilisateur à Gemini
  const handleGenerate = async () => {
    if (!apiKey) {
      alert("Veuillez renseigner votre clé API Gemini.");
      setShowSettings(true);
      return;
    }

    setLoading(true);

    try {
      const plan = await generateWeeklyPlan({
        apiKey, family, goals, inventory, sportCatalog, chatInput, mealPhoto
      });
      
      setWeeklyPlan(plan);
      setChatInput("");
      setMealPhoto(null);
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion lors de la génération avec Gemini.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12">
      <Header onToggleSettings={() => setShowSettings(!showSettings)} />

      {showSettings && (
        <ApiKeyBanner apiKey={apiKey} setApiKey={setApiKey} onSave={saveApiKey} />
      )}

      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        familyCount={family.length} 
        sportsCount={sportCatalog.length} 
      />

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {activeTab === 'meals' && (
          <MealsModule 
            chatInput={chatInput}
            setChatInput={setChatInput}
            mealPhoto={mealPhoto}
            setMealPhoto={setMealPhoto}
            onPhotoUpload={handlePhotoUpload}
            onGenerate={handleGenerate}
            loading={loading}
            weeklyPlan={weeklyPlan}
          />
        )}

        {activeTab === 'family' && (
          <FamilyModule 
            family={family} 
            setFamily={setFamily} 
            onAddMember={handleAddFamilyMember} 
            onRemoveMember={handleRemoveFamilyMember} 
          />
        )}

        {activeTab === 'goals' && (
          <GoalsModule family={family} goals={goals} setGoals={setGoals} />
        )}

        {activeTab === 'inventory' && (
          <InventoryModule inventory={inventory} setInventory={setInventory} />
        )}

        {activeTab === 'sports' && (
          <SportsModule 
            sportCatalog={sportCatalog} 
            setSportCatalog={setSportCatalog} 
            onAddSport={handleAddSport} 
          />
        )}

        {activeTab === 'grocery' && (
          <GroceryModule groceryList={weeklyPlan?.groceryList} />
        )}
      </main>
    </div>
  );
}
