import { supabase } from './supabase';

// ─── Recipes ────────────────────────────────────────────────────────────────

function rowToRecipe(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    emoji: row.emoji || '🍽️',
    prepTime: row.prep_time || 0,
    cookTime: row.cook_time || 0,
    servings: row.servings || 4,
    tags: row.tags || [],
    ingredients: row.ingredients || [],
    instructions: row.instructions || [],
    imageUrl: row.image_url || '',
    source: row.source || '',
    nutrition: row.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    sideRequired: row.side_required || false,
    usageCount: row.usage_count || 0,
    lastUsed: row.last_used || null,
    createdAt: row.created_at || Date.now(),
  };
}

function recipeToRow(recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description || '',
    emoji: recipe.emoji || '🍽️',
    prep_time: recipe.prepTime || 0,
    cook_time: recipe.cookTime || 0,
    servings: recipe.servings || 4,
    tags: recipe.tags || [],
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    // Skip base64 data URLs — too large for DB rows
    image_url: recipe.imageUrl?.startsWith('data:') ? '' : (recipe.imageUrl || ''),
    source: recipe.source || '',
    nutrition: recipe.nutrition || null,
    side_required: recipe.sideRequired || false,
    usage_count: recipe.usageCount || 0,
    last_used: recipe.lastUsed || null,
    created_at: recipe.createdAt || Date.now(),
  };
}

export async function fetchRecipes() {
  const { data, error } = await supabase.from('recipes').select('*').order('created_at');
  if (error) throw error;
  return (data || []).map(rowToRecipe);
}

export async function upsertRecipe(recipe) {
  const { error } = await supabase.from('recipes').upsert(recipeToRow(recipe));
  if (error) throw error;
}

export async function deleteRecipeDb(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Meal Plan ──────────────────────────────────────────────────────────────

function rowToPlan(row) {
  // side_recipe_ids (new array column) takes precedence; fall back to legacy side_recipe_id
  let sideRecipeIds = [];
  if (Array.isArray(row.side_recipe_ids) && row.side_recipe_ids.length > 0) {
    sideRecipeIds = row.side_recipe_ids;
  } else if (row.side_recipe_id) {
    sideRecipeIds = [row.side_recipe_id];
  }
  return {
    recipeId: row.recipe_id || null,
    isBusy: row.is_busy || false,
    isDiningOut: row.is_dining_out || false,
    isGrill: row.is_grill || false,
    sideRecipeIds,
  };
}

function planToRow(dateKey, plan) {
  const sideRecipeIds = plan.sideRecipeIds || [];
  return {
    date_key: dateKey,
    recipe_id: plan.recipeId || null,
    is_busy: plan.isBusy || false,
    is_dining_out: plan.isDiningOut || false,
    is_grill: plan.isGrill || false,
    side_recipe_id: sideRecipeIds[0] || null,
    side_recipe_ids: sideRecipeIds,
  };
}

export async function fetchMealPlan() {
  const { data, error } = await supabase.from('meal_plan').select('*');
  if (error) throw error;
  const plan = {};
  for (const row of (data || [])) {
    plan[row.date_key] = rowToPlan(row);
  }
  return plan;
}

export async function upsertMealPlanDay(dateKey, plan) {
  const { error } = await supabase.from('meal_plan').upsert(planToRow(dateKey, plan));
  if (error) throw error;
}

// ─── Shopping Checked ────────────────────────────────────────────────────────

export async function fetchCheckedItems() {
  const { data, error } = await supabase.from('shopping_checked').select('*').eq('checked', true);
  if (error) throw error;
  const checked = {};
  for (const row of (data || [])) {
    checked[row.item_id] = true;
  }
  return checked;
}

export async function setCheckedItem(itemId, checked) {
  if (checked) {
    const { error } = await supabase.from('shopping_checked').upsert({ item_id: itemId, checked: true });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('shopping_checked').delete().eq('item_id', itemId);
    if (error) throw error;
  }
}

export async function clearCheckedItems() {
  const { error } = await supabase.from('shopping_checked').delete().neq('item_id', '');
  if (error) throw error;
}

// ─── Staples ────────────────────────────────────────────────────────────────

export async function fetchStaples() {
  const { data, error } = await supabase.from('staples').select('*').order('sort_order');
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    category: row.category || 'produce',
    isCustom: row.is_custom || false,
  }));
}

export async function upsertStaple(staple, sortOrder = 0) {
  const { error } = await supabase.from('staples').upsert({
    id: staple.id,
    name: staple.name,
    category: staple.category || 'produce',
    is_custom: staple.isCustom || false,
    sort_order: sortOrder,
  });
  if (error) throw error;
}

export async function deleteStaple(id) {
  const { error } = await supabase.from('staples').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchStaplesChecked(weekKey) {
  const { data, error } = await supabase
    .from('staples_checked')
    .select('item_id')
    .eq('week_key', weekKey);
  if (error) throw error;
  const checked = {};
  for (const row of (data || [])) checked[row.item_id] = true;
  return checked;
}

export async function setStapleChecked(itemId, weekKey, checked) {
  if (checked) {
    const { error } = await supabase.from('staples_checked').upsert({ item_id: itemId, week_key: weekKey });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('staples_checked').delete()
      .eq('item_id', itemId).eq('week_key', weekKey);
    if (error) throw error;
  }
}

export async function clearStaplesChecked(weekKey) {
  const { error } = await supabase.from('staples_checked').delete().eq('week_key', weekKey);
  if (error) throw error;
}
