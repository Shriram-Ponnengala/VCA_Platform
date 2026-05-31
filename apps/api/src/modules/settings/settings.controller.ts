import { Request, Response } from 'express';
import { SettingsService } from './settings.service';
const service = new SettingsService();

export class SettingsController {
  async get(req: Request, res: Response) { 
    try { 
      res.json(await service.get(req.params.key)); 
    } catch (e:any) { 
      res.status(500).json({ error: e.message }); 
    } 
  }

  async upsert(req: Request, res: Response) { 
    try { 
      res.json(await service.upsert(req.params.key, req.body)); 
    } catch (e:any) { 
      res.status(500).json({ error: e.message }); 
    } 
  }
}
