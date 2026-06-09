'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, CloudUpload } from 'lucide-react';

interface UploadPgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (pgnText: string) => void;
}

export default function UploadPgnModal({ isOpen, onClose, onUpload }: UploadPgnModalProps) {
  const [mounted, setMounted] = useState(false);
  const [pgnText, setPgnText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0); // track nested drag-enter/leave events

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPgnText('');
      setDroppedFileName(null);
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pgnText.trim()) {
      onUpload(pgnText);
      onClose();
    }
  };

  const readFile = (file: File) => {
    if (!file.name.endsWith('.pgn') && file.type !== 'application/x-chess-pgn') {
      // Accept any text file too — the server will validate
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPgnText(event.target.result as string);
        setDroppedFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────
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
          max-width: 500px;
          box-shadow: 0 10px 30px -5px rgba(74, 32, 24, 0.15);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          font-family: 'Outfit', sans-serif;
          animation: vca-scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .vca-pgn-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eedcd0;
          padding-bottom: 0.85rem;
        }

        .vca-pgn-modal-title {
          color: #4a2018;
          font-size: 1.25rem;
          font-weight: 600;
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

        .vca-pgn-form-body {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .vca-pgn-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .vca-pgn-label {
          color: #4a2018;
          font-size: 0.9rem;
          font-weight: 600;
        }

        /* ── Drop Zone ─────────────────────────────── */
        .vca-drop-zone {
          border: 2px dashed #ddc9ba;
          border-radius: 12px;
          background: #fff;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
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
          border-color: #8a9c8b;
          background: rgba(138, 156, 139, 0.06);
        }

        .vca-drop-icon {
          color: #c8854a;
          transition: transform 0.2s ease;
        }

        .vca-drop-zone.dragging .vca-drop-icon {
          transform: translateY(-4px) scale(1.15);
        }

        .vca-drop-primary-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #4a2018;
        }

        .vca-drop-secondary-text {
          font-size: 0.78rem;
          color: #8a6c5b;
        }

        .vca-drop-browse-link {
          color: #c8854a;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
        }

        .vca-drop-file-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: #4a7a4e;
          font-weight: 500;
          background: rgba(138, 156, 139, 0.12);
          border: 1px solid rgba(138, 156, 139, 0.3);
          border-radius: 6px;
          padding: 5px 10px;
          margin-top: 2px;
        }

        .vca-pgn-input-file-hidden {
          display: none;
        }

        .vca-pgn-textarea {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #eedcd0;
          background: #ffffff;
          color: #4a2018;
          font-family: monospace;
          font-size: 0.88rem;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }

        .vca-pgn-textarea:focus {
          border-color: #c8854a;
        }

        .vca-pgn-divider {
          text-align: center;
          font-size: 0.8rem;
          font-weight: 600;
          color: #8a6c5b;
          position: relative;
          margin: 4px 0;
        }

        .vca-pgn-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .vca-pgn-btn {
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .vca-pgn-btn-cancel {
          background: transparent;
          border: 1px solid #eedcd0;
          color: #4a2018;
        }

        .vca-pgn-btn-cancel:hover {
          background: rgba(200, 133, 74, 0.05);
          border-color: #c8854a;
        }

        .vca-pgn-btn-upload {
          background: #c8854a;
          color: #ffffff;
          border: none;
        }

        .vca-pgn-btn-upload:hover:not(:disabled) {
          background: #b5743b;
          box-shadow: 0 4px 12px rgba(200, 133, 74, 0.2);
        }

        .vca-pgn-btn-upload:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
            <Upload size={18} /> Upload PGN
          </h2>
          <button className="vca-pgn-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vca-pgn-form-body">

          {/* ── Drag-and-drop zone ────────────────────────────────── */}
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

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pgn,text/plain"
            className="vca-pgn-input-file-hidden"
            onChange={handleFileChange}
          />

          <div className="vca-pgn-divider">OR</div>

          <div className="vca-pgn-form-group">
            <label className="vca-pgn-label">Paste PGN Content (Supports Single/Multi-Game):</label>
            <textarea
              className="vca-pgn-textarea"
              placeholder="Paste PGN here..."
              value={pgnText}
              onChange={(e) => { setPgnText(e.target.value); setDroppedFileName(null); }}
              rows={8}
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
        </form>
      </div>
    </div>,
    document.body
  );
}
