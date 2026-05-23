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
  private handleError(res: Response, e: any) {
    const message = e?.message || String(e);
    if (e?.code === 'P2002' || message.includes('Unique constraint failed')) {
      let field = 'field';
      if (e?.meta?.target?.[0]) {
        field = e.meta.target[0];
      } else {
        const fieldMatch = message.match(/fields: \(`(.*?)`\)/) || message.match(/fields: \('(.*?)'\)/) || message.match(/fields: \((.*?)\)/);
        if (fieldMatch && fieldMatch[1]) field = fieldMatch[1];
      }
      return res.status(400).json({ error: `This ${field} is already taken.` });
    }
    return res.status(500).json({ error: message });
  }

  async getById(req: Request, res: Response) { 
    try { res.json(await service.getById(req.params.id as string)); } 
    catch (e:any) { this.handleError(res, e); } 
  }
  
  async create(req: Request, res: Response) { 
    try { res.json(await service.create(req.body)); } 
    catch (e:any) { this.handleError(res, e); } 
  }
  
  async update(req: Request, res: Response) { 
    try { res.json(await service.update(req.params.id as string, req.body)); } 
    catch (e:any) { this.handleError(res, e); } 
  }
  
  async delete(req: Request, res: Response) { 
    try { res.json(await service.delete(req.params.id as string)); } 
    catch (e:any) { this.handleError(res, e); } 
  }
}
