import { prisma } from '@vca/database';
import { parse } from '@mliebelt/pgn-parser';

export function splitPgn(pgnText: string): string[] {
  // Split at double newline followed by [Event or another tag
  const parts = pgnText.split(/(?:\r?\n){2,}(?=\[[a-zA-Z]+)/g);
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

export class DatabaseService {
  async getTree(userId: string) {
    // 1. Folders
    // - Public folders (visibility = 'public')
    // - Private folders owned by user (visibility = 'private' and ownerId = userId)
    const folders = await prisma.folder.findMany({
      where: {
        OR: [
          { visibility: 'public' },
          { ownerId: userId, visibility: 'private' }
        ]
      },
      orderBy: { name: 'asc' }
    });

    // 2. Collections
    // - Public collections
    // - Private collections owned by user
    // - Shared collections (via Share table)
    const sharedShares = await prisma.share.findMany({
      where: { sharedWithUser: userId },
      select: { collectionId: true }
    });
    const sharedCollectionIds = sharedShares.map(s => s.collectionId);

    const collections = await prisma.collection.findMany({
      where: {
        OR: [
          { visibility: 'public' },
          { ownerId: userId, visibility: 'private' },
          { id: { in: sharedCollectionIds } }
        ]
      },
      include: {
        games: {
          select: {
            id: true,
            orderIndex: true,
            chapterName: true,
            result: true,
            initialFen: true
          },
          orderBy: { orderIndex: 'asc' }
        },
        shares: {
          include: {
            sharedWithUserRel: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { folders, collections };
  }

  async createFolder(userId: string, role: string, name: string, parentFolderId: string | null, visibility: string) {
    if (visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can create public folders.');
    }
    return prisma.folder.create({
      data: {
        name,
        parentFolderId: parentFolderId || null,
        visibility,
        ownerId: userId
      }
    });
  }

  async renameFolder(userId: string, role: string, id: string, name: string) {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new Error('Folder not found.');

    if (folder.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can modify public folders.');
    }
    if (folder.visibility === 'private' && folder.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    return prisma.folder.update({
      where: { id },
      data: { name }
    });
  }

  async deleteFolder(userId: string, role: string, id: string) {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new Error('Folder not found.');

    if (folder.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can delete public folders.');
    }
    if (folder.visibility === 'private' && folder.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    return prisma.folder.delete({ where: { id } });
  }

  async uploadPgn(userId: string, role: string, folderId: string | null, visibility: string, name: string, pgnText: string) {
    if (visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can upload to the Public database.');
    }

    const chunks = splitPgn(pgnText);
    if (chunks.length === 0) {
      throw new Error('No valid PGN games found in input.');
    }

    // Create Collection
    const collection = await prisma.collection.create({
      data: {
        name,
        folderId: folderId || null,
        visibility,
        source: 'upload',
        ownerId: userId
      }
    });

    // Parse and save games
    const gamesData = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let parsed: any;
      try {
        parsed = parse(chunk, { startRule: 'game' });
      } catch (e) {
        console.warn(`Failed to parse game at index ${i}, saving with basic fallback.`, e);
        // Basic fallback tag parsing if peg-parser crashes
        parsed = { tags: { Event: 'Untitled' }, moves: [] };
      }

      let chapterName = 'Untitled';
      const eventTag = parsed.tags?.Event || '';
      if (eventTag.includes(':')) {
        chapterName = eventTag.split(':').slice(1).join(':').trim();
      } else if (eventTag.trim()) {
        chapterName = eventTag.trim();
      } else {
        const white = parsed.tags?.White;
        const black = parsed.tags?.Black;
        if (white && black) {
          chapterName = `${white} vs ${black}`;
        }
      }

      gamesData.push({
        collectionId: collection.id,
        orderIndex: i,
        chapterName,
        pgn: chunk,
        headers: parsed.tags || {},
        initialFen: parsed.tags?.FEN || null,
        result: parsed.tags?.Result || null
      });
    }

    await prisma.game.createMany({
      data: gamesData
    });

    return prisma.collection.findUnique({
      where: { id: collection.id },
      include: { games: true }
    });
  }

  async saveAnalysisGame(userId: string, name: string, pgnText: string) {
    // Save to private collection, root level (no folderId), source = 'analysis'
    const collection = await prisma.collection.create({
      data: {
        name,
        folderId: null,
        visibility: 'private',
        source: 'analysis',
        ownerId: userId
      }
    });

    let parsed: any;
    try {
      parsed = parse(pgnText, { startRule: 'game' });
    } catch (e) {
      parsed = { tags: { Event: name }, moves: [] };
    }

    await prisma.game.create({
      data: {
        collectionId: collection.id,
        orderIndex: 0,
        chapterName: name,
        pgn: pgnText,
        headers: parsed.tags || {},
        initialFen: parsed.tags?.FEN || null,
        result: parsed.tags?.Result || null
      }
    });

    return collection;
  }

  async saveClassroomGame(userId: string, role: string, name: string, pgnText: string) {
    if (role !== 'COACH' && role !== 'ADMIN') {
      throw new Error('Only coaches and administrators can save classroom games.');
    }

    // Save to private collection, root level, source = 'classroom'
    const collection = await prisma.collection.create({
      data: {
        name,
        folderId: null,
        visibility: 'private',
        source: 'classroom',
        ownerId: userId
      }
    });

    let parsed: any;
    try {
      parsed = parse(pgnText, { startRule: 'game' });
    } catch (e) {
      parsed = { tags: { Event: name }, moves: [] };
    }

    await prisma.game.create({
      data: {
        collectionId: collection.id,
        orderIndex: 0,
        chapterName: name,
        pgn: pgnText,
        headers: parsed.tags || {},
        initialFen: parsed.tags?.FEN || null,
        result: parsed.tags?.Result || null
      }
    });

    return collection;
  }

  async shareCollection(userId: string, collectionId: string, sharedWithUsername: string, permission: string = 'read') {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new Error('Collection not found.');

    if (collection.ownerId !== userId) {
      throw new Error('Only the collection owner can share it.');
    }

    const targetUser = await prisma.user.findUnique({ where: { username: sharedWithUsername } });
    if (!targetUser) {
      throw new Error(`User with username "${sharedWithUsername}" not found.`);
    }

    if (targetUser.id === userId) {
      throw new Error('You cannot share a collection with yourself.');
    }

    return prisma.share.upsert({
      where: {
        collectionId_sharedWithUser: {
          collectionId,
          sharedWithUser: targetUser.id
        }
      },
      update: { permission },
      create: {
        collectionId,
        sharedBy: userId,
        sharedWithUser: targetUser.id,
        permission
      }
    });
  }

  async getGame(userId: string, gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        collection: {
          include: {
            shares: true
          }
        }
      }
    });

    if (!game) throw new Error('Game not found.');

    const col = game.collection;
    const isOwner = col.ownerId === userId;
    const isPublic = col.visibility === 'public';
    const isShared = col.shares.some(s => s.sharedWithUser === userId);

    if (!isOwner && !isPublic && !isShared) {
      throw new Error('Permission denied to access this game.');
    }

    return game;
  }
}