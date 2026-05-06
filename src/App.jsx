import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import WeeklyCalendar from './components/WeeklyCalendar';
import RecipeLibrary from './components/RecipeLibrary';
import RecipeDetail from './components/RecipeDetail';
import AddEditRecipe from './components/AddEditRecipe';
import ImportRecipe from './components/ImportRecipe';
import ShoppingList from './components/ShoppingList';
import Suggestions from './components/Suggestions';
import { supabase } from './lib/supabase';
import {
  fetchRecipes, upsertRecipe, deleteRecipeDb,
  fetchMealPlan, upsertMealPlanDay,
  fetchCheckedItems, setCheckedItem, clearCheckedItems,
} from './lib/db';
import { getWeekStart } from './utils/dateUtils';
import { sampleRecipes } from './data/sampleRecipes';

export default function App() {
  const [page, setPage] = useState('plan');
  const [recipes, setRecipes] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  const [checkedItems, setCheckedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        const [r, mp, ci] = await Promise.all([fetchRecipes(), fetchMealPlan(), fetchCheckedItems()]);
        if (!mounted) return;

        if (r.length === 0) {
          // Seed with sample recipes on first load
          await Promise.all(sampleRecipes.map(upsertRecipe));
          if (mounted) setRecipes(sampleRecipes);
        } else {
          setRecipes(r);
        }
        setMealPlan(mp);
        setCheckedItems(ci);
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();

    // Real-time sync — reload when another device makes changes
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, async () => {
        const r = await fetchRecipes().catch(() => null);
        if (mounted && r) setRecipes(r);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan' }, async () => {
        const mp = await fetchMealPlan().catch(() => null);
        if (mounted && mp) setMealPlan(mp);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_checked' }, async () => {
        const ci = await fetchCheckedItems().catch(() => null);
        if (mounted && ci) setCheckedItems(ci);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSaveRecipe = async (recipe) => {
    const saved = {
      ...recipe,
      id: recipe.id || `r${Date.now()}`,
      createdAt: recipe.createdAt || Date.now(),
      usageCount: recipe.usageCount || 0,
    };
    setRecipes(prev => {
      const idx = prev.findIndex(r => r.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    setEditingRecipe(null);
    setShowImport(false);
    if (viewingRecipe?.id === saved.id) setViewingRecipe(saved);
    upsertRecipe(saved).catch(console.error);
  };

  const handleDeleteRecipe = (id) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    setMealPlan(prev => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key].recipeId === id) next[key] = { ...next[key], recipeId: null };
      }
      return next;
    });
    deleteRecipeDb(id).catch(console.error);
  };

  const handleDayUpdate = (dateKey, planData) => {
    setMealPlan(prev => ({ ...prev, [dateKey]: planData }));
    if (planData.recipeId) {
      setRecipes(prev => prev.map(r =>
        r.id === planData.recipeId
          ? { ...r, usageCount: (r.usageCount || 0) + 1, lastUsed: new Date().toISOString() }
          : r
      ));
      const recipe = recipes.find(r => r.id === planData.recipeId);
      if (recipe) {
        upsertRecipe({ ...recipe, usageCount: (recipe.usageCount || 0) + 1, lastUsed: new Date().toISOString() }).catch(console.error);
      }
    }
    upsertMealPlanDay(dateKey, planData).catch(console.error);
  };

  const handleToggleShoppingItem = (itemId) => {
    const newVal = !checkedItems[itemId];
    setCheckedItems(prev => ({ ...prev, [itemId]: newVal }));
    setCheckedItem(itemId, newVal).catch(console.error);
  };

  const handleClearChecked = () => {
    setCheckedItems({});
    clearCheckedItems().catch(console.error);
  };

  const handleViewRecipe = (recipe) => setViewingRecipe(recipe);
  const handleEditRecipe = (recipe) => { setViewingRecipe(null); setEditingRecipe(recipe); };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-stone-500 text-sm font-medium">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <Navigation page={page} setPage={setPage} />

      <main className="px-4 py-6 md:px-6 md:py-8 pb-28 md:pb-10">
        {page === 'plan' && (
          <WeeklyCalendar
            mealPlan={mealPlan}
            recipes={recipes}
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            onDayUpdate={handleDayUpdate}
          />
        )}

        {page === 'recipes' && (
          <RecipeLibrary
            recipes={recipes}
            onAddRecipe={() => setEditingRecipe({ id: null })}
            onImportRecipe={() => setShowImport(true)}
            onViewRecipe={handleViewRecipe}
            onEditRecipe={handleEditRecipe}
          />
        )}

        {page === 'shopping' && (
          <ShoppingList
            mealPlan={mealPlan}
            recipes={recipes}
            weekStart={weekStart}
            checkedItems={checkedItems}
            onToggleItem={handleToggleShoppingItem}
            onClearChecked={handleClearChecked}
          />
        )}

        {page === 'discover' && (
          <Suggestions
            recipes={recipes}
            mealPlan={mealPlan}
            onViewRecipe={handleViewRecipe}
          />
        )}
      </main>

      {/* Modals */}
      {viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onEdit={handleEditRecipe}
          onDelete={handleDeleteRecipe}
        />
      )}

      {editingRecipe !== null && !showImport && (
        <AddEditRecipe
          recipe={editingRecipe?.id ? editingRecipe : null}
          onSave={handleSaveRecipe}
          onClose={() => setEditingRecipe(null)}
        />
      )}

      {showImport && (
        <ImportRecipe
          onSave={handleSaveRecipe}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
