import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle, ArrowRight, Minus, Plus, Trash2, Zap } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { aiSuggest, createOrder } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';
import { useZapOrder } from '../hooks/useZapOrder';
import toast from 'react-hot-toast';

// ── Confirm bar — single button ───────────────────────────────────────────────
const ConfirmBar: React.FC<{ finalAmount: number; onProceed: () => void }> = ({ finalAmount, onProceed }) => {
  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white border-t border-gray-200 px-4 py-3">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onProceed}
        className="w-full bg-[#232F3E] text-white py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2"
      >
        <CheckCircle size={18} />
        Confirm — ₹{finalAmount.toFixed(0)}
      </motion.button>
    </div>
  );
};

// ── Fast Zap order bar — shown when user came from Zap "Edit Cart" ─────────────
const ZapConfirmBar: React.FC<{ finalAmount: number; placing: boolean; onZapOrder: () => void; onNormal: () => void }> = ({
  finalAmount, placing, onZapOrder, onNormal,
}) => {
  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white border-t border-gray-200 px-4 py-3 space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Zap size={12} className="text-orange-500 fill-orange-500" />
        <p className="text-[0.7rem] text-gray-500">Zap order ready — pay on delivery</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onNormal}
          className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3.5 rounded-xl"
        >
          Pay Now
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onZapOrder}
          disabled={placing}
          className="flex-[2] bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-black py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-70"
        >
          {placing ? (
            <><span className="animate-spin">⏳</span> Placing…</>
          ) : (
            <><Zap size={16} className="fill-white" /> Place Zap Order — ₹{finalAmount.toFixed(0)}</>
          )}
        </motion.button>
      </div>
    </div>
  );
};

