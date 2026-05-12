import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Link, Camera, Loader2, AlertCircle, KeyRound, Eye, EyeOff, ImagePlus } from 'lucide-react';
import { importFromUrl } from '../utils/recipeParser';
import { estimateNutrition } from '../utils/nutrition';
import { useLocalStorage } from '../hooks/useLocalStorage';
import AddEditRecipe from './AddEditRecipe';

async function compressImage(file, { maxDimension = 1920, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) { height = Math.round(height * maxDimension / width); width = maxDimension; }
        else { width = Math.round(width * maxDimension / height); height = maxDimension; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function extractRecipeFromImages(photos, apiKey) {
  const multi = photos.length > 1;
  const prompt = `Look at ${multi ? 'these recipe images — they are the front and back of the same recipe card' : 'this recipe image'} and extract all the recipe details into a single complete recipe. Return ONLY a valid JSON object with these exact fields:
{
  "name": "Recipe Name",
  "description": "Brief description of the dish",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "ingredients": [
    { "amount": 1, "unit": "cup", "name": "all-purpose flour" }
  ],
  "instructions": [
    "Step one text here.",
    "Step two text here."
  ],
  "tags": ["italian", "quick"]
}

Rules:
- prepTime and cookTime are numbers in minutes (0 if not shown)
- amount is a number (use 0 if no quantity given)
- unit is a string like "cup", "tbsp", "oz", "lb", or "" if none
- tags should be lowercase, pick from: quick, slow-cooker, italian, mexican, asian, american, healthy, vegetarian, vegan, gluten-free, comfort-food, chicken, beef, pork, seafood, pasta, one-pan, weeknight, family-favorite, grill, soup, side
- Return ONLY the JSON, no explanation, no markdown, no code block.`;

  const totalKB = photos.reduce((sum, p) => sum + Math.round((p.base64.length * 3) / 4 / 1024), 0);
  console.log(`[RecipeScan] Sending ${photos.length} image(s) to Claude, ~${totalKB} KB total`);

  const imageBlocks = photos.map(({ base64, mediaType }) => ({
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data: base64 },
  }));

  let response;
  try {
    response = await fetch('/api/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [...imageBlocks, { type: 'text', text: prompt }],
        }],
      }),
    });
  } catch (networkErr) {
    console.error('[RecipeScan] Network error (fetch threw):', networkErr);
    throw new Error(
      `Network error — couldn't reach Anthropic. Check your internet connection. (${networkErr.message})`
    );
  }

  console.log(`[RecipeScan] Response status: ${response.status}`);

  if (!response.ok) {
    let errBody = {};
    try { errBody = await response.json(); } catch {}
    console.error('[RecipeScan] API error response:', errBody);
    console.error('[RecipeScan] Error message:', errBody?.error?.message);
    console.error('[RecipeScan] Error type:', errBody?.error?.type);
    if (response.status === 401) throw new Error('Invalid API key — go to Settings and re-enter it.');
    if (response.status === 413 || totalKB > 8000) throw new Error('Images are too large. Try lower-resolution photos (under 4 MB each).');
    if (response.status === 400) throw new Error(errBody.error?.message || 'The image format may not be supported. Try JPG or PNG.');
    if (response.status === 529) throw new Error('Anthropic API is overloaded right now. Try again in a moment.');
    throw new Error(errBody.error?.message || `API returned status ${response.status} — open DevTools console for details.`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  console.log('[RecipeScan] Claude response text:', text);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude responded but couldn't find recipe data. Try clearer, well-lit photos.");
  return JSON.parse(jsonMatch[0]);
}

function ApiKeySetup({ apiKey, onSave, onSkip }) {
  const [value, setValue] = useState(apiKey || '');
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-2xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1.5">📸 Photo scanning uses Claude AI</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          To read recipes from photos, the app needs an Anthropic API key. It's free to get started and the key is saved only on your device — never sent anywhere except directly to Anthropic when you scan a photo.
        </p>
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-orange-600 underline underline-offset-2"
        >
          Get a free API key at console.anthropic.com →
        </a>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Anthropic API Key</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full pl-4 pr-10 py-3 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm font-mono"
          />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <p className="text-xs text-stone-400 mt-1.5">Stored locally on your device only.</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm hover:bg-stone-50 transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={() => value.trim() && onSave(value.trim())}
          disabled={!value.trim()}
          className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save Key
        </button>
      </div>
    </div>
  );
}

