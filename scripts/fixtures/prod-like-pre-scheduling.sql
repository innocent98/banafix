-- Production-like data loaded onto the schema AS OF "every migration except 20261103170000_scheduling"
-- (what production has applied today). Used by scripts/verify-scheduling-deploy.sh.
INSERT INTO instructors (id, name, credentials, rating, verified, "updatedAt") VALUES
  ('i1', 'Ada Okafor', ARRAY['ABRSM']::text[], 5, true, now()),
  ('i2', 'Tunde Bello', ARRAY[]::text[], 4, true, now()),
  ('i3', 'No Courses', ARRAY[]::text[], 0, false, now());
INSERT INTO courses (id, title, instrument, level, "instructorId", "isActive", "isPublished", "updatedAt") VALUES
  ('c1', 'Guitar Foundations', 'Guitar', 'Beginner', 'i1', true, true, now()),
  ('c2', 'Piano Online', 'Piano', 'All Levels', 'i1', true, true, now()),
  ('c3', 'Drums', 'Drums', 'Intermediate', 'i2', true, false, now()),
  ('c4', 'Vocals (no instructor yet)', 'Vocals', 'Beginner', NULL, true, true, now());
INSERT INTO students (id, email, "firstName", "lastName", "updatedAt") VALUES
  ('s1', 'ada@example.com', 'Ada', 'Obi', now()), ('s2', 'tunde@example.com', 'Tunde', 'Bello', now()), ('s3', 'chi@example.com', 'Chi', 'Eze', now());
INSERT INTO enrollments (id, "courseId", "studentId", "selectedMode", status, "applicationPaid", "preferredDays", "schedulePreference", "durationMins", "classesPerWeek", "plannedClasses", "ratePerClass", "updatedAt") VALUES
  ('e1', 'c1', 's1', 'On-site', 'enrolled', true, ARRAY['Monday','Wednesday'], 'weekday-morning', NULL, NULL, NULL, NULL, now()),
  ('e2', 'c1', 's2', 'On-site', 'plan_agreed', true, ARRAY[]::text[], NULL, 60, 2, 12, 5000, now()),
  ('e3', 'c2', 's3', 'Online', 'pending', false, NULL, 'flexible', NULL, NULL, NULL, NULL, now()),
  ('e4', 'c3', 's1', 'On-site', 'cancelled', false, ARRAY['tue'], NULL, NULL, NULL, NULL, NULL, now());