const HANDLING_FEE = 9;
const FREE_DELIVERY_THRESHOLD = 199;

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQty, removeFromCart, subtotal, mrpTotal, savings, totalItems, clearCart } = useCartStore();
  const { pending: zapPending, clear: clearZap } = useZapOrder();
  const [zapPlacing, setZapPlacing] = React.useState(false);
  const sub = subtotal();
  const mrp = mrpTotal();
  const saved = savings();
  const total = totalItems();

  const cartProductIds = items.map((i) => i.product._id);

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', cartProductIds.join(',')],
    queryFn: async () => {
      console.group('%c🛒 AI Cart Suggest', 'color: #FF9900; font-weight: bold; font-size: 13px');
      console.log('%cCart product IDs:', 'color: #888', cartProductIds);
      console.log('%cCart subtotal:', 'color: #888', `₹${sub}`);
      console.time('suggest_duration');
      const data = await aiSuggest(cartProductIds, sub);
      console.log('%c✅ Suggestions received:', 'color: #28a745; font-weight: bold', data);
      data.products?.forEach((p: any, i: number) => {
        const reason = data.reasons?.[i] ?? 'no reason given';
        console.log(`  ${i + 1}. ${p.name} — ₹${p.price} | Reason: ${reason}`);
      });
      console.timeEnd('suggest_duration');
      console.groupEnd();
      return data;
    },
    enabled: cartProductIds.length > 0,
    staleTime: 30000,
  });


  const finalAmount = sub + HANDLING_FEE;
  const progress = Math.min((sub / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remainingForFree = Math.max(FREE_DELIVERY_THRESHOLD - sub, 0);

  // Fast Zap order — direct COD order, no payment page
  const handleZapOrder = async () => {
    if (items.length === 0) return;
    setZapPlacing(true);
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
        address: { name: 'Guest User', line1: '123, MG Road', city: 'Bengaluru', pincode: '560001' },
        payment: { method: 'cod' as const, usePayBalance: false, payBalanceAmount: 0 },
        subtotal: sub,
        mrpTotal: mrp,
        handlingFee: HANDLING_FEE,
        totalSavings: saved,
        finalAmount,
      };
      const order = await createOrder(orderData as any);
      clearCart();
      clearZap();
      navigate(`/order/${order._id}`);
    } catch {
      toast.error('Could not place Zap order. Try again!');
      setZapPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-content flex flex-col items-center justify-center h-[70vh] gap-4 px-6">
        <ShoppingBag size={64} strokeWidth={1} className="text-gray-200" />
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-sm text-gray-500 text-center">Add items to get them delivered in 9 minutes!</p>
        <button
          onClick={() => navigate('/')}
          className="btn-yellow px-8 py-3 text-sm font-bold"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="page-content bg-gray-50">
      {/* Savings banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center gap-2">
        <CheckCircle size={16} className="text-blue-500 shrink-0" />
        <div className="text-xs text-blue-800">
          <span className="font-bold">You're saving ₹{saved.toFixed(0)}</span>
          {' '}on this order! (₹{(mrp - sub).toFixed(0)} MRP discount + ₹{HANDLING_FEE} handling fee savings)
        </div>
      </div>

      {/* Free delivery progress */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        {remainingForFree > 0 ? (
          <p className="text-xs text-gray-600 mb-1.5">
            Add <span className="font-bold text-green-600">₹{remainingForFree.toFixed(0)}</span> more for FREE delivery
          </p>
        ) : (
          <p className="text-xs text-green-600 font-bold mb-1.5">✓ You have free delivery!</p>
        )}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Address */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-xs font-bold text-gray-900">Delivering to Home</p>
            <p className="text-xs text-gray-500">123, MG Road, Bengaluru — 560001</p>
          </div>
        </div>
        <button className="text-[#008296] text-xs font-semibold">Change</button>
      </div>

      {/* Cart items */}
      <div className="bg-white mt-2 border-y border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{total} items in cart</h2>
        </div>
        <AnimatePresence>
          {items.map(({ product, quantity }) => (
            <motion.div
              key={product._id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-50"
            >
              <ProductImage
                name={product.name}
                category={product.category}
                imageUrls={product.imageUrls}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
                alt={product.name}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                <p className="text-xs text-gray-500">{product.unit}</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-sm font-bold">₹{(product.price * quantity).toFixed(0)}</span>
                  {product.mrp > product.price && (
                    <span className="text-xs text-gray-400 line-through">₹{(product.mrp * quantity).toFixed(0)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeFromCart(product._id)} className="text-gray-400">
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center gap-1.5 bg-[#FFD814] rounded-full px-2 py-1 border border-[#a88734]">
                  <button onClick={() => updateQty(product._id, quantity - 1)}>
                    <Minus size={12} strokeWidth={3} />
                  </button>
                  <span className="text-xs font-bold min-w-[1ch] text-center">{quantity}</span>
                  <button onClick={() => updateQty(product._id, quantity + 1)}>
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          onClick={() => navigate('/')}
          className="w-full px-4 py-3 text-left text-sm text-[#008296] font-semibold flex items-center gap-1"
        >
          + Add more items <ArrowRight size={14} />
        </button>
      </div>

      {/* AI Suggestions */}
      {suggestions && suggestions.products.length > 0 && (
        <div className="bg-white mt-2 border-y border-gray-100 px-4 py-3">
          <h3 className="text-sm font-bold text-gray-900 mb-3">✨ You might have missed</h3>
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {suggestions.products.map((product) => (
                <div key={product._id} style={{ width: 130 }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Price breakdown */}
      <div className="bg-white mt-2 border-y border-gray-100 px-4 py-4 space-y-2">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Price Details</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">MRP Total</span>
          <span>₹{mrp.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>−₹{saved.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Handling fee</span>
          <span>₹{HANDLING_FEE}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery</span>
          <span className="text-green-600 font-medium">{sub >= FREE_DELIVERY_THRESHOLD ? 'FREE' : '₹29'}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
          <span>Total Amount</span>
          <span>₹{finalAmount.toFixed(0)}</span>
        </div>
      </div>

      {/* Amazon Pay checkbox */}
      <div className="bg-white mt-2 border-y border-gray-100 px-4 py-3 flex items-center gap-3 mb-24">
        <div className="w-5 h-5 border-2 border-[#FF9900] rounded flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-[#FF9900] rounded-sm" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Use Amazon Pay Balance</p>
          <p className="text-xs text-gray-500">Available: ₹0.00</p>
        </div>
      </div>

      {/* Bottom CTA */}
      {zapPending ? (
        <ZapConfirmBar
          finalAmount={finalAmount}
          placing={zapPlacing}
          onZapOrder={handleZapOrder}
          onNormal={() => { clearZap(); navigate('/checkout'); }}
        />
      ) : (
        <ConfirmBar finalAmount={finalAmount} onProceed={() => navigate('/checkout')} />
      )}
    </div>
  );
};
