import { X, Clock, Users, Flame, Dumbbell, Wheat, Droplets, ExternalLink, Edit2, Trash2 } from 'lucide-react';

function MacroPill({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl ${color}`}>
      <Icon size={16} className="opacity-70" />
      <span className="text-lg font-bold leading-none">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}

function formatTime(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hr`;
}

export default function RecipeDetail({ recipe, onClose, onEdit, onDelete }) {
  if (!recipe) return null;

  const hasNutrition = recipe.nutrition && recipe.nutrition.calories > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl overflow-y-auto max-h-[94dvh] md:max-h-[90vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header image/emoji */}
        <div className="relative bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center h-48 md:h-56 flex-shrink-0">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-7xl">{recipe.emoji || '🍽️'}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
          >
            <X size={18} className="text-stone-600" />
          </button>

          <div className="absolute bottom-4 right-4 flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(recipe)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors text-sm font-medium text-stone-700"
              >
                <Edit2 size={14} /> Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => { if (confirm(`Delete "${recipe.name}"?`)) { onDelete(recipe.id); onClose(); }}}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium text-stone-700"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Title & meta */}
          <h2 className="text-2xl font-bold text-stone-800">{recipe.name}</h2>
          {recipe.description && (
            <p className="text-stone-500 mt-2 text-sm leading-relaxed">{recipe.description}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-4 text-sm text-stone-600">
            {recipe.prepTime > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock size={15} className="text-stone-400" />
                <span>Prep: <strong>{formatTime(recipe.prepTime)}</strong></span>
              </div>
            )}
            {recipe.cookTime > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock size={15} className="text-orange-400" />
                <span>Cook: <strong>{formatTime(recipe.cookTime)}</strong></span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1.5">
                <Users size={15} className="text-stone-400" />
                <span>Serves <strong>{recipe.servings}</strong></span>
              </div>
            )}
          </div>

          {/* Tags */}
          {recipe.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Nutrition */}
          {hasNutrition && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Nutrition per serving</h3>
              <div className="grid grid-cols-4 gap-2">
                <MacroPill icon={Flame} label="Calories" value={recipe.nutrition.calories} color="bg-orange-50 text-orange-700" />
                <MacroPill icon={Dumbbell} label="Protein" value={`${recipe.nutrition.protein}g`} color="bg-blue-50 text-blue-700" />
                <MacroPill icon={Wheat} label="Carbs" value={`${recipe.nutrition.carbs}g`} color="bg-amber-50 text-amber-700" />
                <MacroPill icon={Droplets} label="Fat" value={`${recipe.nutrition.fat}g`} color="bg-red-50 text-red-700" />
              </div>
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-stone-700 mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-300 mt-1.5 flex-shrink-0" />
                    <span className="text-stone-500 font-medium min-w-[80px]">
                      {ing.amount > 0 ? `${ing.amount} ${ing.unit}`.trim() : ''}
                    </span>
                    <span className="text-stone-700">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-stone-700 mb-3">Instructions</h3>
              <ol className="space-y-4">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-stone-600 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {recipe.source && (
            <a
              href={recipe.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-sm text-orange-500 hover:text-orange-600"
            >
              <ExternalLink size={14} />
              View original recipe
            </a>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
