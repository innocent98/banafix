-- Pre-flight (Step 1): NOT run against the real deploy DB in this session (verification is
-- scoped to an ephemeral scratch Postgres only; the real DATABASE_URL is a Prisma Accelerate
-- proxy and was intentionally left untouched). gen_random_uuid() is confirmed available on the
-- scratch Postgres (postgres:16-alpine, pgcrypto builtin/no extension needed there). Before this
-- migration is applied to the real deploy DB, someone with access must run:
--   SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto'); SELECT gen_random_uuid();
-- and uncomment the line below if gen_random_uuid() errors there.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. New tables
CREATE TABLE "students" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "address" TEXT,
  "landmark" TEXT,
  "guardianName" TEXT,
  "guardianPhone" TEXT,
  "guardianEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType","entityId");
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- 2. Add nullable FK column
ALTER TABLE "enrollments" ADD COLUMN "studentId" TEXT;

-- 3. Backfill: one student per lower(email), most-recent enrollment wins
INSERT INTO "students" ("id","email","firstName","lastName","phone","dateOfBirth",
                        "address","landmark","guardianName","guardianPhone","guardianEmail",
                        "createdAt","updatedAt")
SELECT gen_random_uuid()::text, s."email", s."firstName", s."lastName", s."phone", s."dateOfBirth",
       s."address", s."landmark", s."guardianName", s."guardianPhone", s."guardianEmail",
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON (btrim(lower("email")))
         btrim(lower("email")) AS "email", "firstName", "lastName", "phone", "dateOfBirth",
         "address", "landmark", "guardianName", "guardianPhone", "guardianEmail"
  FROM "enrollments"
  ORDER BY btrim(lower("email")), "createdAt" DESC
) s;

UPDATE "enrollments" e
SET "studentId" = st."id"
FROM "students" st
WHERE btrim(lower(e."email")) = st."email";

-- 4. Enforce FK + NOT NULL
ALTER TABLE "enrollments" ALTER COLUMN "studentId" SET NOT NULL;
ALTER TABLE "enrollments"
  ADD CONSTRAINT "enrollments_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- 5. Relax dormant identity columns (kept, unused; dropped in migration 2)
ALTER TABLE "enrollments" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "enrollments" ALTER COLUMN "firstName" DROP NOT NULL;
ALTER TABLE "enrollments" ALTER COLUMN "lastName" DROP NOT NULL;

-- 6. Status flip: paid == enrolled
UPDATE "enrollments"
SET "status" = 'enrolled'
WHERE "status" = 'application_paid' OR "applicationPaid" = true;

-- 7. Index for dedup lookups (findFirst/deleteMany by studentId+courseId)
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");
