import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid2X2, Tag, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/categories', label: 'Categories', icon: Grid2X2 },
  { to: '/offers', label: 'Offers', icon: Tag },
  { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: true },
  { to: '/profile', label: 'Profile', icon: User },
];

export const BottomNav: React.FC = () => {
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                isActive ? 'text-[#FF9900]' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <motion.div whileTap={{ scale: 0.85 }}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  </motion.div>
                  <AnimatePresence>
                    {badge && totalItems > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 bg-[#FF9900] text-white text-[0.55rem] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                      >
                        {totalItems > 9 ? '9+' : totalItems}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className={`text-[0.6rem] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 w-6 h-0.5 bg-[#FF9900] rounded-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
