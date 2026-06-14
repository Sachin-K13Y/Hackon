import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShoppingBag, RefreshCw, Star, ChevronDown, Check } from 'lucide-react';
import { fetchProducts } from '../api/client';
import { useCartStore, type Profession, type DietaryPref, type BudgetLevel } from '../store/cartStore';
import { ProductCard } from '../components/ProductCard';
import toast from 'react-hot-toast';

const PROFESSIONS: { value: Profession; label: string; emoji: string }[] = [
  { value: 'student', label: 'Student', emoji: '🎓' },
  { value: 'software_engineer', label: 'Software Engineer', emoji: '💻' },
  { value: 'homemaker', label: 'Homemaker', emoji: '🏠' },
  { value: 'business_owner', label: 'Business Owner', emoji: '💼' },
  { value: 'doctor', label: 'Doctor', emoji: '🩺' },
  { value: 'teacher', label: 'Teacher', emoji: '📚' },
];

const DIETS: { value: DietaryPref; label: string; emoji: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
  { value: 'non-vegetarian', label: 'Non-Vegetarian', emoji: '🍗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
];

const BUDGETS: { value: BudgetLevel; label: string; emoji: string }[] = [
  { value: 'low', label: 'Budget', emoji: '💰' },
  { value: 'medium', label: 'Mid-Range', emoji: '💳' },
  { value: 'high', label: 'Premium', emoji: '🏆' },
];

const CAT_EMOJI: Record<string, string> = {
  dairy: '🥛', vegetables: '🥦', fruits: '🍎', staples: '🌾',
  snacks: '🍿', beverages: '☕', household: '🏠', personalcare: '🧴', icecream: '🍦',
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const { items, clearCart, addToCart, profile, updateProfile, seedDemoHistory, seedProfileHistory, orderHistory } = useCartStore();

  // Auto-seed history from profile template if empty
  useEffect(() => {
    if (orderHistory.length === 0) {
      seedProfileHistory(profile.profession);
    }
  }, []); // eslint-disable-line

  const { data: topPicks } = useQuery({
    queryKey: ['topPicks-profile'],
    queryFn: () => fetchProducts({ tag: 'top-pick', limit: '12' }),
  });

  const profLabel = PROFESSIONS.find((p) => p.value === profile.profession);
  const dietLabel = DIETS.find((d) => d.value === profile.dietary_pref);


  return (
    <div className="page-content bg-gray-50">
      {/* Profile header */}
      <div className="bg-[#232F3E] px-4 py-8 text-center">
        <div className="w-20 h-20 bg-[#FFD814] rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-4xl">{profLabel?.emoji ?? '👤'}</span>
        </div>
        <h1 className="text-white text-lg font-bold">{profLabel?.label ?? 'Guest User'}</h1>
        <p className="text-gray-400 text-sm">{dietLabel?.label} · Bengaluru</p>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-[#FFD814] font-black text-xl">{orderHistory.length}</p>
            <p className="text-gray-400 text-xs">Past Items</p>
          </div>
          <div className="text-center">
            <p className="text-[#FFD814] font-black text-xl">{profile.family_size}</p>
            <p className="text-gray-400 text-xs">Family Size</p>
          </div>
          <div className="text-center">
            <p className="text-[#FFD814] font-black text-xl capitalize">{profile.budget_level}</p>
            <p className="text-gray-400 text-xs">Budget</p>
          </div>
        </div>
        <button
          onClick={() => setShowProfileEditor(!showProfileEditor)}
          className="mt-4 flex items-center gap-1 mx-auto text-xs text-[#FFD814] font-semibold"
        >
          Edit Profile <ChevronDown size={12} className={`transition-transform ${showProfileEditor ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Profile Editor */}
      <AnimatePresence>
        {showProfileEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-5 space-y-5">
              {/* Profession */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Profession</p>
                <div className="grid grid-cols-3 gap-2">
                  {PROFESSIONS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => updateProfile({ profession: p.value })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${profile.profession === p.value
                          ? 'bg-[#232F3E] text-white border-[#232F3E]'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                    >
                      <span className="text-xl">{p.emoji}</span>
                      <span className="leading-tight text-center" style={{ fontSize: '0.6rem' }}>{p.label}</span>
                      {profile.profession === p.value && <Check size={10} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Family Size */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Family Size: {profile.family_size} people</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => updateProfile({ family_size: n, adults: Math.min(n, profile.adults), children: Math.max(0, n - profile.adults) })}
                      className={`w-9 h-9 rounded-full text-sm font-bold border transition-all ${profile.family_size === n
                          ? 'bg-[#FF9900] text-white border-[#FF9900]'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {profile.family_size > 1 && (
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-xs text-gray-500">Kids:</p>
                    {[0, 1, 2, 3].filter((n) => n <= profile.family_size - 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => updateProfile({ children: n, adults: profile.family_size - n })}
                        className={`w-8 h-8 rounded-full text-xs font-bold border transition-all ${profile.children === n
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Diet */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Diet Preference</p>
                <div className="flex gap-2">
                  {DIETS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => updateProfile({ dietary_pref: d.value })}
                      className={`flex-1 py-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${profile.dietary_pref === d.value
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                    >
                      <span>{d.emoji}</span>
                      <span style={{ fontSize: '0.6rem' }}>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2">Budget Level</p>
                <div className="flex gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => updateProfile({ budget_level: b.value })}
                      className={`flex-1 py-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${profile.budget_level === b.value
                          ? 'bg-[#232F3E] text-white border-[#232F3E]'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                    >
                      <span>{b.emoji}</span>
                      <span style={{ fontSize: '0.6rem' }}>{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { setShowProfileEditor(false); toast.success('Profile saved! 🎉 Recommendations will update.'); }}
                className="w-full bg-[#FFD814] text-gray-900 text-sm font-bold py-2.5 rounded-xl"
              >
                Save Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo mode card */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star size={16} className="text-yellow-300" />
          <span className="text-white font-bold text-sm">Judge Demo Mode</span>
        </div>
        <p className="text-white/80 text-xs mb-3">Pre-fill cart with 5 items + reset history from your profile</p>
        <button
          onClick={() => {
            clearCart();
            if (topPicks?.products) {
              topPicks.products.slice(0, 5).forEach((p) => addToCart(p));
            }
            seedProfileHistory(profile.profession);
            toast.success('🎬 Demo cart + history loaded!', { duration: 3000 });
            navigate('/cart');
          }}
          className="bg-[#FFD814] text-gray-900 text-sm font-bold px-6 py-2 rounded-full flex items-center gap-2"
        >
          <RefreshCw size={14} /> Reset & Load Demo Cart
        </button>
      </div>

      {/* Past orders */}
      <div className="bg-white mt-4 border-y border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-[#FF9900]" />
            <h2 className="text-sm font-bold text-gray-900">Purchase History</h2>
          </div>
          <span className="text-xs text-gray-400">{orderHistory.length} items · last 15 days</span>
        </div>
        {orderHistory.length > 0 ? (
          <div className="space-y-2">
            {orderHistory.slice(0, 8).map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                  {CAT_EMOJI[h.category] ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-1">{h.product_name}</p>
                  <p className="text-[0.65rem] text-gray-400">
                    {h.days_ago === 0 ? 'Today' : `${h.days_ago}d ago`} · qty {h.quantity}
                  </p>
                </div>
                <span className="text-[0.6rem] text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                  {h.category}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 text-xs">No order history yet.</p>
            <p className="text-gray-300 text-xs mt-1">Tap "Demo Mode" above to seed history!</p>
          </div>
        )}
      </div>

      {/* Frequently bought */}
      {topPicks && (
        <div className="bg-white mt-2 border-y border-gray-100 px-4 py-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">✨ Frequently Reordered</h2>
          <div className="grid grid-cols-2 gap-3">
            {topPicks.products.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
