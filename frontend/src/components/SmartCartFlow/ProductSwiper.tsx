import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryGroup, SwipeState } from './types';
import { SwipeCard } from './SwipeCard';
import { ProductImage } from '../ProductImage';
import type { Product } from '../../types';

interface Props {
    groups: CategoryGroup[]; // only selected ones
    onBack: () => void;
    onDone: (accepted: Map<string, Product>) => void;
}

export const ProductSwiper: React.FC<Props> = ({ groups, onBack, onDone }) => {
    const [swipeState, setSwipeState] = useState<SwipeState>({
        categoryIndex: 0,
        productIndex: 0,
        accepted: new Map(),
    });
    const [cardKey, setCardKey] = useState(0);
    const [finishing, setFinishing] = useState(false);

    const { categoryIndex, productIndex, accepted } = swipeState;
    const currentGroup = groups[categoryIndex];
    const totalGroups = groups.length;

    // Defensive guard — should never happen (checklist blocks 0 selected), but avoids a crash
    if (!currentGroup) return null;

    const products = currentGroup.products;
    const hasMultiple = products.length > 1;

    // Progress includes current position
    const progress = ((categoryIndex) / totalGroups) * 100;

    const advance = (newAccepted: Map<string, Product>) => {
        const nextIdx = categoryIndex + 1;
        if (nextIdx >= totalGroups) {
            setFinishing(true);
            setTimeout(() => onDone(newAccepted), 1000);
        } else {
            setSwipeState({ categoryIndex: nextIdx, productIndex: 0, accepted: newAccepted });
            setCardKey((k) => k + 1);
        }
    };

    const handleAccept = () => {
        const product = products[productIndex];
        const newAccepted = new Map(accepted);
        newAccepted.set(currentGroup.label, product);
        advance(newAccepted);
    };

    const handleSkip = () => advance(new Map(accepted));

    const handleNext = () => {
        const next = (productIndex + 1) % products.length;
        setSwipeState((s) => ({ ...s, productIndex: next }));
        setCardKey((k) => k + 1);
    };

    const handlePrev = () => {
        const prev = (productIndex - 1 + products.length) % products.length;
        setSwipeState((s) => ({ ...s, productIndex: prev }));
        setCardKey((k) => k + 1);
    };

    const jumpTo = (idx: number) => {
        if (idx === productIndex) return;
        setSwipeState((s) => ({ ...s, productIndex: idx }));
        setCardKey((k) => k + 1);
    };

    // ── Completion screen ──
    if (finishing) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 11 }}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-200"
                >
                    <CheckCircle size={48} className="text-white" />
                </motion.div>
                <div className="text-center">
                    <p className="text-xl font-black text-gray-900">All set! 🎉</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {accepted.size} {accepted.size === 1 ? 'item' : 'items'} added to your cart
                    </p>
                </div>
                {/* Mini preview of chosen items */}
                <div className="flex -space-x-2 mt-2">
                    {Array.from(accepted.values()).slice(0, 6).map((p) => (
                        <div key={p._id} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                            <ProductImage name={p.name} category={p.category} imageUrls={p.imageUrls} className="w-full h-full object-cover" alt={p.name} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Next option peeking behind (circular)
    const behindProduct = hasMultiple ? products[(productIndex + 1) % products.length] : null;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 font-medium active:text-gray-800">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h2 className="text-base font-black text-gray-900 capitalize">{currentGroup.label}</h2>
                    <div className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full">
                        {categoryIndex + 1} / {totalGroups}
                    </div>
                </div>
                {/* Segmented progress bar */}
                <div className="flex gap-1">
                    {groups.map((_, i) => (
                        <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-100">
                            <motion.div
                                className="h-full bg-indigo-600 rounded-full"
                                initial={false}
                                animate={{ width: i < categoryIndex ? '100%' : i === categoryIndex ? '40%' : '0%' }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Running cart tally */}
            {accepted.size > 0 && (
                <div className="px-4 mb-1">
                    <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <ShoppingCart size={12} />
                        {accepted.size} added so far
                    </div>
                </div>
            )}

            {/* Card stack area */}
            <div className="flex-1 flex flex-col justify-center px-5 py-2" style={{ minHeight: 360 }}>
                <div className="relative">
                    {/* Peek-behind next card */}
                    {behindProduct && (
                        <motion.div
                            key={`behind-${behindProduct._id}`}
                            initial={{ scale: 0.9, y: 24, opacity: 0.5 }}
                            animate={{ scale: 0.92, y: 18, opacity: 0.6 }}
                            className="absolute inset-x-0 top-0 z-0"
                        >
                            <div className="w-full bg-white rounded-3xl shadow-md overflow-hidden">
                                <div className="bg-gray-100 flex items-center justify-center" style={{ height: 220 }}>
                                    <ProductImage
                                        name={behindProduct.name}
                                        category={behindProduct.category}
                                        imageUrls={behindProduct.imageUrls}
                                        className="w-40 h-40 object-contain opacity-70"
                                        alt={behindProduct.name}
                                    />
                                </div>
                                <div className="px-5 py-4 h-[92px]" />
                            </div>
                        </motion.div>
                    )}

                    {/* Active draggable card */}
                    <div className="relative z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={cardKey}
                                initial={{ x: 280, opacity: 0, scale: 0.95 }}
                                animate={{ x: 0, opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                            >
                                <SwipeCard
                                    product={products[productIndex]}
                                    isFirst={categoryIndex === 0 && productIndex === 0}
                                    hasMultiple={hasMultiple}
                                    onAccept={handleAccept}
                                    onNext={handleNext}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Side navigation arrows (browse brand options) */}
                    {hasMultiple && (
                        <>
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={handlePrev}
                                className="absolute left-0 top-[110px] -translate-x-1 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-50"
                                aria-label="Previous option"
                            >
                                <ChevronLeft size={18} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={handleNext}
                                className="absolute right-0 top-[110px] translate-x-1 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-50"
                                aria-label="Next option"
                            >
                                <ChevronRight size={18} />
                            </motion.button>
                        </>
                    )}
                </div>

                {/* Tappable dot indicators */}
                {hasMultiple && (
                    <div className="flex justify-center items-center gap-1.5 mt-5">
                        {products.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => jumpTo(i)}
                                className={`rounded-full transition-all ${i === productIndex ? 'w-5 h-2 bg-indigo-600' : 'w-2 h-2 bg-gray-200'
                                    }`}
                            />
                        ))}
                        <span className="text-[0.65rem] text-gray-400 ml-2">{productIndex + 1}/{products.length}</span>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-6 pt-2 flex gap-3">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSkip}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-500 active:bg-gray-50 flex items-center justify-center gap-1.5"
                >
                    <X size={15} /> Skip
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAccept}
                    className="flex-[2] py-3.5 rounded-2xl bg-indigo-600 text-white text-sm font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    <CheckCircle size={16} /> Add this
                </motion.button>
            </div>
        </div>
    );
};
