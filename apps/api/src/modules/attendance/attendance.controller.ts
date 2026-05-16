import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service';
const service = new AttendanceService();

export class AttendanceController {
  async getAll(req: Request, res: Response) { try { res.json(await service.getAll()); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
}
