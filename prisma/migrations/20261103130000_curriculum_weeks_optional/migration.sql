-- Curriculum module timeframe is now optional: courses are structured in
-- modules (normally 12), not weeks. Additive and data-preserving; existing
-- values such as "Weeks 1-2" are untouched.
ALTER TABLE "curriculum_modules" ALTER COLUMN "weeks" DROP NOT NULL;
