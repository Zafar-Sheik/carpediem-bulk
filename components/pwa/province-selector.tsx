'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PROVINCES = [
  'Gauteng',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
] as const;

export type Province = typeof PROVINCES[number] | 'unknown';

interface ProvinceSelectorProps {
  onSelect: (province: Province) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function ProvinceSelector({ onSelect, onClose, isOpen = true }: ProvinceSelectorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  const handleSelect = (province: Province) => {
    if (isSelecting) return;

    setIsSelecting(true);
    onSelect(province);
    localStorage.setItem('userProvince', province);
    setIsVisible(false);
    onClose?.();

    setTimeout(() => setIsSelecting(false), 500);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold text-foreground">
            Select Your Province
          </h2>
          <p className="mt-1.5 text-sm text-muted-text">
            This helps us send you relevant local notifications.
          </p>
        </div>

        <div className="px-2 pb-4 max-h-[60vh] overflow-y-auto">
          {PROVINCES.map((province, i) => (
            <motion.button
              key={province}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleSelect(province)}
              className="w-full px-4 py-3 text-left text-foreground hover:bg-slate-50 rounded-xl transition-colors duration-150 flex items-center justify-between group"
            >
              <span className="font-semibold text-sm">{province}</span>
              <svg
                className="w-4 h-4 text-muted group-hover:text-[#22438c] transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          ))}
        </div>

        <div className="px-6 pb-5 border-t border-border pt-3">
          <button
            onClick={() => {
              handleSelect('unknown');
            }}
            className="w-full py-2.5 text-sm text-muted hover:text-foreground transition-colors font-semibold"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function useProvinceSelection() {
  const [province, setProvince] = useState<Province | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('userProvince');
    if (stored) {
      setProvince(stored as Province);
    }
    setIsLoading(false);
  }, []);

  const selectProvince = (newProvince: Province) => {
    setProvince(newProvince);
    localStorage.setItem('userProvince', newProvince);
    localStorage.setItem('locationFlowDone', '1');
    setShowSelector(false);
  };

  const shouldShowSelector = !isLoading && !province;

  return {
    province,
    showSelector,
    isLoading,
    shouldShowSelector,
    selectProvince,
    setShowSelector,
  };
}

export default ProvinceSelector;
