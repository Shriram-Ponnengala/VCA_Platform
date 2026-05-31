import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wdfghjifghjoixcvhjk'
);

const service = new AttendanceService();

export class AttendanceController {
  async getAll(req: Request, res: Response) { try { res.json(await service.getAll()); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }

  private async getUserFromReq(req: Request) {
    const token = req.cookies['auth-token'];
    if (!token) return null;
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      return payload;
    } catch (e) {
      return null;
    }
  }

  async getMakeovers(req: Request, res: Response) {
    try {
      const user = await this.getUserFromReq(req);
      res.json(await service.getMakeovers(user));
    } catch (e:any) {
      res.status(500).json({ error: e.message });
    }
  }

  async assignMakeover(req: Request, res: Response) {
    try {
      const user = await this.getUserFromReq(req);
      res.json(await service.assignMakeover(req.params.id as string, req.body, user));
    } catch (e:any) {
      res.status(500).json({ error: e.message });
    }
  }

  async completeMakeover(req: Request, res: Response) {
    try {
      const user = await this.getUserFromReq(req);
      res.json(await service.completeMakeover(req.params.id as string, user));
    } catch (e:any) {
      res.status(500).json({ error: e.message });
    }
  }
}
