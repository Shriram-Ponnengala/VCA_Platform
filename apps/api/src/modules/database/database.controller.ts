import { Request, Response } from 'express';
import { DatabaseService } from './database.service';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'wdfghjifghjoixcvhjk'
);

const service = new DatabaseService();

async function getUser(req: Request) {
  const token = req.cookies['auth-token'];
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as { id: string; role: string; username: string };
  } catch (e) {
    return null;
  }
}

export class DatabaseController {
  async getTree(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await service.getTree(user.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async createFolder(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name, parentFolderId, visibility } = req.body;
      if (!name || !visibility) {
        return res.status(400).json({ error: 'Name and visibility are required.' });
      }

      const result = await service.createFolder(user.id, user.role, name, parentFolderId, visibility);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async renameFolder(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required.' });

      const result = await service.renameFolder(user.id, user.role, req.params.id as string, name);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async deleteFolder(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await service.deleteFolder(user.id, user.role, req.params.id as string);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async uploadPgn(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { folderId, visibility, name, pgnText } = req.body;
      if (!name || !pgnText || !visibility) {
        return res.status(400).json({ error: 'Name, visibility, and pgnText are required.' });
      }

      const result = await service.uploadPgn(user.id, user.role, folderId, visibility, name, pgnText);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async saveAnalysisGame(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name, pgnText } = req.body;
      if (!name || !pgnText) {
        return res.status(400).json({ error: 'Name and pgnText are required.' });
      }

      const result = await service.saveAnalysisGame(user.id, name, pgnText);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async saveClassroomGame(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name, pgnText } = req.body;
      if (!name || !pgnText) {
        return res.status(400).json({ error: 'Name and pgnText are required.' });
      }

      const result = await service.saveClassroomGame(user.id, user.role, name, pgnText);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async shareCollection(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { collectionId, sharedWithUsername, permission } = req.body;
      if (!collectionId || !sharedWithUsername) {
        return res.status(400).json({ error: 'collectionId and sharedWithUsername are required.' });
      }

      const result = await service.shareCollection(user.id, collectionId, sharedWithUsername, permission || 'read');
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async getGame(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await service.getGame(user.id, req.params.id as string);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}