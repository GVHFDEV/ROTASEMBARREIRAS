"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, QrCode, X } from "lucide-react";
import { TouristPoint } from "../data/mockData";
import { AnimatePresence, motion } from "framer-motion";

interface SearchBarProps {
  points: TouristPoint[];
  onSelectPoint: (point: TouristPoint) => void;
  onOpenScanner: () => void;
  selectedPointId?: string;
}

export default function SearchBar({ points, onSelectPoint, onOpenScanner, selectedPointId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TouristPoint[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      return;
    }

    const filtered = points.filter((point) =>
      point.name.toLowerCase().includes(query.toLowerCase()) ||
      point.category.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered);
  }, [query, points]);

  // Reset search when selectedPointId changes from outside
  useEffect(() => {
    if (!selectedPointId) {
      setQuery("");
    }
  }, [selectedPointId]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (point: TouristPoint) => {
    onSelectPoint(point);
    setQuery(point.name);
    setSuggestions([]);
    setIsFocused(false);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="absolute top-5 left-5 right-5 z-40 max-w-md mx-auto">
      {/* Taller input container (h-14) for better accessibility */}
      <div className="relative flex items-center bg-white border border-gray-150 shadow-lg rounded-full px-5 py-2 h-14 transition-all duration-200 focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/10">
        {/* Search Icon - larger (w-5.5) */}
        <Search className="w-5.5 h-5.5 text-text-secondary mr-3 flex-shrink-0" />

        {/* Text Input - larger font (text-base) */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Buscar ponto turístico..."
          className="w-full bg-transparent text-text-main placeholder-text-secondary font-semibold text-base focus:outline-none h-full"
        />

        {/* Clear Button - larger touch target */}
        {query && (
          <button
            onClick={handleClear}
            className="p-2 mr-1 hover:bg-gray-100 rounded-full text-text-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* QR Code Action Button - larger (w-11 h-11) */}
        <div className="h-7 w-[1.5px] bg-gray-200 mr-3 flex-shrink-0" />
        <button
          onClick={onOpenScanner}
          className="flex items-center justify-center w-11 h-11 rounded-full text-brand bg-brand-light hover:bg-brand hover:text-white transition-colors duration-200 flex-shrink-0 active:scale-95 shadow-sm"
          title="Escanear QR Code"
        >
          <QrCode className="w-5.5 h-5.5 stroke-[2.2]" />
        </button>
      </div>

      {/* Suggestion Dropdown - larger texts */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto"
          >
            <ul className="py-1">
              {suggestions.map((point) => (
                <li key={point.id}>
                  <button
                    onClick={() => handleSelectSuggestion(point)}
                    className="w-full text-left px-5 py-4 hover:bg-brand-light/30 flex items-center justify-between border-b border-gray-50 last:border-b-0 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-base text-text-main">{point.name}</h4>
                      <p className="text-xs text-text-secondary mt-1 font-semibold">{point.category}</p>
                    </div>
                    <span className="text-xs text-brand bg-brand-light px-3 py-1 rounded-full font-bold">
                      Ver no mapa
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
