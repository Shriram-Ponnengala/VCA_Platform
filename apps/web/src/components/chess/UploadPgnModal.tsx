'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, CloudUpload, Link, BookOpen, Download, AlertTriangle } from 'lucide-react';

interface UploadPgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (pgnText: string, collectionName?: string) => void;
  requireCollectionName?: boolean;
}

interface LichessMetadata {
  title: string;
  chaptersCount: number;
  chaptersList: { title: string; movesCount: number }[];
  author: string;
  visibility: string;
}

export default function UploadPgnModal({ isOpen, onClose, onUpload, requireCollectionName }: UploadPgnModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'lichess'>('upload');
  const [pgnText, setPgnText] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Lichess Tab States
  const [lichessUrl, setLichessUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchedStudy, setFetchedStudy] = useState<(LichessMetadata & { pgnText: string }) | null>(null);
  const [previewTab, setPreviewTab] = useState<'chapters' | 'info'>('chapters');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPgnText('');
      setDroppedFileName(null);
      setIsDragging(false);
      dragCounterRef.current = 0;
      setLichessUrl('');
      setFetchError(null);
      setFetchedStudy(null);
      setActiveTab('upload');
      setCollectionName('');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Parser helper to extract study name and chapter lists
  const parseLichessPgn = (pgn: string): LichessMetadata => {
    const eventRegex = /\[Event "([^"]+)"\]/g;
    const events: string[] = [];
    let match;
    while ((match = eventRegex.exec(pgn)) !== null) {
      events.push(match[1]);
    }
    
    let studyTitle = 'Lichess Study';
    const chaptersList: { title: string; movesCount: number }[] = [];
    
    if (events.length > 0) {
      const firstEvent = events[0];
      if (firstEvent.includes(':')) {
        studyTitle = firstEvent.split(':')[0].trim();
      } else {
        studyTitle = firstEvent;
      }
      
    }

    const chaptersRaw = pgn.split(/\[Event "/).slice(1);
    const finalChapters = chaptersRaw.map((rawContent, idx) => {
      const evt = events[idx] || '';
      let finalTitle = 'Untitled';
      
      const chapNameMatch = rawContent.match(/ChapterName "([^"]+)"\]/);
      const wMatch = rawContent.match(/White "([^"]+)"\]/);
      const bMatch = rawContent.match(/Black "([^"]+)"\]/);
      
      if (chapNameMatch) {
        finalTitle = chapNameMatch[1];
      } else if (evt.includes(':')) {
        finalTitle = evt.split(':').slice(1).join(':').trim();
      } else if (wMatch && bMatch && wMatch[1] !== '?' && bMatch[1] !== '?') {
        finalTitle = `${wMatch[1]} - ${bMatch[1]}`;
      } else if (evt.trim() && evt !== '?') {
        finalTitle = evt.trim();
      }

      const moves = (rawContent.match(/\b\d+\./g) || []).length;
      return {
        title: finalTitle,
        movesCount: moves
      };
    });
    
    const whiteRegex = /\[White "([^"]+)"\]/;
    const whiteMatch = pgn.match(whiteRegex);
    const author = whiteMatch ? whiteMatch[1] : 'Lichess Author';
    
    return {
      title: studyTitle,
      chaptersCount: events.length || 1,
      chaptersList: finalChapters,
      author,
      visibility: 'Public / Unlisted'
    };
  };

  const handleFetchLichess = async () => {
    if (!lichessUrl.trim()) return;
    setIsFetching(true);
    setFetchError(null);
    setFetchedStudy(null);

    try {
      const res = await fetch(`/api/database/fetch-lichess?url=${encodeURIComponent(lichessUrl)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch Lichess study');
      }
      const data = await res.json();
      const meta = parseLichessPgn(data.pgnText);
      setFetchedStudy({
        pgnText: data.pgnText,
        ...meta
      });
      if (requireCollectionName) {
        setCollectionName(meta.title);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Private study or invalid URL. Only public or unlisted studies are supported.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requireCollectionName && !collectionName.trim()) return;
    
    if (activeTab === 'lichess') {
      if (fetchedStudy) {
        onUpload(fetchedStudy.pgnText, collectionName.trim());
        onClose();
      }
    } else {
      if (pgnText.trim()) {
        onUpload(pgnText, collectionName.trim());
        onClose();
      }
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPgnText(event.target.result as string);
        setDroppedFileName(file.name);
        if (requireCollectionName) {
          setCollectionName(file.name.replace(/\.pgn$/i, ''));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  return createPortal(
    <div className="vca-pgn-modal-overlay" onClick={onClose}>
      <style>{`
        .vca-pgn-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 1.5rem;
          animation: vca-fade-in 0.2s ease-out forwards;
        }

        .vca-pgn-modal-card {
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          border-radius: 16px;
          padding: 1.75rem;
          width: 100%;
          max-width: ${activeTab === 'lichess' && fetchedStudy ? '850px' : '500px'};
          box-shadow: 0 10px 30px -5px rgba(74, 32, 24, 0.15);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          font-family: 'Outfit', sans-serif;
          transition: max-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: vca-scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .vca-pgn-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eedcd0;
          padding-bottom: 0.5rem;
        }

        .vca-pgn-modal-title {
          color: #4a2018;
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vca-pgn-close-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          color: rgba(74, 32, 24, 0.6);
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .vca-pgn-close-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        .vca-pgn-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #eedcd0;
          margin-bottom: 0.25rem;
        }

        .vca-pgn-tab-btn {
          border: none;
          background: transparent;
          padding: 8px 14px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #4a2018;
          opacity: 0.6;
          cursor: pointer;
          transition: all 0.15s;
          border-bottom: 2px solid transparent;
        }

        .vca-pgn-tab-btn:hover {
          opacity: 1;
        }

        .vca-pgn-tab-btn.active {
          opacity: 1;
          color: #c8854a;
          border-bottom-color: #c8854a;
        }

        .vca-pgn-columns {
          display: flex;
          gap: 24px;
          width: 100%;
        }

        .vca-pgn-column-left {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 0;
        }

        .vca-pgn-column-right {
          flex: 1;
          border-left: 1px solid #eedcd0;
          padding-left: 24px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 0;
        }

        .vca-pgn-form-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .vca-pgn-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .vca-pgn-label {
          color: #4a2018;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .vca-drop-zone {
          border: 2px dashed #ddc9ba;
          border-radius: 12px;
          background: #fff;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          user-select: none;
          outline: none;
        }

        .vca-drop-zone:hover {
          border-color: #c8854a;
          background: #fdf0e4;
        }

        .vca-drop-zone.dragging {
          border-color: #c8854a;
          background: rgba(200, 133, 74, 0.08);
          box-shadow: 0 0 0 4px rgba(200, 133, 74, 0.15);
          transform: scale(1.01);
        }

        .vca-drop-zone.has-file {
          border-style: solid;
          border-color: #52b788;
          background: #f4fbf7;
        }

        .vca-drop-icon {
          color: #c8854a;
          margin-bottom: 2px;
        }

        .vca-drop-zone.has-file .vca-drop-icon {
          color: #52b788;
        }

        .vca-drop-primary-text {
          font-size: 0.9rem;
          color: #4a2018;
        }

        .vca-drop-file-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #2d6a4f;
          display: flex;
          align-items: center;
          gap: 4px;
          background: #d8f3dc;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .vca-drop-secondary-text {
          font-size: 0.75rem;
          color: rgba(74, 32, 24, 0.5);
        }

        .vca-drop-browse-link {
          color: #c8854a;
          text-decoration: underline;
          font-weight: 600;
        }

        .vca-pgn-input-file-hidden {
          display: none;
        }

        .vca-pgn-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddc9ba;
          border-radius: 10px;
          background: #fff;
          color: #4a2018;
          font-family: monospace;
          font-size: 0.85rem;
          line-height: 1.4;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .vca-pgn-textarea:focus {
          border-color: #c8854a;
        }

        .vca-pgn-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddc9ba;
          border-radius: 8px;
          background: #fff;
          color: #4a2018;
          outline: none;
          font-size: 0.88rem;
          transition: border-color 0.2s;
        }
        .vca-pgn-input:focus {
          border-color: #c8854a;
        }

        .vca-pgn-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 4px;
        }

        .vca-pgn-btn {
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .vca-pgn-btn-cancel {
          background: #eedcd0;
          color: #4a2018;
        }

        .vca-pgn-btn-cancel:hover {
          background: #e4ccbe;
        }

        .vca-pgn-btn-upload {
          background: #c8854a;
          color: white;
        }

        .vca-pgn-btn-upload:hover:not(:disabled) {
          background: #b5743b;
        }

        .vca-pgn-btn-upload:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Lichess Specific Styles */
        .vca-lichess-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .vca-lichess-input-icon {
          position: absolute;
          left: 12px;
          color: rgba(74, 32, 24, 0.4);
        }

        .vca-lichess-input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 1px solid #ddc9ba;
          border-radius: 8px;
          background: #fff;
          color: #4a2018;
          outline: none;
          font-size: 0.88rem;
          transition: border-color 0.2s;
        }

        .vca-lichess-input:focus {
          border-color: #c8854a;
        }

        .vca-lichess-helper {
          font-size: 0.75rem;
          color: rgba(74, 32, 24, 0.5);
          margin-top: 2px;
        }

        .vca-lichess-btn-fetch {
          background: #c8854a;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s;
          font-size: 0.88rem;
        }

        .vca-lichess-btn-fetch:hover:not(:disabled) {
          background: #b5743b;
        }

        .vca-lichess-btn-fetch:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .vca-lichess-error {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.8rem;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 4px;
        }

        .vca-study-card {
          background: #fff;
          border: 1px solid #eedcd0;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          gap: 14px;
          align-items: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }

        .vca-study-icon-box {
          width: 56px;
          height: 56px;
          background: #4a2018;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fdf5ea;
          font-size: 0.6rem;
          font-weight: bold;
          text-align: center;
          padding: 4px;
          flex-shrink: 0;
        }

        .vca-study-icon-knight {
          font-size: 1.25rem;
          line-height: 1;
        }

        .vca-study-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .vca-study-title {
          font-size: 1rem;
          font-weight: 700;
          color: #4a2018;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vca-study-author {
          font-size: 0.8rem;
          color: rgba(74, 32, 24, 0.7);
          margin: 0;
        }

        .vca-study-meta-row {
          display: flex;
          gap: 8px;
          font-size: 0.72rem;
          color: rgba(74, 32, 24, 0.5);
          margin-top: 2px;
        }

        .vca-study-meta-badge {
          background: #fdf0e4;
          color: #c8854a;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 600;
        }

        /* Preview Panel */
        .vca-preview-header {
          font-size: 1.05rem;
          font-weight: 700;
          color: #4a2018;
          margin: 0 0 2px 0;
        }

        .vca-preview-sub {
          font-size: 0.78rem;
          color: rgba(74, 32, 24, 0.5);
          margin: 0 0 8px 0;
        }

        .vca-preview-tabs {
          display: flex;
          gap: 4px;
          background: #fdf0e4;
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .vca-preview-tab-btn {
          flex: 1;
          border: none;
          background: transparent;
          padding: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #4a2018;
          opacity: 0.6;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .vca-preview-tab-btn.active {
          background: #fff;
          color: #c8854a;
          opacity: 1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .vca-chapters-list {
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #eedcd0;
          border-radius: 8px;
          padding: 8px;
          background: #fff;
        }

        .vca-chapter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          border-radius: 6px;
          background: #fdfdfd;
          border: 1px solid #eedcd0;
        }

        .vca-chapter-title-block {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .vca-chapter-number {
          font-size: 0.72rem;
          background: #fdf0e4;
          color: #c8854a;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .vca-chapter-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #4a2018;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vca-chapter-moves {
          font-size: 0.72rem;
          color: rgba(74, 32, 24, 0.5);
          flex-shrink: 0;
        }

        .vca-lichess-notice {
          background: #fcf6ef;
          border: 1px solid #f2e3d7;
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: rgba(74, 32, 24, 0.6);
        }

        .vca-lichess-notice-icon {
          color: #c8854a;
          flex-shrink: 0;
        }

        .vca-study-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          color: rgba(74, 32, 24, 0.5);
          font-size: 0.8rem;
        }

        @keyframes vca-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes vca-scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div className="vca-pgn-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="vca-pgn-modal-header">
          <h2 className="vca-pgn-modal-title">
            <Upload size={18} /> Upload PGN / Import
          </h2>
          <button className="vca-pgn-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="vca-pgn-tabs">
          <button
            type="button"
            className={`vca-pgn-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload File
          </button>
          <button
            type="button"
            className={`vca-pgn-tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => setActiveTab('paste')}
          >
            Paste PGN
          </button>
          <button
            type="button"
            className={`vca-pgn-tab-btn ${activeTab === 'lichess' ? 'active' : ''}`}
            onClick={() => setActiveTab('lichess')}
          >
            Lichess study
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vca-pgn-form-body">
          {requireCollectionName && (
            <div className="vca-pgn-form-group" style={{ marginBottom: '8px' }}>
              <label className="vca-pgn-label">Collection Name</label>
              <input
                type="text"
                className="vca-pgn-input"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g. My Favorite Games"
                required
              />
            </div>
          )}
          <div className="vca-pgn-columns">
            {/* Left Column */}
            <div className="vca-pgn-column-left">
              {activeTab === 'upload' && (
                <>
                  <div
                    className={`vca-drop-zone ${isDragging ? 'dragging' : ''} ${droppedFileName ? 'has-file' : ''}`}
                    onClick={handleDropZoneClick}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleDropZoneClick()}
                    aria-label="Drag and drop PGN file here or click to browse"
                  >
                    <CloudUpload
                      size={36}
                      className="vca-drop-icon"
                      strokeWidth={1.5}
                    />
                    {isDragging ? (
                      <span className="vca-drop-primary-text">Drop your PGN file here!</span>
                    ) : droppedFileName ? (
                      <>
                        <span className="vca-drop-primary-text">File loaded ✓</span>
                        <span className="vca-drop-file-name">
                          <FileText size={13} />
                          {droppedFileName}
                        </span>
                        <span className="vca-drop-secondary-text">
                          Click to replace or drag another file
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="vca-drop-primary-text">
                          Drag & drop your <strong>.pgn</strong> file here
                        </span>
                        <span className="vca-drop-secondary-text">
                          or <span className="vca-drop-browse-link">click to browse</span>
                        </span>
                      </>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pgn,text/plain"
                    className="vca-pgn-input-file-hidden"
                    onChange={handleFileChange}
                  />

                  <div className="vca-pgn-modal-actions">
                    <button type="button" className="vca-pgn-btn vca-pgn-btn-cancel" onClick={onClose}>
                      Cancel
                    </button>
                    <button type="submit" className="vca-pgn-btn vca-pgn-btn-upload" disabled={!pgnText.trim()}>
                      Upload
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'paste' && (
                <>
                  <div className="vca-pgn-form-group">
                    <label className="vca-pgn-label">Paste PGN Content (Supports Single/Multi-Game):</label>
                    <textarea
                      className="vca-pgn-textarea"
                      placeholder="Paste PGN here..."
                      value={pgnText}
                      onChange={(e) => { setPgnText(e.target.value); setDroppedFileName(null); }}
                      rows={6}
                    />
                  </div>

                  <div className="vca-pgn-modal-actions">
                    <button type="button" className="vca-pgn-btn vca-pgn-btn-cancel" onClick={onClose}>
                      Cancel
                    </button>
                    <button type="submit" className="vca-pgn-btn vca-pgn-btn-upload" disabled={!pgnText.trim()}>
                      Upload
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'lichess' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="vca-pgn-form-group">
                    <label className="vca-pgn-label">Paste a Lichess study link</label>
                    <div className="vca-lichess-input-wrapper">
                      <Link size={16} className="vca-lichess-input-icon" />
                      <input
                        type="text"
                        className="vca-lichess-input"
                        placeholder="https://lichess.org/study/kqK3p9Lm"
                        value={lichessUrl}
                        onChange={(e) => setLichessUrl(e.target.value)}
                      />
                    </div>
                    <span className="vca-lichess-helper">Works with public or unlisted studies</span>
                  </div>

                  <button
                    type="button"
                    className="vca-lichess-btn-fetch"
                    disabled={isFetching || !lichessUrl.trim()}
                    onClick={handleFetchLichess}
                  >
                    <Download size={16} />
                    {isFetching ? 'Fetching study...' : 'Fetch study'}
                  </button>

                  {fetchError && (
                    <div className="vca-lichess-error">
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{fetchError}</span>
                    </div>
                  )}

                  {fetchedStudy ? (
                    <div className="vca-study-card">
                      <div className="vca-study-icon-box">
                        <span className="vca-study-icon-knight">♞</span>
                        <span>Lichess study</span>
                      </div>
                      <div className="vca-study-info">
                        <h4 className="vca-study-title" title={fetchedStudy.title}>{fetchedStudy.title}</h4>
                        <p className="vca-study-author">by {fetchedStudy.author}</p>
                        <div className="vca-study-meta-row">
                          <span className="vca-study-meta-badge">Visibility: {fetchedStudy.visibility}</span>
                          <span>•</span>
                          <span>{fetchedStudy.chaptersCount} Chapters</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="vca-lichess-notice">
                      <BookOpen size={16} className="vca-lichess-notice-icon" />
                      <span>Only public or unlisted studies can be imported. Private studies are not supported.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column (Lichess Preview) */}
            {activeTab === 'lichess' && fetchedStudy && (
              <div className="vca-pgn-column-right">
                <h3 className="vca-preview-header">Study preview</h3>
                <p className="vca-preview-sub">Review before importing to classroom</p>

                <div className="vca-preview-tabs">
                  <button
                    type="button"
                    className={`vca-preview-tab-btn ${previewTab === 'chapters' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('chapters')}
                  >
                    Chapters ({fetchedStudy.chaptersCount})
                  </button>
                  <button
                    type="button"
                    className={`vca-preview-tab-btn ${previewTab === 'info' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('info')}
                  >
                    Info
                  </button>
                </div>

                {previewTab === 'chapters' && (
                  <div className="vca-chapters-list">
                    {fetchedStudy.chaptersList.map((chap, idx) => (
                      <div key={idx} className="vca-chapter-row">
                        <div className="vca-chapter-title-block">
                          <span className="vca-chapter-number">{idx + 1}</span>
                          <span className="vca-chapter-title" title={chap.title}>{chap.title}</span>
                        </div>
                        <span className="vca-chapter-moves">{chap.movesCount} moves</span>
                      </div>
                    ))}
                  </div>
                )}

                {previewTab === 'info' && (
                  <div className="vca-chapters-list" style={{ fontSize: '0.85rem', color: '#4a2018', gap: '4px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eedcd0', paddingBottom: '4px' }}>
                      <strong>Title</strong>
                      <span>{fetchedStudy.title}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eedcd0', paddingBottom: '4px', paddingTop: '4px' }}>
                      <strong>Author</strong>
                      <span>{fetchedStudy.author}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eedcd0', paddingBottom: '4px', paddingTop: '4px' }}>
                      <strong>Visibility</strong>
                      <span style={{ color: '#2a9d8f', fontWeight: 'bold' }}>{fetchedStudy.visibility}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                      <strong>Chapters</strong>
                      <span>{fetchedStudy.chaptersCount}</span>
                    </div>
                  </div>
                )}

                <div className="vca-pgn-modal-actions" style={{ marginTop: 'auto' }}>
                  <button type="button" className="vca-pgn-btn vca-pgn-btn-cancel" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="vca-pgn-btn vca-pgn-btn-upload">
                    <Download size={15} /> Import study
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
