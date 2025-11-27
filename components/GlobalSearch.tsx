"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Users, Building2, FileText, DollarSign, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: 'product' | 'client' | 'supplier' | 'sale' | 'expense';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  url: string;
}

const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchQuery = query.toLowerCase().trim();

    // Simulate search - in real app, this would be an API call
    const searchResults: SearchResult[] = [];

    // You can add actual search logic here
    // For now, this is a placeholder that shows the structure

    setTimeout(() => {
      setIsLoading(false);
      setResults(searchResults);
    }, 200);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={() => {
          setIsOpen(false);
          setQuery('');
        }}
      />

      {/* Search Modal */}
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden pointer-events-auto animate-scale-in">
          {/* Search Input */}
          <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos, clientes, proveedores..."
              className="flex-1 outline-none text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={() => {
                setIsOpen(false);
                setQuery('');
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                Buscando...
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="text-purple-600">{result.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="p-8 text-center text-gray-500">
                <p>No se encontraron resultados para "{query}"</p>
                <p className="text-sm mt-2">Presiona Ctrl+K para buscar</p>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium mb-1">Búsqueda Global</p>
                <p className="text-sm">Busca productos, clientes, proveedores y más...</p>
                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">K</kbd>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default GlobalSearch;

