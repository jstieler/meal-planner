import { CATEGORIES } from '../data/ingredientData';

function normalizeName(name) {
  return String(name).toLowerCase()
    .replace(/\b(fresh|dried|chopped|minced|diced|sliced|grated|shredded|cooked|raw|large|medium|small|whole|baby|extra|virgin|boneless|skinless)\b/g, '')
    .replace(/[(),.]/g, '')
    .replace(/s\b/g, '')  // naive singular
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function printShoppingList({ recipeItems, staples, weekStart }) {
  const weekLabel = weekStart
    ? new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  // Detect which staples are already covered by a recipe item
  const suppressedStapleIds = new Set();
  const recipeItemsAnnotated = recipeItems.map(item => ({ ...item, isAlsoStaple: false }));

  for (const staple of staples) {
    for (const item of recipeItemsAnnotated) {
      if (namesMatch(staple.name, item.displayName || item.name)) {
        item.isAlsoStaple = true;
        suppressedStapleIds.add(staple.id);
        break;
      }
    }
  }

  const activeStalpes = staples.filter(s => !suppressedStapleIds.has(s.id));
  const overlapCount = suppressedStapleIds.size;

  // Merge into categories
  const grouped = {};
  const initCat = (key) => { if (!grouped[key]) grouped[key] = { recipe: [], staples: [] }; };

  for (const item of recipeItemsAnnotated) {
    const cat = item.category || 'other';
    initCat(cat);
    grouped[cat].recipe.push(item);
  }
  for (const item of activeStalpes) {
    const cat = item.category || 'other';
    initCat(cat);
    grouped[cat].staples.push(item);
  }

  // Build category HTML blocks in the order defined by CATEGORIES
  const categoryBlocks = Object.entries(CATEGORIES)
    .filter(([key]) => grouped[key])
    .map(([key, cat]) => {
      const { recipe = [], staples: staplesInCat = [] } = grouped[key];
      const allItems = [
        ...recipe.map(i => ({
          label: i.displayName || i.name,
          amount: i.displayAmount || '',
          isStaple: false,
          isAlsoStaple: i.isAlsoStaple,
        })),
        ...staplesInCat.map(i => ({
          label: i.name,
          amount: '',
          isStaple: true,
          isAlsoStaple: false,
        })),
      ].sort((a, b) => a.label.localeCompare(b.label));
      if (!allItems.length) return '';

      const rows = allItems.map(item => `
        <div class="item">
          <span class="box"></span>
          <span class="item-name">${escHtml(item.label)}</span>
          ${item.amount ? `<span class="item-amount">${escHtml(item.amount)}</span>` : ''}
          ${item.isAlsoStaple ? '<span class="staple-tag">★ staple</span>' : ''}
          ${item.isStaple ? '<span class="staple-tag">staple</span>' : ''}
        </div>`).join('');

      return `
        <div class="category">
          <div class="cat-header">
            <span class="cat-icon">${cat.icon}</span>
            <span class="cat-label">${cat.label}</span>
            <span class="cat-count">${allItems.length} item${allItems.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="items">${rows}</div>
        </div>`;
    }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shopping List – Week of ${weekLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', serif;
      font-size: 11pt;
      color: #2c2c2c;
      padding: 24px 32px;
      background: white;
    }

    /* Header */
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #f97316; }
    .header-emoji { font-size: 28px; display: block; margin-bottom: 4px; }
    .header h1 { font-size: 20pt; font-weight: bold; color: #1c1917; }
    .header .week { font-size: 10pt; color: #78716c; margin-top: 3px; }
    .header .summary { font-size: 9pt; color: #a8a29e; margin-top: 4px; }

    /* Two-column layout */
    .columns {
      column-count: 2;
      column-gap: 28px;
      column-rule: 1px solid #e7e5e4;
    }

    /* Category block */
    .category {
      break-inside: avoid;
      margin-bottom: 16px;
    }
    .cat-header {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fef3c7;
      border-radius: 6px;
      padding: 5px 8px;
      margin-bottom: 6px;
    }
    .cat-icon { font-size: 13px; }
    .cat-label { font-size: 10pt; font-weight: bold; color: #92400e; flex: 1; }
    .cat-count { font-size: 8pt; color: #b45309; }

    /* Items */
    .items { padding: 0 4px; }
    .item {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 4px 2px;
      border-bottom: 1px solid #f5f5f4;
      min-height: 22px;
    }
    .item:last-child { border-bottom: none; }
    .box {
      width: 13px;
      height: 13px;
      border: 1.5px solid #aaa;
      border-radius: 3px;
      flex-shrink: 0;
      display: inline-block;
    }
    .item-name { flex: 1; font-size: 10pt; color: #1c1917; }
    .item-amount { font-size: 9pt; color: #57534e; font-style: italic; white-space: nowrap; }
    .staple-tag {
      font-size: 7.5pt;
      color: #0f766e;
      background: #ccfbf1;
      border-radius: 10px;
      padding: 1px 6px;
      white-space: nowrap;
    }

    /* Footer */
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e7e5e4;
      text-align: center;
      font-size: 8pt;
      color: #a8a29e;
    }

    /* Print button — hidden when printing */
    .print-btn {
      display: block;
      margin: 0 auto 20px;
      padding: 10px 28px;
      background: #f97316;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
    }
    .print-btn:hover { background: #ea6c0a; }
    @media print {
      .print-btn { display: none; }
      body { padding: 12px 20px; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="header">
    <span class="header-emoji">🍽️</span>
    <h1>Family Dinner Planner</h1>
    <div class="week">Shopping List — Week of ${weekLabel}</div>
    <div class="summary">${recipeItemsAnnotated.length} recipe ingredient${recipeItemsAnnotated.length !== 1 ? 's' : ''} &nbsp;•&nbsp; ${activeStalpes.length} staple${activeStalpes.length !== 1 ? 's' : ''}${overlapCount > 0 ? ` &nbsp;•&nbsp; ${overlapCount} overlap${overlapCount !== 1 ? 's' : ''} merged ★` : ''}</div>
  </div>

  <div class="columns">
    ${categoryBlocks}
  </div>

  <div class="footer">
    Generated by Family Dinner Planner &nbsp;•&nbsp; ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked — please allow pop-ups for this site and try again.');
    return;
  }
  win.document.write(html);
  win.document.close();
  // Small delay so fonts/layout settle before print dialog
  setTimeout(() => win.print(), 400);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
