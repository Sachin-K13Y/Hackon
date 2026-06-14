import OpenAI from 'openai';
import Product, { IProduct } from '../models/Product';

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return _client;
}
const MODEL = () => process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTimeSlot(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function parseJSON<T>(raw: string): T | null {
  try {
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const noComments = clean.replace(/\/\/[^\n]*/g, '');
    return JSON.parse(noComments) as T;
  } catch {
    console.error('[AI] JSON parse error. Raw:', raw.slice(0, 300));
    return null;
  }
}

// ---------------------------------------------------------------------------
// System Base — shared personality & rules
// ---------------------------------------------------------------------------
const SYSTEM_BASE = `You are the AI brain of Amazon Now India — a 10-minute grocery delivery app serving urban Indian households.

Your personality:
- Practical, knowledgeable, never verbose
- Understand Indian cooking, Indian diets, Indian brands (Amul, Haldiram's, MDH, Parle, etc.)
- Know that value-for-money matters deeply to Indian shoppers
- Be Hinglish-aware: queries may mix Hindi and English

Critical rules that apply to ALL tasks:
1. Respond ONLY in valid JSON. Zero prose outside the JSON object.
2. Never invent product IDs — only use IDs from the provided catalogue list.
3. Never repeat products already in the user's cart.
4. Understand Indian meal logic: dal needs rice, poha needs poha flakes + peanuts + oil, chai needs milk + tea leaves.
5. Temperature = 0.2 (enforced by caller) — stay focused, not creative.
6. If you cannot find a match, return an empty productIds array rather than guessing.
7. Respect dietary flags (isVeg) — never suggest non-veg products for a vegetarian cart.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SearchResult { type: 'SEARCH'; productIds: string[]; queryIntent?: string }
interface SuggestResult { type: 'SUGGEST'; productIds: string[]; reason?: string[] }
interface CartBuilderResult { type: 'CART_BUILDER'; productIds: string[]; situationName: string; missingItems?: string[]; itemLabels?: Record<string, string>; error?: 'ai_unavailable' }
interface DealResult { type: 'DEAL'; dealScore: 'great' | 'good' | 'avg' }
interface ReorderResult { type: 'REORDER'; rankedProductIds: string[]; urgencyFlags?: Record<string, string> }

export interface HistoryEntry {
  product_id: string;
  product_name: string;
  category: string;
  days_ago: number;
  quantity: number;
}

export interface UserProfile {
  profession: string;
  family_size: number;
  adults: number;
  children: number;
  dietary_pref: string;
  budget_level: string;
  location_type: string;
}

export interface RecommendGroup {
  type: 'replenishment' | 'basket_completion' | 'discovery' | 'occasion';
  product_ids: string[];
  reason: string;
  priority: number;
}

export interface RecommendResult {
  recommendations: RecommendGroup[];
  pantry_insight: string;
  occasion_detected: string | null;
  budget_mode: boolean;
  replenishment_urgency: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Core caller
// ---------------------------------------------------------------------------
async function callGroq(userMessage: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: MODEL(),
    max_tokens: 1024,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_BASE },
      { role: 'user', content: userMessage },
    ],
  });
  return response.choices[0]?.message?.content ?? '';
}

// ---------------------------------------------------------------------------
// 1. NL SEARCH
// ---------------------------------------------------------------------------
export async function nlSearch(query: string): Promise<SearchResult> {
  try {
    const categories = ['vegetables', 'fruits', 'dairy', 'snacks', 'beverages', 'staples', 'personalcare', 'icecream', 'household'];
    const allProducts: Pick<IProduct, '_id' | 'name' | 'category' | 'tags'>[] = [];
    for (const cat of categories) {
      const prods = await Product.find({ category: cat }, '_id name category tags').limit(9).lean();
      allProducts.push(...(prods as any));
    }

    const productList = allProducts
      .map(p => `${p._id}|${p.name}|${p.category}|${(p.tags ?? []).join(',')}`)
      .join('\n');

    const msg = `=== NL SEARCH ===
You are a semantic grocery search engine for Amazon Now India.

User query: "${query}"

Available products (id|name|category|tags):
${productList}

Understand the INTENT behind the query — it may be:
- A specific product ("Amul butter")
- A meal or dish ("make poha", "Sunday dal-chawal")
- A mood or occasion ("birthday party snacks", "post-gym food")
- A dietary need ("high protein", "low sugar")
- A vague description ("something spicy and crunchy")

Matching rules:
1. Return up to 5 most relevant product IDs.
2. For dish queries, return all necessary INGREDIENTS found in the catalogue.
3. For mood/occasion, match by category + tags + product semantics.
4. Prefer items with 'top-pick' or 'steal-deal' tags if quality is equal.
5. Sort by relevance descending.
6. If query is in Hindi/Hinglish (e.g., "doodh", "anda", "namkeen"), translate and match correctly.

Output ONLY valid JSON: { "type": "SEARCH", "productIds": ["id1",...], "queryIntent": "ingredient|dish|mood|dietary|specific" }
No markdown, no explanation outside the JSON.`;

    const raw = await callGroq(msg);
    return parseJSON<SearchResult>(raw) ?? { type: 'SEARCH', productIds: [] };
  } catch (err) {
    console.error('[AI] NL Search error:', err);
    return { type: 'SEARCH', productIds: [] };
  }
}

// ---------------------------------------------------------------------------
// 2. CART SUGGEST
// ---------------------------------------------------------------------------
export async function cartSuggest(
  cartProductIds: string[],
  subtotal: number = 0
): Promise<SuggestResult> {
  try {
    const cartProducts = await Product.find(
      { _id: { $in: cartProductIds } },
      'name category isVeg'
    ).lean();

    const allProducts = await Product.find(
      { _id: { $nin: cartProductIds } },
      '_id name category tags isVeg'
    ).limit(80).lean();

    const cartList = cartProducts
      .map(p => `${p.name} (${p.category})`)
      .join(', ');

    const productList = allProducts
      .map(p => `${p._id}|${p.name}|${p.category}|${(p.tags ?? []).join(',')}|veg:${p.isVeg}`)
      .join('\n');

    const timeSlot = getTimeSlot();

    const msg = `=== CART SUGGEST ===
You are a sharp grocery assistant for Amazon Now India (10-minute delivery). The user has these items in their cart:

${cartList}

Cart total: ₹${subtotal}
Time of day: ${timeSlot} (morning/afternoon/evening/night)

Your job: suggest exactly 3 products from the catalogue that the user is MOST LIKELY to add.

Rules:
1. NEVER suggest products already in the cart.
2. Prioritise COMPLEMENTARY items (e.g., bread + butter, dal + rice + ghee).
3. If cart total > ₹300, prefer premium/branded variants.
4. If cart total < ₹150, prefer value packs and steal-deals.
5. Consider the time slot — mornings favour breakfast items, evenings favour snacks/beverages.
6. If cart has only one category, diversify. If cart spans 3+ categories, stay within those worlds.
7. Rank by: (a) meal-completion logic, (b) high discount tags, (c) top-pick rating.
8. Output ONLY valid JSON: { "type": "SUGGEST", "productIds": ["id1","id2","id3"], "reason": ["one-line reason for each"] }
9. No markdown, no explanation outside the JSON.

Available products (id|name|category|tags|isVeg):
${productList}`;

    const raw = await callGroq(msg);
    return parseJSON<SuggestResult>(raw) ?? { type: 'SUGGEST', productIds: [] };
  } catch (err) {
    console.error('[AI] Cart suggest error:', err);
    return { type: 'SUGGEST', productIds: [] };
  }
}

// ---------------------------------------------------------------------------
// 3. GENERAL CART BUILDER — Hybrid: LLM identifies items, DB finds products
// ---------------------------------------------------------------------------
export async function cartBuilder(query: string): Promise<CartBuilderResult> {
  try {
    // Step 1: Ask LLM ONLY to identify item names — tiny task, very reliable
    const itemPrompt = `You are a strict Indian grocery/pharmacy catalogue assistant. The user typed: "${query}"

TASK: Identify ONLY the items that are DIRECTLY and SPECIFICALLY needed for this exact situation. No extras.

STRICT RULES:
1. Every item you list must have a clear, direct reason to be in this specific situation.
2. Do NOT add general household items, "nice to have" items, or things tangentially related.
3. Do NOT add items just because they are commonly bought together in general.
4. Focus ONLY on what the situation specifically requires.
5. Use simple English names that exist in a grocery/pharmacy store.
6. Do NOT use brand names — use generic names (e.g., "paracetamol" not "Calpol").
7. Max 6 items. Fewer is better if the situation is narrow.
8. If the query is nonsense or unrelated to grocery/pharmacy needs, return [].
9. Do NOT include generic pantry staples (oil, salt, sugar, water, lemon) that every kitchen already has.
10. For cooking queries, include only the DISTINGUISHING ingredients of that dish, not basic supplies.
11. MEDICAL/SYMPTOM situations (fever, headache, vomiting, cold, pain, injury, etc.): list ONLY actual medicines or pharmacy products. Max 3 items. NEVER include food, drinks, energy drinks, water, juice, ginger, or cooking ingredients — these do NOT treat symptoms.
12. If the query is in Hindi/Hinglish, translate it first: "bukhar"=fever, "sardi/zukaam/jukam"=cold, "khansi"=cough, "sar dard"=headache, "pet dard"=stomach ache, "bimaar"=sick, "chot"=wound/injury, "dard"=pain.

SITUATION EXAMPLES (follow this level of strictness):
- "kid has fever" → ONLY: ["paracetamol", "thermometer", "ORS"]
- "I have headache" → ONLY: ["paracetamol", "pain relief balm"]
  (NOT: energy drink, water, ginger, coffee — those are NOT medicines)
- "am having vomiting" → ONLY: ["ORS", "anti-nausea tablet"]
  (NOT: ginger, kombucha, soda — those are food/drinks, not pharmacy products)
- "mujhe sardi ho gyi hai" → ONLY: ["cough syrup", "nasal drops", "throat lozenges"]
  (translate "sardi" = cold, then list pharmacy products only)
- "mujhe bukhar hai" → ONLY: ["paracetamol", "thermometer"]
- "make poha" → ONLY: ["poha flakes", "peanuts", "onion", "mustard seeds", "curry leaves"]
- "guests arriving" → ONLY: ["chips", "biscuits", "namkeen", "cold drink"]
- "birthday party" → ONLY: ["cake", "balloons", "candles", "chips", "cold drink", "party hats"]
- "morning chai" → ONLY: ["tea leaves", "milk"]
- "make dal" → ONLY: ["toor dal", "onion", "tomato", "turmeric"]

ANTI-HALLUCINATION CHECK: Before adding each item, ask yourself — "Is this item REQUIRED for '${query}'?" If not sure, leave it out. For symptoms, ask "Is this an actual medicine?"

Output ONLY a valid JSON array: ["item1", "item2", ...] or []
No explanation, no markdown, no preamble.`;

    let raw;
    try {
      raw = await getClient().chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        max_tokens: 150,
        temperature: 0.0,
        messages: [{ role: 'user', content: itemPrompt }],
      });
    } catch (err) {
      // Rate limit, network, or auth error — distinct from "no items found"
      console.error('[AI CartBuilder] LLM call failed:', (err as any)?.message ?? err);
      return { type: 'CART_BUILDER', productIds: [], situationName: '', error: 'ai_unavailable' };
    }

    const itemsRaw = raw.choices[0]?.message?.content ?? '[]';
    let items: string[] = [];
    try {
      const clean = itemsRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      items = JSON.parse(clean);
    } catch {
      console.error('[AI CartBuilder] Failed to parse item list:', itemsRaw.slice(0, 200));
      return { type: 'CART_BUILDER', productIds: [], situationName: 'Unknown' };
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.warn('[AI CartBuilder] Not a valid query:', query);
      return { type: 'CART_BUILDER', productIds: [], situationName: '', missingItems: [] };
    }

    // Sanitise: keep only non-empty strings, trim, cap to 8 items (prevents crashes + unbounded queries)
    items = items
      .filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
      .map((i) => i.trim())
      .slice(0, 8);

    // Hard blacklist of items that break matching or don't exist in catalogue
    const ALWAYS_SKIP = new Set(['water', 'ice', 'lemon', 'lime', 'salt', 'sugar', 'oil']);
    items = items.filter(i => !ALWAYS_SKIP.has(i.toLowerCase().trim()));

    if (items.length === 0) {
      return { type: 'CART_BUILDER', productIds: [], situationName: '', missingItems: [] };
    }

    console.log('[AI CartBuilder] Items identified:', items);

    // Infer situation name cleanly
    const situationNameRaw = query
      .replace(/i (want to|would like to|am going to)?\s*(make|cook|prepare|eat|have)?\s*/i, '')
      .replace(/for \d+ (people|person|persons)?/i, '')
      .trim();
    const situationName = situationNameRaw.charAt(0).toUpperCase() + situationNameRaw.slice(1) || query;

    // Step 2: Match items to products in MongoDB with strict category + subcategory filters
    const FOOD_CATEGORIES = ['vegetables', 'fruits', 'dairy', 'snacks', 'beverages', 'staples', 'icecream'];
    const PARTY_KEYWORDS = /birthday|party|celebration|balloons?|candles?|cake|decor|hats?|festiv/i;
    const isPartyQuery = PARTY_KEYWORDS.test(query);
    const NON_FOOD_WORDS = ['shampoo', 'soap', 'lotion', 'spray', 'freshener', 'detergent', 'cleaner', 'deo', 'perfume'];

    // Synonym map: common LLM terms → search keywords matching actual product names
    const SYNONYMS: Record<string, string[]> = {
      'poha flakes': ['poha'],
      'poha': ['poha'],
      'flattened rice': ['poha'],
      'peanuts': ['peanut'],
      'ground nuts': ['groundnut', 'peanut'],
      'green chilies': ['green chilli'],
      'green chili': ['green chilli'],
      'green chillies': ['green chilli'],
      'mustard seeds': ['mustard seeds'],
      'turmeric': ['turmeric', 'haldi'],
      'cumin': ['cumin', 'jeera'],
      'cumin seeds': ['cumin', 'jeera'],
      'ors': ['electral', 'ors'],
      'oral rehydration': ['electral', 'ors'],
      'electrolyte powder': ['electral', 'ors'],
      'electrolyte': ['electral', 'ors'],
      'paracetamol': ['paracetamol', 'dolo', 'crocin', 'combiflam'],
      'anti-diarrhoea tablets': ['diarrhoea', 'norflox', 'enterogermina'],
      'anti diarrhoea': ['diarrhoea', 'norflox'],
      'soda crackers': ['crackers', 'biscuit'],
      'cough syrup': ['cough syrup', 'honitus'],
      'throat lozenges': ['strepsils', 'lozenges'],
      'throat lozenge': ['strepsils', 'lozenges'],
      'nasal decongestant': ['nasivion', 'nasal'],
      'nasal decongestant spray': ['nasivion', 'nasal drops'],
      'nasal drops': ['nasivion'],
      'eucalyptus oil': ['karvol', 'eucalyptus'],
      'inhalation capsules': ['karvol'],
      'honey': ['dabur honey', 'honey'],
      'pain relief balm': ['moov', 'volini'],
      'pain balm': ['moov', 'volini'],
      'pain relief cream': ['moov'],
      'pain relief spray': ['volini'],
      'antiseptic': ['dettol'],
      'band aid': ['hansaplast'],
      'bandage': ['hansaplast'],
      'antacid': ['eno'],
      'acidity tablet': ['eno'],
      'gas relief': ['eno', 'pudin hara', 'hajmola'],
      'digestive': ['hajmola', 'pudin hara'],
      'ibuprofen': ['combiflam'],
      'thermometer': ['thermometer'],
      'coriander leaves': ['coriander'],
      'dhania': ['coriander'],
      'cooking oil': ['sunflower oil', 'refined oil'],
      'tea leaves': ['tea'],
      // Biryani-specific
      'biryani masala': ['biryani masala'],
      'saffron': ['saffron', 'kesar'],
      'kesar': ['saffron', 'kesar'],
      'fried onions': ['fried onions', 'birista'],
      'birista': ['fried onions', 'birista'],
      'caramelised onions': ['fried onions'],
      'mint leaves': ['mint leaves', 'pudina'],
      'pudina': ['mint leaves', 'pudina'],
      'mint': ['mint leaves'],
      'ginger garlic paste': ['ginger garlic paste'],
      'curd': ['amul masti dahi', 'nandini curd'],
      'dahi': ['amul masti dahi', 'nandini curd'],
      'yoghurt': ['amul masti dahi'],
      'basmati rice': ['basmati'],
      'rice': ['basmati'],
      // Party & celebration
      'balloons': ['balloon'],
      'balloon': ['balloon'],
      'party hats': ['party hats'],
      'party hat': ['party hats'],
      'candles': ['birthday cake candles'],
      'cake candles': ['birthday cake candles'],
      'birthday candles': ['birthday cake candles'],
      'cake': ['truffle cake', 'sponge cake', 'black forest', 'pineapple cake', 'red velvet', 'butterscotch', 'fresh fruit cake'],
      'birthday cake': ['truffle cake', 'sponge cake', 'black forest', 'pineapple cake', 'red velvet', 'butterscotch'],
      'decoration': ['birthday decoration kit'],
      'party decoration': ['birthday decoration kit'],
      'party kit': ['birthday decoration kit'],
      'disposable cups': ['paper cups'],
      'disposable plates': ['paper plates'],
      // Party food & drinks
      'chips': ["lay's", 'kurkure', 'wafers', 'balaji', 'pringles', 'chips'],
      'namkeen': ['haldiram', 'bhujia', 'moong dal', 'namkeen'],
      'cold drink': ['coca-cola', 'pepsi', 'thums up', 'sprite', 'limca'],
      'soft drink': ['coca-cola', 'pepsi', 'thums up', 'sprite'],
      'soda': ['coca-cola', 'pepsi', 'thums up', 'limca'],
      'biscuits': ['parle', 'britannia', 'oreo', 'biscuit'],
      'juice': ['tropicana', 'real', 'maaza', 'juice'],
    };

    // Subcategories that should never appear for food queries
    // Party queries allow soft-drink (cold drinks are valid at parties)
    const BLOCKED_SUBCATEGORIES = new Set(['shampoo', 'soap', 'handwash', 'dishwash', 'cleaning', 'laundry']);
    const BLOCKED_FOOD_ONLY = new Set([...BLOCKED_SUBCATEGORIES, 'soft-drink']);

    const isHealthQuery = /fever|cold|cough|sick|ill|headache|pain|flu|infection|medicine|first.?aid|vomit|nausea|diarrh|loose.?motion|stomach|migraine|allerg|wound|injury|bleed|sprain|burn|rash|itch|sardi|bukhar|khansi|dard|zukaam|pet.?dard|sar.?dard|chot|utti|jukam|bimaar/i.test(query);
    // Symptom/illness → pharmacy only; party/birthday → food + household; food → food only
    const categoryFilter = isHealthQuery
      ? { category: 'pharmacy' }
      : isPartyQuery
        ? { category: { $in: [...FOOD_CATEGORIES, 'household'] } }
        : { category: { $in: FOOD_CATEGORIES } };

    const foundProductIds: string[] = [];
    const foundNames = new Set<string>();
    const missingItems: string[] = [];
    const itemLabels: Record<string, string> = {}; // productId → LLM item name

    const MAX_OPTIONS_PER_ITEM = 6;

    const passesFilter = (p: any) =>
      !NON_FOOD_WORDS.some(w => p.name.toLowerCase().includes(w)) &&
      !(isPartyQuery ? BLOCKED_SUBCATEGORIES : BLOCKED_FOOD_ONLY).has(p.subcategory);

    // Resolve a single item to up to MAX_OPTIONS_PER_ITEM product variants
    const matchItem = async (item: string) => {
      const matches: { _id: any; name: string; category?: string }[] = [];
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();

      const addMatch = (p: any) => {
        const id = String(p._id);
        if (seenIds.has(id) || seenNames.has(p.name) || matches.length >= MAX_OPTIONS_PER_ITEM) return;
        seenIds.add(id);
        seenNames.add(p.name);
        matches.push(p);
      };

      const searchTerms: string[] = SYNONYMS[item.toLowerCase()] ?? [item];

      for (const term of searchTerms) {
        if (matches.length >= MAX_OPTIONS_PER_ITEM) break;

        // Strategy 1: Regex on product name
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexResults = await Product.find(
          { name: { $regex: escapedTerm, $options: 'i' }, ...categoryFilter },
          '_id name category subcategory'
        ).limit(MAX_OPTIONS_PER_ITEM).lean();

        regexResults
          .filter(passesFilter)
          // Drop weak tail-substring matches (e.g. "onion" inside "Cream & Onion" chips)
          .filter(p => (term.length / p.name.length) >= 0.18 || p.name.toLowerCase().startsWith(term.toLowerCase()))
          .sort((a, b) => (term.length / b.name.length) - (term.length / a.name.length))
          .forEach(addMatch);

        // Strategy 2: Text search
        if (matches.length < MAX_OPTIONS_PER_ITEM) {
          const searchQuery = term.includes(' ') ? `"${term}"` : term;
          const textResults = await Product.find(
            { $text: { $search: searchQuery }, ...categoryFilter },
            { score: { $meta: 'textScore' }, _id: 1, name: 1, category: 1, subcategory: 1 }
          )
            .sort({ score: { $meta: 'textScore' } })
            .limit(MAX_OPTIONS_PER_ITEM)
            .lean();

          const termWords = term.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
          textResults
            .filter(p => passesFilter(p) && termWords.some(w => p.name.toLowerCase().includes(w)))
            .forEach(addMatch);
        }
      }

      // Strategy 3: Word-boundary regex fallback
      if (matches.length === 0) {
        const words = item.split(' ').filter(w => w.length >= 4);
        const searchWord = words.sort((a, b) => b.length - a.length)[0];
        if (searchWord) {
          const escapedWord = searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const fallbackResults = await Product.find(
            { name: { $regex: `\\b${escapedWord}\\b`, $options: 'i' }, ...categoryFilter },
            '_id name category subcategory'
          ).limit(MAX_OPTIONS_PER_ITEM).lean();
          fallbackResults.filter(passesFilter).forEach(addMatch);
        }
      }

      return { item, matches };
    };

    // Run all item lookups in parallel, then merge in original order (preserves dedup + ordering)
    const results = await Promise.all(items.map(matchItem));

    for (const { item, matches } of results) {
      if (matches.length > 0) {
        let added = 0;
        for (const m of matches) {
          const id = String(m._id);
          if (!foundProductIds.includes(id) && !foundNames.has(m.name)) {
            foundProductIds.push(id);
            foundNames.add(m.name);
            itemLabels[id] = item;
            added++;
          }
        }
        if (added > 0) {
          console.log(`[AI CartBuilder]  ✅ "${item}" → ${added} option(s)`);
        } else {
          // All variants already claimed by an earlier item — treat as resolved, not missing
          console.log(`[AI CartBuilder]  ↪ "${item}" — variants already in cart`);
        }
      } else {
        missingItems.push(item);
        console.log(`[AI CartBuilder]  ❌ "${item}" — not in catalogue`);
      }
    }

    return {
      type: 'CART_BUILDER',
      situationName,
      productIds: foundProductIds,
      missingItems,
      itemLabels,
    };
  } catch (err) {
    console.error('[AI] CartBuilder error:', err);
    return { type: 'CART_BUILDER', productIds: [], situationName: '', error: 'ai_unavailable' };
  }
}

// ---------------------------------------------------------------------------
// 4. DEAL SCORE
// ---------------------------------------------------------------------------
export async function scoreDeal(productId: string): Promise<DealResult> {
  try {
    const product = await Product.findById(productId, 'name category mrp price discountPercent').lean();
    if (!product) return { type: 'DEAL', dealScore: 'avg' };

    const msg = `=== DEAL SCORE ===
Score this product's value for an Indian urban shopper.
PRODUCT: ${product.name}, category: ${product.category}, MRP: ₹${product.mrp}, selling at ₹${product.price}, discount: ${product.discountPercent}%

Score it as:
- "great" if discount ≥ 40% or price is well below market average for that category
- "good" if discount is 20–39% or moderately priced
- "avg" if discount < 20% or overpriced for the category

Output ONLY valid JSON: { "type": "DEAL", "dealScore": "great" | "good" | "avg" }`;

    const raw = await callGroq(msg);
    return parseJSON<DealResult>(raw) ?? { type: 'DEAL', dealScore: 'avg' };
  } catch (err) {
    console.error('[AI] Deal score error:', err);
    return { type: 'DEAL', dealScore: 'avg' };
  }
}

// ---------------------------------------------------------------------------
// 5. SMART REORDER
// ---------------------------------------------------------------------------
export async function smartReorder(
  pastOrderProductIds: string[],
  daysSinceOrder: number = 7
): Promise<string[]> {
  try {
    const products = await Product.find(
      { _id: { $in: pastOrderProductIds } },
      '_id name category expiryMonths'
    ).lean();

    const pastOrderList = products
      .map(p => `${p._id}|${p.name}|${p.category}|${p.expiryMonths}`)
      .join('\n');

    const timeSlot = getTimeSlot();

    const msg = `=== SMART REORDER ===
You are a reorder prioritisation engine for Amazon Now India.

The user previously ordered these products (id|name|category|expiryMonths):
${pastOrderList}

Days since last order: ${daysSinceOrder}
Current time of day: ${timeSlot}

Your task: rank these products from MOST to LEAST urgent to reorder.

Prioritisation logic:
1. PERISHABLES first: expiryMonths = 0 means it expires in days (milk, bread, vegetables, curd, paneer) — always rank highest.
2. FAST-CONSUMPTION items: beverages, snacks, cooking oil — rank second.
3. SLOW-BURN staples: rice, atta, sugar — rank last unless days_since_order > 20.
4. If days_since_order < 3 — de-prioritise everything (user just ordered).
5. If days_since_order > 14 — escalate all perishables to URGENT.
6. Apply category wisdom: dairy before staples, breakfast items higher in the morning.

Output ONLY valid JSON:
{
  "type": "REORDER",
  "rankedProductIds": ["most_urgent_id", ..., "least_urgent_id"],
  "urgencyFlags": { "id1": "urgent", "id2": "normal", "id3": "low" }
}
No markdown, no explanation outside the JSON.`;

    const raw = await callGroq(msg);
    const result = parseJSON<ReorderResult>(raw);
    return result?.rankedProductIds ?? pastOrderProductIds;
  } catch (err) {
    console.error('[AI] Smart reorder error:', err);
    return pastOrderProductIds;
  }
}

// ---------------------------------------------------------------------------
// Rule-based fallback: used when LLM is unavailable (rate limit / error)
// Returns top-rated products the user hasn't bought, grouped as "discovery"
// ---------------------------------------------------------------------------
async function ruleBasedRecommend(
  profile: UserProfile,
  cartProductIds: string[]
): Promise<RecommendResult> {
  try {
    const CATEGORY_MAP: Record<string, string[]> = {
      vegetarian: ['vegetables', 'fruits', 'dairy', 'staples', 'snacks', 'beverages'],
      'non-vegetarian': ['dairy', 'snacks', 'beverages', 'staples', 'fruits'],
      vegan: ['vegetables', 'fruits', 'staples', 'beverages', 'snacks'],
    };
    const cats = CATEGORY_MAP[profile.dietary_pref] ?? CATEGORY_MAP['vegetarian'];

    // Grab 12 top-pick products not in cart
    const products = await Product.find({
      category: { $in: cats },
      inStock: true,
      tags: 'top-pick',
      _id: { $nin: cartProductIds },
    }, '_id name category price discountPercent')
      .sort({ discountPercent: -1, 'rating.avg': -1 })
      .limit(12)
      .lean();

    if (!products.length) return {
      recommendations: [], pantry_insight: '', occasion_detected: null,
      budget_mode: false, replenishment_urgency: {},
    };

    return {
      recommendations: [{
        type: 'discovery',
        product_ids: (products as any[]).map((p: any) => String(p._id)),
        reason: 'Top picks for you',
        priority: 4,
      }],
      pantry_insight: 'Showing top picks while AI personalises your feed.',
      occasion_detected: null,
      budget_mode: profile.budget_level === 'low',
      replenishment_urgency: {},
    };
  } catch {
    return { recommendations: [], pantry_insight: '', occasion_detected: null, budget_mode: false, replenishment_urgency: {} };
  }
}

// ---------------------------------------------------------------------------
// 6. GROCERY RECOMMENDATION ENGINE
// ---------------------------------------------------------------------------
export async function groceryRecommend(
  profile: UserProfile,
  history: HistoryEntry[],
  cartProductIds: string[],
  upcomingFestival: string | null = null
): Promise<RecommendResult> {
  const EMPTY: RecommendResult = {
    recommendations: [],
    pantry_insight: '',
    occasion_detected: null,
    budget_mode: false,
    replenishment_urgency: {},
  };

  try {
    const historyCats = [...new Set(history.map((h) => h.category))];

    const catalogMap = new Map<string, { _id: string; name: string; category: string; price: number; discountPercent: number }>();

    for (const cat of historyCats) {
      const prods = await Product.find(
        { category: cat, inStock: true, _id: { $nin: cartProductIds } },
        '_id name category price discountPercent'
      ).limit(15).lean();
      for (const p of prods as any[]) catalogMap.set(String(p._id), p);
    }

    if (catalogMap.size < 80) {
      const allCats = ['vegetables', 'fruits', 'dairy', 'snacks', 'beverages', 'staples', 'personalcare', 'icecream', 'household'];
      for (const cat of allCats) {
        if (historyCats.includes(cat)) continue;
        const prods = await Product.find(
          { category: cat, inStock: true, _id: { $nin: cartProductIds } },
          '_id name category price discountPercent'
        ).sort({ discountPercent: -1 }).limit(6).lean();
        for (const p of prods as any[]) {
          if (catalogMap.size >= 80) break;
          catalogMap.set(String(p._id), p);
        }
        if (catalogMap.size >= 80) break;
      }
    }

    const catalog = Array.from(catalogMap.values());

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[now.getDay()];
    const timeSlot = getTimeSlot();
    const dateStr = now.toISOString().split('T')[0];
    const festival = upcomingFestival ?? 'null';

    const profileLine = `${profile.profession}|${profile.family_size}|${profile.adults}|${profile.children}|${profile.dietary_pref}|${profile.budget_level}|${profile.location_type}`;

    const historyLines = history.length > 0
      ? history.map(h => `${h.product_id}|${h.product_name}|${h.category}|${h.days_ago}|${h.quantity}`).join('\n')
      : '(no history yet)';

    const cartItems = cartProductIds.length > 0
      ? await Product.find({ _id: { $in: cartProductIds } }, '_id name category').lean()
      : [];
    const cartLines = cartItems.length > 0
      ? (cartItems as any[]).map((p: any) => `${p._id}|${p.name}|${p.category}`).join('\n')
      : '(cart is empty)';

    const catalogLines = catalog
      .map(p => `${p._id}|${p.name}|${p.category}|${p.price}|${p.discountPercent}`)
      .join('\n');

    const SYSTEM = `You are a smart grocery recommendation engine for a quick-commerce app.
Your job is to analyze a user's purchase history, profile, and real-time context to generate highly personalized grocery recommendations.
You must respond ONLY in valid JSON. No markdown, no preamble, no explanation.`;

    const USER_MSG = `PROFILE: ${profileLine}

HISTORY:
${historyLines}

CART:
${cartLines}

CONTEXT: ${dayOfWeek}|${timeSlot}|${dateStr}|${festival}

CATALOG:
${catalogLines}

---

YOUR TASKS:
Analyze all inputs and generate recommendations across these types:

TYPE 1 — replenishment: Look at HISTORY. Estimate reorder frequency. If days_since_last_purchase is approaching/exceeding that frequency, flag for replenishment.
TYPE 2 — basket_completion: Look at current CART items. Recommend logically paired or co-purchased items.
TYPE 3 — discovery: Recommend products the user has NEVER bought, suited to their PROFILE persona.
TYPE 4 — occasion: Use CONTEXT (day, date, festival) to surface occasion-relevant products. Omit if no clear occasion.

RULES:
1. Only recommend products from the provided CATALOG — never invent product IDs.
2. Return a maximum of 12 product IDs in total across all types.
3. Assign priority: replenishment=1, basket_completion=2, occasion=3, discovery=4.
4. Keep each "reason" field under 10 words.
5. If budget_level is "low" or recent spend is high, prefer items with discount_percent > 10.
6. If children > 0, at least 1 discovery recommendation must be kid-appropriate.
7. Do not recommend items already in CART.
8. If HISTORY has fewer than 3 entries, skip replenishment and rely on PROFILE for discovery.

OUTPUT SCHEMA (respond with ONLY this JSON):
{
  "recommendations": [
    {
      "type": "replenishment" | "basket_completion" | "discovery" | "occasion",
      "product_ids": ["id1", "id2"],
      "reason": "Short reason shown to user",
      "priority": 1
    }
  ],
  "pantry_insight": "One sentence estimate of current pantry state",
  "occasion_detected": "weekend_stocking" | "weekday_dinner" | "festival" | "party" | null,
  "budget_mode": true | false,
  "replenishment_urgency": {
    "product_id": 1
  }
}`;

    let response;
    try {
      response = await getClient().chat.completions.create({
        model: MODEL(),
        max_tokens: 800,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: USER_MSG },
        ],
      });
    } catch (err) {
      // LLM unavailable (rate limit / network) — return rule-based fallback
      console.warn('[AI Recommend] LLM unavailable, using rule-based fallback');
      return await ruleBasedRecommend(profile, cartProductIds);
    }

    const raw = response.choices[0]?.message?.content ?? '{}';
    console.log('[AI Recommend] Raw response:', raw.slice(0, 300));
    const result = parseJSON<RecommendResult>(raw);

    if (!result?.recommendations?.length) {
      console.warn('[AI Recommend] Empty response — using rule-based fallback');
      return await ruleBasedRecommend(profile, cartProductIds);
    }

    return result;
  } catch (err) {
    console.error('[AI] Grocery recommend error:', err);
    return await ruleBasedRecommend(profile, cartProductIds);
  }
}
