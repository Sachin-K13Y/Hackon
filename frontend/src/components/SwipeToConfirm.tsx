import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface SwipeToConfirmProps {
    label?: string;
    amount?: number;
    onConfirmed: () => void;
    variant?: 'dark' | 'gradient';
}

const THUMB_SIZE = 54;
const PADDING = 4;

export const SwipeToConfirm: React.FC<SwipeToConfirmProps> = ({
    label = 'Swipe to Confirm',
    amount,
    onConfirmed,
    variant = 'dark',
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [trackWidth, setTrackWidth] = useState(300);
    const [confirmed, setConfirmed] = useState(false);

    const maxDrag = Math.max(0, trackWidth - THUMB_SIZE - PADDING * 2);
    const x = useMotionValue(0);

    // All hooks at top level — stable hook count
    const labelOpacity = useTransform(x, [0, maxDrag * 0.35], [1, 0]);
    const fillWidth = useTransform(x, [0, maxDrag], [THUMB_SIZE + PADDING, trackWidth - PADDING]);
    const arrowOpacity = useTransform(x, [maxDrag * 0.5, maxDrag * 0.85], [1, 0]);
    const checkOpacity = useTransform(x, [maxDrag * 0.5, maxDrag * 0.85], [0, 1]);

    useEffect(() => {
        const measure = () => {
            if (trackRef.current) setTrackWidth(trackRef.current.offsetWidth);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const handleDragEnd = () => {
        const current = x.get();
        if (current >= maxDrag * 0.78) {
            animate(x, maxDrag, { duration: 0.12 });
            setConfirmed(true);
            setTimeout(() => onConfirmed(), 350);
        } else {
            animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 });
        }
    };

    const trackBg = variant === 'gradient'
        ? 'linear-gradient(135deg, #FF9900 0%, #FF6D00 100%)'
        : '#1a1a2e';

    const trackClass = variant === 'gradient'
        ? 'shadow-lg shadow-orange-200'
        : 'shadow-md';

    return (
        <div
            ref={trackRef}
            style={{ height: THUMB_SIZE + PADDING * 2, position: 'relative', background: trackBg }}
            className={`w-full rounded-full overflow-hidden select-none ${trackClass}`}
        >
            {/* Sliding fill behind thumb */}
            <motion.div
                style={{
                    position: 'absolute',
                    left: PADDING,
                    top: PADDING,
                    bottom: PADDING,
                    width: confirmed ? trackWidth - PADDING * 2 : fillWidth,
                    background: confirmed
                        ? 'rgba(34,197,94,0.9)'
                        : variant === 'gradient'
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(255,216,20,0.12)',
                    borderRadius: 9999,
                    pointerEvents: 'none',
                    transition: confirmed ? 'background 0.3s' : undefined,
                }}
            />

            {/* Chevrons hint animation (subtle arrows moving right) */}
            {!confirmed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{ x: [0, 6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        className="flex gap-0.5 opacity-20"
                        style={{ marginLeft: '60px' }}
                    >
                        <ArrowRight size={14} className="text-white" />
                        <ArrowRight size={14} className="text-white" />
                        <ArrowRight size={14} className="text-white" />
                    </motion.div>
                </div>
            )}

            {/* Label — fades as thumb moves */}
            <motion.div
                style={{
                    opacity: confirmed ? 0 : labelOpacity,
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    gap: 6,
                    paddingLeft: THUMB_SIZE + 8,
                }}
            >
                <span className="text-white/90 text-sm font-bold">{label}</span>
                {amount !== undefined && (
                    <span className="text-white/50 text-xs font-semibold">— ₹{amount.toFixed(0)}</span>
                )}
            </motion.div>

            {/* Confirmed label */}
            {confirmed && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <span className="text-white text-sm font-black flex items-center gap-1.5">
                        <CheckCircle size={16} /> Confirmed!
                    </span>
                </motion.div>
            )}

            {/* Draggable thumb */}
            <motion.div
                drag={confirmed ? false : 'x'}
                dragConstraints={{ left: 0, right: maxDrag }}
                dragElastic={0}
                dragMomentum={false}
                style={{
                    x,
                    position: 'absolute',
                    left: PADDING,
                    top: PADDING,
                    width: THUMB_SIZE,
                    height: THUMB_SIZE,
                    borderRadius: 9999,
                    background: confirmed ? '#22c55e' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: confirmed ? 'default' : 'grab',
                    zIndex: 10,
                    boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
                }}
                onDragEnd={handleDragEnd}
                whileTap={confirmed ? {} : { cursor: 'grabbing', scale: 0.95 }}
            >
                {/* Arrow icon */}
                <motion.div style={{ opacity: arrowOpacity, position: 'absolute' }}>
                    <ArrowRight size={22} strokeWidth={2.5} className="text-gray-800" />
                </motion.div>
                {/* Check icon */}
                <motion.div style={{ opacity: confirmed ? 1 : checkOpacity, position: 'absolute' }}>
                    <CheckCircle size={22} strokeWidth={2.5} className={confirmed ? 'text-white' : 'text-green-600'} />
                </motion.div>
            </motion.div>
        </div>
    );
};
