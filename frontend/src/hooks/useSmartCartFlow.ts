import { create } from 'zustand';
import type { Product } from '../types';

interface SmartCartFlowStore {
    isOpen: boolean;
    products: Product[];
    itemLabels: Record<string, string>;
    query: string;
    open: (products: Product[], itemLabels: Record<string, string>, query: string) => void;
    close: () => void;
}

export const useSmartCartFlow = create<SmartCartFlowStore>((set) => ({
    isOpen: false,
    products: [],
    itemLabels: {},
    query: '',
    open: (products, itemLabels, query) => set({ isOpen: true, products, itemLabels, query }),
    close: () => set({ isOpen: false, products: [], itemLabels: {}, query: '' }),
}));
