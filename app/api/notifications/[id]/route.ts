import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { INotification } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    const rows = await query<INotification[]>(
      'SELECT id, title, message, image_url, attachments, link, status, sent_at, created_at FROM notifications WHERE id = ?',
      [numericId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    const n = rows[0];
    const sentAt = n.sent_at || n.created_at;

    return NextResponse.json({
      success: true,
      notification: {
        _id: n.id.toString(),
        title: n.title,
        message: n.message,
        image: n.image_url || '',
        attachments: n.attachments || '',
        link: n.link || '',
        sentAt: sentAt ? new Date(sentAt).toISOString() : undefined,
        createdAt: n.created_at ? new Date(n.created_at).toISOString() : undefined,
        status: n.status,
      },
    });
  } catch (error) {
    console.error('Fetch notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}
