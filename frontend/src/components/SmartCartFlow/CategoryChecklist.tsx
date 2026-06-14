import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { CategoryGroup } from './types';
import { ProductImage } from '../ProductImage';

interface Props {
    groups: CategoryGroup[];
    query: string;
    onToggle: (label: string) => void;
    onContinue: () => void;
    onClose: () => void;
}

export const CategoryChecklist: React.FC<Props> = ({ groups, query, onToggle, onContinue, onClose }) => {
    const selectedCount = groups.filter((g) => g.selected).length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                <div>
                    <h2 className="text-lg font-black text-gray-900">What do you need?</h2>
                    <p className="text-xs text-gray-400 mt-0.5">For: {query}</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                    <X size={16} className="text-gray-500" />
                </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto py-2">
                {groups.map((group) => (
                    <motion.button
                        key={group.label}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onToggle(group.label)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 active:bg-gray-50 transition-colors text-left"
                    >
                        {/* Checkbox */}
                        <motion.div
                            whileTap={{ scale: 0.85 }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all border-2 ${group.selected
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'border-gray-300 bg-white'
                                }`}
                        >
                            {group.selected && (
                                <motion.svg
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                                >
                                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </motion.svg>
                            )}
                        </motion.div>

                        {/* Label + count */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 capitalize">{group.label}</p>
                            <p className="text-xs text-gray-400">
                                {group.products.length === 1 ? '1 option' : `${group.products.length} options`}
                            </p>
                        </div>

                        {/* Product image thumbnails (max 3, overlapping) */}
                        <div className="flex -space-x-2 shrink-0">
                            {group.products.slice(0, 3).map((p, i) => (
                                <div
                                    key={p._id}
                                    className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gray-100"
                                    style={{ zIndex: 3 - i }}
                                >
                                    <ProductImage
                                        name={p.name}
                                        category={p.category}
                                        imageUrls={p.imageUrls}
                                        className="w-full h-full object-cover"
                                        alt={p.name}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Footer */}
            <div className="px-5 pt-3 pb-5 border-t border-gray-100">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onContinue}
                    disabled={selectedCount === 0}
                    className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all ${selectedCount === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        }`}
                >
                    Continue with {selectedCount} {selectedCount === 1 ? 'category' : 'categories'} →
                </motion.button>
            </div>
        </div>
    );
};
