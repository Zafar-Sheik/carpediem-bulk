import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import {
  firebaseConfig,
  isFirebaseConfigured,
  getFirebaseSetupMessage,
  getMissingFirebasePublicEnvKeys,
  type FirebaseClientConfig,
} from './config';

export type { FirebaseClientConfig };
export { firebaseConfig, isFirebaseConfigured, getFirebaseSetupMessage, getMissingFirebasePublicEnvKeys };

let messagingInstance: Messaging | null = null;
let appInstance: FirebaseApp | null = null;

export function initFirebase(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    console.warn('Firebase Client can only be initialized in browser');
    return null;
  }

  if (!isFirebaseConfigured()) {
    console.warn(getFirebaseSetupMessage() || 'Firebase env vars are incomplete.');
    messagingInstance = null;
    return null;
  }

  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(firebaseConfig);
    }
    return appInstance;
  } catch (error) {
    console.error('Firebase Client initialization error:', error);
    messagingInstance = null;
    return null;
  }
}

export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!messagingInstance) {
    const app = appInstance || initFirebase();
    if (app) {
      try {
        messagingInstance = getMessaging(app);
      } catch (error) {
        console.error('Error getting messaging instance:', error);
        messagingInstance = null;
        return null;
      }
    }
  }

  return messagingInstance;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function isNotificationsSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') {
    return 'denied';
  }

  if (!('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

export async function getFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!('Notification' in window)) {
    return null;
  }

  if (!isFirebaseConfigured()) {
    console.warn(getFirebaseSetupMessage());
    return null;
  }

  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      return null;
    }

    const vapidKey = firebaseConfig.vapidKey.trim();
    if (!vapidKey) {
      console.error('VAPID key not configured');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export function onForegroundMessage(
  callback: (payload: unknown) => void
): () => void {
  const messaging = getMessagingInstance();

  if (!messaging) {
    console.warn('Messaging not available');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

export default initFirebase;
