# Amazon Now — AI Smart Cart Builder
### Complete Product Documentation

---

## What Is This?

Amazon Now is an AI-powered quick-commerce grocery app that delivers in 9 minutes. The core differentiator is the **AI Cart Builder** — instead of browsing and searching for individual products, users describe a situation in plain language (or voice) and the AI automatically builds the right cart. The app is mobile-first, built for urban Indian households.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, Framer Motion |
| State | Zustand (persisted cart, user profile, order history) |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB + Mongoose (text search indexes) |
| AI / LLM | Groq API (llama-3.1-8b-instant) via OpenAI-compatible client |
| Real-time | Socket.io (order status updates) |
| Hosting | Local dev on ports 3000 (frontend) + 3001 (backend) |

---

## Complete Feature Workflow

---

### 1. Home Page

The home page loads immediately with:

- **Promo banners** — Snack Store, Fresh Dairy, Fruit Fest (horizontal scroll)
- **Shop by Category** — icon grid for Vegetables, Fruits, Dairy, Snacks, Beverages, Staples, Ice Cream, Personal Care, Household, Pharmacy
- **AI Cart Builder** (see section 3 below)
- **For You** — personalised AI recommendations powered by purchase history, profile, time of day, and upcoming festivals
- **Farm Loot** — products with highest discounts (tag: `farm-loot`)
- **Recommended** — tabbed grid: Top Picks / Dairy / Vegetables / Fruits

---

### 2. Search

Tap the 🔍 icon in the header → navigates to `/search` page.

**Search page:**
- Sticky search bar with text input + voice mic
- 300ms debounce — searches as you type
- MongoDB regex search across product name, brand, category, highlights
- Popular searches shown when input is empty (Amul Milk, Onions, Eggs, etc.)
- Results in a 2-column product card grid
- Voice input (Web Speech API, `en-IN` locale) fills the search and auto-submits

---

### 3. AI Cart Builder

The flagship feature. Located on the home page as a purple/indigo card.

**Input row:** `[text input 🎤] [Go!] [⚡]`

**How it works (two-step hybrid approach):**

**Step 1 — LLM identifies items (no product IDs, just names)**

The prompt instructs the model to:
- Understand the situation described (cooking, illness, occasion, Hinglish)
- List only the DIRECTLY required items (max 8, strict anti-hallucination rules)
- Never include generic pantry staples (oil, salt, sugar)
- For medical queries: list only pharmacy products (max 3)
- For cooking queries: list only distinguishing ingredients

Examples:
| Query | LLM returns |
|---|---|
| "make poha" | poha flakes, peanuts, onion, mustard seeds, curry leaves |
| "kid has fever" | paracetamol, thermometer, ORS |
| "mujhe sardi ho gyi hai" | cough syrup, nasal drops, throat lozenges |
| "birthday party" | balloons, party hats, candles, cake, chips |
| "make biryani" | biryani masala, basmati rice, saffron, mint leaves, curd, fried onions |

**Step 2 — MongoDB resolves items to real products (zero hallucination)**

- Synonym map translates generic LLM terms to catalogue names (`"poha flakes"` → `"poha"`, `"peanuts"` → `"peanut"`, `"ors"` → `"electral"`)
- Category filtering prevents wrong matches:
  - Medical/symptom queries → `pharmacy` only
  - Cooking/food queries → food categories only (vegetables, fruits, dairy, snacks, beverages, staples, icecream)
  - Party/birthday queries → food + household
- 3-strategy matching per item:
  1. Regex on product name (most precise)
  2. MongoDB text search with name-word validation
  3. Word-boundary regex fallback
- Non-food blocklist prevents "Mama Earth Onion Shampoo" matching "onion"
- Blocked subcategories prevent "Limca (soft-drink)" matching "lemon"

**Voice input:**
- Tap the mic → speech recognized → fills input → auto-submits immediately

