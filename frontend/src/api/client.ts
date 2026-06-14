import axios from 'axios';
import type { Product, Order } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
});

// Products
export const fetchProducts = async (params?: Record<string, string | number>): Promise<{ products: Product[]; total: number }> => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const fetchProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get(`/products/${id}`);
  return data.product;
};

export const searchProducts = async (q: string): Promise<{ products: Product[] }> => {
  const { data } = await api.get('/products/search', { params: { q } });
  return data;
};

// Orders
export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  const { data } = await api.post('/orders', orderData);
  return data.order;
};

export const fetchOrder = async (id: string): Promise<Order> => {
  const { data } = await api.get(`/orders/${id}`);
  return data.order;
};

// AI
export const aiSearch = async (query: string): Promise<{ products: Product[] }> => {
  const { data } = await api.post('/ai/search', { query });
  return data;
};

export const aiSuggest = async (cartProductIds: string[], subtotal = 0): Promise<{ products: Product[]; reasons?: string[] }> => {
  const { data } = await api.post('/ai/suggest', { cartProductIds, subtotal });
  return data;
};

export const aiCartBuilder = async (query: string): Promise<{ products: Product[]; situationName: string; missingItems?: string[]; itemLabels?: Record<string, string>; error?: string | null }> => {
  const { data } = await api.post('/ai/build-cart', { query });
  return data;
};

export const aiReorder = async (productIds: string[]): Promise<{ products: Product[] }> => {
  const { data } = await api.post('/ai/reorder', { productIds });
  return data;
};

export interface RecommendGroup {
  type: 'replenishment' | 'basket_completion' | 'discovery' | 'occasion';
  reason: string;
  priority: number;
  products: Product[];
}

export const aiRecommend = async (payload: {
  profile: object;
  history: object[];
  cartProductIds: string[];
  upcomingFestival?: string | null;
}): Promise<{
  groups: RecommendGroup[];
  pantry_insight: string;
  occasion_detected: string | null;
  budget_mode: boolean;
  replenishment_urgency: Record<string, number>;
}> => {
  const { data } = await api.post('/ai/recommend', payload, { timeout: 30000 });
  return data;
};
