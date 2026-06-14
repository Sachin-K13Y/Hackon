import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight, Zap, RefreshCw, Sparkles, Wand2, Mic } from 'lucide-react';
import { fetchProducts, aiCartBuilder, aiRecommend, type RecommendGroup } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { ZapOrderModal } from '../components/ZapOrderModal';
import { CATEGORIES } from '../types';
import toast from 'react-hot-toast';
import { useSmartCartFlow } from '../hooks/useSmartCartFlow';
import { useCartStore } from '../store/cartStore';

const PROMO_BANNERS = [
  {
    id: 'snack-store',
    title: 'Snack Store 🍿',
    subtitle: 'Up to 40% off on your fav munchies',
    gradient: 'from-orange-500 to-amber-400',
    emoji: '🍪',
    link: '/category/snacks',
  },
  {
    id: 'dairy-fresh',
    title: 'Fresh Dairy 🥛',
    subtitle: 'Farm to your door in 9 mins',
    gradient: 'from-blue-500 to-cyan-400',
    emoji: '🧀',
    link: '/category/dairy',
  },
  {
    id: 'fruits-fest',
    title: 'Fruit Fest 🍉',
    subtitle: 'Summer specials, limited stock',
    gradient: 'from-pink-500 to-rose-400',
    emoji: '🥭',
    link: '/category/fruits',
  },
];

const RECOMMENDED_TABS = [
  { id: 'top-pick', label: 'Top Picks', tag: 'top-pick' },
  { id: 'dairy', label: 'Dairy', category: 'dairy' },
  { id: 'vegetables', label: 'Vegetables', category: 'vegetables' },
  { id: 'fruits', label: 'Fruits', category: 'fruits' },
];

