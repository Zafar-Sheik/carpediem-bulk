import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import type { IDevice } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fcmToken, province, platform, browser, userAgent } = body;

    if (!fcmToken) {
      return NextResponse.json({ error: 'FCM token is required' }, { status: 400 });
    }

    const existing = await query<IDevice[]>(
      'SELECT id FROM devices WHERE fcm_token = ?',
      [fcmToken]
    );

    if (existing.length > 0) {
      const updates: string[] = [];
      const values: string[] = [];

      if (province) { updates.push('province = ?'); values.push(province); }
      if (platform) { updates.push('platform = ?'); values.push(platform); }
      if (browser) { updates.push('browser = ?'); values.push(browser); }
      if (userAgent) { updates.push('user_agent = ?'); values.push(userAgent); }

      if (updates.length > 0) {
        values.push(fcmToken);
        await execute(
          `UPDATE devices SET ${updates.join(', ')} WHERE fcm_token = ?`,
          values
        );
      }
      return NextResponse.json({ success: true, message: 'Device updated' });
    }

    await execute(
      `INSERT INTO devices (fcm_token, province, platform, browser, user_agent) VALUES (?, ?, ?, ?, ?)`,
      [fcmToken, province || '', platform || '', browser || '', userAgent || '']
    );

    return NextResponse.json({ success: true, message: 'Device registered' });
  } catch (error) {
    console.error('Device registration error:', error);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Device registration endpoint' });
}
