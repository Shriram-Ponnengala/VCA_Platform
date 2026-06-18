import React, { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown, Check, FolderPlus, Loader2 } from 'lucide-react';

interface FolderData {
  id: string;
  name: string;
  parentFolderId: string | null;
  visibility: 'public' | 'private';
  ownerId: string;
}

interface SaveToDbModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGameName: string;
  onSave: (gameName: string, folderId: string | null) => Promise<void>;
  savingGame: boolean;
}

export default function SaveToDbModal({ isOpen, onClose, defaultGameName, onSave, savingGame }: SaveToDbModalProps) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [saveGameName, setSaveGameName] = useState(defaultGameName);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Expanded folders in the tree
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Create new folder inline
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSaveGameName(defaultGameName);
      setSelectedFolderId(null);
      fetchTree();
    }
  }, [isOpen, defaultGameName]);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/database/tree');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
        setCurrentUserId(data.userId || null);
      }
    } catch (e) {
      console.error('Failed to load database tree:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch('/api/database/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          visibility: 'private',
          parentFolderId: selectedFolderId || null
        })
      });
      if (res.ok) {
        const newFolder = await res.json();
        setFolders(prev => [...prev, newFolder]);
        setSelectedFolderId(newFolder.id);
        if (selectedFolderId) {
          setExpandedFolders(prev => ({ ...prev, [selectedFolderId]: true }));
        }
        setNewFolderName('');
        setShowNewFolderInput(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create folder');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(saveGameName, selectedFolderId);
  };

  if (!isOpen) return null;

  // Filter to only private folders owned by the current user
  const myFolders = folders.filter(f => f.visibility === 'private' && f.ownerId === currentUserId);

  const renderFolderContent = (parentId: string | null, depth: number = 0) => {
    const childFolders = myFolders.filter(f => f.parentFolderId === parentId);
    
    if (childFolders.length === 0) return null;

    return (
      <div style={{ paddingLeft: depth > 0 ? '16px' : '0' }}>
        {childFolders.map(folder => {
          const isExpanded = !!expandedFolders[folder.id];
          const isSelected = selectedFolderId === folder.id;
          
          return (
            <div key={folder.id}>
              <div 
                onClick={() => setSelectedFolderId(folder.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  background: isSelected ? '#e6f0fa' : 'transparent',
                  color: isSelected ? '#1e40af' : '#4a2018',
                  fontSize: '0.9rem',
                  fontWeight: isSelected ? '500' : '400',
                  marginTop: '2px'
                }}
              >
                <div 
                  onClick={(e) => toggleFolder(folder.id, e)}
                  style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {myFolders.some(f => f.parentFolderId === folder.id) ? (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  ) : (
                    <span style={{ width: '14px' }} />
                  )}
                </div>
                <Folder size={16} fill={isSelected ? '#bfdbfe' : 'transparent'} strokeWidth={isSelected ? 2 : 1.5} />
                <span style={{ flex: 1 }}>{folder.name}</span>
                {isSelected && <Check size={16} />}
              </div>
              
              {isExpanded && renderFolderContent(folder.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        border: '1px solid #eedcd0',
        color: '#4a2018',
        boxShadow: '0 8px 32px rgba(45, 74, 107, 0.15)'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '600' }}>Save to My DB</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Game Name Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#6b7280' }}>Game Name</label>
            <input
              type="text"
              required
              value={saveGameName}
              onChange={e => setSaveGameName(e.target.value)}
              placeholder="e.g., Analysis Game - 12/6/2026"
              style={{
                border: '1px solid #d1d5db',
                padding: '10px 14px',
                borderRadius: '8px',
                outline: 'none',
                color: '#1f2937',
                fontSize: '0.95rem',
                backgroundColor: '#f9fafb'
              }}
            />
          </div>

          {/* Folder Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#6b7280' }}>Save to folder</label>
            
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {loading ? (
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                  <Loader2 className="animate-spin text-muted" size={24} color="#9ca3af" />
                </div>
              ) : (
                <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '8px' }}>
                  {/* Root Option */}
                  <div 
                    onClick={() => setSelectedFolderId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: selectedFolderId === null ? '#e6f0fa' : 'transparent',
                      color: selectedFolderId === null ? '#1e40af' : '#4a2018',
                      fontSize: '0.9rem',
                      fontWeight: selectedFolderId === null ? '600' : '500',
                    }}
                  >
                    <div style={{ width: '16px' }} />
                    <Folder size={16} fill={selectedFolderId === null ? '#bfdbfe' : 'transparent'} strokeWidth={selectedFolderId === null ? 2 : 1.5} />
                    <span style={{ flex: 1 }}>My DB (root)</span>
                    {selectedFolderId === null && <Check size={16} />}
                  </div>

                  {/* Render Folders Tree */}
                  {renderFolderContent(null)}
                </div>
              )}
            </div>

            {/* Create New Folder Inline */}
            <div style={{ marginTop: '8px' }}>
              {!showNewFolderInput ? (
                <button
                  type="button"
                  onClick={() => setShowNewFolderInput(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    padding: '4px 0'
                  }}
                >
                  <FolderPlus size={16} />
                  <span>Create new folder</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    placeholder={selectedFolderId ? "New folder inside selected" : "New folder in root"}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateFolder();
                      } else if (e.key === 'Escape') {
                        setShowNewFolderInput(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      border: '1px solid #d1d5db',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      outline: 'none',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    disabled={creatingFolder || !newFolderName.trim()}
                    style={{
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      color: '#374151',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: newFolderName.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    {creatingFolder ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: '8px 4px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingGame}
              style={{
                border: 'none',
                background: '#c8854a',
                color: '#fff',
                padding: '8px 20px',
                borderRadius: '6px',
                cursor: savingGame ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {savingGame && <Loader2 size={16} className="animate-spin" />}
              {savingGame ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
