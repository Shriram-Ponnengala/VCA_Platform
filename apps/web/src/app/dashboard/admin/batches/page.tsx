'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Clock, Calendar, ChevronRight, ClipboardCheck, Search, Filter } from 'lucide-react';
import { Button } from '@vca/ui';
import { Badge } from '@vca/ui';
import { useBatches } from '@/lib/hooks/useBatches';
import { generateBatchSlug } from '@/lib/utils/urlUtils';
import { BatchModal } from './BatchModal';
import { Toast } from '@vca/ui';
import styles from './batches.module.css';

export default function BatchesPage() {
  const router = useRouter();
  const { batches, isLoaded, addBatch } = useBatches();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCoach, setFilterCoach] = useState('All');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const uniqueCoaches = Array.from(new Set(batches.map(b => b.coach).filter(Boolean)));
  const uniquePrograms = Array.from(new Set(batches.map(b => b.program).filter(Boolean)));

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoach = filterCoach === 'All' || batch.coach === filterCoach;
    const matchesProgram = filterProgram === 'All' || batch.program === filterProgram;
    const matchesType = filterType === 'All' || batch.type === filterType;
    return matchesSearch && matchesCoach && matchesProgram && matchesType;
  });

  const handleCreateBatch = async (data: any) => {
    try {
      const newId = await addBatch(data);
      if (newId) {
        setToast({ message: 'Batch created successfully!', type: 'success' });
        setIsModalOpen(false);
        // Give time for toast to be seen before redirecting
        setTimeout(() => {
          // We need to resolve the batch to generate the slug, but `addBatch` returns an ID.
          // Since the batch list might not have the newly created batch immediately if it relies on SWR/re-fetch,
          // the backend might just redirect via ID. But wait, `addBatch` in `useBatches.ts` updates local state synchronously!
          // We can find the batch.
          const createdBatch = batches.find(b => b.id === newId);
          const slug = createdBatch ? generateBatchSlug(createdBatch.id, createdBatch.name, batches) : newId;
          router.push(`/dashboard/admin/batches/${slug}`);
        }, 1000);
      }
    } catch (error) {
      setToast({ message: 'Failed to create batch. Please check your data.', type: 'error' });
    }
  };

  if (!isLoaded) return <div className={styles.container}>Loading...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Batches</h1>
          <p className={styles.subtitle}>Welcome back to the academy</p>
        </div>
        <Button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Create Batch
        </Button>
      </header>

      <div className={styles.filterSection}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search batches by name..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={filterCoach}
          onChange={(e) => setFilterCoach(e.target.value)}
        >
          <option value="All">All Coaches</option>
          {uniqueCoaches.map(coach => (
            <option key={coach} value={coach}>{coach}</option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
        >
          <option value="All">All Levels</option>
          {uniquePrograms.map(prog => (
            <option key={prog} value={prog}>{prog}</option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Group">Group</option>
          <option value="One-on-One">One-on-One</option>
        </select>
      </div>

      <div className={styles.grid}>
        {filteredBatches.length === 0 ? (
          <div className={styles.noResults}>
            <p>No batches found matching your filters.</p>
          </div>
        ) : (
          filteredBatches.map((batch) => (
          <div 
            key={batch.id} 
            className={styles.card}
            onClick={() => router.push(`/dashboard/admin/batches/${generateBatchSlug(batch.id, batch.name, batches)}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.cardHeader}>
              <Badge variant="active">{(batch.program || 'UNKNOWN').split(' ')[0]}</Badge>
              <Badge variant="active">{batch.status}</Badge>
            </div>
            
            <div className={styles.batchPrimary}>
              <h3 className={styles.batchName}>{batch.name}</h3>
              <p className={styles.coachName}>{batch.coach}</p>
            </div>

            <div className={styles.divider} />

            <div className={styles.details}>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <Users size={16} />
                  <span>Students</span>
                </div>
                <span className={styles.detailValue}>{batch.students?.length || 0}</span>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <ClipboardCheck size={16} />
                  <span>Last Class</span>
                </div>
                <span className={styles.detailValue}>
                  {batch.history && batch.history.length > 0 
                    ? batch.history[0].date 
                    : 'No classes yet'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <Clock size={16} />
                  <span>Time</span>
                </div>
                <span className={styles.detailValue}>{batch.startTime} - {batch.endTime}</span>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>
                  <Calendar size={16} />
                  <span>Days</span>
                </div>
                <div className={styles.dayPills}>
                  {batch.days.map(day => (
                    <span key={day} className={styles.dayPill}>{day}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.arrowBtn}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )))}
      </div>

      <BatchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateBatch}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
