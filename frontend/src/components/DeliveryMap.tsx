import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface DeliveryMapProps {
    status: string;
}

const STATUS_PROGRESS: Record<string, number> = {
    confirmed: 0,
    packed: 0,
    picked: 0.12,
    on_the_way: 0.58,
    delivered: 1,
};

export const DeliveryMap: React.FC<DeliveryMapProps> = ({ status }) => {
    const progress = STATUS_PROGRESS[status] ?? 0;
    const isMoving = status === 'on_the_way' || status === 'picked';

    // Bezier path points (SVG viewBox 400x280)
    const sx = 72, sy = 80;      // store
    const ex = 308, ey = 196;    // home
    const cx = 200, cy = 55;     // control point

    const totalLen = 340; // approximate path length
    const drawn = Math.max(36, progress * totalLen);

    // Rider position on the bezier
    const t = Math.min(1, Math.max(0, progress));
    const rx = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t ** 2 * ex;
    const ry = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t ** 2 * ey;

    return (
        <div className="relative w-full overflow-hidden" style={{ height: 280, background: '#eef0f3' }}>
            <svg
                viewBox="0 0 400 280"
                width="100%"
                height="100%"
                style={{ position: 'absolute', inset: 0 }}
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* ── Base map fill ── */}
                <rect width="400" height="280" fill="#eef0f3" />

                {/* ── Park / green areas ── */}
                <ellipse cx="320" cy="50" rx="55" ry="30" fill="#d4e8c2" opacity="0.7" />
                <ellipse cx="60" cy="220" rx="40" ry="24" fill="#d4e8c2" opacity="0.6" />
                <rect x="150" y="200" width="70" height="45" rx="8" fill="#cde4b4" opacity="0.55" />

                {/* ── Water ── */}
                <ellipse cx="370" cy="200" rx="38" ry="22" fill="#c2d9ef" opacity="0.7" />

                {/* ── Street grid ── */}
                {/* Horizontal roads */}
                {[48, 112, 168, 220, 258].map((y) => (
                    <rect key={y} x="0" y={y - 5} width="400" height="10" fill="#ffffff" opacity="0.9" rx="2" />
                ))}
                {/* Vertical roads */}
                {[55, 130, 198, 268, 330].map((x) => (
                    <rect key={x} x={x - 5} y="0" width="10" height="280" fill="#ffffff" opacity="0.9" rx="2" />
                ))}

                {/* ── Road markings (center dashes) ── */}
                {[48, 168, 258].map((y) =>
                    [20, 70, 120, 170, 220, 270, 320, 370].map((x) => (
                        <rect key={`${y}-${x}`} x={x} y={y - 1} width="16" height="2" fill="#d1d5db" opacity="0.6" rx="1" />
                    ))
                )}

                {/* ── Building blocks ── */}
                {[
                    [10, 56, 38, 48], [58, 56, 62, 48], [140, 56, 46, 48],
                    [210, 56, 44, 48], [280, 56, 38, 48],
                    [10, 120, 38, 38], [58, 120, 58, 38], [140, 120, 44, 38],
                    [210, 120, 42, 38], [284, 120, 36, 38],
                    [10, 176, 36, 34], [60, 176, 54, 34], [144, 176, 40, 34],
                    [214, 176, 40, 34], [288, 176, 34, 34],
                    [10, 228, 40, 42], [64, 228, 56, 42],
                ].map(([x, y, w, h], i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} rx="5"
                        fill={i % 3 === 0 ? '#f5f6f8' : i % 3 === 1 ? '#f0f2f5' : '#f8f9fa'}
                        stroke="#e4e6eb" strokeWidth="0.8"
                    />
                ))}

                {/* ── Drawn route path (grey base) ── */}
                <path
                    d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
                    fill="none"
                    stroke="#c8ccd4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="6 8"
                />

                {/* ── Animated drawn path (progress) ── */}
                <motion.path
                    d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
                    fill="none"
                    stroke="url(#routeGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${drawn} 9999`}
                    initial={{ strokeDasharray: '0 9999' }}
                    animate={{ strokeDasharray: `${drawn} 9999` }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                />

                {/* Gradient for route */}
                <defs>
                    <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* ── Store marker ── */}
                <circle cx={sx} cy={sy} r="16" fill="white" stroke="#e4e6eb" strokeWidth="1.5"
                    style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }} />
                <text x={sx} y={sy + 5} textAnchor="middle" fontSize="14">🏪</text>

                {/* ── Home pulsing marker ── */}
                <motion.circle cx={ex} cy={ey} r="22"
                    fill="#22c55e" opacity={0.12}
                    animate={{ r: [18, 28, 18], opacity: [0.14, 0.04, 0.14] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                />
                <motion.circle cx={ex} cy={ey} r="13"
                    fill="#22c55e" opacity={0.2}
                    animate={{ r: [11, 16, 11] }}
                    transition={{ repeat: Infinity, duration: 2.2, delay: 0.3 }}
                />
                <circle cx={ex} cy={ey} r="10" fill="white" stroke="#22c55e" strokeWidth="2.5"
                    style={{ filter: 'drop-shadow(0 2px 8px rgba(34,197,94,0.35))' }} />
                <circle cx={ex} cy={ey} r="4" fill="#22c55e" />

                {/* ── Rider marker (only visible when progress > 0) ── */}
                {progress > 0 && (
                    <>
                        <motion.circle cx={rx} cy={ry} r="20"
                            fill="#6366f1" opacity={0.15}
                            animate={isMoving ? { r: [16, 24, 16], opacity: [0.18, 0.06, 0.18] } : {}}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                        <motion.g
                            animate={{ x: rx, y: ry }}
                            transition={{ type: 'tween', duration: 1.2, ease: 'easeInOut' }}
                            style={{ x: rx, y: ry }}
                        >
                            <circle cx={0} cy={0} r="14" fill="white"
                                style={{ filter: 'drop-shadow(0 3px 12px rgba(99,102,241,0.4))' }} />
                            <text x={0} y={5} textAnchor="middle" fontSize="14">🛵</text>
                        </motion.g>
                    </>
                )}
            </svg>

            {/* ── LIVE badge ── */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/85 backdrop-blur-md rounded-full px-2.5 py-1 shadow-sm border border-white/60">
                <motion.div
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.3 }}
                    className="w-1.5 h-1.5 rounded-full bg-red-500"
                />
                <span className="text-[0.6rem] font-bold text-gray-700 tracking-widest">LIVE</span>
            </div>
        </div>
    );
};
