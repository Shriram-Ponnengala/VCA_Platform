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
      res.json({ ...result, userId: user.id });
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

      const { entityType, entityId, collectionId, sharedWithUsername, permission } = req.body;
      const type = entityType || 'collection';
      const id = entityId || collectionId;

      if (!id || !sharedWithUsername) {
        return res.status(400).json({ error: 'entityId and sharedWithUsername are required.' });
      }

      let result;
      if (type === 'folder') {
        result = await service.shareFolder(user.id, id, sharedWithUsername, permission || 'read');
      } else if (type === 'collection') {
        result = await service.shareCollection(user.id, id, sharedWithUsername, permission || 'read');
      } else if (type === 'game') {
        result = await service.shareGame(user.id, id, sharedWithUsername, permission || 'read');
      } else {
        return res.status(400).json({ error: 'Invalid entityType.' });
      }

      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async renameCollection(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required.' });

      const result = await service.renameCollection(user.id, user.role, req.params.id as string, name);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async deleteCollection(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await service.deleteCollection(user.id, user.role, req.params.id as string);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async renameGame(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required.' });

      const result = await service.renameGame(user.id, user.role, req.params.id as string, name);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async updateGamePgn(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { pgn } = req.body;
      if (!pgn) return res.status(400).json({ error: 'PGN is required.' });

      const result = await service.updateGamePgn(user.id, user.role, req.params.id as string, pgn);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async deleteGame(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await service.deleteGame(user.id, user.role, req.params.id as string);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async moveFolder(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { targetFolderId } = req.body;
      const result = await service.moveFolder(user.id, user.role, req.params.id as string, targetFolderId || null);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async moveCollection(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { targetFolderId } = req.body;
      const result = await service.moveCollection(user.id, user.role, req.params.id as string, targetFolderId || null);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async moveGame(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { targetCollectionId } = req.body;
      if (!targetCollectionId) {
        return res.status(400).json({ error: 'targetCollectionId is required.' });
      }

      const result = await service.moveGame(user.id, user.role, req.params.id as string, targetCollectionId);
      res.json(result);
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

  async getCollectionGames(req: Request, res: Response) {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const page = parseInt(req.query.page as string, 10) || 1;
      const result = await service.getCollectionGames(user.id, req.params.id as string, page);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async fetchLichessStudy(req: Request, res: Response) {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
      }

      // Extract study ID from URL
      const match = (url as string).match(/lichess\.org\/study\/([a-zA-Z0-9]+)/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid Lichess study URL.' });
      }
      const studyId = match[1];

      // Fetch PGN from Lichess study export
      const response = await fetch(`https://lichess.org/study/${studyId}.pgn`);
      if (response.status === 401 || response.status === 404) {
        return res.status(400).json({ error: 'Private study or study not found. Only public or unlisted studies are supported.' });
      }
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch study from Lichess.' });
      }

      const pgnText = await response.text();
      res.json({ pgnText });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}