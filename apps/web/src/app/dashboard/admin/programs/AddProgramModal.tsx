'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@vca/ui';
import { Button } from '@vca/ui';
import styles from './programs.module.css';

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, code: string) => void;
  initialData?: { name: string; code: string } | null;
}

export function AddProgramModal({ isOpen, onClose, onSave, initialData }: AddProgramModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
    } else {
      setName('');
      setCode('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && code) {
      onSave(name, code);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Program' : 'Add New Program'}>
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Program Name</label>
          <input 
            type="text" 
            placeholder="e.g. Knight Batch" 
            className={styles.input} 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Program Code</label>
          <input 
            type="text" 
            placeholder="e.g. KNIGHT" 
            className={styles.input} 
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />
        </div>
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" className={styles.saveBtn}>
            {initialData ? 'Update Program' : 'Create Program'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

