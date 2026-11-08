import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Filter,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';

import SearchBar from '../components/common/SearchBar.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import '../components/common/common.css';

import { getStudents, createStudent } from '../services/studentService.js';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [semester, setSemester] = useState('');

  // Add Student Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    semester: '1',
  });

  const fetchStudentList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStudents({ search, department, riskLevel, semester });
      setStudents(response.students || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentList();
  }, [search, department, riskLevel, semester]);

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('');
    setRiskLevel('');
    setSemester('');
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalSuccessMsg('');
    try {
      await createStudent(formData);
      setModalSuccessMsg('Student enrolled successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccessMsg('');
        setFormData({
          name: '',
          rollNo: '',
          email: '',
          phone: '',
          department: 'Computer Science',
          semester: '1',
        });
        fetchStudentList();
      }, 1000);
    } catch (err) {
      alert(`Error registering student: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isFiltered = search || department || riskLevel || semester;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Students Directory</h2>
          <p className="page-description">
            Searchable cohort registry with real-time attendance percentages, academic metrics, and explainable risk classifications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={() => setIsModalOpen(true)}
          >
            Add Student
          </Button>
        </div>
      </div>

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
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by student name, ID, roll no, or email..."
            style={{ maxWidth: '340px' }}
          />

          {/* Department Filter */}
          <select
            className="filter-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filter by Department"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Information Tech">Information Tech</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil Engineering">Civil Engineering</option>
          </select>

          {/* Risk Level Filter */}
          <select
            className="filter-select"
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            aria-label="Filter by Risk Level"
          >
            <option value="">All Risk Levels</option>
            <option value="high">High Risk (&lt; 65%)</option>
            <option value="medium">Medium Risk (65%–75%)</option>
            <option value="low">Low Risk / On Track (&gt; 75%)</option>
          </select>

          {/* Semester Filter */}
          <select
            className="filter-select"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            aria-label="Filter by Semester"
          >
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
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

        {/* Count Summary */}
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Showing {students.length} student{students.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Main Student Directory Table & States */}
      {loading && <LoadingState message="Fetching student cohort records from directory..." />}

      {!loading && error && (
        <ErrorState
          title="Unable to Load Students"
          message={error}
          onRetry={fetchStudentList}
        />
      )}

      {!loading && !error && students.length === 0 && (
        <EmptyState
          title="No Students Matched"
          message="No records match your active search and filter criteria. Try clearing filters or searching with another term."
          actionLabel="Reset Search & Filters"
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
                  <th>Department & Sem</th>
                  <th>Attendance</th>
                  <th>Academic GPA</th>
                  <th>Risk Category</th>
                  <th>Primary Risk Reason</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const initials = student.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={student.id}>
                      {/* Name & ID */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--color-primary-subtle)',
                              color: 'var(--color-primary-dark)',
                              fontWeight: 700,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <Link
                              to={`/students/${student.id}`}
                              style={{
                                fontWeight: 600,
                                color: 'var(--color-primary-dark)',
                                textDecoration: 'none',
                              }}
                            >
                              {student.name}
                            </Link>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                              {student.id} • {student.rollNo}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Semester */}
                      <td>
                        <div style={{ fontWeight: 500 }}>{student.department}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          Semester {student.semester}
                        </div>
                      </td>

                      {/* Attendance */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '13px',
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
                        <div
                          style={{
                            width: '80px',
                            height: '5px',
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
                                  : student.attendanceRate < 75
                                  ? 'var(--color-risk-medium)'
                                  : 'var(--color-risk-low)',
                            }}
                          />
                        </div>
                      </td>

                      {/* Academic GPA & Failed Assessments */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {student.gpa} <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>/ 10</span>
                        </div>
                        {student.failedAssessmentsCount > 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--color-risk-high)', fontWeight: 600 }}>
                            {student.failedAssessmentsCount} failed test{student.failedAssessmentsCount > 1 ? 's' : ''}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--color-risk-low)' }}>
                            All passed
                          </div>
                        )}
                      </td>

                      {/* Risk Badge */}
                      <td>
                        <Badge type="risk" value={student.riskLevel} />
                      </td>

                      {/* Rule-based Explanation */}
                      <td style={{ maxWidth: '240px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {student.riskReason}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/students/${student.id}`}>
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

      {/* Register New Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll New Student"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              onClick={handleCreateStudent}
              disabled={submitting || !formData.name || !formData.email}
            >
              {submitting ? 'Registering...' : 'Enroll Student'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {modalSuccessMsg && (
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
              {modalSuccessMsg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Student Name *</label>
            <input
              id="name"
              className="form-input"
              type="text"
              required
              placeholder="e.g. Diya Sengupta"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="rollNo">Roll Number</label>
              <input
                id="rollNo"
                className="form-input"
                type="text"
                placeholder="e.g. CS2024-055"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                className="form-input"
                type="tel"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Institutional Email *</label>
            <input
              id="email"
              className="form-input"
              type="email"
              required
              placeholder="student@institution.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="department">Department</label>
              <select
                id="department"
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Information Tech">Information Tech</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="semester">Semester</label>
              <select
                id="semester"
                className="form-select"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
