import type { Product } from '../../types';

export interface CategoryGroup {
    label: string;       // LLM item name e.g. "Cake", "Balloons"
    products: Product[]; // All DB-resolved products for this item
    selected: boolean;   // true by default
}

export interface SwipeState {
    categoryIndex: number;
    productIndex: number;
    accepted: Map<string, Product>; // label → chosen Product
}

export type Phase = 'PHASE_1' | 'PHASE_2';
