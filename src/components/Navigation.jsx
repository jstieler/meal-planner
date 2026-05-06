import { CalendarDays, BookOpen, ShoppingCart, Sparkles } from 'lucide-react';

const tabs = [
  { id: 'plan', label: 'This Week', icon: CalendarDays },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { id: 'discover', label: 'Discover', icon: Sparkles },
];

export default function Navigation({ page, setPage }) {
  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-amber-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍽️</span>
          <div>
            <h1 className="text-xl font-bold text-stone-800 leading-none">Family Dinner Planner</h1>
            <p className="text-xs text-stone-400 mt-0.5">Delicious dinners, simplified</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = page === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPage(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-stone-500 hover:bg-amber-50 hover:text-stone-700'
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Mobile header */}
      <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-amber-100 shadow-sm sticky top-0 z-40">
        <span className="text-2xl">🍽️</span>
        <h1 className="text-lg font-bold text-stone-800">Family Dinner Planner</h1>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-100 flex safe-area-pb">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = page === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setPage(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? 'text-orange-500' : 'text-stone-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
