import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { INotification } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 50;
    const province = searchParams.get('province');

    let notifications: INotification[];

    if (province && province !== 'unknown') {
      notifications = await query<INotification[]>(
        `SELECT id, title, message, image_url, attachments, link, created_at
         FROM notifications
         WHERE status = 'sent' AND (target_province = 'All' OR target_province = ?)
         ORDER BY created_at DESC
         LIMIT ?`,
        [province, limit]
      );
    } else {
      notifications = await query<INotification[]>(
        `SELECT id, title, message, image_url, attachments, link, created_at
         FROM notifications
         WHERE status = 'sent' AND target_province = 'All'
         ORDER BY created_at DESC
         LIMIT ?`,
        [limit]
      );
    }

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => {
        const created = n.created_at ? new Date(n.created_at as Date | string).toISOString() : undefined;
        return {
          _id: String(n.id),
          title: n.title,
          message: n.message,
          image: n.image_url || '',
          attachments: n.attachments || '',
          link: n.link || '',
          createdAt: created,
        };
      }),
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        ...(process.env.NODE_ENV === 'development' && {
          debug: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
