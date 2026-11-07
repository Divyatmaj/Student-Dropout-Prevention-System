import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  BookOpen,
  AlertTriangle,
  ClipboardList,
  Mail,
  Phone,
  GraduationCap,
  PlusCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import '../components/common/common.css';

import { getStudentSummary } from '../services/studentService.js';

export default function StudentDetail() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentSummary(id);
      setProfileData(data);
    } catch (err) {
      setError(err.message || `Unable to locate student records for ${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return <LoadingState message={`Retrieving academic & attendance records for ${id}...`} />;
  }

  if (error || !profileData) {
    return (
      <ErrorState
        title="Student Record Not Found"
        message={error || `Could not find an active profile for ID ${id}`}
        onRetry={fetchProfile}
      />
    );
  }

  const { student, attendance, academics, interventions } = profileData;

  const initials = student.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      {/* Back Link */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/students"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--color-primary)',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Back to Students Directory
        </Link>
      </div>

      {/* Student Identity Header Card */}
      <div
        className="card"
        style={{
          padding: '28px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {student.name}
              </h2>
              <Badge type="risk" value={student.riskLevel} />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '6px',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                flexWrap: 'wrap',
              }}
            >
              <span><strong>ID:</strong> {student.id}</span>
              <span>•</span>
              <span><strong>Roll:</strong> {student.rollNo}</span>
              <span>•</span>
              <span><strong>Dept:</strong> {student.department} (Sem {student.semester})</span>
              <span>•</span>
              <span><strong>Batch:</strong> {student.enrollmentYear}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '6px',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} /> {student.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} /> {student.phone}
              </span>
              {student.mentorName && (
                <span><strong>Advisor:</strong> {student.mentorName}</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <Link to={`/interventions?studentId=${student.id}&name=${encodeURIComponent(student.name)}`}>
            <Button variant="primary" size="md" icon={PlusCircle}>
              Record Intervention
            </Button>
          </Link>
        </div>
      </div>

      {/* Rule-based Risk Rationale Banner */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          backgroundColor:
            student.riskLevel === 'high'
              ? 'var(--color-risk-high-subtle)'
              : student.riskLevel === 'medium'
              ? 'var(--color-risk-medium-subtle)'
              : 'var(--color-risk-low-subtle)',
          borderLeft: `4px solid ${
            student.riskLevel === 'high'
              ? 'var(--color-risk-high)'
              : student.riskLevel === 'medium'
              ? 'var(--color-risk-medium)'
              : 'var(--color-risk-low)'
          }`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}
      >
        <AlertTriangle
          size={20}
          color={
            student.riskLevel === 'high'
              ? 'var(--color-risk-high)'
              : student.riskLevel === 'medium'
              ? 'var(--color-risk-medium)'
              : 'var(--color-risk-low)'
          }
          style={{ flexShrink: 0, marginTop: '2px' }}
        />
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '13px',
              color:
                student.riskLevel === 'high'
                  ? 'var(--color-risk-high)'
                  : student.riskLevel === 'medium'
                  ? 'var(--color-risk-medium)'
                  : 'var(--color-risk-low)',
            }}
          >
            Explainable Risk Classification Analysis
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--color-text-primary)',
              marginTop: '4px',
              lineHeight: 1.5,
            }}
          >
            {student.riskReason}
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Attendance Analytics & Academic Performance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Attendance Breakdown Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CalendarCheck size={18} color="var(--color-primary)" />
              Attendance Record & History
            </h3>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color:
                  attendance.overallRate < 65
                    ? 'var(--color-risk-high)'
                    : attendance.overallRate < 75
                    ? 'var(--color-risk-medium)'
                    : 'var(--color-risk-low)',
              }}
            >
              {attendance.overallRate}% Overall
            </span>
          </div>

          <div className="card-body">
            {/* Session Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '12px 8px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Total</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{attendance.totalSessions}</div>
              </div>
              <div style={{ padding: '12px 8px', backgroundColor: 'var(--color-risk-low-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#14532d' }}>Attended</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-risk-low)', marginTop: '2px' }}>
                  {attendance.attendedSessions}
                </div>
              </div>
              <div style={{ padding: '12px 8px', backgroundColor: 'var(--color-risk-high-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#7f1d1d' }}>Missed</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-risk-high)', marginTop: '2px' }}>
                  {attendance.absentSessions}
                </div>
              </div>
              <div style={{ padding: '12px 8px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Excused</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{attendance.excusedSessions}</div>
              </div>
            </div>

            {/* Threshold Visual Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Progress vs Benchmarks</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>Min Required: 75%</span>
              </div>
              <div
                style={{
                  height: '10px',
                  backgroundColor: 'var(--color-bg-muted)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${attendance.overallRate}%`,
                    height: '100%',
                    backgroundColor:
                      attendance.overallRate < 65
                        ? 'var(--color-risk-high)'
                        : attendance.overallRate < 75
                        ? 'var(--color-risk-medium)'
                        : 'var(--color-risk-low)',
                  }}
                />
              </div>
            </div>

            {/* Recent Attendance Logs Table */}
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--color-text-primary)' }}>
              Recent Class Sessions Log
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject Course</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.recentLogs.map((log, index) => (
                    <tr key={index}>
                      <td style={{ fontSize: '12px' }}>{log.date}</td>
                      <td style={{ fontWeight: 500 }}>{log.subject}</td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{log.hours} hr(s)</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor:
                              log.status === 'Present'
                                ? 'var(--color-risk-low-subtle)'
                                : log.status === 'Absent'
                                ? 'var(--color-risk-high-subtle)'
                                : 'var(--color-bg-muted)',
                            color:
                              log.status === 'Present'
                                ? 'var(--color-risk-low)'
                                : log.status === 'Absent'
                                ? 'var(--color-risk-high)'
                                : 'var(--color-text-secondary)',
                          }}
                        >
                          {log.status === 'Present' ? (
                            <CheckCircle2 size={12} />
                          ) : log.status === 'Absent' ? (
                            <XCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Academic Performance Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BookOpen size={18} color="var(--color-primary)" />
              Academic Performance & Assessments
            </h3>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              GPA: {academics.gpa} / 10
            </span>
          </div>

          <div className="card-body">
            {/* Quick Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '12px 8px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Evaluated</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{academics.totalAssessments} Tests</div>
              </div>
              <div style={{ padding: '12px 8px', backgroundColor: 'var(--color-risk-low-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#14532d' }}>Passed</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-risk-low)', marginTop: '2px' }}>
                  {academics.passedAssessments}
                </div>
              </div>
              <div style={{ padding: '12px 8px', backgroundColor: 'var(--color-risk-high-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: '#7f1d1d' }}>Failed</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-risk-high)', marginTop: '2px' }}>
                  {academics.failedAssessments}
                </div>
              </div>
            </div>

            {/* Assessment Records Table */}
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--color-text-primary)' }}>
              Course Assessment Breakdown
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject & Assessment</th>
                    <th>Score / Max</th>
                    <th>Class Avg</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {academics.records.map((rec, index) => (
                    <tr key={index}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.subject}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{rec.assessment}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {rec.score} <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>/ {rec.maxScore}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {rec.classAverage}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor:
                              rec.status === 'Pass'
                                ? 'var(--color-risk-low-subtle)'
                                : 'var(--color-risk-high-subtle)',
                            color:
                              rec.status === 'Pass'
                                ? 'var(--color-risk-low)'
                                : 'var(--color-risk-high)',
                          }}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Logged Interventions History Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <ClipboardList size={18} color="var(--color-primary)" />
              Recorded Interventions & Counselor Notes
            </h3>
            <p className="card-subtitle">
              Prior support actions, advisory sessions, and resolution history for this student.
            </p>
          </div>
        </div>

        <div className="card-body">
          {interventions && interventions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {interventions.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-bg-muted)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{item.type}</span>
                      <Badge type="priority" value={item.priority} />
                      <Badge type="status" value={item.status} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {item.date} • Counselor: {item.counselor}
                    </span>
                  </div>
                  {item.notes && (
                    <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <strong>Counselor Remarks:</strong> {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              No previous intervention cases logged for this student.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
