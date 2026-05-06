import { useState } from 'react';
import Navigation from './components/Navigation';
import WeeklyCalendar from './components/WeeklyCalendar';
import RecipeLibrary from './components/RecipeLibrary';
import RecipeDetail from './components/RecipeDetail';
import AddEditRecipe from './components/AddEditRecipe';
import ImportRecipe from './components/ImportRecipe';
import ShoppingList from './components/ShoppingList';
import Suggestions from './components/Suggestions';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getWeekStart } from './utils/dateUtils';
import { sampleRecipes } from './data/sampleRecipes';

export default function App() {
  const [page, setPage] = useState('plan');
  const [recipes, setRecipes] = useLocalStorage('recipes', sampleRecipes);
  const [mealPlan, setMealPlan] = useLocalStorage('mealPlan', {});
  const [checkedItems, setCheckedItems] = useLocalStorage('shoppingChecked', {});
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const handleSaveRecipe = (recipe) => {
    setRecipes(prev => {
      const idx = prev.findIndex(r => r.id === recipe.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = recipe;
        return next;
      }
      return [...prev, recipe];
    });
    setEditingRecipe(null);
    setShowImport(false);
    if (viewingRecipe?.id === recipe.id) setViewingRecipe(recipe);
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
  };

  const handleDayUpdate = (dateKey, planData) => {
    setMealPlan(prev => ({ ...prev, [dateKey]: planData }));
    if (planData.recipeId) {
      setRecipes(prev => prev.map(r =>
        r.id === planData.recipeId
          ? { ...r, usageCount: (r.usageCount || 0) + 1, lastUsed: new Date().toISOString() }
          : r
      ));
    }
  };

  const handleToggleShoppingItem = (itemId) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleClearChecked = () => {
    setCheckedItems({});
  };

  const handleViewRecipe = (recipe) => {
    setViewingRecipe(recipe);
  };

  const handleEditRecipe = (recipe) => {
    setViewingRecipe(null);
    setEditingRecipe(recipe);
  };

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
