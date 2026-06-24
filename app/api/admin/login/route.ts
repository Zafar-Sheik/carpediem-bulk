import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAdminToken, setAdminSession, getAdminSession } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const isValid = await authenticateAdmin(username, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await createAdminToken({
      adminId: 'admin',
      username,
      email: username,
      role: 'ADMIN',
    });

    await setAdminSession(token);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { username, role: 'ADMIN' },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: session.username,
        role: session.role,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, error: String(error) },
      { status: 200 }
    );
  }
}
