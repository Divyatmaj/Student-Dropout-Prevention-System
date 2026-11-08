import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  BookOpen,
  AlertTriangle,
  ClipboardList,
  Phone,
  PlusCircle,
  Pencil,
  UserCog,
  HeartHandshake,
  Wallet,
  Info,
  CheckCircle2,
  X,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';

import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import StudentFormModal from '../components/students/StudentFormModal.jsx';
import StudentStatusModal from '../components/students/StudentStatusModal.jsx';
import RiskExplanation, { ReviewStatus } from '../components/risk/RiskExplanation.jsx';
import ReviewRiskModal from '../components/risk/ReviewRiskModal.jsx';
import { recalculateStudentRisk } from '../services/riskService.js';
import '../components/common/common.css';

import { getStudentSummary } from '../services/studentService.js';
import { useAuth } from '../hooks/useAuth.js';
import { PERMISSIONS } from '../utils/permissions.js';
import {
  getInitials,
  formatClass,
  formatDate,
  attendanceTone,
  formatPercent,
} from '../utils/formatters.js';
import { STUDENT_STATUS, STUDENT_STATUS_LABELS } from '../constants/students.js';

const RISK_TONES = {
  HIGH: { bg: 'var(--color-risk-high-subtle)', fg: 'var(--color-risk-high)' },
  MEDIUM: { bg: 'var(--color-risk-medium-subtle)', fg: 'var(--color-risk-medium)' },
  LOW: { bg: 'var(--color-risk-low-subtle)', fg: 'var(--color-risk-low)' },
  INSUFFICIENT_DATA: { bg: 'var(--color-bg-muted)', fg: 'var(--color-text-secondary)' },
};

