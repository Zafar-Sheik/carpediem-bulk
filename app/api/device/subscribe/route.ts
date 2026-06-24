import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig, isFirebaseConfigured } from '@/lib/firebase/config';

export async function GET() {
  if (!isFirebaseConfigured()) {
    return NextResponse.json(
      { error: 'Firebase is not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    config: {
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      vapidKey: firebaseConfig.vapidKey,
    },
  });
}
