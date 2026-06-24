'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePWA } from '@/components/pwa/firebase-provider';
import { ProvinceSelector, useProvinceSelection, type Province } from '@/components/pwa/province-selector';
import { detectProvinceFromBrowserLocation } from '@/components/pwa/location-province-prompt';
import NotificationModal from '@/components/ui/NotificationModal';

interface Notification {
  _id: string;
  title: string;
  message: string;
  image?: string;
  attachments?: string;
  link?: string;
  sentAt?: string;
}

export default function ProfilePage() {
  const { 
    isReady, 
    isSupported, 
    permission, 
    token, 
    error,
    registerDevice 
  } = usePWA();

  const { 
    province, 
    showSelector, 
    selectProvince,
    setShowSelector 
  } = useProvinceSelection();

  const [isInstalled, setIsInstalled] = useState(false);
  const [provinceConfirm, setProvinceConfirm] = useState<string | null>(null);
  const [isChangingProvince, setIsChangingProvince] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  useEffect(() => {
    const handleDeepLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const notificationId = urlParams.get('notification');
      
      if (notificationId) {
        try {
          const response = await fetch(`/api/notifications/${notificationId}`);
          const data = await response.json();
          if (data.success && data.notification) {
            setSelectedNotification(data.notification);
            setIsModalOpen(true);
            window.history.replaceState({}, document.title, '/profile');
          }
        } catch (error) {
          console.error('Failed to fetch notification:', error);
        }
      }
    };

    handleDeepLink();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE_TO') {
        const url = new URL(event.data.url);
        const notificationId = url.searchParams.get('notification');
        if (notificationId) {
          handleDeepLink();
        }
      }
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const handleProvinceChange = async (selectedProvince: Province) => {
    setIsChangingProvince(true);
    selectProvince(selectedProvince);
    setShowSelector(false);

    if (token) {
      try {
        const response = await fetch('/api/device/province', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken: token, province: selectedProvince }),
        });
        
        if (!response.ok) {
          await registerDevice(selectedProvince);
        }
      } catch (err) {
        console.error('Failed to update province:', err);
        try {
          await registerDevice(selectedProvince);
        } catch (fallbackErr) {
          console.error('Fallback registration also failed:', fallbackErr);
        }
      }
    }
    
    setProvinceConfirm(selectedProvince);
    setTimeout(() => {
      setProvinceConfirm(null);
      setIsChangingProvince(false);
    }, 3000);
  };

  const handleDetectProvinceFromLocation = async () => {
    setIsLocating(true);
    try {
      const p = await detectProvinceFromBrowserLocation();
      if (p) await handleProvinceChange(p);
    } finally {
      setIsLocating(false);
    }
  };

  const statusRows = [
    {
      label: 'Browser Support',
      value: isSupported ? 'Supported' : 'Not Supported',
      positive: isSupported,
    },
    {
      label: 'Notification Permission',
      value: permission === 'unsupported' 
        ? 'N/A' 
        : permission.charAt(0).toUpperCase() + permission.slice(1),
      positive: permission === 'granted',
      warning: permission === 'default',
    },
    {
      label: 'Device Registration',
      value: token ? 'Registered' : 'Not Registered',
      positive: !!token,
    },
    {
      label: 'App Installed',
      value: isInstalled ? 'Yes' : 'No',
      positive: isInstalled,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-slate-500 text-sm">Manage your notification settings</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white">Status</h2>
          </div>

          <div className="divide-y divide-slate-700/50">
            {statusRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-slate-300">{row.label}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  row.positive
                    ? 'bg-green-500/15 text-green-400'
                    : row.warning
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {row.value}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-300">Province</span>
                {!province && (
                  <span className="text-xs text-slate-600 mt-0.5">
                    Nationwide notifications only
                  </span>
                )}
              </div>
              {provinceConfirm ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400">
                  Saved: {provinceConfirm}
                </span>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setShowSelector(true)}
                    disabled={isChangingProvince}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
                  >
                    {isChangingProvince ? 'Saving...' : (province || 'Not set')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDetectProvinceFromLocation}
                    disabled={isLocating || isChangingProvince}
                    className="text-[11px] text-slate-500 hover:text-slate-300 underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    {isLocating ? 'Detecting…' : 'Use my location'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {showSelector && (
          <ProvinceSelector
            onSelect={handleProvinceChange}
            onClose={() => setShowSelector(false)}
            isOpen={showSelector}
          />
        )}

        <NotificationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          notification={selectedNotification}
        />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-50">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[10px] font-medium">Messages</span>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-blue-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
