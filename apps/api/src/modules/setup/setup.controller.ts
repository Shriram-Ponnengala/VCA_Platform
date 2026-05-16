import { Request, Response } from 'express';
import { SetupService } from './setup.service';
const service = new SetupService();

export class SetupController {
  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
}
