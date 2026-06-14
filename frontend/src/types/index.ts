export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  imageUrls: string[];
  mrp: number;
  price: number;
  discountPercent: number;
  unit: string;
  rating: { avg: number; count: number };
  tags: Array<'steal-deal' | 'farm-loot' | 'top-pick'>;
  highlights: string[];
  ingredients: string;
  expiryMonths: number;
  isVeg: boolean;
  inStock: boolean;
  dealScore: 'great' | 'good' | 'avg';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  _id: string;
  items: Array<{
    productId: string;
    name: string;
    imageUrl: string;
    price: number;
    mrp: number;
    quantity: number;
    unit: string;
  }>;
  address: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    pincode: string;
  };
  payment: {
    method: 'upi' | 'card' | 'cod' | 'amazon-pay';
    usePayBalance: boolean;
    payBalanceAmount: number;
  };
  subtotal: number;
  mrpTotal: number;
  handlingFee: number;
  totalSavings: number;
  finalAmount: number;
  status: 'confirmed' | 'packed' | 'picked' | 'on_the_way' | 'delivered';
  estimatedDeliveryAt: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'vegetables', name: 'Vegetables', icon: '🥦', color: '#4CAF50' },
  { id: 'fruits', name: 'Fruits', icon: '🍎', color: '#FF5722' },
  { id: 'dairy', name: 'Dairy & Eggs', icon: '🥛', color: '#2196F3' },
  { id: 'snacks', name: 'Snacks', icon: '🍿', color: '#FF9800' },
  { id: 'beverages', name: 'Beverages', icon: '🧃', color: '#9C27B0' },
  { id: 'staples', name: 'Staples', icon: '🌾', color: '#795548' },
  { id: 'personalcare', name: 'Personal Care', icon: '🧴', color: '#E91E63' },
  { id: 'icecream', name: 'Ice Cream', icon: '🍦', color: '#00BCD4' },
  { id: 'household', name: 'Household', icon: '🧹', color: '#607D8B' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', color: '#F44336' },
];
