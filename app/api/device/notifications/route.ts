import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { IDevice, INotification } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fcmToken = searchParams.get('fcmToken');

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    const devices = await query<IDevice[]>(
      'SELECT province FROM devices WHERE fcm_token = ?',
      [fcmToken]
    );

    if (devices.length === 0) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const deviceProvince = devices[0].province;

    const notifications = await query<INotification[]>(
      `SELECT id, title, message, image_url, link, created_at
       FROM notifications
       WHERE status = 'sent' AND (target_province = 'All' OR target_province = ?)
       ORDER BY created_at DESC
       LIMIT 50`,
      [deviceProvince]
    );

    return NextResponse.json({
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        image: n.image_url || '',
        link: n.link || '',
        receivedAt: n.created_at,
      })),
      total: notifications.length,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
