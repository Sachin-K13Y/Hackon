import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { CheckCircle, Package, Bike, Home as HomeIcon, CreditCard, Smartphone, Zap, MapPin, Phone, ChevronDown, Star } from 'lucide-react';
import { io } from 'socket.io-client';
import { fetchOrder } from '../api/client';
import { ProductImage } from '../components/ProductImage';
import { DeliveryMap } from '../components/DeliveryMap';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_STAGES = [
  { status: 'confirmed', label: 'Confirmed', Icon: CheckCircle },
  { status: 'packed', label: 'Packed', Icon: Package },
  { status: 'picked', label: 'Picked Up', Icon: Bike },
  { status: 'on_the_way', label: 'On the Way', Icon: Bike },
  { status: 'delivered', label: 'Delivered', Icon: HomeIcon },
];
const ZAP_DURATIONS = [6, 8, 5, 8];
const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'PhonePe, GPay, Paytm' },
  { id: 'amazon-pay', label: 'Amazon Pay', icon: CreditCard, desc: 'Wallet or saved cards' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
];
const FUN_FACTS = [
  { icon: '🥦', text: 'Broccoli has more Vitamin C than an orange.' },
  { icon: '🥚', text: "An egg's shell has around 17,000 tiny pores." },
  { icon: '🧅', text: 'Onions were used as currency in ancient Egypt.' },
  { icon: '🥛', text: 'Milk contains all 9 essential amino acids.' },
  { icon: '🌿', text: 'Coriander is the world\'s most consumed herb.' },
];

