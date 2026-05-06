import { NUTRITION_DB, UNIT_TO_GRAMS } from '../data/ingredientData';

function findNutritionMatch(name) {
  const lower = name.toLowerCase();
  for (const [key, data] of Object.entries(NUTRITION_DB)) {
    if (lower.includes(key)) return data;
  }
  return null;
}

function toGrams(amount, unit) {
  const lower = (unit || '').toLowerCase().replace(/\./, '');
  return amount * (UNIT_TO_GRAMS[lower] || 100);
}

export function estimateNutrition(ingredients, servings = 4) {
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const ing of ingredients) {
    const data = findNutritionMatch(ing.name);
    if (!data) continue;
    const grams = toGrams(ing.amount || 1, ing.unit);
    const factor = grams / 100;
    totals.calories += data.calories * factor;
    totals.protein += data.protein * factor;
    totals.carbs += data.carbs * factor;
    totals.fat += data.fat * factor;
  }

  const perServing = {
    calories: Math.round(totals.calories / servings),
    protein: Math.round(totals.protein / servings),
    carbs: Math.round(totals.carbs / servings),
    fat: Math.round(totals.fat / servings),
  };

  const hasData = perServing.calories > 0 || perServing.protein > 0;
  return hasData ? perServing : null;
}
