'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Handle portal mounting on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle key listeners, focus trap, and autofocus
  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button as a safe default
    const focusTimer = setTimeout(() => {
      cancelRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Tab') {
        const focusables = modalRef.current?.querySelectorAll('button');
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0] as HTMLElement;
        const last = focusables[focusables.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen || !mounted) return null;

  const isDanger = variant === 'danger';

  const modalHtml = (
    <div 
      className="vca-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vca-confirm-title"
      aria-describedby="vca-confirm-desc"
    >
      <style>{`
        .vca-modal-overlay {
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

         .vca-modal-card {
          background: #fdf5ea;
          border: 1px solid #eedcd0;
          border-radius: 16px;
          padding: 1.75rem;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 10px 30px -5px rgba(74, 32, 24, 0.15);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          font-family: 'Outfit', sans-serif;
          animation: vca-scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .vca-modal-title {
          color: #4a2018;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .vca-modal-message {
          color: rgba(74, 32, 24, 0.8);
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        .vca-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .vca-btn {
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

        .vca-btn-cancel {
          background: transparent;
          border: 1px solid #eedcd0;
          color: #4a2018;
        }

        .vca-btn-cancel:hover {
          background: rgba(45, 74, 107, 0.05);
          border-color: #c8854a;
          color: #4a2018;
        }

        .vca-btn-cancel:focus-visible {
          border-color: #c8854a;
          box-shadow: 0 0 0 2px rgba(200, 133, 74, 0.3);
        }

        .vca-btn-confirm {
          color: #ffffff;
          border: none;
        }

        .vca-btn-confirm-danger {
          background: #dc2626;
        }

        .vca-btn-confirm-danger:hover {
          background: #b91c1c;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }

        .vca-btn-confirm-danger:focus-visible {
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.4);
        }

        .vca-btn-confirm-default {
          background: #2d4a6b;
        }

        .vca-btn-confirm-default:hover {
          background: #1d334d;
          box-shadow: 0 4px 12px rgba(45, 74, 107, 0.2);
        }

        .vca-btn-confirm-default:focus-visible {
          box-shadow: 0 0 0 2px rgba(45, 74, 107, 0.4);
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
      <div className="vca-modal-card" ref={modalRef}>
        <h2 className="vca-modal-title" id="vca-confirm-title">
          {title}
        </h2>
        <p className="vca-modal-message" id="vca-confirm-desc">
          {message}
        </p>
        <div className="vca-modal-actions">
          <button
            type="button"
            className="vca-btn vca-btn-cancel"
            ref={cancelRef}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`vca-btn vca-btn-confirm ${
              isDanger ? 'vca-btn-confirm-danger' : 'vca-btn-confirm-default'
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalHtml, document.body);
}
