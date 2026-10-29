"use client";

import React, { useState } from 'react';
import { Search, Book, ExternalLink, Loader2, Library } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      // Modificat pentru Next.js
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://portfolio-7ea4.onrender.com";
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) throw new Error("Eroare la conectarea cu serverul");
      
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError("Nu am putut căuta cărțile. Verifică conexiunea sau încearcă mai târziu.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1816] text-[#F4F0E6] font-sans selection:bg-[#D4AF37] selection:text-[#1A1816]">
      {/* Header */}
      <header className="border-b border-[#F4F0E6]/10 px-8 py-6 flex items-center justify-between sticky top-0 bg-[#1A1816]/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-[#D4AF37]" />
          <h1 className="text-xl font-bold tracking-widest uppercase">Librarium</h1>
        </div>
        <div className="text-sm font-medium tracking-widest text-[#F4F0E6]/60 uppercase hidden sm:block">
          Agregator de Prețuri
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">
        {/* Search Section */}
        <div className={`transition-all duration-700 ease-in-out flex flex-col items-center text-center ${hasSearched ? 'opacity-100 transform translate-y-0' : 'opacity-100 transform translate-y-[10vh]'}`}>
          {!hasSearched && (
            <div className="mb-12 space-y-6">
              <h2 className="text-5xl md:text-7xl font-serif text-[#D4AF37]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Găsește următoarea lectură
              </h2>
              <p className="text-[#F4F0E6]/70 max-w-xl mx-auto text-lg">
                Caută prin arhivele librăriilor și descoperă cea mai bună ofertă pentru cartea pe care o dorești.
              </p>
            </div>
          )}

          <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titlul sau autorul cărții..."
              className="w-full bg-[#2A2623] text-[#F4F0E6] border border-[#F4F0E6]/20 rounded-none px-6 py-5 pl-14 text-lg focus:outline-none focus:border-[#D4AF37]/50 transition-colors placeholder:text-[#F4F0E6]/30"
            />
            <Search className="w-6 h-6 text-[#F4F0E6]/30 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-[#D4AF37] transition-colors" />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#D4AF37] text-[#1A1816] px-6 py-2 font-bold tracking-widest uppercase text-sm hover:bg-[#F4F0E6] transition-colors disabled:opacity-50 disabled:hover:bg-[#D4AF37]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Caută'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {error && (
          <div className="text-red-400 text-center bg-red-400/10 border border-red-400/20 py-4 px-6 rounded-sm">
            {error}
          </div>
        )}

        {hasSearched && !isLoading && !error && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-sm font-medium tracking-widest text-[#F4F0E6]/50 uppercase mb-2">
              {results.length} Rezultate găsite
            </div>
            
            {results.length === 0 ? (
              <div className="text-center py-12 text-[#F4F0E6]/50 border border-[#F4F0E6]/10 border-dashed">
                Nu am găsit niciun exemplar în arhivă.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.map((book, idx) => (
                  <div 
                    key={idx} 
                    className={`group bg-[#2A2623]/50 border hover:bg-[#2A2623] transition-all flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4
                      ${idx === 0 ? 'border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-[#F4F0E6]/10 hover:border-[#F4F0E6]/30'}
                      ${!book.available && 'opacity-60 grayscale'}`}
                  >
                    {/* Book Info */}
                    <div className="flex gap-4 items-start sm:items-center flex-1 min-w-0">
                      <div className="hidden sm:flex w-10 h-14 bg-[#1A1816] border border-[#F4F0E6]/10 items-center justify-center shrink-0">
                        <Book className="w-5 h-5 text-[#F4F0E6]/30" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-lg font-serif text-[#F4F0E6] truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {book.title}
                        </h3>
                        <div className="text-sm text-[#F4F0E6]/60 truncate mt-1">
                          {book.author || 'Autor necunoscut'}
                        </div>
                      </div>
                    </div>

                    {/* Store & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-[#F4F0E6]/10 sm:border-0">
                      <div className="flex flex-col sm:items-end">
                        <span className="text-xs tracking-widest uppercase text-[#F4F0E6]/40 mb-1">
                          {book.store}
                        </span>
                        {book.available ? (
                          <span className="text-xs text-green-400/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400/80"></span>
                            În stoc
                          </span>
                        ) : (
                          <span className="text-xs text-red-400/80 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400/80"></span>
                            Epuizat
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {book.price ? (
                            <div className={`text-xl font-serif ${idx === 0 && book.available ? 'text-[#D4AF37]' : 'text-[#F4F0E6]'}`}>
                              {book.price.toFixed(2)} <span className="text-sm font-sans text-[#F4F0E6]/50">{book.currency}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-[#F4F0E6]/50">N/A</div>
                          )}
                        </div>
                        
                        <a 
                          href={book.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 border border-[#F4F0E6]/20 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors group-hover:bg-[#1A1816]"
                          title="Vezi pe site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
