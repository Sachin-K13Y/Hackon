import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import type { CategoryGroup, Phase } from './types';
import { CategoryChecklist } from './CategoryChecklist';
import { ProductSwiper } from './ProductSwiper';
import { useCartStore } from '../../store/cartStore';

interface Props {
    isOpen: boolean;
    products: Product[];
    itemLabels: Record<string, string>; // productId → LLM item name
    query: string;
    onClose: () => void;
}

export const SmartCartFlow: React.FC<Props> = ({ isOpen, products, itemLabels, query, onClose }) => {
    const navigate = useNavigate();
    const addToCart = useCartStore((s) => s.addToCart);

    // Build category groups from products + itemLabels
    // Group by LLM label; if no label, fall back to product.category
    const buildGroups = (): CategoryGroup[] => {
        const labelMap = new Map<string, Product[]>();
        for (const product of products) {
            const label = itemLabels[product._id] ?? product.category;
            const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
            if (!labelMap.has(capitalized)) labelMap.set(capitalized, []);
            labelMap.get(capitalized)!.push(product);
        }
        return Array.from(labelMap.entries()).map(([label, prods]) => ({
            label,
            products: prods,
            selected: true,
        }));
    };

    const [phase, setPhase] = useState<Phase>('PHASE_1');
    const [groups, setGroups] = useState<CategoryGroup[]>(() => buildGroups());
    const [phase1Groups, setPhase1Groups] = useState<CategoryGroup[]>(() => buildGroups());

    // Signature of the current product set — rebuild when it changes (not just length)
    const productSig = products.map((p) => p._id).join(',');

    // Re-initialize whenever the sheet opens with a new product set
    React.useEffect(() => {
        if (isOpen) {
            const g = buildGroups();
            setGroups(g);
            setPhase1Groups(g);
            setPhase('PHASE_1');
        }
    }, [isOpen, productSig]);

    const handleToggle = (label: string) => {
        setGroups((prev) =>
            prev.map((g) => (g.label === label ? { ...g, selected: !g.selected } : g))
        );
    };

    const handleContinue = () => {
        setPhase1Groups(groups); // save phase 1 state for back navigation
        setPhase('PHASE_2');
    };

    const handleBack = () => {
        setGroups(phase1Groups); // restore previous checkbox state
        setPhase('PHASE_1');
    };

    const handleDone = (accepted: Map<string, Product>) => {
        accepted.forEach((product) => addToCart(product));
        onClose();
        navigate('/cart');
    };

    const selectedGroups = groups.filter((g) => g.selected);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — tap to close only in Phase 1 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[300]"
                        onClick={phase === 'PHASE_1' ? onClose : undefined}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[301] bg-white rounded-t-3xl overflow-hidden"
                        style={{ height: '85vh' }}
                    >
                        {/* Drag handle */}
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1" />

                        <AnimatePresence mode="wait">
                            {phase === 'PHASE_1' ? (
                                <motion.div
                                    key="phase1"
                                    initial={{ x: 60, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -60, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full flex flex-col"
                                    style={{ height: 'calc(85vh - 20px)' }}
                                >
                                    <CategoryChecklist
                                        groups={groups}
                                        query={query}
                                        onToggle={handleToggle}
                                        onContinue={handleContinue}
                                        onClose={onClose}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="phase2"
                                    initial={{ x: 60, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -60, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full flex flex-col"
                                    style={{ height: 'calc(85vh - 20px)' }}
                                >
                                    <ProductSwiper
                                        groups={selectedGroups}
                                        onBack={handleBack}
                                        onDone={handleDone}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
