'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ChessBoard from '@/components/chess/ChessBoard';
import { 
  parsePgnToMoveTree, 
  buildPgnFromMoveTree,
  promoteToMainline,
  promoteVariation,
  deleteSubsequentMoves,
  deletePreviousMoves,
  deleteMove
} from './pgnUtils';
import { MoveNode } from '@vca/types';
import { applyContextMenuPosition } from '@/lib/utils/contextMenuUtils';
import UploadPgnModal from '@/components/chess/UploadPgnModal';
import { AnnotationsPanel } from '@/components/chess/AnnotationsPanel';
import {
  Folder,
  FolderPlus,
  FileText,
  Share2,
  Trash2,
  Edit3,
  Upload,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Database,
  Lock,
  Globe,
  Users,
  X,
  Loader2,
  BookOpen,
  History as HistoryIcon,
  ArrowUp,
  ArrowUpToLine,
  UserPlus,
  Save
} from 'lucide-react';

interface GameMetadata {
  id: string;
  orderIndex: number;
  chapterName: string;
  result: string | null;
  initialFen: string | null;
}

interface Collection {
  id: string;
  name: string;
  folderId: string | null;
  visibility: 'public' | 'private';
  source: 'upload' | 'analysis' | 'classroom';
  ownerId: string;
  createdAt: string;
  games: GameMetadata[];
  shares: any[];
}

interface FolderData {
  id: string;
  name: string;
  parentFolderId: string | null;
  visibility: 'public' | 'private';
  ownerId: string;
}

interface SharedData {
  folders: FolderData[];
  collections: Collection[];
  games: (any & { collectionId: string })[];
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

interface DatabaseModuleProps {
  role: 'ADMIN' | 'COACH' | 'STUDENT';
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function DatabaseModule({ role }: DatabaseModuleProps) {
  // Tree state
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Expanded nodes in tree
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'virtual_public': true,
    'virtual_my': true,
    'virtual_shared': true
  });
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [collectionPages, setCollectionPages] = useState<Record<string, number>>({});

  // Selection state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<any | null>(null);
  const [loadingGame, setLoadingGame] = useState(false);
  
