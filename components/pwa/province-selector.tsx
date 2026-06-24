'use client';

import { useState, useEffect } from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
      />
      
      <div className="relative w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-white">
            Select Your Province
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            This helps us send you relevant local notifications.
          </p>
        </div>

        <div className="px-2 pb-4 max-h-[60vh] overflow-y-auto">
          {PROVINCES.map((province) => (
            <button
              key={province}
              onClick={() => handleSelect(province)}
              className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700/50 rounded-xl transition-colors duration-150 flex items-center justify-between group"
            >
              <span className="font-medium">{province}</span>
              <svg 
                className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <div className="px-6 pb-5 border-t border-slate-700/50 pt-3">
          <button
            onClick={() => {
              handleSelect('unknown');
            }}
            className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
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
