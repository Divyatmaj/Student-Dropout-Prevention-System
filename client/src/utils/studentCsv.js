const HEADER_FIELDS = {
  studentcode: 'studentCode',
  studentid: 'studentCode',
  fullname: 'fullName',
  name: 'fullName',
  studentname: 'fullName',
  grade: 'grade',
  section: 'section',
  dateofbirth: 'dateOfBirth',
  dob: 'dateOfBirth',
  admissiondate: 'admissionDate',
  guardianname: 'guardianName',
  guardianphone: 'guardianPhone',
  guardianrelationship: 'guardianRelationship',
  financialbarrierreported: 'financialBarrierReported',
  supportnotes: 'supportNotes',
  strengthsinterests: 'strengthsInterests',
  classteacheremail: 'classTeacherEmail',
  teacheremail: 'classTeacherEmail',
};

const REQUIRED_HEADERS = ['studentCode', 'fullName', 'grade'];

function parseRecords(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell.length === 0) {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (inQuotes) throw new Error('A quoted value is not closed. Check the CSV file and try again.');
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

/** Read the supported student CSV headers and turn each record into a row object. */
export function parseStudentCsv(text) {
  const records = parseRecords(String(text).replace(/^\uFEFF/, ''));
  if (records.length < 2) throw new Error('The CSV needs a header row and at least one student row.');

  const mappedHeaders = records[0].map((header) => {
    const key = header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return HEADER_FIELDS[key] || null;
  });
  const recognized = mappedHeaders.filter(Boolean);
  if (new Set(recognized).size !== recognized.length) {
    throw new Error('The CSV has duplicate columns for the same student field. Keep only one of each column.');
  }
  const fields = new Set(mappedHeaders.filter(Boolean));
  const missing = REQUIRED_HEADERS.filter((header) => !fields.has(header));
  if (missing.length) throw new Error(`Missing required CSV column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`);

  const rows = records.slice(1).map((cells, index) => {
    const values = { rowNumber: index + 2 };
    mappedHeaders.forEach((field, cellIndex) => {
      if (field) values[field] = (cells[cellIndex] ?? '').trim();
    });
    return values;
  });
  return { rows, ignoredColumns: records[0].filter((header, index) => !mappedHeaders[index] && header.trim()) };
}

export const STUDENT_IMPORT_MAX_ROWS = 50;
export const STUDENT_IMPORT_MAX_FILE_BYTES = 45 * 1024;

export const STUDENT_CSV_TEMPLATE = [
  'studentCode,fullName,grade,section,dateOfBirth,admissionDate,guardianName,guardianPhone,guardianRelationship,financialBarrierReported,supportNotes,strengthsInterests,classTeacherEmail',
].join('\n');
