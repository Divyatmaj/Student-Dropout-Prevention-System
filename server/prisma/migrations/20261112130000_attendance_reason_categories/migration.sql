CREATE TYPE "AttendanceReasonCategory" AS ENUM (
  'ILLNESS',
  'TRANSPORT',
  'FAMILY_EMERGENCY',
  'APPOINTMENT',
  'OTHER'
);

ALTER TABLE "attendance"
ADD COLUMN "reasonCategory" "AttendanceReasonCategory";