// ─── Tip slider ───────────────────────────────────────────────────────────────
const TipWidget: React.FC = () => {
  const [tip, setTip] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  return (
    <div className="bg-white rounded-3xl p-4" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-2xl bg-rose-50 flex items-center justify-center text-lg">❤️</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Tip your rider</p>
          <p className="text-xs text-gray-400">100% goes to them</p>
        </div>
        {tip && !sent && (
          <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+₹{tip}</span>
        )}
      </div>
      {!sent ? (
        <>
          <div className="flex gap-2 mb-3">
            {[10, 20, 30, 50].map((t) => (
              <motion.button
                key={t}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTip(tip === t ? null : t)}
                className={`flex-1 py-2 rounded-2xl text-xs font-semibold transition-all ${tip === t
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 border border-gray-100'
                  }`}
              >
                ₹{t}
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {tip && (
              <motion.button
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSent(true)}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                Send ₹{tip} tip
              </motion.button>
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 bg-emerald-50 rounded-2xl px-3 py-2.5"
        >
          <CheckCircle size={16} className="text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-700">₹{tip} tip sent — thank you! 🙏</p>
        </motion.div>
      )}
    </div>
  );
};

// ─── Trivia swiper ────────────────────────────────────────────────────────────
const TriviaCard: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const x = useMotionValue(0);

  const next = () => { setDir(1); setIdx((i) => (i + 1) % FUN_FACTS.length); animate(x, 0, { duration: 0.1 }); };
  const prev = () => { setDir(-1); setIdx((i) => (i - 1 + FUN_FACTS.length) % FUN_FACTS.length); animate(x, 0, { duration: 0.1 }); };

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
    else animate(x, 0, { type: 'spring', stiffness: 300, damping: 22 });
  };

  const fact = FUN_FACTS[idx];
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f3f0ff 0%, #e8f4fd 100%)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
      }}
    >
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
            <span className="text-xs">✨</span>
          </div>
          <p className="text-[0.65rem] font-bold text-indigo-400 uppercase tracking-widest">Did you know?</p>
        </div>
        <p className="text-[0.6rem] text-gray-400">{idx + 1}/{FUN_FACTS.length}</p>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="px-4 pb-4 cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={idx}
            custom={dir}
            initial={{ x: dir * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3"
          >
            <span className="text-2xl mt-0.5 shrink-0">{fact.icon}</span>
            <p className="text-sm font-medium text-gray-700 leading-relaxed">{fact.text}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="flex justify-center gap-1.5 pb-3">
        {FUN_FACTS.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === idx ? 16 : 6 }}
            className={`h-1.5 rounded-full transition-colors ${i === idx ? 'bg-indigo-500' : 'bg-indigo-200'}`}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export const OrderConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('confirmed');
  const [timeLeft, setTimeLeft] = useState(9 * 60);
  const [showPaySheet, setShowPaySheet] = useState(false);
  const [payMethod, setPayMethod] = useState('upi');
  const [paid, setPaid] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const zapRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const isZap = order?.payment?.method === 'cod';
  const isDelivered = status === 'delivered';
  const stageIdx = STATUS_STAGES.findIndex((s) => s.status === status);

  useEffect(() => {
    if (!id || isZap) return;
    const socket = io({ transports: ['websocket', 'polling'] });
    socket.on(`order:${id}`, (d: { status: string }) => setStatus(d.status));
    return () => { socket.disconnect(); };
  }, [id, isZap]);

  useEffect(() => {
    if (!isZap) return;
    const stages = ['confirmed', 'packed', 'picked', 'on_the_way', 'delivered'];
    let cur = stages.indexOf(status);
    const adv = () => {
      cur++;
      if (cur >= stages.length) return;
      setStatus(stages[cur]);
      if (cur < stages.length - 1) zapRef.current = setTimeout(adv, ZAP_DURATIONS[cur] * 1000);
    };
    zapRef.current = setTimeout(adv, ZAP_DURATIONS[0] * 1000);
    return () => { if (zapRef.current) clearTimeout(zapRef.current); };
  }, [isZap]);

  useEffect(() => {
    if (timeLeft <= 0 || isDelivered) return;
    const t = setInterval(() => setTimeLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, isDelivered]);

  useEffect(() => { if (order && !isZap) setStatus(order.status); }, [order, isZap]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="page-content pb-10" style={{ background: 'linear-gradient(180deg, #f5f6fa 0%, #faf9f7 100%)' }}>

      {/* ── MAP HERO (bleeds to edges) ─────────────────────────────────────── */}
      <div className="relative">
        <DeliveryMap status={status} />

        {/* Glassmorphism ETA pill — floats over map */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            }}
          >
            {!isDelivered ? (
              <>
                <div className="text-center">
                  <motion.p
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-xl font-black text-gray-900 leading-none"
                    style={{ fontVariantNumeric: 'tabular-nums', color: '#e67e00' }}
                  >
                    {mins}:{secs}
                  </motion.p>
                  <p className="text-[0.55rem] text-gray-500 font-medium mt-0.5">minutes</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">{STATUS_STAGES[stageIdx]?.label}</p>
                  <p className="text-[0.6rem] text-gray-400">#{id?.slice(-6).toUpperCase()}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-gray-900">Delivered!</p>
                  <p className="text-[0.6rem] text-gray-400">#{id?.slice(-6).toUpperCase()}</p>
                </div>
              </div>
            )}
          </div>
          {isZap && (
            <div
              className="flex items-center gap-1.5 rounded-2xl px-2.5 py-2"
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              }}
            >
              <Zap size={12} className="text-amber-500 fill-amber-500" />
              <span className="text-[0.6rem] font-bold text-gray-700">Zap · COD</span>
            </div>
          )}
        </div>
      </div>

      {/* ── RIDER CARD (overlaps map) ──────────────────────────────────────── */}
      <div className="px-4 -mt-6 relative z-10">
        <div
          className="bg-white rounded-3xl px-4 py-3.5 flex items-center gap-3"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-11 h-11 rounded-full overflow-hidden"
              style={{ boxShadow: '0 0 0 2.5px #FF9900, 0 2px 10px rgba(0,0,0,0.12)' }}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80"
                alt="Rider"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Rajan Kumar</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-[0.6rem] text-gray-400 font-medium">4.9 · 1,240 deliveries</span>
            </div>
          </div>

          {/* Call button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}
          >
            <Phone size={15} className="text-emerald-600" />
          </motion.button>
        </div>
      </div>

      {/* ── PROGRESS STEPPER ──────────────────────────────────────────────── */}
      <div className="mx-4 mt-3">
        <div
          className="bg-white rounded-3xl px-4 py-4"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderTop: '3px solid #FF9900' }}
        >
          <p className="text-[0.6rem] font-bold text-orange-500 uppercase tracking-widest mb-4">Order Progress</p>
          <div className="flex items-start">
            {STATUS_STAGES.map((stage, i) => {
              const done = i <= stageIdx;
              const active = i === stageIdx;
              const { Icon } = stage;
              return (
                <React.Fragment key={stage.status}>
                  <div className="flex flex-col items-center flex-1 gap-1.5">
                    {/* Icon circle */}
                    <div className="relative flex items-center justify-center">
                      {active && (
                        <motion.div
                          animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.8 }}
                          className="absolute w-9 h-9 rounded-full"
                          style={{ background: '#FF9900' }}
                        />
                      )}
                      <motion.div
                        animate={active ? { scale: [1, 1.06, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.8 }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all ${done
                          ? active ? '' : 'bg-gray-900'
                          : 'bg-gray-100'}`}
                        style={active ? {
                          background: 'linear-gradient(135deg, #FF9900, #ff6d00)',
                          boxShadow: '0 4px 14px rgba(255,153,0,0.45)',
                        } : {}}
                      >
                        <Icon size={12} className={done ? 'text-white' : 'text-gray-400'} />
                      </motion.div>
                    </div>
                    <p className={`text-[0.58rem] font-semibold text-center leading-tight ${done ? 'text-gray-800' : 'text-gray-300'}`}>
                      {stage.label}
                    </p>
                  </div>
                  {i < STATUS_STAGES.length - 1 && (
                    <div className="flex-1 mt-3.5">
                      <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #FF9900, #e67e00)' }}
                          animate={{ width: i < stageIdx ? '100%' : '0%' }}
                          transition={{ duration: 0.8, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ZAP PAY BANNER ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isZap && !paid && (status === 'on_the_way' || isDelivered) && (
          <motion.div
            key="pay"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-4 mt-3 rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 8px 30px rgba(245,158,11,0.18)' }}
          >
            <div className="px-4 py-3.5 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
              <div>
                <p className="text-white font-bold text-sm">Time to Pay</p>
                <p className="text-amber-100 text-xs mt-0.5">
                  {isDelivered ? 'Delivered — complete payment' : 'Rider on the way — pay now'}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPaySheet(true)}
                className="bg-white text-amber-700 text-xs font-bold px-4 py-2 rounded-2xl shadow"
              >
                Pay ₹{order?.finalAmount.toFixed(0)}
              </motion.button>
            </div>
          </motion.div>
        )}
        {isZap && paid && (
          <motion.div key="paid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mx-4 mt-3 bg-emerald-50 border border-emerald-100 rounded-3xl px-4 py-3 flex items-center gap-2.5"
          >
            <CheckCircle size={18} className="text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Payment Complete</p>
              <p className="text-xs text-gray-400">₹{order?.finalAmount.toFixed(0)} via {payMethod.toUpperCase()}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ENGAGEMENT ZONE ───────────────────────────────────────────────── */}
      <div className="px-4 mt-4 space-y-3">
        <p className="text-[0.65rem] font-bold text-orange-500 uppercase tracking-widest px-1">While you wait</p>
        <TipWidget />
        <TriviaCard />
      </div>

      {/* ── ORDER SUMMARY (accordion) ─────────────────────────────────────── */}
      {
        order && (
          <div className="mx-4 mt-4 bg-white rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.04)', borderLeft: '3px solid #FFD814' }}>
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={() => setItemsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-4"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">Items ({order.items.length})</p>
                {(order.totalSavings ?? 0) > 0 && (
                  <span className="text-[0.6rem] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Saved ₹{order.totalSavings?.toFixed(0)}
                  </span>
                )}
              </div>
              <motion.div animate={{ rotate: itemsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} className="text-gray-400" />
              </motion.div>
            </motion.button>

            <AnimatePresence initial={false}>
              {itemsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="border-t border-gray-50 px-4 divide-y divide-gray-50">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-3">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gray-50 shrink-0">
                          <ProductImage name={item.name} imageUrls={[item.imageUrl]}
                            className="w-full h-full object-cover" alt={item.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-[0.6rem] text-gray-400 mt-0.5">{item.unit} × {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 shrink-0">
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mx-4 mb-4 mt-2 bg-gray-50 rounded-2xl px-4 py-3 space-y-1.5">
                    {[
                      ['Subtotal', `₹${order.subtotal?.toFixed(0)}`, ''],
                      ['Savings', `-₹${order.totalSavings?.toFixed(0)}`, 'text-emerald-600'],
                      ['Handling fee', `₹${order.handlingFee}`, ''],
                    ].map(([label, val, color]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-gray-400">{label}</span>
                        <span className={`font-medium text-gray-700 ${color}`}>{val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                      <span className="text-gray-900">{isZap && !paid ? 'Amount Due' : 'Total Paid'}</span>
                      <span className={isZap && !paid ? 'text-amber-600' : 'text-gray-900'}>
                        ₹{order.finalAmount.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      }

      {/* ── CONTINUE ──────────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="w-full btn-yellow py-4 rounded-3xl text-sm font-bold"
        >
          Continue Shopping 🛒
        </motion.button>
      </div>

      {/* ── PAYMENT SHEET ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPaySheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
              onClick={() => setShowPaySheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-[201] p-5"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <p className="text-base font-bold text-gray-900 mb-0.5">Complete Payment</p>
              <p className="text-xs text-gray-400 mb-5">Order #{id?.slice(-6).toUpperCase()} · ₹{order?.finalAmount.toFixed(0)}</p>
              <div className="space-y-2 mb-5">
                {PAYMENT_METHODS.map(({ id: mid, label, icon: Icon, desc }) => (
                  <motion.button key={mid} whileTap={{ scale: 0.98 }}
                    onClick={() => setPayMethod(mid)}
                    className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left border ${payMethod === mid ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${payMethod === mid ? 'border-gray-900' : 'border-gray-300'}`}>
                      {payMethod === mid && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                    </div>
                    <Icon size={17} className={payMethod === mid ? 'text-gray-900' : 'text-gray-400'} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setPaid(true); setShowPaySheet(false); }}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-gray-900 shadow-lg"
              >
                Pay ₹{order?.finalAmount.toFixed(0)}
              </motion.button>
              <p className="text-[0.6rem] text-gray-400 text-center mt-3">Secured by Amazon Pay · 256-bit SSL</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div >
  );
};
