import { NextRequest, NextResponse } from 'next/server';
import { resolveProvinceFromLatLng } from '@/lib/location/resolveProvinceFromLatLng';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }
    const province = await resolveProvinceFromLatLng(lat, lng);
    return NextResponse.json({ success: true, province });
  } catch {
    return NextResponse.json({ error: 'Failed to resolve province' }, { status: 500 });
  }
}
