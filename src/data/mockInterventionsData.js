/**
 * ============================================================================
 * Backend Contract & Mock Dataset for Intervention Management Module
 * ============================================================================
 * 
 * BACKEND DEVELOPER INTEGRATION NOTES:
 * ----------------------------------------------------------------------------
 * This file models the exact schema for the Express + PostgreSQL backend.
 * 
 * 1. GET /interventions
 *    - Query params supported:
 *        status: 'all' | 'pending' | 'in_progress' | 'completed'
 *        priority: 'all' | 'urgent' | 'high' | 'normal'
 *        type: string
 *        search: string
 *    - Expected Response: {
 *        overview: {
 *          totalCases: number,
 *          pendingCount: number,
 *          inProgressCount: number,
 *          completedCount: number,
 *          urgentCount: number
 *        },
 *        interventions: InterventionItem[]
 *      }
 * 
 * 2. POST /interventions
 *    - Request Body: {
 *        studentId: string,
 *        studentName: string,
 *        type: string,
 *        priority: 'urgent' | 'high' | 'normal',
 *        counselorName: string,
 *        scheduledDate: string,
 *        notes: string
 *      }
 *    - Expected Response: { success: true, record: InterventionItem }
 * 
 * 3. PATCH /interventions/:id
 *    - Request Body: {
 *        status?: 'pending' | 'in_progress' | 'completed',
 *        newNote?: string,
 *        resolutionRemarks?: string
 *      }
 *    - Expected Response: { success: true, updatedRecord: InterventionItem }
 * ============================================================================
 */

export const mockInterventionsOverview = {
  totalCases: 24,
  pendingCount: 7,
  inProgressCount: 9,
  completedCount: 8,
  urgentCount: 5,
};

