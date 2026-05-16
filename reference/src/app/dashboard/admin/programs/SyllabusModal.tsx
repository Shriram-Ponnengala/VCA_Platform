'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, GripVertical, Book, CheckCircle2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import styles from './SyllabusModal.module.css';

interface Topic {
  id: string;
  title: string;
  description?: string;
  order: number;
}

interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: {
    id: number;
    name: string;
    code: string;
    topics: Topic[];
  };
  onSaveTopics: (programId: number, topics: Topic[]) => void;
  userRole: 'ADMIN' | 'COACH' | 'STUDENT';
}

export function SyllabusModal({ isOpen, onClose, program, onSaveTopics, userRole }: SyllabusModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTopics([...program.topics].sort((a, b) => a.order - b.order));
      setIsAdding(false);
      setEditingTopicId(null);
    }
  }, [isOpen, program]);

  if (!isOpen) return null;

  const isAdmin = userRole === 'ADMIN';

  const handleAddTopic = () => {
    if (!formTitle.trim()) return;
    const newTopic: Topic = {
      id: Date.now().toString(),
      title: formTitle,
      description: formDesc,
      order: topics.length + 1
    };
    const updated = [...topics, newTopic];
    setTopics(updated);
    onSaveTopics(program.id, updated);
    resetForm();
  };

  const handleEditTopic = () => {
    if (!editingTopicId || !formTitle.trim()) return;
    const updated = topics.map(t => 
      t.id === editingTopicId ? { ...t, title: formTitle, description: formDesc } : t
    );
    setTopics(updated);
    onSaveTopics(program.id, updated);
    resetForm();
  };

  const handleDeleteTopic = (id: string) => {
    setTopicToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (topicToDelete) {
      const updated = topics
        .filter(t => t.id === topicToDelete ? false : true)
        .map((t, idx) => ({ ...t, order: idx + 1 }));
      setTopics(updated);
      onSaveTopics(program.id, updated);
      setTopicToDelete(null);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setIsAdding(false);
    setEditingTopicId(null);
  };

  const startEdit = (topic: Topic) => {
    setFormTitle(topic.title);
    setFormDesc(topic.description || '');
    setEditingTopicId(topic.id);
  };

  // NATIVE DRAG AND DROP
  const onDragStart = (e: React.DragEvent, index: number) => {
    if (!isAdmin) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    if (!isAdmin || draggedIndex === null || draggedIndex === index) return;
    e.preventDefault();
    
    const newTopics = [...topics];
    const draggedItem = newTopics[draggedIndex];
    newTopics.splice(draggedIndex, 1);
    newTopics.splice(index, 0, draggedItem);
    
    const reordered = newTopics.map((t, i) => ({ ...t, order: i + 1 }));
    setTopics(reordered);
    setDraggedIndex(index);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
    onSaveTopics(program.id, topics);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.codeLabel}>CODE: {program.code}</span>
            <h2 className={styles.title}>{program.name} Syllabus</h2>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={24} />
            </button>
            {isAdmin && !isAdding && !editingTopicId && (
              <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
                <Plus size={18} />
                Add Topic
              </button>
            )}
          </div>
        </header>

        <div className={styles.content}>
          {/* Add/Edit Form */}
          {(isAdding || editingTopicId) && (
            <div className={styles.formCard}>
              <h3 className={styles.topicTitle}>{editingTopicId ? 'Edit Topic' : 'New Topic'}</h3>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>TOPIC TITLE *</label>
                <input 
                  autoFocus
                  className={styles.input} 
                  value={formTitle} 
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Introduction to Chess Pieces"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>TOPIC DESCRIPTION</label>
                <textarea 
                  className={styles.textarea} 
                  rows={3}
                  value={formDesc} 
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="e.g. Learn the names and movements of all pieces"
                />
              </div>
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={resetForm}>Cancel</button>
                <button className={styles.saveBtn} onClick={editingTopicId ? handleEditTopic : handleAddTopic}>
                  {editingTopicId ? 'Update Topic' : 'Save Topic'}
                </button>
              </div>
            </div>
          )}

          {topics.length === 0 && !isAdding && (
            <div className={styles.emptyState}>
              <Book size={48} />
              <p className={styles.emptyText}>No topics added yet</p>
              {isAdmin && (
                <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
                  Add your first topic
                </button>
              )}
            </div>
          )}

          {topics.map((topic, index) => (
            <div 
              key={topic.id} 
              className={`${styles.topicCard} ${draggedIndex === index ? styles.dragging : ''}`}
              draggable={isAdmin}
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
            >
              {isAdmin && (
                <div className={styles.dragHandle}>
                  <GripVertical size={18} />
                </div>
              )}
              <div className={styles.topicNumber}>{index + 1}</div>
              <div className={styles.topicInfo}>
                <h4 className={styles.topicTitle}>{topic.title}</h4>
                {topic.description && <p className={styles.topicDescription}>{topic.description}</p>}
              </div>
              
              {isAdmin && !editingTopicId && !isAdding && (
                <div className={styles.topicActions}>
                  <button className={styles.actionIcon} onClick={() => startEdit(topic)}>
                    <Pencil size={16} />
                  </button>
                  <button className={`${styles.actionIcon} ${styles.deleteIcon}`} onClick={() => handleDeleteTopic(topic.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Topic"
        message="Are you sure you want to remove this topic from the syllabus?"
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}