function StatTile({ label, value, tone }) {
  return (
    <div
      style={{
        padding: '12px 8px',
        backgroundColor: tone?.bg || 'var(--color-bg-muted)',
        borderRadius: 'var(--radius-sm)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: tone?.fg }}>{value}</div>
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{children || '—'}</span>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfileData(await getStudentSummary(id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setProfileData(null); // don't show the previous student while a new one loads
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const backLink = (
    <div style={{ marginBottom: '16px' }}>
      <Link
        to="/students"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}
      >
        <ArrowLeft size={16} /> Back to Students
      </Link>
    </div>
  );

  if (loading && !profileData) {
    return <LoadingState message="Loading student profile..." />;
  }

  if (error) {
    return (
      <div>
        {backLink}
        {error.status === 404 ? (
          <EmptyState
            title="Student Not Found"
            message="This student doesn't exist or isn't part of your school."
          />
        ) : (
          <ErrorState
            title="Unable to Load Student"
            message={error.message || 'Something went wrong loading this profile.'}
            onRetry={fetchProfile}
          />
        )}
      </div>
    );
  }

  const { student, attendance, academics, risk, interventions } = profileData;
  const isActive = student.status === STUDENT_STATUS.ACTIVE;
  const riskTone = RISK_TONES[risk?.category] || RISK_TONES.INSUFFICIENT_DATA;

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const { assessment, previous } = await recalculateStudentRisk(student.id);
      setNotice(
        previous && previous.score === assessment.score && previous.category === assessment.category
          ? 'Risk recalculated — no change.'
          : `Risk recalculated: ${previous ? `${previous.score} → ` : ''}${assessment.score}.`
      );
      await fetchProfile();
    } catch (err) {
      setNotice(err.message || 'Recalculation failed.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaved = (message) => {
    setEditOpen(false);
    setStatusOpen(false);
    setReviewOpen(false);
    setNotice(message);
    fetchProfile();
  };

  return (
    <div>
      {backLink}

      {notice && (
        <div className="alert alert-success" role="status" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ flex: 1 }}>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss message"
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Identity header */}
      <div
        className="card"
        style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div
            aria-hidden="true"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getInitials(student.fullName)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {student.fullName}
              </h2>
              <Badge type="studentStatus" value={student.status} />
              {isActive && risk?.category && <Badge type="risk" value={risk.category} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px 16px', marginTop: '6px', fontSize: '13px', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
              <span><strong>Code:</strong> {student.studentCode}</span>
              <span><strong>Class:</strong> {formatClass(student.grade, student.section)}</span>
              <span><strong>Admitted:</strong> {formatDate(student.admissionDate)}</span>
              {student.assignedTeacherName && (
                <span><strong>Class teacher:</strong> {student.assignedTeacherName}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {can(PERMISSIONS.STUDENT_UPDATE) && (
            <Button variant="secondary" size="md" icon={Pencil} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}
          {can(PERMISSIONS.STUDENT_CHANGE_STATUS) && (
            <Button variant="secondary" size="md" icon={UserCog} onClick={() => setStatusOpen(true)}>
              {isActive ? 'Deactivate / Transfer' : 'Change Status'}
            </Button>
          )}
          {isActive && can(PERMISSIONS.INTERVENTION_CREATE) && (
            <Link
              to={`/interventions?studentId=${student.id}&name=${encodeURIComponent(student.fullName)}`}
              className="btn btn-primary btn-md"
            >
              <PlusCircle size={16} aria-hidden="true" />
              Record Intervention
            </Link>
          )}
        </div>
      </div>

      {!isActive && (
        <div className="alert alert-info" style={{ marginBottom: '24px' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            This student is marked <strong>{STUDENT_STATUS_LABELS[student.status]}</strong>. Their
            history is kept for reference, but they are left out of attendance, risk and dashboard
            figures.
          </span>
        </div>
      )}

      {/* Risk indicator */}
      {isActive && risk && (
        <div className="card" style={{ marginBottom: '24px', borderLeft: `4px solid ${riskTone.fg}` }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <AlertTriangle size={18} color={riskTone.fg} />
                Risk Indicator
              </h3>
              <div style={{ marginTop: '4px' }}>
                <ReviewStatus assessment={risk} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {can(PERMISSIONS.RISK_REVIEW) && risk.needsReview && (
                <Button variant="primary" size="sm" icon={ClipboardCheck} onClick={() => setReviewOpen(true)}>
                  Mark Reviewed
                </Button>
              )}
              {can(PERMISSIONS.RISK_RECALCULATE) && (
                <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRecalculate} disabled={recalculating}>
                  {recalculating ? 'Recalculating...' : 'Recalculate'}
                </Button>
              )}
            </div>
          </div>
          <div className="card-body">
            <RiskExplanation assessment={risk} />
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Guardian & support */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <HeartHandshake size={18} color="var(--color-primary)" />
              Guardian & Support
            </h3>
          </div>
          <div className="card-body">
            <DetailRow label="Guardian">{student.guardianName}</DetailRow>
            <DetailRow label="Relationship">{student.guardianRelationship}</DetailRow>
            <DetailRow label="Phone">
              {student.guardianPhone && (
                <a href={`tel:${student.guardianPhone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
                  <Phone size={12} aria-hidden="true" /> {student.guardianPhone}
                </a>
              )}
            </DetailRow>
            <DetailRow label="Date of birth">{student.dateOfBirth && formatDate(student.dateOfBirth)}</DetailRow>
            <DetailRow label="Financial barrier">
              {student.financialBarrierReported ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent)', fontWeight: 600 }}>
                  <Wallet size={13} aria-hidden="true" /> Reported
                </span>
              ) : (
                'Not reported'
              )}
            </DetailRow>

            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Support notes
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: student.supportNotes ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {student.supportNotes || 'No support notes recorded.'}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CalendarCheck size={18} color="var(--color-primary)" />
              Attendance
            </h3>
            <span style={{ fontSize: '14px', fontWeight: 700, color: attendanceTone(attendance.attendancePercentage) }}>
              {formatPercent(attendance.attendancePercentage)}
            </span>
          </div>

          <div className="card-body">
            {attendance.recordedDays === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px' }}>
                No attendance recorded yet.
              </p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  <StatTile label="Days" value={attendance.recordedDays} />
                  <StatTile label="Present" value={attendance.present} tone={{ bg: 'var(--color-risk-low-subtle)', fg: 'var(--color-risk-low)' }} />
                  <StatTile label="Absent" value={attendance.absent} tone={{ bg: 'var(--color-risk-high-subtle)', fg: 'var(--color-risk-high)' }} />
                  <StatTile label="Late" value={attendance.late} tone={{ bg: 'var(--color-risk-medium-subtle)', fg: 'var(--color-risk-medium)' }} />
                  <StatTile label="Excused" value={attendance.excused} />
                </div>

                {attendance.consecutiveAbsences >= 3 && (
                  <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>Absent for the last {attendance.consecutiveAbsences} recorded school days in a row.</span>
                  </div>
                )}

                {attendance.recordedDays < 10 && (
                  <p className="form-helper" style={{ marginBottom: '12px' }}>
                    Only {attendance.recordedDays} school day{attendance.recordedDays === 1 ? '' : 's'} recorded — the percentage is provisional.
                  </p>
                )}

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.recent.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '12px' }}>{formatDate(log.date)}</td>
                          <td><Badge type="attendance" value={log.status} /></td>
                          <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{log.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px' }}>
                  <Link
                    to={`/attendance?tab=records&search=${encodeURIComponent(student.studentCode)}`}
                    style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                  >
                    View all attendance records →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Academics */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <BookOpen size={18} color="var(--color-primary)" />
            Assessments & Marks
          </h3>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            Average: {formatPercent(academics.averagePercentage)}
          </span>
        </div>
        <div className="card-body">
          {academics.recent.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px' }}>
              No marks recorded yet.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {academics.recent.map((mark) => (
                    <tr key={mark.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{mark.subject}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{mark.title}</div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{formatDate(mark.assessmentDate)}</td>
                      <td style={{ fontWeight: 600 }}>
                        {mark.score} <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>/ {mark.maxMarks}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatPercent(mark.percentage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Interventions */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <ClipboardList size={18} color="var(--color-primary)" />
              Interventions
            </h3>
            <p className="card-subtitle">Support actions recorded for this student and their outcome.</p>
          </div>
        </div>

        <div className="card-body">
          {interventions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {interventions.map((item) => (
                <div
                  key={item.id}
                  style={{ padding: '16px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{item.type}</span>
                      <Badge type="priority" value={item.priority} />
                      <Badge type="status" value={item.status} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {formatDate(item.date)} • {item.counselor}
                    </span>
                  </div>
                  {item.notes && (
                    <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              No interventions recorded for this student.
            </div>
          )}
        </div>
      </div>

      <StudentFormModal
        isOpen={editOpen}
        student={student}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => handleSaved(`Saved changes to ${saved.fullName}.`)}
      />
      {reviewOpen && risk && (
        <ReviewRiskModal
          assessment={risk}
          studentName={student.fullName}
          onClose={() => setReviewOpen(false)}
          onReviewed={() => handleSaved('Marked the risk flag as reviewed.')}
        />
      )}
      <StudentStatusModal
        isOpen={statusOpen}
        student={student}
        onClose={() => setStatusOpen(false)}
        onSaved={(saved) =>
          handleSaved(`${saved.fullName} is now ${STUDENT_STATUS_LABELS[saved.status].toLowerCase()}.`)
        }
      />
    </div>
  );
}
