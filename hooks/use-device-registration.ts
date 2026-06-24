'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getToken, getMessaging } from 'firebase/messaging';
import { initFirebase, firebaseConfig } from '@/lib/firebase/client';

/**
 * Device information interface
 */
export interface DeviceInfo {
  browser: string;
  platform: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown';
  os: string;
  userAgent: string;
}

/**
 * Registration result
 */
export interface RegistrationResult {
  success: boolean;
  deviceId?: string;
  isNew?: boolean;
  error?: string;
}

/**
 * Parse user agent to extract device info
 */
function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  let platform: DeviceInfo['platform'] = 'unknown';
  let browser = 'unknown';
  let os = '';
  
  // Detect platform
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
  
  // Detect browser
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
  };
}

/**
 * Hook for device registration
 * Handles:
 * 1. Notification permission request
 * 2. FCM token generation
 * 3. Sending token to API
 * 4. Storing device in MongoDB
 */
export function useDeviceRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Check current permission status on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    // Check if already registered this session
    const registered = sessionStorage.getItem('deviceRegistered');
    if (registered) {
      setIsRegistered(true);
      setDeviceId(registered);
    }
  }, []);

  // Generate FCM token
  const generateToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    try {
      // Initialize Firebase
      initFirebase();

      const messaging = getMessaging();
      if (!messaging) {
        throw new Error('Failed to initialize messaging');
      }

      const vapidKey = firebaseConfig.vapidKey;
      if (!vapidKey) {
        throw new Error('VAPID key not configured');
      }

      const token = await getToken(messaging, { vapidKey });
      return token;
    } catch (err) {
      console.error('Error generating FCM token:', err);
      return null;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    if (!('Notification' in window)) {
      setError('Notifications are not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request notification permission');
      return false;
    }
  }, []);

  // Send token to API
  const sendToAPI = useCallback(async (token: string, deviceInfo: DeviceInfo, province?: string): Promise<RegistrationResult> => {
    try {
      // Get persistent device ID
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('deviceId') : null;
      
      const response = await fetch('/api/devices/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcmToken: token,
          deviceId: deviceId || undefined,
          browser: deviceInfo.browser,
          platform: deviceInfo.platform,
          os: deviceInfo.os,
          lastSeen: new Date().toISOString(),
          province,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to register device',
        };
      }

      return {
        success: true,
        deviceId: data.deviceId,
        isNew: data.isNew,
      };
    } catch (err) {
      console.error('Error sending to API:', err);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }, []);

  // Complete registration flow
  const registerDevice = useCallback(async (province?: string): Promise<RegistrationResult> => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Must run in browser' };
    }

    setIsRegistering(true);
    setError(null);

    try {
      // Step 1: Request notification permission
      const granted = await requestPermission();
      if (!granted) {
        const result = { success: false, error: 'Notification permission denied' };
        setError(result.error || 'Permission denied');
        setIsRegistering(false);
        return result;
      }

      // Step 2: Generate FCM token
      const token = await generateToken();
      if (!token) {
        const result = { success: false, error: 'Failed to generate FCM token' };
        setError(result.error || 'Token generation failed');
        setIsRegistering(false);
        return result;
      }

      // Step 3: Get device info
      const userAgent = navigator.userAgent || '';
      const deviceInfo = parseUserAgent(userAgent);

      // Step 4: Send to API
      const result = await sendToAPI(token, deviceInfo, province);

      if (result.success) {
        setIsRegistered(true);
        setDeviceId(result.deviceId || null);
        sessionStorage.setItem('deviceRegistered', result.deviceId || '');
        
        // Store province in localStorage if provided
        if (province) {
          localStorage.setItem('userProvince', province);
        }
      } else {
        setError(result.error || 'Registration failed');
      }

      setIsRegistering(false);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
      setIsRegistering(false);
      return { success: false, error: errorMsg };
    }
  }, [generateToken, requestPermission, sendToAPI]);

  // Check if device can register
  const canRegister = permission !== 'denied' && permission !== 'unsupported';

  // Update province for existing device
  const updateProvince = useCallback(async (newProvince: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const token = sessionStorage.getItem('fcmToken');
    if (!token) {
      console.error('No FCM token found');
      return false;
    }

    try {
      const response = await fetch('/api/device/province', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcmToken: token,
          province: newProvince,
        }),
      });

      if (response.ok) {
        localStorage.setItem('userProvince', newProvince);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating province:', err);
      return false;
    }
  }, []);

  return {
    registerDevice,
    updateProvince,
    isRegistering,
    isRegistered,
    permission,
    error,
    deviceId,
    canRegister,
  };
}

export default useDeviceRegistration;
