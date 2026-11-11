import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Upload,
  RotateCcw,
  ExternalLink,
  Pencil,
  CheckCircle2,
  Wallet,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import SearchBar from '../components/common/SearchBar.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import StudentFormModal from '../components/students/StudentFormModal.jsx';
import StudentImportModal from '../components/students/StudentImportModal.jsx';
import '../components/common/common.css';

import { getStudents } from '../services/studentService.js';
import { useAuth } from '../hooks/useAuth.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { getInitials, formatClass, attendanceTone, formatPercent } from '../utils/formatters.js';
import {
  GRADES,
  SECTIONS,
  STUDENT_STATUS,
  STUDENT_STATUS_LABELS,
  RISK_CATEGORY,
  RISK_CATEGORY_LABELS,
  STUDENTS_PAGE_SIZE,
} from '../constants/students.js';

const DEFAULT_FILTERS = {
  grade: '',
  section: '',
  status: STUDENT_STATUS.ACTIVE,
  riskCategory: '',
};

/** Debounce a fast-changing value (used for the search box). */
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Students() {
  const { can } = useAuth();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [notice, setNotice] = useState('');

  const fetchStudentList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStudents({
        search: debouncedSearch,
        ...filters,
        page,
        limit: STUDENTS_PAGE_SIZE,
      });
      setStudents(response.students || []);
      setTotal(response.total ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, page]);

  useEffect(() => {
    fetchStudentList();
  }, [fetchStudentList]);

  // Any filter or search change goes back to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const handleResetFilters = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
  };

  const openCreate = () => {
    setEditingStudent(null);
    setFormOpen(true);
  };

  const openEdit = (student) => {
    setEditingStudent(student);
    setFormOpen(true);
  };

  const handleSaved = (saved) => {
    setNotice(
      editingStudent ? `Saved changes to ${saved.fullName}.` : `${saved.fullName} was added to the register.`
    );
    setFormOpen(false);
    setEditingStudent(null);
    fetchStudentList();
  };

  const handleImported = (result) => {
    setImportOpen(false);
    setNotice(`${result.imported} student${result.imported === 1 ? '' : 's'} imported successfully.`);
    fetchStudentList();
  };

  const isFiltered =
    search ||
    filters.grade ||
    filters.section ||
    filters.riskCategory ||
    filters.status !== DEFAULT_FILTERS.status;

  const totalPages = Math.max(1, Math.ceil(total / STUDENTS_PAGE_SIZE));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Students</h2>
          <p className="page-description">
            The school's student register with class, guardian contact, attendance and current risk
            indicator for staff review.
          </p>
        </div>

        {can(PERMISSIONS.STUDENT_CREATE) && (
          <div className="student-header-actions">
            <Button variant="secondary" size="md" icon={Upload} onClick={() => setImportOpen(true)}>
              Bulk Import
            </Button>
            <Button variant="primary" size="md" icon={UserPlus} onClick={openCreate}>
              Add Student
            </Button>
          </div>
        )}
      </div>

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

      {/* Search & filters */}
      <div
        className="card mobile-filter-card"
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
        <div className="mobile-filter-grid">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or student code..."
            style={{ maxWidth: '320px' }}
          />

          <select
            className="filter-select"
            value={filters.grade}
            onChange={(e) => setFilter('grade', e.target.value)}
            aria-label="Filter by grade"
          >
            <option value="">All grades</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filters.section}
            onChange={(e) => setFilter('section', e.target.value)}
            aria-label="Filter by section"
          >
            <option value="">All sections</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            aria-label="Filter by enrolment status"
          >
            <option value="">All statuses</option>
            {Object.values(STUDENT_STATUS).map((s) => (
              <option key={s} value={s}>{STUDENT_STATUS_LABELS[s]}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filters.riskCategory}
            onChange={(e) => setFilter('riskCategory', e.target.value)}
            aria-label="Filter by risk category"
          >
            <option value="">All risk categories</option>
            {Object.values(RISK_CATEGORY).map((r) => (
              <option key={r} value={r}>{RISK_CATEGORY_LABELS[r]}</option>
            ))}
          </select>

          {isFiltered && (
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleResetFilters}>
              Reset
            </Button>
          )}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {total} student{total === 1 ? '' : 's'}
        </div>
      </div>

      {loading && <LoadingState message="Loading students..." />}

      {!loading && error && (
        <ErrorState title="Unable to Load Students" message={error} onRetry={fetchStudentList} />
      )}

      {!loading && !error && students.length === 0 && (
        isFiltered ? (
          <EmptyState
            title="No Students Matched"
            message="No students match your search and filters. Try clearing them or searching for another name or code."
            actionLabel="Reset Search & Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            title="No Students Yet"
            message="Add your first student to start recording attendance and marks."
            actionLabel={can(PERMISSIONS.STUDENT_CREATE) ? 'Add Student' : undefined}
            onAction={can(PERMISSIONS.STUDENT_CREATE) ? openCreate : undefined}
          />
        )
      )}

      {!loading && !error && students.length > 0 && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table mobile-students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Guardian</th>
                  <th>Attendance</th>
                  <th>Risk Indicator</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          aria-hidden="true"
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
                          {getInitials(student.fullName)}
                        </div>
                        <div>
                          <Link
                            to={`/students/${student.id}`}
                            style={{ fontWeight: 600, color: 'var(--color-primary-dark)', textDecoration: 'none' }}
                          >
                            {student.fullName}
                          </Link>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {student.studentCode}
                            {student.financialBarrierReported && (
                              <span
                                title="Financial barrier reported"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--color-accent)' }}
                              >
                                <Wallet size={11} aria-hidden="true" />
                                <span style={{ fontWeight: 600 }}>Support flag</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500 }}>{formatClass(student.grade, student.section)}</div>
                      {student.assignedTeacherName && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {student.assignedTeacherName}
                        </div>
                      )}
                    </td>

                    <td>
                      {student.guardianName ? (
                        <>
                          <div style={{ fontWeight: 500 }}>{student.guardianName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {[student.guardianRelationship, student.guardianPhone].filter(Boolean).join(' • ')}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Not recorded</span>
                      )}
                    </td>

                    <td>
                      {student.attendanceRate === null || student.attendanceRate === undefined ? (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No records yet</span>
                      ) : (
                        <>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: attendanceTone(student.attendanceRate) }}>
                            {formatPercent(student.attendanceRate)}
                          </span>
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
                                backgroundColor: attendanceTone(student.attendanceRate),
                              }}
                            />
                          </div>
                        </>
                      )}
                    </td>

                    <td style={{ maxWidth: '220px' }}>
                      {student.riskCategory ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <Badge type="risk" value={student.riskCategory} />
                            {student.riskCategory !== 'INSUFFICIENT_DATA' && student.riskScore !== null && (
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                {student.riskScore}/100
                              </span>
                            )}
                            {student.riskDataStatus === 'PROVISIONAL' && (
                              <span style={{ fontSize: '11px', color: '#92400e', fontWeight: 600 }} title="Fewer than 10 school days or no marks recorded">
                                provisional
                              </span>
                            )}
                          </div>
                          {student.topRiskReason && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                              {student.topRiskReason}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Not assessed</span>
                      )}
                    </td>

                    <td>
                      <Badge type="studentStatus" value={student.status} />
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {can(PERMISSIONS.STUDENT_UPDATE) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Pencil}
                            onClick={() => openEdit(student)}
                            aria-label={`Edit ${student.fullName}`}
                          >
                            Edit
                          </Button>
                        )}
                        <Link
                          to={`/students/${student.id}`}
                          className="btn btn-outline btn-sm"
                          aria-label={`View profile of ${student.fullName}`}
                        >
                          <ExternalLink size={14} aria-hidden="true" />
                          Profile
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderTop: '1px solid var(--color-border-subtle)',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>
                Page {page} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <StudentFormModal
        isOpen={formOpen}
        student={editingStudent}
        onClose={() => {
          setFormOpen(false);
          setEditingStudent(null);
        }}
        onSaved={handleSaved}
      />
      {importOpen && <StudentImportModal onClose={() => setImportOpen(false)} onImported={handleImported} />}
    </div>
  );
}
