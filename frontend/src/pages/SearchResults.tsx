import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X, Mic, Loader2 } from 'lucide-react';
import { searchProducts } from '../api/client';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

const POPULAR = ['Amul Milk', 'Onions', 'Eggs', 'Basmati Rice', 'Bread', 'Maggi', 'Dahi'];

export const SearchResultsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQ = searchParams.get('q') ?? '';

    const [query, setQuery] = useState(initialQ);
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); setSearched(false); return; }
        setIsLoading(true);
        setSearched(true);
        setSearchParams({ q });
        try {
            const data = await searchProducts(q);
            setResults(data.products);
        } catch {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Run search on mount if query param exists
    useEffect(() => {
        if (initialQ) doSearch(initialQ);
        else inputRef.current?.focus();
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

    return (
        <div className="page-content bg-gray-50 min-h-screen">
            {/* Sticky search header */}
            <div className="sticky top-0 z-40 bg-[#232F3E] px-3 py-3 flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="text-white shrink-0">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                    <Search size={15} className="text-gray-400 shrink-0" />
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
                        <button onClick={() => { setQuery(''); setResults([]); setSearched(false); setSearchParams({}); }}>
                            <X size={14} className="text-gray-400" />
                        </button>
                    )}
                </div>
                <button
                    onClick={handleVoice}
                    className={`p-2 rounded-full shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white'}`}
                >
                    <Mic size={16} />
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Searching…</span>
                </div>
            )}

            {/* Popular chips — shown when no query */}
            {!query && !isLoading && (
                <div className="px-4 py-4">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Popular searches</p>
                    <div className="flex flex-wrap gap-2">
                        {POPULAR.map((item) => (
                            <button
                                key={item}
                                onClick={() => { setQuery(item); doSearch(item); }}
                                className="flex items-center gap-1.5 text-sm bg-white text-gray-700 rounded-full px-4 py-2 shadow-sm border border-gray-100"
                            >
                                <Search size={12} className="text-gray-400" />
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results grid */}
            {!isLoading && results.length > 0 && (
                <div className="px-3 py-3">
                    <p className="text-xs text-gray-500 mb-3">
                        <span className="font-semibold text-gray-800">{results.length}</span> results for "{query}"
                    </p>
                    <motion.div
                        className="grid grid-cols-2 gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {results.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </motion.div>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && searched && results.length === 0 && query && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                    <Search size={48} strokeWidth={1} />
                    <p className="text-base font-semibold text-gray-600">No results for "{query}"</p>
                    <p className="text-sm text-gray-400">Try a different keyword or browse categories</p>
                    <button
                        onClick={() => navigate('/categories')}
                        className="mt-2 text-sm font-semibold text-white bg-[#232F3E] px-5 py-2.5 rounded-full"
                    >
                        Browse Categories
                    </button>
                </div>
            )}
        </div>
    );
};
