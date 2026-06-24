'use client';

import { useEffect, useState, ReactNode } from 'react';

function useFirebaseMessagingWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Firebase Messaging Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('Firebase Messaging Service Worker registration failed:', error);
      });
  }, []);
}

interface ServiceWorkerRegistrationOptions {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

function useServiceWorkerRegistration(options?: ServiceWorkerRegistrationOptions) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('Service Worker registered:', swRegistration);

        setRegistration(swRegistration);
        setIsRegistered(true);

        swRegistration.addEventListener('updatefound', () => {
          const newWorker = swRegistration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New version available');
                options?.onUpdate?.(swRegistration);
              }
            });
          }
        });

        options?.onSuccess?.(swRegistration);
      } catch (err) {
        console.error('Service Worker registration failed:', err);
        setError(err instanceof Error ? err : new Error('Registration failed'));
        options?.onError?.(err instanceof Error ? err : new Error('Registration failed'));
      }
    };

    registerServiceWorker();
  }, [options]);

  return { registration, isRegistered, error };
}

export function ServiceWorkerRegistration({ 
  children,
}: {
  children: ReactNode;
}) {
  useFirebaseMessagingWorker();
  useServiceWorkerRegistration();
  
  return <>{children}</>;
}
