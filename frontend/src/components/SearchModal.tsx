import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Mic, Loader2 } from 'lucide-react';
import { searchProducts } from '../api/client';
import type { Product } from '../types';
import { AddButton } from './AddButton';
import { ProductImage } from './ProductImage';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR = ['Amul Milk', 'Onions', 'Eggs', 'Basmati Rice', 'Bread', 'Maggi', 'Dahi'];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsLoading(true);
    try {
      const data = await searchProducts(q);
      setResults(data.products);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice search not supported in this browser.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      doSearch(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col"
          style={{ maxWidth: 430, left: '50%', transform: 'translateX(-50%)' }}
        >
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-200 bg-[#232F3E]">
            <button onClick={handleClose} className="text-white">
              <X size={20} />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-white rounded-md px-3 py-2">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
                placeholder="Search products…"
                className="flex-1 text-sm outline-none text-gray-900 bg-transparent"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }}>
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={handleVoice}
              className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-gray-600'}`}
            >
              <Mic size={16} />
            </button>
          </div>

          {/* Popular searches (shown when no query) */}
          {!query && (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Popular</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((item) => (
                  <button
                    key={item}
                    onClick={() => { setQuery(item); doSearch(item); }}
                    className="text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1.5 font-medium"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Searching…</span>
            </div>
          )}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <p className="px-4 py-2 text-xs text-gray-400">{results.length} results for "{query}"</p>
              {results.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 px-3 py-3 border-b border-gray-100 cursor-pointer active:bg-gray-50"
                  onClick={() => { navigate(`/product/${product._id}`); handleClose(); }}
                >
                  <ProductImage
                    name={product.name}
                    category={product.category}
                    imageUrls={product.imageUrls}
                    className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                    alt={product.name}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.unit}</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-bold">₹{product.price}</span>
                      {product.mrp > product.price && (
                        <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                      )}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <AddButton product={product} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Search size={40} strokeWidth={1} />
              <p className="text-sm">No results for "{query}"</p>
              <p className="text-xs text-gray-400">Try a different keyword</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
