import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { UserPlus, Users, RotateCcw, CheckCircle2, AlertCircle, Pencil, UserX, UserCheck } from 'lucide-react';

import Button from '../components/common/Button.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import StaffFormModal from '../components/staff/StaffFormModal.jsx';
import '../components/common/common.css';

import { getStaff, setStaffStatus } from '../services/staffService.js';
import { useAuth } from '../hooks/useAuth.js';
import { PERMISSIONS, ROLE_LABELS } from '../utils/permissions.js';
import { STAFF_ROLES } from '../constants/staff.js';
import { formatDate, getInitials } from '../utils/formatters.js';

const DEFAULT_FILTERS = { role: '', status: '' };

/** Staff accounts — school admins manage, principals can view. */
export default function StaffPage() {
  const { can } = useAuth();
  if (!can(PERMISSIONS.STAFF_VIEW)) return <Navigate to="/dashboard" replace />;
  return <Staff />;
}

function Staff() {
  const { user, can } = useAuth();
  const canManage = can(PERMISSIONS.STAFF_MANAGE);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [notice, setNotice] = useState(null); // { type, text }
  const [editing, setEditing] = useState(null); // null | 'new' | staff
  const [confirming, setConfirming] = useState(null); // staff to activate/deactivate
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getStaff({ ...filters, search });
      setStaff(result.users);
    } catch (err) {
      setError(err.message || 'Could not load staff.');
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const isFiltered = search || filters.role || filters.status;
  const reset = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
  };

  const handleToggle = async () => {
    const target = confirming;
    setToggling(true);
    try {
      const saved = await setStaffStatus(target.id, !target.isActive);
      setNotice({
        type: 'success',
        text: saved.isActive ? `${saved.name} can sign in again.` : `${saved.name} has been deactivated and can no longer sign in.`,
      });
      setConfirming(null);
      load();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Could not change the account status.' });
      setConfirming(null);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Staff</h2>
          <p className="page-description">
            Accounts for staff at your school. There is no public sign-up — a school admin creates each account.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" size="md" icon={UserPlus} onClick={() => setEditing('new')}>
            Add Staff Member
          </Button>
        )}
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." style={{ maxWidth: '280px' }} />
          <select className="filter-select" value={filters.role} onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))} aria-label="Filter by role">
            <option value="">All roles</option>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <select className="filter-select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} aria-label="Filter by account status">
            <option value="">Active &amp; inactive</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {isFiltered && <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>Reset</Button>}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {staff.length} account{staff.length === 1 ? '' : 's'}
        </div>
      </div>

      {notice && (
        <div className={`alert ${notice.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status" style={{ marginBottom: '16px' }}>
          {notice.type === 'error' ? <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> : <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />}
          <span>{notice.text}</span>
        </div>
      )}

      {loading && staff.length === 0 && <LoadingState message="Loading staff..." />}
      {!loading && error && <ErrorState title="Unable to Load Staff" message={error} onRetry={load} />}
      {!loading && !error && staff.length === 0 && (
        <EmptyState
          icon={Users}
          title="No Staff Found"
          message={isFiltered ? 'No accounts match these filters.' : 'Add the first staff account for your school.'}
          actionLabel={isFiltered ? 'Reset Filters' : canManage ? 'Add Staff Member' : undefined}
          onAction={isFiltered ? reset : () => setEditing('new')}
        />
      )}

      {!error && staff.length > 0 && (
        <div className="card" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Workload</th>
                  <th>Account</th>
                  {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} style={s.isActive ? undefined : { opacity: 0.7 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px', flexShrink: 0 }}>{getInitials(s.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {s.name}
                            {s.id === user?.id && <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}> (you)</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{ROLE_LABELS[s.role]}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {s.role === 'TEACHER' && <div>{s.assignedStudents} assigned student{s.assignedStudents === 1 ? '' : 's'}</div>}
                      <div>{s.openInterventions} open intervention{s.openInterventions === 1 ? '' : 's'}</div>
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-staff-active' : 'badge-staff-inactive'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>since {formatDate(s.createdAt)}</div>
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}>Edit</Button>
                          {s.id !== user?.id && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={s.isActive ? UserX : UserCheck}
                              onClick={() => setConfirming(s)}
                            >
                              {s.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <StaffFormModal
          staff={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setNotice({ type: 'success', text: editing === 'new' ? `Created an account for ${saved.name}.` : `Saved changes to ${saved.name}.` });
            setEditing(null);
            load();
          }}
        />
      )}

      {confirming && (
        <Modal
          isOpen
          onClose={toggling ? () => {} : () => setConfirming(null)}
          title={confirming.isActive ? `Deactivate ${confirming.name}?` : `Activate ${confirming.name}?`}
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setConfirming(null)} disabled={toggling}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleToggle} disabled={toggling}>
                {toggling ? 'Saving...' : confirming.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </>
          }
        >
          <p style={{ fontSize: '14px', lineHeight: 1.6 }}>
            {confirming.isActive
              ? 'They will not be able to sign in or be given new interventions. Their records, attendance entries and history are kept.'
              : 'They will be able to sign in again with their existing password.'}
          </p>
          {confirming.isActive && confirming.openInterventions > 0 && (
            <div className="alert alert-info" style={{ marginTop: '12px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                {confirming.name} owns {confirming.openInterventions} open intervention{confirming.openInterventions === 1 ? '' : 's'}.
                Reassign {confirming.openInterventions === 1 ? 'it' : 'them'} from the Interventions page.
              </span>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