**Zap Mode (⚡):**
- Toggle the lightning bolt to enable
- Yellow hint bar appears: "⚡ Zap mode ON — order goes straight to packing, pay on delivery"
- After cart is built → Zap Order Modal opens instead of going to cart

---

### 4. Zap Order Modal

Triggered when AI Cart Builder runs with Zap mode ON.

**Screen layout:**
- Orange gradient header with "Zap Order" title
- 8-second countdown bar — auto-orders when it hits zero
- Product list with images and prices
- COD note: "Pay Cash on Delivery — no payment needed now"
- "Cancel" and "Order Now" buttons

**Flow:**
1. User can cancel within 8 seconds (removes items from cart)
2. Or tap "Order Now" immediately
3. Packing animation plays
4. Order is placed via API
5. Navigates to Order Tracking page

---

### 5. Cart Page

Standard cart with:
- Savings banner (MRP discount saved)
- Free delivery progress bar (threshold ₹199)
- Delivery address
- Cart items with quantity controls (+/-)
- AI suggestions ("You might have missed") — 3 complementary products suggested by AI
- Price breakdown (MRP, discount, handling fee, delivery)
- **Swipe to Confirm** slider at the bottom

**Swipe to Confirm:**
- Dark navy rounded track
- White thumb with → arrow
- Drag right → fill bar grows, label fades
- At 78% drag → snaps to end, turns green ✓, shows "Confirmed!"
- After confirm → navigates directly to Checkout (payment page)

---

### 6. Checkout / Payment Page

- Address selection (Home / Work)
- Payment method: UPI, Amazon Pay, Credit/Debit Card, Cash on Delivery
- Order summary (first 3 items + "+N more")
- Price breakdown
- **Swipe to Place Order** — orange gradient slider at the bottom
  - Drag right → order placed via API
  - "⏳ Placing Order…" spinner shown
  - On success → navigates to Order Tracking

---

### 7. Order Tracking Page

**For normal orders (UPI/Card):**
- Header: "Order Placed! 🎉" with order number
- Yellow countdown timer (9:00 counting down)
- Live tracking stepper: Confirmed → Packed → Rider Picked Up → On the Way → Delivered
- Real-time updates via Socket.io
- Order items list with product images
- "Continue Shopping" button

**For Zap orders (COD):**
- Everything above, plus:
- "⚡ Zap Order — Pay later" badge in header
- Stages **auto-advance** on a timer:
  - Confirmed → Packed (6s)
  - Packed → Rider Picked Up (8s)
  - On the Way (5s)
  - Delivered (8s)
- When status reaches "On the Way": orange **"💳 Time to Pay!"** banner appears
- Tap "Pay ₹X" → payment method sheet slides up (UPI / Amazon Pay / Card)
- After payment: green "Payment Successful ✓" confirmation

---

### 8. Product Detail Page

- Product images (local slug-based + Unsplash fallback)
- Discount badge, deal score (great/good/avg)
- Price, MRP, unit
- Highlights, ingredients
- Veg/non-veg indicator
- Add to cart button
- AI deal scoring (great = ≥40% off, good = 20–39%, avg = <20%)

---

### 9. Category Pages

- Filter products by category
- Sort by discount, price, rating
- Grid of ProductCards with add-to-cart

---

### 10. For You — AI Recommendation Engine

Runs on home page load. Sends to backend:
- User profile (profession, family size, dietary preference, budget level)
- 15-day order history
- Current cart contents
- Day of week, time of day, upcoming festival

Returns 4 types of recommendations:
| Type | Description |
|---|---|
| Replenishment | Items running low based on purchase frequency |
| Basket Completion | Items that pair with current cart |
| Discovery | New products suited to the user's profile |
| Occasion | Weekend stocking, festival picks, etc. |

Displayed as a 2-column grid with type badges (🔄 Restock, 🛒 Add to Cart, 🎉 Right Now, ✨ New for You)

---

