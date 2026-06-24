'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  initFirebase,
  requestNotificationPermission,
  getFcmToken,
  onForegroundMessage,
  isNotificationsSupported,
  getNotificationPermission,
  isFirebaseConfigured,
  getFirebaseSetupMessage,
} from '@/lib/firebase/client';

function parseUserAgent(userAgent: string) {
  const ua = (userAgent || '').toLowerCase();
  let platform = '';
  let browser = '';

  if (ua.includes('android')) platform = 'android';
  else if (ua.includes('iphone') || ua.includes('ipad')) platform = 'ios';
  else if (ua.includes('windows')) platform = 'windows';
  else if (ua.includes('mac')) platform = 'mac';
  else if (ua.includes('linux')) platform = 'linux';

  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';

  return { platform, browser };
}

interface PWAContextType {
  isReady: boolean;
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  isRegistering: boolean;
  error: string | null;
  registerDevice: (province?: string) => Promise<void>;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider');
  }
  return context;
}

async function waitForServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing?.active) return;

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 5000);
    navigator.serviceWorker.ready.then(() => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [token, setToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerDevice = async (province?: string) => {
    if (!isSupported) {
      setError('Notifications not supported');
      return;
    }

    if (!isFirebaseConfigured()) {
      setError(getFirebaseSetupMessage() || 'Push notifications are not configured for this app.');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      let perm = getNotificationPermission() as NotificationPermission;
      setPermission(perm);

      if (perm !== 'granted') {
        perm = await requestNotificationPermission();
        setPermission(perm);

        if (perm !== 'granted') {
          setError('Permission denied');
          setIsRegistering(false);
          return;
        }
      }

      initFirebase();
      await waitForServiceWorker();

      const fcmToken = await getFcmToken();

      if (fcmToken) {
        setToken(fcmToken);

        const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
        const deviceInfo = parseUserAgent(userAgent);

        const response = await fetch('/api/device/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fcmToken,
            province,
            platform: deviceInfo.platform,
            browser: deviceInfo.browser,
            userAgent,
          }),
        });

        if (response.ok) {
          localStorage.setItem('deviceRegistered', 'true');
          localStorage.setItem('fcmToken', fcmToken);
          if (province) {
            localStorage.setItem('userProvince', province);
          }
        }
      } else {
        setError(
          getFirebaseSetupMessage() ||
            'Failed to get notification token. Allow notifications, use Chrome or Edge, and try again.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const supported = isNotificationsSupported();
      setIsSupported(supported);

      if (supported) {
        const perm = getNotificationPermission() as NotificationPermission;
        setPermission(perm);

        if (perm === 'granted') {
          const storedToken = localStorage.getItem('fcmToken');
          if (storedToken) {
            setToken(storedToken);
          } else {
            try {
              initFirebase();
              await waitForServiceWorker();
              const newToken = await getFcmToken();
              if (newToken) {
                setToken(newToken);
                localStorage.setItem('fcmToken', newToken);
                localStorage.setItem('deviceRegistered', 'true');
              }
            } catch (e) {
              console.error('Error getting token:', e);
            }
          }
        }
      }

      initFirebase();
      setIsReady(true);
    };

    init();
  }, []);

  useEffect(() => {
    if (!isReady || !isSupported) return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('FCM message:', payload);
    });

    return () => { unsubscribe(); };
  }, [isReady, isSupported]);

  return (
    <PWAContext.Provider
      value={{
        isReady,
        isSupported,
        permission,
        token,
        isRegistering,
        error,
        registerDevice,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
