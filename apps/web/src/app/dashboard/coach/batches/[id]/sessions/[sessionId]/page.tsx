// Force rebuild  
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Video, Edit2, Download, MoreVertical, Activity, UserCircle, ExternalLink, Trash2, Link as LinkIcon, Copy, Plus, Check, PlayCircle, FileText, Youtube, CheckCircle, XCircle, RefreshCw, BookOpen } from 'lucide-react';
import { useSessions } from '@/lib/hooks/useSessions';
import { useBatches } from '@/lib/hooks/useBatches';
import { useStudents } from '@/lib/hooks/useStudents';
import { extractBatchId } from '@/lib/utils/urlUtils';
import { CreateSessionModal } from '../../CreateSessionModal';
import styles from '../../../../../shared-sessionDetail.module.css';

export default function CoachSessionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const { batches, isLoaded: batchesLoaded } = useBatches();
  const { students: allStudents, isLoaded: studentsLoaded } = useStudents();

  const rawBatchId = decodeURIComponent(params.id as string);
  // Only resolve the slug after batches have fully loaded, otherwise
  // extractBatchId falls back to the slug string (e.g. 'p10-batch') because
  // allBatches is still [] — causing useSessions to fetch with a wrong ID.
  const batchId = batchesLoaded ? extractBatchId(rawBatchId, batches) : null;
  const sessionId = params.sessionId as string;

  const { sessions, isLoaded: sessionsLoaded, refetch: refetchSessions } = useSessions(batchId);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);

  const [recordingUrl, setRecordingUrl] = useState('');
  const [isEditingRecording, setIsEditingRecording] = useState(false);

  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileType, setNewFileType] = useState('link');

  const [addingType, setAddingType] = useState<string | null>(null);
  const [addingUrl, setAddingUrl] = useState('');
  const [addingLabel, setAddingLabel] = useState('');

  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceDraft, setAttendanceDraft] = useState<any[]>([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (!sessionId) return;
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`/api/attendance/records/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setAttendanceRecords(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAttendance();
  }, [sessionId]);

  const batch = batches.find(b => b.id === batchId);
  const session = sessions.find(s => s.id === sessionId);

  const safeStudents = Array.isArray(batch?.students) ? batch.students : [];
  const enrolledStudents = allStudents.filter(s => safeStudents.includes(s.id));

  // Initialize draft whenever enrolled students or backend records change
  useEffect(() => {
    if (allStudents.length === 0 || !batch) return;
    
    const initialDraft = enrolledStudents.map((student: any) => {
      const record = attendanceRecords.find(r => r.studentId === student.id);
      return {
        id: student.id,
        name: student.name || 'Student',
        email: student.email || '',
        status: record?.status || 'absent',
        remarks: record?.comment || '',
        color: 'blue'
      };
    });
    
    // Only update draft if it hasn't been modified yet or if backend data refreshed
    setAttendanceDraft(initialDraft);
  }, [allStudents, batch, attendanceRecords]);

  if (!batchesLoaded || !studentsLoaded) {
    return <div className={styles.container}>Loading Session...</div>;
  }

  if (!sessionsLoaded) {
    return <div className={styles.container}>Loading Session...</div>;
  }

  if (!batch || !session) {
    return (
      <div className={styles.container}>
        <h2>Session not found</h2>
        <button className={styles.backLink} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  const handleMarkAllPresent = () => {
    setAttendanceDraft(prev => prev.map(s => ({ ...s, status: 'present' })));
  };

  const handleBulkAction = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const action = e.target.value;
    if (!action || selectedStudents.length === 0) return;
    
    const statusMap: Record<string, string> = {
      'mark_present': 'present',
      'mark_absent': 'absent',
      'mark_compensated': 'compensated'
    };
    
    if (statusMap[action]) {
      setAttendanceDraft(prev => prev.map(s => 
        selectedStudents.includes(s.id) ? { ...s, status: statusMap[action] } : s
      ));
    }
    
    // Reset dropdown visually
    e.target.value = '';
  };

  const handleAttendanceChange = (studentId: string, field: string, value: string) => {
    setAttendanceDraft(prev => prev.map(s => s.id === studentId ? { ...s, [field]: value } : s));
  };

  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    try {
      const recordsToSave = attendanceDraft.map(d => ({
        studentId: d.id,
        status: d.status,
        comment: d.remarks,
        isGuest: false
      }));
      const res = await fetch(`/api/attendance/records/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsToSave })
      });
      if (res.ok) {
        setAttendanceRecords(recordsToSave);
        displayToast('Attendance saved successfully');
      } else {
        displayToast('Failed to save attendance');
      }
    } catch (err) {
      console.error(err);
      displayToast('Failed to save attendance');
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const d = new Date(session.date);
  const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = d.getDate();
  const weekdayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
  const fullDateStr = `${monthStr} ${dayNum}, ${session.date.substring(0, 4)}`;

  const parsedAttachments: any[] = Array.isArray(session.attachments) ? session.attachments : [];
  const recordingAttachment = parsedAttachments.find(a => a.type === 'recording');
  const otherAttachments = parsedAttachments.filter(a => a.type !== 'recording');

  const driveRecording = parsedAttachments.find(a => a.type === 'drive_recording');
  const pgnFile = parsedAttachments.find(a => a.type === 'pgn');
  const lichessStudy = parsedAttachments.find(a => a.type === 'lichess_study');
  const otherFiles = parsedAttachments.find(a => a.type === 'other');
  const homeworkAssignment = parsedAttachments.find(a => a.type === 'homework');

  const coachName = batch?.coachName || batch?.coach || 'No Coach';
  const getInitials = (name: string) => {
    if (!name) return 'SP';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const coachInitials = getInitials(coachName);

  const saveAttachments = async (newAttachments: any[]) => {
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachments: newAttachments })
      });
      if (res.ok) {
        refetchSessions();
      } else {
        alert('Failed to save changes');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRecording = () => {
    const updated = parsedAttachments.filter(a => a.type !== 'recording');
    if (recordingUrl.trim()) {
      updated.push({ type: 'recording', url: recordingUrl, title: 'Session Recording' });
    }
    saveAttachments(updated);
    setIsEditingRecording(false);
  };

  const handleRemoveAttachment = (urlToRemove: string) => {
    const updated = parsedAttachments.filter(a => a.url !== urlToRemove);
    saveAttachments(updated);
  };

  const handleAddFile = () => {
    if (!newFileUrl || !newFileTitle) return;
    const updated = [...parsedAttachments, { type: newFileType, url: newFileUrl, title: newFileTitle }];
    saveAttachments(updated);
    setIsAddingFile(false);
    setNewFileUrl('');
    setNewFileTitle('');
  };

  const handleSaveAttachment = (type: string) => {
    if (!addingUrl.trim()) return;
    const defaultLabels: Record<string, string> = {
      drive_recording: 'Google Drive Recording',
      pgn: 'PGN File',
      lichess_study: 'Lichess Study',
      other: 'Other Files',
      homework: 'Homework / Assignment'
    };
    const newAttachment = {
      type,
      label: addingLabel.trim() || defaultLabels[type] || 'Attachment',
      url: addingUrl.trim(),
      addedAt: new Date().toISOString(),
      addedBy: 'Coach'
    };
    const updated = parsedAttachments.filter(a => a.type !== type);
    updated.push(newAttachment);
    saveAttachments(updated);
    setAddingType(null);
    setAddingUrl('');
    setAddingLabel('');
  };

  const handleRemoveAttachmentByType = (typeToRemove: string) => {
    const updated = parsedAttachments.filter(a => a.type !== typeToRemove);
    saveAttachments(updated);
  };

  const renderDescription = (description: string | null) => {
    if (!description) return <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>No description provided for this session.</p>;
    const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
    const isBulletList = lines.some(line => line.startsWith('*') || line.startsWith('-') || line.startsWith('•'));
    if (isBulletList) {
      return (
        <ul style={{ paddingLeft: '20px', margin: '8px 0', listStyleType: 'disc' }}>
          {lines.map((line, idx) => {
            const cleaned = line.replace(/^[\*\-\•]\s*/, '');
            return <li key={idx} style={{ marginBottom: '6px', fontSize: '0.85rem', color: '#334155' }}>{cleaned}</li>;
          })}
        </ul>
      );
    }
    return <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', margin: 0 }}>{description}</p>;
  };

  const renderReadOnlyRow = (
    label: string,
    url: string,
    icon: React.ReactNode,
    iconBg: string
  ) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            width: '32px', height: '32px', borderRadius: '8px', backgroundColor: iconBg 
          }}>
            {icon}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>
            {label}
          </span>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noreferrer" 
          style={{ display: 'flex', alignItems: 'center', color: '#64748b', cursor: 'pointer' }}
          title="Open Link"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    );
  };

  const getAttachmentMeta = (type: string) => {
    switch (type) {
      case 'pgn':
        return { icon: <FileText size={16} color="#2563eb" />, bg: '#dbeafe' };
      case 'lichess_study':
      case 'lichess':
        return { icon: <BookOpen size={16} color="#7c3aed" />, bg: '#f3e8ff' };
      case 'homework':
        return { icon: <Edit2 size={16} color="#ea580c" />, bg: '#ffedd5' };
      default:
        return { icon: <LinkIcon size={16} color="#4b5563" />, bg: '#f3f4f6' };
    }
  };

  return (
    <div className={styles.container}>
      {/* Main Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.sessionTitleBlock}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className={styles.calendarIconBlockOrange}>
              <span className={styles.calMonth}>{monthStr}</span>
              <span className={styles.calDay}>{dayNum}</span>
              <span className={styles.calWeekday}>{weekdayStr}</span>
            </div>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>{session.title}</h1>
                <span className={styles.badgeUpcoming}>Upcoming</span>
              </div>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button
              className={styles.btnPrimarySolid}
              onClick={() => window.open(session.meetingLink || '', '_blank')}
            >
              Join Session <Video size={16} />
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => setIsEditSessionOpen(true)}
            >
              <Edit2 size={16} /> Edit Session
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`${styles.tab} ${activeTab === 'attendance' ? styles.tabActive : ''}`} onClick={() => setActiveTab('attendance')}>
            Attendance ({attendanceDraft.length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'recording' ? styles.tabActive : ''}`} onClick={() => setActiveTab('recording')}>
            Recording & Files
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className={styles.attendanceContent}>
          <div className={styles.overviewThreeColGrid}>
            {/* Column 1 - Session Overview */}
            <div className={styles.overviewCol}>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> Session Overview
              </h2>
              <div className={styles.detailsList}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date</span>
                  <span className={styles.detailValue}>{fullDateStr}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Time</span>
                  <span className={styles.detailValue}>{session.startTime} - {session.endTime} ({session.duration} mins)</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Batch / Program</span>
                  <span className={styles.detailValue}>{batch.name} · {batch.program || 'Regular Program'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Session Type</span>
                  <span className={styles.detailValue}>{batch.type || 'Regular Class'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Platform</span>
                  <span className={styles.detailValue}>{session.platform}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Meeting Link</span>
                  <span className={styles.detailValue}>
                    {session.meetingLink ? (
                      <a href={session.meetingLink} target="_blank" rel="noreferrer" className={styles.linkText} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {session.meetingLink.substring(0, 30)}{session.meetingLink.length > 30 ? '...' : ''} <ExternalLink size={12} />
                      </a>
                    ) : (
                      'Not added'
                    )}
                  </span>
                </div>
                <div className={styles.detailRow} style={{ alignItems: 'center' }}>
                  <span className={styles.detailLabel}>Coach</span>
                  <span className={styles.detailValue} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#7c2d12',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {coachInitials}
                    </div>
                    <span>{coachName}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2 - Topic / Description */}
            <div className={styles.overviewCol}>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} /> Topic / Description
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                  {session.title}
                </h3>
                {renderDescription(session.description)}
                
                {session.notes && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0 8px 0' }} />
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#7c2d12', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                      Notes
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {session.notes}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Column 3 - Session Recording & Files */}
            <div className={styles.overviewCol}>
              <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlayCircle size={18} /> Session Recording & Files
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {parsedAttachments.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: '12px 0' }}>
                    No materials yet — add them in the Recording & Files tab.
                  </p>
                ) : (
                  <>
                    {/* Always render drive_recording if any attachments exist */}
                    {driveRecording ? (
                      renderReadOnlyRow(driveRecording.label || 'Google Drive Recording', driveRecording.url, <Video size={16} color="#16a34a" />, '#dcfce7')
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f8fafc' 
                          }}>
                            <Video size={16} color="#94a3b8" />
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#94a3b8' }}>
                            Google Drive Recording
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Not added yet</span>
                      </div>
                    )}
                    
                    {/* Render other attachments dynamically */}
                    {parsedAttachments.filter(a => a.type !== 'drive_recording' && a.type !== 'recording').map((att, idx) => {
                      const meta = getAttachmentMeta(att.type);
                      let label = att.label;
                      if (!label) {
                        if (att.type === 'pgn') label = 'PGN File';
                        else if (att.type === 'lichess_study') label = 'Lichess Study';
                        else if (att.type === 'homework') label = 'Homework / Assignment';
                        else label = 'Other File';
                      }
                      return (
                        <React.Fragment key={idx}>
                          {renderReadOnlyRow(label, att.url, meta.icon, meta.bg)}
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </div>

              <div style={{ 
                marginTop: 'auto', 
                backgroundColor: '#fff7ed', 
                border: '1px solid #ffedd5', 
                borderRadius: '8px', 
                padding: '12px',
                display: 'flex',
                gap: '10px'
              }}>
                <FolderIcon size={20} color="#ea580c" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#9a3412' }}>Add files, recordings and assignments</span>
                  <span style={{ fontSize: '0.75rem', color: '#ea580c', lineHeight: '1.4' }}>
                    Materials added here will be available in the Recording & Files tab for students.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.attendanceHeaderRow}>
            <h2 className={styles.sectionTitle}>
              <UsersIcon size={18} color="#3b82f6" /> Attendance Summary
            </h2>
          </div>

          <div className={styles.panelCard}>
            <div className={styles.summaryGrid3}>
              <div className={styles.summaryCard}>
                <span className={`${styles.summaryValue} ${styles.green}`}>{attendanceDraft.filter(s => s.status === 'present').length}</span>
                <span className={styles.summaryLabel}>Present</span>
                <span className={styles.summarySubtext}>{attendanceDraft.filter(s => s.status === 'present').length} of {attendanceDraft.length} students</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={`${styles.summaryValue} ${styles.red}`}>{attendanceDraft.filter(s => s.status === 'absent').length}</span>
                <span className={styles.summaryLabel}>Absent</span>
                <span className={styles.summarySubtext}>{attendanceDraft.filter(s => s.status === 'absent').length} of {attendanceDraft.length} students</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={`${styles.summaryValue} ${styles.orange}`}>{attendanceDraft.filter(s => s.status === 'compensated').length}</span>
                <span className={styles.summaryLabel}>Compensated</span>
                <span className={styles.summarySubtext}>makeup attendee</span>
              </div>
            </div>
          </div>

          <button className={styles.btnCancel}>Cancel Session <Trash2 size={16} /></button>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className={styles.attendanceContent}>
          <div className={styles.panelCard}>
            <div className={styles.attendanceHeaderRow}>
              <h2 className={styles.sectionTitle}>
                <UsersIcon size={18} color="#10b981" /> Students Attendance ({attendanceDraft.length})
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className={styles.btnSecondary} 
                  style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center' }}
                  onClick={handleMarkAllPresent}
                >
                  <CheckCircle size={14} style={{ marginRight: '4px' }} /> Mark All Present
                </button>
                <div className={styles.selectWrapper} style={{ position: 'relative' }}>
                  <select 
                    className={styles.selectField} 
                    style={{ padding: '6px 24px 6px 12px', fontSize: '0.8rem', height: 'auto', minHeight: '30px', margin: 0 }}
                    onChange={handleBulkAction}
                    defaultValue=""
                  >
                    <option value="" disabled>Bulk Actions</option>
                    <option value="mark_present">Mark Selected Present</option>
                    <option value="mark_absent">Mark Selected Absent</option>
                    <option value="mark_compensated">Mark Selected Compensated</option>
                  </select>
                </div>
                <button className={styles.btnSecondary} style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
                  <Download size={14} style={{ marginRight: '4px' }} /> Export
                </button>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.length === attendanceDraft.length && attendanceDraft.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedStudents(attendanceDraft.map(s => s.id));
                        else setSelectedStudents([]);
                      }}
                    />
                  </th>
                  <th>STUDENT</th>
                  <th>STATUS</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {attendanceDraft.map((student: any) => (
                  <tr key={student.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStudents(prev => [...prev, student.id]);
                          else setSelectedStudents(prev => prev.filter(id => id !== student.id));
                        }}
                      />
                    </td>
                    <td>
                      <div className={styles.studentCell}>
                        <div className={`${styles.studentAvatar} ${styles[student.color] || ''}`}>
                          {student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={styles.studentName}>{student.name}</p>
                          <p className={styles.studentEmail}>{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleAttendanceChange(student.id, 'status', 'present')}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '16px', border: '1px solid',
                            backgroundColor: student.status === 'present' ? '#dcfce7' : 'transparent',
                            borderColor: student.status === 'present' ? '#22c55e' : '#cbd5e1',
                            color: student.status === 'present' ? '#166534' : '#64748b',
                            fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer'
                          }}
                        >
                          <CheckCircle size={14} /> Present
                        </button>
                        <button 
                          onClick={() => handleAttendanceChange(student.id, 'status', 'absent')}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '16px', border: '1px solid',
                            backgroundColor: student.status === 'absent' ? '#fee2e2' : 'transparent',
                            borderColor: student.status === 'absent' ? '#ef4444' : '#cbd5e1',
                            color: student.status === 'absent' ? '#991b1b' : '#64748b',
                            fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer'
                          }}
                        >
                          <XCircle size={14} /> Absent
                        </button>
                        <button 
                          onClick={() => handleAttendanceChange(student.id, 'status', 'compensated')}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '16px', border: '1px solid',
                            backgroundColor: student.status === 'compensated' ? '#fef3c7' : 'transparent',
                            borderColor: student.status === 'compensated' ? '#f59e0b' : '#cbd5e1',
                            color: student.status === 'compensated' ? '#92400e' : '#64748b',
                            fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer'
                          }}
                        >
                          <RefreshCw size={14} /> Compensated
                        </button>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className={styles.inputField} 
                        value={student.remarks} 
                        onChange={(e) => handleAttendanceChange(student.id, 'remarks', e.target.value)}
                        placeholder="—"
                        style={{ padding: '4px 8px', fontSize: '0.85rem', maxWidth: '200px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0 0', marginTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                {selectedStudents.length} of {attendanceDraft.length} marked
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className={styles.btnSecondary} 
                  onClick={() => {
                    const resetDraft = enrolledStudents.map((student: any) => {
                      const record = attendanceRecords.find(r => r.studentId === student.id);
                      return {
                        id: student.id,
                        name: student.name || 'Student',
                        email: student.email || '',
                        status: record?.status || 'absent',
                        remarks: record?.comment || '',
                        color: 'blue'
                      };
                    });
                    setAttendanceDraft(resetDraft);
                    setSelectedStudents([]);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className={styles.btnPrimarySolid} 
                  onClick={handleSaveAttendance} 
                  disabled={isSavingAttendance}
                >
                  {isSavingAttendance ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
          </div>


        </div>
      )}

      {activeTab === 'recording' && (
        <div className={styles.recordingGrid}>
          <div className={styles.recordingLeftCol}>
            <div className={styles.panelCard}>
              <h2 className={styles.sectionTitle}><PlayCircle size={18} color="#3b82f6" /> Session Recording</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Recording Link (Google Drive, Zoom, etc)</p>

              {!isEditingRecording && recordingAttachment ? (
                <div className={styles.driveLinkCard}>
                  <div className={styles.driveLinkText}>
                    <ExternalLink size={16} color="#10b981" />
                    {recordingAttachment.url.substring(0, 40)}{recordingAttachment.url.length > 40 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={styles.btnSecondary} onClick={() => navigator.clipboard.writeText(recordingAttachment.url)} style={{ fontSize: '0.8rem', padding: '6px 12px' }}><Copy size={14} /> Copy</button>
                    <button className={styles.btnSecondary} onClick={() => window.open(recordingAttachment.url, '_blank')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}><ExternalLink size={14} /> Open</button>
                    <button className={styles.btnDanger} onClick={() => handleRemoveAttachment(recordingAttachment.url)} style={{ padding: '6px 8px' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ) : isEditingRecording ? (
                <div className={styles.inputGroup}>
                  <input
                    type="url"
                    placeholder="https://..."
                    className={styles.inputField}
                    value={recordingUrl}
                    onChange={e => setRecordingUrl(e.target.value)}
                  />
                  <div className={styles.actionRow}>
                    <button className={styles.btnSecondary} onClick={() => setIsEditingRecording(false)}>Cancel</button>
                    <button className={styles.btnPrimarySolid} onClick={handleSaveRecording}>Save</button>
                  </div>
                </div>
              ) : (
                <button className={styles.btnSecondary} style={{ marginTop: '12px' }} onClick={() => { setIsEditingRecording(true); setRecordingUrl(''); }}>
                  <Plus size={16} /> Add Recording Link
                </button>
              )}
            </div>

            <div className={styles.panelCard}>
              <h2 className={styles.sectionTitle}><FileText size={18} color="#3b82f6" /> Other Files & Materials ({otherAttachments.length})</h2>

              {otherAttachments.map((att, idx) => (
                <div key={idx} className={styles.attachmentItem}>
                  <div className={styles.attachmentInfo}>
                    {att.type === 'youtube' ? <Youtube size={16} color="#ef4444" /> : <LinkIcon size={16} color="#3b82f6" />}
                    <a href={att.url} target="_blank" rel="noreferrer" className={styles.linkText}>{att.title}</a>
                  </div>
                  <button className={styles.btnDanger} onClick={() => handleRemoveAttachment(att.url)} style={{ padding: '6px 8px' }}><Trash2 size={14} /></button>
                </div>
              ))}

              {!isAddingFile ? (
                <div className={styles.fileUploadArea} onClick={() => setIsAddingFile(true)}>
                  <div style={{ display: 'flex', gap: '8px', color: '#3b82f6', fontWeight: '600', alignItems: 'center' }}>
                    <Plus size={16} /> Add File or Material
                  </div>
                  <span className={styles.fileUploadText}>Add links to Lichess studies, YouTube, or PDFs for this session.</span>
                </div>
              ) : (
                <div className={styles.inputGroup} style={{ marginTop: '16px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Material Title</label>
                  <input className={styles.inputField} value={newFileTitle} onChange={e => setNewFileTitle(e.target.value)} placeholder="e.g. Opening Principles Study" />

                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '8px' }}>URL</label>
                  <input type="url" className={styles.inputField} value={newFileUrl} onChange={e => setNewFileUrl(e.target.value)} placeholder="https://..." />

                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '8px' }}>Type</label>
                  <select className={styles.selectField} value={newFileType} onChange={e => setNewFileType(e.target.value)}>
                    <option value="link">Website Link</option>
                    <option value="lichess">Lichess Study</option>
                    <option value="youtube">YouTube Video</option>
                    <option value="pdf">PDF / Document</option>
                  </select>

                  <div className={styles.actionRow}>
                    <button className={styles.btnSecondary} onClick={() => setIsAddingFile(false)}>Cancel</button>
                    <button className={styles.btnPrimarySolid} onClick={handleAddFile}>Add Material</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.timelineSidebar}>
            <h2 className={styles.sectionTitle}>Session Timeline</h2>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineIcon} ${styles.completed}`}><Check size={16} /></div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTitle}>Scheduled</span>
                  <span className={styles.timelineDate}>May 28, 11:30 AM</span>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineIcon} ${styles.completed}`}><Check size={16} /></div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTitle}>Reminder Sent</span>
                  <span className={styles.timelineDate}>Jun 14, 9:00 PM</span>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineIcon} ${styles.completed}`}><Check size={16} /></div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTitle}>Session Started</span>
                  <span className={styles.timelineDate}>Jun 15, 4:00 PM</span>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={`${styles.timelineIcon} ${styles.success}`}><Check size={16} /></div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTitle}>Session Ended</span>
                  <span className={styles.timelineDate}>Jun 15, 5:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditSessionOpen && (
        <CreateSessionModal
          batchId={batchId || ''}
          session={session}
          onClose={() => setIsEditSessionOpen(false)}
          onSave={() => {
            refetchSessions();
            setIsEditSessionOpen(false);
          }}
        />
      )}

      {showToast && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// Icons
const CalendarIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClockIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const VideoIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const UsersIcon = ({ size, color }: { size: number, color: string }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const FolderIcon = ({ size, color }: { size: number, color?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
