'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Video, Edit2, Download, MoreVertical, Activity, UserCircle, ExternalLink, Trash2, Link as LinkIcon, Copy, Plus, Check, PlayCircle, FileText, Youtube } from 'lucide-react';
import { useSessions } from '@/lib/hooks/useSessions';
import { useBatches } from '@/lib/hooks/useBatches';
import { useStudents } from '@/lib/hooks/useStudents';
import { extractBatchId } from '@/lib/utils/urlUtils';
import styles from '../../../../../shared-sessionDetail.module.css';

export default function AdminSessionDetailPage() {
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
  const [activeTab, setActiveTab] = useState('attendance');
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);

  const [recordingUrl, setRecordingUrl] = useState('');
  const [isEditingRecording, setIsEditingRecording] = useState(false);

  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileTitle, setNewFileTitle] = useState('');
  const [newFileType, setNewFileType] = useState('link');

  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

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

  if (!batchesLoaded || !studentsLoaded) {
    return <div className={styles.container}>Loading Session...</div>;
  }

  if (!sessionsLoaded) {
    return <div className={styles.container}>Loading Session...</div>;
  }

  const batch = batches.find(b => b.id === batchId);
  const session = sessions.find(s => s.id === sessionId);

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

  const safeStudents = Array.isArray(batch.students) ? batch.students : [];
  const enrolledStudents = allStudents.filter(s => safeStudents.includes(s.id));

  // Dynamic mapped attendance based on database records
  const displayAttendance = enrolledStudents.map((student: any, idx: number) => {
    const record = attendanceRecords.find(r => r.studentId === student.id);
    const colors = ['blue', 'pink', 'orange', 'teal'];
    return {
      id: student.id,
      name: student.name || 'Student',
      email: student.email || '',
      status: record?.status || 'absent',
      remarks: record?.comment || '—',
      color: colors[idx % colors.length]
    };
  });

  const presentCount = displayAttendance.filter(s => s.status === 'present').length;
  const absentCount = displayAttendance.filter(s => s.status === 'absent').length;
  const compensatedCount = displayAttendance.filter(s => s.status === 'compensated').length;
  const totalCount = displayAttendance.length;

  const d = new Date(session.date);
  const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = d.getDate();
  const weekdayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
  const fullDateStr = `${monthStr} ${dayNum}, ${session.date.substring(0, 4)}`;

  const parsedAttachments: any[] = Array.isArray(session.attachments) ? session.attachments : [];
  const recordingAttachment = parsedAttachments.find(a => a.type === 'recording');
  const otherAttachments = parsedAttachments.filter(a => a.type !== 'recording');

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
              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <CalendarIcon size={14} /> {fullDateStr}
                </div>
                <div className={styles.metaItem}>
                  <ClockIcon size={14} /> {session.startTime} - {session.endTime} ({session.duration} mins)
                </div>
                <div className={styles.metaItem}>
                  <VideoIcon size={14} /> {session.platform}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`${styles.tab} ${activeTab === 'topics' ? styles.tabActive : ''}`} onClick={() => setActiveTab('topics')}>
            Topics Covered
          </button>
          <button className={`${styles.tab} ${activeTab === 'attendance' ? styles.tabActive : ''}`} onClick={() => setActiveTab('attendance')}>
            Attendance ({displayAttendance.length})
          </button>
          <button className={`${styles.tab} ${activeTab === 'recording' ? styles.tabActive : ''}`} onClick={() => setActiveTab('recording')}>
            Recording & Files
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className={styles.attendanceContent}>
          <div className={styles.overviewMetricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}><Activity size={14} /> Status</span>
              <span className={styles.badgeUpcoming}>Upcoming</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}><ClockIcon size={14} /> Duration</span>
              <span className={styles.metricValue}>{session.duration} mins</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}><VideoIcon size={14} /> Platform</span>
              <span className={styles.metricValue}>{session.platform}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}><UsersIcon size={14} color="#64748b" /> Students</span>
              <span className={styles.metricValue}>{enrolledStudents.length}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}><UserCircle size={14} /> Created By</span>
              <span className={styles.metricValue}>Admin</span>
            </div>
          </div>

          <div className={styles.overviewThreeColGrid}>
            <div className={styles.overviewCol}>
              <h2 className={styles.sectionTitle}><Activity size={16} /> Session Details</h2>
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
                  <span className={styles.detailLabel}>Platform</span>
                  <span className={styles.detailValue}>{session.platform}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Meeting Link</span>
                  <span className={styles.detailValue}>
                    <a href={session.meetingLink || '#'} target="_blank" className={styles.linkText}>{session.meetingLink || 'Not added'} <ExternalLink size={12} /></a>
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Batch / Program</span>
                  <span className={styles.detailValue}>{batch.name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Session Type</span>
                  <span className={styles.detailValue}>Regular Class</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Created By</span>
                  <span className={styles.detailValue}>Admin</span>
                </div>
              </div>
            </div>

            <div className={styles.overviewCol}>
              <h2 className={styles.sectionTitle}><FileText size={16} /> Topic / Description</h2>
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                {session.description || 'No description provided for this session.'}
              </p>
            </div>

            <div className={styles.overviewCol}>
              <h2 className={styles.sectionTitle}><PlayCircle size={16} /> Session Recording</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Recording Link (Google Drive)</p>

              {recordingAttachment ? (
                <button className={styles.btnSecondary} style={{ marginTop: 'auto', alignSelf: 'flex-start' }} onClick={() => window.open(recordingAttachment.url, '_blank')}>
                  <ExternalLink size={16} color="#3b82f6" /> Open Recording
                </button>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginTop: 'auto' }}>No recording added</p>
              )}
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
                <span className={`${styles.summaryValue} ${styles.green}`}>{presentCount}</span>
                <span className={styles.summaryLabel}>Present</span>
                <span className={styles.summarySubtext}>{presentCount} of {totalCount} students</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={`${styles.summaryValue} ${styles.red}`}>{absentCount}</span>
                <span className={styles.summaryLabel}>Absent</span>
                <span className={styles.summarySubtext}>{absentCount} of {totalCount} students</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={`${styles.summaryValue} ${styles.orange}`}>{compensatedCount}</span>
                <span className={styles.summaryLabel}>Compensated</span>
                <span className={styles.summarySubtext}>makeup attendee</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className={styles.attendanceContent}>



          <div className={styles.panelCard}>
            <div className={styles.attendanceHeaderRow}>
              <h2 className={styles.sectionTitle}>
                <UsersIcon size={18} color="#10b981" /> Students Attendance ({displayAttendance.length})
              </h2>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>STATUS</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {displayAttendance.map(student => (
                  <tr key={student.id}>
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
                      <span className={`${styles.statusPill} ${styles[student.status]}`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td><span className={styles.valText}>{student.remarks}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}

// Icons
const CalendarIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClockIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const VideoIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const UsersIcon = ({ size, color }: { size: number, color: string }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
