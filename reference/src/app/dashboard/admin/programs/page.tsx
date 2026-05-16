'use client';

import React, { useState } from 'react';
import { BookOpen, Lock, Plus, MoreVertical, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SyllabusModal } from './SyllabusModal';
import { AddProgramModal } from './AddProgramModal';
import { usePrograms } from '@/lib/hooks/usePrograms';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import styles from './programs.module.css';

export default function ProgramsPage() {
  const { programs, isLoaded, addProgram, updateProgram, deleteProgram, moveProgram, updateTopics } = usePrograms();
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'COACH' | 'STUDENT'>('ADMIN');
  const [studentEnrolledId, setStudentEnrolledId] = useState<number>(1);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<number | null>(null);

  const handleViewSyllabus = (prog: any) => {
    if (userRole === 'STUDENT' && prog.id !== studentEnrolledId) return;
    setSelectedProgram(prog);
    setIsSyllabusOpen(true);
    setActiveMenu(null);
  };

  const handleSaveTopics = (programId: number, updatedTopics: any[]) => {
    updateTopics(programId, updatedTopics);
    if (selectedProgram && selectedProgram.id === programId) {
      setSelectedProgram({ ...selectedProgram, topics: updatedTopics });
    }
  };

  const handleAddProgram = (name: string, code: string) => {
    if (editingProgram) {
      updateProgram(editingProgram.id, { name, code });
    } else {
      addProgram(name, code);
    }
    setIsAddModalOpen(false);
    setEditingProgram(null);
  };

  const handleEditProgram = (prog: any) => {
    setEditingProgram(prog);
    setIsAddModalOpen(true);
    setActiveMenu(null);
  };

  const handleDeleteProgram = (id: number) => {
    setProgramToDelete(id);
    setIsConfirmOpen(true);
    setActiveMenu(null);
  };

  const confirmDelete = () => {
    if (programToDelete !== null) {
      deleteProgram(programToDelete);
      setProgramToDelete(null);
    }
  };

  const handleMove = (id: number, direction: 'up' | 'down') => {
    moveProgram(id, direction);
    setActiveMenu(null);
  };

  if (!isLoaded) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Programs</h1>
          <p className={styles.subtitle}>Academy curriculum and learning paths</p>
        </div>
        <div className={styles.headerActions}>
          {userRole === 'ADMIN' && (
            <Button className={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} />
              Add Program
            </Button>
          )}
          <div className={styles.roleSwitcher}>
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value as any)}
              className={styles.roleSelect}
            >
              <option value="ADMIN">ADMIN VIEW</option>
              <option value="COACH">COACH VIEW</option>
              <option value="STUDENT">STUDENT VIEW</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.grid} onClick={() => setActiveMenu(null)}>
        {programs.map((prog, index) => {
          const isLocked = userRole === 'STUDENT' && prog.id !== studentEnrolledId;
          
          return (
            <div key={prog.id} className={`${styles.card} ${isLocked ? styles.lockedCard : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <span className={styles.idBadge}>{index + 1}</span>
                  <span className={styles.activeBadge}>{isLocked ? 'locked' : 'active'}</span>
                </div>
                {userRole === 'ADMIN' && (
                  <div className={styles.adminActions}>
                    <button 
                      className={styles.moreBtn} 
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === prog.id ? null : prog.id); }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === prog.id && (
                      <div className={styles.actionMenu}>
                        <button onClick={() => handleEditProgram(prog)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button onClick={() => handleMove(prog.id, 'up')} disabled={index === 0}>
                          <ChevronUp size={14} /> Move Up
                        </button>
                        <button onClick={() => handleMove(prog.id, 'down')} disabled={index === programs.length - 1}>
                          <ChevronDown size={14} /> Move Down
                        </button>
                        <button onClick={() => handleDeleteProgram(prog.id)} className={styles.deleteAction}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className={styles.cardBody}>
                <span className={styles.codeLabel}>CODE: {prog.code}</span>
                <h3 className={styles.progName}>{prog.name}</h3>
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className={styles.viewSyllabusBtn} 
                  onClick={() => handleViewSyllabus(prog)}
                  disabled={isLocked}
                >
                  {isLocked ? (
                    <>
                      <Lock size={14} />
                      <span>Not Enrolled</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={14} />
                      <span>View Syllabus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProgram && (
        <SyllabusModal 
          isOpen={isSyllabusOpen}
          onClose={() => setIsSyllabusOpen(false)}
          program={selectedProgram}
          onSaveTopics={handleSaveTopics}
          userRole={userRole}
        />
      )}

      <AddProgramModal 
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingProgram(null); }}
        onSave={handleAddProgram}
        initialData={editingProgram}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Program"
        message="Are you sure you want to delete this program? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

