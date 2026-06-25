'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
    <main className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-[#22438c]/5 border border-[#22438c]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#22438c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">My Profile</h1>
          <p className="text-muted-text text-sm">Manage your notification settings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-sm"
        >
          <div className="px-5 py-4 border-b border-border bg-slate-50/50">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Status</h2>
          </div>

          <div className="divide-y divide-border">
            {statusRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-semibold text-foreground">{row.label}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  row.positive
                    ? 'bg-green-100 text-green-700'
                    : row.warning
                    ? 'bg-[#d0a953]/10 text-[#b8922e]'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {row.value}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Province</span>
                {!province && (
                  <span className="text-xs text-muted mt-0.5">
                    Nationwide notifications only
                  </span>
                )}
              </div>
              {provinceConfirm ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                  Saved: {provinceConfirm}
                </span>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => setShowSelector(true)}
                    disabled={isChangingProvince}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-[#22438c]/10 text-[#22438c] hover:bg-[#22438c]/15 transition-colors disabled:opacity-50"
                  >
                    {isChangingProvince ? 'Saving...' : (province || 'Not set')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDetectProvinceFromLocation}
                    disabled={isLocating || isChangingProvince}
                    className="text-[11px] text-muted hover:text-foreground transition-colors disabled:opacity-50 underline decoration-muted hover:decoration-foreground"
                  >
                    {isLocating ? 'Detecting…' : 'Use my location'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
          >
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </motion.div>
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

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-border z-50">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors text-muted hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[10px] font-bold">Messages</span>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors text-[#22438c]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
