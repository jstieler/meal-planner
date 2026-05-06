const CORS_PROXY = 'https://api.allorigins.win/get?url=';

function parseDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 60) + parseInt(match[2] || 0);
}

function parseIngredientString(str) {
  const s = str.trim();
  const fractions = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1/3, '⅔': 2/3, '⅛': 0.125 };
  let normalized = s;
  for (const [char, val] of Object.entries(fractions)) {
    normalized = normalized.replace(char, ` ${val}`);
  }
  normalized = normalized.replace(/(\d+)\s*\/\s*(\d+)/g, (_, a, b) => String(parseFloat(a) / parseFloat(b)));

  const unitPattern = 'cups?|tbsp|tablespoons?|tsp|teaspoons?|lbs?|pounds?|oz|ounces?|g|grams?|kg|ml|liters?|l|cloves?|cans?|pieces?|slices?|fillets?|stalks?|heads?|bunches?|bundles?|sprigs?|pinch|dash';
  const regex = new RegExp(`^([\\d.]+(?:\\s+[\\d.]+)?)\\s*(${unitPattern})\\.?\\s+(.+)$`, 'i');
  const regexNoUnit = /^([\d.]+)\s+(.+)$/;

  let match = normalized.match(regex);
  if (match) {
    return { amount: parseFloat(match[1]), unit: match[2].toLowerCase(), name: match[3] };
  }
  match = normalized.match(regexNoUnit);
  if (match) {
    return { amount: parseFloat(match[1]), unit: '', name: match[2] };
  }
  return { amount: 1, unit: '', name: s };
}

function extractRecipeFromJson(json) {
  if (!json) return null;

  let recipeData = json;
  if (Array.isArray(json)) {
    recipeData = json.find(item => item['@type'] === 'Recipe' ||
      (Array.isArray(item['@type']) && item['@type'].includes('Recipe')));
  }
  if (recipeData && recipeData['@graph']) {
    recipeData = recipeData['@graph'].find(item => item['@type'] === 'Recipe' ||
      (Array.isArray(item['@type']) && item['@type'].includes('Recipe')));
  }
  if (!recipeData || (recipeData['@type'] !== 'Recipe' &&
      !(Array.isArray(recipeData['@type']) && recipeData['@type'].includes('Recipe')))) {
    return null;
  }

  const ingredients = (recipeData.recipeIngredient || []).map(parseIngredientString);

  const instructions = [];
  const rawInstructions = recipeData.recipeInstructions || [];
  if (typeof rawInstructions === 'string') {
    instructions.push(...rawInstructions.split(/\n+/).filter(Boolean));
  } else if (Array.isArray(rawInstructions)) {
    for (const step of rawInstructions) {
      if (typeof step === 'string') instructions.push(step);
      else if (step.text) instructions.push(step.text);
      else if (step.itemListElement) {
        step.itemListElement.forEach(s => s.text && instructions.push(s.text));
      }
    }
  }

  const servingsRaw = recipeData.recipeYield;
  let servings = 4;
  if (typeof servingsRaw === 'number') servings = servingsRaw;
  else if (typeof servingsRaw === 'string') {
    const m = servingsRaw.match(/\d+/);
    if (m) servings = parseInt(m[0]);
  } else if (Array.isArray(servingsRaw) && servingsRaw.length > 0) {
    const m = String(servingsRaw[0]).match(/\d+/);
    if (m) servings = parseInt(m[0]);
  }

  let imageUrl = '';
  if (recipeData.image) {
    if (typeof recipeData.image === 'string') imageUrl = recipeData.image;
    else if (Array.isArray(recipeData.image)) imageUrl = recipeData.image[0]?.url || recipeData.image[0] || '';
    else if (recipeData.image.url) imageUrl = recipeData.image.url;
  }

  const tags = [];
  if (recipeData.keywords) {
    const kw = typeof recipeData.keywords === 'string'
      ? recipeData.keywords.split(',').map(s => s.trim().toLowerCase())
      : recipeData.keywords;
    tags.push(...kw.slice(0, 8));
  }
  if (recipeData.recipeCategory) tags.push(...(Array.isArray(recipeData.recipeCategory) ? recipeData.recipeCategory : [recipeData.recipeCategory]).map(s => s.toLowerCase()));
  if (recipeData.recipeCuisine) tags.push(...(Array.isArray(recipeData.recipeCuisine) ? recipeData.recipeCuisine : [recipeData.recipeCuisine]).map(s => s.toLowerCase()));

  return {
    name: recipeData.name || 'Imported Recipe',
    description: recipeData.description || '',
    emoji: '🍽️',
    prepTime: parseDuration(recipeData.prepTime),
    cookTime: parseDuration(recipeData.cookTime) || parseDuration(recipeData.totalTime),
    servings,
    ingredients,
    instructions,
    tags: [...new Set(tags)].slice(0, 10),
    imageUrl,
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    source: '',
  };
}

export async function importFromUrl(url) {
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Failed to fetch recipe page');

  const data = await response.json();
  const html = data.contents;
  if (!html) throw new Error('No content returned');

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent);
      const recipe = extractRecipeFromJson(json);
      if (recipe) {
        recipe.source = url;
        return recipe;
      }
    } catch {
      // try next script tag
    }
  }

  throw new Error('No structured recipe data found on this page. The site may not support recipe imports. Try copying the recipe and using manual entry instead.');
}

export function parseRecipeText(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const ingredients = [];
  const instructions = [];
  let inIngredients = false;
  let inInstructions = false;

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (lower.includes('ingredient')) { inIngredients = true; inInstructions = false; continue; }
    if (lower.includes('instruction') || lower.includes('direction') || lower.includes('method') || lower.includes('steps')) {
      inInstructions = true; inIngredients = false; continue;
    }
    if (inIngredients && line.trim()) {
      ingredients.push(parseIngredientString(line.trim()));
    } else if (inInstructions && line.trim()) {
      const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
      if (cleaned) instructions.push(cleaned);
    }
  }

  return { ingredients, instructions };
}
