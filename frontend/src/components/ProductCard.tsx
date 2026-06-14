import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '../types';
import { AddButton } from './AddButton';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dealColors = {
    great: 'bg-green-500',
    good: 'bg-blue-500',
    avg: 'bg-gray-400',
  };

  return (
    <Link to={`/product/${product._id}`}>
      <motion.div
        className="card-shadow bg-white flex flex-col h-full"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15 }}
      >
        {/* Image container */}
        <div className="relative bg-gray-50 aspect-square overflow-hidden">
          <img
            src={`/images/products/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpg`}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = '1';
                img.src = product.imageUrls[0] || '';
              } else {
                img.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
              }
            }}
          />
          {/* Discount badge */}
          {product.discountPercent > 0 && (
            <span className="absolute top-1.5 left-1.5 discount-pill">
              {product.discountPercent}% OFF
            </span>
          )}
          {/* Deal score badge */}
          {product.dealScore === 'great' && (
            <span className={`absolute top-1.5 right-1.5 text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded ${dealColors[product.dealScore]}`}>
              🔥 Great
            </span>
          )}
          {/* Tags */}
          {product.tags.includes('farm-loot') && (
            <span className="absolute bottom-1.5 left-1.5 steal-deal-badge">Farm Loot</span>
          )}
          {product.tags.includes('steal-deal') && !product.tags.includes('farm-loot') && (
            <span className="absolute bottom-1.5 left-1.5 steal-deal-badge">Steal Deal</span>
          )}
        </div>

        {/* Info */}
        <div className="p-2 flex flex-col gap-1 flex-1">
          {/* Veg indicator */}
          <div className="flex items-center gap-1">
            <span className={`text-xs border px-1 rounded ${product.isVeg ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700'}`}>
              {product.isVeg ? '●' : '●'}
            </span>
            <span className="text-[0.65rem] text-gray-500 truncate">{product.brand}</span>
          </div>

          <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
          <p className="text-[0.65rem] text-gray-400">{product.unit}</p>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <span className="text-[0.6rem] bg-green-600 text-white px-1 py-0.5 rounded font-bold">
              ★ {product.rating.avg}
            </span>
            <span className="text-[0.6rem] text-gray-400">({product.rating.count})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 mt-auto">
            <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-[0.65rem] text-gray-400 line-through">₹{product.mrp}</span>
            )}
          </div>

          {/* Add button */}
          <div className="flex justify-end mt-1">
            <AddButton product={product} size="sm" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
