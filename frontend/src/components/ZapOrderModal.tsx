import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, MapPin, Clock, CheckCircle, Package, Pencil } from 'lucide-react';
import type { Product } from '../types';
import { createOrder } from '../api/client';
import { useCartStore } from '../store/cartStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ProductImage } from './ProductImage';
import { useZapOrder } from '../hooks/useZapOrder';

interface ZapOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    situationName: string;
}

const CANCEL_WINDOW = 8;

export const ZapOrderModal: React.FC<ZapOrderModalProps> = ({
    isOpen,
    onClose,
    products,
    situationName,
}) => {
    const navigate = useNavigate();
    const { subtotal, clearCart } = useCartStore();
    const setZapPending = useZapOrder((s) => s.setPending);
    const clearZapPending = useZapOrder((s) => s.clear);
    const [phase, setPhase] = useState<'confirm' | 'packing' | 'done'>('confirm');
    const [countdown, setCountdown] = useState(CANCEL_WINDOW);
    const [cancelled, setCancelled] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoOrderRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const placingRef = useRef(false); // synchronous guard against duplicate orders

    const handlingFee = 9;

    useEffect(() => {
        if (!isOpen) return;
        setPhase('confirm');
        setCountdown(CANCEL_WINDOW);
        setCancelled(false);
        placingRef.current = false;

        timerRef.current = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) { clearInterval(timerRef.current!); return 0; }
                return c - 1;
            });
        }, 1000);

        autoOrderRef.current = setTimeout(() => {
            placeZapOrder();
        }, CANCEL_WINDOW * 1000);

        return () => {
            clearInterval(timerRef.current!);
            clearTimeout(autoOrderRef.current!);
        };
    }, [isOpen]);

    const handleCancel = () => {
        clearInterval(timerRef.current!);
        clearTimeout(autoOrderRef.current!);
        setCancelled(true);
        clearZapPending();
        products.forEach((p) => useCartStore.getState().removeFromCart(p._id));
        toast('Order cancelled ✋', { icon: '🚫' });
        onClose();
    };

    const handleEditCart = () => {
        // Stop the auto-order countdown but KEEP items in cart, mark Zap as pending
        clearInterval(timerRef.current!);
        clearTimeout(autoOrderRef.current!);
        setCancelled(true);
        setZapPending(situationName);
        onClose();
        navigate('/cart');
    };

    const placeZapOrder = async () => {
        // Synchronous guard — prevents the auto-timer and manual tap both firing createOrder
        if (placingRef.current || cancelled) return;
        placingRef.current = true;
        clearInterval(timerRef.current!);
        clearTimeout(autoOrderRef.current!);
        setPhase('packing');

        try {
            const store = useCartStore.getState();
            const cartItems = store.items;
            const sub = store.subtotal();
            const orderData = {
                items: cartItems.map((i) => ({
                    productId: i.product._id,
                    name: i.product.name,
                    imageUrl: i.product.imageUrls[0],
                    price: i.product.price,
                    mrp: i.product.mrp,
                    quantity: i.quantity,
                    unit: i.product.unit,
                })),
                address: { id: 'home', label: 'Home', line1: '123, MG Road', city: 'Bengaluru', pincode: '560001', name: 'Guest User' },
                payment: { method: 'cod' as any, usePayBalance: false, payBalanceAmount: 0 },
                subtotal: sub,
                mrpTotal: store.mrpTotal(),
                handlingFee,
                totalSavings: store.savings(),
                finalAmount: sub + handlingFee,
            };

            await new Promise((r) => setTimeout(r, 1800));
            setPhase('done');
            await new Promise((r) => setTimeout(r, 1200));

            const order = await createOrder(orderData as any);
            clearCart();
            clearZapPending();
            onClose();
            navigate(`/order/${order._id}`);
        } catch {
            toast.error('Zap order failed. Items kept in cart.');
            placingRef.current = false;
            setPhase('confirm');
        }
    };

    const sub = subtotal();
    const finalAmount = sub + handlingFee;
    const progressPct = ((CANCEL_WINDOW - countdown) / CANCEL_WINDOW) * 100;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
                        onClick={phase === 'confirm' ? handleCancel : undefined}
                    />

                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[201] bg-white rounded-t-3xl overflow-hidden"
                    >
                        {phase === 'confirm' && (
                            <>
                                {/* Header */}
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-5 pt-5 pb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                                <Zap size={18} className="text-white fill-white" />
                                            </div>
                                            <div>
                                                <p className="text-white font-black text-base leading-tight">Zap Order</p>
                                                <p className="text-white/80 text-[0.65rem]">Packing starts immediately</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCancel}
                                            className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center"
                                        >
                                            <X size={14} className="text-white" />
                                        </button>
                                    </div>
                                    <div className="mt-3">
                                        <div className="flex justify-between text-white/90 text-[0.65rem] mb-1">
                                            <span>Auto-ordering in <span className="font-black">{countdown}s</span></span>
                                            <span>Pay on delivery</span>
                                        </div>
                                        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-white rounded-full"
                                                animate={{ width: `${progressPct}%` }}
                                                transition={{ duration: 0.4, ease: 'linear' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Situation + address */}
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">Cart built for</p>
                                        <p className="text-sm font-bold text-gray-900">"{situationName}"</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <MapPin size={12} className="text-[#FF9900]" />
                                        <span>MG Road, Bengaluru</span>
                                    </div>
                                </div>

                                {/* Product list */}
                                <div className="px-5 py-3 max-h-[220px] overflow-y-auto space-y-2.5">
                                    {products.map((p) => (
                                        <div key={p._id} className="flex items-center gap-3">
                                            <ProductImage
                                                name={p.name}
                                                category={p.category}
                                                imageUrls={p.imageUrls}
                                                className="w-11 h-11 rounded-xl object-cover bg-gray-100 shrink-0"
                                                alt={p.name}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                                                <p className="text-xs text-gray-400">{p.unit}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">₹{p.price}</p>
                                                {p.mrp > p.price && (
                                                    <p className="text-[0.6rem] text-gray-400 line-through">₹{p.mrp}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Clock size={12} />
                                            <span>Delivered in ~9 mins</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Total (incl. ₹{handlingFee} fee)</p>
                                            <p className="text-base font-black text-gray-900">₹{finalAmount.toFixed(0)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2 mb-3">
                                        <span className="text-base">💵</span>
                                        <p className="text-xs text-green-800">Pay <span className="font-bold">Later</span> — no payment needed now</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-3 rounded-xl"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleEditCart}
                                            className="flex-1 border border-gray-300 text-gray-700 text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5"
                                        >
                                            <Pencil size={14} /> Edit Cart
                                        </button>
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={placeZapOrder}
                                            className="flex-[1.5] bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-black py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-orange-200"
                                        >
                                            <Zap size={15} className="fill-white" />
                                            Order
                                        </motion.button>
                                    </div>
                                </div>
                            </>
                        )}

                        {phase === 'packing' && (
                            <div className="px-5 py-12 flex flex-col items-center gap-4 text-center">
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200"
                                >
                                    <Package size={32} className="text-white" />
                                </motion.div>
                                <div>
                                    <p className="text-lg font-black text-gray-900">Packing your order ⚡</p>
                                    <p className="text-sm text-gray-500 mt-1">Your items are being packed right now</p>
                                </div>
                                <div className="flex gap-1 mt-2">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-orange-400 rounded-full"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {phase === 'done' && (
                            <div className="px-5 py-12 flex flex-col items-center gap-4 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12 }}
                                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
                                >
                                    <CheckCircle size={36} className="text-white" />
                                </motion.div>
                                <div>
                                    <p className="text-lg font-black text-gray-900">Order placed! 🎉</p>
                                    <p className="text-sm text-gray-500 mt-1">Arriving in ~9 minutes</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
