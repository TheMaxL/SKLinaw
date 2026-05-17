-- First, check current structure
SELECT '=== CURRENT TABLES ===' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'councilors' AND column_name = 'id') THEN
        ALTER TABLE councilors ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to councilors';
    ELSE
        RAISE NOTICE 'id column already exists in councilors';
    END IF;
END $$;

-- Make sure we have the correct columns
ALTER TABLE councilors ALTER COLUMN name SET NOT NULL;
ALTER TABLE councilors ALTER COLUMN barangay SET NOT NULL;

-- ============================================
-- FIX COMMITTEES TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'committees' AND column_name = 'id') THEN
        ALTER TABLE committees ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to committees';
    END IF;
END $$;

-- ============================================
-- FIX PROJECTS TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'id') THEN
        ALTER TABLE projects ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to projects';
    END IF;
END $$;

-- ============================================
-- FIX COMMITTEEBUDGET TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'committeebudget' AND column_name = 'id') THEN
        ALTER TABLE committeebudget ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to committeebudget';
    END IF;
END $$;

-- ============================================
-- FIX COMMITTEEBUDGET TABLE (has composite key)
-- ============================================
-- CommitteeBudget uses composite key (barangay, committee_name), doesn't need id

-- ============================================
-- FIX FEEDBACK TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'feedback' AND column_name = 'id') THEN
        ALTER TABLE feedback ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to feedback';
    END IF;
END $$;

-- ============================================
-- FIX DEVELOPER TABLE
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'developer' AND column_name = 'id') THEN
        ALTER TABLE developer ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to developer';
    END IF;
END $$;

-- ============================================
-- VERIFY CHANGES
-- ============================================
SELECT '=== VERIFICATION ===' as info;
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'id'
ORDER BY table_name;

-- Show row counts
SELECT 'Councilors' as table_name, COUNT(*) FROM councilors
UNION ALL
SELECT 'Committees', COUNT(*) FROM committees
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects;