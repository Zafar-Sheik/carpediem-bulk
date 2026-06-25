'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Province } from '@/components/pwa/province-selector';

type Props = {
  isOpen: boolean;
  onProvinceResolved: (province: Province) => void;
  onChooseManual: () => void;
};

export function LocationProvincePrompt({ isOpen, onProvinceResolved, onChooseManual }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const resolveProvince = async (pos: GeolocationPosition) => {
    const res = await fetch('/api/location/province', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not detect province');
    const p = (data.province || 'unknown') as Province;
    setStatus('idle');
    onProvinceResolved(p);
  };

  const getPosition = (highAccuracy: boolean): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 10000 : 15000,
        maximumAge: 60000,
      });
    });

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      setErrorMessage('Location is not supported on this device.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMessage('');

    try {
      let pos: GeolocationPosition;
      try {
        pos = await getPosition(true);
      } catch {
        pos = await getPosition(false);
      }
      await resolveProvince(pos);
    } catch (e) {
      setStatus('error');
      const err = e as GeolocationPositionError | Error;
      if ('code' in err && err.code === 1) {
        setErrorMessage('Location access was blocked. Please enable it in your browser settings and try again, or choose manually.');
      } else {
        setErrorMessage(e instanceof Error ? e.message : 'Could not get your location. Please choose manually.');
      }
    }
  };

  const handleManual = () => {
    setStatus('idle');
    setErrorMessage('');
    onChooseManual();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6"
      >
        <h2 className="text-lg font-bold text-foreground mb-5">Set your province</h2>
        <AnimatePresence>
          {status === 'error' && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-red-600 mb-3 bg-red-50 p-3 rounded-lg border border-red-200"
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={status === 'loading'}
            onClick={handleUseLocation}
            className="w-full py-3 px-4 bg-[#22438c] hover:bg-[#1a3575] disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
          >
            {status === 'loading' ? 'Detecting…' : 'Use my location'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={status === 'loading'}
            onClick={handleManual}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-border text-foreground font-bold rounded-xl transition-colors"
          >
            Choose province manually
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export async function detectProvinceFromBrowserLocation(): Promise<Province | null> {
  if (!navigator.geolocation) return null;

  const getPos = (highAccuracy: boolean): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 10000 : 15000,
        maximumAge: 60000,
      });
    });

  try {
    let pos: GeolocationPosition;
    try {
      pos = await getPos(true);
    } catch {
      pos = await getPos(false);
    }

    const res = await fetch('/api/location/province', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return (data.province || 'unknown') as Province;
  } catch {
    return null;
  }
}
