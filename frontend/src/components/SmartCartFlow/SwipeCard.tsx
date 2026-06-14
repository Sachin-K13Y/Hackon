import React from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { Check, ChevronRight, Star } from 'lucide-react';
import type { Product } from '../../types';
import { ProductImage } from '../ProductImage';

interface Props {
    product: Product;
    isFirst: boolean;
    hasMultiple: boolean;
    onAccept: () => void;
    onNext: () => void;
}

const SWIPE_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 500;

export const SwipeCard: React.FC<Props> = ({ product, isFirst, hasMultiple, onAccept, onNext }) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-220, 220], [-14, 14]);

    // Overlay tints grow with drag distance
    const acceptOverlay = useTransform(x, [20, 140], [0, 0.85]);
    const nextOverlay = useTransform(x, [-20, -140], [0, 0.85]);
    const acceptBadge = useTransform(x, [40, 110], [0, 1]);
    const nextBadge = useTransform(x, [-40, -110], [0, 1]);
    // Slight shrink while dragging far
    const scale = useTransform(x, [-220, 0, 220], [0.96, 1, 0.96]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        const dx = info.offset.x;
        const vx = info.velocity.x;

        if (dx > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD) {
            animate(x, 600, { duration: 0.22, ease: 'easeIn' });
            setTimeout(onAccept, 180);
        } else if (hasMultiple && (dx < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD)) {
            animate(x, -600, { duration: 0.22, ease: 'easeIn' });
            setTimeout(onNext, 180);
        } else {
            animate(x, 0, { type: 'spring', stiffness: 420, damping: 30 });
        }
    };

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            style={{ x, rotate, scale }}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: 'grabbing' }}
            className="relative w-full bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab select-none"
        >
            {/* ACCEPT (green) overlay */}
            <motion.div
                style={{ opacity: acceptOverlay }}
                className="absolute inset-0 z-10 bg-green-500/90 flex items-center justify-center pointer-events-none"
            >
                <motion.div style={{ scale: acceptBadge }} className="flex flex-col items-center gap-2 text-white">
                    <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                        <Check size={36} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black">ADD</span>
                </motion.div>
            </motion.div>

            {/* NEXT (indigo) overlay */}
            <motion.div
                style={{ opacity: nextOverlay }}
                className="absolute inset-0 z-10 bg-indigo-500/90 flex items-center justify-center pointer-events-none"
            >
                <motion.div style={{ scale: nextBadge }} className="flex flex-col items-center gap-2 text-white">
                    <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                        <ChevronRight size={36} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-black">NEXT</span>
                </motion.div>
            </motion.div>

            {/* Discount ribbon */}
            {product.discountPercent > 0 && (
                <div className="absolute top-4 left-4 z-[5] bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                    {product.discountPercent}% OFF
                </div>
            )}

            {/* Rating chip */}
            {product.rating?.avg > 0 && (
                <div className="absolute top-4 right-4 z-[5] bg-white/90 backdrop-blur text-gray-800 text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-0.5">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {product.rating.avg.toFixed(1)}
                </div>
            )}

            {/* Product image */}
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center" style={{ height: 220 }}>
                <ProductImage
                    name={product.name}
                    category={product.category}
                    imageUrls={product.imageUrls}
                    className="w-44 h-44 object-contain drop-shadow-md"
                    alt={product.name}
                />
            </div>

            {/* Product info */}
            <div className="px-5 py-4">
                <p className="text-[0.7rem] font-bold text-indigo-500 uppercase tracking-wide">{product.brand}</p>
                <p className="text-base font-bold text-gray-900 leading-tight mt-0.5 line-clamp-2">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{product.unit}</p>

                <div className="flex items-baseline gap-2 mt-2.5">
                    <span className="text-2xl font-black text-gray-900">₹{product.price}</span>
                    {product.mrp > product.price && (
                        <span className="text-sm text-gray-400 line-through">₹{product.mrp}</span>
                    )}
                </div>

                {isFirst && (
                    <div className="mt-3 flex items-center justify-center gap-4 text-[0.7rem] text-gray-400">
                        {hasMultiple && <span>← swipe for more</span>}
                        <span className="text-green-600 font-semibold">swipe right to add →</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
