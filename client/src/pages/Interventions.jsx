import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ClipboardList,
  PlusCircle,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  UserCheck,
  ExternalLink,
  MessageSquare,
  History,
  Send,
  Sparkles,
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
  getInterventionsOverview,
  getInterventions,
  createIntervention,
  updateIntervention,
} from '../services/interventionService.js';
import { useAuth } from '../hooks/useAuth.js';

export default function Interventions() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlStudentId = searchParams.get('studentId') || '';
  const urlStudentName = searchParams.get('name') || '';

  const [overview, setOverview] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'completed'
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal 1: Create Intervention State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    studentId: urlStudentId || 'STU-1042',
    studentName: urlStudentName || 'Aarav Sharma',
    department: 'Computer Science',
    semester: '4',
    type: 'Academic Counseling',
    priority: 'urgent',
    counselorName: 'Dr. Radhika Sharma',
    scheduledDate: new Date().toISOString().split('T')[0],
    initialReason: 'Attendance threshold breach and failed unit tests.',
    notes: 'Initial counseling session to review missing assignments and establish attendance recovery.',
  });

  // Modal 2: Case History & Timeline Modal State
  const [selectedCase, setSelectedCase] = useState(null);
  const [newUpdateNote, setNewUpdateNote] = useState('');
  const [updateStatusChoice, setUpdateStatusChoice] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, listData] = await Promise.all([
        getInterventionsOverview(),
        getInterventions({
          status: statusFilter,
          priority: priorityFilter,
          type: typeFilter,
          search,
        }),
      ]);
      setOverview(overviewData);
      setInterventions(listData.interventions || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve intervention records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, typeFilter, search]);

  // If studentId came in via URL, pre-open create modal with their name
  useEffect(() => {
    if (urlStudentId) {
      setFormData((prev) => ({
        ...prev,
        studentId: urlStudentId,
        studentName: urlStudentName || 'Student',
      }));
      setIsCreateModalOpen(true);
    }
  }, [urlStudentId, urlStudentName]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('');
    setSearch('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateSuccessMsg('');
    try {
      await createIntervention(formData);
      setCreateSuccessMsg('Intervention record created successfully!');
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateSuccessMsg('');
        loadData();
      }, 1000);
    } catch (err) {
      alert(`Error creating intervention: ${err.message}`);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (caseId, newStatus) => {
    try {
      await updateIntervention(caseId, {
        status: newStatus,
        newNote: `Status updated to ${newStatus.replace('_', ' ').toUpperCase()} by ${user.name}.`,
        author: user.name,
      });
      loadData();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleAddTimelineUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdateNote.trim()) return;

    setUpdateSubmitting(true);
    try {
      const result = await updateIntervention(selectedCase.id, {
        status: updateStatusChoice || selectedCase.status,
        newNote: newUpdateNote,
        author: user.name,
      });
      setSelectedCase(result.updatedRecord);
      setNewUpdateNote('');
      loadData();
    } catch (err) {
      alert(`Error adding update: ${err.message}`);
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const isFiltered = statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter || search;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Intervention Management</h2>
          <p className="page-description">
            Schedule support interventions, assign academic counselors, track resolution statuses, and view chronological case histories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Log New Intervention
          </Button>
        </div>
      </div>

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
            title="Total Logged Cases"
            value={overview.totalCases.toLocaleString()}
            icon={ClipboardList}
            iconColor="var(--color-primary)"
            iconBg="var(--color-primary-subtle)"
            badgeText="All Cases"
            badgeType="default"
            subtitle="Active term interventions"
          />
          <StatCard
            title="Pending Cases"
            value={overview.pendingCount}
            icon={Clock}
            iconColor="var(--color-accent)"
            iconBg="var(--color-accent-subtle)"
            badgeText="Needs Action"
            badgeType="medium"
            subtitle="Awaiting initial session"
          />
          <StatCard
            title="In Progress"
            value={overview.inProgressCount}
            icon={UserCheck}
            iconColor="#0284c7"
            iconBg="#e0f2fe"
            badgeText="Active"
            badgeType="default"
            subtitle="Counseling underway"
          />
          <StatCard
            title="Resolved Cases"
            value={overview.completedCount}
            icon={CheckCircle2}
            iconColor="var(--color-risk-low)"
            iconBg="var(--color-risk-low-subtle)"
            badgeText="Resolved"
            badgeType="low"
            subtitle="Successful outcomes"
          />
        </div>
      )}

      {/* Filter and Search Bar Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        {/* Status Navigation Tabs */}
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
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'all' ? 'var(--color-primary)' : 'var(--color-bg-muted)',
              color: statusFilter === 'all' ? '#ffffff' : 'var(--color-text-secondary)',
            }}
          >
            All Cases ({overview ? overview.totalCases : 0})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'pending' ? '#b45309' : '#fef3c7',
              color: statusFilter === 'pending' ? '#ffffff' : '#92400e',
            }}
          >
            Pending ({overview ? overview.pendingCount : 0})
          </button>

          <button
            onClick={() => setStatusFilter('in_progress')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'in_progress' ? '#0284c7' : '#e0f2fe',
              color: statusFilter === 'in_progress' ? '#ffffff' : '#0369a1',
            }}
          >
            In Progress ({overview ? overview.inProgressCount : 0})
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'completed' ? 'var(--color-risk-low)' : 'var(--color-risk-low-subtle)',
              color: statusFilter === 'completed' ? '#ffffff' : 'var(--color-risk-low)',
            }}
          >
            Completed ({overview ? overview.completedCount : 0})
          </button>
        </div>

        {/* Search, Priority & Type Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by student name, ID, counselor, or case ID..."
              style={{ maxWidth: '320px' }}
            />

            {/* Priority Filter */}
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Priority</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal Priority</option>
            </select>

            {/* Type Filter */}
            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by intervention type"
            >
              <option value="">All Intervention Types</option>
              <option value="Academic Counseling">Academic Counseling</option>
              <option value="Attendance Warning & Parent Outreach">Attendance Warning & Parent Outreach</option>
              <option value="Peer Tutoring Assigned">Peer Tutoring</option>
              <option value="Remedial Classes">Remedial Classes</option>
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
            Showing {interventions.length} intervention record{interventions.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Main Intervention Roster Table & States */}
      {loading && <LoadingState message="Retrieving intervention cases and action histories..." />}

      {!loading && error && (
        <ErrorState
          title="Intervention Service Error"
          message={error}
          onRetry={loadData}
        />
      )}

      {!loading && !error && interventions.length === 0 && (
        <EmptyState
          title="No Interventions Found"
          message="No cases matched your active status, priority, or search filters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      )}

      {!loading && !error && interventions.length > 0 && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID & Scheduled Date</th>
                  <th>Student Info</th>
                  <th>Intervention Type & Counselor</th>
                  <th>Priority</th>
                  <th>Current Status</th>
                  <th>Counselor Remarks / Action Plan</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interventions.map((item) => (
                  <tr key={item.id}>
                    {/* Case ID & Date */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        {item.id}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Due: {item.scheduledDate}
                      </div>
                    </td>

                    {/* Student Info */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.studentName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {item.studentId} • {item.department} (Sem {item.semester})
                      </div>
                    </td>

                    {/* Type & Counselor */}
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '13px' }}>{item.type}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Counselor: {item.counselorName}
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td>
                      <Badge type="priority" value={item.priority} />
                    </td>

                    {/* Status Badge & Quick Status Selector */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <Badge type="status" value={item.status} />

                        <select
                          value={item.status}
                          onChange={(e) => handleQuickStatusChange(item.id, e.target.value)}
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-surface)',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                          aria-label={`Change status for case ${item.id}`}
                        >
                          <option value="pending">Mark Pending</option>
                          <option value="in_progress">Mark In Progress</option>
                          <option value="completed">Mark Completed</option>
                        </select>
                      </div>
                    </td>

                    {/* Counselor Remarks Preview */}
                    <td style={{ maxWidth: '260px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                      {item.notes}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={History}
                          onClick={() => {
                            setSelectedCase(item);
                            setUpdateStatusChoice(item.status);
                          }}
                          title="View case timeline and progress history"
                        >
                          Timeline
                        </Button>

                        <Link to={`/students/${item.studentId}`}>
                          <Button variant="outline" size="sm" icon={ExternalLink} title="View student profile">
                            Profile
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

      {/* Modal 1: Create New Intervention */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Log New Student Intervention Case"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              onClick={handleCreateSubmit}
              disabled={createSubmitting || !formData.studentName || !formData.notes}
            >
              {createSubmitting ? 'Creating Case...' : 'Schedule Intervention'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {createSuccessMsg && (
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
              {createSuccessMsg}
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
              <label className="form-label" htmlFor="type">Intervention Type</label>
              <select
                id="type"
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Academic Counseling">Academic Counseling</option>
                <option value="Attendance Warning & Parent Outreach">Attendance Warning & Parent Outreach</option>
                <option value="Remedial Classes">Remedial Classes</option>
                <option value="Peer Tutoring Assigned">Peer Tutoring</option>
                <option value="Psychological Wellbeing">Psychological Wellbeing</option>
                <option value="Financial Aid Review">Financial Aid Review</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="priority">Priority Level</label>
              <select
                id="priority"
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="counselorName">Assigned Counselor *</label>
              <input
                id="counselorName"
                className="form-input"
                type="text"
                required
                value={formData.counselorName}
                onChange={(e) => setFormData({ ...formData, counselorName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="scheduledDate">Scheduled Date</label>
              <input
                id="scheduledDate"
                className="form-input"
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">Initial Assessment & Counselor Notes *</label>
            <textarea
              id="notes"
              className="form-input"
              rows={3}
              required
              placeholder="Outline the diagnostic reasons, planned remedial steps, or meeting agenda..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>

      {/* Modal 2: Case Timeline & History Viewer */}
      {selectedCase && (
        <Modal
          isOpen={Boolean(selectedCase)}
          onClose={() => setSelectedCase(null)}
          title={`Intervention Case: ${selectedCase.id} • ${selectedCase.studentName}`}
          footer={
            <Button variant="secondary" size="md" onClick={() => setSelectedCase(null)}>
              Close Timeline
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Header Summary */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--color-bg-muted)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedCase.type}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Student ID: {selectedCase.studentId} • Counselor: {selectedCase.counselorName}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge type="priority" value={selectedCase.priority} />
                <Badge type="status" value={selectedCase.status} />
              </div>
            </div>

            {/* Chronological History Log */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                Chronological Case Progression Log
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedCase.history && selectedCase.history.length > 0 ? (
                  selectedCase.history.map((log, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid var(--color-primary)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                          {log.action}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
                          {log.timestamp} • {log.author}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                        {log.note}
                      </p>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    No recorded timeline events.
                  </div>
                )}
              </div>
            </div>

            {/* Append New Update / Note Form */}
            <form
              onSubmit={handleAddTimelineUpdate}
              style={{
                marginTop: '10px',
                padding: '16px',
                backgroundColor: 'var(--color-bg-muted)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Add New Case Progress Note
              </h5>

              <textarea
                className="form-input"
                rows={2}
                required
                placeholder="Log notes from follow-up meeting, counseling progress, or resolution remarks..."
                value={newUpdateNote}
                onChange={(e) => setNewUpdateNote(e.target.value)}
                style={{ resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="updateStatusSelect" style={{ fontSize: '12px', fontWeight: 600 }}>Update Status:</label>
                  <select
                    id="updateStatusSelect"
                    className="form-select"
                    value={updateStatusChoice}
                    onChange={(e) => setUpdateStatusChoice(e.target.value)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed (Resolved)</option>
                  </select>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={Send}
                  disabled={updateSubmitting || !newUpdateNote.trim()}
                >
                  {updateSubmitting ? 'Posting...' : 'Post Update'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
