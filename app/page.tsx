'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function HomePage() {
  const {
    isSupported,
    token,
    isRegistering,
    registerDevice
  } = usePWA();

  const {
    province,
    showSelector,
    isLoading: provinceLoading,
    selectProvince,
    setShowSelector
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
    <main className="min-h-screen bg-slate-950 pb-24">
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

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        {!token && isSupported && (
          <div className="mb-6">
            <button
              onClick={handleEnableNotifications}
              disabled={isRegistering}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20"
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
          </div>
        )}

        {token && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-400 font-medium text-sm text-center">
              Notifications enabled - you're all set
            </p>
          </div>
        )}

        {!isInstalled && deferredPrompt && (
          <div className="mb-6">
            <button
              onClick={handleInstall}
              className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Install App
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          {province && province !== 'unknown' && (
            <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              {province}
            </span>
          )}
        </div>

        {isLoadingNotifications ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-700/60 rounded w-full" />
                    <div className="h-3 bg-slate-700/60 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                index={index}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>

      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        notification={selectedNotification}
      />

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-50">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          <button
            onClick={() => router.push('/')}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              pathname === '/' ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-[10px] font-medium">Messages</span>
          </button>

          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-slate-500"
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
