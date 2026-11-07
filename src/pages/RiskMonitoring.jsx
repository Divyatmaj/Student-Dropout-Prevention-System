import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Info,
  CalendarCheck,
  BookOpen,
} from 'lucide-react';

import StatCard from '../components/common/StatCard.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Modal from '../components/common/Modal.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import '../components/common/common.css';

import {
  getRiskOverview,
  getRiskStudents,
  recalculateStudentRisk,
} from '../services/riskService.js';

export default function RiskMonitoring() {
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedTier, setSelectedTier] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  // Recalculating state for individual students
  const [recalculatingId, setRecalculatingId] = useState(null);
  const [recalculateFeedback, setRecalculateFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, studentsData] = await Promise.all([
        getRiskOverview(),
        getRiskStudents({
          tier: selectedTier,
          department,
          search,
        }),
      ]);
      setOverview(overviewData);
      setStudents(studentsData.students || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve risk categorization records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTier, department, search]);

  const handleResetFilters = () => {
    setSelectedTier('all');
    setSearch('');
    setDepartment('');
  };

  const handleRecalculate = async (studentId, studentName) => {
    setRecalculatingId(studentId);
    setRecalculateFeedback(null);
    try {
      const result = await recalculateStudentRisk(studentId);
      setRecalculateFeedback({
        studentId,
        studentName,
        message: `Risk re-evaluated: Student classified as ${result.newRisk.toUpperCase()} RISK based on latest attendance and marks.`,
      });
      loadData();
    } catch (err) {
      alert(`Recalculation error: ${err.message}`);
    } finally {
      setRecalculatingId(null);
    }
  };

  const isFiltered = selectedTier !== 'all' || search || department;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Risk Monitoring & Early Categorization</h2>
          <p className="page-description">
            Explainable, deterministic rule-based evaluation. Monitor High, Medium, and Low risk cohorts with transparent rationale behind every flag.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={loadData}
          >
            Refresh Rules
          </Button>
          <Link to="/interventions">
            <Button variant="primary" size="md" icon={PlusCircle}>
              Schedule Intervention
            </Button>
          </Link>
        </div>
      </div>

      {/* Transparent Rule-Based Architecture Banner */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: '24px',
          backgroundColor: 'var(--color-bg-surface)',
          borderLeft: '4px solid var(--color-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Explainable Rule-Based Evaluation System
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary-dark)',
                }}
              >
                No Black-Box AI
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              Udaan calculates student retention risk deterministically through verifiable institutional benchmarks.
              Every classification has a clear, understandable reason:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
                marginTop: '14px',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-risk-high-subtle)',
                  borderLeft: '3px solid var(--color-risk-high)',
                  fontSize: '12px',
                }}
              >
                <strong style={{ color: 'var(--color-risk-high)' }}>High Risk Rule:</strong> Attendance &lt; 65% OR &ge; 3 failed assessments. Immediate counselor outreach.
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-risk-medium-subtle)',
                  borderLeft: '3px solid var(--color-risk-medium)',
                  fontSize: '12px',
                }}
              >
                <strong style={{ color: 'var(--color-risk-medium)' }}>Medium Risk Rule:</strong> Attendance 65%–75% OR 1–2 failed tests. Faculty check-in & monitoring.
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-risk-low-subtle)',
                  borderLeft: '3px solid var(--color-risk-low)',
                  fontSize: '12px',
                }}
              >
                <strong style={{ color: 'var(--color-risk-low)' }}>Low Risk Rule:</strong> Attendance &gt; 75% AND 0 failed tests. Compliant academic standing.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recalculate Feedback Notification Toast */}
      {recalculateFeedback && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-subtle)',
            border: '1px solid #bbf7d0',
            color: 'var(--color-primary-dark)',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span>
              <strong>{recalculateFeedback.studentName} ({recalculateFeedback.studentId}):</strong>{' '}
              {recalculateFeedback.message}
            </span>
          </div>
          <button
            onClick={() => setRecalculateFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-dark)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      {overview && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <StatCard
            title="High Risk (Critical)"
            value={overview.highRiskCount.toLocaleString()}
            icon={AlertTriangle}
            iconColor="var(--color-risk-high)"
            iconBg="var(--color-risk-high-subtle)"
            badgeText={`${overview.highRiskPercentage}%`}
            badgeType="high"
            subtitle="Immediate intervention needed"
          />
          <StatCard
            title="Medium Risk (Warning)"
            value={overview.mediumRiskCount.toLocaleString()}
            icon={Clock}
            iconColor="var(--color-risk-medium)"
            iconBg="var(--color-risk-medium-subtle)"
            badgeText={`${overview.mediumRiskPercentage}%`}
            badgeType="medium"
            subtitle="Attendance or grade alert"
          />
          <StatCard
            title="Low Risk (On Track)"
            value={overview.lowRiskCount.toLocaleString()}
            icon={CheckCircle2}
            iconColor="var(--color-risk-low)"
            iconBg="var(--color-risk-low-subtle)"
            badgeText={`${overview.lowRiskPercentage}%`}
            badgeType="low"
            subtitle="Meets all retention targets"
          />
          <StatCard
            title="Total Monitored Cohort"
            value={overview.totalMonitored.toLocaleString()}
            icon={ShieldCheck}
            iconColor="var(--color-primary)"
            iconBg="var(--color-primary-subtle)"
            badgeText="Active"
            badgeType="default"
            subtitle="Automated rule surveillance"
          />
        </div>
      )}

      {/* Risk Tier Navigation Tabs & Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        {/* Tier Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: '14px',
            marginBottom: '16px',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setSelectedTier('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedTier === 'all' ? 'var(--color-primary)' : 'var(--color-bg-muted)',
              color: selectedTier === 'all' ? '#ffffff' : 'var(--color-text-secondary)',
            }}
          >
            All Cohorts ({overview ? overview.totalMonitored : 0})
          </button>

          <button
            onClick={() => setSelectedTier('high')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedTier === 'high' ? 'var(--color-risk-high)' : 'var(--color-risk-high-subtle)',
              color: selectedTier === 'high' ? '#ffffff' : 'var(--color-risk-high)',
            }}
          >
            High Risk ({overview ? overview.highRiskCount : 0})
          </button>

          <button
            onClick={() => setSelectedTier('medium')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedTier === 'medium' ? 'var(--color-risk-medium)' : 'var(--color-risk-medium-subtle)',
              color: selectedTier === 'medium' ? '#ffffff' : 'var(--color-risk-medium)',
            }}
          >
            Medium Risk ({overview ? overview.mediumRiskCount : 0})
          </button>

          <button
            onClick={() => setSelectedTier('low')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedTier === 'low' ? 'var(--color-risk-low)' : 'var(--color-risk-low-subtle)',
              color: selectedTier === 'low' ? '#ffffff' : 'var(--color-risk-low)',
            }}
          >
            Low Risk ({overview ? overview.lowRiskCount : 0})
          </button>
        </div>

        {/* Search & Department Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by student name, ID, or reason keyword..."
              style={{ maxWidth: '340px' }}
            />

            <select
              className="filter-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Information Tech">Information Tech</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>

            {isFiltered && (
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                Reset
              </Button>
            )}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Showing {students.length} student record{students.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Main Risk Categorization Table & States */}
      {loading && <LoadingState message="Evaluating cohort indicators against institutional retention rules..." />}

      {!loading && error && (
        <ErrorState
          title="Risk Evaluation Service Error"
          message={error}
          onRetry={loadData}
        />
      )}

      {!loading && !error && students.length === 0 && (
        <EmptyState
          title="No Students in Selected Risk Tier"
          message="No student profiles matched your active risk tier or search filters. Try selecting another tier or clearing your search."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      )}

      {!loading && !error && students.length > 0 && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Risk Tier</th>
                  <th>Primary Trigger</th>
                  <th>Attendance & GPA</th>
                  <th>Explainable Rationale ("The Why")</th>
                  <th>Recommended Intervention</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    {/* Student Info */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{student.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {student.id} • {student.rollNo}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {student.department} (Sem {student.semester})
                      </div>
                    </td>

                    {/* Risk Tier Badge */}
                    <td>
                      <Badge type="risk" value={student.riskLevel} />
                    </td>

                    {/* Primary Trigger */}
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {student.primaryTrigger}
                      </span>
                    </td>

                    {/* Metrics */}
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <strong>Attendance:</strong>{' '}
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              student.attendanceRate < 65
                                ? 'var(--color-risk-high)'
                                : student.attendanceRate < 75
                                ? 'var(--color-risk-medium)'
                                : 'var(--color-risk-low)',
                          }}
                        >
                          {student.attendanceRate}%
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        GPA: <strong>{student.gpa}</strong> • Failed Tests: <strong>{student.failedAssessmentsCount}</strong>
                      </div>
                    </td>

                    {/* Understandable Rationale */}
                    <td style={{ maxWidth: '280px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                      {student.explainableReason}
                    </td>

                    {/* Recommended Intervention */}
                    <td style={{ maxWidth: '200px', fontSize: '12px', color: 'var(--color-text-primary)' }}>
                      <div style={{ padding: '6px 10px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                        {student.recommendedAction}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={RefreshCw}
                          onClick={() => handleRecalculate(student.id, student.name)}
                          disabled={recalculatingId === student.id}
                          title="Recalculate risk against latest attendance and marks"
                        >
                          {recalculatingId === student.id ? 'Recalculating...' : 'Recalculate'}
                        </Button>

                        <Link to={`/students/${student.id}`}>
                          <Button variant="outline" size="sm" icon={ExternalLink} title="View student profile">
                            Profile
                          </Button>
                        </Link>

                        <Link to={`/interventions?studentId=${student.id}&name=${encodeURIComponent(student.name)}`}>
                          <Button variant="primary" size="sm" title="Schedule intervention">
                            Intervene
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
