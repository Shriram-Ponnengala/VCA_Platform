'use client';

import React, { useState } from 'react';
import { Calendar, Plus, Clock, Users, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import styles from './classes.module.css';

export default function ClassesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState([
    { id: '1', name: 'Beginners Fundamentals', coach: 'Vikram', time: '10:00 AM', days: ['Mon', 'Wed', 'Fri'], students: 12 },
    { id: '2', name: 'Intermediate Strategy', coach: 'Priya', time: '02:00 PM', days: ['Tue', 'Thu'], students: 8 },
    { id: '3', name: 'Advanced Tactics', coach: 'Vikram', time: '04:30 PM', days: ['Mon', 'Fri'], students: 6 },
    { id: '4', name: 'Open Tournament Prep', coach: 'Priya', time: '11:00 AM', days: ['Sat'], students: 15 },
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Class Management</h1>
          <p className={styles.subtitle}>Schedule and organize chess coaching sessions.</p>
        </div>
        <Button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Create New Class
        </Button>
      </div>

      <div className={styles.grid}>
        {classes.map((cls) => (
          <div key={cls.id} className={styles.classCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <Calendar size={20} />
              </div>
              <button className={styles.moreBtn}>
                <MoreVertical size={18} />
              </button>
            </div>
            
            <h3 className={styles.className}>{cls.name}</h3>
            
            <div className={styles.details}>
              <div className={styles.detailItem}>
                <Users size={16} />
                <span>Coach: <strong>{cls.coach}</strong></span>
              </div>
              <div className={styles.detailItem}>
                <Clock size={16} />
                <span>{cls.time} • {cls.days.join(', ')}</span>
              </div>
              <div className={styles.detailItem}>
                <Users size={16} />
                <span>{cls.students} Students Enrolled</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.viewBtn}>View Details</button>
              <button className={styles.attendanceBtn}>View Attendance</button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Class"
      >
        <form className={styles.modalForm} onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); alert('Class created successfully!'); }}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Class Name</label>
            <input type="text" placeholder="e.g. Advanced Tactics" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Coach</label>
            <select className={styles.select} required>
              <option value="Vikram">Coach Vikram</option>
              <option value="Priya">Coach Priya</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Schedule (Time & Days)</label>
            <input type="text" placeholder="e.g. 10:00 AM • Mon, Wed, Fri" className={styles.input} required />
          </div>
          <Button type="submit" className={styles.saveBtn}>Create Class</Button>
        </form>
      </Modal>
    </div>
  );
}
