-- CreateTable
CREATE TABLE "parent_meeting_logs" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "meetingDate" DATE NOT NULL,
    "attendees" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "followUpActions" TEXT,
    "followUpDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_meeting_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parent_meeting_logs_schoolId_studentId_meetingDate_idx"
ON "parent_meeting_logs"("schoolId", "studentId", "meetingDate");

-- AddForeignKey
ALTER TABLE "parent_meeting_logs" ADD CONSTRAINT "parent_meeting_logs_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_meeting_logs" ADD CONSTRAINT "parent_meeting_logs_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_meeting_logs" ADD CONSTRAINT "parent_meeting_logs_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
