import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { fetchProducts } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES } from '../types';

const SORT_OPTIONS = [
  { value: 'discount', label: 'Best Discount' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const FILTER_CHIPS = [
  { label: '≥20% off', filter: { minDiscount: 20 } },
  { label: '≥40% off', filter: { minDiscount: 40 } },
  { label: '4★ & above', filter: { minRating: 4 } },
  { label: 'In Stock', filter: { inStock: 'true' } },
];

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [sort, setSort] = useState('discount');
  const [filters, setFilters] = useState<Record<string, string | number>>({});
  const [showSort, setShowSort] = useState(false);

  const category = CATEGORIES.find((c) => c.id === slug);

  const { data, isLoading } = useQuery({
    queryKey: ['category', slug, sort, filters],
    queryFn: () => fetchProducts({ category: slug!, sort, limit: '60', ...filters }),
    enabled: !!slug,
  });

  const toggleFilter = (filter: Record<string, string | number>) => {
    const key = Object.keys(filter)[0];
    if (filters[key] !== undefined) {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, ...filter });
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#232F3E] px-3 py-3 flex items-center gap-3 shadow">
        <button onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{category?.icon}</span>
          <h1 className="text-white font-bold text-base">{category?.name || slug}</h1>
        </div>
        <button onClick={() => setShowSort(true)} className="text-white flex items-center gap-1">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-100 bg-white">
        {FILTER_CHIPS.map((chip) => {
          const key = Object.keys(chip.filter)[0];
          const active = filters[key] !== undefined;
          return (
            <button
              key={chip.label}
              onClick={() => toggleFilter(chip.filter as Record<string, string | number>)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border font-medium transition-all ${
                active ? 'bg-[#232F3E] text-white border-[#232F3E]' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Product count */}
      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
        {data ? `${data.total} products` : 'Loading…'}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 px-3 py-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-3 py-3">
          {data?.products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Sort bottom sheet */}
      <AnimatePresence>
        {showSort && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowSort(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-2xl z-50 p-4"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-3">Sort by</h3>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setShowSort(false); }}
                  className={`w-full text-left py-3 border-b border-gray-100 text-sm flex items-center justify-between ${
                    sort === opt.value ? 'font-bold text-[#FF9900]' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                  {sort === opt.value && <span className="text-[#FF9900]">✓</span>}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
