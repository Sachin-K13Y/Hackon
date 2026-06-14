import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import { fetchProducts } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { CATEGORIES } from '../types';

export const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: farmLoot } = useQuery({
    queryKey: ['farmLoot-offers'],
    queryFn: () => fetchProducts({ tag: 'farm-loot', sort: 'discount', limit: '50' }),
  });
  const { data: stealDeals } = useQuery({
    queryKey: ['stealDeals-offers'],
    queryFn: () => fetchProducts({ tag: 'steal-deal', sort: 'discount', limit: '50' }),
  });

  return (
    <div className="page-content bg-gray-50">
      {/* Header */}
      <div className="bg-[#232F3E] px-4 py-4 flex items-center gap-2">
        <Tag size={18} className="text-[#FFD814]" />
        <h1 className="text-white font-bold">Offers & Deals</h1>
      </div>

      {/* Category deals */}
      <div className="px-4 py-3">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Shop by Category</h2>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="flex flex-col items-center gap-1.5 bg-white rounded-xl py-3 px-2 shadow-sm border border-gray-100"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-[0.6rem] text-gray-600 font-medium text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Farm Loot */}
      {farmLoot && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="steal-deal-badge">FARM LOOT</span>
            <h2 className="text-sm font-bold text-gray-800">Up to 69% OFF 🔥</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {farmLoot.products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Steal Deals */}
      {stealDeals && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="steal-deal-badge">STEAL DEAL</span>
            <h2 className="text-sm font-bold text-gray-800">Best Prices</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stealDeals.products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
