'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, BookOpen, User } from 'lucide-react';
import { useStudents } from '@/lib/hooks/useStudents';
import { useBatches } from '@/lib/hooks/useBatches';
import { AddStudentModal } from '../AddStudentModal';
import { generateBatchSlug } from '@/lib/utils/urlUtils';
import styles from './studentDetail.module.css';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  
  const { students, isLoaded: studentsLoaded, updateStudent, deleteStudent } = useStudents();
  const { batches, isLoaded: batchesLoaded } = useBatches();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const studentId = params.id as string;
  const student = students.find(s => s.id === studentId);

  if (!studentsLoaded || !batchesLoaded) return <div className={styles.container}>Loading...</div>;

  if (!student) {
    return (
      <div className={styles.container}>
        <h2>Student not found</h2>
      </div>
    );
  }

  // Derived Data for this student
  const studentBatches = batches.filter(b => b.students.includes(student.id));

  const handleEditSave = (data: any) => {
    updateStudent(student.id, data);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete student ${student.name}?\nThis will remove them from all batches.\nThis action cannot be undone.`)) {
      deleteStudent(student.id);
      router.push('/dashboard/admin/students');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>Edit Student</button>
          <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className={styles.profilePanel}>
        <div className={styles.leftProfile}>
          <div 
            className={styles.avatar} 
            style={{ 
              backgroundImage: student.profilePhoto ? `url(${student.profilePhoto})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!student.profilePhoto && <User size={64} />}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{student.name}</h1>
            {student.username && <p className={styles.username}>@{student.username}</p>}
            <p className={styles.role}>STUDENT</p>
            <p className={styles.programTag}>Enrolled in: {student.program || 'No Program'}</p>
          </div>
        </div>
        
        <div className={styles.rightProfile}>
          <div className={styles.contactItem}>
            <Mail size={18} className={styles.contactIcon} />
            <span>{student.email}</span>
          </div>
          <div className={styles.contactItem}>
            <Phone size={18} className={styles.contactIcon} />
            <span>{student.countryCode} {student.mobile}</span>
          </div>
          <div className={styles.contactItem}>
            <MapPin size={18} className={styles.contactIcon} />
            <span>{student.city}, {student.country}</span>
          </div>
          <div className={styles.contactItem}>
            <Calendar size={18} className={styles.contactIcon} />
            <span>DOB: {student.dob}</span>
          </div>
          <div className={styles.memberSince}>
            Member Since: {new Date(student.memberSince).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className={styles.tabContent}>
        <div className={styles.overviewStats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Batches</span>
            <span className={styles.statValue}>{studentBatches.length}</span>
          </div>
        </div>

          <h3 className={styles.sectionTitle}>Enrolled Batches ({studentBatches.length})</h3>
          <div className={styles.batchList}>
            {studentBatches.map(batch => (
              <div key={batch.id} className={styles.batchCard} onClick={() => router.push(`/dashboard/admin/batches/${generateBatchSlug(batch.id, batch.name, batches)}`)}>
                <div className={styles.batchHeader}>
                  <h4 className={styles.batchName}>{batch.name}</h4>
                  <span className={styles.batchBadge}>{batch.program.split(' ')[0]}</span>
                </div>
                <div className={styles.batchDetails}>
                  <span>Coach: {batch.coach}</span>
                  <span>{batch.days.join(', ')} • {batch.startTime} - {batch.endTime}</span>
                </div>
              </div>
            ))}
            {studentBatches.length === 0 && (
              <p style={{ color: '#94a3b8' }}>This student is not currently enrolled in any batches.</p>
            )}
          </div>
        </div>

      <AddStudentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleEditSave}
        initialData={student}
      />
    </div>
  );
}
