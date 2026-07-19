'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mail, Phone, MapPin, Calendar, CheckSquare, Layers, Shield, User,
  ChevronLeft, ChevronRight, Edit, Trash2
} from 'lucide-react';
import { useStudents } from '@/lib/hooks/useStudents';
import { useBatches } from '@/lib/hooks/useBatches';
import { AddStudentModal } from '../AddStudentModal';
import { generateBatchSlug } from '@/lib/utils/urlUtils';
import { ConfirmModal } from '@vca/ui';
import styles from './studentDetail.module.css';

const ROWS_OPTIONS = [5, 10, 20];

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();

  const { students, isLoaded: studentsLoaded, updateStudent, deleteStudent } = useStudents();
  const { batches, isLoaded: batchesLoaded } = useBatches();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'batches' | 'history'>('batches');
  const [sessions, setSessions] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Session History filters
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterCoach, setFilterCoach] = useState('all');
  const [filterQuick, setFilterQuick] = useState('thisMonth');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  // Custom date picker popup
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');

  const studentId = params.id as string;
  const student = students.find(s => s.id === studentId);
  const studentBatches = batches.filter(b => b.students.includes(student?.id || ''));

  useEffect(() => {
    if (!student || studentBatches.length === 0) {
      setSessionsLoading(false);
      return;
    }

    const loadData = async () => {
      setSessionsLoading(true);
      try {
        const sessionPromises = studentBatches.map(batch =>
          fetch(`/api/sessions/batch/${batch.id}`).then(res => res.ok ? res.json() : [])
        );
        const resolvedSessions = await Promise.all(sessionPromises);
        const allSessions = resolvedSessions.flat();

        const res = await fetch('/api/attendance');
        const allAttendance = res.ok ? await res.json() : [];

        setSessions(allSessions);
        setAttendanceRecords(allAttendance);
      } catch (err) {
        console.error('Failed to load session/attendance history:', err);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadData();
  }, [student, batches]);

  // Auto-set date range based on quick filter
  useEffect(() => {
    const now = new Date();
    if (filterQuick === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFilterDateFrom(start.toISOString().split('T')[0]);
      setFilterDateTo(now.toISOString().split('T')[0]);
    } else if (filterQuick === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFilterDateFrom(start.toISOString().split('T')[0]);
      setFilterDateTo(end.toISOString().split('T')[0]);
    } else if (filterQuick === 'last3Months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      setFilterDateFrom(start.toISOString().split('T')[0]);
      setFilterDateTo(now.toISOString().split('T')[0]);
    } else if (filterQuick === 'all') {
      setFilterDateFrom('');
      setFilterDateTo('');
    }
  }, [filterQuick]);

  // ── All useMemo hooks MUST be declared before any early returns ────────────
  const enrichedSessions = useMemo(() => {
    if (!student) return [];
    return [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(session => {
        const batch = studentBatches.find(b => b.id === session.classId);
        const record = attendanceRecords.find(r =>
          r.studentId === student.id &&
          new Date(r.date).toISOString().split('T')[0] === new Date(session.date).toISOString().split('T')[0]
        );
        return {
          ...session,
          batchName: batch?.name ?? 'Unknown Batch',
          coachName: batch?.coach ?? '—',
          attendanceStatus: record ? record.status.toLowerCase() : 'unmarked',
          sessionStatus: 'Completed',
        };
      });
  }, [sessions, attendanceRecords, studentBatches, student]);

  const uniqueBatches = useMemo(() => {
    const seen = new Set<string>();
    return enrichedSessions.reduce<{ id: string; name: string }[]>((acc, s) => {
      if (!seen.has(s.classId)) {
        seen.add(s.classId);
        acc.push({ id: s.classId, name: s.batchName });
      }
      return acc;
    }, []);
  }, [enrichedSessions]);

  const uniqueCoaches = useMemo(() => {
    const seen = new Set<string>();
    return enrichedSessions.reduce<string[]>((acc, s) => {
      if (!seen.has(s.coachName)) {
        seen.add(s.coachName);
        acc.push(s.coachName);
      }
      return acc;
    }, []);
  }, [enrichedSessions]);

  const filteredSessions = useMemo(() => {
    return enrichedSessions.filter(s => {
      if (filterBatch !== 'all' && s.classId !== filterBatch) return false;
      if (filterCoach !== 'all' && s.coachName !== filterCoach) return false;
      const d = new Date(s.date);
      if (filterDateFrom && d < new Date(filterDateFrom)) return false;
      if (filterDateTo && d > new Date(filterDateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [enrichedSessions, filterBatch, filterCoach, filterDateFrom, filterDateTo]);

  if (!studentsLoaded || !batchesLoaded) return <div className={styles.container}>Loading...</div>;

  if (!student) {
    return (
      <div className={styles.container}>
        <h2>Student not found</h2>
      </div>
    );
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const sessionsAttended = attendanceRecords.filter(
    r => r.studentId === student.id && r.status?.toLowerCase() === 'present'
  ).length;

  const memberSinceFormatted = student.memberSince
    ? new Date(student.memberSince).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const dobFormatted = student.dob
    ? new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  // ── Pagination (derived from memoized filteredSessions declared above) ─────
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / rowsPerPage));
  const pagedSessions = filteredSessions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleEditSave = (data: any) => {
    updateStudent(student.id, data);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => setShowDeleteConfirm(true);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className={styles.container}>
      {/* ── Profile card ────────────────────────────────────────────── */}
      <div className={styles.profileCard}>
        <div className={styles.profileMain}>
          {/* Avatar */}
          <div
            className={styles.avatar}
            style={{
              backgroundImage: student.profilePhoto ? `url(${student.profilePhoto})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!student.profilePhoto && <User size={52} strokeWidth={1.5} />}
          </div>

          {/* Identity */}
          <div className={styles.profileIdentity}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{student.name}</h1>
              <span className={styles.roleBadge}>STUDENT</span>
            </div>
            <div className={styles.contactList}>
              <span className={styles.contactItem}><Mail size={14} />{student.email}</span>
              <span className={styles.contactItem}><Phone size={14} />{student.countryCode} {student.mobile}</span>
              <span className={styles.contactItem}><MapPin size={14} />{student.city}, {student.country}</span>
              <span className={styles.contactItem}><Calendar size={14} />DOB: {dobFormatted}</span>
            </div>
            <div className={styles.programLine}>Enrolled in: {student.program || 'No Program'}</div>
          </div>

          {/* Action buttons — right side, stacked vertically */}
          <div className={styles.profileActions}>
            <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>
              <Edit size={15} /> Edit Student
            </button>
            <button className={styles.deleteBtn} onClick={handleDelete}>
              <Trash2 size={15} /> Delete Student
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <Calendar size={28} strokeWidth={1.4} className={styles.statIcon} />
            <span className={styles.statLabel}>Member Since</span>
            <span className={styles.statValue}>{memberSinceFormatted}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <Layers size={28} strokeWidth={1.4} className={styles.statIcon} />
            <span className={styles.statLabel}>Total Batches</span>
            <span className={styles.statValue}>{studentBatches.length}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <CheckSquare size={28} strokeWidth={1.4} className={styles.statIcon} />
            <span className={styles.statLabel}>Sessions Attended</span>
            <span className={styles.statValue}>{sessionsAttended}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <Shield size={28} strokeWidth={1.4} className={styles.statIcon} />
            <span className={styles.statLabel}>Status</span>
            <span className={`${styles.statValue} ${styles.statusBadge} ${student.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
              {student.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'batches' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          Enrolled Batches
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Session History
        </button>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <div className={styles.tabContent}>
        {activeTab === 'batches' && (
          <div className={styles.batchList}>
            {studentBatches.map(batch => (
              <div
                key={batch.id}
                className={styles.batchCard}
                onClick={() => router.push(`/dashboard/admin/batches/${generateBatchSlug(batch.id, batch.name, batches)}`)}
              >
                <div className={styles.batchHeader}>
                  <h4 className={styles.batchName}>{batch.name}</h4>
                  <span className={styles.batchBadge}>{batch.program?.split(' ')[0]}</span>
                </div>
                <div className={styles.batchDetails}>
                  <span>Coach: {batch.coach}</span>
                  <span>{batch.days?.join(', ')} • {batch.startTime} – {batch.endTime}</span>
                </div>
              </div>
            ))}
            {studentBatches.length === 0 && (
              <p className={styles.emptyText}>This student is not currently enrolled in any batches.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className={styles.historyWrapper}>
            {/* Filters */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Batch</label>
                <select
                  className={styles.filterSelect}
                  value={filterBatch}
                  onChange={e => { setFilterBatch(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All Batches</option>
                  {uniqueBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Coach</label>
                <select
                  className={styles.filterSelect}
                  value={filterCoach}
                  onChange={e => { setFilterCoach(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All Coaches</option>
                  {uniqueCoaches.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup} style={{ position: 'relative' }}>
                <label className={styles.filterLabel}>Quick Filter</label>
                <select
                  className={styles.filterSelect}
                  value={filterQuick}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setTempDateFrom(filterDateFrom);
                      setTempDateTo(filterDateTo);
                      setShowDatePicker(true);
                    } else {
                      setFilterQuick(val);
                      setCurrentPage(1);
                    }
                  }}
                >
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="last3Months">Last 3 Months</option>
                  <option value="all">All Time</option>
                  <option value="custom">Custom Range…</option>
                </select>

                {/* Custom date range badge */}
                {filterQuick === 'custom' && filterDateFrom && filterDateTo && (
                  <div className={styles.customRangeBadge}>
                    <Calendar size={12} />
                    <span>{filterDateFrom} — {filterDateTo}</span>
                    <button
                      className={styles.customRangeEdit}
                      onClick={() => {
                        setTempDateFrom(filterDateFrom);
                        setTempDateTo(filterDateTo);
                        setShowDatePicker(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}

                {/* Date picker popup */}
                {showDatePicker && (
                  <>
                    <div className={styles.datePickerBackdrop} onClick={() => setShowDatePicker(false)} />
                    <div className={styles.datePickerPopup}>
                      <div className={styles.datePickerTitle}>Select Date Range</div>
                      <div className={styles.datePickerRow}>
                        <div className={styles.datePickerGroup}>
                          <label className={styles.datePickerLabel}>From</label>
                          <input
                            type="date"
                            className={styles.datePickerInput}
                            value={tempDateFrom}
                            onChange={e => setTempDateFrom(e.target.value)}
                          />
                        </div>
                        <span className={styles.datePickerSep}>→</span>
                        <div className={styles.datePickerGroup}>
                          <label className={styles.datePickerLabel}>To</label>
                          <input
                            type="date"
                            className={styles.datePickerInput}
                            value={tempDateTo}
                            onChange={e => setTempDateTo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.datePickerActions}>
                        <button
                          className={styles.datePickerCancel}
                          onClick={() => setShowDatePicker(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.datePickerApply}
                          disabled={!tempDateFrom || !tempDateTo}
                          onClick={() => {
                            setFilterDateFrom(tempDateFrom);
                            setFilterDateTo(tempDateTo);
                            setFilterQuick('custom');
                            setCurrentPage(1);
                            setShowDatePicker(false);
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Table */}
            {sessionsLoading ? (
              <div className={styles.loadingRow}>Loading session history…</div>
            ) : (
              <>
                <div className={styles.tableWrapper}>
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>BATCH</th>
                        <th>COACH</th>
                        <th>TOPIC COVERED</th>
                        <th>STATUS</th>
                        <th>ATTENDANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedSessions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={styles.emptyRow}>No sessions found for the selected filters.</td>
                        </tr>
                      ) : (
                        pagedSessions.map(session => (
                          <tr key={session.id}>
                            <td>
                              <button
                                className={styles.dateCellLink}
                                onClick={() => router.push(`/dashboard/admin/batches/${session.classId}/sessions/${session.id}`)}
                              >
                                <Calendar size={14} className={styles.dateIcon} />
                                {formatDate(session.date)}
                              </button>
                            </td>
                            <td>{session.batchName}</td>
                            <td>{session.coachName}</td>
                            <td>{session.title || session.topic || '—'}</td>
                            <td>
                              <span className={styles.statusCompleted}>Completed</span>
                            </td>
                            <td>
                              <span className={
                                session.attendanceStatus === 'present' ? styles.attPresent :
                                session.attendanceStatus === 'absent' ? styles.attAbsent :
                                session.attendanceStatus === 'compensated' ? styles.attCompensated :
                                styles.attUnmarked
                              }>
                                {session.attendanceStatus === 'present' ? 'Present' :
                                 session.attendanceStatus === 'absent' ? 'Absent' :
                                 session.attendanceStatus === 'compensated' ? 'Compensated' : 'Unmarked'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className={styles.pagination}>
                  <div className={styles.paginationInfo}>
                    Showing {filteredSessions.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
                    {Math.min(currentPage * rowsPerPage, filteredSessions.length)} of {filteredSessions.length} sessions
                  </div>
                  <div className={styles.paginationControls}>
                    <button
                      className={styles.pageBtn}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className={styles.pageBtn}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className={styles.rowsPerPage}>
                    <span>Rows per page:</span>
                    <select
                      className={styles.rowsSelect}
                      value={rowsPerPage}
                      onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    >
                      {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <AddStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        initialData={student}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteStudent(student.id);
          router.push('/dashboard/admin/students');
        }}
        title="Delete Student"
        message={`Delete student ${student?.name || ''}? This will remove them from all batches. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
