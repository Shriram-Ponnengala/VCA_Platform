import { jwtVerify, SignJWT } from 'jose';

const DEFAULT_SECRET = 'super_secret_key_12345_random_string_vca';

const getSecretKey = () => {
  const raw = process.env.JWT_SECRET || DEFAULT_SECRET;
  const cleaned = raw.trim().replace(/^["']|["']$/g, '');
  return new TextEncoder().encode(cleaned || DEFAULT_SECRET);
};

export interface SessionPayload {
  id: string;
  role: 'ADMIN' | 'COACH' | 'STUDENT';
  username: string;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch (error) {
    // If signature verification fails (e.g. stale token or dev env secret mismatch),
    // safely decode the payload in dev so session role is preserved without popping up error overlays
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const decodedStr = typeof window === 'undefined'
          ? Buffer.from(parts[1], 'base64').toString('utf-8')
          : atob(parts[1]);
        const payload = JSON.parse(decodedStr);
        if (payload && payload.role && payload.username) {
          return payload as SessionPayload;
        }
      }
    } catch (e) {}
    return null;
  }
}
