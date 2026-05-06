import { Clock, Users, ChevronRight } from 'lucide-react';

const TAG_COLORS = {
  italian: 'bg-red-100 text-red-700',
  mexican: 'bg-green-100 text-green-700',
  asian: 'bg-orange-100 text-orange-700',
  american: 'bg-blue-100 text-blue-700',
  'slow-cooker': 'bg-purple-100 text-purple-700',
  quick: 'bg-emerald-100 text-emerald-700',
  healthy: 'bg-teal-100 text-teal-700',
  'comfort-food': 'bg-amber-100 text-amber-700',
  vegetarian: 'bg-lime-100 text-lime-700',
  seafood: 'bg-cyan-100 text-cyan-700',
  chicken: 'bg-yellow-100 text-yellow-700',
  beef: 'bg-rose-100 text-rose-700',
  pork: 'bg-pink-100 text-pink-700',
  pasta: 'bg-orange-100 text-orange-700',
  'one-pan': 'bg-violet-100 text-violet-700',
  'gluten-free': 'bg-stone-100 text-stone-600',
  grill: 'bg-red-100 text-red-700',
  soup: 'bg-blue-100 text-blue-700',
  side: 'bg-green-100 text-green-700',
};

function getTagColor(tag) {
  return TAG_COLORS[tag] || 'bg-stone-100 text-stone-600';
}

function formatTime(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const EMOJI_BG_COLORS = [
  'from-orange-100 to-amber-50',
  'from-rose-100 to-orange-50',
  'from-amber-100 to-yellow-50',
  'from-teal-100 to-emerald-50',
  'from-blue-100 to-cyan-50',
  'from-purple-100 to-pink-50',
];

function getEmojiBackground(id) {
  const idx = id ? id.charCodeAt(id.length - 1) % EMOJI_BG_COLORS.length : 0;
  return EMOJI_BG_COLORS[idx];
}

export default function RecipeCard({ recipe, onClick, compact = false, action }) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <button
      onClick={() => onClick?.(recipe)}
      className={`group bg-white rounded-2xl shadow-warm border border-amber-100/60 overflow-hidden text-left transition-all duration-200 hover:shadow-warm-lg hover:-translate-y-0.5 w-full ${compact ? '' : ''}`}
    >
      <div className={`bg-gradient-to-br ${getEmojiBackground(recipe.id)} flex items-center justify-center ${compact ? 'h-24' : 'h-36'}`}>
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.emoji-fallback')?.style.setProperty('display', 'block'); }}
          />
        ) : null}
        <span className={`emoji-fallback text-5xl ${recipe.imageUrl ? 'hidden' : 'block'} ${compact ? 'text-4xl' : 'text-5xl'}`}>
          {recipe.emoji || '🍽️'}
        </span>
      </div>

      <div className={`p-4 ${compact ? 'p-3' : ''}`}>
        <h3 className={`font-semibold text-stone-800 leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors ${compact ? 'text-sm' : 'text-base'}`}>
          {recipe.name}
        </h3>

        {!compact && recipe.description && (
          <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">{recipe.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2.5 text-stone-400">
          {totalTime > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Clock size={11} />
              {formatTime(totalTime)}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1 text-xs">
              <Users size={11} />
              {recipe.servings}
            </span>
          )}
          {recipe.nutrition?.calories > 0 && (
            <span className="text-xs text-orange-400 font-medium ml-auto">{recipe.nutrition.calories} cal</span>
          )}
        </div>

        {!compact && recipe.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTagColor(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {action && (
          <div className="mt-3 flex items-center gap-1 text-orange-500 text-xs font-semibold">
            {action}
            <ChevronRight size={12} />
          </div>
        )}
      </div>
    </button>
  );
}
