import { useState } from 'react';
import { Search, Plus, Link, Camera, SlidersHorizontal, X } from 'lucide-react';
import RecipeCard from './RecipeCard';

const FILTER_TAGS = [
  { key: 'slow-cooker', label: '🥘 Slow Cooker' },
  { key: 'quick', label: '⚡ Quick' },
  { key: 'healthy', label: '🥗 Healthy' },
  { key: 'italian', label: '🍝 Italian' },
  { key: 'mexican', label: '🌮 Mexican' },
  { key: 'asian', label: '🥢 Asian' },
  { key: 'chicken', label: '🍗 Chicken' },
  { key: 'beef', label: '🥩 Beef' },
  { key: 'vegetarian', label: '🌱 Vegetarian' },
  { key: 'comfort-food', label: '🫕 Comfort Food' },
  { key: 'grill', label: '🔥 Grill' },
  { key: 'soup', label: '🍜 Soup' },
  { key: 'side', label: '🥦 Side' },
];

export default function RecipeLibrary({ recipes, onAddRecipe, onImportRecipe, onViewRecipe, onEditRecipe }) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = recipes.filter(r => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some(t => t.includes(search.toLowerCase()));
    const matchesFilters = activeFilters.length === 0 || activeFilters.every(f => r.tags?.includes(f));
    return matchesSearch && matchesFilters;
  });

  const toggleFilter = (tag) => {
    setActiveFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Recipe Library</h2>
          <p className="text-sm text-stone-400 mt-0.5">{recipes.length} recipes saved</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onImportRecipe}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:border-amber-300 hover:bg-amber-50 transition-colors shadow-sm"
          >
            <Link size={15} className="text-orange-400" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={onAddRecipe}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Recipe</span>
          </button>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes, ingredients, tags..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
              <X size={13} className="text-stone-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            activeFilters.length > 0 || showFilters
              ? 'border-orange-400 bg-orange-50 text-orange-600'
              : 'border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:bg-amber-50'
          }`}
        >
          <SlidersHorizontal size={15} />
          {activeFilters.length > 0 && <span className="bg-orange-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">{activeFilters.length}</span>}
        </button>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white rounded-2xl border border-stone-100 shadow-warm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Filter by tag</p>
            {activeFilters.length > 0 && (
              <button onClick={() => setActiveFilters([])} className="text-xs text-orange-500 font-medium hover:text-orange-600">
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_TAGS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  activeFilters.includes(key) ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-amber-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🔍</span>
          <p className="text-stone-500 font-medium">{search || activeFilters.length ? 'No recipes match your search' : 'No recipes yet!'}</p>
          <p className="text-stone-400 text-sm mt-1">
            {search || activeFilters.length
              ? 'Try a different search or filter'
              : 'Add your first recipe or import one from a URL'}
          </p>
          {!search && !activeFilters.length && (
            <div className="flex gap-3 mt-5">
              <button onClick={onImportRecipe} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-amber-50 transition-colors">
                <Link size={14} /> Import from URL
              </button>
              <button onClick={onAddRecipe} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
                <Plus size={14} /> Add Recipe
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={onViewRecipe}
            />
          ))}
        </div>
      )}
    </div>
  );
}
