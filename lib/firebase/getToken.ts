import { getToken as getClientToken } from 'firebase/messaging';
import { initFirebase, getMessagingInstance, firebaseConfig } from './client';
import { isFirebaseAdminConfigured } from './admin';
import { query, execute } from '@/lib/db';
import type { IDevice } from '@/types';

export interface DeviceInfo {
  platform: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown';
  browser: string;
  os: string;
  userAgent: string;
  language: string;
  appVersion?: string;
}

export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  let platform: DeviceInfo['platform'] = 'unknown';
  let browser = 'unknown';
  let os = '';

  if (ua.includes('android')) {
    platform = 'android';
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    platform = 'ios';
    os = ua.includes('ipad') ? 'iPadOS' : 'iOS';
  } else if (ua.includes('windows')) {
    platform = 'windows';
    os = 'Windows';
  } else if (ua.includes('mac')) {
    platform = 'mac';
    os = 'macOS';
  } else if (ua.includes('linux')) {
    platform = 'linux';
    os = 'Linux';
  }

  if (ua.includes('chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari')) {
    browser = 'Safari';
  } else if (ua.includes('edge')) {
    browser = 'Edge';
  } else if (ua.includes('opera')) {
    browser = 'Opera';
  }

  return {
    platform,
    browser,
    os,
    userAgent,
    language: 'en',
  };
}

export async function generateClientToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.error('generateClientToken must be called from browser');
    return null;
  }

  if (!firebaseConfig.vapidKey) {
    console.error('Firebase VAPID key not configured');
    return null;
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.error('Notification permission not granted');
    return null;
  }

  try {
    initFirebase();

    const messaging = getMessagingInstance();
    if (!messaging) {
      console.error('Failed to get messaging instance');
      return null;
    }

    const token = await getClientToken(messaging, {
      vapidKey: firebaseConfig.vapidKey,
    });

    return token;
  } catch (error) {
    console.error('Error generating FCM token:', error);
    return null;
  }
}

export async function registerDevice(
  fcmToken: string,
  deviceInfo?: Partial<DeviceInfo>
): Promise<string | null> {
  if (!fcmToken) {
    console.error('FCM token is required');
    return null;
  }

  try {
    const userAgent = deviceInfo?.userAgent || '';
    const parsedInfo = parseUserAgent(userAgent);

    const finalInfo: DeviceInfo = {
      ...parsedInfo,
      ...deviceInfo,
      platform: deviceInfo?.platform || parsedInfo.platform,
      browser: deviceInfo?.browser || parsedInfo.browser,
    };

    const existing = await query<IDevice[]>(
      'SELECT id FROM devices WHERE fcm_token = ?',
      [fcmToken]
    );

    if (existing.length > 0) {
      await execute(
        'UPDATE devices SET platform = ?, browser = ?, user_agent = ? WHERE fcm_token = ?',
        [finalInfo.platform, finalInfo.browser, finalInfo.userAgent, fcmToken]
      );

      console.log('Device updated:', existing[0].id);
      return existing[0].id.toString();
    }

    const result = await execute(
      'INSERT INTO devices (fcm_token, platform, browser, user_agent) VALUES (?, ?, ?, ?)',
      [fcmToken, finalInfo.platform, finalInfo.browser, finalInfo.userAgent]
    );

    console.log('Device registered:', result.insertId);
    return result.insertId.toString();
  } catch (error) {
    console.error('Error registering device:', error);
    return null;
  }
}

export async function completeDeviceRegistration(
  deviceInfo?: Partial<DeviceInfo>
): Promise<{
  success: boolean;
  token?: string;
  deviceId?: string;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Must be called from browser' };
  }

  if (!('Notification' in window)) {
    return { success: false, error: 'Notifications not supported' };
  }

  let permission: NotificationPermission = Notification.permission;

  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return { success: false, error: 'Permission denied' };
    }
  }

  if (permission !== 'granted') {
    return { success: false, error: 'Permission not granted' };
  }

  const token = await generateClientToken();
  if (!token) {
    return { success: false, error: 'Failed to generate token' };
  }

  const deviceId = await registerDevice(token, deviceInfo);
  if (!deviceId) {
    return { success: false, error: 'Failed to register device' };
  }

  return {
    success: true,
    token,
    deviceId,
  };
}

export async function unregisterDevice(fcmToken: string): Promise<boolean> {
  if (!fcmToken) {
    return false;
  }

  try {
    await execute('DELETE FROM devices WHERE fcm_token = ?', [fcmToken]);
    console.log('Device unregistered:', fcmToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('Error unregistering device:', error);
    return false;
  }
}

export function isFCMConfigured(): boolean {
  const clientConfigured = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.vapidKey
  );

  const serverConfigured = isFirebaseAdminConfigured();

  return clientConfigured && serverConfigured;
}

export default completeDeviceRegistration;
