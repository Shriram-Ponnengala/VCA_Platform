import { prisma } from '@vca/database';
import { parse } from '@mliebelt/pgn-parser';

export function splitPgn(pgnText: string): string[] {
  // Split at double newline followed by [Event or another tag
  const parts = pgnText.split(/(?:\r?\n){2,}(?=\[[a-zA-Z]+)/g);
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

export class DatabaseService {
  async getTree(userId: string) {
    // Self-healing: Update cached chapterCount for any collections where it might be 0 but has games
    try {
      const collectionsWithZeroCount = await prisma.collection.findMany({
        where: { chapterCount: 0 },
        include: { _count: { select: { games: true } } }
      });
      for (const c of collectionsWithZeroCount) {
        if (c._count.games > 0) {
          await prisma.collection.update({
            where: { id: c.id },
            data: { chapterCount: c._count.games }
          });
        }
      }
    } catch (e) {
      console.error('Error in self-healing collections count:', e);
    }

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
    const collections = await prisma.collection.findMany({
      where: {
        OR: [
          { visibility: 'public' },
          { ownerId: userId, visibility: 'private' }
        ]
      },
      include: {
        games: {
          select: {
            id: true,
            orderIndex: true,
            chapterName: true,
            result: true,
            initialFen: true,
            headers: true
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

    // 3. Shared Items (grouped in tree under virtual folders of the sharers)
    const shares = await prisma.share.findMany({
      where: { sharedWithUser: userId },
      include: {
        sharedByUser: {
          select: { id: true, username: true }
        }
      }
    });

    const sharerIds = Array.from(new Set(shares.map(s => s.sharedBy)));

    const sharerFolders = await prisma.folder.findMany({
      where: { ownerId: { in: sharerIds }, visibility: 'private' },
      orderBy: { name: 'asc' }
    });

    const sharerCollections = await prisma.collection.findMany({
      where: { ownerId: { in: sharerIds }, visibility: 'private' },
      include: {
        games: {
          select: {
            id: true,
            orderIndex: true,
            chapterName: true,
            result: true,
            initialFen: true,
            headers: true
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sharedFolderIds = new Set(shares.map(s => s.folderId).filter(Boolean) as string[]);
    const sharedCollectionIds = new Set(shares.map(s => s.collectionId).filter(Boolean) as string[]);
    const sharedGameIds = new Set(shares.map(s => s.gameId).filter(Boolean) as string[]);

    const accessibleFolderIds = new Set<string>();
    
    const isFolderAccessible = (folderId: string): boolean => {
      if (sharedFolderIds.has(folderId)) return true;
      if (accessibleFolderIds.has(folderId)) return true;

      let current = sharerFolders.find(f => f.id === folderId);
      const visited = new Set<string>();
      while (current && current.parentFolderId) {
        if (visited.has(current.id)) break;
        visited.add(current.id);
        if (sharedFolderIds.has(current.parentFolderId)) {
          accessibleFolderIds.add(folderId);
          return true;
        }
        current = sharerFolders.find(f => f.id === current!.parentFolderId);
      }
      return false;
    };

    const allowedSharerFolders = sharerFolders.filter(f => isFolderAccessible(f.id));
    allowedSharerFolders.forEach(f => accessibleFolderIds.add(f.id));

    const allowedSharerCollections = sharerCollections.filter(c => {
      if (sharedCollectionIds.has(c.id)) return true;
      if (c.folderId && accessibleFolderIds.has(c.folderId)) return true;
      return false;
    });

    const allowedSharerGames = await prisma.game.findMany({
      where: { id: { in: Array.from(sharedGameIds) } },
      select: {
        id: true,
        orderIndex: true,
        chapterName: true,
        result: true,
        initialFen: true,
        headers: true,
        collectionId: true
      }
    });

    return {
      folders,
      collections,
      shared: {
        folders: allowedSharerFolders,
        collections: allowedSharerCollections,
        games: allowedSharerGames,
        shares: shares.map(s => ({
          id: s.id,
          folderId: s.folderId,
          collectionId: s.collectionId,
          gameId: s.gameId,
          sharedBy: s.sharedBy,
          sharedByUser: s.sharedByUser,
          permission: s.permission
        }))
      }
    };
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

  async renameCollection(userId: string, role: string, id: string, name: string) {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) throw new Error('Collection not found.');

    if (collection.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can modify public collections.');
    }
    if (collection.visibility === 'private' && collection.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    return prisma.collection.update({
      where: { id },
      data: { name }
    });
  }

  async deleteCollection(userId: string, role: string, id: string) {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) throw new Error('Collection not found.');

    if (collection.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can delete public collections.');
    }
    if (collection.visibility === 'private' && collection.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    return prisma.collection.delete({ where: { id } });
  }

  async renameGame(userId: string, role: string, id: string, name: string) {
    const game = await prisma.game.findUnique({
      where: { id },
      include: { collection: true }
    });
    if (!game) throw new Error('Game not found.');

    if (game.collection.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can modify games in public collections.');
    }
    if (game.collection.visibility === 'private' && game.collection.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    return prisma.game.update({
      where: { id },
      data: { chapterName: name }
    });
  }

  async deleteGame(userId: string, role: string, id: string) {
    const game = await prisma.game.findUnique({
      where: { id },
      include: { collection: true }
    });
    if (!game) throw new Error('Game not found.');

    if (game.collection.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can delete games from public collections.');
    }
    if (game.collection.visibility === 'private' && game.collection.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    const deleted = await prisma.game.delete({ where: { id } });

    // Decrement chapterCount
    try {
      await prisma.collection.update({
        where: { id: game.collectionId },
        data: { chapterCount: { decrement: 1 } }
      });
    } catch (e) {
      console.error('Failed to decrement chapterCount:', e);
    }

    return deleted;
  }

  async moveFolder(userId: string, role: string, id: string, targetFolderId: string | null) {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new Error('Folder not found.');

    if (folder.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can move public folders.');
    }
    if (folder.visibility === 'private' && folder.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    if (targetFolderId) {
      if (targetFolderId === id) {
        throw new Error('Cannot move folder inside itself.');
      }

      const allFolders = await prisma.folder.findMany();
      let currentParentId: string | null = targetFolderId;
      const visited = new Set<string>();
      while (currentParentId) {
        if (visited.has(currentParentId)) break;
        visited.add(currentParentId);
        if (currentParentId === id) {
          throw new Error('Cannot move folder inside its own descendant.');
        }
        const parent = allFolders.find(f => f.id === currentParentId);
        currentParentId = parent ? parent.parentFolderId : null;
      }

      const targetFolder = allFolders.find(f => f.id === targetFolderId);
      if (!targetFolder) throw new Error('Target folder not found.');
      if (targetFolder.visibility === 'public' && role !== 'ADMIN') {
        throw new Error('Only administrators can move items to public folders.');
      }
      if (targetFolder.visibility === 'private' && targetFolder.ownerId !== userId) {
        throw new Error('Permission denied to access target folder.');
      }
    }

    return prisma.folder.update({
      where: { id },
      data: { parentFolderId: targetFolderId }
    });
  }

  async moveCollection(userId: string, role: string, id: string, targetFolderId: string | null) {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) throw new Error('Collection not found.');

    if (collection.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Only administrators can move public collections.');
    }
    if (collection.visibility === 'private' && collection.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    if (targetFolderId) {
      const targetFolder = await prisma.folder.findUnique({ where: { id: targetFolderId } });
      if (!targetFolder) throw new Error('Target folder not found.');
      if (targetFolder.visibility === 'public' && role !== 'ADMIN') {
        throw new Error('Only administrators can move items to public folders.');
      }
      if (targetFolder.visibility === 'private' && targetFolder.ownerId !== userId) {
        throw new Error('Permission denied to access target folder.');
      }
    }

    return prisma.collection.update({
      where: { id },
      data: { folderId: targetFolderId }
    });
  }

  async moveGame(userId: string, role: string, id: string, targetCollectionId: string) {
    const game = await prisma.game.findUnique({
      where: { id },
      include: { collection: true }
    });
    if (!game) throw new Error('Game not found.');

    if (game.collection.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Permission denied.');
    }
    if (game.collection.visibility === 'private' && game.collection.ownerId !== userId) {
      throw new Error('Permission denied.');
    }

    const targetCollection = await prisma.collection.findUnique({
      where: { id: targetCollectionId },
      include: { _count: { select: { games: true } } }
    });
    if (!targetCollection) throw new Error('Target collection not found.');
    if (targetCollection.visibility === 'public' && role !== 'ADMIN') {
      throw new Error('Permission denied to access target collection.');
    }
    if (targetCollection.visibility === 'private' && targetCollection.ownerId !== userId) {
      throw new Error('Permission denied to access target collection.');
    }

    const orderIndex = targetCollection._count.games;

    return prisma.game.update({
      where: { id },
      data: { 
        collectionId: targetCollectionId,
        orderIndex
      }
    });
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
        ownerId: userId,
        chapterCount: chunks.length
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
    const collection = await prisma.collection.create({
      data: {
        name,
        folderId: null,
        visibility: 'private',
        source: 'analysis',
        ownerId: userId,
        chapterCount: 1
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

    const collection = await prisma.collection.create({
      data: {
        name,
        folderId: null,
        visibility: 'private',
        source: 'classroom',
        ownerId: userId,
        chapterCount: 1
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

  async shareFolder(userId: string, folderId: string, sharedWithUsername: string, permission: string = 'read') {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) throw new Error('Folder not found.');

    if (folder.ownerId !== userId) {
      throw new Error('Only the folder owner can share it.');
    }

    const targetUser = await prisma.user.findUnique({ where: { username: sharedWithUsername } });
    if (!targetUser) {
      throw new Error(`User with username "${sharedWithUsername}" not found.`);
    }

    if (targetUser.id === userId) {
      throw new Error('You cannot share a folder with yourself.');
    }

    return prisma.share.upsert({
      where: {
        folderId_sharedWithUser: {
          folderId,
          sharedWithUser: targetUser.id
        }
      },
      update: { permission },
      create: {
        folderId,
        sharedBy: userId,
        sharedWithUser: targetUser.id,
        permission
      }
    });
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

  async shareGame(userId: string, gameId: string, sharedWithUsername: string, permission: string = 'read') {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { collection: true }
    });
    if (!game) throw new Error('Game not found.');

    if (game.collection.ownerId !== userId) {
      throw new Error('Only the game owner can share it.');
    }

    const targetUser = await prisma.user.findUnique({ where: { username: sharedWithUsername } });
    if (!targetUser) {
      throw new Error(`User with username "${sharedWithUsername}" not found.`);
    }

    if (targetUser.id === userId) {
      throw new Error('You cannot share a game with yourself.');
    }

    return prisma.share.upsert({
      where: {
        gameId_sharedWithUser: {
          gameId,
          sharedWithUser: targetUser.id
        }
      },
      update: { permission },
      create: {
        gameId,
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
        collection: true,
        shares: true
      }
    });

    if (!game) throw new Error('Game not found.');

    const col = game.collection;
    const isOwner = col.ownerId === userId;
    const isPublic = col.visibility === 'public';

    if (isOwner || isPublic) {
      return game;
    }

    // Check direct game share
    const isGameShared = game.shares.some(s => s.sharedWithUser === userId);
    if (isGameShared) return game;

    // Check collection share
    const colShares = await prisma.share.findMany({
      where: { collectionId: col.id, sharedWithUser: userId }
    });
    if (colShares.length > 0) return game;

    // Check folder share
    if (col.folderId) {
      const allFolders = await prisma.folder.findMany();
      let currentFolderId: string | null = col.folderId;
      const visited = new Set<string>();
      while (currentFolderId) {
        if (visited.has(currentFolderId)) break;
        visited.add(currentFolderId);
        
        const folderShare = await prisma.share.findMany({
          where: { folderId: currentFolderId, sharedWithUser: userId }
        });
        if (folderShare.length > 0) return game;

        const folder = allFolders.find(f => f.id === currentFolderId);
        currentFolderId = folder ? folder.parentFolderId : null;
      }
    }

    throw new Error('Permission denied to access this game.');
  }

  async getCollectionGames(userId: string, collectionId: string, page: number = 1) {
    const limit = 20;
    const offset = (page - 1) * limit;

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        visibility: true,
        ownerId: true,
        chapterCount: true,
        folderId: true
      }
    });

    if (!collection) {
      throw new Error('Collection not found.');
    }

    const isOwner = collection.ownerId === userId;
    const isPublic = collection.visibility === 'public';

    let hasAccess = isOwner || isPublic;

    if (!hasAccess) {
      const colShares = await prisma.share.findMany({
        where: { collectionId, sharedWithUser: userId }
      });
      if (colShares.length > 0) {
        hasAccess = true;
      }
    }

    if (!hasAccess && collection.folderId) {
      const allFolders = await prisma.folder.findMany();
      let currentFolderId: string | null = collection.folderId;
      const visited = new Set<string>();
      while (currentFolderId) {
        if (visited.has(currentFolderId)) break;
        visited.add(currentFolderId);
        
        const folderShare = await prisma.share.findMany({
          where: { folderId: currentFolderId, sharedWithUser: userId }
        });
        if (folderShare.length > 0) {
          hasAccess = true;
          break;
        }

        const folder = allFolders.find(f => f.id === currentFolderId);
        currentFolderId = folder ? folder.parentFolderId : null;
      }
    }

    if (!hasAccess) {
      throw new Error('Permission denied to access this collection.');
    }

    const games = await prisma.game.findMany({
      where: { collectionId },
      select: {
        id: true,
        chapterName: true,
        result: true,
        orderIndex: true,
        initialFen: true,
        headers: true
      },
      orderBy: { orderIndex: 'asc' },
      take: limit,
      skip: offset
    });

    return {
      games,
      chapterCount: collection.chapterCount
    };
  }
}