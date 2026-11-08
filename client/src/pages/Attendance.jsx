import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  PlusCircle,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  ExternalLink,
  Users,
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
  getAttendanceOverview,
  getAttendanceRecords,
  recordAttendance,
} from '../services/attendanceService.js';

export default function Attendance() {
  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [studentSearch, setStudentSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State for logging attendance
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: '4',
    course: 'Data Structures',
    facultyName: 'Dr. N. Kulkarni',
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    durationHours: '2',
    remarks: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, recordsData] = await Promise.all([
        getAttendanceOverview(),
        getAttendanceRecords({
          date: dateFilter,
          student: studentSearch,
          course: courseFilter,
          status: statusFilter,
        }),
      ]);
      setOverview(overviewData);
      setRecords(recordsData.records || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentSearch, dateFilter, courseFilter, statusFilter]);

  const handleResetFilters = () => {
    setStudentSearch('');
    setDateFilter('');
    setCourseFilter('');
    setStatusFilter('');
  };

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    try {
      await recordAttendance(formData);
      setSuccessMsg('Attendance record logged successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg('');
        loadData();
      }, 1000);
    } catch (err) {
      alert(`Error logging attendance: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isFiltered = studentSearch || dateFilter || courseFilter || statusFilter;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance Monitoring</h2>
          <p className="page-description">
            Monitor institutional attendance percentages, lecture session logs, and chronic absenteeism triggers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => setIsModalOpen(true)}
          >
            Log Attendance Session
          </Button>
        </div>
      </div>

      {/* Attendance Overview Stat Cards */}
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
            title="Institutional Average"
            value={`${overview.overallRate}%`}
            icon={CalendarCheck}
            iconColor="var(--color-primary)"
            iconBg="var(--color-primary-subtle)"
            badgeText="Target: > 75%"
            badgeType="low"
            subtitle={`${overview.totalSessionsLogged} total sessions`}
          />
          <StatCard
            title="Safe Cohort (> 75%)"
            value={overview.cohortSummary.safeCount.toLocaleString()}
            icon={CheckCircle2}
            iconColor="var(--color-risk-low)"
            iconBg="var(--color-risk-low-subtle)"
            badgeText={`${overview.cohortSummary.safePercentage}%`}
            badgeType="low"
            subtitle="Compliant students"
          />
          <StatCard
            title="Warning Zone (65%–75%)"
            value={overview.cohortSummary.warningCount.toLocaleString()}
            icon={Clock}
            iconColor="var(--color-risk-medium)"
            iconBg="var(--color-risk-medium-subtle)"
            badgeText={`${overview.cohortSummary.warningPercentage}%`}
            badgeType="medium"
            subtitle="Proactive check-in needed"
          />
          <StatCard
            title="Critical Absenteeism (< 65%)"
            value={overview.cohortSummary.criticalCount.toLocaleString()}
            icon={AlertTriangle}
            iconColor="var(--color-risk-high)"
            iconBg="var(--color-risk-high-subtle)"
            badgeText={`${overview.cohortSummary.criticalPercentage}%`}
            badgeType="high"
            subtitle="Immediate intervention"
          />
        </div>
      )}

      {/* Department Attendance Benchmarks */}
      {overview && overview.departmentRates && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Users size={18} color="var(--color-primary)" />
                Department Attendance Benchmarks
              </h3>
              <p className="card-subtitle">
                Institutional minimum retention requirement is 75.0%
              </p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Benchmark: 75.0%
            </span>
          </div>

          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
              }}
            >
              {overview.departmentRates.map((dept, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{dept.department}</span>
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
          {/* Search by Student */}
          <SearchBar
            value={studentSearch}
            onChange={setStudentSearch}
            placeholder="Search student by name or ID..."
            style={{ maxWidth: '280px' }}
          />

          {/* Filter by Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="date"
              className="filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by session date"
              style={{ minWidth: '150px' }}
            />
          </div>

          {/* Filter by Course */}
          <select
            className="filter-select"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter by course"
          >
            <option value="">All Courses</option>
            <option value="Data Structures">Data Structures</option>
            <option value="Database Management">Database Management</option>
            <option value="Digital Signal Processing">Digital Signal Processing</option>
            <option value="Computer Networks">Computer Networks</option>
            <option value="Operating Systems">Operating Systems</option>
            <option value="Thermodynamics">Thermodynamics</option>
            <option value="Structural Mechanics">Structural Mechanics</option>
          </select>

          {/* Filter by Status */}
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by attendance status"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Excused">Excused</option>
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
          Showing {records.length} record{records.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Main Records Table & Conditional States */}
      {loading && <LoadingState message="Retrieving lecture attendance records and logs..." />}

      {!loading && error && (
        <ErrorState
          title="Attendance Service Error"
          message={error}
          onRetry={loadData}
        />
      )}

      {!loading && !error && records.length === 0 && (
        <EmptyState
          title="No Attendance Logs Found"
          message="No attendance sessions matched your active date, student, or course filters. Try widening your filter parameters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      )}

      {!loading && !error && records.length > 0 && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session Date & Time</th>
                  <th>Student Info</th>
                  <th>Course & Faculty</th>
                  <th>Duration</th>
                  <th>Attendance Status</th>
                  <th>Remarks / Log Details</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    {/* Date & Time */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{rec.date}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {rec.time}
                      </div>
                    </td>

                    {/* Student */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{rec.studentName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {rec.studentId} • {rec.department} (Sem {rec.semester})
                      </div>
                    </td>

                    {/* Course & Faculty */}
                    <td>
                      <div style={{ fontWeight: 500 }}>{rec.course}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {rec.facultyName}
                      </div>
                    </td>

                    {/* Duration */}
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {rec.durationHours} hr(s)
                    </td>

                    {/* Status Badge */}
                    <td>
                      <Badge type="attendance" value={rec.status} />
                    </td>

                    {/* Remarks */}
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '240px' }}>
                      {rec.remarks || '—'}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Attendance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Lecture Attendance Session"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              onClick={handleRecordAttendance}
              disabled={submitting || !formData.studentName || !formData.course}
            >
              {submitting ? 'Recording...' : 'Submit Attendance'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <label className="form-label" htmlFor="studentId">Student ID</label>
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
              <label className="form-label" htmlFor="studentName">Student Name</label>
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
              <label className="form-label" htmlFor="course">Course Subject</label>
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
              <label className="form-label" htmlFor="facultyName">Instructor Name</label>
              <input
                id="facultyName"
                className="form-input"
                type="text"
                value={formData.facultyName}
                onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="date">Session Date</label>
              <input
                id="date"
                className="form-input"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="status">Attendance Status</label>
              <select
                id="status"
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="durationHours">Duration (Hours)</label>
            <input
              id="durationHours"
              className="form-input"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.durationHours}
              onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="remarks">Remarks / Reason (Optional)</label>
            <input
              id="remarks"
              className="form-input"
              type="text"
              placeholder="e.g. Unexcused absence, late due to bus delay, etc."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
