import { categorizeIngredient } from '../data/ingredientData';

function normalizeIngredientName(name) {
  return name.toLowerCase()
    .replace(/,.*$/, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(fresh|dried|chopped|minced|diced|sliced|grated|shredded|cooked|raw|large|medium|small|boneless|skinless|bone-in|skin-on|ripe|halved|quartered|trimmed)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const UNIT_GROUPS = {
  volume: ['cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons', 'ml', 'l', 'oz', 'ounce', 'ounces'],
  weight: ['lb', 'lbs', 'pound', 'pounds', 'g', 'gram', 'grams', 'kg'],
};

function canCombineUnits(a, b) {
  const aLow = (a || '').toLowerCase();
  const bLow = (b || '').toLowerCase();
  if (aLow === bLow) return true;
  for (const group of Object.values(UNIT_GROUPS)) {
    if (group.includes(aLow) && group.includes(bLow)) return true;
  }
  return false;
}

function formatAmount(amount) {
  if (Number.isInteger(amount)) return String(amount);
  const rounded = Math.round(amount * 4) / 4;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  const fracMap = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.333: '⅓', 0.667: '⅔' };
  const fracStr = fracMap[Math.round(frac * 1000) / 1000] || frac.toFixed(1).replace(/\.0$/, '');
  return whole > 0 ? (fracStr ? `${whole} ${fracStr}` : String(whole)) : (fracStr || String(rounded.toFixed(1)));
}

export function generateShoppingList(recipes) {
  const consolidated = {};

  for (const recipe of recipes) {
    if (!recipe?.ingredients) continue;
    for (const ing of recipe.ingredients) {
      const normalizedName = normalizeIngredientName(ing.name);
      const key = normalizedName;

      if (!consolidated[key]) {
        consolidated[key] = {
          id: key,
          name: normalizedName,
          displayName: ing.name.replace(/,.*$/, '').replace(/\(.*?\)/g, '').trim(),
          amount: ing.amount || 0,
          unit: ing.unit || '',
          recipes: [recipe.name],
          category: categorizeIngredient(normalizedName),
        };
      } else {
        const existing = consolidated[key];
        if (canCombineUnits(existing.unit, ing.unit)) {
          existing.amount += (ing.amount || 0);
          if (!existing.recipes.includes(recipe.name)) existing.recipes.push(recipe.name);
        } else {
          const altKey = `${key}_${ing.unit}`;
          if (!consolidated[altKey]) {
            consolidated[altKey] = {
              id: altKey,
              name: normalizedName,
              displayName: ing.name.replace(/,.*$/, '').replace(/\(.*?\)/g, '').trim(),
              amount: ing.amount || 0,
              unit: ing.unit || '',
              recipes: [recipe.name],
              category: categorizeIngredient(normalizedName),
            };
          } else {
            consolidated[altKey].amount += (ing.amount || 0);
          }
        }
      }
    }
  }

  const items = Object.values(consolidated).map(item => ({
    ...item,
    displayAmount: item.amount > 0 ? `${formatAmount(item.amount)} ${item.unit}`.trim() : '',
  }));

  return items;
}
