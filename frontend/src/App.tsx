import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';

import { HomePage } from './pages/Home';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/Cart';
import { CheckoutPage } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { ProfilePage } from './pages/Profile';
import { OffersPage } from './pages/Offers';
import { CategoriesPage } from './pages/Categories';
import { SearchResultsPage } from './pages/SearchResults';

import { SmartCartFlow } from './components/SmartCartFlow';
import { useSmartCartFlow } from './hooks/useSmartCartFlow';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

const HIDE_HEADER_PATHS = ['/checkout', '/order'];
const HIDE_NAV_PATHS = ['/checkout', '/order', '/product'];

function AppRoutes() {
  const location = useLocation();
  const hideHeader = HIDE_HEADER_PATHS.some((p) => location.pathname.startsWith(p));
  const hideNav = HIDE_NAV_PATHS.some((p) => location.pathname.startsWith(p));

  return (
    <>
      {!hideHeader && <Header />}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:id" element={<OrderConfirmation />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  const { isOpen, products, itemLabels, query, close } = useSmartCartFlow();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <SmartCartFlow
          isOpen={isOpen}
          products={products}
          itemLabels={itemLabels}
          query={query}
          onClose={close}
        />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#232F3E',
              color: '#fff',
              fontSize: '0.8rem',
              maxWidth: '320px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
