import admin from 'firebase-admin';

interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

let isInitialized = false;

function getServiceAccount(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function initFirebaseAdmin(): admin.app.App {
  const existingApps = admin.apps;
  if (existingApps.length > 0) {
    isInitialized = true;
    return existingApps[0] as admin.app.App;
  }

  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    throw new Error(
      'Firebase Admin credentials not configured. ' +
      'Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');
    return app;
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw error;
  }
}

export function getFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    isInitialized = true;
    return admin.apps[0] as admin.app.App;
  }
  
  if (!isInitialized) {
    return initFirebaseAdmin();
  }
  return admin.app();
}

export function getMessaging(): admin.messaging.Messaging {
  console.log('Firebase Admin: Getting messaging service...');
  const app = getFirebaseAdmin();
  console.log('Firebase Admin: App initialized, getting messaging');
  return app.messaging();
}

export function isFirebaseAdminConfigured(): boolean {
  return getServiceAccount() !== null;
}

export async function sendToDevice(
  token: string,
  payload: admin.messaging.Message
): Promise<string> {
  const messaging = getMessaging();
  return messaging.send({ ...payload, token });
}

export async function sendToDevices(
  tokens: string[],
  payload: admin.messaging.Message
): Promise<admin.messaging.BatchResponse> {
  const messaging = getMessaging();
  return messaging.sendEachForMulticast({
    ...payload,
    tokens,
  });
}

export async function sendToTopic(
  topic: string,
  payload: admin.messaging.Message
): Promise<string> {
  const messaging = getMessaging();
  return messaging.send({ ...payload, topic });
}

export default initFirebaseAdmin;
