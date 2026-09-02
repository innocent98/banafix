-- Flip Instructor from one-to-one (instructors.courseId @unique) to a reusable
-- one-to-many roster (courses.instructorId), deduping the roster by normalized name.
-- Data-preserving: course→instructor links are transferred BEFORE courseId is dropped.

-- 1. Roster timestamps. Defaults populate existing rows; @updatedAt manages them after.
ALTER TABLE "instructors"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. New nullable FK column on courses + index.
ALTER TABLE "courses" ADD COLUMN "instructorId" TEXT;
CREATE INDEX "courses_instructorId_idx" ON "courses"("instructorId");

-- 3. Backfill: point each course at the CANONICAL instructor for its instructor's name.
--    Canonical = one row per btrim(lower(name)), highest rating (tie-break by id).
WITH canonical AS (
  SELECT DISTINCT ON (btrim(lower("name")))
         btrim(lower("name")) AS name_key, "id" AS canonical_id
  FROM "instructors"
  ORDER BY btrim(lower("name")), "rating" DESC, "id"
),
mapping AS (
  SELECT i."courseId" AS course_id, c.canonical_id
  FROM "instructors" i
  JOIN canonical c ON btrim(lower(i."name")) = c.name_key
  WHERE i."courseId" IS NOT NULL
)
UPDATE "courses" crs
SET "instructorId" = m.canonical_id
FROM mapping m
WHERE m.course_id = crs."id";

-- 4. Remove non-canonical (duplicate-name) instructor rows; canonical rows survive.
DELETE FROM "instructors"
WHERE "id" NOT IN (
  SELECT DISTINCT ON (btrim(lower("name"))) "id"
  FROM "instructors"
  ORDER BY btrim(lower("name")), "rating" DESC, "id"
);

-- 5. Drop the old one-to-one wiring now that links live on courses.instructorId.
ALTER TABLE "instructors" DROP CONSTRAINT "instructors_courseId_fkey";
DROP INDEX "instructors_courseId_key";
ALTER TABLE "instructors" DROP COLUMN "courseId";

-- 6. New FK: course -> instructor; null the course's link if the instructor is deleted.
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
