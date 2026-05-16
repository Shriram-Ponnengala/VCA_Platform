'use client';

import React, { useEffect } from 'react';
import styles from './Toast.module.css';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'success',
  onClose,
  duration = 3000
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.icon}>
        <Icon size={20} />
      </div>
      <div className={styles.message}>{message}</div>
      <button className={styles.closeBtn} onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