const GROUP_META: Record<string, { label: string; emoji: string; color: string }> = {
  replenishment: { label: 'Restock Soon', emoji: '🔄', color: '#FF9900' },
  basket_completion: { label: 'Complete Your Cart', emoji: '🛒', color: '#008296' },
  occasion: { label: 'Right Now Picks', emoji: '🎉', color: '#7C3AED' },
  discovery: { label: 'Discover Something New', emoji: '✨', color: '#059669' },
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [cartQuery, setCartQuery] = useState('');
  const [cartLoading, setCartLoading] = useState(false);
  const [zapMode, setZapMode] = useState(false);
  const [zapModalOpen, setZapModalOpen] = useState(false);
  const [zapProducts, setZapProducts] = useState<any[]>([]);
  const [zapSituation, setZapSituation] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { addToCart, profile, orderHistory, items } = useCartStore();
  const openSmartCart = useSmartCartFlow((s) => s.open);

  const tab = RECOMMENDED_TABS[activeTab];

  const cartProductIds = items.map((i) => i.product._id);

  // For You — personalised recommendations
  const { data: forYou, isLoading: forYouLoading, refetch: refetchForYou } = useQuery({
    queryKey: ['forYou', profile, orderHistory.length, cartProductIds.join(',')],
    queryFn: async () => {
      console.group('%c✨ AI For You — Grocery Recommendations', 'color: #7C3AED; font-weight: bold; font-size: 13px');
      console.log('%cProfile:', 'color: #888', `${profile.profession} | family:${profile.family_size} | ${profile.dietary_pref} | budget:${profile.budget_level}`);
      console.log('%cHistory entries:', 'color: #888', orderHistory.length);
      console.log('%cCart items:', 'color: #888', cartProductIds.length, cartProductIds);
      console.time('🕑 recommend_duration');

      try {
        const data = await aiRecommend({ profile, history: orderHistory, cartProductIds });
        console.log('%c✅ Recommendations received:', 'color: #28a745; font-weight: bold', data);
        console.log('%cOccasion detected:', 'color: #17a2b8', data.occasion_detected ?? 'none');
        console.log('%cBudget mode:', 'color: #17a2b8', data.budget_mode);
        console.log('%cPantry insight:', 'color: #856404', data.pantry_insight);
        if (data.groups?.length) {
          console.group('%c📊 Recommendation Groups', 'color: #6f42c1');
          data.groups.forEach((g) => {
            const emoji = { replenishment: '🔄', basket_completion: '🛒', occasion: '🎉', discovery: '✨' }[g.type] ?? '📦';
            console.group(`${emoji} [${g.type.toUpperCase()}] — priority ${g.priority}`);
            console.log('%cReason:', 'color: #888', g.reason);
            g.products?.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} — ₹${p.price} (${p.category})`));
            console.groupEnd();
          });
          console.groupEnd();
        }
        return data;
      } catch (err) {
        console.error('%c❌ Recommendation error:', 'color: #dc3545', err);
        throw err;
      } finally {
        console.timeEnd('🕑 recommend_duration');
        console.groupEnd();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 mins
    retry: false,
  });

  // For You placeholder — random top-pick products shown instantly while AI loads
  const { data: placeholderProducts } = useQuery({
    queryKey: ['forYouPlaceholder'],
    queryFn: () => fetchProducts({ tag: 'top-pick', limit: '8', sort: 'discount' }),
    staleTime: Infinity, // fetch once, never refetch
  });
  const { data: farmLoot } = useQuery({
    queryKey: ['farmLoot'],
    queryFn: () => fetchProducts({ tag: 'farm-loot', sort: 'discount', limit: '10' }),
  });

  // Recommended tab
  const { data: recommended } = useQuery({
    queryKey: ['recommended', activeTab],
    queryFn: () =>
      fetchProducts(
        tab.tag
          ? { tag: tab.tag, limit: '8' }
          : { category: tab.category!, limit: '8' }
      ),
  });

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice not supported in this browser'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setCartQuery(transcript);
      setIsListening(false);
      // Submit directly with the transcript — no DOM-click race
      handleCartBuilder(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleCartBuilder = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? cartQuery).trim();
    if (!q) return;

    // Basic sanity check — must not be gibberish or a single character
    if (q.length < 3) {
      toast.error('Please describe a situation (e.g., "my kid has a fever", "guests arriving")');
      return;
    }

    setCartLoading(true);
    console.group('%c🛒 AI Cart Builder', 'color: #FF9900; font-weight: bold; font-size: 13px');
    console.log('%cQuery:', 'color: #888', q);
    console.time('cart_duration');
    try {
      const data = await aiCartBuilder(q);
      console.log('%c✅ Cart built:', 'color: #28a745; font-weight: bold', data);
      console.log('%cSituation:', 'color: #17a2b8', data.situationName);
      if (data.missingItems?.length) {
        console.warn('%c⚠️ Missing from catalogue:', 'color: #ffc107', data.missingItems.join(', '));
      }
      data.products?.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} — ₹${p.price} (${p.category})`);
      });

      // AI service unavailable (rate limit / network) — distinct from invalid query
      if (data.error === 'ai_unavailable') {
        toast.error('AI is busy right now — please try again in a moment 🤖', { duration: 3500 });
        setCartLoading(false);
        console.timeEnd('cart_duration');
        console.groupEnd();
        return;
      }

      // Backend returns situationName: '' when query is invalid
      if (data.situationName === '' || !data.products || data.products.length === 0) {
        if (data.situationName === '') {
          toast.error('That doesn\'t look like a valid situation! Try "kid has fever" 🤒');
        } else {
          toast.error('Could not find items for this situation in our catalogue.');
        }
        setCartLoading(false);
        console.timeEnd('cart_duration');
        console.groupEnd();
        return;
      }

      if (zapMode) {
        // Zap mode: pick ONE product per item label (first variant), then instant order
        const labels = data.itemLabels ?? {};
        const seenLabels = new Set<string>();
        const zapPicks = data.products.filter((p) => {
          const label = labels[p._id] ?? p.category;
          if (seenLabels.has(label)) return false;
          seenLabels.add(label);
          return true;
        });
        zapPicks.forEach((p) => addToCart(p));
        setZapProducts(zapPicks);
        setZapSituation(data.situationName);
        setCartQuery('');
        setZapModalOpen(true);
      } else {
        // Normal mode: open Smart Cart Flow with all variants (SmartCartFlow adds to cart itself)
        openSmartCart(data.products, data.itemLabels ?? {}, q);
        setCartQuery('');
      }
    } catch (err) {
      console.error('%c❌ Cart building error:', 'color: #dc3545', err);
      toast.error('Could not build cart. Try again!');
    } finally {
      console.timeEnd('cart_duration');
      console.groupEnd();
      setCartLoading(false);
    }
  };

  return (
    <div className="page-content">
      {/* Hero promo banners */}
      <div className="overflow-x-auto no-scrollbar px-3 py-3">
        <div className="flex gap-3" style={{ width: 'max-content' }}>
          {PROMO_BANNERS.map((banner, i) => (
            <motion.div
              key={banner.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(banner.link)}
              className={`relative rounded-xl overflow-hidden bg-gradient-to-r ${banner.gradient} flex-shrink-0 cursor-pointer`}
              style={{ width: 280, height: 100 }}
            >
              <div className="absolute inset-0 p-4 flex flex-col justify-center">
                <p className="text-white font-bold text-base">{banner.title}</p>
                <p className="text-white/90 text-xs">{banner.subtitle}</p>
              </div>
              <div className="absolute right-4 bottom-2 text-5xl opacity-30">{banner.emoji}</div>
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/25 rounded-full p-1"
              >
                <ChevronRight size={14} className="text-white" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Category scroll */}
      <div className="px-3 mb-2">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Shop by Category</h2>
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 pb-1" style={{ width: 'max-content' }}>
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(`/category/${cat.id}`)}
                className="flex flex-col items-center gap-1.5 min-w-[60px]"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                  style={{ backgroundColor: cat.color + '20', border: `1.5px solid ${cat.color}30` }}
                >
                  {cat.icon}
                </div>
                <span className="text-[0.6rem] text-gray-600 font-medium text-center leading-tight w-14">
                  {cat.name}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Cart Builder */}
      <div className="mx-3 mb-4 rounded-xl overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={16} className="text-yellow-300" />
            <span className="text-white font-bold text-sm">AI Cart Builder</span>
          </div>

          {zapMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-yellow-400/20 border border-yellow-400/40 rounded-lg px-3 py-1.5 mb-2"
            >
              <p className="text-yellow-100 text-[0.65rem] leading-tight">
                ⚡ Zap mode ON — order goes straight to packing, pay on delivery
              </p>
            </motion.div>
          )}

          <div className="flex gap-2 items-center">
            <div className="flex-1 flex items-center gap-1 bg-white/20 rounded-full border border-white/20 px-3 py-1.5">
              <input
                value={cartQuery}
                onChange={(e) => setCartQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCartBuilder()}
                placeholder="e.g. kid has a fever, or make poha"
                className="flex-1 text-xs text-white placeholder-white/60 outline-none bg-transparent py-1"
              />
              <button
                onClick={handleVoice}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/15'
                  }`}
              >
                <Mic size={13} className="text-white" />
              </button>
            </div>
            <button
              id="cart-builder-go"
              onClick={handleCartBuilder}
              disabled={cartLoading}
              className="bg-[#FFD814] text-gray-900 text-sm font-bold px-5 py-2.5 rounded-full disabled:opacity-60 shrink-0"
            >
              {cartLoading ? '...' : 'Go!'}
            </button>
            <button
              onClick={() => setZapMode((z) => !z)}
              title={zapMode ? 'Disable Zap mode' : 'Enable Zap: instant order + pay later'}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all border ${zapMode
                ? 'bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-500/40'
                : 'bg-white/10 border-white/20'
                }`}
            >
              <Zap size={16} className={zapMode ? 'text-gray-900 fill-gray-900' : 'text-white/50'} />
            </button>
          </div>
        </div>
      </div>

      {/* Zap Order Modal */}
      <ZapOrderModal
        isOpen={zapModalOpen}
        onClose={() => setZapModalOpen(false)}
        products={zapProducts}
        situationName={zapSituation}
      />

      {/* ── FOR YOU — AI Recommendation Engine ─────────────────────────── */}
      <div className="px-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-purple-500" />
            <h2 className="text-sm font-bold text-gray-800">For You</h2>
          </div>
          <button
            onClick={() => refetchForYou()}
            className="flex items-center gap-1 text-[#008296] text-xs font-semibold"
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {/* Pantry insight bar */}
        {forYou?.pantry_insight && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
            <span className="text-base shrink-0">🧠</span>
            <p className="text-xs text-amber-800 leading-relaxed">{forYou.pantry_insight}</p>
          </div>
        )}

        {/* Occasion banner */}
        {forYou?.occasion_detected && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
            <span className="text-base">🎉</span>
            <p className="text-xs text-purple-800 font-medium capitalize">{forYou.occasion_detected.replace(/_/g, ' ')} picks curated for you</p>
          </div>
        )}

        {/* Loading state — show real products as placeholders with a "personalising" banner */}
        {forYouLoading && (
          <>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
              <p className="text-xs text-purple-600 font-semibold">Personalising your feed…</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(placeholderProducts?.products ?? []).slice(0, 8).map((product) => (
                <div key={product._id}>
                  <ProductCard product={product} />
                </div>
              ))}
              {/* Fallback grey skeletons if placeholder hasn't loaded yet */}
              {!placeholderProducts && [1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton rounded-xl" style={{ height: 220 }} />
              ))}
            </div>
          </>
        )}

        {!forYouLoading && (!forYou?.groups || forYou.groups.length === 0) && (
          <div className="bg-gray-50 rounded-xl p-5 text-center">
            <span className="text-4xl block mb-2">🛍️</span>
            <p className="text-gray-500 text-xs font-medium mb-1">No personalised picks yet</p>
            <p className="text-gray-400 text-xs">Set your profile to unlock AI recommendations</p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-3 text-xs text-white font-semibold bg-[#232F3E] px-4 py-2 rounded-full"
            >
              Go to Profile →
            </button>
          </div>
        )}

        {/* Unified 2-col grid — all groups merged */}
        {!forYouLoading && forYou?.groups && forYou.groups.length > 0 && (() => {
          // Build flat list with type metadata
          const allItems: Array<{ product: (typeof forYou.groups)[0]['products'][0]; type: string }> = [];
          forYou.groups
            .sort((a, b) => a.priority - b.priority)
            .forEach((g) => {
              g.products?.forEach((p) => allItems.push({ product: p, type: g.type }));
            });

          const BADGE: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
            replenishment: { label: 'Restock', emoji: '🔄', bg: 'bg-orange-100', text: 'text-orange-700' },
            basket_completion: { label: 'Add to Cart', emoji: '🛒', bg: 'bg-teal-100', text: 'text-teal-700' },
            occasion: { label: 'Right Now', emoji: '🎉', bg: 'bg-purple-100', text: 'text-purple-700' },
            discovery: { label: 'New for You', emoji: '✨', bg: 'bg-green-100', text: 'text-green-700' },
          };

          return (
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {allItems.map(({ product, type }, idx) => {
                const badge = BADGE[type] ?? { label: type, emoji: '📦', bg: 'bg-gray-100', text: 'text-gray-600' };
                return (
                  <div key={`${product._id}-${idx}`} className="relative">
                    <div className={`absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.55rem] font-bold ${badge.bg} ${badge.text} shadow-sm`}>
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                    </div>
                    <ProductCard product={product} />
                  </div>
                );
              })}
            </motion.div>
          );
        })()}
      </div>

      {/* Farm Loot */}
      {farmLoot && farmLoot.products.length > 0 && (
        <div className="px-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="steal-deal-badge">FARM LOOT</span>
              <h2 className="text-sm font-bold text-gray-800">Up to 69% OFF</h2>
            </div>
            <button
              onClick={() => navigate('/offers')}
              className="text-[#008296] text-xs font-semibold flex items-center gap-0.5"
            >
              See all <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {farmLoot.products.map((product) => (
                <div key={product._id} style={{ width: 150 }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommended */}
      <div className="px-3 mb-4">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Recommended</h2>
        {/* Tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {RECOMMENDED_TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(i)}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap transition-all border ${activeTab === i
                ? 'bg-[#232F3E] text-white border-[#232F3E]'
                : 'bg-white text-gray-600 border-gray-200'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-3">
          {recommended?.products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {recommended?.products.length === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton aspect-[3/4] rounded-lg" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
