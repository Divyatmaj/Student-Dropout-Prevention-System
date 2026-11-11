import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileUp } from 'lucide-react';

import Modal, { ModalCloseButton } from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { importStudentsBulk, previewStudentImport } from '../../services/studentService.js';
import { parseStudentCsv, STUDENT_CSV_TEMPLATE, STUDENT_IMPORT_MAX_FILE_BYTES, STUDENT_IMPORT_MAX_ROWS } from '../../utils/studentCsv.js';

function downloadTemplate() {
  const blob = new Blob([STUDENT_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'udaan-student-import-template.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function StudentImportModal({ onClose, onImported }) {
  const [fileName, setFileName] = useState('');
  const [sourceRows, setSourceRows] = useState([]);
  const [ignoredColumns, setIgnoredColumns] = useState([]);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const previewFile = async (file) => {
    setPreview(null);
    setSourceRows([]);
    setIgnoredColumns([]);
    setError('');
    if (!file) return;
    if (file.size > STUDENT_IMPORT_MAX_FILE_BYTES) {
      setError(`Choose a CSV smaller than ${Math.round(STUDENT_IMPORT_MAX_FILE_BYTES / 1024)} KB.`);
      return;
    }

    setWorking(true);
    setFileName(file.name);
    try {
      const parsed = parseStudentCsv(await file.text());
      if (parsed.rows.length > STUDENT_IMPORT_MAX_ROWS) {
        throw new Error(`Import at most ${STUDENT_IMPORT_MAX_ROWS} students at a time. This CSV has ${parsed.rows.length}.`);
      }
      setSourceRows(parsed.rows);
      setIgnoredColumns(parsed.ignoredColumns);
      setPreview(await previewStudentImport(parsed.rows));
    } catch (err) {
      setError(err.message || 'Could not read this CSV file.');
    } finally {
      setWorking(false);
    }
  };

  const retryPreview = async () => {
    setWorking(true);
    setError('');
    try {
      setPreview(await previewStudentImport(sourceRows));
    } catch (err) {
      setError(err.message || 'Could not validate these rows. Try again.');
    } finally {
      setWorking(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.errorCount || preview.validCount === 0) return;
    setWorking(true);
    setError('');
    try {
      onImported(await importStudentsBulk(sourceRows));
    } catch (err) {
      setError(err.message || 'Could not import these students. Preview the CSV again and retry.');
      setWorking(false);
    }
  };

  const canImport = preview && preview.validCount > 0 && preview.errorCount === 0 && !working;

  return (
    <Modal
      isOpen
      size="lg"
      title="Bulk Import Students"
      onClose={onClose}
      closeDisabled={working}
      hasUnsavedChanges={sourceRows.length > 0}
      footer={(
        <>
          <ModalCloseButton variant="secondary" size="md" disabled={working}>Cancel</ModalCloseButton>
          <Button variant="primary" size="md" icon={FileUp} onClick={handleImport} disabled={!canImport}>
            {working ? 'Please wait…' : preview?.validCount ? `Import ${preview.validCount} students` : 'Import students'}
          </Button>
        </>
      )}
    >
      <div className="student-import-content">
        <div className="alert alert-info">
          <span>Upload a CSV to validate every row before any students are added. Imports are all-or-nothing and limited to {STUDENT_IMPORT_MAX_ROWS} students per batch.</span>
        </div>

        <div className="student-import-toolbar">
          <label className="student-import-file">
            <span className="form-label">Choose CSV file</span>
            <input type="file" accept=".csv,text/csv" disabled={working} onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              previewFile(file);
            }} />
          </label>
          <Button variant="secondary" size="sm" icon={Download} onClick={downloadTemplate}>Download template</Button>
        </div>

        <p className="form-helper">
          Required columns: <code>studentCode</code>, <code>fullName</code>, <code>grade</code>. Optional columns include section, dates (YYYY-MM-DD), guardian details, support notes, financialBarrierReported, and classTeacherEmail.
        </p>
        <p className="form-helper">
          Valid financial barrier values: true/false, yes/no, or 1/0. Class teacher must be an active teacher’s email in this school.
        </p>

        {fileName && <p className="student-import-filename">Selected: <strong>{fileName}</strong></p>}
        {error && <div className="alert alert-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
        {ignoredColumns.length > 0 && (
          <div className="alert alert-info" role="status">These CSV columns aren’t used and will be ignored: {ignoredColumns.join(', ')}.</div>
        )}
        {working && <p className="form-helper" role="status">{preview ? 'Importing students…' : 'Reading file and checking student rows…'}</p>}
        {sourceRows.length > 0 && !preview && !working && (
          <Button variant="secondary" size="sm" onClick={retryPreview}>Retry validation</Button>
        )}

        {preview && (
          <>
            <div className={`student-import-summary${preview.errorCount ? ' has-errors' : ''}`} role="status">
              {preview.errorCount ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
              <span>
                {preview.validCount} ready to import · {preview.errorCount} issue{preview.errorCount === 1 ? '' : 's'} across {preview.rows.length} row{preview.rows.length === 1 ? '' : 's'}
              </span>
            </div>
            {preview.errorCount > 0 && <p className="form-helper">Fix these rows in the CSV, then upload the corrected file. Nothing will be added until every row is valid.</p>}
            <div className="table-responsive student-import-preview">
              <table className="data-table">
                <thead>
                  <tr><th>Row</th><th>Student code</th><th>Name</th><th>Grade</th><th>Result</th></tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>{row.values.studentCode || '—'}</td>
                      <td>{row.values.fullName || '—'}</td>
                      <td>{row.values.grade ? `Grade ${row.values.grade}${row.values.section ? ` · ${row.values.section}` : ''}` : '—'}</td>
                      <td>
                        {row.errors.length === 0 ? (
                          <span className="student-import-valid">Ready</span>
                        ) : (
                          <ul className="student-import-errors">
                            {row.errors.map((item, index) => <li key={`${item.field}-${index}`}><strong>{item.field}:</strong> {item.message}</li>)}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
