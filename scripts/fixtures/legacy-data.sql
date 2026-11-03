-- Legacy-data fixture for scripts/verify-migration.sh.
-- Loaded onto the schema AS OF 20260902114015_instructor_roster, i.e. before the
-- assessment-first migration. Mirrors what production looks like today.
INSERT INTO delivery_modes (id, name, "isActive", "order", "updatedAt") VALUES
  ('dm_onsite',  'On-site',       true, 1, now()),
  ('dm_one',     'One-on-One',    true, 2, now()),
  ('dm_online',  'Online',        true, 3, now()),
  ('dm_home',    'Home Training', true, 4, now());

INSERT INTO courses (id, title, instrument, level, duration, location, "availableModes", pricing, "isActive", "isPublished", "updatedAt") VALUES
  -- two modes, normal location
  ('c_lagos_gtr', 'Guitar Foundations', 'Guitar', 'Beginner', '12 weeks', 'Lagos',
   ARRAY['On-site','One-on-One'], '{"On-site":25000,"One-on-One":30000}', true, true, now()),
  -- online course (location text is 'Online')
  ('c_online_pno', 'Piano Online', 'Piano', 'All Levels', '12 weeks', 'Online',
   ARRAY['Online'], '{"Online":20000}', true, true, now()),
  -- padded / mixed-case location, plus a mode name with NO DeliveryMode row ('Masterclass')
  ('c_ondo_drm', 'Drums Ondo', 'Drums', 'Intermediate', '8 weeks', '  ONDO ',
   ARRAY['On-site','Masterclass'], '{"On-site":15000,"Masterclass":40000}', true, false, now()),
  -- location NOT in lib/locations.ts at all
  ('c_kano_vox', 'Vocals Kano', 'Vocals', 'Beginner', '8 weeks', 'Kano',
   ARRAY['On-site'], '{"On-site":12000}', true, true, now()),
  -- slug collision with the seeded 'Port Harcourt' (both slugify to port-harcourt)
  ('c_ph_dash', 'Keys PH', 'Piano', 'Beginner', '8 weeks', 'Port-Harcourt',
   ARRAY['On-site'], '{"On-site":18000}', true, true, now()),
  -- location with no ASCII letters/digits (empty base slug) and an International (ONLINE-kind) location
  ('c_nonascii', 'Violin Yaba', 'Violin', 'Beginner', '8 weeks', 'ÀÈÌ',
   ARRAY['On-site'], '{"On-site":16000}', true, true, now()),
  ('c_intl', 'Vocals International', 'Vocals', 'All Levels', '8 weeks', 'International',
   ARRAY['online'], '{"online":9000}', true, true, now()),
  -- empty location text: no Location can be created, enrollment keeps locationId NULL
  ('c_noloc', 'Bass No Location', 'Bass', 'Beginner', '8 weeks', '',
   ARRAY['On-site'], '{"On-site":14000}', true, false, now());

INSERT INTO students (id, email, "firstName", "lastName", "updatedAt") VALUES
  ('s1', 'ada@example.com',  'Ada',  'Obi',  now()),
  ('s2', 'tunde@example.com','Tunde','Bello',now()),
  ('s3', 'chi@example.com',  'Chi',  'Eze',  now()),
  ('s4', 'dayo@example.com', 'Dayo', 'Ade',  now());

INSERT INTO enrollments (id, "courseId", "studentId", "selectedMode", status, "applicationPaid", "applicationFeeAmount", "updatedAt") VALUES
  ('e_paid',    'c_lagos_gtr',  's1', 'On-site',       'enrolled', true,  5000, now()),
  ('e_pending', 'c_lagos_gtr',  's2', 'One-on-One',    'pending',  false, 5000, now()),
  ('e_online',  'c_online_pno', 's3', 'Online',        'enrolled', true,  5000, now()),
  ('e_ondo',    'c_ondo_drm',   's4', 'Masterclass',   'pending',  false, 2000, now()),
  ('e_kano',    'c_kano_vox',   's1', 'On-site',       'cancelled',false, 2000, now()),
  ('e_apppaid', 'c_ph_dash',    's2', 'On-site',       'application_paid', true, 2000, now()),
  ('e_noloc',   'c_noloc',      's3', 'On-site',       'pending',  false, NULL, now());

INSERT INTO application_payments (id, "enrollmentId", amount, "paymentMethod", "paystackReference", "paystackStatus", status, "paidAt", "receiptNumber", "billingEmail", "billingName", "updatedAt") VALUES
  ('ap1', 'e_paid',    5000, 'card', 'ref_paid_1',    'success', 'completed', now(), 'APP-1-aaaaaa', 'ada@example.com',   'Ada Obi',  now()),
  ('ap2', 'e_pending', 5000, 'pending', 'ref_pending_1','pending','pending',   NULL,  'APP-2-bbbbbb', 'tunde@example.com', 'Tunde Bello', now());

INSERT INTO tuition_payments (id, "enrollmentId", amount, "paymentMethod", status, "paidAt", "receiptNumber", "updatedAt") VALUES
  ('tp1', 'e_paid', 25000, 'cash', 'completed', now(), 'TUI-1-cccccc', now());
