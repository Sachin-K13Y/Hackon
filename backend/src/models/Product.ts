import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
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

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    brand: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: '' },
    imageUrls: [{ type: String }],
    mrp: { type: Number, required: true },
    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    unit: { type: String, default: '1 pc' },
    rating: {
      avg: { type: Number, default: 4.0 },
      count: { type: Number, default: 0 },
    },
    tags: [{ type: String, enum: ['steal-deal', 'farm-loot', 'top-pick'] }],
    highlights: [{ type: String }],
    ingredients: { type: String, default: '' },
    expiryMonths: { type: Number, default: 6 },
    isVeg: { type: Boolean, default: true },
    inStock: { type: Boolean, default: true },
    dealScore: { type: String, enum: ['great', 'good', 'avg'], default: 'avg' },
  },
  { timestamps: true }
);

// Text search index
ProductSchema.index({ 
  name: 'text', 
  brand: 'text', 
  tags: 'text',
  category: 'text',
  subcategory: 'text',
  highlights: 'text',
  ingredients: 'text'
});

export default mongoose.model<IProduct>('Product', ProductSchema);