export const mockInterventionsList = [
  {
    id: 'INT-401',
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: 4,
    type: 'Academic Counseling',
    priority: 'urgent',
    status: 'pending',
    counselorName: 'Dr. Radhika Sharma',
    createdDate: '2026-11-05',
    scheduledDate: '2026-11-08',
    initialReason: 'Attendance dropped to 52.8% and failed 3 core assessments.',
    notes: 'Scheduled in-person meeting with student and department advisor to establish remedial roadmap.',
    history: [
      {
        timestamp: '2026-11-05 10:30 AM',
        author: 'Dr. Radhika Sharma',
        action: 'Case Created',
        note: 'Triggered automatically by High-Risk rule breach (< 65% attendance). Assigned urgent priority.',
      },
      {
        timestamp: '2026-11-06 02:15 PM',
        author: 'Dr. Radhika Sharma',
        action: 'Student Contacted',
        note: 'Sent formal meeting invite for Nov 8 at 11:00 AM. Awaiting student confirmation.',
      },
    ],
  },
  {
    id: 'INT-398',
    studentId: 'STU-1089',
    studentName: 'Sneha Patel',
    department: 'Electronics',
    semester: 6,
    type: 'Attendance Warning & Parent Outreach',
    priority: 'high',
    status: 'in_progress',
    counselorName: 'Prof. Amit Verma',
    createdDate: '2026-11-04',
    scheduledDate: '2026-11-07',
    initialReason: 'Chronic absence trend (58.0% attendance) and failed DSP mid-term exam.',
    notes: 'Parent telephonic check-in conducted. Mother confirmed family health situation. Flexible morning lab schedule approved.',
    history: [
      {
        timestamp: '2026-11-04 11:00 AM',
        author: 'Prof. Amit Verma',
        action: 'Case Created',
        note: 'High-risk attendance flag issued by department office.',
      },
      {
        timestamp: '2026-11-05 04:30 PM',
        author: 'Prof. Amit Verma',
        action: 'Parent Call Completed',
        note: 'Discussed supportive adjustment plan. Student will attend makeup practicals on Saturdays.',
      },
    ],
  },
  {
    id: 'INT-395',
    studentId: 'STU-1011',
    studentName: 'Priya Nair',
    department: 'Computer Science',
    semester: 2,
    type: 'Peer Tutoring Assigned',
    priority: 'normal',
    status: 'completed',
    counselorName: 'Dr. Radhika Sharma',
    createdDate: '2026-10-25',
    scheduledDate: '2026-10-28',
    initialReason: 'Voluntary request for advanced algorithms tutorial.',
    notes: 'Assigned as peer tutor for 1st-year students after scoring 44/50 in Data Structures.',
    history: [
      {
        timestamp: '2026-10-25 09:00 AM',
        author: 'Dr. Radhika Sharma',
        action: 'Tutoring Program Registered',
        note: 'Enrolled in student mentorship initiative.',
      },
      {
        timestamp: '2026-11-03 03:00 PM',
        author: 'Dr. Radhika Sharma',
        action: 'Program Completed',
        note: 'Successfully conducted 3 peer study sessions. Student in good standing.',
      },
    ],
  },
  {
    id: 'INT-392',
    studentId: 'STU-1120',
    studentName: 'Rohan Deshmukh',
    department: 'Mechanical',
    semester: 2,
    type: 'Remedial Classes',
    priority: 'high',
    status: 'in_progress',
    counselorName: 'Prof. Neha Gupta',
    createdDate: '2026-11-02',
    scheduledDate: '2026-11-09',
    initialReason: 'Failed thermodynamics practical evaluation (score 9/25) due to missed labs.',
    notes: 'Enrolled in special evening lab batch. Instructor monitoring report submissions.',
    history: [
      {
        timestamp: '2026-11-02 01:15 PM',
        author: 'Prof. Neha Gupta',
        action: 'Case Opened',
        note: 'Lab attendance and failure risk logged.',
      },
      {
        timestamp: '2026-11-04 10:00 AM',
        author: 'Dr. Sandeep Patil',
        action: 'Lab Schedule Assigned',
        note: 'Student scheduled for two remedial experimental sessions on Nov 9 & 11.',
      },
    ],
  },
  {
    id: 'INT-387',
    studentId: 'STU-1194',
    studentName: 'Ananya Iyer',
    department: 'Civil Engineering',
    semester: 4,
    type: 'Academic Counseling',
    priority: 'normal',
    status: 'pending',
    counselorName: 'Prof. H. Banerjee',
    createdDate: '2026-10-30',
    scheduledDate: '2026-11-10',
    initialReason: 'Borderline exam score (19/50) in Structural Mechanics.',
    notes: 'Faculty review scheduled to discuss problem-solving technique in bending moments.',
    history: [
      {
        timestamp: '2026-10-30 02:45 PM',
        author: 'Prof. H. Banerjee',
        action: 'Case Created',
        note: 'Medium risk trigger after mid-term evaluation.',
      },
    ],
  },
  {
    id: 'INT-381',
    studentId: 'STU-1205',
    studentName: 'Vikram Joshi',
    department: 'Information Tech',
    semester: 6,
    type: 'Attendance Warning & Parent Outreach',
    priority: 'normal',
    status: 'completed',
    counselorName: 'Prof. Meera Sen',
    createdDate: '2026-10-22',
    scheduledDate: '2026-10-24',
    initialReason: 'Attendance approached 69.8% cutoff.',
    notes: 'Advisory meeting held. Student presented local transport pass disruption proof. Attendance recovered to 74% in last 2 weeks.',
    history: [
      {
        timestamp: '2026-10-22 11:30 AM',
        author: 'Prof. Meera Sen',
        action: 'Warning Issued',
        note: 'Automated notice sent.',
      },
      {
        timestamp: '2026-10-24 03:00 PM',
        author: 'Prof. Meera Sen',
        action: 'Meeting Held',
        note: 'Case resolved with commitment to maintain > 75% attendance.',
      },
    ],
  },
  {
    id: 'INT-376',
    studentId: 'STU-1231',
    studentName: 'Pooja Verma',
    department: 'Computer Science',
    semester: 4,
    type: 'Remedial Classes',
    priority: 'normal',
    status: 'completed',
    counselorName: 'Dr. Radhika Sharma',
    createdDate: '2026-10-15',
    scheduledDate: '2026-10-20',
    initialReason: 'Missed OS concurrency tutorials.',
    notes: 'Completed 2 hours of self-paced online lecture modules.',
    history: [
      {
        timestamp: '2026-10-15 01:00 PM',
        author: 'Dr. Radhika Sharma',
        action: 'Tutorial Assigned',
        note: 'Course materials provided.',
      },
      {
        timestamp: '2026-10-20 05:00 PM',
        author: 'Dr. Radhika Sharma',
        action: 'Assessment Verified',
        note: 'Student passed practice quiz with 85% score.',
      },
    ],
  },
];
