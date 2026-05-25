import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Moon, Search, Clock, CookingPot, SlidersHorizontal, UtensilsCrossed, Shuffle, Flame, BookOpen } from 'lucide-react';
import RecipeDetail from './RecipeDetail';
import { getWeekDays, toDateKey, formatMonthDay, formatWeekRange, isToday, DAY_SHORT, DAYS } from '../utils/dateUtils';

function formatTime(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function RecipePickerModal({ recipes, onSelect, onToggleSide, onBusy, onGrill, onDineOut, onClose, currentRecipeId, currentSideIds = [] }) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const sideRecipes = recipes.filter(r => r.tags?.includes('side'));
  const allTags = [...new Set(recipes.flatMap(r => r.tags || []))].sort();

  const filtered = recipes.filter(r => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some(t => t.includes(search.toLowerCase()));
    const matchesTag = !activeTag || r.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] md:max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-800 text-lg">Choose a Recipe</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
              <X size={18} className="text-stone-500" />
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search recipes..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilter(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                activeTag
                  ? 'border-orange-400 bg-orange-50 text-orange-600'
                  : showFilter
                  ? 'border-stone-300 bg-stone-100 text-stone-700'
                  : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <SlidersHorizontal size={15} />
              {activeTag && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
            </button>
          </div>

          {showFilter && (
            <div className="mt-3 p-3 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Filter by tag</p>
                {activeTag && (
                  <button onClick={() => setActiveTag(null)} className="text-xs text-orange-500 font-medium">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setActiveTag(activeTag === tag ? null : tag); setShowFilter(false); }}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      activeTag === tag
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-orange-300 hover:bg-amber-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTag && !showFilter && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-stone-500">Filtered by:</span>
              <button
                onClick={() => setActiveTag(null)}
                className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium"
              >
                {activeTag} <X size={11} />
              </button>
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={onBusy}
              className="flex items-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-colors"
            >
              <Moon size={16} className="flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold">Busy Night</p>
                <p className="text-xs text-purple-400">Slow cooker friendly</p>
              </div>
            </button>
            <button
              onClick={onGrill}
              className="flex items-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <Flame size={16} className="flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold">Grill Night</p>
                <p className="text-xs text-red-400">Suggest grill recipes</p>
              </div>
            </button>
            <button
              onClick={onDineOut}
              className="flex items-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-colors"
            >
              <UtensilsCrossed size={16} className="flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold">Dine Out</p>
                <p className="text-xs text-teal-400">No meal needed</p>
              </div>
            </button>
          </div>

          {sideRecipes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Side Dishes</p>
              <div className="flex flex-wrap gap-1.5">
                {sideRecipes.map(side => {
                  const selected = currentSideIds.includes(side.id);
                  return (
                    <button
                      key={side.id}
                      onClick={() => onToggleSide(side.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-green-100 border-green-400 text-green-700'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <span>{side.emoji || '🥦'}</span>
                      {side.name}
                      {selected && <X size={11} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <p className="text-sm">No recipes found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => onSelect(recipe.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    currentRecipeId === recipe.id
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-stone-100 hover:border-orange-200 hover:bg-amber-50'
                  }`}
                >
                  <span className="text-2xl w-9 h-9 flex items-center justify-center bg-amber-50 rounded-lg flex-shrink-0">
                    {recipe.emoji || '🍽️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{recipe.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {(recipe.prepTime + recipe.cookTime) > 0 && (
                        <span className="text-xs text-stone-400 flex items-center gap-0.5">
                          <Clock size={10} />
                          {formatTime(recipe.prepTime + recipe.cookTime)}
                        </span>
                      )}
                      {recipe.tags?.slice(0, 2).map(t => (
                        <span key={t} className="text-xs text-stone-400">{t}</span>
                      ))}
                    </div>
                  </div>
                  {recipe.tags?.includes('slow-cooker') && (
                    <CookingPot size={16} className="text-purple-400 flex-shrink-0" />
                  )}
                  {recipe.nutrition?.calories > 0 && (
                    <span className="text-xs text-orange-400 font-medium flex-shrink-0">{recipe.nutrition.calories} cal</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DayCard({ date, dayIndex, plan, recipe, sideRecipes, onClickDay, onViewRecipe }) {
  const dateKey = toDateKey(date);
  const today = isToday(date);
  const isBusy = plan?.isBusy;
  const isDiningOut = plan?.isDiningOut;
  const isGrill = plan?.isGrill;
  const hasRecipe = recipe != null;
  const isWeekend = dayIndex >= 5;

  return (
    <button
      onClick={() => onClickDay(dateKey)}
      className={`group flex flex-col rounded-2xl border-2 transition-all duration-200 text-left min-h-[120px] ${
        today
          ? 'border-orange-400 bg-white shadow-warm-lg'
          : isDiningOut
          ? 'border-teal-200 bg-teal-50 hover:border-teal-300'
          : isBusy
          ? 'border-purple-200 bg-purple-50 hover:border-purple-300'
          : isGrill
          ? 'border-red-200 bg-red-50 hover:border-red-300'
          : hasRecipe
          ? 'border-amber-200 bg-white hover:border-amber-300 hover:shadow-warm'
          : 'border-stone-100 bg-white/60 hover:border-amber-200 hover:bg-white hover:shadow-warm'
      }`}
    >
      {/* Day header */}
      <div className={`flex items-center justify-between px-3 py-2.5 ${
        today ? 'bg-orange-500' : isDiningOut ? 'bg-teal-100' : isBusy ? 'bg-purple-100' : isGrill ? 'bg-red-100' : isWeekend ? 'bg-amber-50' : 'bg-stone-50'
      }`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${today ? 'text-orange-100' : 'text-stone-400'}`}>
            {DAY_SHORT[dayIndex]}
          </p>
          <p className={`text-lg font-bold leading-none ${today ? 'text-white' : 'text-stone-700'}`}>
            {date.getDate()}
          </p>
        </div>
        {today && (
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Today</span>
        )}
        {isDiningOut && !today && <UtensilsCrossed size={14} className="text-teal-400" />}
        {isBusy && !today && !isDiningOut && (
          <Moon size={14} className="text-purple-400" />
        )}
        {isGrill && !today && !isDiningOut && !isBusy && (
          <Flame size={14} className="text-red-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-2.5">
        {isDiningOut ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-teal-600">Dine Out</p>
            <p className="text-xs text-teal-400">No meal needed</p>
          </div>
        ) : isBusy ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-purple-600">Busy Night</p>
            {recipe ? (
              <div className="flex items-start gap-1.5">
                <span className="text-base leading-none">{recipe.emoji || '🍽️'}</span>
                <p className="text-xs text-purple-700 leading-tight">{recipe.name}</p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <CookingPot size={12} className="text-purple-400" />
                <p className="text-xs text-purple-400">Slow cooker suggested</p>
              </div>
            )}
            {sideRecipes?.length > 0 && sideRecipes.map(side => (
              <div key={side.id} className="flex flex-col gap-0.5 pl-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{side.emoji || '🥦'}</span>
                  <p className="text-xs text-stone-500 leading-tight">{side.name}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onViewRecipe(side); }}
                  className="self-start flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium pl-5"
                >
                  <BookOpen size={11} /> View recipe
                </button>
              </div>
            ))}
          </div>
        ) : isGrill ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-red-600">Grill Night</p>
            {recipe ? (
              <div className="flex items-start gap-1.5">
                <span className="text-base leading-none">{recipe.emoji || '🍽️'}</span>
                <p className="text-xs text-red-700 leading-tight">{recipe.name}</p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Flame size={12} className="text-red-400" />
                <p className="text-xs text-red-400">Grill recipe suggested</p>
              </div>
            )}
            {sideRecipes?.length > 0 && sideRecipes.map(side => (
              <div key={side.id} className="flex flex-col gap-0.5 pl-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{side.emoji || '🥦'}</span>
                  <p className="text-xs text-stone-500 leading-tight">{side.name}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onViewRecipe(side); }}
                  className="self-start flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium pl-5"
                >
                  <BookOpen size={11} /> View recipe
                </button>
              </div>
            ))}
          </div>
        ) : hasRecipe ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <span className="text-xl leading-none">{recipe.emoji || '🍽️'}</span>
              <div>
                <p className="text-xs font-semibold text-stone-700 leading-tight">{recipe.name}</p>
                {recipe.nutrition?.calories > 0 && (
                  <p className="text-xs text-orange-400 font-medium">{recipe.nutrition.calories} cal/serving</p>
                )}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onViewRecipe(recipe); }}
              className="self-start flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium"
            >
              <BookOpen size={11} /> View recipe
            </button>
            {sideRecipes?.length > 0 && (
              <div className="flex flex-col gap-1 pl-0.5">
                {sideRecipes.map(side => (
                  <div key={side.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm leading-none">{side.emoji || '🥦'}</span>
                      <p className="text-xs text-stone-500 leading-tight">{side.name}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onViewRecipe(side); }}
                      className="self-start flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 font-medium pl-5"
                    >
                      <BookOpen size={11} /> View recipe
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full py-2">
            <div className="flex flex-col items-center gap-1 text-stone-300 group-hover:text-orange-300 transition-colors">
              <Plus size={18} />
              <p className="text-xs">Add dinner</p>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export default function WeeklyCalendar({ mealPlan, recipes, weekStart, onWeekChange, onDayUpdate }) {
  const [pickerDay, setPickerDay] = useState(null);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const weekDays = getWeekDays(weekStart);

  const totalCalories = weekDays.reduce((sum, date) => {
    const dateKey = toDateKey(date);
    const plan = mealPlan[dateKey];
    if (!plan?.recipeId) return sum;
    const recipe = recipes.find(r => r.id === plan.recipeId);
    return sum + (recipe?.nutrition?.calories || 0);
  }, 0);

  const mealsPlanned = weekDays.filter(date => {
    const plan = mealPlan[toDateKey(date)];
    return plan?.recipeId || plan?.isBusy || plan?.isDiningOut || plan?.isGrill;
  }).length;

  const handleSelectRecipe = (recipeId) => {
    const plan = mealPlan[pickerDay] || {};
    onDayUpdate(pickerDay, { ...plan, recipeId, isBusy: plan.isBusy || false });
    setPickerDay(null);
  };

  const handleMarkBusy = () => {
    const plan = mealPlan[pickerDay] || {};
    onDayUpdate(pickerDay, { ...plan, isBusy: !plan.isBusy, isDiningOut: false });
    setPickerDay(null);
  };

  const handleDineOut = () => {
    onDayUpdate(pickerDay, { recipeId: null, isBusy: false, isDiningOut: true, isGrill: false });
    setPickerDay(null);
  };

  const handleMarkGrill = () => {
    const plan = mealPlan[pickerDay] || {};
    onDayUpdate(pickerDay, { ...plan, isGrill: !plan.isGrill, isDiningOut: false });
    setPickerDay(null);
  };

  const handleToggleSide = (sideId) => {
    const plan = mealPlan[pickerDay] || {};
    const current = plan.sideRecipeIds || [];
    const updated = current.includes(sideId)
      ? current.filter(id => id !== sideId)
      : [...current, sideId];
    onDayUpdate(pickerDay, { ...plan, sideRecipeIds: updated });
  };

  const handleClearDay = (dateKey) => {
    onDayUpdate(dateKey, { recipeId: null, isBusy: false, isDiningOut: false, isGrill: false, sideRecipeIds: [] });
  };

  const handleSuggestAll = () => {
    const usedIds = new Set(
      weekDays.map(d => mealPlan[toDateKey(d)]?.recipeId).filter(Boolean)
    );
    const isBusyCompatible = r =>
      r.tags?.some(t => ['quick', 'easy', 'quick & easy', 'slow-cooker'].includes(t));

    const pick = (pool) => {
      const available = pool.filter(r => !usedIds.has(r.id));
      const source = available.length > 0 ? available : pool;
      const picked = source[Math.floor(Math.random() * source.length)];
      if (picked) usedIds.add(picked.id);
      return picked;
    };

    const sides = recipes.filter(r => r.tags?.includes('side'));
    const grillRecipes = recipes.filter(r => r.tags?.includes('grill'));

    for (const date of weekDays) {
      const dateKey = toDateKey(date);
      const plan = mealPlan[dateKey] || {};
      if (plan.recipeId || plan.isDiningOut) continue;

      const pool = plan.isBusy
        ? recipes.filter(isBusyCompatible)
        : plan.isGrill
        ? (grillRecipes.length > 0 ? grillRecipes : recipes)
        : recipes;

      if (pool.length === 0) continue;
      const chosen = pick(pool);
      if (!chosen) continue;

      let sideRecipeIds = plan.sideRecipeIds || [];
      if (chosen.sideRequired && sides.length > 0 && sideRecipeIds.length === 0) {
        const available = sides.filter(r => r.id !== chosen.id);
        const sidePick = (available.length > 0 ? available : sides)[Math.floor(Math.random() * (available.length > 0 ? available : sides).length)];
        if (sidePick) sideRecipeIds = [sidePick.id];
      }

      onDayUpdate(dateKey, { ...plan, recipeId: chosen.id, sideRecipeIds });
    }
  };

  const pickerPlan = pickerDay ? mealPlan[pickerDay] : null;
  const busySlowCookerRecipes = recipes.filter(r => r.tags?.includes('slow-cooker'));
  const grillRecipesList = recipes.filter(r => r.tags?.includes('grill'));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Dinner Plan</h2>
          <p className="text-sm text-stone-400 mt-0.5">{formatWeekRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 mr-4 text-sm text-stone-500">
            {mealsPlanned > 0 && (
              <>
                <span className="font-medium text-stone-700">{mealsPlanned}/7 planned</span>
                {totalCalories > 0 && <span className="text-orange-400">~{Math.round(totalCalories / mealsPlanned)} cal avg</span>}
              </>
            )}
          </div>
          <button
            onClick={handleSuggestAll}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm"
            title="Randomly fill open days"
          >
            <Shuffle size={15} />
            <span className="hidden sm:inline">Suggest</span>
          </button>
          <button
            onClick={() => { const prev = new Date(weekStart); prev.setDate(prev.getDate() - 7); onWeekChange(prev); }}
            className="p-2.5 bg-white rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={18} className="text-stone-600" />
          </button>
          <button
            onClick={() => { const next = new Date(weekStart); next.setDate(next.getDate() + 7); onWeekChange(next); }}
            className="p-2.5 bg-white rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50 transition-colors shadow-sm"
          >
            <ChevronRight size={18} className="text-stone-600" />
          </button>
        </div>
      </div>

      {/* Week summary for mobile */}
      <div className="flex items-center gap-4 mb-4 sm:hidden text-sm text-stone-500">
        {mealsPlanned > 0 && (
          <>
            <span className="font-medium text-stone-700">{mealsPlanned}/7 nights planned</span>
            {totalCalories > 0 && <span className="text-orange-400">~{Math.round(totalCalories / mealsPlanned)} cal avg</span>}
          </>
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekDays.map((date, i) => {
          const dateKey = toDateKey(date);
          const plan = mealPlan[dateKey];
          const recipe = plan?.recipeId ? recipes.find(r => r.id === plan.recipeId) : null;
          const sideRecipes = (plan?.sideRecipeIds || []).map(id => recipes.find(r => r.id === id)).filter(Boolean);
          return (
            <div key={dateKey} className="relative group">
              <DayCard
                date={date}
                dayIndex={i}
                plan={plan}
                recipe={recipe}
                sideRecipes={sideRecipes}
                onClickDay={setPickerDay}
                onViewRecipe={setViewingRecipe}
              />
              {(plan?.recipeId || plan?.isBusy || plan?.isDiningOut || plan?.isGrill) && (
                <button
                  onClick={() => handleClearDay(dateKey)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-400 hover:bg-red-400 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                  title="Clear day"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Busy nights tip */}
      {weekDays.some(d => mealPlan[toDateKey(d)]?.isBusy) && busySlowCookerRecipes.length > 0 && (
        <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <CookingPot size={16} className="text-purple-500" />
            <p className="text-sm font-semibold text-purple-700">Slow Cooker Suggestions for Busy Nights</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {busySlowCookerRecipes.slice(0, 4).map(r => (
              <span key={r.id} className="text-xs bg-white text-purple-600 px-3 py-1 rounded-full border border-purple-200">
                {r.emoji} {r.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grill nights tip */}
      {weekDays.some(d => mealPlan[toDateKey(d)]?.isGrill) && grillRecipesList.length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-red-500" />
            <p className="text-sm font-semibold text-red-700">Grill Suggestions for Grill Nights</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {grillRecipesList.slice(0, 4).map(r => (
              <span key={r.id} className="text-xs bg-white text-red-600 px-3 py-1 rounded-full border border-red-200">
                {r.emoji} {r.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Read-only recipe detail */}
      {viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
        />
      )}

      {/* Recipe picker modal */}
      {pickerDay && (
        <RecipePickerModal
          recipes={recipes}
          currentRecipeId={mealPlan[pickerDay]?.recipeId}
          currentSideIds={mealPlan[pickerDay]?.sideRecipeIds || []}
          onSelect={handleSelectRecipe}
          onToggleSide={handleToggleSide}
          onBusy={handleMarkBusy}
          onGrill={handleMarkGrill}
          onDineOut={handleDineOut}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  );
}
