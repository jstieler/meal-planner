import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Wand2, AlertCircle } from 'lucide-react';
import { estimateNutrition } from '../utils/nutrition';

const EMOJI_OPTIONS = ['🍝', '🌮', '🐟', '🍗', '🥩', '🍲', '🫕', '🥓', '🍛', '🥘', '🍜', '🥗', '🍕', '🌯', '🥙', '🍱'];

const COMMON_TAGS = ['quick', 'slow-cooker', 'italian', 'mexican', 'asian', 'american', 'healthy',
  'vegetarian', 'vegan', 'gluten-free', 'comfort-food', 'chicken', 'beef', 'pork', 'seafood',
  'pasta', 'one-pan', 'family-favorite', 'weeknight', 'fall', 'summer', 'grill', 'soup', 'side'];

function emptyIngredient() {
  return { amount: '', unit: '', name: '' };
}

export default function AddEditRecipe({ recipe, onSave, onClose }) {
  const isNew = !recipe?.id;

  const [form, setForm] = useState({
    name: '',
    description: '',
    emoji: '🍽️',
    prepTime: '',
    cookTime: '',
    servings: 4,
    tags: [],
    sideRequired: false,
    ingredients: [emptyIngredient()],
    instructions: [''],
    imageUrl: '',
    source: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [estimatingNutrition, setEstimatingNutrition] = useState(false);

  useEffect(() => {
    if (recipe) {
      setForm({
        ...recipe,
        prepTime: recipe.prepTime || '',
        cookTime: recipe.cookTime || '',
        ingredients: recipe.ingredients?.length ? recipe.ingredients.map(i => ({ ...i, amount: i.amount === 0 ? '' : i.amount })) : [emptyIngredient()],
        instructions: recipe.instructions?.length ? recipe.instructions : [''],
      });
    }
  }, [recipe]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Recipe name is required.'); return; }
    const validIngredients = form.ingredients.filter(i => i.name.trim());
    if (validIngredients.length === 0) { setError('Add at least one ingredient.'); return; }

    const nutrition = form.nutrition || estimateNutrition(validIngredients, Number(form.servings) || 4) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    onSave({
      ...form,
      id: recipe?.id || `r${Date.now()}`,
      name: form.name.trim(),
      prepTime: Number(form.prepTime) || 0,
      cookTime: Number(form.cookTime) || 0,
      servings: Number(form.servings) || 4,
      ingredients: validIngredients.map(i => ({ ...i, amount: Number(i.amount) || 0 })),
      instructions: form.instructions.filter(s => s.trim()),
      nutrition,
      createdAt: recipe?.createdAt || Date.now(),
      usageCount: recipe?.usageCount || 0,
    });
  };

  const handleEstimateNutrition = () => {
    const validIngredients = form.ingredients.filter(i => i.name.trim());
    const result = estimateNutrition(validIngredients.map(i => ({ ...i, amount: Number(i.amount) || 0 })), Number(form.servings) || 4);
    if (result) {
      setForm(f => ({ ...f, nutrition: result }));
    }
  };

  const updateIngredient = (i, key, val) => {
    const copy = [...form.ingredients];
    copy[i] = { ...copy[i], [key]: val };
    set('ingredients', copy);
  };
  const addIngredient = () => set('ingredients', [...form.ingredients, emptyIngredient()]);
  const removeIngredient = (i) => set('ingredients', form.ingredients.filter((_, idx) => idx !== i));

  const updateInstruction = (i, val) => {
    const copy = [...form.instructions];
    copy[i] = val;
    set('instructions', copy);
  };
  const addInstruction = () => set('instructions', [...form.instructions, '']);
  const removeInstruction = (i) => set('instructions', form.instructions.filter((_, idx) => idx !== i));

  const toggleTag = (tag) => {
    const tags = form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag];
    set('tags', tags);
  };
  const addCustomTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag]);
    setTagInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[96dvh] md:max-h-[90vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="text-lg font-bold text-stone-800">{isNew ? 'Add New Recipe' : 'Edit Recipe'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
            <X size={18} className="text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Recipe Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => set('emoji', emoji)}
                  className={`w-10 h-10 text-2xl rounded-xl transition-all ${form.emoji === emoji ? 'bg-orange-100 ring-2 ring-orange-400' : 'bg-stone-50 hover:bg-amber-50'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name & description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Recipe Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Mom's Chicken Soup"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="A brief description of this dish..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm transition-all resize-none"
              />
            </div>
          </div>

          {/* Times & servings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Prep (min)</label>
              <input type="number" min="0" value={form.prepTime} onChange={e => set('prepTime', e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Cook (min)</label>
              <input type="number" min="0" value={form.cookTime} onChange={e => set('cookTime', e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Servings</label>
              <input type="number" min="1" value={form.servings} onChange={e => set('servings', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    form.tags.includes(tag) ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-amber-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                placeholder="Add custom tag..."
                className="flex-1 px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-xs"
              />
              <button type="button" onClick={addCustomTag} className="px-3 py-2 bg-stone-100 rounded-xl text-xs font-medium hover:bg-amber-100 transition-colors">Add</button>
            </div>
          </div>

          {/* Side Required */}
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-stone-700">Side Required</p>
              <p className="text-xs text-stone-400 mt-0.5">Suggest will auto-add a side dish for this meal</p>
            </div>
            <button
              type="button"
              onClick={() => set('sideRequired', !form.sideRequired)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.sideRequired ? 'bg-orange-500' : 'bg-stone-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.sideRequired ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Ingredients *</label>
            <div className="space-y-2">
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={ing.amount}
                    onChange={e => updateIngredient(i, 'amount', e.target.value)}
                    placeholder="Qty"
                    step="0.25"
                    className="w-16 px-2 py-2 rounded-lg border border-stone-200 focus:border-orange-400 outline-none text-xs text-center"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={e => updateIngredient(i, 'unit', e.target.value)}
                    placeholder="Unit"
                    className="w-20 px-2 py-2 rounded-lg border border-stone-200 focus:border-orange-400 outline-none text-xs"
                  />
                  <input
                    type="text"
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                    placeholder="Ingredient name"
                    className="flex-1 px-3 py-2 rounded-lg border border-stone-200 focus:border-orange-400 outline-none text-xs"
                  />
                  {form.ingredients.length > 1 && (
                    <button type="button" onClick={() => removeIngredient(i)} className="p-1.5 text-stone-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addIngredient} className="mt-2 flex items-center gap-1.5 text-xs text-orange-500 font-medium hover:text-orange-600">
              <Plus size={14} /> Add ingredient
            </button>
          </div>

          {/* Nutrition estimate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider">Nutrition (per serving)</label>
              <button type="button" onClick={handleEstimateNutrition}
                className="flex items-center gap-1 text-xs text-orange-500 font-medium hover:text-orange-600"
              >
                <Wand2 size={12} /> Auto-estimate
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['calories', 'protein', 'carbs', 'fat'].map(macro => (
                <div key={macro}>
                  <label className="block text-xs text-stone-400 mb-1 capitalize">{macro}</label>
                  <input
                    type="number" min="0"
                    value={form.nutrition?.[macro] || ''}
                    onChange={e => set('nutrition', { ...(form.nutrition || {}), [macro]: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-2 py-2 rounded-lg border border-stone-200 focus:border-orange-400 outline-none text-xs text-center"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-1.5">Protein/Carbs/Fat in grams</p>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Instructions</label>
            <div className="space-y-2">
              {form.instructions.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold mt-2">
                    {i + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={e => updateInstruction(i, e.target.value)}
                    placeholder={`Step ${i + 1}...`}
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm resize-none transition-all"
                  />
                  {form.instructions.length > 1 && (
                    <button type="button" onClick={() => removeInstruction(i)} className="p-1.5 text-stone-300 hover:text-red-400 transition-colors mt-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addInstruction} className="mt-2 flex items-center gap-1.5 text-xs text-orange-500 font-medium hover:text-orange-600">
              <Plus size={14} /> Add step
            </button>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Source URL (optional)</label>
            <input
              type="url"
              value={form.source}
              onChange={e => set('source', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
            />
          </div>

          <div className="h-2" />
        </form>

        <div className="border-t border-stone-100 px-6 py-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            {isNew ? 'Save Recipe' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
