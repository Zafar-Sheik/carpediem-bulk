import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import type { IDevice } from '@/types';

interface ProvinceUpdateBody {
  fcmToken: string;
  province: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body: ProvinceUpdateBody = await request.json();
    const { fcmToken, province } = body;

    if (!fcmToken) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    if (!province) {
      return NextResponse.json(
        { error: 'Province is required' },
        { status: 400 }
      );
    }

    const validProvinces = [
      'Gauteng',
      'KwaZulu-Natal',
      'Western Cape',
      'Eastern Cape',
      'Free State',
      'Limpopo',
      'Mpumalanga',
      'North West',
      'Northern Cape',
      'unknown',
    ];

    if (!validProvinces.includes(province)) {
      return NextResponse.json(
        { error: 'Invalid province' },
        { status: 400 }
      );
    }

    const result = await execute(
      'UPDATE devices SET province = ? WHERE fcm_token = ?',
      [province, fcmToken]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    const [updated] = await query<IDevice[]>(
      'SELECT province FROM devices WHERE fcm_token = ?',
      [fcmToken]
    );

    return NextResponse.json({
      success: true,
      message: 'Province updated successfully',
      province: updated.province,
    });
  } catch (error) {
    console.error('Province update error:', error);
    return NextResponse.json(
      { error: 'Failed to update province' },
      { status: 500 }
    );
  }
}
