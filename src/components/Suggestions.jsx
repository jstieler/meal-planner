import { Sparkles, TrendingUp, Clock, CookingPot } from 'lucide-react';
import RecipeCard from './RecipeCard';
import { getSuggestedRecipes, getPreferenceSummary, getTopTags } from '../utils/suggestions';

const SEASON_TIPS = {
  spring: { label: 'Spring', emoji: '🌸', tip: 'Light salads, fresh herbs, and grilled proteins are perfect right now.' },
  summer: { label: 'Summer', emoji: '☀️', tip: 'Quick grills, cold noodles, and fresh produce shine in the heat.' },
  fall: { label: 'Fall', emoji: '🍂', tip: 'Hearty stews, roasted vegetables, and warm comfort food hit the spot.' },
  winter: { label: 'Winter', emoji: '❄️', tip: 'Slow cooker braises, creamy soups, and warming spices are your friends.' },
};

function getSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

export default function Suggestions({ recipes, mealPlan, onViewRecipe, onAddToWeek }) {
  const suggested = getSuggestedRecipes(recipes, mealPlan, 8);
  const preferences = getPreferenceSummary(recipes, mealPlan);
  const topTags = getTopTags(recipes, mealPlan);
  const season = getSeason();
  const seasonInfo = SEASON_TIPS[season];

  const quickMeals = recipes.filter(r => (r.prepTime + r.cookTime) <= 30 && !Object.values(mealPlan).some(p => p.recipeId === r.id)).slice(0, 4);
  const slowCooker = recipes.filter(r => r.tags?.includes('slow-cooker') && !Object.values(mealPlan).some(p => p.recipeId === r.id)).slice(0, 4);

  const totalMeals = Object.values(mealPlan).filter(p => p.recipeId).length;
  const hasEnoughData = totalMeals >= 3 || recipes.some(r => r.usageCount > 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-800">Discover Recipes</h2>
        <p className="text-sm text-stone-400 mt-0.5">Personalized suggestions just for your family</p>
      </div>

      {/* Seasonal tip */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-5 mb-6 text-white">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{seasonInfo.emoji}</span>
          <div>
            <p className="font-bold text-base">{seasonInfo.label} Cooking</p>
            <p className="text-white/85 text-sm mt-1 leading-relaxed">{seasonInfo.tip}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      {hasEnoughData && preferences.length > 0 && (
        <div className="bg-white rounded-3xl border border-amber-100 shadow-warm p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-orange-400" />
            <h3 className="font-semibold text-stone-700 text-sm">Your Family's Favorites</h3>
          </div>
          <p className="text-sm text-stone-500 mb-3">Based on your recipe history, your family tends to love:</p>
          <div className="flex flex-wrap gap-2">
            {preferences.map(pref => (
              <span key={pref} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-100">
                {pref}
              </span>
            ))}
          </div>
        </div>
      )}

      {!hasEnoughData && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Building your taste profile...</p>
              <p className="text-xs text-amber-600 mt-1">Plan a few more dinners to get personalized suggestions based on what your family loves!</p>
            </div>
          </div>
        </div>
      )}

      {/* Suggested for you */}
      {suggested.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-orange-400" />
            <h3 className="font-bold text-stone-800">Suggested For You</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggested.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onViewRecipe} />
            ))}
          </div>
        </section>
      )}

      {/* Quick weeknight meals */}
      {quickMeals.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-emerald-500" />
            <h3 className="font-bold text-stone-800">Quick Weeknight Dinners</h3>
            <span className="text-xs text-stone-400">30 min or less</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickMeals.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onViewRecipe} />
            ))}
          </div>
        </section>
      )}

      {/* Slow cooker */}
      {slowCooker.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CookingPot size={16} className="text-purple-500" />
            <h3 className="font-bold text-stone-800">Set It & Forget It</h3>
            <span className="text-xs text-stone-400">Slow cooker recipes</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {slowCooker.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onViewRecipe} />
            ))}
          </div>
        </section>
      )}

      {suggested.length === 0 && quickMeals.length === 0 && slowCooker.length === 0 && (
        <div className="text-center py-12">
          <span className="text-5xl">🍽️</span>
          <p className="text-stone-500 mt-3 font-medium">All your recipes are already in this week's plan!</p>
          <p className="text-stone-400 text-sm mt-1">Add more recipes to your library to get more suggestions</p>
        </div>
      )}

      <div className="h-24 md:h-8" />
    </div>
  );
}
