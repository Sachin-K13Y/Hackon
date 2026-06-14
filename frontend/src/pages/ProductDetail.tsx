import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Star, Leaf } from 'lucide-react';
import { fetchProduct } from '../api/client';
import { AddButton } from '../components/AddButton';
import { useCartStore } from '../store/cartStore';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [imageIdx, setImageIdx] = useState(0);
  const addToCart = useCartStore((s) => s.addToCart);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });

  if (isLoading || !product) {
    return (
      <div className="page-content">
        <div className="skeleton h-80 w-full" />
        <div className="p-4 space-y-3">
          <div className="skeleton h-6 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="skeleton h-10 w-1/3 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Back header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-3 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <span className="text-gray-900 font-semibold text-sm truncate flex-1">{product.name}</span>
      </div>

      {/* Image carousel */}
      <div className="relative bg-gray-50 aspect-square overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={imageIdx}
            src={imageIdx === 0 ? `/images/products/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpg` : product.imageUrls[imageIdx]}
            alt={product.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = '1';
                img.src = product.imageUrls[imageIdx] || product.imageUrls[0] || '';
              } else {
                img.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
              }
            }}
          />
        </AnimatePresence>

        {/* Discount badge */}
        {product.discountPercent > 0 && (
          <div className="absolute top-3 left-3 discount-pill text-sm px-3 py-1">
            {product.discountPercent}% OFF
          </div>
        )}

        {/* Veg indicator */}
        <div className={`absolute top-3 right-3 border-2 rounded px-1.5 py-0.5 text-xs font-bold ${product.isVeg ? 'border-green-600 text-green-700 bg-white' : 'border-red-600 text-red-700 bg-white'}`}>
          {product.isVeg ? '🟢 VEG' : '🔴 NON-VEG'}
        </div>

        {/* Deal score */}
        {product.dealScore === 'great' && (
          <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            🔥 Great Deal
          </div>
        )}

        {/* Carousel dots */}
        {product.imageUrls.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {product.imageUrls.map((_, i) => (
              <button
                key={i}
                onClick={() => setImageIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === imageIdx ? 'bg-[#FF9900] w-4' : 'bg-white/60'}`}
              />
            ))}
          </div>
        )}

        {/* Left/right arrows */}
        {product.imageUrls.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"
              onClick={() => setImageIdx(Math.max(0, imageIdx - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"
              onClick={() => setImageIdx(Math.min(product.imageUrls.length - 1, imageIdx + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Product info */}
      <div className="px-4 py-4 space-y-4">
        {/* Brand + name */}
        <div>
          <p className="text-xs text-[#008296] font-semibold uppercase tracking-wide">{product.brand}</p>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{product.unit}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm font-bold">
            <Star size={12} fill="white" />
            {product.rating.avg}
          </div>
          <span className="text-sm text-gray-500">{product.rating.count.toLocaleString()} ratings</span>
          {product.tags.includes('steal-deal') && <span className="steal-deal-badge">Steal Deal</span>}
          {product.tags.includes('farm-loot') && <span className="steal-deal-badge">Farm Loot</span>}
        </div>

        {/* Price */}
        <div className="bg-green-50 rounded-xl p-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-base text-gray-400 line-through">₹{product.mrp}</span>
            )}
            {product.discountPercent > 0 && (
              <span className="text-sm font-bold text-green-600">{product.discountPercent}% off</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ₹{(product.price / parseFloat(product.unit.replace(/[^0-9.]/g, '') || '1')).toFixed(1)}/
            {product.unit.replace(/[0-9.]/g, '').trim() || 'unit'} • Inclusive of all taxes
          </p>
        </div>

        {/* Highlights */}
        {product.highlights.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <Leaf size={14} className="text-green-600" /> Highlights
            </h3>
            <ul className="space-y-1">
              {product.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ingredients */}
        {product.ingredients && (
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Ingredients</h3>
            <p className="text-sm text-gray-600">{product.ingredients}</p>
          </div>
        )}

        {/* Expiry */}
        {product.expiryMonths > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>📅</span>
            <span>Best before: {product.expiryMonths} months from manufacture</span>
          </div>
        )}

        {/* Seller info */}
        <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          Sold by: <span className="font-medium text-gray-600">Amazon Seller Services Pvt. Ltd.</span>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 px-4 py-3 z-40">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-black text-lg text-gray-900">₹{product.price}</p>
          </div>
          <div className="flex-1">
            <AddButton product={product} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
