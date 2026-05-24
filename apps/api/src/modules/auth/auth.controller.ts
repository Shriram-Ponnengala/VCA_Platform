import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.cookie('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 1000 // 24 hours
      });

      return res.json({ success: true, user: result.user, role: result.role, profile: result.profile });
    } catch (e: any) {
      console.error("FULL PRISMA ERROR:", e);
      return res.status(400).json({ error: e.message });
    }
  }

  async logout(req: Request, res: Response) {
    res.clearCookie('auth-token');
    return res.json({ success: true });
  }
}