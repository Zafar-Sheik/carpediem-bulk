import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import type { JwtPayload } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

const COOKIE_NAME = 'admin_session';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
/** Only use bcrypt when a non-empty hash is set (Vercel sometimes stores ""). */
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH?.trim() || '';
/** Plaintext fallback when no hash; matches env template when env vars are missing (e.g. Vercel). */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

export interface AdminSession {
  adminId: string;
  email: string;
  role: 'ADMIN';
  iat?: number;
  exp?: number;
  username?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  
  return token;
}

export async function createAdminToken(payload: Omit<AdminSession, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  
  return token;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function setSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function setAdminSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) return null;
  
  return verifyAdminToken(token);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function authenticateAdmin(username: string, password: string): Promise<boolean> {
  const user = username.trim();
  if (user === ADMIN_EMAIL.trim() || user === ADMIN_USERNAME.trim()) {
    if (ADMIN_PASSWORD_HASH) {
      return verifyPassword(password, ADMIN_PASSWORD_HASH);
    }
    return password === ADMIN_PASSWORD;
  }
  return false;
}

export async function authenticateAdminByEmail(email: string, password: string): Promise<boolean> {
  if (email.trim() !== ADMIN_EMAIL.trim()) {
    return false;
  }

  if (ADMIN_PASSWORD_HASH) {
    return verifyPassword(password, ADMIN_PASSWORD_HASH);
  }

  return password === ADMIN_PASSWORD;
}

export async function adminAuthMiddleware(request: NextRequest) {
  const session = await getAdminSession();
  
  if (!session) {
    return {
      authorized: false,
      reason: 'No session',
      redirect: '/admin/login',
    };
  }
  
  if (session.role !== 'ADMIN') {
    return {
      authorized: false,
      reason: 'Insufficient permissions',
      redirect: '/admin/login',
    };
  }
  
  return {
    authorized: true,
    session,
  };
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (session: AdminSession) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await adminAuthMiddleware(request);
  
  if (!auth.authorized) {
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: auth.reason },
        { status: 401 }
      );
    }
    
    return NextResponse.redirect(new URL(auth.redirect || '/admin/login', request.url));
  }
  
  return handler((auth as { session: AdminSession }).session);
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  
  return session;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const session = await getAdminSession();
    return session?.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function requireAuth(): Promise<JwtPayload> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

export default adminAuthMiddleware;
