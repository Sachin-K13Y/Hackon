import React from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import type { Product } from '../types';

interface AddButtonProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
}

export const AddButton: React.FC<AddButtonProps> = ({ product, size = 'md' }) => {
  const { items, addToCart, updateQty } = useCartStore();
  const cartItem = items.find((i) => i.product._id === product._id);
  const qty = cartItem?.quantity || 0;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  if (!product.inStock) {
    return (
      <span className="text-xs text-gray-400 font-medium px-3 py-1.5 border border-gray-200 rounded-full">
        Out of stock
      </span>
    );
  }

  if (qty === 0) {
    return (
      <motion.button
        whileTap={{ scale: 0.93 }}
        className={`add-btn ${sizeClasses[size]}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addToCart(product);
        }}
      >
        Add
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className={`qty-control ${sizeClasses[size]}`}
    >
      <button
        className="w-5 h-5 flex items-center justify-center font-bold text-base leading-none"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updateQty(product._id, qty - 1);
        }}
      >
        −
      </button>
      <span className="font-bold min-w-[1.2ch] text-center text-sm">{qty}</span>
      <button
        className="w-5 h-5 flex items-center justify-center font-bold text-base leading-none"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addToCart(product);
        }}
      >
        +
      </button>
    </motion.div>
  );
};
