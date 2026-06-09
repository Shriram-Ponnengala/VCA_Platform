'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Globe, 
  Database, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  BookOpen, 
  FileText, 
  Search, 
  Loader2,
  ArrowUp,
  Radio,
  PlusSquare,
  MinusSquare,
  List,
  Trash2,
  Edit3,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import GameCard from './GameCard';
import AccessGamesPanel from './AccessGamesPanel';

interface FolderData {
  id: string;
  name: string;
  parentFolderId: string | null;
  visibility: 'public' | 'private';
  ownerId: string;
}

interface GameData {
  id: string;
  orderIndex: number;
  chapterName: string;
  result: string | null;
  initialFen: string | null;
  headers?: any;
}

interface Collection {
  id: string;
  ownerId: string;
  folderId: string | null;
  name: string;
  visibility: 'public' | 'private';
  source: string;
  chapterCount?: number;
  createdAt: string;
  games: GameData[];
}

interface SharedData {
  folders: FolderData[];
  collections: Collection[];
  games: (GameData & { collectionId: string })[];
  shares: {
    id: string;
    folderId: string | null;
    collectionId: string | null;
    gameId: string | null;
    sharedBy: string;
    sharedByUser: { id: string; username: string };
    permission: string;
  }[];
}

interface AccessGame {
  id: string;
  white: string;
  black: string;
  whiteElo?: number;
  blackElo?: number;
  result: string;
  date: string;
  timeControl?: string;
  opening?: string;
  pgn: string;
  platform: 'lichess' | 'chesscom';
  url?: string;
}

interface DatabasePanelProps {
  onLoadPgn: (pgn: string) => void;
  onLoadFen?: (fen: string) => void;
  role?: 'ADMIN' | 'COACH' | 'STUDENT' | 'admin' | 'coach' | 'student' | null;
  onGamesContextLoaded?: (games: any[], currentIndex: number) => void;
  activeGameId?: string | null;
}