  // Selected Game move traversal state
  const [nodes, setNodes] = useState<Record<string, MoveNode>>({});
  const [currentNodeId, setCurrentNodeId] = useState<string>('root');
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);

  // Editing state
  const [isModified, setIsModified] = useState(false);
  const [savingGame, setSavingGame] = useState(false);

  const [moveContextMenu, setMoveContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  const handleMoveContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    
    // Apply position clamp similar to classroom
    const menuWidth = 220; 
    const menuHeight = 250; 
    let x = e.clientX;
    let y = e.clientY;
    
    if (typeof window !== 'undefined') {
      if (x + menuWidth > window.innerWidth) {
        x = x - menuWidth;
      }
      if (y + menuHeight > window.innerHeight) {
        y = y - menuHeight;
      }
      x = Math.max(0, x);
      y = Math.max(0, y);
    }
    
    setMoveContextMenu({ x, y, nodeId });
  };

  const handleMakeMainline = (nodeId: string) => {
    setNodes(prev => {
      const next = { ...prev };
      promoteToMainline(next, nodeId);
      return next;
    });
    setIsModified(true);
    setMoveContextMenu(null);
  };

  const handlePromoteVariation = (nodeId: string) => {
    setNodes(prev => {
      const next = { ...prev };
      promoteVariation(next, nodeId);
      return next;
    });
    setIsModified(true);
    setMoveContextMenu(null);
  };

  const handleDeleteSubsequent = (nodeId: string) => {
    setNodes(prev => {
      const next = { ...prev };
      deleteSubsequentMoves(next, nodeId);
      return next;
    });
    setIsModified(true);
    setMoveContextMenu(null);
  };

  const handleDeletePrevious = (nodeId: string) => {
    setNodes(prev => {
      const next = { ...prev };
      deletePreviousMoves(next, nodeId);
      return next;
    });
    setIsModified(true);
    setMoveContextMenu(null);
  };

  const handleDeleteMove = (nodeId: string) => {
    setNodes(prev => {
      const next = { ...prev };
      deleteMove(next, nodeId);
      if (!next[currentNodeId]) {
        setCurrentNodeId('root');
      }
      return next;
    });
    setIsModified(true);
    setMoveContextMenu(null);
  };

  // Scroll to top state & ref
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 80) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    if (sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Modals state
  const [modalType, setModalType] = useState<'create_folder' | 'rename_folder' | 'delete_folder' | 'upload_pgn' | 'share' | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderData | null>(null);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [modalVisibility, setModalVisibility] = useState<'public' | 'private'>('private');
  const [modalFolderParentId, setModalFolderParentId] = useState<string | null>(null);
  const [uploadPgnText, setUploadPgnText] = useState('');
  const [shareUsername, setShareUsername] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);

  const [shared, setShared] = useState<SharedData>({ folders: [], collections: [], games: [], shares: [] });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    entityId: string;
    entityName: string;
    entityType: 'folder' | 'collection' | 'game';
    isSharedItem: boolean;
  } | null>(null);

  const [activeModal, setActiveModal] = useState<'rename' | 'move' | 'share' | 'delete' | null>(null);
  const [activeModalEntity, setActiveModalEntity] = useState<{
    entityId: string;
    entityName: string;
    entityType: 'folder' | 'collection' | 'game';
  } | null>(null);

  const [submittingModal, setSubmittingModal] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState('');

  // Fetch initial tree data
  const fetchTree = async () => {
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
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Drag & Drop State
  const [draggedEntity, setDraggedEntity] = useState<{ id: string; type: 'folder' | 'collection'; parentId: string | null; visibility: 'public' | 'private' } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'virtual_public' | 'virtual_my'>(null);

  // Undo Toast State
  const [toast, setToast] = useState<{
    message: string;
    onUndo: () => void;
    visible: boolean;
  } | null>(null);

  // Navigable Picker State
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerNewFolderOpen, setPickerNewFolderOpen] = useState(false);
  const [pickerNewFolderName, setPickerNewFolderName] = useState('');

  // Helpers for Writable Check and Descendant Check
  const isFolderWritable = (folder: FolderData) => {
    if (folder.visibility === 'public') return role === 'ADMIN';
    return folder.ownerId === currentUserId;
  };

  const isCollectionWritable = (col: Collection) => {
    if (col.visibility === 'public') return role === 'ADMIN';
    return col.ownerId === currentUserId;
  };

  const isDescendant = (childId: string, parentId: string): boolean => {
    let curr = folders.find(f => f.id === childId);
    while (curr && curr.parentFolderId) {
      if (curr.parentFolderId === parentId) return true;
      curr = folders.find(f => f.id === curr.parentFolderId);
    }
    return false;
  };

  const isValidDropTarget = (
    dragged: { id: string; type: 'folder' | 'collection'; parentId: string | null; visibility: 'public' | 'private' },
    targetId: string | null | 'virtual_public' | 'virtual_my'
  ): boolean => {
    let targetFolderId: string | null = null;
    let targetVisibility: 'public' | 'private' = dragged.visibility;

    if (targetId === 'virtual_public') {
      targetFolderId = null;
      targetVisibility = 'public';
    } else if (targetId === 'virtual_my') {
      targetFolderId = null;
      targetVisibility = 'private';
    } else if (targetId) {
      const targetFolder = folders.find(f => f.id === targetId);
      if (!targetFolder) return false;
      targetFolderId = targetFolder.id;
      targetVisibility = targetFolder.visibility;
    } else {
      return false;
    }

    if (dragged.visibility !== targetVisibility) return false;
    if (targetVisibility === 'public' && role !== 'ADMIN') return false;
    if (dragged.parentId === targetFolderId) return false;

    if (dragged.type === 'folder') {
      if (targetFolderId === dragged.id) return false;
      if (targetFolderId && isDescendant(targetFolderId, dragged.id)) return false;
    }

    return true;
  };

  const executeMove = async (
    type: 'folder' | 'collection',
    entityId: string,
    targetFolderId: string | null,
    originalParentId: string | null
  ) => {
    // Optimistically update local state
    if (type === 'folder') {
      setFolders(prev => prev.map(f => f.id === entityId ? { ...f, parentFolderId: targetFolderId } : f));
    } else {
      setCollections(prev => prev.map(c => c.id === entityId ? { ...c, folderId: targetFolderId } : c));
    }

    const apiCall = async (targetId: string | null) => {
      const url = type === 'folder' 
        ? `/api/database/folders/${entityId}/move`
        : `/api/database/collections/${entityId}/move`;
      return fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolderId: targetId })
      });
    };

    try {
      const res = await apiCall(targetFolderId);
      if (!res.ok) {
        throw new Error('Move failed');
      }
    } catch (err) {
      console.error(err);
      if (type === 'folder') {
        setFolders(prev => prev.map(f => f.id === entityId ? { ...f, parentFolderId: originalParentId } : f));
      } else {
        setCollections(prev => prev.map(c => c.id === entityId ? { ...c, folderId: originalParentId } : c));
      }
      alert('Failed to move item.');
      return;
    }

    const handleUndo = async () => {
      if (type === 'folder') {
        setFolders(prev => prev.map(f => f.id === entityId ? { ...f, parentFolderId: originalParentId } : f));
      } else {
        setCollections(prev => prev.map(c => c.id === entityId ? { ...c, folderId: originalParentId } : c));
      }
      setToast(null);

      try {
        const res = await apiCall(originalParentId);
        if (!res.ok) {
          throw new Error('Revert failed');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to undo move.');
        fetchTree();
      }
    };

    const entityName = type === 'folder' 
      ? folders.find(f => f.id === entityId)?.name || 'Folder'
      : collections.find(c => c.id === entityId)?.name || 'Collection';
    const targetName = targetFolderId 
      ? folders.find(f => f.id === targetFolderId)?.name || 'Folder'
      : 'Root';

    setToast({
      message: `Moved "${entityName}" to "${targetName}"`,
      onUndo: handleUndo,
      visible: true
    });

    setTimeout(() => {
      setToast(prev => prev && prev.onUndo === handleUndo ? null : prev);
    }, 6000);
  };

  const entityVisibility = useMemo(() => {
    if (!activeModalEntity) return 'private';
    if (activeModalEntity.entityType === 'folder') {
      const f = folders.find(folder => folder.id === activeModalEntity.entityId);
      return f?.visibility || 'private';
    } else if (activeModalEntity.entityType === 'collection') {
      const c = collections.find(col => col.id === activeModalEntity.entityId);
      return c?.visibility || 'private';
    }
    return 'private';
  }, [activeModalEntity, folders, collections]);

  const pickerBreadcrumbs = useMemo(() => {
    const list: { id: string | null; name: string }[] = [];
    let currId = pickerFolderId;
    while (currId) {
      const f = folders.find(folder => folder.id === currId);
      if (!f) break;
      list.unshift({ id: f.id, name: f.name });
      currId = f.parentFolderId;
    }
    list.unshift({ id: null, name: entityVisibility === 'public' ? 'Public DB' : 'My DB' });
    return list;
  }, [pickerFolderId, folders, entityVisibility]);

  const pickerFolders = useMemo(() => {
    const visibility = entityVisibility;
    const allowedFolders = folders.filter(f => {
      if (f.visibility !== visibility) return false;
      if (visibility === 'public') return role === 'ADMIN';
      return f.ownerId === currentUserId;
    });

    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      return allowedFolders.filter(f => f.name.toLowerCase().includes(q));
    } else {
      return allowedFolders.filter(f => f.parentFolderId === pickerFolderId);
    }
  }, [folders, pickerFolderId, pickerSearch, entityVisibility, role, currentUserId]);

  const currentParentId = useMemo(() => {
    if (!activeModalEntity) return null;
    if (activeModalEntity.entityType === 'folder') {
      const f = folders.find(folder => folder.id === activeModalEntity.entityId);
      return f ? f.parentFolderId : null;
    } else if (activeModalEntity.entityType === 'collection') {
      const c = collections.find(col => col.id === activeModalEntity.entityId);
      return c ? c.folderId : null;
    }
    return null;
  }, [activeModalEntity, folders, collections]);

  const checkFolderTargetStatus = (folderId: string | null) => {
    if (!activeModalEntity) return { valid: false, label: '' };
    
    if (activeModalEntity.entityType === 'folder') {
      if (folderId === activeModalEntity.entityId) {
        return { valid: false, label: 'Cannot move folder into itself' };
      }
      if (folderId && isDescendant(folderId, activeModalEntity.entityId)) {
        return { valid: false, label: 'Cannot move folder into its descendant' };
      }
    }

    if (folderId === currentParentId) {
      return { valid: false, label: 'Already here' };
    }

    return { valid: true, label: '' };
  };

  const currentStatus = checkFolderTargetStatus(pickerFolderId);

  const handleCreateFolderInline = async () => {
    if (!pickerNewFolderName.trim()) return;
    try {
      const res = await fetch('/api/database/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pickerNewFolderName.trim(),
          parentFolderId: pickerFolderId,
          visibility: entityVisibility
        })
      });
      if (res.ok) {
        await fetchTree();
        setPickerNewFolderOpen(false);
        setPickerNewFolderName('');
      } else {
        alert('Failed to create folder');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating folder');
    }
  };


  // Reset suggestions when modals close
  useEffect(() => {
    if (!modalType && !activeModal) {
      setSuggestions([]);
    }
  }, [modalType, activeModal]);

  // Fetch users for sharing dropdown
  useEffect(() => {
    if (modalType === 'share' || activeModal === 'share') {
      fetch('/api/users/share-search')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUsersList(data);
          }
        })
        .catch(err => console.error('Failed to fetch users list:', err));
    }
  }, [modalType, activeModal]);

  // Load a game
  const selectGame = async (gameId: string) => {
    setLoadingGame(true);
    setSelectedGameId(gameId);
    try {
      const res = await fetch(`/api/database/games/${gameId}`);
      if (res.ok) {
        const game = await res.json();
        setActiveGame(game);

        // Parse PGN
        const { nodes: parsedNodes, rootId } = parsePgnToMoveTree(game.pgn || '');
        setNodes(parsedNodes);
        setCurrentNodeId(rootId);
        setSelectedVariationIndex(0);
        setIsModified(false);
      }
    } catch (e) {
      console.error('Failed to fetch game details:', e);
    } finally {
      setLoadingGame(false);
    }
  };

  const updateNodeAnnotations = React.useCallback((nodeId: string, comment?: string, glyphs?: string[]) => {
    setNodes(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        comment: comment || undefined,
        glyphs: glyphs || [],
      }
    }));
    setIsModified(true);
  }, []);

  const handleMove = React.useCallback((move: any, index: number, afterFen: string) => {
    const nodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setNodes(prev => {
      const parentNode = prev[currentNodeId] || prev['root'];
      if (!parentNode) return prev;
      
      const newMoveNumber = parentNode.turn === 'w' ? parentNode.moveNumber : parentNode.moveNumber + 1;
      
      const newNode: MoveNode = {
        id: nodeId,
        fen: afterFen,
        san: move.san || '--',
        isNull: move.san === '--',
        parentId: currentNodeId,
        children: [],
        moveNumber: newMoveNumber,
        turn: parentNode.turn === 'w' ? 'b' : 'w',
        from: move.from,
        to: move.to,
        arrows: [],
        glyphs: []
      };
      
      return {
        ...prev,
        [nodeId]: newNode,
        [currentNodeId]: {
          ...parentNode,
          children: [...parentNode.children, nodeId]
        }
      };
    });
    
    setCurrentNodeId(nodeId);
    setSelectedVariationIndex(0);
    setIsModified(true);
  }, [currentNodeId]);

  const handleSaveGame = async () => {
    if (!selectedGameId || !activeGame) return;
    setSavingGame(true);
    try {
      const newPgn = buildPgnFromMoveTree(nodes, 'root', activeGame.headers);
      const res = await fetch(`/api/database/games/${selectedGameId}/pgn`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pgn: newPgn })
      });
      if (res.ok) {
        setIsModified(false);
        setActiveGame((prev: any) => ({ ...prev, pgn: newPgn }));
      } else {
        const error = await res.json();
        alert('Failed to save game: ' + error.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error saving game.');
    } finally {
      setSavingGame(false);
    }
  };

  // Traversal helpers
  const getPathToRoot = (nodeId: string, tree: Record<string, MoveNode>): string[] => {
    if (!tree || !nodeId || !tree[nodeId]) return [START_FEN];
    
    const path: string[] = [];
    let curr = tree[nodeId];
    while (curr) {
      path.unshift(curr.fen);
      curr = curr.parentId ? tree[curr.parentId] : (null as any);
    }
    return path;
  };

  const gameHistory = useMemo(() => getPathToRoot(currentNodeId, nodes), [nodes, currentNodeId]);

  const hasWriteAccess = useMemo(() => {
    if (!activeGame || !activeGame.collection) return false;
    if (activeGame.collection.visibility === 'public') return role === 'ADMIN';
    return activeGame.collection.ownerId === currentUserId;
  }, [activeGame, role, currentUserId]);

  const currentNode = nodes[currentNodeId];

  const canGoNext = currentNode?.children.length > 0;
  const canGoPrev = currentNode?.parentId !== null;
  const numBranches = currentNode?.children.length || 0;
  const branches = currentNode?.children.map(id => ({ id, san: nodes[id].san })) || [];

  const handleNext = () => {
    if (canGoNext) {
      const safeIdx = Math.min(selectedVariationIndex, numBranches - 1);
      setCurrentNodeId(currentNode.children[safeIdx]);
      setSelectedVariationIndex(0);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentNodeId(currentNode.parentId!);
      setSelectedVariationIndex(0);
    }
  };

  const handleStart = () => {
    setCurrentNodeId('root');
    setSelectedVariationIndex(0);
  };

  const handleEnd = () => {
    let curr = currentNode;
    while (curr && curr.children.length > 0) {
      curr = nodes[curr.children[0]];
    }
    if (curr) {
      setCurrentNodeId(curr.id);
      setSelectedVariationIndex(0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
        // Avoid intercepting if focus is in input
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        if (e.key === 'ArrowLeft' && canGoPrev) handlePrev();
        if (e.key === 'ArrowRight' && canGoNext) handleNext();
        if (e.key === 'Home') handleStart();
        if (e.key === 'End') handleEnd();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, currentNodeId, canGoNext, canGoPrev, selectedVariationIndex]);

  // Folder CRUD handlers
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInput.trim()) return;

    try {
      const res = await fetch('/api/database/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalInput,
          parentFolderId: modalFolderParentId,
          visibility: modalVisibility
        })
      });
      if (res.ok) {
        await fetchTree();
        setModalType(null);
        setModalInput('');
      } else {
        let errorMsg = 'Failed to create folder';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status}`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolder || !modalInput.trim()) return;

    try {
      const res = await fetch(`/api/database/folders/${activeFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modalInput })
      });
      if (res.ok) {
        await fetchTree();
        setModalType(null);
        setModalInput('');
      } else {
        let errorMsg = 'Failed to rename folder';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status}`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFolder = async () => {
    if (!activeFolder) return;
    try {
      const res = await fetch(`/api/database/folders/${activeFolder.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchTree();
        setModalType(null);
      } else {
        let errorMsg = 'Failed to delete folder';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status}`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload PGN handler
  const handleUploadPgn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInput.trim() || !uploadPgnText.trim()) return;

    try {
      const res = await fetch('/api/database/collections/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalInput,
          folderId: modalFolderParentId,
          visibility: modalVisibility,
          pgnText: uploadPgnText
        })
      });
      if (res.ok) {
        await fetchTree();
        setModalType(null);
        setModalInput('');
        setUploadPgnText('');
      } else {
        let errorMsg = 'Failed to upload PGN';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status}`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Share collection handler
  const handleShareCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollection || !shareUsername) return;

    try {
      const res = await fetch('/api/database/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: activeCollection.id,
          sharedWithUsername: shareUsername,
          permission: 'read'
        })
      });
      if (res.ok) {
        await fetchTree();
        setModalType(null);
        setShareUsername('');
      } else {
        let errorMsg = 'Failed to share collection';
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } else {
          errorMsg = `Server error: ${res.status}`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    entityId: string,
    entityName: string,
    entityType: 'folder' | 'collection' | 'game',
    isSharedItem: boolean = false
  ) => {
    e.preventDefault();
    e.stopPropagation();

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
    if (contextMenu.isSharedItem) return false;
    
    if (contextMenu.entityType === 'game') {
      const parentCol = collections.find(c => c.games.some(g => g.id === contextMenu.entityId));
      if (!parentCol) return false;
      if (parentCol.visibility === 'public' && role !== 'ADMIN') return false;
      if (parentCol.ownerId !== currentUserId) return false;
    } else if (contextMenu.entityType === 'folder') {
      const folder = folders.find(f => f.id === contextMenu.entityId);
      if (!folder) return false;
      if (folder.visibility === 'public' && role !== 'ADMIN') return false;
      if (folder.ownerId !== currentUserId) return false;
    } else if (contextMenu.entityType === 'collection') {
      const col = collections.find(c => c.id === contextMenu.entityId);
      if (!col) return false;
      if (col.visibility === 'public' && role !== 'ADMIN') return false;
      if (col.ownerId !== currentUserId) return false;
    }
    return true;
  }, [contextMenu, folders, collections, role, currentUserId]);

  const moveFolderOptions = useMemo(() => {
    if (!contextMenu || contextMenu.entityType === 'game') return [];
    const folder = folders.find(f => f.id === contextMenu.entityId);
    const col = collections.find(c => c.id === contextMenu.entityId);
    const visibility = folder?.visibility || col?.visibility || 'private';
    return folders.filter(f => f.ownerId === currentUserId && f.visibility === visibility && f.id !== contextMenu.entityId);
  }, [folders, collections, contextMenu, currentUserId]);

  const moveCollectionOptions = useMemo(() => {
    if (!contextMenu || contextMenu.entityType !== 'game') return [];
    const parentCol = collections.find(c => c.games.some(g => g.id === contextMenu.entityId));
    const visibility = parentCol?.visibility || 'private';
    return collections.filter(c => c.ownerId === currentUserId && c.visibility === visibility);
  }, [collections, contextMenu, currentUserId]);

  const handleLoadGameDirectly = (gameId: string) => {
    selectGame(gameId);
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

  // Native contextmenu listener on document to reliably intercept right-clicks inside .tree-scroll-area
  useEffect(() => {
    const handleNativeContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tree-scroll-area')) return;

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

  // Chapter navigation (step through games in collection)
  const collectionGames = useMemo(() => {
    if (!activeGame) return [];
    const col = collections.find(c => c.id === activeGame.collectionId);
    return col?.games || [];
  }, [activeGame, collections]);

  const currentChapterIdx = useMemo(() => {
    if (!activeGame || !collectionGames.length) return -1;
    return collectionGames.findIndex(g => g.id === activeGame.id);
  }, [activeGame, collectionGames]);

  const stepChapter = (dir: 'next' | 'prev') => {
    if (currentChapterIdx === -1) return;
    const nextIdx = dir === 'next' ? currentChapterIdx + 1 : currentChapterIdx - 1;
    if (nextIdx >= 0 && nextIdx < collectionGames.length) {
      selectGame(collectionGames[nextIdx].id);
    }
  };

  // Toggle tree expansion
  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCollection = (id: string) => {
    setExpandedCollections(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  // Group direct shares by the user who shared them
  const sharers = useMemo(() => {
    const map = new Map<string, { id: string; username: string }>();
    filteredShared.shares.forEach(s => {
      if (s.sharedByUser) {
        map.set(s.sharedByUser.id, s.sharedByUser);
      }
    });
    return Array.from(map.values());
  }, [filteredShared.shares]);

  const renderPaginatedGames = (col: Collection, isShared: boolean) => {
    const itemsPerPage = 20;
    const currentPage = collectionPages[col.id] || 1;
    const totalPages = Math.ceil(col.games.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedGames = col.games.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="tree-children-container">
        <div key={`${col.id}-page-${currentPage}`} className="tree-games-page-animate">
          {paginatedGames.map((game, idx) => {
            const globalIdx = startIndex + idx;
            return (
              <button
                key={game.id}
                className={`tree-game-btn ${selectedGameId === game.id ? 'active' : ''}`}
                onClick={() => selectGame(game.id)}
                data-context-entity-id={game.id}
                data-context-entity-name={game.chapterName}
                data-context-entity-type="game"
                data-context-shared={isShared ? "true" : "false"}
              >
                <FileText size={14} />
                <span style={{ marginRight: '4px', opacity: 0.6 }}>{globalIdx + 1}.</span>
                <span className="game-chapter-name">{game.chapterName}</span>
                {game.result && <span className="game-result-badge">{game.result}</span>}
              </button>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCollectionPages(prev => ({ ...prev, [col.id]: currentPage - 1 }));
              }}
            >
              Prev
            </button>
            <span className="pagination-info">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCollectionPages(prev => ({ ...prev, [col.id]: currentPage + 1 }));
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSharedFolderContent = (folderId: string | null, sharerId: string) => {
    const childFolders = filteredShared.folders.filter(f => f.parentFolderId === folderId && f.ownerId === sharerId);
    const childCollections = filteredShared.collections.filter(c => c.folderId === folderId && c.ownerId === sharerId);

    if (childFolders.length === 0 && childCollections.length === 0) {
      return null;
    }

    return (
      <div className="tree-children-container">
        {childFolders.map(folder => {
          const isExpanded = !!expandedFolders[folder.id];
          return (
            <div key={folder.id} className="tree-folder-node">
              <div 
                className="tree-node-row"
                data-context-entity-id={folder.id}
                data-context-entity-name={folder.name}
                data-context-entity-type="folder"
                data-context-shared="true"
              >
                <button className="tree-node-toggle" onClick={() => toggleFolder(folder.id)}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Folder size={16} className="text-folder" />
                  <span className="node-label">{folder.name}</span>
                </button>
              </div>
              {isExpanded && renderSharedFolderContent(folder.id, sharerId)}
            </div>
          );
        })}

        {childCollections.map(col => {
          const isExpanded = !!expandedCollections[col.id];
          return (
            <div key={col.id} className="tree-collection-node">
              <div 
                className="tree-node-row"
                data-context-entity-id={col.id}
                data-context-entity-name={col.name}
                data-context-entity-type="collection"
                data-context-shared="true"
              >
                <button className="tree-node-toggle" onClick={() => toggleCollection(col.id)}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <BookOpen size={16} className="text-collection" />
                  <span className="node-label">{col.name}</span>
                  <span className="node-badge">{col.games.length} ch</span>
                </button>
              </div>
              {isExpanded && renderPaginatedGames(col, true)}
            </div>
          );
        })}
      </div>
    );
  };

  // Recursively render Folder/Collection elements
  const renderFolderContent = (folderId: string | null, parentVisibility: 'public' | 'private') => {
    const { folders: fList, collections: cList } = filteredTree;

    const childFolders = fList.filter(f => f.parentFolderId === folderId && f.visibility === parentVisibility && (parentVisibility === 'public' || f.ownerId === currentUserId));
    const childCollections = cList.filter(c => c.folderId === folderId && c.visibility === parentVisibility && (parentVisibility === 'public' || c.ownerId === currentUserId));

    return (
      <div className="tree-children-container">
        {childFolders.map(folder => {
          const isExpanded = !!expandedFolders[folder.id];
          const hasAdminAccess = folder.visibility === 'public' && role === 'ADMIN';
          const hasMyAccess = folder.visibility === 'private';
          
          return (
            <div key={folder.id} className="tree-folder-node">
              <div 
                className={`tree-node-row ${dragOverFolderId === folder.id ? 'drag-over' : ''}`}
                data-context-entity-id={folder.id}
                data-context-entity-name={folder.name}
                data-context-entity-type="folder"
                data-context-shared="false"
                draggable={isFolderWritable(folder)}
                onDragStart={(e) => {
                  setDraggedEntity({
                    id: folder.id,
                    type: 'folder',
                    parentId: folder.parentFolderId,
                    visibility: folder.visibility
                  });
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDraggedEntity(null);
                  setDragOverFolderId(null);
                }}
                onDragOver={(e) => {
                  if (!draggedEntity) return;
                  if (isValidDropTarget(draggedEntity, folder.id)) {
                    e.preventDefault();
                    setDragOverFolderId(folder.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverFolderId === folder.id) {
                    setDragOverFolderId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedEntity) return;
                  if (isValidDropTarget(draggedEntity, folder.id)) {
                    executeMove(draggedEntity.type, draggedEntity.id, folder.id, draggedEntity.parentId);
                  }
                  setDraggedEntity(null);
                  setDragOverFolderId(null);
                }}
              >
                <button className="tree-node-toggle" onClick={() => toggleFolder(folder.id)}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <Folder size={16} className="text-folder" />
                  <span className="node-label">{folder.name}</span>
                </button>

                <div className="node-actions">
                  {(hasAdminAccess || hasMyAccess) && (
                    <>
                      <button
                        title="Create Subfolder"
                        onClick={() => {
                          setModalFolderParentId(folder.id);
                          setModalVisibility(folder.visibility);
                          setModalType('create_folder');
                        }}
                      >
                        <FolderPlus size={14} />
                      </button>
                      {((role === 'ADMIN' && folder.visibility === 'public') || folder.visibility === 'private') && (
                        <button
                          title="Upload PGN Here"
                          onClick={() => {
                            setModalFolderParentId(folder.id);
                            setModalVisibility(folder.visibility);
                            setModalType('upload_pgn');
                          }}
                        >
                          <Upload size={14} />
                        </button>
                      )}
                      <button
                        title="Rename"
                        onClick={() => {
                          setActiveFolder(folder);
                          setModalInput(folder.name);
                          setModalType('rename_folder');
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        title="Delete"
                        className="text-danger"
                        onClick={() => {
                          setActiveFolder(folder);
                          setModalType('delete_folder');
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && renderFolderContent(folder.id, parentVisibility)}
            </div>
          );
        })}

        {childCollections.map(col => {
          const isExpanded = !!expandedCollections[col.id];
          
          return (
            <div key={col.id} className="tree-collection-node">
              <div 
                className="tree-node-row"
                data-context-entity-id={col.id}
                data-context-entity-name={col.name}
                data-context-entity-type="collection"
                data-context-shared="false"
                draggable={isCollectionWritable(col)}
                onDragStart={(e) => {
                  setDraggedEntity({
                    id: col.id,
                    type: 'collection',
                    parentId: col.folderId,
                    visibility: col.visibility
                  });
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDraggedEntity(null);
                  setDragOverFolderId(null);
                }}
              >
                <button className="tree-node-toggle" onClick={() => toggleCollection(col.id)}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <BookOpen size={16} className="text-collection" />
                  <span className="node-label">{col.name}</span>
                  <span className="node-badge">{col.games.length} ch</span>
                </button>

                <div className="node-actions">
                  {col.visibility === 'private' && (
                    <button
                      title="Share Collection"
                      onClick={() => {
                        setActiveCollection(col);
                        setModalType('share');
                      }}
                    >
                      <Share2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && renderPaginatedGames(col, false)}
            </div>
          );
        })}
      </div>
    );
  };

  // Shared MoveTree renderer (identical notation style as classroom)
  const InlineVariation = ({ nodeId }: { nodeId: string }) => {
    const node = nodes[nodeId];
    if (!node || node.children.length === 0) return null;

    const elements: React.JSX.Element[] = [];
    let currId = node.children[0];
    let parentNode = node;

    while (currId) {
      const curr = nodes[currId];
      if (!curr) break;
      const isWhite = curr.turn === 'w';
      const showNum = elements.length === 0 || isWhite;
      elements.push(
        <React.Fragment key={curr.id}>
          {showNum && <span className="pgn-num">{curr.moveNumber}{isWhite ? '.' : '...'}</span>}
          <button
            className={`m-btn inline-btn ${currentNodeId === curr.id ? 'active' : ''}`}
            onClick={() => setCurrentNodeId(curr.id)}
          >
            {curr.san}
            {curr.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
          </button>
          {curr.comment && <span className="inline-comment">{curr.comment}</span>}
          {parentNode.children.length > 1 && parentNode.children[0] === currId && (
            <React.Fragment>
              {parentNode.children.slice(1).map(vId => (
                <div key={vId} className="variation-block">
                  <span className="pgn-num">{nodes[vId].moveNumber}{nodes[vId].turn === 'w' ? '.' : '...'}</span>
                  <button
                    className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`}
                    onClick={() => setCurrentNodeId(vId)}
                  >
                    {nodes[vId].san}
                    {nodes[vId].glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
                  </button>
                  {nodes[vId].comment && <span className="inline-comment">{nodes[vId].comment}</span>}
                  <InlineVariation nodeId={vId} />
                </div>
              ))}
            </React.Fragment>
          )}
        </React.Fragment>
      );
      if (curr.children.length > 0) {
        parentNode = curr;
        currId = curr.children[0];
      } else break;
    }
    return <span className="inline-variation-line">{elements}</span>;
  };

  const renderMoveTree = (nodeId: string): React.JSX.Element[] => {
    const node = nodes[nodeId];
    if (!node || node.children.length === 0) return [];

    const elements: React.JSX.Element[] = [];
    const children = node.children;
    const mainId = children[0];
    const mainNode = nodes[mainId];

    if (mainNode.turn === 'w') {
      const blackId = mainNode.children.length > 0 && nodes[mainNode.children[0]].turn === 'b'
        ? mainNode.children[0] : null;
      const blackNode = blackId ? nodes[blackId] : null;
      const hasWhiteVars = children.length > 1;
      const hasBlackVars = mainNode.children.length > 1;
      const whiteComment = mainNode.comment;
      const breaksLayout = hasWhiteVars || !!whiteComment;

      if (!breaksLayout) {
        elements.push(
          <div key={mainId} className="main-row">
            <span className="m-num">{mainNode.moveNumber}.</span>
            <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => setCurrentNodeId(mainId)} onContextMenu={(e) => handleMoveContextMenu(e, mainId)}>
              {mainNode.san}
              {mainNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
            </button>
            {blackNode
              ? <button className={`m-btn ${currentNodeId === blackId ? 'active' : ''}`} onClick={() => setCurrentNodeId(blackId!)} onContextMenu={(e) => handleMoveContextMenu(e, blackId!)}>
                  {blackNode.san}
                  {blackNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
                </button>
              : <span className="m-placeholder">...</span>}
          </div>
        );
        if (blackNode?.comment) {
          elements.push(<div key={`comm-${blackId}`} className="move-comment">{blackNode.comment}</div>);
        }
        if (hasBlackVars) {
          mainNode.children.slice(1).forEach(vId => {
            const vNode = nodes[vId];
            elements.push(
              <div key={vId} className="variation-block">
                <span className="pgn-num">{vNode.moveNumber}...</span>
                <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => setCurrentNodeId(vId)} onContextMenu={(e) => handleMoveContextMenu(e, vId)}>
                  {vNode.san}
                  {vNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
                </button>
                {vNode.comment && <span className="inline-comment">{vNode.comment}</span>}
                <InlineVariation nodeId={vId} />
              </div>
            );
          });
        }
        elements.push(...renderMoveTree(blackId || mainId));
      } else {
        elements.push(
          <div key={mainId} className="main-row">
            <span className="m-num">{mainNode.moveNumber}.</span>
            <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => setCurrentNodeId(mainId)} onContextMenu={(e) => handleMoveContextMenu(e, mainId)}>
              {mainNode.san}
              {mainNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
            </button>
            <span className="m-placeholder">...</span>
          </div>
        );
        if (whiteComment) {
          elements.push(<div key={`comm-${mainId}`} className="move-comment">{whiteComment}</div>);
        }
        children.slice(1).forEach(vId => {
          const vNode = nodes[vId];
          if (vNode.san.trim().toLowerCase() === mainNode.san.trim().toLowerCase()) return;
          elements.push(
            <div key={vId} className="variation-block">
              <span className="pgn-num">{vNode.moveNumber}.</span>
              <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => setCurrentNodeId(vId)} onContextMenu={(e) => handleMoveContextMenu(e, vId)}>
                {vNode.san}
                {vNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
              </button>
              {vNode.comment && <span className="inline-comment">{vNode.comment}</span>}
              <InlineVariation nodeId={vId} />
            </div>
          );
        });
        if (blackNode) {
          elements.push(
            <div key={blackId} className="main-row">
              <span className="m-num">{blackNode.moveNumber}...</span>
              <span className="m-placeholder">...</span>
              <button className={`m-btn ${currentNodeId === blackId ? 'active' : ''}`} onClick={() => setCurrentNodeId(blackId!)} onContextMenu={(e) => handleMoveContextMenu(e, blackId!)}>
                {blackNode.san}
                {blackNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
              </button>
            </div>
          );
          if (blackNode.comment) {
            elements.push(<div key={`comm-${blackId}`} className="move-comment">{blackNode.comment}</div>);
          }
        }
        if (blackNode && hasBlackVars) {
          mainNode.children.slice(1).forEach(vId => {
            const vNode = nodes[vId];
            elements.push(
              <div key={vId} className="variation-block">
                <span className="pgn-num">{vNode.moveNumber}...</span>
                <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => setCurrentNodeId(vId)} onContextMenu={(e) => handleMoveContextMenu(e, vId)}>
                  {vNode.san}
                  {vNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
                </button>
                {vNode.comment && <span className="inline-comment">{vNode.comment}</span>}
                <InlineVariation nodeId={vId} />
              </div>
            );
          });
        }
        elements.push(...renderMoveTree(blackId || mainId));
      }
    } else {
      elements.push(
        <div key={mainId} className="main-row">
          <span className="m-num">{mainNode.moveNumber}...</span>
          <span className="m-placeholder">...</span>
          <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => setCurrentNodeId(mainId)} onContextMenu={(e) => handleMoveContextMenu(e, mainId)}>
            {mainNode.san}
            {mainNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
          </button>
        </div>
      );
      if (mainNode.comment) {
        elements.push(<div key={`comm-${mainId}`} className="move-comment">{mainNode.comment}</div>);
      }
      elements.push(...renderMoveTree(mainId));
    }
    return elements;
  };

  const displayFen = currentNode?.fen || START_FEN;

  return (
    <div className="db-layout">
      {/* ── LEFT SIDEBAR: BROWSING TREE ── */}
      <aside className="db-sidebar">
        <div className="sidebar-header">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search folders or games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {showScrollTop && (
            <button className="scroll-top-btn" onClick={scrollToTop}>
              <ArrowUp size={12} />
              <span>Back to top</span>
            </button>
          )}
        </div>

        <div 
          className="tree-scroll-area"
          ref={sidebarScrollRef}
          onScroll={handleSidebarScroll}
        >
          {loading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span>Loading database...</span>
            </div>
          ) : (
            <div className="tree-root">
              {/* PUBLIC DB */}
              <div className="tree-section">
                <div 
                  className={`tree-node-row section-header ${dragOverFolderId === 'virtual_public' ? 'drag-over' : ''}`}
                  onDragOver={(e) => {
                    if (!draggedEntity) return;
                    if (isValidDropTarget(draggedEntity, 'virtual_public')) {
                      e.preventDefault();
                      setDragOverFolderId('virtual_public');
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverFolderId === 'virtual_public') {
                      setDragOverFolderId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!draggedEntity) return;
                    if (isValidDropTarget(draggedEntity, 'virtual_public')) {
                      executeMove(draggedEntity.type, draggedEntity.id, null, draggedEntity.parentId);
                    }
                    setDraggedEntity(null);
                    setDragOverFolderId(null);
                  }}
                >
                  <button className="tree-node-toggle" onClick={() => toggleFolder('virtual_public')}>
                    {expandedFolders['virtual_public'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <Globe size={18} className="text-public-db" />
                    <span className="section-label font-bold">Public DB</span>
                  </button>
                  {role === 'ADMIN' && (
                    <div className="node-actions">
                      <button
                        title="Create Root Folder"
                        onClick={() => {
                          setModalFolderParentId(null);
                          setModalVisibility('public');
                          setModalType('create_folder');
                        }}
                      >
                        <FolderPlus size={15} />
                      </button>
                      <button
                        title="Upload PGN File"
                        onClick={() => {
                          setModalFolderParentId(null);
                          setModalVisibility('public');
                          setModalType('upload_pgn');
                        }}
                      >
                        <Upload size={15} />
                      </button>
                    </div>
                  )}
                </div>
                {expandedFolders['virtual_public'] && renderFolderContent(null, 'public')}
              </div>

              {/* MY DB */}
              <div className="tree-section mt-4">
                <div 
                  className={`tree-node-row section-header ${dragOverFolderId === 'virtual_my' ? 'drag-over' : ''}`}
                  onDragOver={(e) => {
                    if (!draggedEntity) return;
                    if (isValidDropTarget(draggedEntity, 'virtual_my')) {
                      e.preventDefault();
                      setDragOverFolderId('virtual_my');
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverFolderId === 'virtual_my') {
                      setDragOverFolderId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!draggedEntity) return;
                    if (isValidDropTarget(draggedEntity, 'virtual_my')) {
                      executeMove(draggedEntity.type, draggedEntity.id, null, draggedEntity.parentId);
                    }
                    setDraggedEntity(null);
                    setDragOverFolderId(null);
                  }}
                >
                  <button className="tree-node-toggle" onClick={() => toggleFolder('virtual_my')}>
                    {expandedFolders['virtual_my'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <Database size={18} className="text-my-db" />
                    <span className="section-label font-bold">My DB</span>
                  </button>
                  <div className="node-actions">
                    <button
                      title="Create Root Folder"
                      onClick={() => {
                        setModalFolderParentId(null);
                        setModalVisibility('private');
                        setModalType('create_folder');
                      }}
                    >
                      <FolderPlus size={15} />
                    </button>
                    <button
                      title="Upload PGN File"
                      onClick={() => {
                        setModalFolderParentId(null);
                        setModalVisibility('private');
                        setModalType('upload_pgn');
                      }}
                    >
                      <Upload size={15} />
                    </button>
                  </div>
                </div>
                {expandedFolders['virtual_my'] && renderFolderContent(null, 'private')}
              </div>

              {/* SHARED DB */}
              <div className="tree-section mt-4">
                <div className="tree-node-row section-header">
                  <button className="tree-node-toggle" onClick={() => toggleFolder('virtual_shared')}>
                    {expandedFolders['virtual_shared'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <Users size={18} className="text-shared-db" />
                    <span className="section-label font-bold">Shared DB</span>
                  </button>
                </div>
                {expandedFolders['virtual_shared'] && (
                  <div className="tree-children-container">
                    {sharers.length === 0 ? (
                      <div className="empty-shared-state" style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#7a625d' }}>
                        No shared databases found.
                      </div>
                    ) : (
                      sharers.map(sharer => {
                        const isExpanded = !!expandedFolders[sharer.id];
                        const sharerShares = filteredShared.shares.filter(s => s.sharedBy === sharer.id);
                        
                        const directFolderIds = new Set(sharerShares.map(s => s.folderId).filter(Boolean) as string[]);
                        const directCollectionIds = new Set(sharerShares.map(s => s.collectionId).filter(Boolean) as string[]);
                        const directGameIds = new Set(sharerShares.map(s => s.gameId).filter(Boolean) as string[]);

                        const directFolders = filteredShared.folders.filter(f => directFolderIds.has(f.id));
                        const directCollections = filteredShared.collections.filter(c => directCollectionIds.has(c.id));
                        const directGames = filteredShared.games.filter(g => directGameIds.has(g.id));

                        return (
                          <div key={sharer.id} className="tree-folder-node">
                            <div className="tree-node-row">
                              <button className="tree-node-toggle" onClick={() => toggleFolder(sharer.id)}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <Users size={16} className="text-folder" style={{ color: '#c8854a' }} />
                                <span className="node-label font-bold" style={{ color: '#c8854a' }}>{sharer.username}</span>
                              </button>
                            </div>
                            
                            {isExpanded && (
                              <div className="tree-children-container">
                                {/* Shared Folders */}
                                {directFolders.map(folder => {
                                  const isFolderExp = !!expandedFolders[folder.id];
                                  return (
                                    <div key={folder.id} className="tree-folder-node">
                                      <div 
                                        className="tree-node-row"
                                        data-context-entity-id={folder.id}
                                        data-context-entity-name={folder.name}
                                        data-context-entity-type="folder"
                                        data-context-shared="true"
                                      >
                                        <button className="tree-node-toggle" onClick={() => toggleFolder(folder.id)}>
                                          {isFolderExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                          <Folder size={16} className="text-folder" />
                                          <span className="node-label">{folder.name}</span>
                                        </button>
                                      </div>
                                      {isFolderExp && renderSharedFolderContent(folder.id, sharer.id)}
                                    </div>
                                  );
                                })}

                                {/* Shared Collections */}
                                {directCollections.map(col => {
                                  const isColExp = !!expandedCollections[col.id];
                                  return (
                                    <div key={col.id} className="tree-collection-node">
                                      <div 
                                        className="tree-node-row"
                                        data-context-entity-id={col.id}
                                        data-context-entity-name={col.name}
                                        data-context-entity-type="collection"
                                        data-context-shared="true"
                                      >
                                        <button className="tree-node-toggle" onClick={() => toggleCollection(col.id)}>
                                          {isColExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                          <BookOpen size={16} className="text-collection" />
                                          <span className="node-label">{col.name}</span>
                                          <span className="node-badge">{col.games.length} ch</span>
                                        </button>
                                      </div>
                                      {isColExp && renderPaginatedGames(col, true)}
                                    </div>
                                  );
                                })}

                                {/* Shared Games */}
                                {directGames.map((game, idx) => (
                                  <button
                                    key={game.id}
                                    className={`tree-game-btn ${selectedGameId === game.id ? 'active' : ''}`}
                                    onClick={() => selectGame(game.id)}
                                    data-context-entity-id={game.id}
                                    data-context-entity-name={game.chapterName}
                                    data-context-entity-type="game"
                                    data-context-shared="true"
                                  >
                                    <FileText size={14} />
                                    <span style={{ marginRight: '4px', opacity: 0.6 }}>{idx + 1}.</span>
                                    <span className="game-chapter-name">{game.chapterName}</span>
                                    {game.result && <span className="game-result-badge">{game.result}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT MAIN AREA: GAME VIEWER ── */}
      <main className="db-viewer">
        {selectedGameId ? (
          loadingGame ? (
            <div className="viewer-loading">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span>Loading game PGN...</span>
            </div>
          ) : (
            <div className="viewer-grid">
              {/* Chessboard area */}
              <div className="viewer-board-col">
                <div className="board-sticky-wrapper">
                  <div className="viewer-header">
                    <h2 className="chapter-title">{activeGame?.chapterName}</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isModified && (
                        <button 
                          className="btn btn-primary" 
                          onClick={handleSaveGame} 
                          disabled={savingGame}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px' }}
                        >
                          {savingGame ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save Game
                        </button>
                      )}
                      {collectionGames.length > 1 && (
                        <div className="chapter-nav-buttons">
                          <button
                            className="chapter-btn"
                            disabled={currentChapterIdx <= 0}
                            onClick={() => stepChapter('prev')}
                            title="Previous Chapter"
                          >
                            ‹
                          </button>
                          <span className="chapter-indicator">
                            {currentChapterIdx + 1} / {collectionGames.length}
                          </span>
                          <button
                            className="chapter-btn"
                            disabled={currentChapterIdx >= collectionGames.length - 1}
                            onClick={() => stepChapter('next')}
                            title="Next Chapter"
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="board-container">
                    <ChessBoard
                      fen={displayFen}
                      history={gameHistory}
                      currentIndex={gameHistory.length - 1}
                      onMove={handleMove}
                      canNext={canGoNext}
                      canPrev={canGoPrev}
                      onNext={handleNext}
                      onPrev={handlePrev}
                      onStart={handleStart}
                      onEnd={handleEnd}
                      isLocked={!hasWriteAccess}
                      branches={branches}
                      selectedBranchIndex={selectedVariationIndex}
                      onSelectBranch={setSelectedVariationIndex}
                      onChooseBranch={(id) => {
                        setCurrentNodeId(id);
                        setSelectedVariationIndex(0);
                      }}
                      currentNode={currentNode}
                      chapterCount={collectionGames.length}
                      activeChapterIndex={currentChapterIdx}
                      onNextChapter={() => {
                        if (currentChapterIdx < collectionGames.length - 1) {
                          stepChapter('next');
                        }
                      }}
                      onPrevChapter={() => {
                        if (currentChapterIdx > 0) {
                          stepChapter('prev');
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="annotations-wrapper" style={{ width: '100%', maxWidth: '600px', paddingBottom: '2rem', margin: '0 auto' }}>
                  <AnnotationsPanel 
                    currentNode={currentNode}
                    studyTags={activeGame?.headers || {}}
                    isCoach={hasWriteAccess}
                    onUpdateAnnotations={updateNodeAnnotations}
                    onSetStudyTag={(key, value) => {
                      if (!activeGame) return;
                      setActiveGame((prev: any) => ({
                        ...prev,
                        headers: { ...(prev.headers || {}), [key]: value }
                      }));
                      setIsModified(true);
                    }}
                    onRemoveStudyTag={(key) => {
                      if (!activeGame) return;
                      setActiveGame((prev: any) => {
                        const newHeaders = { ...(prev.headers || {}) };
                        delete newHeaders[key];
                        return { ...prev, headers: newHeaders };
                      });
                      setIsModified(true);
                    }}
                  />
                </div>
              </div>

              {/* Moves Tree side panel */}
              <div className="viewer-moves-col">
                <div className="moves-header">
                  <HistoryIcon size={16} />
                  <h3>Notation</h3>
                </div>
                <div className="moves-scroll-panel glass-panel">
                  {nodes['root']?.comment && (
                    <div className="move-comment" style={{ marginBottom: '8px' }}>
                      {nodes['root'].comment}
                    </div>
                  )}
                  {nodes['root']?.children.length === 0 ? (
                    <p className="empty-state">No moves in this game.</p>
                  ) : (
                    renderMoveTree('root')
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="viewer-empty-state">
            <Database size={48} className="text-secondary" />
            <h2>Chess Database Browser</h2>
            <p>Select a game from the navigation tree on the left to start replay.</p>
          </div>
        )}
      </main>

      {/* Generic Modals */}
      {modalType && modalType !== 'upload_pgn' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'create_folder' && 'Create Folder'}
                {modalType === 'rename_folder' && 'Rename Folder'}
                {modalType === 'delete_folder' && 'Delete Folder'}
                {modalType === 'share' && 'Share Study Collection'}
              </h3>
              <button className="close-btn" onClick={() => setModalType(null)}>
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (modalType === 'create_folder') handleCreateFolder(e);
                if (modalType === 'rename_folder') handleRenameFolder(e);
                if (modalType === 'share') handleShareCollection(e);
              }}
            >
              <div className="modal-body">
                {modalType === 'delete_folder' ? (
                  <p>
                    Are you sure you want to delete the folder <strong>{activeFolder?.name}</strong>? All subfolders and collections within will be deleted. This action cannot be undone.
                  </p>
                ) : modalType === 'share' ? (
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label>Enter Username to Share With:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. coach1, student1"
                      value={shareUsername}
                      onChange={(e) => {
                        const val = e.target.value;
                        setShareUsername(val);
                        if (val.trim().length > 0) {
                          const prefix = val.toLowerCase();
                          setSuggestions(usersList.filter(u => u.username.toLowerCase().startsWith(prefix)));
                        } else {
                          setSuggestions([]);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setSuggestions([]);
                        }, 150);
                      }}
                      required
                    />
                    {suggestions.length > 0 && (
                      <div className="autocomplete-dropdown">
                        {suggestions.map((u: any) => (
                          <div 
                            key={u.id} 
                            className="autocomplete-item"
                            onClick={() => {
                              setShareUsername(u.username);
                              setSuggestions([]);
                            }}
                          >
                            <span className="item-username">{u.username}</span>
                            <span className="item-role">{u.role.toLowerCase()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Folder Name:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      required
                      placeholder="e.g. Endgames"
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>
                  Cancel
                </button>
                {modalType === 'delete_folder' ? (
                  <button type="button" className="btn btn-danger" onClick={handleDeleteFolder}>
                    Delete
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary">
                    Confirm
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload PGN Modal */}
      {modalType === 'upload_pgn' && (
        <UploadPgnModal
          isOpen={true}
          onClose={() => setModalType(null)}
          requireCollectionName={true}
          onUpload={async (pgnText, collectionName) => {
            if (!collectionName || !pgnText) return;
            try {
              const res = await fetch('/api/database/collections/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: collectionName,
                  folderId: modalFolderParentId,
                  visibility: modalVisibility,
                  pgnText: pgnText
                })
              });
              if (res.ok) {
                await fetchTree();
                setModalType(null);
              } else {
                let errorMsg = 'Failed to upload PGN';
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  const err = await res.json();
                  errorMsg = err.error || errorMsg;
                } else {
                  errorMsg = `Server error: ${res.status}`;
                }
                alert(errorMsg);
              }
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}

      {/* ── PREMIUM STYLING ── */}
      <style>{`
        .db-layout {
          display: flex;
          height: calc(100vh - 64px); /* Subtract Top Navbar if applicable */
          background: #fdf0e4;
          color: #4a2018;
          font-family: inherit;
          overflow: hidden;
          width: 100%;
        }

        /* Sidebar Styling */
        .db-sidebar {
          width: 340px;
          border-right: 1px solid #eedcd0;
          display: flex;
          flex-direction: column;
          background: #fff8f2;
          flex-shrink: 0;
          position: relative;
        }
        .sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid #eedcd0;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #eedcd0;
          padding: 8px 12px;
          border-radius: 8px;
        }
        .search-box input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.9rem;
          width: 100%;
          color: #4a2018;
        }

        .tree-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }
        .tree-scroll-area::-webkit-scrollbar {
          width: 8px;
        }
        .tree-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .tree-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(74, 32, 24, 0.25);
          border-radius: 4px;
        }
        .tree-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #c8854a;
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          height: 200px;
          color: rgba(74, 32, 24, 0.6);
        }

        /* Tree Items */
        .tree-section {
          display: flex;
          flex-direction: column;
        }
        .tree-node-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .tree-node-row:hover {
          background: rgba(74, 32, 24, 0.04);
        }
        .tree-node-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: inherit;
          font-size: 0.92rem;
          text-align: left;
          flex: 1;
        }
        .node-label {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }
        .node-badge {
          font-size: 0.75rem;
          background: rgba(45, 74, 107, 0.1);
          color: #2d4a6b;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 6px;
        }
        .node-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .tree-node-row:hover .node-actions {
          opacity: 1;
        }
        .node-actions button {
          border: none;
          background: transparent;
          cursor: pointer;
          color: rgba(74, 32, 24, 0.6);
          padding: 2px;
          border-radius: 4px;
        }
        .node-actions button:hover {
          color: #c8854a;
          background: rgba(74, 32, 24, 0.05);
        }
        .node-actions button.text-danger:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        .tree-children-container {
          padding-left: 16px;
          margin-left: 8px;
          border-left: 1px dashed #eedcd0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 2px;
          margin-bottom: 2px;
        }

        .tree-game-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: transparent;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.88rem;
          text-align: left;
          color: rgba(74, 32, 24, 0.8);
          transition: all 0.15s;
        }
        .tree-game-btn:hover {
          background: rgba(74, 32, 24, 0.05);
          color: #4a2018;
        }
        .tree-game-btn.active {
          background: #c8854a;
          color: #ffffff;
        }
        .game-chapter-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .game-result-badge {
          font-size: 0.72rem;
          background: rgba(74, 32, 24, 0.1);
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 600;
        }
        .tree-game-btn.active .game-result-badge {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Icon Colors */
        .text-folder { color: #d97706; }
        .text-collection { color: #2563eb; }
        .text-public-db { color: #059669; }
        .text-my-db { color: #c8854a; }
        .text-shared-db { color: #7c3aed; }

        /* Viewer Layout */
        .db-viewer {
          flex: 1;
          background: #fdf0e4;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .viewer-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          height: 100%;
          color: rgba(74, 32, 24, 0.5);
          text-align: center;
          padding: 2rem;
        }
        .viewer-empty-state h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #4a2018;
        }
        .viewer-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          height: 100%;
          color: rgba(74, 32, 24, 0.6);
        }

        .viewer-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        .viewer-board-col {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          min-height: 0;
          position: relative;
        }
        .board-sticky-wrapper {
          z-index: 10;
          background: #fdf0e4;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1.5rem 1rem 1.5rem;
        }
        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 600px;
          margin-bottom: 1rem;
        }
        .chapter-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }
        .chapter-nav-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 20px;
          padding: 2px 12px;
        }
        .chapter-btn {
          border: none;
          background: transparent;
          font-size: 1.4rem;
          cursor: pointer;
          color: #c8854a;
          line-height: 1;
        }
        .chapter-btn:disabled {
          color: rgba(74, 32, 24, 0.3);
          cursor: not-allowed;
        }
        .chapter-indicator {
          font-size: 0.85rem;
          font-weight: 500;
        }

        .board-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        /* Moves Tree Side Panel */
        .viewer-moves-col {
          border-left: 1px solid #eedcd0;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          min-height: 0;
        }
        .moves-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 1rem;
          border-bottom: 1px solid #eedcd0;
          background: #fff8f2;
        }
        .moves-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }
        .moves-scroll-panel {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        /* Modal Styling */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          width: 100%;
          max-width: 500px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          overflow: hidden;
          border: 1px solid #eedcd0;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #eedcd0;
          background: #fff8f2;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        .close-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          color: rgba(74, 32, 24, 0.6);
        }
        .close-btn:hover {
          color: #ef4444;
        }

        .modal-body {
          padding: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 1rem;
        }
        .form-group label {
          font-size: 0.88rem;
          font-weight: 500;
        }
        .form-input {
          border: 1px solid #eedcd0;
          padding: 8px 12px;
          border-radius: 6px;
          outline: none;
          font-size: 0.9rem;
          color: #4a2018;
        }
        .form-input:focus {
          border-color: #c8854a;
        }
        .form-textarea {
          border: 1px solid #eedcd0;
          padding: 8px 12px;
          border-radius: 6px;
          outline: none;
          font-size: 0.9rem;
          resize: vertical;
          color: #4a2018;
          font-family: monospace;
        }
        .form-textarea:focus {
          border-color: #c8854a;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 1rem;
          border-top: 1px solid #eedcd0;
          background: #fff8f2;
        }

        .btn {
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary {
          background: #c8854a;
          color: #ffffff;
        }
        .btn-primary:hover {
          background: #b3643b;
        }
        .btn-secondary {
          background: #eedcd0;
          color: #4a2018;
        }
        .btn-secondary:hover {
          background: #e3cca6;
        }
        .btn-danger {
          background: #ef4444;
          color: #ffffff;
        }
        .btn-danger:hover {
          background: #dc2626;
        }

        /* Moves Tree Styling - aligned with classroom */
        .main-row {
          display: grid;
          grid-template-columns: 46px 1fr 1fr;
          align-items: stretch;
          padding: 0;
          background: #fdf5ea;
          border-radius: 0;
          margin-bottom: 0;
          border-bottom: 1px solid #eedcd0;
        }
        .variation-block {
          display: block;
          margin-left: 12px;
          border-left: 1px solid #eedcd0;
          padding: 2px 0 2px 10px;
          margin: 2px 0 4px;
          color: rgba(45, 74, 107, 0.8);
        }
        .variation-block::before { content: '('; margin-right: 2px; opacity: .4; }
        .variation-block::after  { content: ')'; margin-left:  2px; opacity: .4; }
        .inline-variation-line { display: inline; line-height: 1.4; }

        .m-num {
          background: rgba(45, 74, 107, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(45, 74, 107, 0.6);
          font-size: .75rem; font-weight: 500;
          border-right: 1px solid #eedcd0;
        }
        .pgn-num {
          color: rgba(45, 74, 107, 0.6);
          font-size: .72rem; min-width: 28px; font-weight: 500;
        }
        .m-btn {
          background: transparent; border: none;
          color: #4a2018; font-weight: 500;
          padding: 6px 12px; border-radius: 0;
          cursor: pointer; transition: all .1s;
          text-align: left; font-size: .85rem;
        }
        .m-btn:hover:not(.active) { background: rgba(45, 74, 107, 0.05); color: #c8854a; }

        .move-comment {
          display: block;
          width: 100%;
          padding: 8px 12px;
          background: rgba(45, 74, 107, 0.02);
          color: #4a2018;
          font-size: 0.85rem;
          line-height: 1.4;
          margin: 0;
          word-break: break-word;
          border-radius: 0;
          border-bottom: 1px solid #eedcd0;
          white-space: pre-wrap;
        }
        .inline-comment {
          margin: 0 6px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(45, 74, 107, 0.05);
          color: rgba(45, 74, 107, 0.8);
          font-size: 0.82rem;
          display: inline-block;
          vertical-align: middle;
          white-space: pre-wrap;
        }
        .m-btn.active  { background: #c8854a; color: #fff; }
        .inline-btn { font-weight: 500; padding: 1px 4px; border-radius: 3px; min-width: fit-content; display: inline-block; font-size: .8rem; }
        .m-placeholder { color: rgba(45, 74, 107, 0.3); padding: 6px 12px; font-size: .85rem; }
        .nag-glyph { margin-left: 2px; color: #c8854a; font-weight: 700; font-size: 0.9em; }
        .empty-state {
          color: rgba(45, 74, 107, 0.6);
          font-size: .85rem;
          text-align: center;
          margin-top: 2rem;
        }
        .scroll-top-btn {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          top: 68px;
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* Page animation / pagination */
        .tree-games-page-animate {
          animation: pageSlideIn 0.25s ease-out;
        }
        @keyframes pageSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          background: rgba(45, 74, 107, 0.03);
          border-top: 1px solid #eedcd0;
          border-bottom: 1px solid #eedcd0;
          margin-top: 4px;
          margin-bottom: 4px;
        }
        .pagination-btn {
          background: #ffffff;
          border: 1px solid #eedcd0;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #4a2018;
          transition: all 0.15s ease;
        }
        .pagination-btn:hover:not(:disabled) {
          background: #fdf5ea;
          border-color: #c8854a;
          color: #c8854a;
        }
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination-info {
          font-size: 0.75rem;
          font-weight: 600;
          color: #7a625d;
        }

        /* Context Menu & Modals */
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
          animation: modalFadeIn 0.15s ease-out;
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
        .autocomplete-dropdown {
          position: absolute;
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #eedcd0;
          border-radius: 6px;
          max-height: 150px;
          overflow-y: auto;
          z-index: 10;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        }
        .autocomplete-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 0.85rem;
          color: #4a2018;
          transition: background 0.1s;
        }
        .autocomplete-item:hover {
          background: #fdf5ea;
        }
        .item-username {
          font-weight: 500;
        }
        .item-role {
          font-size: 0.75rem;
          color: #c8854a;
          background: #fdf0e4;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: capitalize;
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

        @keyframes modalFadeIn {
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

        /* Drag and Drop Drag-over Highlight */
        .tree-node-row.drag-over {
          background: rgba(200, 133, 74, 0.15) !important;
          border: 1px dashed #c8854a;
        }

        /* Navigable Picker styling */
        .picker-search {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #eedcd0;
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .picker-search input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.85rem;
          width: 100%;
          color: #4a2018;
        }
        .picker-search button {
          border: none;
          background: transparent;
          color: rgba(74, 32, 24, 0.4);
          cursor: pointer;
          padding: 2px;
        }
        .picker-search button:hover {
          color: #ef4444;
        }

        .picker-breadcrumbs {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: #7a625d;
          margin-bottom: 12px;
          background: #fff8f2;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #eedcd0;
        }
        .breadcrumb-item {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #c8854a;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .breadcrumb-item:hover {
          background: rgba(200, 133, 74, 0.1);
        }
        .breadcrumb-separator {
          color: #eedcd0;
        }

        .picker-list {
          border: 1px solid #eedcd0;
          border-radius: 8px;
          max-height: 200px;
          overflow-y: auto;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
        }
        .picker-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-bottom: 1px solid #fff8f2;
          width: 100%;
          cursor: pointer;
          text-align: left;
          color: #4a2018;
          transition: background 0.1s;
        }
        .picker-row:hover:not(:disabled) {
          background: #fdf5ea;
        }
        .picker-row:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          background: #fafafa;
        }
        .picker-row-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .picker-folder-name {
          font-size: 0.85rem;
          font-weight: 500;
        }
        .picker-row-chevron {
          color: rgba(74, 32, 24, 0.4);
        }
        .picker-empty {
          padding: 16px;
          text-align: center;
          color: rgba(74, 32, 24, 0.5);
          font-size: 0.82rem;
        }

        .picker-add-folder-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: #c8854a;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 12px;
          width: fit-content;
        }
        .picker-add-folder-btn:hover {
          background: rgba(200, 133, 74, 0.08);
        }

        .picker-new-folder-inline {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding: 4px;
          background: #fff8f2;
          border-radius: 6px;
          border: 1px dashed #eedcd0;
        }
        .picker-new-folder-inline .inline-input {
          flex: 1;
          border: 1px solid #eedcd0;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          outline: none;
          color: #4a2018;
        }
        .picker-new-folder-inline .inline-input:focus {
          border-color: #c8854a;
        }
        .btn-sm {
          padding: 4px 8px;
          font-size: 0.75rem;
        }

        /* Toast Styling */
        .custom-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: rgba(74, 32, 24, 0.95);
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 99999;
          font-size: 0.9rem;
          font-weight: 500;
          opacity: 0;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .custom-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .toast-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .toast-undo-btn {
          background: #c8854a;
          color: #ffffff;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.1s;
        }
        .toast-undo-btn:hover {
          background: #e3cca6;
          color: #4a2018;
        }
        .toast-close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast-close-btn:hover {
          color: #ffffff;
        }
      `}</style>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
          className="custom-context-menu"
          ref={(el) => applyContextMenuPosition(el, contextMenu.x, contextMenu.y)}
          style={{ top: contextMenu.y, left: contextMenu.x, visibility: 'hidden' }}
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
                let initialParentId: string | null = null;
                if (contextMenu.entityType === 'folder') {
                  const f = folders.find(folder => folder.id === contextMenu.entityId);
                  initialParentId = f ? f.parentFolderId : null;
                } else if (contextMenu.entityType === 'collection') {
                  const c = collections.find(col => col.id === contextMenu.entityId);
                  initialParentId = c ? c.folderId : null;
                }
                setPickerFolderId(initialParentId);
                setPickerSearch('');
                setPickerNewFolderOpen(false);
                setPickerNewFolderName('');
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
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="modal-input" 
                    value={modalInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModalInput(val);
                      if (val.trim().length > 0) {
                        const prefix = val.toLowerCase();
                        setSuggestions(usersList.filter(u => u.username.toLowerCase().startsWith(prefix)));
                      } else {
                        setSuggestions([]);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setSuggestions([]);
                      }, 150);
                    }}
                    placeholder="Enter username to share with"
                    autoFocus
                    required
                  />
                  {suggestions.length > 0 && (
                    <div className="autocomplete-dropdown" style={{ top: 'calc(100% - 14px)' }}>
                      {suggestions.map((u: any) => (
                        <div 
                          key={u.id} 
                          className="autocomplete-item"
                          onClick={() => {
                            setModalInput(u.username);
                            setSuggestions([]);
                          }}
                        >
                          <span className="item-username">{u.username}</span>
                          <span className="item-role">{u.role.toLowerCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              activeModalEntity?.entityType === 'game' ? (
                <form onSubmit={handleMoveSubmit}>
                  <p className="modal-description">
                    Select destination for "{activeModalEntity?.entityName}":
                  </p>
                  <select 
                    className="modal-select"
                    value={moveTargetId}
                    onChange={(e) => setMoveTargetId(e.target.value)}
                    required
                  >
                    {moveCollectionOptions.length === 0 && (
                      <option value="">No collections available</option>
                    )}
                    {moveCollectionOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={submittingModal || !moveTargetId}
                    >
                      {submittingModal ? 'Moving...' : 'Move'}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <p className="modal-description">
                    Select destination for "{activeModalEntity?.entityName}":
                  </p>
                  
                  {/* Picker Search */}
                  <div className="picker-search">
                    <Search size={14} />
                    <input 
                      type="text" 
                      placeholder="Search folders..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                    />
                    {pickerSearch && (
                      <button type="button" onClick={() => setPickerSearch('')}>
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Picker Breadcrumbs */}
                  <div className="picker-breadcrumbs">
                    {pickerBreadcrumbs.map((bc, idx) => (
                      <React.Fragment key={bc.id || 'root'}>
                        {idx > 0 && <span className="breadcrumb-separator">/</span>}
                        <button 
                          type="button" 
                          className="breadcrumb-item"
                          onClick={() => {
                            setPickerFolderId(bc.id);
                            setPickerSearch('');
                          }}
                        >
                          {bc.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Inline folder creation */}
                  {pickerNewFolderOpen ? (
                    <div className="picker-new-folder-inline">
                      <input 
                        type="text" 
                        className="inline-input"
                        placeholder="New folder name"
                        value={pickerNewFolderName}
                        onChange={(e) => setPickerNewFolderName(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateFolderInline();
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm"
                        onClick={handleCreateFolderInline}
                        disabled={!pickerNewFolderName.trim()}
                      >
                        Create
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setPickerNewFolderOpen(false);
                          setPickerNewFolderName('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="picker-add-folder-btn"
                      onClick={() => setPickerNewFolderOpen(true)}
                    >
                      <Plus size={14} />
                      <span>New folder</span>
                    </button>
                  )}

                  {/* Picker Folders List */}
                  <div className="picker-list">
                    {pickerFolders.length === 0 ? (
                      <div className="picker-empty">No folders found</div>
                    ) : (
                      pickerFolders.map(f => {
                        const status = checkFolderTargetStatus(f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            className={`picker-row ${!status.valid ? 'disabled' : ''}`}
                            disabled={!status.valid}
                            onClick={() => {
                              if (status.valid) {
                                setPickerFolderId(f.id);
                              }
                            }}
                            title={status.label}
                          >
                            <div className="picker-row-content">
                              <Folder size={16} className="text-folder" />
                              <span className="picker-folder-name">{f.name}</span>
                            </div>
                            <ChevronRight size={14} className="picker-row-chevron" />
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      disabled={!currentStatus.valid}
                      onClick={() => {
                        if (activeModalEntity && currentStatus.valid) {
                          executeMove(
                            activeModalEntity.type as 'folder' | 'collection',
                            activeModalEntity.entityId,
                            pickerFolderId,
                            currentParentId
                          );
                          setActiveModal(null);
                        }
                      }}
                    >
                      {currentStatus.valid ? 'Move here' : currentStatus.label || 'Cannot move here'}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`custom-toast ${toast.visible ? 'show' : ''}`}>
          <span>{toast.message}</span>
          <div className="toast-actions">
            <button className="toast-undo-btn" onClick={toast.onUndo}>
              Undo
            </button>
            <button className="toast-close-btn" onClick={() => setToast(null)}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {moveContextMenu && (
        <>
          <div className="context-menu-backdrop" onContextMenu={e => e.preventDefault()} onClick={() => setMoveContextMenu(null)} />
          <div
            className="context-menu"
            style={{ 
              top: moveContextMenu.y, 
              left: moveContextMenu.x 
            }}
            onContextMenu={e => e.preventDefault()}
          >
            <div className="context-menu-header">
              Move Options
            </div>
            <div className="context-menu-list">
              <button className="context-menu-item" onClick={() => handleMakeMainline(moveContextMenu.nodeId)}>
                <ArrowUpToLine size={14} /> Promote to Mainline
              </button>
              <button className="context-menu-item" onClick={() => handlePromoteVariation(moveContextMenu.nodeId)}>
                <ArrowUp size={14} /> Move Variation Up
              </button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
              <button className="context-menu-item danger" onClick={() => handleDeleteSubsequent(moveContextMenu.nodeId)}>
                <Trash2 size={14} /> Delete from Here
              </button>
              <button className="context-menu-item danger" onClick={() => handleDeletePrevious(moveContextMenu.nodeId)}>
                <Trash2 size={14} /> Delete Before Here
              </button>
              <button className="context-menu-item danger" onClick={() => handleDeleteMove(moveContextMenu.nodeId)}>
                <Trash2 size={14} /> Delete Move
              </button>
            </div>
          </div>
        </>
      )}

      {/* Styles for Move Context Menu */}
      <style>{`
        .context-menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: transparent;
        }
        .context-menu {
          position: fixed;
          z-index: 10000;
          background: rgba(21, 21, 21, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          min-width: 200px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          font-family: inherit;
          backdrop-filter: blur(12px);
          animation: menuFadeIn 0.15s ease-out;
        }
        @keyframes menuFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .context-menu-header {
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.04);
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          text-align: left;
        }
        .context-menu-list {
          padding: 4px 0;
          display: flex;
          flex-direction: column;
        }
        .context-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          width: 100%;
        }
        .context-menu-item:hover:not(:disabled) {
          background: rgba(200, 133, 74, 0.15);
          color: #c8854a;
        }
        .context-menu-item.danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .context-menu-item:disabled {
          color: rgba(255, 255, 255, 0.25);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
