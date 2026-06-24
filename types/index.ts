import { RowDataPacket } from 'mysql2/promise';

export interface IDevice extends RowDataPacket {
  id: number;
  fcm_token: string;
  province: string;
  platform: string;
  browser: string;
  user_agent: string;
  created_at: Date;
  updated_at: Date;
}

export interface INotification extends RowDataPacket {
  id: number;
  title: string;
  message: string;
  image_url: string;
  attachments?: string | null;
  link: string;
  sent_by_admin: string;
  target_province: string;
  status: 'sent' | 'pending' | 'failed' | 'scheduled';
  sent_count: number;
  delivered_count?: number;
  opened_count?: number;
  sent_at: Date | null;
  scheduled_at: Date | null;
  created_at: Date;
}

export interface IAdmin {
  id: number;
  email: string;
  password_hash: string;
  role: 'ADMIN';
  created_at: Date;
  last_login: Date | null;
}

export interface DeviceRegistrationBody {
  fcmToken: string;
  province?: string;
  platform?: string;
  browser?: string;
  userAgent?: string;
}

export interface SendNotificationBody {
  title: string;
  message: string;
  image?: string;
  attachments?: Array<{ name: string; mime: string; dataUrl: string }>;
  link?: string;
  scheduledAt?: string;
  targetProvince?: string;
}

export interface AdminLoginBody {
  username: string;
  password: string;
}

export interface JwtPayload {
  adminId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface FCMMessage {
  notification?: {
    title: string;
    body: string;
    image?: string;
  };
  data?: Record<string, string>;
  webpush?: {
    headers?: {
      Urgency?: 'high' | 'normal' | 'low';
    };
    notification?: {
      icon?: string;
      badge?: string;
      tag?: string;
      title?: string;
      body?: string;
      image?: string;
      data?: Record<string, string>;
    };
    fcmOptions?: {
      link?: string;
    };
    data?: Record<string, string>;
  };
  tokens: string[];
}

export interface DeviceStats {
  total: number;
  active: number;
  inactive: number;
  byPlatform: Record<string, number>;
  byBrowser: Record<string, number>;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  scheduled: number;
  averageRecipients: number;
}
