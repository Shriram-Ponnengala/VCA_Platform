import { Request, Response } from 'express';
import { BatchesService } from './batches.service';
const service = new BatchesService();

export class BatchesController {
  async getAll(req: Request, res: Response) { try { res.json(await service.getAll()); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async getById(req: Request, res: Response) { try { res.json(await service.getById(req.params.id as string)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async create(req: Request, res: Response) { try { res.json(await service.create(req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async update(req: Request, res: Response) { try { res.json(await service.update(req.params.id as string, req.body)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async delete(req: Request, res: Response) { try { res.json(await service.delete(req.params.id as string)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async enrollStudent(req: Request, res: Response) { try { res.json(await service.enroll(req.params.id, req.body.studentId)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
  async unenrollStudent(req: Request, res: Response) { try { res.json(await service.unenroll(req.params.id, req.body.studentId)); } catch (e:any) { res.status(500).json({ error: e.message }); } }
}
