import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, Smartphone, Banknote, Check } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { createOrder } from '../api/client';
import toast from 'react-hot-toast';
import { ProductImage } from '../components/ProductImage';
import { SwipeToConfirm } from '../components/SwipeToConfirm';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'PhonePe, GPay, Paytm, etc.' },
  { id: 'amazon-pay', label: 'Amazon Pay', icon: CreditCard, desc: 'Use wallet or saved cards' },
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when order arrives' },
];

const ADDRESSES = [
  { id: 'home', label: 'Home', line1: '123, MG Road', city: 'Bengaluru', pincode: '560001', name: 'Guest User' },
  { id: 'work', label: 'Work', line1: '456, Koramangala', city: 'Bengaluru', pincode: '560034', name: 'Guest User' },
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, mrpTotal, savings, clearCart } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [isPlacing, setIsPlacing] = useState(false);

  const sub = subtotal();
  const handlingFee = 9;
  const finalAmount = sub + handlingFee;

  const handlePlaceOrder = async () => {
    if (items.length === 0) { toast.error('Cart is empty!'); return; }
    setIsPlacing(true);
    try {
      const orderData = {
        items: items.map((i) => ({
          productId: i.product._id,
          name: i.product.name,
          imageUrl: i.product.imageUrls[0],
          price: i.product.price,
          mrp: i.product.mrp,
          quantity: i.quantity,
          unit: i.product.unit,
        })),
        address: selectedAddress,
        payment: { method: paymentMethod as any, usePayBalance: false, payBalanceAmount: 0 },
        subtotal: sub,
        mrpTotal: mrpTotal(),
        handlingFee,
        totalSavings: savings(),
        finalAmount,
      };
      const order = await createOrder(orderData as any);
      clearCart();
      navigate(`/order/${order._id}`);
    } catch (err) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="page-content bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#232F3E] px-3 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white"><ArrowLeft size={20} /></button>
        <h1 className="text-white font-bold">Checkout</h1>
      </div>

      {/* Delivery address */}
      <div className="bg-white mt-2 border-y border-gray-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-[#FF9900]" />
          <h2 className="text-sm font-bold text-gray-900">Delivery Address</h2>
        </div>
        <div className="space-y-2">
          {ADDRESSES.map((addr) => (
            <motion.div
              key={addr.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAddress(addr)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress.id === addr.id ? 'border-[#FF9900] bg-orange-50' : 'border-gray-200 bg-white'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddress.id === addr.id ? 'border-[#FF9900]' : 'border-gray-300'
                    }`}>
                    {selectedAddress.id === addr.id && <div className="w-2 h-2 rounded-full bg-[#FF9900]" />}
                  </div>
                  <span className="text-xs font-bold text-gray-700 uppercase">{addr.label}</span>
                </div>
              </div>
              <p className="text-sm text-gray-800 mt-1 ml-6">{addr.line1}</p>
              <p className="text-xs text-gray-500 ml-6">{addr.city} — {addr.pincode}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white mt-2 border-y border-gray-100 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={16} className="text-[#FF9900]" />
          <h2 className="text-sm font-bold text-gray-900">Payment Method</h2>
        </div>
        <div className="space-y-2">
          {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
            <motion.div
              key={id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPaymentMethod(id)}
              className={`p-3 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${paymentMethod === id ? 'border-[#FF9900] bg-orange-50' : 'border-gray-200'
                }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === id ? 'border-[#FF9900]' : 'border-gray-300'
                }`}>
                {paymentMethod === id && <div className="w-2 h-2 rounded-full bg-[#FF9900]" />}
              </div>
              <Icon size={18} className={paymentMethod === id ? 'text-[#FF9900]' : 'text-gray-400'} />
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white mt-2 border-y border-gray-100 px-4 py-4 mb-28">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Order Summary</h2>
        {items.slice(0, 3).map(({ product, quantity }) => (
          <div key={product._id} className="flex items-center gap-2 py-1.5 border-b border-gray-50">
            <ProductImage
              name={product.name}
              category={product.category}
              imageUrls={product.imageUrls}
              className="w-10 h-10 rounded-lg object-cover bg-gray-100"
              alt={product.name}
            />
            <p className="text-xs text-gray-700 flex-1 truncate">{product.name} × {quantity}</p>
            <p className="text-xs font-bold">₹{(product.price * quantity).toFixed(0)}</p>
          </div>
        ))}
        {items.length > 3 && <p className="text-xs text-gray-400 mt-1">+{items.length - 3} more items</p>}

        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{sub.toFixed(0)}</span></div>
          <div className="flex justify-between text-green-600"><span>Savings</span><span>−₹{savings().toFixed(0)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Handling fee</span><span>₹{handlingFee}</span></div>
          <div className="flex justify-between font-bold border-t border-gray-100 pt-2 mt-2">
            <span>Total</span><span>₹{finalAmount.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Place order — swipe */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 px-4 pt-3 pb-4 z-40">
        {!isPlacing ? (
          <SwipeToConfirm
            label="Swipe to Place Order"
            amount={finalAmount}
            variant="gradient"
            onConfirmed={handlePlaceOrder}
          />
        ) : (
          <div className="flex items-center justify-center gap-2 py-4 text-gray-500">
            <span className="animate-spin text-lg">⏳</span>
            <span className="text-sm font-semibold">Placing Order…</span>
          </div>
        )}
        <p className="text-[0.6rem] text-gray-400 text-center mt-2">By placing this order you agree to our Terms & Conditions</p>
      </div>
    </div>
  );
};