### 11. Profile Page

Users set:
- Profession (student, software engineer, homemaker, doctor, teacher, business owner)
- Family size, adults, children
- Dietary preference (vegetarian / non-vegetarian / vegan)
- Budget level (low / medium / high)
- Location type (apartment / house / PG)

Changing profession auto-seeds a 15-day order history template for that persona.

---

### 12. Smart Reorder

On the cart page, previously ordered items can be ranked by urgency:
- Perishables first (expiryMonths = 0: milk, paneer, vegetables)
- Fast consumption (snacks, beverages)
- Slow staples last (rice, atta, sugar)
- Escalates if days since last order > 14

---

## Product Catalogue

282 products across 10 categories:

| Category | Count | Highlights |
|---|---|---|
| Vegetables | 43 | Fresh tomatoes, Mint leaves, Green chillies, Onions |
| Fruits | 22 | Alphonso mangoes, Strawberries, Dragon fruit |
| Dairy | 24 | Amul Milk, Paneer, Curd, Ghee, Eggs |
| Snacks | 35 | Lay's, Kurkure, Haldiram's, Maggi, Poha |
| Beverages | 23 | Tata Tea, Nescafé, Red Bull, Starbucks Cold Brew |
| Staples | 50 | Basmati rice, Toor dal, Biryani masala, Saffron |
| Ice Cream | 17 | Amul, Baskin Robbins, Häagen-Dazs |
| Personal Care | 22 | Dove, Colgate, Gillette, Vicks VapoRub |
| Household | 28 | Surf Excel, Birthday candles, Balloons, Party hats, Cake |
| Pharmacy | 17 | Dolo 650, Thermometer, Strepsils, Nasivion, ORS, Volini |

---

## AI Services (Backend)

All powered by Groq's `llama-3.1-8b-instant` at temperature 0.0–0.2.

| Service | Purpose |
|---|---|
| `cartBuilder` | Two-step hybrid: LLM identifies items → MongoDB resolves to products |
| `nlSearch` | Semantic search for the search bar (AI mode) |
| `cartSuggest` | 3 complementary product suggestions based on cart contents |
| `groceryRecommend` | Personalised "For You" recommendations |
| `smartReorder` | Ranks past orders by urgency |
| `scoreDeal` | Rates a product as great/good/avg deal |

---

## Running the App

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Set environment variables
cd backend
cp .env.example .env
# Add GROQ_API_KEY and MONGO_URI

# 3. Seed the database
cd backend && npm run seed

# 4. Start both servers
# Terminal 1:
cd backend && npm run dev   # runs on :3001

# Terminal 2:
cd frontend && npm run dev  # runs on :3000
```

> **Important:** After every `npm run seed`, restart the backend so Mongoose recreates the MongoDB text search indexes.

Open http://localhost:3000 in Chrome DevTools at mobile width (e.g., iPhone 14 Pro, 393px).

---

## Key Design Decisions

1. **Hybrid AI + DB matching** — LLM never touches product IDs. It only identifies item names. MongoDB does the actual matching. This eliminates hallucination at the product resolution step.

2. **Category-scoped matching** — Medical queries only search `pharmacy`, food queries only search food categories. This prevents "Mama Earth Onion Shampoo" from matching "onion".

3. **Synonym map** — Bridges LLM vocabulary to catalogue names. "poha flakes" → "poha", "peanuts" → "peanut", "ors" → "electral".

4. **Hinglish support** — Both the LLM prompt and the regex health-query detector understand Hindi/Hinglish terms (bukhar, sardi, khansi, sar dard, etc.)

5. **Zap Mode** — Removes all checkout friction for urgent situations. Cart → instant order → pack → pay on delivery. The whole flow from typing "kid has fever" to order being packed takes under 15 seconds.

6. **Swipe UX** — Both cart confirmation and order placement use gesture-based swipe sliders instead of tap buttons, preventing accidental orders.
