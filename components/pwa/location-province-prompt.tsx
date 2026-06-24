'use client';

import { useState } from 'react';
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Set your province</h2>
        {status === 'error' && (
          <p className="text-sm text-red-400 mb-3">{errorMessage}</p>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={status === 'loading'}
            onClick={handleUseLocation}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium rounded-xl transition-colors"
          >
            {status === 'loading' ? 'Detecting…' : 'Use my location'}
          </button>
          <button
            type="button"
            disabled={status === 'loading'}
            onClick={handleManual}
            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-medium rounded-xl transition-colors"
          >
            Choose province manually
          </button>
        </div>
      </div>
    </div>
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
