import React from 'react';
import { Search, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Amazon Now logo — matching official branding
const AmazonNowLogo: React.FC = () => (
  <div className="flex items-baseline select-none gap-0.5" style={{ lineHeight: 1 }}>
    {/* "amazon" with smile arrow underneath */}
    <div className="flex flex-col items-center">
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 900,
        fontSize: '1.25rem',
        color: '#ffffff',
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        amazon
      </span>
      {/* Amazon smile arrow */}
      <svg width="58" height="8" viewBox="0 0 116 16" style={{ marginTop: '1px' }}>
        <path
          d="M 4 4 Q 35 16 75 11 Q 95 7 110 3"
          stroke="#FF9900"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M 106 1 L 112 4.5 L 106 7" fill="#FF9900" stroke="#FF9900" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>

    {/* "now" in cyan/blue highlight */}
    <span style={{
      fontFamily: "'Inter', sans-serif",
      fontWeight: 900,
      fontSize: '1.25rem',
      color: '#00BCD4',
      letterSpacing: '-0.02em',
      lineHeight: 1,
      fontStyle: 'italic',
    }}>
      now
    </span>
  </div>
);

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 shadow-md" style={{ background: '#131921' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2">
          {/* Pay Balance */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 rounded-full px-2 py-1 cursor-pointer"
            style={{ background: 'rgba(255,153,0,0.15)' }}
          >
            <Wallet size={12} style={{ color: '#FFD814' }} />
            <span style={{ fontSize: '0.65rem', color: '#FFD814', fontWeight: 700 }}>Pay ₹0</span>
          </motion.div>

          {/* Amazon Now Logo centered */}
          <AmazonNowLogo />

          {/* Search icon */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/search')}
            className="w-8 h-8 flex items-center justify-center text-white"
          >
            <Search size={20} />
          </motion.button>
        </div>

        {/* Delivery address bar */}
        <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ background: '#1a2535' }}>
          <span style={{ fontSize: '0.75rem' }}>📍</span>
          <span style={{ color: '#ffffff', fontSize: '0.75rem', fontWeight: 600 }}>
            Delivering to: <span style={{ color: '#FFD814' }}>MG Road, Bengaluru 560001</span>
          </span>
          <span style={{ color: '#FF9900', fontSize: '0.7rem', marginLeft: 'auto' }}>▼</span>
        </div>
      </header>
    </>
  );
};
