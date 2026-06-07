import { Request, Response } from 'express';
import { SessionsService } from './sessions.service';

export class SessionsController {
  private service: SessionsService;

  constructor() {
    this.service = new SessionsService();
  }

  async getByBatch(req: Request, res: Response) {
    try {
      const sessions = await this.service.getSessionsByBatch(req.params.batchId as string);
      res.json(sessions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const session = await this.service.getSessionById(req.params.id as string);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.json(session);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch session' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      // Data transformation for date if needed
      const data = { ...req.body };
      if (data.date) {
        data.date = new Date(data.date);
      }
      
      const session = await this.service.createSession({ ...data, classId: req.params.batchId as string });
      res.status(201).json(session);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = { ...req.body };
      if (data.date) {
        data.date = new Date(data.date);
      }

      const session = await this.service.updateSession(req.params.id as string, data);
      res.json(session);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await this.service.deleteSession(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  }
}
