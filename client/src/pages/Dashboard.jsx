import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  Clock,
  CalendarCheck,
  ClipboardList,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';

import StatCard from '../components/common/StatCard.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import '../components/common/common.css';

import { getDashboardOverview } from '../services/dashboardService.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State testing control: 'normal' | 'error' | 'empty'
  const [testMode, setTestMode] = useState('normal');

  const loadDashboardData = async (mode = testMode) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboardOverview({
        simulateError: mode === 'error',
        simulateEmpty: mode === 'empty',
      });
      setData(response);
    } catch (err) {
      setError(err.message || 'Failed to retrieve dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(testMode);
  }, [testMode]);

  return (
    <div>
      {/* Page Header & Top Toolbar */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Dashboard</h2>
          <p className="page-description">
            Real-time retention monitoring, rule-based risk triggers, and proactive intervention tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* State Testing Selector (to demonstrate Loading, Empty, and Error states) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '2px 4px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: 'var(--color-text-secondary)', padding: '0 6px', fontWeight: 500 }}>
              State:
            </span>
            <button
              onClick={() => setTestMode('normal')}
              style={{
                border: 'none',
                background: testMode === 'normal' ? 'var(--color-primary-subtle)' : 'none',
                color: testMode === 'normal' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontWeight: testMode === 'normal' ? 600 : 400,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Normal
            </button>
            <button
              onClick={() => setTestMode('empty')}
              style={{
                border: 'none',
                background: testMode === 'empty' ? 'var(--color-primary-subtle)' : 'none',
                color: testMode === 'empty' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontWeight: testMode === 'empty' ? 600 : 400,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Empty
            </button>
            <button
              onClick={() => setTestMode('error')}
              style={{
                border: 'none',
                background: testMode === 'error' ? 'var(--color-risk-high-subtle)' : 'none',
                color: testMode === 'error' ? 'var(--color-risk-high)' : 'var(--color-text-secondary)',
                fontWeight: testMode === 'error' ? 600 : 400,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              Error
            </button>
          </div>

          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={() => loadDashboardData(testMode)}
            title="Refresh dashboard data"
          >
            Refresh
          </Button>

          <Link to="/interventions">
            <Button variant="primary" size="md" icon={PlusCircle}>
              Record Intervention
            </Button>
          </Link>
        </div>
      </div>

      {/* Conditional Rendering: Loading State */}
      {loading && <LoadingState message="Fetching institutional stats and student risk cohorts..." />}

      {/* Conditional Rendering: Error State */}
      {!loading && error && (
        <ErrorState
          title="Could Not Connect to Database"
          message={error}
          onRetry={() => loadDashboardData('normal')}
        />
      )}

      {/* Conditional Rendering: Empty State */}
      {!loading && !error && data && data.stats.totalStudents === 0 && (
        <EmptyState
          title="No Institutional Data Available"
          message="No active students, attendance sessions, or intervention records were found for this term."
          actionLabel="Load Demo Data"
          onAction={() => setTestMode('normal')}
        />
      )}

      {/* Conditional Rendering: Normal Dashboard View */}
      {!loading && !error && data && data.stats.totalStudents > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* 1. Statistic Cards Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
            }}
          >
            <StatCard
              title="Total Students"
              value={data.stats.totalStudents.toLocaleString()}
              icon={Users}
              iconColor="var(--color-primary)"
              iconBg="var(--color-primary-subtle)"
              badgeText="Active Cohort"
              badgeType="default"
              subtitle="AY 2025-26"
            />
            <StatCard
              title="High-Risk Students"
              value={data.stats.highRiskStudents}
              icon={AlertTriangle}
              iconColor="var(--color-risk-high)"
              iconBg="var(--color-risk-high-subtle)"
              badgeText="Immediate Action"
              badgeType="high"
              subtitle="Attendance < 65% / Failures"
            />
            <StatCard
              title="Medium-Risk Students"
              value={data.stats.mediumRiskStudents}
              icon={Clock}
              iconColor="var(--color-risk-medium)"
              iconBg="var(--color-risk-medium-subtle)"
              badgeText="Monitoring"
              badgeType="medium"
              subtitle="Attendance 65% - 75%"
            />
            <StatCard
              title="Average Attendance"
              value={`${data.stats.averageAttendance}%`}
              icon={CalendarCheck}
              iconColor="var(--color-risk-low)"
              iconBg="var(--color-risk-low-subtle)"
              badgeText="Institutional"
              badgeType="low"
              subtitle="Target: > 75.0%"
            />
            <StatCard
              title="Pending Interventions"
              value={data.stats.pendingInterventions}
              icon={ClipboardList}
              iconColor="var(--color-accent)"
              iconBg="var(--color-accent-subtle)"
              badgeText="Open Cases"
              badgeType="medium"
              subtitle="Awaiting counselor resolution"
            />
          </div>

          {/* 2. Risk Distribution Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <ShieldCheck size={18} color="var(--color-primary)" />
                  Cohort Risk Distribution
                </h3>
                <p className="card-subtitle">
                  Explainable rule-based categorization based on attendance percentages and assessment performance.
                </p>
              </div>
              <Link to="/risk">
                <Button variant="secondary" size="sm" icon={ExternalLink}>
                  View Risk Details
                </Button>
              </Link>
            </div>

            <div className="card-body">
              {/* Segmented Distribution Bar */}
              <div
                style={{
                  height: '14px',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  display: 'flex',
                  backgroundColor: 'var(--color-bg-muted)',
                  marginBottom: '20px',
                }}
              >
                <div
                  title={`Low Risk: ${data.riskDistribution.low.count} students (${data.riskDistribution.low.percentage}%)`}
                  style={{
                    width: `${data.riskDistribution.low.percentage}%`,
                    backgroundColor: 'var(--color-risk-low)',
                    transition: 'width 0.4s ease',
                  }}
                />
                <div
                  title={`Medium Risk: ${data.riskDistribution.medium.count} students (${data.riskDistribution.medium.percentage}%)`}
                  style={{
                    width: `${data.riskDistribution.medium.percentage}%`,
                    backgroundColor: 'var(--color-risk-medium)',
                    transition: 'width 0.4s ease',
                  }}
                />
                <div
                  title={`High Risk: ${data.riskDistribution.high.count} students (${data.riskDistribution.high.percentage}%)`}
                  style={{
                    width: `${data.riskDistribution.high.percentage}%`,
                    backgroundColor: 'var(--color-risk-high)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* Breakdown Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-risk-low-subtle)',
                    borderLeft: '4px solid var(--color-risk-low)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-risk-low)' }}>
                      Low Risk (On Track)
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                      {data.riskDistribution.low.count} ({data.riskDistribution.low.percentage}%)
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#166534', marginTop: '6px' }}>
                    Attendance &gt; 75% and consistent exam performance. No immediate intervention needed.
                  </p>
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-risk-medium-subtle)',
                    borderLeft: '4px solid var(--color-risk-medium)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-risk-medium)' }}>
                      Medium Risk (Warning)
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                      {data.riskDistribution.medium.count} ({data.riskDistribution.medium.percentage}%)
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#9a3412', marginTop: '6px' }}>
                    Attendance 65% – 75% or 1-2 failing assessments. Requires faculty check-in.
                  </p>
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-risk-high-subtle)',
                    borderLeft: '4px solid var(--color-risk-high)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-risk-high)' }}>
                      High Risk (Critical)
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)' }}>
                      {data.riskDistribution.high.count} ({data.riskDistribution.high.percentage}%)
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#991b1b', marginTop: '6px' }}>
                    Attendance &lt; 65% or 3+ failed assessments. Urgent counselor outreach required.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Two Columns: Students Requiring Attention & Recent Interventions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Students Requiring Immediate Attention */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <AlertTriangle size={18} color="var(--color-risk-high)" />
                    Students Requiring Attention
                  </h3>
                  <p className="card-subtitle">
                    Flagged based on chronic absence or academic difficulty
                  </p>
                </div>
                <Link to="/students">
                  <Button variant="secondary" size="sm">
                    View All Students
                  </Button>
                </Link>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Attendance</th>
                      <th>Risk Level</th>
                      <th>Trigger Reason</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.urgentStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{student.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {student.id} • {student.department} (Sem {student.semester})
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '12px',
                                color:
                                  student.attendanceRate < 65
                                    ? 'var(--color-risk-high)'
                                    : 'var(--color-risk-medium)',
                              }}
                            >
                              {student.attendanceRate}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '60px',
                              height: '4px',
                              backgroundColor: 'var(--color-bg-muted)',
                              borderRadius: 'var(--radius-full)',
                              overflow: 'hidden',
                              marginTop: '4px',
                            }}
                          >
                            <div
                              style={{
                                width: `${student.attendanceRate}%`,
                                height: '100%',
                                backgroundColor:
                                  student.attendanceRate < 65
                                    ? 'var(--color-risk-high)'
                                    : 'var(--color-risk-medium)',
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <Badge type="risk" value={student.riskLevel} />
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '200px' }}>
                          {student.riskReason}
                        </td>
                        <td>
                          <Link to={`/students/${student.id}`}>
                            <Button variant="outline" size="sm">
                              Profile
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Interventions */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <ClipboardList size={18} color="var(--color-primary)" />
                    Recent Interventions
                  </h3>
                  <p className="card-subtitle">
                    Latest counseling sessions, warnings, and remedial actions
                  </p>
                </div>
                <Link to="/interventions">
                  <Button variant="secondary" size="sm">
                    All Cases
                  </Button>
                </Link>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Case & Student</th>
                      <th>Intervention Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentInterventions.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.studentName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {item.id} • {item.counselorName}
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{item.type}</td>
                        <td>
                          <Badge type="priority" value={item.priority} />
                        </td>
                        <td>
                          <Badge type="status" value={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. Attendance & Academic Performance Overviews */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Department Attendance Overview */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <CalendarCheck size={18} color="var(--color-primary)" />
                  Departmental Attendance Rates
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Benchmark: 75.0%
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.attendanceOverview.departments.map((dept, index) => (
                    <div key={index}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{dept.name}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              dept.rate >= 75
                                ? 'var(--color-risk-low)'
                                : 'var(--color-risk-medium)',
                          }}
                        >
                          {dept.rate}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'var(--color-bg-muted)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${dept.rate}%`,
                            height: '100%',
                            backgroundColor:
                              dept.rate >= 75
                                ? 'var(--color-risk-low)'
                                : 'var(--color-risk-medium)',
                            borderRadius: 'var(--radius-full)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Academic Performance Overview */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <BookOpen size={18} color="var(--color-primary)" />
                  Academic Health Summary
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Evaluated: {data.academicOverview.assessmentsEvaluated} Assessments
                </span>
              </div>
              <div className="card-body">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--color-bg-muted)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      AVERAGE COHORT GPA
                    </div>
                    <div
                      style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: 'var(--color-primary-dark)',
                        marginTop: '4px',
                      }}
                    >
                      {data.academicOverview.averageGPA}
                      <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}> / 10</span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--color-bg-muted)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      OVERALL PASS RATE
                    </div>
                    <div
                      style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: 'var(--color-risk-low)',
                        marginTop: '4px',
                      }}
                    >
                      {data.academicOverview.overallPassRate}%
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--color-bg-muted)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      gridColumn: 'span 2',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      CLEARED ASSESSMENTS ON FIRST ATTEMPT
                    </div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        marginTop: '4px',
                      }}
                    >
                      {data.academicOverview.clearedFirstAttempt}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      20.8% of students needed at least one re-test or remedial tutorial
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
