export function getTopTags(recipes, mealPlan) {
  const tagCounts = {};
  const usedIds = new Set(Object.values(mealPlan).map(d => d.recipeId).filter(Boolean));

  for (const recipe of recipes) {
    const weight = recipe.usageCount + (usedIds.has(recipe.id) ? 2 : 0);
    for (const tag of (recipe.tags || [])) {
      tagCounts[tag] = (tagCounts[tag] || 0) + weight;
    }
  }

  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);
}

export function getSuggestedRecipes(recipes, mealPlan, count = 6) {
  const topTags = getTopTags(recipes, mealPlan);
  const usedThisWeek = new Set(Object.values(mealPlan).map(d => d.recipeId).filter(Boolean));

  const scored = recipes.map(recipe => {
    const tagScore = (recipe.tags || []).filter(t => topTags.includes(t)).length;
    const recencyPenalty = usedThisWeek.has(recipe.id) ? -3 : 0;
    const usageBonus = Math.min(recipe.usageCount || 0, 5) * 0.5;
    return { recipe, score: tagScore + usageBonus + recencyPenalty };
  });

  const notThisWeek = scored.filter(s => !usedThisWeek.has(s.recipe.id));
  notThisWeek.sort((a, b) => b.score - a.score);
  return notThisWeek.slice(0, count).map(s => s.recipe);
}

export function getPreferenceSummary(recipes, mealPlan) {
  const topTags = getTopTags(recipes, mealPlan);
  const tagLabels = {
    italian: 'Italian', mexican: 'Mexican', asian: 'Asian', american: 'American',
    'slow-cooker': 'Slow Cooker', quick: 'Quick Meals', healthy: 'Healthy',
    'comfort-food': 'Comfort Food', chicken: 'Chicken Dishes', beef: 'Beef Dishes',
    pasta: 'Pasta', vegetarian: 'Vegetarian', seafood: 'Seafood',
    weeknight: 'Weeknight Meals', 'one-pan': 'One-Pan Meals', 'family-favorite': 'Family Favorites',
  };
  return topTags.slice(0, 5).map(t => tagLabels[t] || t).filter(Boolean);
}
