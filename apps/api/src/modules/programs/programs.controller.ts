import { Request, Response } from 'express';
import { ProgramsService } from './programs.service';
const service = new ProgramsService();

export class ProgramsController {
  async getAll(req: Request, res: Response) { try { res.json(await service.getAll()); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async getById(req: Request, res: Response) { try { res.json(await service.getById(req.params.id as string)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async update(req: Request, res: Response) { try { res.json(await service.update(req.params.id as string, req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async delete(req: Request, res: Response) { try { res.json(await service.delete(req.params.id as string)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
}
