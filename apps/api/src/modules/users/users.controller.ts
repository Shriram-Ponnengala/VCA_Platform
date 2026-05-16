import { Request, Response } from 'express';
import { UsersService } from './users.service';
const service = new UsersService();

export class UsersController {
  async getAll(req: Request, res: Response) { 
    try { 
      const role = req.query.role as string;
      res.json(await service.getAll(role)); 
    } catch (e:any) { 
      res.status(500).json({ error: e.message }); 
    } 
  }
  async getById(req: Request, res: Response) { try { res.json(await service.getById(req.params.id as string)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async update(req: Request, res: Response) { try { res.json(await service.update(req.params.id as string, req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async delete(req: Request, res: Response) { try { res.json(await service.delete(req.params.id as string)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
}