export default function DatabasePanel({ onLoadPgn, onLoadFen, role, onGamesContextLoaded, activeGameId }: DatabasePanelProps) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [shared, setShared] = useState<SharedData>({ folders: [], collections: [], games: [], shares: [] });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'public' | 'private' | 'shared' | 'access'>('public');

  // Expanded folders & collections
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [showAllGames, setShowAllGames] = useState<Record<string, boolean>>({});
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  // Pagination states for collection detail view
  const [paginatedGames, setPaginatedGames] = useState<any[]>([]);
  const [paginatedPage, setPaginatedPage] = useState(1);
  const [paginatedLoading, setPaginatedLoading] = useState(false);
  
  // Game loading state
  const [loadingGameId, setLoadingGameId] = useState<string | null>(null);

  const formatResult = (res: string | null) => {
    if (!res) return '';
    const trimmed = res.trim();
    if (trimmed === '1/2-1/2' || trimmed === '1/2 - 1/2' || trimmed === '0.5-0.5' || trimmed === '1/2') return '½-½';
    return trimmed;
  };

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    entityId: string;
    entityName: string;
    entityType: 'folder' | 'collection' | 'game';
    isSharedItem?: boolean;
  } | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<'rename' | 'move' | 'share' | 'delete' | null>(null);
  const [activeModalEntity, setActiveModalEntity] = useState<{
    entityId: string;
    entityName: string;
    entityType: 'folder' | 'collection' | 'game';
  } | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [moveTargetId, setMoveTargetId] = useState<string>(''); // target folder/collection ID
  const [submittingModal, setSubmittingModal] = useState(false);

  // ── Access Games persistent state (survives tab switches) ──
  const [agPlatform, setAgPlatform] = useState<'lichess' | 'chesscom'>('lichess');
  const [agUsername, setAgUsername] = useState('');
  const [agGames, setAgGames] = useState<AccessGame[] | null>(null);
  const [agError, setAgError] = useState<string | null>(null);

  // Scroll to top state & ref
  const [showScrollTop, setShowScrollTop] = useState(false);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 80) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    if (treeContainerRef.current) {
      treeContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset scroll state when tab changes
  useEffect(() => {
    setShowScrollTop(false);
    setActiveCollectionId(null);
    if (treeContainerRef.current) {
      treeContainerRef.current.scrollTop = 0;
    }
  }, [activeSubTab]);

  // Fetch tree callback
  const fetchTree = useCallback(async () => {
    try {
      const res = await fetch('/api/database/tree');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
        setCollections(data.collections || []);
        setShared(data.shared || { folders: [], collections: [], games: [], shares: [] });
        setCurrentUserId(data.userId || null);
      }
    } catch (e) {
      console.error('Failed to load database tree:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch database tree on mount
  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Fetch paginated games when activeCollectionId or paginatedPage changes
  useEffect(() => {
    if (!activeCollectionId) {
      setPaginatedGames([]);
      return;
    }

    const fetchPaginatedGames = async () => {
      setPaginatedLoading(true);
      try {
        const res = await fetch(`/api/database/collections/${activeCollectionId}/games?page=${paginatedPage}`);
        if (res.ok) {
          const data = await res.json();
          setPaginatedGames(data.games || []);
        }
      } catch (e) {
        console.error('Failed to fetch paginated games:', e);
      } finally {
        setPaginatedLoading(false);
      }
    };

    fetchPaginatedGames();
  }, [activeCollectionId, paginatedPage]);

  // Filter tree data by searchQuery
  const filteredTree = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { folders, collections };

    // Find collections matching search, or having games matching search
    const matchingCollections = collections.filter(c => {
      if (c.name.toLowerCase().includes(q)) return true;
      return c.games.some(g => g.chapterName.toLowerCase().includes(q));
    });

    // Folders are matched if they match the query, or contain matched collections
    const folderIdsWithCollections = new Set(
      matchingCollections.map(c => c.folderId).filter(Boolean)
    );

    const matchingFolders = folders.filter(f => {
      if (f.name.toLowerCase().includes(q)) return true;
      return folderIdsWithCollections.has(f.id);
    });

    return { folders: matchingFolders, collections: matchingCollections };
  }, [folders, collections, searchQuery]);

  // Filter shared tree data by searchQuery
  const filteredShared = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return shared;

    const matchingCollections = shared.collections.filter(c => {
      if (c.name.toLowerCase().includes(q)) return true;
      return c.games.some(g => g.chapterName.toLowerCase().includes(q));
    });

    const matchingGames = shared.games.filter(g => 
      g.chapterName.toLowerCase().includes(q)
    );

    const folderIdsWithCollections = new Set(
      matchingCollections.map(c => c.folderId).filter(Boolean)
    );

    const matchingFolders = shared.folders.filter(f => {
      if (f.name.toLowerCase().includes(q)) return true;
      return folderIdsWithCollections.has(f.id);
    });

    return {
      folders: matchingFolders,
      collections: matchingCollections,
      games: matchingGames,
      shares: shared.shares
    };
  }, [shared, searchQuery]);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCollection = (id: string) => {
    setActiveCollectionId(id);
    setPaginatedPage(1);
    setExpandedCollections(prev => ({ ...prev, [id]: true }));
    setShowAllGames(prev => ({ ...prev, [id]: true }));
  };

  const handleBack = () => {
    if (activeCollectionId) {
      setExpandedCollections(prev => ({ ...prev, [activeCollectionId]: false }));
    }
    setActiveCollectionId(null);
    setPaginatedPage(1);
  };

  const activeCollection = useMemo(() => {
    if (!activeCollectionId) return null;
    return collections.find(c => c.id === activeCollectionId) || 
           shared.collections.find(c => c.id === activeCollectionId);
  }, [activeCollectionId, collections, shared.collections]);

  const totalChapters = useMemo(() => {
    if (!activeCollection) return 0;
    return activeCollection.chapterCount || activeCollection.games?.length || 0;
  }, [activeCollection]);

  const totalPages = useMemo(() => {
    return Math.ceil(totalChapters / 20);
  }, [totalChapters]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (paginatedPage <= 4) {
        pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
      } else if (paginatedPage >= totalPages - 3) {
        pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', paginatedPage - 1, paginatedPage, paginatedPage + 1, 'ellipsis', totalPages);
      }
    }

    const startIdx = (paginatedPage - 1) * 20 + 1;
    const endIdx = Math.min(paginatedPage * 20, totalChapters);

    return (
      <div className="pagination-bar">
        <div className="pagination-buttons">
          <button 
            className="pagination-btn arrow-btn" 
            disabled={paginatedPage === 1} 
            onClick={() => setPaginatedPage(1)}
            title="First page"
          >
            «
          </button>
          <button 
            className="pagination-btn arrow-btn" 
            disabled={paginatedPage === 1} 
            onClick={() => setPaginatedPage(prev => Math.max(1, prev - 1))}
            title="Previous page"
          >
            ‹
          </button>
          
          {pages.map((p, idx) => {
            if (p === 'ellipsis') {
              return <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>;
            }
            return (
              <button
                key={`page-${p}`}
                className={`pagination-btn num-btn ${paginatedPage === p ? 'active' : ''}`}
                onClick={() => setPaginatedPage(p as number)}
              >
                {p}
              </button>
            );
          })}
          
          <button 
            className="pagination-btn arrow-btn" 
            disabled={paginatedPage === totalPages} 
            onClick={() => setPaginatedPage(prev => Math.min(totalPages, prev + 1))}
            title="Next page"
          >
            ›
          </button>
          <button 
            className="pagination-btn arrow-btn" 
            disabled={paginatedPage === totalPages} 
            onClick={() => setPaginatedPage(totalPages)}
            title="Last page"
          >
            »
          </button>
        </div>
        <div className="pagination-readout">
          {startIdx}–{endIdx} of {totalChapters} · 20 / page
        </div>
      </div>
    );
  };

  // Close context menu on global click/mousedown outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('.custom-context-menu')) {
        return;
      }
      setContextMenu(null);
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  // Native contextmenu listener on document to reliably intercept right-clicks inside .tree-container
  useEffect(() => {
    const handleNativeContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tree-container')) return;

      const row = target.closest('[data-context-entity-id]');
      if (!row) return;

      e.preventDefault();
      e.stopPropagation();

      const entityId = row.getAttribute('data-context-entity-id') || '';
      const entityName = row.getAttribute('data-context-entity-name') || '';
      const entityType = row.getAttribute('data-context-entity-type') as 'folder' | 'collection' | 'game';
      const isSharedItem = row.getAttribute('data-context-shared') === 'true';

      const menuWidth = 180;
      const menuHeight = entityType === 'game' ? 220 : 150;
      let x = e.clientX;
      let y = e.clientY;

      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10;
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10;
      }

      setContextMenu({
        x,
        y,
        entityId,
        entityName,
        entityType,
        isSharedItem
      });
    };

    document.addEventListener('contextmenu', handleNativeContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleNativeContextMenu);
    };
  }, []);

  const handleContextMenu = (
    e: React.MouseEvent,
    entityId: string,
    entityName: string,
    entityType: 'folder' | 'collection' | 'game',
    isSharedItem: boolean = false
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Bounds check to avoid menu clipping offscreen
    const menuWidth = 180;
    const menuHeight = entityType === 'game' ? 220 : 150;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    setContextMenu({
      x,
      y,
      entityId,
      entityName,
      entityType,
      isSharedItem
    });
  };

  const isEditable = useMemo(() => {
    if (!contextMenu) return false;
    if (contextMenu.isSharedItem || activeSubTab === 'shared') return false;
    if (activeSubTab === 'public') return role?.toUpperCase() === 'ADMIN';
    return true; // private (My DB) tab
  }, [contextMenu, activeSubTab, role]);

  // Move targets
  const moveFolderOptions = useMemo(() => {
    if (!contextMenu || contextMenu.entityType === 'game') return [];
    return folders.filter(f => f.ownerId === currentUserId && f.visibility === activeSubTab && f.id !== contextMenu.entityId);
  }, [folders, contextMenu, currentUserId, activeSubTab]);

  const moveCollectionOptions = useMemo(() => {
    if (!contextMenu || contextMenu.entityType !== 'game') return [];
    return collections.filter(c => c.ownerId === currentUserId && c.visibility === activeSubTab);
  }, [collections, contextMenu, currentUserId, activeSubTab]);

  // Load and copy game helpers
  const handleLoadGameDirectly = async (gameId: string) => {
    if (onGamesContextLoaded) {
      let foundContext = null;
      for (const col of collections) {
         const idx = col.games?.findIndex((g: any) => g.id === gameId);
         if (idx !== -1 && idx !== undefined) {
             foundContext = { games: col.games, index: idx };
             break;
         }
      }
      if (!foundContext && shared?.collections) {
         for (const col of shared.collections) {
             const idx = col.games?.findIndex((g: any) => g.id === gameId);
             if (idx !== -1 && idx !== undefined) {
                 foundContext = { games: col.games, index: idx };
                 break;
             }
         }
      }
      if (foundContext) {
         onGamesContextLoaded(foundContext.games, foundContext.index);
      } else {
         onGamesContextLoaded([], -1);
      }
    }

    setLoadingGameId(gameId);
    try {
      const res = await fetch(`/api/database/games/${gameId}`);
      if (res.ok) {
        const game = await res.json();
        onLoadPgn(game.pgn);
      } else {
        alert('Failed to load game.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGameId(null);
    }
  };

  const handleCopyPgn = async (gameId: string) => {
    try {
      const res = await fetch(`/api/database/games/${gameId}`);
      if (res.ok) {
        const game = await res.json();
        await navigator.clipboard.writeText(game.pgn || '');
        alert('PGN copied to clipboard!');
      } else {
        alert('Failed to fetch PGN.');
      }
    } catch (e) {
      console.error(e);
      alert('Error copying PGN.');
    }
  };

  // Submit operations
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalEntity || !modalInput.trim()) return;
    setSubmittingModal(true);
    try {
      let url = '';
      if (activeModalEntity.entityType === 'folder') {
        url = `/api/database/folders/${activeModalEntity.entityId}`;
      } else if (activeModalEntity.entityType === 'collection') {
        url = `/api/database/collections/${activeModalEntity.entityId}`;
      } else if (activeModalEntity.entityType === 'game') {
        url = `/api/database/games/${activeModalEntity.entityId}`;
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modalInput.trim() })
      });

      if (res.ok) {
        await fetchTree();
        setActiveModal(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to rename.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!activeModalEntity) return;
    setSubmittingModal(true);
    try {
      let url = '';
      if (activeModalEntity.entityType === 'folder') {
        url = `/api/database/folders/${activeModalEntity.entityId}`;
      } else if (activeModalEntity.entityType === 'collection') {
        url = `/api/database/collections/${activeModalEntity.entityId}`;
      } else if (activeModalEntity.entityType === 'game') {
        url = `/api/database/games/${activeModalEntity.entityId}`;
      }

      const res = await fetch(url, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchTree();
        setActiveModal(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalEntity || !modalInput.trim()) return;
    setSubmittingModal(true);
    try {
      const res = await fetch('/api/database/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: activeModalEntity.entityType,
          entityId: activeModalEntity.entityId,
          sharedWithUsername: modalInput.trim(),
          permission: 'read'
        })
      });

      if (res.ok) {
        await fetchTree();
        setActiveModal(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to share.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleMoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalEntity) return;
    setSubmittingModal(true);
    try {
      let url = '';
      let body: any = {};

      if (activeModalEntity.entityType === 'folder') {
        url = `/api/database/folders/${activeModalEntity.entityId}/move`;
        body = { targetFolderId: moveTargetId || null };
      } else if (activeModalEntity.entityType === 'collection') {
        url = `/api/database/collections/${activeModalEntity.entityId}/move`;
        body = { targetFolderId: moveTargetId || null };
      } else if (activeModalEntity.entityType === 'game') {
        url = `/api/database/games/${activeModalEntity.entityId}/move`;
        body = { targetCollectionId: moveTargetId };
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchTree();
        setActiveModal(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to move.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    } finally {
      setSubmittingModal(false);
    }
  };
  // Recursively render Folder/Collection elements
  const renderFolderContent = (folderId: string | null, parentVisibility: 'public' | 'private') => {
    const { folders: fList, collections: cList } = filteredTree;

    const childFolders = fList.filter(
      f => f.parentFolderId === folderId && 
           f.visibility === parentVisibility && 
           (parentVisibility === 'public' || f.ownerId === currentUserId)
    );
    const childCollections = cList.filter(
      c => c.folderId === folderId && 
           c.visibility === parentVisibility && 
           (parentVisibility === 'public' || c.ownerId === currentUserId)
    );

    if (childFolders.length === 0 && childCollections.length === 0) {
      return null;
    }

    return (
      <div className="children-container">
        {childFolders.map(folder => {
          const isExpanded = !!expandedFolders[folder.id];
          return (
            <div key={folder.id} className="folder-node">
              <button 
                className="node-row" 
                onClick={() => toggleFolder(folder.id)}
                data-context-entity-id={folder.id}
                data-context-entity-name={folder.name}
                data-context-entity-type="folder"
                data-context-shared="false"
              >
                <span className="expand-icon-wrapper">
                  {isExpanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
                </span>
                <Folder size={16} strokeWidth={1.5} className="folder-icon" />
                <span className="node-text">{folder.name}</span>
              </button>
              {isExpanded && renderFolderContent(folder.id, parentVisibility)}
            </div>
          );
        })}

        {childCollections.map(col => {
          const isExpanded = !!expandedCollections[col.id];
          const showLimit = 3;
          const collectionGames = col.games || [];
          const displayedGames = showAllGames[col.id] ? collectionGames : collectionGames.slice(0, showLimit);
          const hasMoreGames = collectionGames.length > showLimit && !showAllGames[col.id];
          const remainingCount = collectionGames.length - showLimit;

          return (
            <div key={col.id} className="collection-node">
              <button 
                className={`node-row ${isExpanded ? 'collection-expanded' : ''}`}
                onClick={() => toggleCollection(col.id)}
                data-context-entity-id={col.id}
                data-context-entity-name={col.name}
                data-context-entity-type="collection"
                data-context-shared="false"
              >
                <span className="expand-icon-wrapper">
                  {isExpanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
                </span>
                <BookOpen size={16} strokeWidth={1.5} className="collection-icon" />
                <span className="node-text">{col.name}</span>
                <span className="node-badge">
                  {col.games.length}
                </span>
              </button>
              {isExpanded && (
                <div className="children-container">
                  {displayedGames.map((game, idx) => (
                    <div 
                      key={game.id}
                      className={`node-row game-node-row ${loadingGameId === game.id ? 'loading' : ''} ${activeGameId === game.id ? 'active-game' : ''}`}
                      data-context-entity-id={game.id}
                      data-context-entity-name={game.chapterName}
                      data-context-entity-type="game"
                      data-context-shared="false"
                      onClick={() => handleLoadGameDirectly(game.id)}
                    >
                      <span className="game-index">{idx + 1}</span>
                      <span className="game-icon-wrapper">
                        {loadingGameId === game.id ? (
                          <Loader2 size={14} className="animate-spin text-muted" />
                        ) : (
                          <FileText size={14} strokeWidth={1.5} className="game-icon" />
                        )}
                      </span>
                      <span className="node-text">{game.chapterName}</span>
                      {game.result && (
                        <span className="node-badge game-result-badge">
                          {formatResult(game.result)}
                        </span>
                      )}
                    </div>
                  ))}
                  {hasMoreGames && (
                    <div 
                      className="more-games-row"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllGames(prev => ({ ...prev, [col.id]: true }));
                      }}
                    >
                      <ChevronDown size={14} className="more-games-chevron" />
                      <span className="more-games-text">
                        + {remainingCount} more · open panel to browse all
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Recursively render Shared Folder elements
  const renderSharedFolderContent = (folderId: string | null, sharerId: string) => {
    const childFolders = filteredShared.folders.filter(f => f.parentFolderId === folderId && f.ownerId === sharerId);
    const childCollections = filteredShared.collections.filter(c => c.folderId === folderId && c.ownerId === sharerId);

    if (childFolders.length === 0 && childCollections.length === 0) {
      return null;
    }

    return (
      <div className="children-container">
        {childFolders.map(folder => {
          const isExpanded = !!expandedFolders[folder.id];
          return (
            <div key={folder.id} className="folder-node">
              <button 
                className="node-row" 
                onClick={() => toggleFolder(folder.id)}
                data-context-entity-id={folder.id}
                data-context-entity-name={folder.name}
                data-context-entity-type="folder"
                data-context-shared="true"
              >
                <span className="expand-icon-wrapper">
                  {isExpanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
                </span>
                <Folder size={16} strokeWidth={1.5} className="folder-icon" />
                <span className="node-text">{folder.name}</span>
              </button>
              {isExpanded && renderSharedFolderContent(folder.id, sharerId)}
            </div>
          );
        })}

        {childCollections.map(col => {
          const isExpanded = !!expandedCollections[col.id];
          const showLimit = 3;
          const collectionGames = col.games || [];
          const displayedGames = showAllGames[col.id] ? collectionGames : collectionGames.slice(0, showLimit);
          const hasMoreGames = collectionGames.length > showLimit && !showAllGames[col.id];
          const remainingCount = collectionGames.length - showLimit;

          return (
            <div key={col.id} className="collection-node">
              <button 
                className={`node-row ${isExpanded ? 'collection-expanded' : ''}`}
                onClick={() => toggleCollection(col.id)}
                data-context-entity-id={col.id}
                data-context-entity-name={col.name}
                data-context-entity-type="collection"
                data-context-shared="true"
              >
                <span className="expand-icon-wrapper">
                  {isExpanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
                </span>
                <BookOpen size={16} strokeWidth={1.5} className="collection-icon" />
                <span className="node-text">{col.name}</span>
                <span className="node-badge">
                  {col.games.length}
                </span>
              </button>
              {isExpanded && (
                <div className="children-container">
                  {displayedGames.map((game, idx) => (
                    <div 
                      key={game.id}
                      className={`node-row game-node-row ${loadingGameId === game.id ? 'loading' : ''}`}
                      data-context-entity-id={game.id}
                      data-context-entity-name={game.chapterName}
                      data-context-entity-type="game"
                      data-context-shared="true"
                      onClick={() => handleLoadGameDirectly(game.id)}
                    >
                      <span className="game-index">{idx + 1}</span>
                      <span className="game-icon-wrapper">
                        {loadingGameId === game.id ? (
                          <Loader2 size={14} className="animate-spin text-muted" />
                        ) : (
                          <FileText size={14} strokeWidth={1.5} className="game-icon" />
                        )}
                      </span>
                      <span className="node-text">{game.chapterName}</span>
                      {game.result && (
                        <span className="node-badge game-result-badge">
                          {formatResult(game.result)}
                        </span>
                      )}
                    </div>
                  ))}
                  {hasMoreGames && (
                    <div 
                      className="more-games-row"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllGames(prev => ({ ...prev, [col.id]: true }));
                      }}
                    >
                      <ChevronDown size={14} className="more-games-chevron" />
                      <span className="more-games-text">
                        + {remainingCount} more · open panel to browse all
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Group direct shares by username
  const sharers = useMemo(() => {
    const map = new Map<string, { id: string; username: string }>();
    filteredShared.shares.forEach(s => {
      if (s.sharedByUser) {
        map.set(s.sharedByUser.id, s.sharedByUser);
      }
    });
    return Array.from(map.values());
  }, [filteredShared.shares]);

  const renderSharedTab = () => {
    if (sharers.length === 0) {
      return (
        <div className="empty-wrapper">
          <p className="empty-text">No shared databases found.</p>
        </div>
      );
    }

    return (
      <div className="shared-list">
        {sharers.map(sharer => {
          const isExpanded = !!expandedFolders[sharer.id];
          
          const sharerShares = filteredShared.shares.filter(s => s.sharedBy === sharer.id);
          
          const directFolderIds = new Set(sharerShares.map(s => s.folderId).filter(Boolean) as string[]);
          const directCollectionIds = new Set(sharerShares.map(s => s.collectionId).filter(Boolean) as string[]);
          const directGameIds = new Set(sharerShares.map(s => s.gameId).filter(Boolean) as string[]);

          const directFolders = filteredShared.folders.filter(f => directFolderIds.has(f.id));
          const directCollections = filteredShared.collections.filter(c => directCollectionIds.has(c.id));
          const directGames = filteredShared.games.filter(g => directGameIds.has(g.id));

          return (
            <div key={sharer.id} className="folder-node">
              <button className="node-row" onClick={() => toggleFolder(sharer.id)}>
                <span className="expand-icon-wrapper">
                  {isExpanded ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
                </span>
                <Users size={16} strokeWidth={1.5} className="folder-icon" style={{ color: '#c8854a' }} />
                <span className="node-text" style={{ fontWeight: 600 }}>{sharer.username}</span>
              </button>
              
              {isExpanded && (
                <div className="children-container">
                  {/* Shared Folders */}
                  {directFolders.map(folder => {
                    const isFolderExp = !!expandedFolders[folder.id];
                    return (
                      <div key={folder.id} className="folder-node">
                        <button 
                          className="node-row" 
                          onClick={() => toggleFolder(folder.id)}
                          data-context-entity-id={folder.id}
                          data-context-entity-name={folder.name}
                          data-context-entity-type="folder"
                          data-context-shared="true"
                        >
                          <span className="expand-icon-wrapper">
                            {isFolderExp ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
                          </span>
                          <Folder size={16} strokeWidth={1.5} className="folder-icon" />
                          <span className="node-text">{folder.name}</span>
                        </button>
                        {isFolderExp && renderSharedFolderContent(folder.id, sharer.id)}
                      </div>
                    );
                  })}

                  {/* Shared Collections */}
                  {directCollections.map(col => {
                    const isColExp = !!expandedCollections[col.id];
                    const showLimit = 3;
                    const collectionGames = col.games || [];
                    const displayedGames = showAllGames[col.id] ? collectionGames : collectionGames.slice(0, showLimit);
                    const hasMoreGames = collectionGames.length > showLimit && !showAllGames[col.id];
                    const remainingCount = collectionGames.length - showLimit;

                    return (
                      <div key={col.id} className="collection-node">
                        <button 
                          className={`node-row ${isColExp ? 'collection-expanded' : ''}`}
                          onClick={() => toggleCollection(col.id)}
                          data-context-entity-id={col.id}
                          data-context-entity-name={col.name}
                          data-context-entity-type="collection"
                          data-context-shared="true"
                        >
                          <span className="expand-icon-wrapper">
                            {isColExp ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronRight size={14} strokeWidth={2} />}
                          </span>
                          <BookOpen size={16} strokeWidth={1.5} className="collection-icon" />
                          <span className="node-text">{col.name}</span>
                          <span className="node-badge">
                            {col.games.length}
                          </span>
                        </button>
                        {isColExp && (
                          <div className="children-container">
                            {displayedGames.map((game, idx) => (
                              <div 
                                key={game.id}
                                className={`node-row game-node-row ${loadingGameId === game.id ? 'loading' : ''}`}
                                data-context-entity-id={game.id}
                                data-context-entity-name={game.chapterName}
                                data-context-entity-type="game"
                                data-context-shared="true"
                                onClick={() => handleLoadGameDirectly(game.id)}
                              >
                                <span className="game-index">{idx + 1}</span>
                                <span className="game-icon-wrapper">
                                  {loadingGameId === game.id ? (
                                    <Loader2 size={14} className="animate-spin text-muted" />
                                  ) : (
                                    <FileText size={14} strokeWidth={1.5} className="game-icon" />
                                  )}
                                </span>
                                <span className="node-text">{game.chapterName}</span>
                                {game.result && (
                                  <span className="node-badge game-result-badge">
                                    {formatResult(game.result)}
                                  </span>
                                )}
                              </div>
                            ))}
                            {hasMoreGames && (
                              <div 
                                className="more-games-row"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAllGames(prev => ({ ...prev, [col.id]: true }));
                                }}
                              >
                                <ChevronDown size={14} className="more-games-chevron" />
                                <span className="more-games-text">
                                  + {remainingCount} more · open panel to browse all
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Shared Games */}
                  {directGames.map((game) => (
                    <div 
                      key={game.id}
                      className={`node-row game-node-row ${loadingGameId === game.id ? 'loading' : ''}`}
                      data-context-entity-id={game.id}
                      data-context-entity-name={game.chapterName}
                      data-context-entity-type="game"
                      data-context-shared="true"
                      onClick={() => handleLoadGameDirectly(game.id)}
                      style={{ marginTop: '2px' }}
                    >
                      <span className="game-icon-wrapper">
                        {loadingGameId === game.id ? (
                          <Loader2 size={14} className="animate-spin text-muted" />
                        ) : (
                          <FileText size={14} strokeWidth={1.5} className="game-icon" />
                        )}
                      </span>
                      <span className="node-text">{game.chapterName}</span>
                      {game.result && (
                        <span className="node-badge game-result-badge">
                          {formatResult(game.result)}
                        </span>
                      )}
                    </div>
                  ))}

                  {directFolders.length === 0 && directCollections.length === 0 && directGames.length === 0 && (
                    <div className="empty-wrapper" style={{ padding: '10px' }}>
                      <p className="empty-text" style={{ fontSize: '0.75rem' }}>No items directly shared.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const showMyAndShared = role?.toUpperCase() === 'COACH' || role?.toUpperCase() === 'ADMIN';
  const isStudent = role?.toUpperCase() === 'STUDENT';

  return (
    <div className="database-panel">
      {/* Sub tabs */}
      <div className="sub-tabs">
        <button
          className={`sub-tab-btn ${activeSubTab === 'public' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('public')}
        >
          <Globe size={14} />
          <span>Public</span>
        </button>
        {showMyAndShared && (
          <>
            <button
              className={`sub-tab-btn ${activeSubTab === 'private' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('private')}
            >
              <Database size={14} />
              <span>My DB</span>
            </button>
            <button
              className={`sub-tab-btn ${activeSubTab === 'shared' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('shared')}
            >
              <Users size={14} />
              <span>Shared</span>
            </button>
            <button
              className={`sub-tab-btn ${activeSubTab === 'access' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('access')}
            >
              <Radio size={14} />
              <span>Access</span>
            </button>
          </>
        )}
      </div>

      {/* Search Input — hidden on Access Games tab */}
      {activeSubTab !== 'access' && (
        <div className="search-container">
          <Search className="search-icon" size={14} />
          <input
            type="text"
            placeholder="Search collections or games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {showScrollTop && (
            <button className="scroll-top-btn" onClick={scrollToTop}>
              <ArrowUp size={12} />
              <span>Back to top</span>
            </button>
          )}
        </div>
      )}

      {/* Scrollable Tree */}
      <div 
        className="tree-container"
        ref={treeContainerRef}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="loading-wrapper">
            <Loader2 className="animate-spin" size={20} />
            <p>Loading database...</p>
          </div>
        ) : activeSubTab === 'access' ? (
          <AccessGamesPanel
            onLoadPgn={onLoadPgn}
            platform={agPlatform}
            username={agUsername}
            games={agGames}
            error={agError}
            onPlatformChange={(p) => { setAgPlatform(p); setAgGames(null); setAgError(null); }}
            onUsernameChange={(u) => { setAgUsername(u); setAgGames(null); setAgError(null); }}
            onGamesChange={setAgGames}
            onErrorChange={setAgError}
          />
        ) : activeCollection ? (
          <div className="active-collection-container">
            <button className="back-btn" onClick={handleBack}>
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <div className="collection-node">
              <div 
                className="node-row collection-expanded active-collection-header"
                data-context-entity-id={activeCollection.id}
                data-context-entity-name={activeCollection.name}
                data-context-entity-type="collection"
                data-context-shared={activeSubTab === 'shared' ? "true" : "false"}
              >
                <BookOpen size={16} strokeWidth={1.5} className="collection-icon" />
                <span className="node-text">{activeCollection.name}</span>
                <span className="node-badge">
                  {totalChapters}
                </span>
              </div>
              
              {renderPagination()}
              <div className="children-container" style={{ borderLeft: 'none', marginLeft: 0, paddingLeft: 0 }}>
                {paginatedLoading ? (
                  <div className="loading-wrapper" style={{ padding: '40px 20px' }}>
                    <Loader2 className="animate-spin" size={20} />
                    <p>Loading games...</p>
                  </div>
                ) : (() => {
                  const q = searchQuery.toLowerCase().trim();
                  const filteredGames = q 
                    ? paginatedGames.filter(g => g.chapterName.toLowerCase().includes(q)) 
                    : paginatedGames;

                  if (filteredGames.length === 0) {
                    return (
                      <div className="empty-wrapper" style={{ padding: '20px 10px' }}>
                        <p className="empty-text">No games found.</p>
                      </div>
                    );
                  }

                  return filteredGames.map((game, idx) => {
                    const globalIdx = (paginatedPage - 1) * 20 + idx + 1;
                    return (
                      <div 
                        key={game.id}
                        className={`node-row game-node-row ${loadingGameId === game.id ? 'loading' : ''} ${activeGameId === game.id ? 'active-game' : ''}`}
                        data-context-entity-id={game.id}
                        data-context-entity-name={game.chapterName}
                        data-context-entity-type="game"
                        data-context-shared={activeSubTab === 'shared' ? "true" : "false"}
                        onClick={() => handleLoadGameDirectly(game.id)}
                      >
                        <span className="game-index">{globalIdx}</span>
                        <span className="game-icon-wrapper">
                          {loadingGameId === game.id ? (
                            <Loader2 size={14} className="animate-spin text-muted" />
                          ) : (
                            <FileText size={14} strokeWidth={1.5} className="game-icon" />
                          )}
                        </span>
                        <span className="node-text">{game.chapterName}</span>
                        {game.result && (
                          <span className="node-badge game-result-badge">
                            {formatResult(game.result)}
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="section-header">FOLDERS & COLLECTIONS</div>
            {activeSubTab === 'shared' ? (
              renderSharedTab()
            ) : (
              // Render Public / Private Tree
              renderFolderContent(null, activeSubTab) || (
                <div className="empty-wrapper">
                  <p className="empty-text">No folders or collections found.</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
          className="custom-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.entityType === 'game' && (
            <>
              <button 
                className="context-menu-item"
                onClick={() => {
                  handleLoadGameDirectly(contextMenu.entityId);
                  setContextMenu(null);
                }}
              >
                <div className="context-menu-item-content">
                  <BookOpen size={15} />
                  <span>Load Game</span>
                </div>
              </button>
              <button 
                className="context-menu-item"
                onClick={() => {
                  handleCopyPgn(contextMenu.entityId);
                  setContextMenu(null);
                }}
              >
                <div className="context-menu-item-content">
                  <FileText size={15} />
                  <span>Copy PGN</span>
                </div>
              </button>
              <hr className="context-menu-divider" />
            </>
          )}
          <button 
            className="context-menu-item"
            disabled={!isEditable}
            onClick={() => {
              if (!isEditable) return;
              setActiveModalEntity({ entityId: contextMenu.entityId, entityName: contextMenu.entityName, entityType: contextMenu.entityType });
              setActiveModal('rename');
              setModalInput(contextMenu.entityName);
              setContextMenu(null);
            }}
          >
            <div className="context-menu-item-content">
              <Edit3 size={15} />
              <span>Rename</span>
            </div>
          </button>
          <button 
            className="context-menu-item"
            disabled={!isEditable}
            onClick={() => {
              if (!isEditable) return;
              setActiveModalEntity({ entityId: contextMenu.entityId, entityName: contextMenu.entityName, entityType: contextMenu.entityType });
              setActiveModal('move');
              if (contextMenu.entityType === 'game') {
                const opts = moveCollectionOptions;
                setMoveTargetId(opts[0]?.id || '');
              } else {
                setMoveTargetId('');
              }
              setContextMenu(null);
            }}
          >
            <div className="context-menu-item-content">
              <Folder size={15} />
              <span>Move to folder</span>
            </div>
            <ChevronRight size={14} className="context-menu-chevron" />
          </button>
          <button 
            className="context-menu-item"
            disabled={!isEditable}
            onClick={() => {
              if (!isEditable) return;
              setActiveModalEntity({ entityId: contextMenu.entityId, entityName: contextMenu.entityName, entityType: contextMenu.entityType });
              setActiveModal('share');
              setModalInput('');
              setContextMenu(null);
            }}
          >
            <div className="context-menu-item-content">
              <UserPlus size={15} />
              <span>Share with user...</span>
            </div>
          </button>
          <hr className="context-menu-divider" />
          <button 
            className="context-menu-item text-danger"
            disabled={!isEditable}
            onClick={() => {
              if (!isEditable) return;
              setActiveModalEntity({ entityId: contextMenu.entityId, entityName: contextMenu.entityName, entityType: contextMenu.entityType });
              setActiveModal('delete');
              setContextMenu(null);
            }}
          >
            <div className="context-menu-item-content">
              <Trash2 size={15} />
              <span>Delete</span>
            </div>
          </button>
        </div>
      )}

      {/* Overlay Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              {activeModal === 'rename' && `Rename ${activeModalEntity?.entityType}`}
              {activeModal === 'move' && `Move ${activeModalEntity?.entityType}`}
              {activeModal === 'share' && `Share ${activeModalEntity?.entityType}`}
              {activeModal === 'delete' && `Delete ${activeModalEntity?.entityType}`}
            </h3>
            
            {activeModal === 'rename' && (
              <form onSubmit={handleRenameSubmit}>
                <input 
                  type="text" 
                  className="modal-input" 
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder="Enter new name"
                  autoFocus
                  required
                />
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingModal}>
                    {submittingModal ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'share' && (
              <form onSubmit={handleShareSubmit}>
                <input 
                  type="text" 
                  className="modal-input" 
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder="Enter username to share with"
                  autoFocus
                  required
                />
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingModal}>
                    {submittingModal ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'delete' && (
              <div>
                <p className="modal-description">
                  Are you sure you want to delete this {activeModalEntity?.entityType}? This action cannot be undone.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteSubmit} disabled={submittingModal}>
                    {submittingModal ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'move' && (
              <form onSubmit={handleMoveSubmit}>
                <p className="modal-description">
                  Select destination for "{activeModalEntity?.entityName}":
                </p>
                <select 
                  className="modal-select"
                  value={moveTargetId}
                  onChange={(e) => setMoveTargetId(e.target.value)}
                  required={activeModalEntity?.entityType === 'game'}
                >
                  {activeModalEntity?.entityType !== 'game' ? (
                    <>
                      <option value="">Root (No folder)</option>
                      {moveFolderOptions.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </>
                  ) : (
                    <>
                      {moveCollectionOptions.length === 0 && (
                        <option value="">No collections available</option>
                      )}
                      {moveCollectionOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </>
                  )}
                </select>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={submittingModal || (activeModalEntity?.entityType === 'game' && !moveTargetId)}
                  >
                    {submittingModal ? 'Moving...' : 'Move'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(74, 32, 24, 0.05);
          color: #4a2018;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 12px;
          width: fit-content;
        }
        .back-btn:hover {
          background: rgba(74, 32, 24, 0.1);
          border-color: #c8854a;
        }
        .active-collection-container {
          display: flex;
          flex-direction: column;
          padding: 4px;
        }
        .active-collection-header {
          cursor: default !important;
        }
        .database-panel {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 180px);
          color: #4a2018;
          position: relative;
        }
        .sub-tabs {
          display: flex;
          background: rgba(74, 32, 24, 0.04);
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 12px;
          gap: 2px;
        }
        .sub-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 4px;
          border: none;
          background: transparent;
          color: #4a2018;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          opacity: 0.7;
        }
        .sub-tab-btn:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.5);
        }
        .sub-tab-btn.active {
          opacity: 1;
          background: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .search-container {
          position: relative;
          margin-bottom: 12px;
        }
        .search-input {
          width: 100%;
          padding: 8px 12px 8px 32px;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #4a2018;
          outline: none;
          transition: border-color 0.15s;
        }
        .search-input:focus {
          border-color: #c8854a;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #a08070;
          pointer-events: none;
        }
        .section-header {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #a0aec0;
          letter-spacing: 0.05em;
          margin-top: 8px;
          margin-bottom: 8px;
          padding-left: 8px;
        }
        /* Pagination Styling */
        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 4px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 30px;
          min-width: 30px;
          padding: 0 6px;
          border: 1px solid #eedcd0;
          background: #ffffff;
          color: #4a2018;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pagination-btn:hover:not(:disabled) {
          border-color: #c8854a;
          background: rgba(74, 32, 24, 0.05);
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #f8fafc;
        }
        .pagination-btn.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
        .pagination-ellipsis {
          color: #a08070;
          font-size: 0.85rem;
          padding: 0 4px;
          user-select: none;
        }
        .pagination-readout {
          font-size: 0.75rem;
          color: #7a625d;
          font-weight: 500;
        }

        .tree-container {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }
        .tree-container::-webkit-scrollbar {
          width: 8px;
        }
        .tree-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .tree-container::-webkit-scrollbar-thumb {
          background: rgba(74, 32, 24, 0.25);
          border-radius: 4px;
        }
        .tree-container::-webkit-scrollbar-thumb:hover {
          background: #c8854a;
        }
        .node-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
        }
        .node-row:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        .folder-node > .node-row .node-text {
          font-weight: 600;
          color: #2d3748;
        }
        .node-row.collection-expanded {
          background: rgba(45, 74, 107, 0.08) !important;
          color: #2d4a6b;
        }
        .node-row.collection-expanded:hover {
          background: rgba(45, 74, 107, 0.12) !important;
        }
        .node-row.collection-expanded .expand-icon-wrapper,
        .node-row.collection-expanded .collection-icon {
          color: #3b82f6;
        }
        .node-row.collection-expanded .node-text {
          color: #2d4a6b;
        }
        .node-row.collection-expanded .node-badge {
          background: rgba(59, 130, 246, 0.15);
          color: #2563eb;
        }
        .expand-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a0aec0;
          min-width: 16px;
        }
        .folder-icon {
          color: #d97706;
        }
        .collection-icon {
          color: #2563eb;
        }
        .node-text {
          font-size: 0.9rem;
          font-weight: 500;
          color: #2d3748;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .node-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          background: rgba(0, 0, 0, 0.06);
          color: #4a5568;
          border-radius: 12px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .game-node-row {
          margin-top: 2px;
        }
        .game-node-row.active-game {
          background: rgba(37, 99, 235, 0.15) !important;
          color: #1e3a8a;
          border-left: 3px solid #2563eb;
          border-radius: 0 6px 6px 0;
          padding-left: 5px;
        }
        .game-node-row.active-game .node-text {
          font-weight: 600;
          color: #1e3a8a;
        }
        .game-node-row.active-game .game-icon {
          color: #2563eb;
        }
        .game-node-row .node-text {
          font-weight: 400;
          color: #4a5568;
        }
        .game-index {
          font-size: 11px;
          color: #a0aec0;
          min-width: 14px;
          text-align: right;
          margin-right: 4px;
        }
        .game-icon {
          color: #a0aec0;
        }
        .game-result-badge {
          background: #f1ede9;
          color: #5c4e4b;
        }
        .more-games-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          margin-left: -14px;
          padding-left: 14px;
          font-size: 0.85rem;
          color: #059669;
          cursor: pointer;
          font-weight: 500;
          border-radius: 6px;
          transition: background 0.15s;
          margin-top: 2px;
        }
        .more-games-row:hover {
          background: #e6f6ee;
        }
        .more-games-chevron {
          color: #059669;
        }
        .folder-node, .collection-node {
          margin-bottom: 2px;
        }
        .children-container {
          margin-left: 4px;
          padding-left: 10px;
          border-left: 1px dashed rgba(45, 74, 107, 0.15);
          margin-top: 4px;
          margin-bottom: 4px;
        }
        .loading-wrapper, .empty-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: #a08070;
          gap: 8px;
        }
        .empty-text {
          font-size: 0.85rem;
        }
        .scroll-top-btn {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: 104px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #4a2018;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
          animation: fadeIn 0.2s ease-out;
        }
        .scroll-top-btn:hover {
          background: #c8854a;
        }

        /* Modals & Context Menu */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(74, 32, 24, 0.4);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.15s ease-out;
        }
        .modal-content {
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 12px;
          padding: 20px;
          width: 320px;
          box-shadow: 0 20px 25px -5px rgba(74, 32, 24, 0.15), 0 10px 10px -5px rgba(74, 32, 24, 0.1);
          animation: scaleUp 0.15s ease-out;
        }
        .modal-title {
          font-size: 1rem;
          font-weight: 700;
          color: #4a2018;
          margin-top: 0;
          margin-bottom: 12px;
          text-transform: capitalize;
        }
        .modal-description {
          font-size: 0.82rem;
          color: #7a625d;
          margin-bottom: 16px;
          line-height: 1.4;
        }
        .modal-input, .modal-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          font-size: 0.85rem;
          color: #4a2018;
          outline: none;
          background: #ffffff;
          margin-bottom: 16px;
        }
        .modal-input:focus, .modal-select:focus {
          border-color: #c8854a;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.1s ease;
        }
        .btn-secondary {
          background: rgba(74, 32, 24, 0.08);
          color: #4a2018;
        }
        .btn-secondary:hover {
          background: rgba(74, 32, 24, 0.12);
        }
        .btn-primary {
          background: #c8854a;
          color: #ffffff;
        }
        .btn-primary:hover:not(:disabled) {
          background: #b27339;
        }
        .btn-danger {
          background: #ef4444;
          color: #ffffff;
        }
        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .custom-context-menu {
          position: fixed;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(74, 32, 24, 0.12), 0 8px 10px -6px rgba(74, 32, 24, 0.06);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          padding: 6px;
          min-width: 180px;
          animation: contextFadeIn 0.12s ease-out;
          pointer-events: auto;
        }
        .context-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 12px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #4a2018;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.1s ease;
        }
        .context-menu-item-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .context-menu-item:hover:not(:disabled) {
          background: #fdf5ea;
          color: #4a2018;
        }
        .context-menu-item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: transparent;
          color: #a08070;
        }
        .context-menu-item.text-danger {
          color: #ef4444;
        }
        .context-menu-item.text-danger:hover:not(:disabled) {
          background: #fee2e2;
          color: #ef4444;
        }
        .context-menu-chevron {
          color: #a08070;
          opacity: 0.7;
          transition: transform 0.1s ease;
        }
        .context-menu-item:hover:not(:disabled) .context-menu-chevron {
          color: #4a2018;
          opacity: 1;
        }
        .context-menu-divider {
          border: 0;
          border-top: 1px solid #eedcd0;
          margin: 6px 4px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes contextFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
