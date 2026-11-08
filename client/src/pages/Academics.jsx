import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  PlusCircle,
  ExternalLink,
  Award,
  Layers,
  BarChart2,
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
  getAcademicOverview,
  getAssessmentResults,
  recordMarks,
} from '../services/academicService.js';

export default function Academics() {
  const [overview, setOverview] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [status, setStatus] = useState('');

  // Record Marks Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: '4',
    course: 'Data Structures',
    assessmentName: 'Unit Test 3 - Graph Algorithms',
    assessmentType: 'Unit Test',
    score: '34',
    maxScore: '50',
    passingScore: '20',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, assessmentData] = await Promise.all([
        getAcademicOverview(),
        getAssessmentResults({
          search,
          department,
          course,
          assessmentType,
          status,
        }),
      ]);
      setOverview(overviewData);
      setAssessments(assessmentData.assessments || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve academic assessment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, department, course, assessmentType, status]);

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('');
    setCourse('');
    setAssessmentType('');
    setStatus('');
  };

  const handleRecordMarks = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    try {
      await recordMarks(formData);
      setSuccessMsg('Assessment marks recorded successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg('');
        loadData();
      }, 1000);
    } catch (err) {
      alert(`Error recording marks: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isFiltered = search || department || course || assessmentType || status;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Academic Performance & Assessments</h2>
          <p className="page-description">
            Track student assessment outcomes, subject-level difficulty curves, performance risk indicators, and record grades.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => setIsModalOpen(true)}
          >
            Record Assessment Marks
          </Button>
        </div>
      </div>

      {/* Academic Overview Stat Cards */}
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
            title="Cohort Average GPA"
            value={`${overview.averageGPA} / 10`}
            icon={BookOpen}
            iconColor="var(--color-primary)"
            iconBg="var(--color-primary-subtle)"
            badgeText="Target: > 7.0"
            badgeType="low"
            subtitle="Institutional benchmark met"
          />
          <StatCard
            title="Overall Pass Rate"
            value={`${overview.overallPassRate}%`}
            icon={CheckCircle2}
            iconColor="var(--color-risk-low)"
            iconBg="var(--color-risk-low-subtle)"
            badgeText="Passing"
            badgeType="low"
            subtitle="Across all evaluations"
          />
          <StatCard
            title="Academic Alert Cohort"
            value={overview.studentsWithAcademicAlerts.toLocaleString()}
            icon={AlertTriangle}
            iconColor="var(--color-risk-high)"
            iconBg="var(--color-risk-high-subtle)"
            badgeText="≥ 1 Failed Exam"
            badgeType="high"
            subtitle="Requires remedial tutorial"
          />
          <StatCard
            title="First-Attempt Clearance"
            value={`${overview.firstAttemptClearance}%`}
            icon={TrendingUp}
            iconColor="var(--color-accent)"
            iconBg="var(--color-accent-subtle)"
            badgeText="Cleared"
            badgeType="medium"
            subtitle="20.8% required re-test"
          />
        </div>
      )}

      {/* Subject Difficulty & Assessment Benchmarking */}
      {overview && overview.subjectDifficulty && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <BarChart2 size={18} color="var(--color-primary)" />
                Subject Difficulty & Failure Risk Analysis
              </h3>
              <p className="card-subtitle">
                Identifies courses with abnormal failure rates to trigger curriculum support and remedial tutorials
              </p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Threshold Alert: Pass Rate &lt; 70%
            </span>
          </div>

          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              {overview.subjectDifficulty.map((subj, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg-muted)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                        {subj.course}
                      </span>
                      <Badge type="difficulty" value={subj.difficultyLevel} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {subj.department} • Avg: {subj.averageScore}/{subj.maxScore}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Pass Rate</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            subj.passRate >= 75
                              ? 'var(--color-risk-low)'
                              : subj.passRate >= 70
                              ? 'var(--color-risk-medium)'
                              : 'var(--color-risk-high)',
                        }}
                      >
                        {subj.passRate}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'var(--color-bg-surface)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${subj.passRate}%`,
                          height: '100%',
                          backgroundColor:
                            subj.passRate >= 75
                              ? 'var(--color-risk-low)'
                              : subj.passRate >= 70
                              ? 'var(--color-risk-medium)'
                              : 'var(--color-risk-high)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    <strong>{subj.flaggedStudentsCount} students</strong> flagged below passing mark
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
          {/* Search by Student or Assessment */}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search student name, ID, or assessment name..."
            style={{ maxWidth: '300px' }}
          />

          {/* Department Filter */}
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

          {/* Course Filter */}
          <select
            className="filter-select"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            aria-label="Filter by course"
          >
            <option value="">All Courses</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Database Management">Database Management</option>
            <option value="Operating Systems">Operating Systems</option>
            <option value="Digital Signal Processing">Digital Signal Processing</option>
            <option value="Thermodynamics">Thermodynamics</option>
            <option value="Structural Mechanics">Structural Mechanics</option>
            <option value="Web Architectures">Web Architectures</option>
          </select>

          {/* Assessment Type Filter */}
          <select
            className="filter-select"
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value)}
            aria-label="Filter by assessment type"
          >
            <option value="">All Types</option>
            <option value="Mid-Term Exam">Mid-Term Exam</option>
            <option value="Unit Test">Unit Test</option>
            <option value="Quiz">Quiz</option>
            <option value="Lab Practical">Lab Practical</option>
          </select>

          {/* Result Status Filter */}
          <select
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by result status"
          >
            <option value="">All Results</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>

          {/* Reset Filters */}
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

        {/* Count Indicator */}
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Showing {assessments.length} assessment record{assessments.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Main Assessment Results Table & Conditional States */}
      {loading && <LoadingState message="Retrieving assessment evaluation results and performance indicators..." />}

      {!loading && error && (
        <ErrorState
          title="Academic Service Error"
          message={error}
          onRetry={loadData}
        />
      )}

      {!loading && !error && assessments.length === 0 && (
        <EmptyState
          title="No Assessment Records Found"
          message="No evaluation records matched your active department, course, or student search filters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      )}

      {!loading && !error && assessments.length > 0 && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Subject Course & Assessment</th>
                  <th>Score / Max</th>
                  <th>Pass Cutoff</th>
                  <th>Class Average</th>
                  <th>Evaluation Result</th>
                  <th>Academic Indicator / Alert</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((rec) => {
                  const percentage = Math.round((rec.score / rec.maxScore) * 100);

                  return (
                    <tr key={rec.id}>
                      {/* Student */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.studentName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {rec.studentId} • {rec.department} (Sem {rec.semester})
                        </div>
                      </td>

                      {/* Course & Assessment */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.course}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {rec.assessmentName} • <span style={{ color: 'var(--color-text-muted)' }}>{rec.assessmentType}</span>
                        </div>
                      </td>

                      {/* Score / Max */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>
                            {rec.score}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            / {rec.maxScore}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '1px 6px',
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
                            {percentage}%
                          </span>
                        </div>
                      </td>

                      {/* Cutoff */}
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {rec.passingScore}
                      </td>

                      {/* Class Average */}
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {rec.classAverage}
                      </td>

                      {/* Result Badge */}
                      <td>
                        <Badge type="result" value={rec.status} />
                      </td>

                      {/* Early Warning / Academic Alert */}
                      <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '240px' }}>
                        {rec.academicAlert}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/students/${rec.studentId}`}>
                          <Button variant="outline" size="sm" icon={ExternalLink}>
                            Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Marks Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Student Assessment Marks"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              onClick={handleRecordMarks}
              disabled={submitting || !formData.studentName || !formData.score}
            >
              {submitting ? 'Recording...' : 'Save Assessment Marks'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordMarks} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--color-risk-low-subtle)',
                color: 'var(--color-risk-low)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="studentId">Student ID *</label>
              <input
                id="studentId"
                className="form-input"
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="studentName">Student Name *</label>
              <input
                id="studentName"
                className="form-input"
                type="text"
                required
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="course">Subject Course *</label>
              <input
                id="course"
                className="form-input"
                type="text"
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="assessmentType">Assessment Type</label>
              <select
                id="assessmentType"
                className="form-select"
                value={formData.assessmentType}
                onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
              >
                <option value="Mid-Term Exam">Mid-Term Exam</option>
                <option value="Unit Test">Unit Test</option>
                <option value="Quiz">Quiz</option>
                <option value="Lab Practical">Lab Practical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="assessmentName">Assessment Title</label>
            <input
              id="assessmentName"
              className="form-input"
              type="text"
              required
              placeholder="e.g. Mid-Term Exam - Algorithms"
              value={formData.assessmentName}
              onChange={(e) => setFormData({ ...formData, assessmentName: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="score">Student Score *</label>
              <input
                id="score"
                className="form-input"
                type="number"
                min="0"
                step="0.5"
                required
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="maxScore">Max Score *</label>
              <input
                id="maxScore"
                className="form-input"
                type="number"
                min="1"
                required
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="passingScore">Pass Cutoff *</label>
              <input
                id="passingScore"
                className="form-input"
                type="number"
                min="1"
                required
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
              />
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Calculated Status:{' '}
            <strong
              style={{
                color:
                  parseFloat(formData.score) >= parseFloat(formData.passingScore)
                    ? 'var(--color-risk-low)'
                    : 'var(--color-risk-high)',
              }}
            >
              {parseFloat(formData.score) >= parseFloat(formData.passingScore) ? 'Pass' : 'Fail (Academic Alert)'}
            </strong>
          </div>
        </form>
      </Modal>
    </div>
  );
}
