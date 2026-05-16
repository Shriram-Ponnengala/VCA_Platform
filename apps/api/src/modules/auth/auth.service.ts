import { AuthRepository } from './auth.repository';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const authRepo = new AuthRepository();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wdfghjifghjoixcvhjk'
);

export class AuthService {
  async login(username: string, password: string) {
    if (!username || !password) throw new Error('Username and password required');
    const user = await authRepo.findByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    const token = await new jose.SignJWT({ id: user.id, username: user.username, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      token,
      user: userWithoutPassword,
      role: user.role,
      profile: user.role === 'STUDENT' ? user.student : (user.role === 'COACH' ? user.coach : null)
    };
  }
}