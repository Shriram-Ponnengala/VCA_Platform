import { Request, Response } from 'express';
import { BatchesService } from './batches.service';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wdfghjifghjoixcvhjk'
);

const service = new BatchesService();

export class BatchesController {
  async getAll(req: Request, res: Response) { 
    try { 
      const token = req.cookies['auth-token'];
      let user = null;
      console.log("[Batches API] Token present:", !!token);
      if (token) {
        try {
          const { payload } = await jose.jwtVerify(token, JWT_SECRET);
          user = payload;
          console.log("[Batches API] Decoded user:", user.username, user.role);
        } catch (e) {
          console.error("[Batches API] JWT verify error:", e);
        }
      } else {
        console.log("[Batches API] No token found in req.cookies");
      }
      res.json(await service.getAll(user)); 
    } catch (e:any) { 
      res.status(500).json({ error: e.message }); 
    } 
  }
  async getById(req: Request, res: Response) { try { res.json(await service.getById(req.params.id as string)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async update(req: Request, res: Response) { try { res.json(await service.update(req.params.id as string, req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async delete(req: Request, res: Response) { try { res.json(await service.delete(req.params.id as string)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async enrollStudent(req: Request, res: Response) { try { res.json(await service.enroll(req.params.id as string, req.body.studentId)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async unenrollStudent(req: Request, res: Response) { try { res.json(await service.unenroll(req.params.id as string, req.body.studentId)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
}
