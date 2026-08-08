import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service';
import * as jose from 'jose';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'super_secret_key_12345_random_string_vca';
  return new TextEncoder().encode(secret.replace(/^"|"$/g, ''));
};

const service = new AttendanceService();

export class AttendanceController {
  async getAll(req: Request, res: Response) { try { res.json(await service.getAll()); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }

  private async getUserFromReq(req: Request) {
    const token = req.cookies['auth-token'];
    if (!token) return null;
    try {
      const { payload } = await jose.jwtVerify(token, getSecretKey());
      return payload;
    } catch (e) {
      return null;
    }
  }

  async getBatchSessions(req: Request, res: Response) {
    try {
      res.json(await service.getBatchSessions(req.params.batchId as string));
    } catch (e:any) {
      res.status(500).json({ error: e.message });
    }
  }

  async createBatchSession(req: Request, res: Response) {
    try {
      const user = await this.getUserFromReq(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      
      const payload = { ...req.body, createdById: user.id };
      res.json(await service.createBatchSession(payload));
    } catch (e:any) {
      res.status(500).json({ error: e.message });
    }
  }

  async getAttendanceRecords(req: Request, res: Response) {
    try {
      res.json(await service.getAttendanceRecords(req.params.sessionId as string));
    } catch (e:any) {
      res.status(500).json({ error: e.message });
    }
  }

  async upsertAttendanceRecords(req: Request, res: Response) {
    try {
      const user = await this.getUserFromReq(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      
      const records = req.body.records;
      res.json(await service.upsertAttendanceRecords(req.params.sessionId as string, records, user.id as string));
    } catch (e:any) {
      res.status(500).json({ error: e.message });
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
