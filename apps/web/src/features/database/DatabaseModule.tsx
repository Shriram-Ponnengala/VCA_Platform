'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ChessBoard from '@/components/chess/ChessBoard';
import { parsePgnToMoveTree } from './pgnUtils';
import { MoveNode } from '@vca/types';
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
  History as HistoryIcon
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
  
  // Expanded nodes in tree
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'virtual_public': true,
    'virtual_my': true,
    'virtual_shared': true
  });
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});

  // Selection state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<any | null>(null);
  const [loadingGame, setLoadingGame] = useState(false);
  
  // Selected Game move traversal state
  const [nodes, setNodes] = useState<Record<string, MoveNode>>({});
  const [currentNodeId, setCurrentNodeId] = useState<string>('root');
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);

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

  // Fetch initial tree data
  const fetchTree = async () => {
    try {
      const res = await fetch('/api/database/tree');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
        setCollections(data.collections || []);
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

  // Fetch users for sharing dropdown
  useEffect(() => {
    if (modalType === 'share') {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUsersList(data);
          }
        })
        .catch(err => console.error('Failed to fetch users list:', err));
    }
  }, [modalType]);

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
      }
    } catch (e) {
      console.error('Failed to fetch game details:', e);
    } finally {
      setLoadingGame(false);
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
        const err = await res.json();
        alert(err.error || 'Failed to create folder');
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
        const err = await res.json();
        alert(err.error || 'Failed to rename folder');
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
        const err = await res.json();
        alert(err.error || 'Failed to delete folder');
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
        const err = await res.json();
        alert(err.error || 'Failed to upload PGN');
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
        const err = await res.json();
        alert(err.error || 'Failed to share collection');
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  // Recursively render Folder/Collection elements
  const renderFolderContent = (folderId: string | null, parentVisibility: 'public' | 'private') => {
    const { folders: fList, collections: cList } = filteredTree;

    const childFolders = fList.filter(f => f.parentFolderId === folderId && f.visibility === parentVisibility);
    const childCollections = cList.filter(c => c.folderId === folderId && c.visibility === parentVisibility);

    return (
      <div className="tree-children-container">
        {childFolders.map(folder => {
          const isExpanded = !!expandedFolders[folder.id];
          const hasAdminAccess = folder.visibility === 'public' && role === 'ADMIN';
          const hasMyAccess = folder.visibility === 'private';
          
          return (
            <div key={folder.id} className="tree-folder-node">
              <div className="tree-node-row">
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
                      {role === 'ADMIN' && folder.visibility === 'public' && (
                        <button
                          title="Upload PGN Here"
                          onClick={() => {
                            setModalFolderParentId(folder.id);
                            setModalVisibility('public');
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
          const isOwner = col.ownerId === activeGame?.ownerId; // Or check via token if we had user ID
          
          return (
            <div key={col.id} className="tree-collection-node">
              <div className="tree-node-row">
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

              {isExpanded && (
                <div className="tree-children-container">
                  {col.games.map(game => (
                    <button
                      key={game.id}
                      className={`tree-game-btn ${selectedGameId === game.id ? 'active' : ''}`}
                      onClick={() => selectGame(game.id)}
                    >
                      <FileText size={14} />
                      <span className="game-chapter-name">{game.chapterName}</span>
                      {game.result && <span className="game-result-badge">{game.result}</span>}
                    </button>
                  ))}
                </div>
              )}
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
            <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => setCurrentNodeId(mainId)}>
              {mainNode.san}
              {mainNode.glyphs?.map(g => <span key={g} className="nag-glyph">{g}</span>)}
            </button>
            {blackNode
              ? <button className={`m-btn ${currentNodeId === blackId ? 'active' : ''}`} onClick={() => setCurrentNodeId(blackId!)}>
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
                <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => setCurrentNodeId(vId)}>
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
            <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => setCurrentNodeId(mainId)}>
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
              <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => setCurrentNodeId(vId)}>
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
              <button className={`m-btn ${currentNodeId === blackId ? 'active' : ''}`} onClick={() => setCurrentNodeId(blackId!)}>
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
                <button className={`m-btn inline-btn ${currentNodeId === vId ? 'active' : ''}`} onClick={() => setCurrentNodeId(vId)}>
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
          <button className={`m-btn ${currentNodeId === mainId ? 'active' : ''}`} onClick={() => setCurrentNodeId(mainId)}>
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
        </div>

        <div className="tree-scroll-area">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span>Loading database...</span>
            </div>
          ) : (
            <div className="tree-root">
              {/* PUBLIC DB */}
              <div className="tree-section">
                <div className="tree-node-row section-header">
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
                <div className="tree-node-row section-header">
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
                    {/* Filtered Shared Collections */}
                    {filteredTree.collections
                      .filter(c => c.visibility === 'private' && c.ownerId !== activeGame?.ownerId) // not owned by current user
                      .map(col => {
                        const isExpanded = !!expandedCollections[col.id];
                        return (
                          <div key={col.id} className="tree-collection-node">
                            <div className="tree-node-row">
                              <button className="tree-node-toggle" onClick={() => toggleCollection(col.id)}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <BookOpen size={16} className="text-collection" />
                                <span className="node-label">{col.name}</span>
                                <span className="node-badge">{col.games.length} ch</span>
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="tree-children-container">
                                {col.games.map(game => (
                                  <button
                                    key={game.id}
                                    className={`tree-game-btn ${selectedGameId === game.id ? 'active' : ''}`}
                                    onClick={() => selectGame(game.id)}
                                  >
                                    <FileText size={14} />
                                    <span className="game-chapter-name">{game.chapterName}</span>
                                    {game.result && <span className="game-result-badge">{game.result}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                <div className="viewer-header">
                  <h2 className="chapter-title">{activeGame?.chapterName}</h2>
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
                <div className="board-container">
                  <ChessBoard
                    fen={displayFen}
                    history={gameHistory}
                    currentIndex={gameHistory.length - 1}
                    onMove={() => {}}
                    canNext={canGoNext}
                    canPrev={canGoPrev}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onStart={handleStart}
                    onEnd={handleEnd}
                    isLocked={true}
                    branches={branches}
                    selectedBranchIndex={selectedVariationIndex}
                    onSelectBranch={setSelectedVariationIndex}
                    onChooseBranch={(id) => {
                      setCurrentNodeId(id);
                      setSelectedVariationIndex(0);
                    }}
                    currentNode={currentNode}
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

      {/* ── MODALS ── */}
      {modalType && (
        <div className="modal-backdrop" onClick={() => setModalType(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'create_folder' && 'Create Folder'}
                {modalType === 'rename_folder' && 'Rename Folder'}
                {modalType === 'delete_folder' && 'Delete Folder'}
                {modalType === 'upload_pgn' && 'Upload PGN Database'}
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
                if (modalType === 'upload_pgn') handleUploadPgn(e);
                if (modalType === 'share') handleShareCollection(e);
              }}
            >
              <div className="modal-body">
                {modalType === 'delete_folder' ? (
                  <p>
                    Are you sure you want to delete the folder <strong>{activeFolder?.name}</strong>? All subfolders and collections within will be deleted. This action cannot be undone.
                  </p>
                ) : modalType === 'share' ? (
                  <div className="form-group">
                    <label>Enter Username to Share With:</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. coach1, student1"
                      value={shareUsername}
                      onChange={(e) => setShareUsername(e.target.value)}
                      required
                      list="users-datalist"
                    />
                    <datalist id="users-datalist">
                      {usersList.map((u: any) => (
                        <option key={u.id} value={u.username}>
                          {u.username} ({u.role})
                        </option>
                      ))}
                    </datalist>
                  </div>
                ) : modalType === 'upload_pgn' ? (
                  <>
                    <div className="form-group">
                      <label>Collection Name:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Grandmaster Games"
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>PGN Content (Supports Multi-Game):</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Paste PGN here..."
                        value={uploadPgnText}
                        onChange={(e) => setUploadPgnText(e.target.value)}
                        required
                        rows={10}
                      />
                    </div>
                  </>
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
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
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
      `}</style>
    </div>
  );
}