export default function ImportRecipe({ onSave, onClose }) {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedRecipe, setImportedRecipe] = useState(null);
  const [apiKey, setApiKey] = useLocalStorage('anthropicApiKey', '');
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [stagedPhotos, setStagedPhotos] = useState([]); // [{ base64, mediaType }]
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleUrlImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const recipe = await importFromUrl(url.trim());
      const estimated = estimateNutrition(recipe.ingredients, recipe.servings);
      setImportedRecipe({
        ...recipe,
        nutrition: (estimated && estimated.calories > 0) ? estimated : recipe.nutrition,
      });
    } catch (err) {
      setError(err.message || 'Failed to import. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const stageFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please use an image file (JPG, PNG, HEIC, etc.)');
      return;
    }
    if (!apiKey) {
      setShowKeySetup(true);
      return;
    }
    if (stagedPhotos.length >= 2) return;
    setError('');
    const compressed = await compressImage(file);
    setStagedPhotos(prev => [...prev, compressed]);
  }, [apiKey, stagedPhotos.length]);

  const handleScan = async () => {
    if (stagedPhotos.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const extracted = await extractRecipeFromImages(stagedPhotos, apiKey);
      const servings = Number(extracted.servings) || 4;
      const ingredients = (extracted.ingredients || []).map(i => ({
        amount: Number(i.amount) || 0,
        unit: String(i.unit || ''),
        name: String(i.name || ''),
      }));
      const { base64, mediaType } = stagedPhotos[0];
      setImportedRecipe({
        name: extracted.name || 'Imported Recipe',
        description: extracted.description || '',
        emoji: '📸',
        prepTime: Number(extracted.prepTime) || 0,
        cookTime: Number(extracted.cookTime) || 0,
        servings,
        ingredients,
        instructions: (extracted.instructions || []).filter(Boolean),
        tags: extracted.tags || [],
        imageUrl: `data:${mediaType};base64,${base64}`,
        source: '',
        nutrition: estimateNutrition(ingredients, servings) || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      });
    } catch (err) {
      setError(err.message || 'Could not read the recipe from these photos. Try clearer, well-lit images.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handlePhotoChange = (e) => {
    stageFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items?.[0]?.kind === 'file') setDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSaveKey = (key) => {
    setApiKey(key);
    setShowKeySetup(false);
  };

  if (importedRecipe) {
    return <AddEditRecipe recipe={importedRecipe} onSave={onSave} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4" onClick={onClose}>
      <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="text-lg font-bold text-stone-800">Import a Recipe</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
            <X size={18} className="text-stone-500" />
          </button>
        </div>

        <div className="p-6">
          {showKeySetup ? (
            <ApiKeySetup
              apiKey={apiKey}
              onSave={handleSaveKey}
              onSkip={() => setShowKeySetup(false)}
            />
          ) : (
            <>
              {/* Mode switcher */}
              <div className="flex gap-2 mb-6 bg-stone-100 rounded-xl p-1">
                <button
                  onClick={() => { setMode('url'); setError(''); setStagedPhotos([]); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'url' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  <Link size={16} /> From URL
                </button>
                <button
                  onClick={() => { setMode('photo'); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'photo' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  <Camera size={16} /> From Photo
                </button>
              </div>

              {mode === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Paste a recipe URL from AllRecipes, Food Network, NYT Cooking, and more
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUrlImport()}
                      placeholder="https://www.allrecipes.com/recipe/..."
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
                      autoFocus
                    />
                  </div>
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}
                  <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-700 space-y-1">
                    <p className="font-semibold text-sm">💡 Tips for best results</p>
                    <p>• Works with AllRecipes, Food Network, Serious Eats, NYT Cooking, and most major recipe sites</p>
                    <p>• If a URL fails, try the Photo option instead</p>
                  </div>
                  <button
                    onClick={handleUrlImport}
                    disabled={loading || !url.trim()}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Importing...</> : 'Import Recipe'}
                  </button>
                </div>
              )}

              {mode === 'photo' && (
                <div className="space-y-4">
                  {!apiKey && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <KeyRound size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">API key required</p>
                        <p className="text-xs text-amber-600 mt-0.5">Photo scanning uses Claude AI to read the recipe.</p>
                        <button onClick={() => setShowKeySetup(true)} className="text-xs font-semibold text-orange-600 underline underline-offset-2 mt-1">
                          Set up API key →
                        </button>
                      </div>
                    </div>
                  )}

                  {apiKey && (
                    <div className="flex items-center justify-between text-xs text-stone-400">
                      <span className="flex items-center gap-1.5">
                        <KeyRound size={12} className="text-green-500" />
                        API key saved
                      </span>
                      <button onClick={() => setShowKeySetup(true)} className="text-orange-500 hover:text-orange-600 font-medium">
                        Change key
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                      </div>
                      <p className="text-xs text-red-500 pl-6">
                        Full details in browser DevTools → Console tab
                        <span className="text-red-400"> (Mac: ⌘⌥I · Windows: F12)</span>
                      </p>
                    </div>
                  )}

                  {/* Hidden inputs */}
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                    onChange={handlePhotoChange} className="hidden" disabled={!apiKey} />
                  <input ref={fileInputRef} type="file" accept="image/*"
                    onChange={handlePhotoChange} className="hidden" disabled={!apiKey} />

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-4">
                      <div className="relative">
                        <Camera size={40} className="text-orange-200" />
                        <Loader2 size={20} className="text-orange-500 animate-spin absolute -bottom-1 -right-1" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-stone-700">Reading your recipe...</p>
                        <p className="text-xs text-stone-400 mt-1">
                          Claude is analyzing {stagedPhotos.length === 2 ? 'both pages' : 'the photo'}
                        </p>
                      </div>
                    </div>
                  ) : stagedPhotos.length > 0 ? (
                    <div className="space-y-3">
                      {/* Staged photo thumbnails */}
                      <div className="flex gap-3">
                        {stagedPhotos.map((photo, i) => (
                          <div key={i} className="relative flex-1">
                            <img
                              src={`data:${photo.mediaType};base64,${photo.base64}`}
                              alt={`Page ${i + 1}`}
                              className="w-full h-32 object-cover rounded-xl border-2 border-stone-200"
                            />
                            <span className="absolute top-1.5 left-1.5 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-md font-medium">
                              {stagedPhotos.length === 2 ? (i === 0 ? 'Front' : 'Back') : 'Page 1'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setStagedPhotos(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-500 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}

                        {/* Add 2nd page slot */}
                        {stagedPhotos.length < 2 && (
                          <div className={`flex-1 ${!apiKey ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                className="flex items-center justify-center gap-1.5 w-full h-14 bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl text-xs font-medium text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                              >
                                <Camera size={14} /> Camera
                              </button>
                              <label
                                className="flex items-center justify-center gap-1.5 w-full h-14 bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl text-xs font-medium text-stone-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <ImagePlus size={14} />
                                {dragging ? 'Drop here' : 'Add back page'}
                              </label>
                            </div>
                            <p className="text-xs text-stone-400 text-center mt-1.5">Optional 2nd page</p>
                          </div>
                        )}
                      </div>

                      {/* Scan button */}
                      <button
                        onClick={handleScan}
                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera size={16} />
                        Scan {stagedPhotos.length === 2 ? 'Both Pages' : 'Recipe'}
                      </button>
                    </div>
                  ) : (
                    <div className={`grid grid-cols-2 gap-3 ${!apiKey ? 'opacity-50 pointer-events-none' : ''}`}>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-5 bg-orange-50 border-2 border-orange-200 rounded-2xl hover:bg-orange-100 hover:border-orange-300 transition-colors"
                      >
                        <Camera size={28} className="text-orange-500" />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-stone-700">Take a Photo</p>
                          <p className="text-xs text-stone-400 mt-0.5">Use your camera</p>
                        </div>
                      </button>

                      <label
                        className="flex flex-col items-center gap-2 p-5 bg-stone-50 border-2 border-stone-200 rounded-2xl hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer"
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className={`transition-colors ${dragging ? 'text-orange-500' : 'text-stone-400'}`}>
                          <ImagePlus size={28} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-stone-700">
                            {dragging ? 'Drop to add!' : 'Choose / Drop'}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">Library or drag a file</p>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500 space-y-1">
                    <p>✓ Works with printed recipe cards, cookbooks, and handwritten notes</p>
                    <p>✓ Front and back of a recipe card? Add both pages before scanning</p>
                    <p>✓ Better lighting = better results</p>
                    <p>✓ You can review and edit everything before saving</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
