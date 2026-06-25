'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '@/components/pwa/firebase-provider';
import { ProvinceSelector, useProvinceSelection, type Province } from '@/components/pwa/province-selector';
import { LocationProvincePrompt } from '@/components/pwa/location-province-prompt';
import NotificationCard from '@/components/ui/NotificationCard';
import NotificationModal from '@/components/ui/NotificationModal';

interface Notification {
  _id: string;
  title: string;
  message: string;
  image?: string;
  attachments?: string;
  sentAt?: string;
  createdAt?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

export default function HomePage() {
  const {
    isSupported,
    token,
    isRegistering,
    registerDevice,
  } = usePWA();

  const {
    province,
    showSelector,
    isLoading: provinceLoading,
    selectProvince,
    setShowSelector,
  } = useProvinceSelection();

  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [provinceConfirm, setProvinceConfirm] = useState<string | null>(null);
  const [isChangingProvince, setIsChangingProvince] = useState(false);
  const router = useRouter();
  const pathname = '/';

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoadingNotifications(true);
      try {
        const userProvince = localStorage.getItem('userProvince') || '';
        const params = new URLSearchParams({ limit: '50' });
        if (userProvince && userProvince !== 'unknown') {
          params.set('province', userProvince);
        }
        const response = await fetch(`/api/notifications?${params.toString()}`);
        const data = await response.json();
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [province]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const notifId = urlParams.get('notification');
    if (!notifId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/notifications/${notifId}`);
        const data = await res.json();
        if (!cancelled && data.success && data.notification) {
          setSelectedNotification(data.notification);
          setIsModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to open notification:', err);
      } finally {
        if (!cancelled) window.history.replaceState({}, document.title, '/');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as unknown as { prompt: () => void }).prompt();
    const { outcome } = await (deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const handleEnableNotifications = async () => {
    const savedProvince = localStorage.getItem('userProvince') || undefined;
    await registerDevice(savedProvince);
  };

  const handleProvinceChange = async (newProvince: string) => {
    setIsChangingProvince(true);
    selectProvince(newProvince as Province);
    setProvinceConfirm(newProvince);

    if (token) {
      try {
        const response = await fetch('/api/device/province', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken: token, province: newProvince }),
        });
        if (!response.ok) await registerDevice(newProvince);
      } catch {
        try { await registerDevice(newProvince); } catch {}
      }
    }

    setTimeout(() => {
      setProvinceConfirm(null);
      setIsChangingProvince(false);
    }, 3000);
  };

  const showLocationPrompt = !province && !provinceLoading && !showSelector;

  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      {showLocationPrompt && (
        <LocationProvincePrompt
          isOpen
          onProvinceResolved={(p) => handleProvinceChange(p)}
          onChooseManual={() => setShowSelector(true)}
        />
      )}
      {showSelector && (
        <ProvinceSelector
          onSelect={handleProvinceChange}
          onClose={() => setShowSelector(false)}
          isOpen={showSelector}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-8">
        <AnimatePresence>
          {!token && isSupported && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <button
                onClick={handleEnableNotifications}
                disabled={isRegistering}
                className="w-full py-3.5 px-6 bg-[#22438c] hover:bg-[#1a3575] disabled:bg-[#22438c]/50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#22438c]/10"
              >
                {isRegistering ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enabling...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Enable Notifications
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {token && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-[#22438c]/5 border border-[#22438c]/10 rounded-xl"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-[#d0a953]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-[#22438c] font-semibold text-sm text-center">
                  Notifications enabled — you&apos;re all set
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isInstalled && deferredPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-6"
            >
              <button
                onClick={handleInstall}
                className="w-full py-3 px-6 bg-white hover:bg-slate-50 border border-slate-200 text-[#22438c] font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-5 h-5 text-[#22438c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install App
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#22438c] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Notifications</h2>
          </div>
          {province && province !== 'unknown' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-semibold text-[#d0a953] bg-[#22438c]/5 px-3 py-1.5 rounded-full border border-[#22438c]/10"
            >
              {province}
              {provinceConfirm && (
                <span className="ml-1.5 text-[10px] text-green-600">✓ Saved</span>
              )}
            </motion.span>
          )}
        </motion.div>

        {isLoadingNotifications ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl shrink-0 animate-pulse" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
                    <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
                    <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-9 h-9 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-muted-text text-sm font-medium">No notifications yet</p>
            <p className="text-muted text-xs mt-1">Check back later for updates</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {notifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <NotificationCard
                  notification={notification}
                  index={index}
                  onClick={() => handleNotificationClick(notification)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        notification={selectedNotification}
      />

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          <button
            onClick={() => router.push('/')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
              pathname === '/' ? 'text-[#22438c]' : 'text-muted hover:text-foreground'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[10px] font-semibold">Messages</span>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
              pathname === '/profile' ? 'text-[#22438c]' : 'text-muted hover:text-foreground'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-semibold">Profile</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
