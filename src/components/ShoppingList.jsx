import { useMemo, useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, ChevronDown, ChevronRight, Plus, Trash2, ListChecks, MoreHorizontal, Printer } from 'lucide-react';
import { generateShoppingList } from '../utils/shoppingList';
import { CATEGORIES } from '../data/ingredientData';
import { getWeekDays, toDateKey, formatWeekRange } from '../utils/dateUtils';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { printShoppingList } from '../utils/printShoppingList';
import { DEFAULT_STAPLES } from '../data/defaultStaples';

// ─── Recipe List ────────────────────────────────────────────────────────────

function CategorySection({ catKey, catData, items, checkedItems, onToggle }) {
  const [collapsed, setCollapsed] = useState(false);
  const checkedCount = items.filter(i => checkedItems[i.id]).length;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden shadow-warm ${catData.color}`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors"
      >
        <span className="text-lg">{catData.icon}</span>
        <span className={`flex-1 text-left text-sm font-bold ${catData.headerColor.split(' ')[1]}`}>
          {catData.label}
        </span>
        <span className="text-xs text-stone-400 font-medium">{checkedCount}/{items.length}</span>
        {collapsed ? <ChevronRight size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
      </button>
      {!collapsed && (
        <div className="border-t border-black/[0.04]">
          {items.map((item, idx) => {
            const checked = !!checkedItems[item.id];
            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  checked ? 'bg-stone-50' : 'hover:bg-black/[0.02]'
                } ${idx < items.length - 1 ? 'border-b border-black/[0.04]' : ''}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  checked ? 'border-green-400 bg-green-400' : 'border-stone-300'
                }`}>
                  {checked && <Check size={11} strokeWidth={3} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-colors ${checked ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                    {item.displayName || item.name}
                  </p>
                  {item.recipes?.length > 0 && (
                    <p className="text-xs text-stone-400 truncate mt-0.5">{item.recipes.join(', ')}</p>
                  )}
                </div>
                {item.displayAmount && (
                  <span className={`text-sm font-semibold flex-shrink-0 transition-colors ${checked ? 'text-stone-300' : 'text-stone-600'}`}>
                    {item.displayAmount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecipeListTab({ mealPlan, recipes, weekStart, checkedItems, onToggleItem, onClearChecked }) {
  const weekDays = getWeekDays(weekStart);
  const uniqueRecipes = useMemo(() => {
    const weekRecipes = weekDays
      .map(date => {
        const plan = mealPlan[toDateKey(date)];
        return plan?.recipeId ? recipes.find(r => r.id === plan.recipeId) : null;
      })
      .filter(Boolean);
    return [...new Map(weekRecipes.map(r => [r.id, r])).values()];
  }, [weekDays.map(d => toDateKey(d)).join(','), mealPlan, recipes]);

  const shoppingItems = useMemo(() => generateShoppingList(uniqueRecipes), [uniqueRecipes.map(r => r.id).join(',')]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const item of shoppingItems) {
      const cat = item.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [shoppingItems]);

  const checkedCount = shoppingItems.filter(i => checkedItems[i.id]).length;
  const totalCount = shoppingItems.length;

  if (uniqueRecipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-stone-100 shadow-warm">
        <ShoppingCart size={48} className="text-stone-200 mb-4" />
        <p className="text-stone-500 font-medium">No meals planned this week</p>
        <p className="text-stone-400 text-sm mt-1">Add dinners to your weekly plan to generate a shopping list</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      {totalCount > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-warm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-stone-700">
              {checkedCount === totalCount ? '🎉 All done!' : `${checkedCount} of ${totalCount} items`}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-stone-400">{Math.round((checkedCount / totalCount) * 100)}%</p>
              {checkedCount > 0 && (
                <button onClick={onClearChecked} className="text-xs text-orange-500 font-medium hover:text-orange-600">
                  Uncheck all
                </button>
              )}
            </div>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-2">{uniqueRecipes.map(r => r.name).join(', ')}</p>
        </div>
      )}

      {Object.entries(CATEGORIES).map(([catKey, catData]) => {
        const items = grouped[catKey];
        if (!items?.length) return null;
        return (
          <CategorySection
            key={catKey}
            catKey={catKey}
            catData={catData}
            items={items}
            checkedItems={checkedItems}
            onToggle={onToggleItem}
          />
        );
      })}
    </div>
  );
}

// ─── Staples List ────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = Object.entries(CATEGORIES)
  .filter(([k]) => k !== 'other')
  .map(([k, v]) => ({ value: k, label: v.label }));

function ItemMenu({ onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 text-stone-300 hover:text-stone-500 transition-colors rounded-lg hover:bg-stone-100"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-warm-lg border border-stone-100 overflow-hidden min-w-[130px]">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Remove item
          </button>
        </div>
      )}
    </div>
  );
}

function StaplesTab({ weekStart, staples, setStaples, weekState, setWeekState }) {
  const [collapsed, setCollapsed] = useState({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('produce');

  const currentWeekKey = toDateKey(weekStart);

  // Reset checked state at the start of each new week
  useEffect(() => {
    if (weekState.weekKey !== currentWeekKey) {
      setWeekState({ weekKey: currentWeekKey, checked: {} });
    }
  }, [currentWeekKey]);

  const checked = weekState.checked || {};

  const toggleChecked = (id) => {
    setWeekState(prev => ({
      ...prev,
      checked: { ...prev.checked, [id]: !prev.checked[id] },
    }));
  };

  const clearChecked = () => {
    setWeekState(prev => ({ ...prev, checked: {} }));
  };

  const addItem = () => {
    if (!newName.trim()) return;
    const item = {
      id: `st_custom_${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      isCustom: true,
    };
    setStaples(prev => [...prev, item]);
    setNewName('');
    setAdding(false);
  };

  const removeItem = (id) => {
    setStaples(prev => prev.filter(s => s.id !== id));
    setWeekState(prev => {
      const next = { ...prev.checked };
      delete next[id];
      return { ...prev, checked: next };
    });
  };

  const grouped = useMemo(() => {
    const groups = {};
    for (const item of staples) {
      const cat = item.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [staples]);

  const checkedCount = staples.filter(s => checked[s.id]).length;
  const totalCount = staples.length;

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-warm p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-stone-700">
            {checkedCount === totalCount && totalCount > 0 ? '🎉 All picked up!' : `${checkedCount} of ${totalCount} items`}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-stone-400">{Math.round(totalCount > 0 ? (checkedCount / totalCount) * 100 : 0)}%</p>
            {checkedCount > 0 && (
              <button onClick={clearChecked} className="text-xs text-orange-500 font-medium hover:text-orange-600">
                Uncheck all
              </button>
            )}
          </div>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-2">Resets automatically each week</p>
      </div>

      {/* Category sections */}
      {Object.entries(CATEGORIES).map(([catKey, catData]) => {
        const items = grouped[catKey];
        if (!items?.length) return null;
        const isCollapsed = collapsed[catKey];
        const checkedInCat = items.filter(i => checked[i.id]).length;

        return (
          <div key={catKey} className={`bg-white rounded-2xl border overflow-hidden shadow-warm ${catData.color}`}>
            <button
              onClick={() => setCollapsed(p => ({ ...p, [catKey]: !p[catKey] }))}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors"
            >
              <span className="text-lg">{catData.icon}</span>
              <span className={`flex-1 text-left text-sm font-bold ${catData.headerColor.split(' ')[1]}`}>
                {catData.label}
              </span>
              <span className="text-xs text-stone-400 font-medium">{checkedInCat}/{items.length}</span>
              {isCollapsed ? <ChevronRight size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
            </button>

            {!isCollapsed && (
              <div className="border-t border-black/[0.04]">
                {items.map((item, idx) => {
                  const isChecked = !!checked[item.id];
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isChecked ? 'bg-stone-50' : 'hover:bg-black/[0.02]'
                      } ${idx < items.length - 1 ? 'border-b border-black/[0.04]' : ''}`}
                    >
                      <button onClick={() => toggleChecked(item.id)} className="flex items-center gap-3 flex-1 text-left">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isChecked ? 'border-green-400 bg-green-400' : 'border-stone-300'
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} className="text-white" />}
                        </div>
                        <p className={`text-sm font-medium transition-colors ${isChecked ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                          {item.name}
                        </p>
                      </button>
                      <ItemMenu onRemove={() => removeItem(item.id)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Add item */}
      {adding ? (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-warm p-4 space-y-3">
          <p className="text-sm font-semibold text-stone-700">Add a staple item</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Item name..."
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:border-orange-400 outline-none text-sm bg-white"
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setNewName(''); }}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm hover:bg-stone-50 transition-colors">
              Cancel
            </button>
            <button onClick={addItem} disabled={!newName.trim()}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 transition-colors">
              Add Item
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-orange-300 hover:text-orange-500 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Add item
        </button>
      )}

      <div className="h-24 md:h-8" />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ShoppingList({ mealPlan, recipes, weekStart, checkedItems, onToggleItem, onClearChecked }) {
  const [tab, setTab] = useState('meals');
  const [staples, setStaples] = useLocalStorage('stapleItems', DEFAULT_STAPLES);
  const [weekState, setWeekState] = useLocalStorage('staplesWeekState', { weekKey: '', checked: {} });

  const weekDays = getWeekDays(weekStart);
  const uniqueRecipes = useMemo(() => {
    const weekRecipes = weekDays
      .map(date => {
        const plan = mealPlan[toDateKey(date)];
        return plan?.recipeId ? recipes.find(r => r.id === plan.recipeId) : null;
      })
      .filter(Boolean);
    return [...new Map(weekRecipes.map(r => [r.id, r])).values()];
  }, [weekDays.map(d => toDateKey(d)).join(','), mealPlan, recipes]);

  const recipeItems = useMemo(() => generateShoppingList(uniqueRecipes), [uniqueRecipes.map(r => r.id).join(',')]);

  const handlePrint = () => {
    const staplesChecked = weekState.checked || {};
    printShoppingList({
      recipeItems: recipeItems.filter(i => !checkedItems[i.id]),
      staples: staples.filter(s => !staplesChecked[s.id]),
      weekStart,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Shopping List</h2>
          <p className="text-sm text-stone-400 mt-0.5">{formatWeekRange(weekStart)}</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm"
        >
          <Printer size={15} />
          <span className="hidden sm:inline">Print / PDF</span>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5 bg-white rounded-2xl p-1.5 border border-stone-100 shadow-warm">
        <button
          onClick={() => setTab('meals')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'meals' ? 'bg-orange-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <ShoppingCart size={16} />
          This Week's Meals
        </button>
        <button
          onClick={() => setTab('staples')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'staples' ? 'bg-orange-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <ListChecks size={16} />
          Staples
        </button>
      </div>

      {tab === 'meals' ? (
        <RecipeListTab
          mealPlan={mealPlan}
          recipes={recipes}
          weekStart={weekStart}
          checkedItems={checkedItems}
          onToggleItem={onToggleItem}
          onClearChecked={onClearChecked}
        />
      ) : (
        <StaplesTab
          weekStart={weekStart}
          staples={staples}
          setStaples={setStaples}
          weekState={weekState}
          setWeekState={setWeekState}
        />
      )}
    </div>
  );
}
