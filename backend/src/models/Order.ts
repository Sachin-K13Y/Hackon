import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 'confirmed' | 'packed' | 'picked' | 'on_the_way' | 'delivered';

export interface IOrderItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  mrp: number;
  quantity: number;
  unit: string;
}

export interface IOrder extends Document {
  items: IOrderItem[];
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
  status: OrderStatus;
  estimatedDeliveryAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    items: [
      {
        productId: String,
        name: String,
        imageUrl: String,
        price: Number,
        mrp: Number,
        quantity: Number,
        unit: String,
      },
    ],
    address: {
      name: { type: String, default: 'Guest User' },
      line1: { type: String, default: '123, MG Road' },
      line2: String,
      city: { type: String, default: 'Bengaluru' },
      pincode: { type: String, default: '560001' },
    },
    payment: {
      method: { type: String, enum: ['upi', 'card', 'cod', 'amazon-pay'], default: 'upi' },
      usePayBalance: { type: Boolean, default: false },
      payBalanceAmount: { type: Number, default: 0 },
    },
    subtotal: { type: Number, required: true },
    mrpTotal: { type: Number, required: true },
    handlingFee: { type: Number, default: 9 },
    totalSavings: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['confirmed', 'packed', 'picked', 'on_the_way', 'delivered'],
      default: 'confirmed',
    },
    estimatedDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
