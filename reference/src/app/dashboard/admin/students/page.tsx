'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Filter, ChevronDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AddStudentModal } from './AddStudentModal';
import { useStudents } from '@/lib/hooks/useStudents';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import styles from './students.module.css';

export default function StudentsPage() {
  const router = useRouter();
  const { students, isLoaded, addStudent, updateStudent, deleteStudent } = useStudents();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [programFilter, setProgramFilter] = useState('All');

  const programs = ['All', 'Pawn Batch', 'Knight Batch', 'Bishop Batch', 'Rook Batch', 'Queen Batch', 'King Batch'];

  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.name?.toLowerCase().includes(search.toLowerCase()) || 
                          student.email?.toLowerCase().includes(search.toLowerCase())) ?? false;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesProgram = programFilter === 'All' || student.program === programFilter;
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const handleSaveStudent = async (data: any) => {
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, data);
        setToastMessage('Student updated successfully!');
      } else {
        await addStudent(data);
        setToastMessage('Student registered successfully!');
      }
      
      setIsModalOpen(false);
      setEditingStudent(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to save student profile');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEdit = (e: React.MouseEvent, student: any) => {
    e.stopPropagation();
    setEditingStudent(student);
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setStudentToDelete(id);
    setIsConfirmOpen(true);
    setActiveMenu(null);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete);
      setToastMessage('Student deleted successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setStudentToDelete(null);
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === id ? null : id);
  };

  if (!isLoaded) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container} onClick={() => setActiveMenu(null)}>
      <header className={styles.header}>
        <h1 className={styles.title}>Students</h1>
        <p className={styles.subtitle}>Welcome back to the academy</p>
      </header>

      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Search students..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className={styles.addBtn} onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}>
          <Plus size={18} />
          Add Student
        </Button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterLabel}>
          <Filter size={16} />
          <span>FILTERS:</span>
        </div>
        <div className={styles.dropdowns}>
          <div className={styles.dropdownWrapper}>
            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <ChevronDown size={14} className={styles.selectIcon} />
          </div>
          <div className={styles.dropdownWrapper}>
            <select 
              className={styles.filterSelect}
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
            >
              {programs.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={14} className={styles.selectIcon} />
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>STUDENT NAME</th>
              <th>PARENT NAME</th>
              <th>PROGRAM</th>
              <th>LOCATION</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr 
                key={student.id} 
                onClick={() => router.push(`/dashboard/admin/students/${student.id}`)}
                className={styles.clickableRow}
              >
                <td>
                  <div className={styles.studentNameCell}>
                    <span className={styles.studentName}>{student.name}</span>
                    <span className={styles.studentEmail}>{student.email}</span>
                  </div>
                </td>
                <td>{student.parentName}</td>
                <td>{student.program || 'Not Assigned'}</td>
                <td>{student.city}, {student.country}</td>
                <td>
                  <Badge variant={student.status}>{student.status}</Badge>
                </td>
                <td className={styles.actionsCell}>
                  <button 
                    className={styles.actionBtn} 
                    onClick={(e) => toggleMenu(e, student.id)}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {activeMenu === student.id && (
                    <div className={styles.actionMenu}>
                      <button onClick={(e) => handleEdit(e, student)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={(e) => handleDelete(e, student.id)} className={styles.deleteAction}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No students found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingStudent(null); }} 
        onSave={handleSaveStudent} 
        initialData={editingStudent}
      />

      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student? This will also remove their enrollment data."
        confirmText="Delete Student"
        variant="danger"
      />
    </div>
  );
}

