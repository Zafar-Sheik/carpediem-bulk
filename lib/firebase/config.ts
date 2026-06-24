const trimEnv = (v: string | undefined) => String(v ?? '').trim();

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

/**
 * Defaults match `public/firebase-messaging-sw.js` so FCM works when
 * NEXT_PUBLIC_* vars are missing at build time. Override via env for other projects.
 */
const PUBLIC_FIREBASE_DEFAULT: FirebaseClientConfig = {
  apiKey: 'AIzaSyAef0hFlHEWTise8yU88q-IYw7esxX2j54',
  authDomain: 'bulk-notification-26726.firebaseapp.com',
  projectId: 'bulk-notification-26726',
  storageBucket: 'bulk-notification-26726.firebasestorage.app',
  messagingSenderId: '1094002262397',
  appId: '1:1094002262397:web:16f1fee5153ef171eb4c14',
  vapidKey: 'BIXK3FCkbcr8j5ZMyFYHS7ZIpYxTWa2C5Fpuk1wzDmuufnE8Qe51CjNwsxhNQAYTB4C8bMY_BXHrfe_DOAgvY6I',
};

function resolveFirebaseConfig(): FirebaseClientConfig {
  const d = PUBLIC_FIREBASE_DEFAULT;
  return {
    apiKey: trimEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || d.apiKey,
    authDomain: trimEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || d.authDomain,
    projectId: trimEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || d.projectId,
    storageBucket: trimEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || d.storageBucket,
    messagingSenderId: trimEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || d.messagingSenderId,
    appId: trimEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || d.appId,
    vapidKey: trimEnv(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) || d.vapidKey,
  };
}

export const firebaseConfig = resolveFirebaseConfig();

export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseConfig.vapidKey
  );
}

export function getMissingFirebasePublicEnvKeys(): string[] {
  const pairs: [string, string][] = [
    ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
    ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
    ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
    ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
    ['NEXT_PUBLIC_FIREBASE_VAPID_KEY', firebaseConfig.vapidKey],
  ];
  return pairs.filter(([, v]) => !String(v || '').trim()).map(([k]) => k);
}

export function getFirebaseSetupMessage(): string {
  const missing = getMissingFirebasePublicEnvKeys();
  if (missing.length === 0) return '';
  return `Firebase is not configured for the browser. Add and rebuild: ${missing.join(', ')}.`;
}
