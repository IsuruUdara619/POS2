-- Schema Comparison Script
-- Compare schemas between Heaven_bakers and test databases

-- ============================================
-- 1. COMPARE TABLES
-- ============================================
-- Tables only in Heaven_bakers
SELECT 'Tables only in Heaven_bakers:' as comparison;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_catalog = 'Heaven_bakers'
  AND table_name NOT IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_catalog = 'test'
  )
ORDER BY table_name;

-- Tables only in test
SELECT 'Tables only in test:' as comparison;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_catalog = 'test'
  AND table_name NOT IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_catalog = 'Heaven_bakers'
  )
ORDER BY table_name;

-- ============================================
-- 2. COMPARE COLUMNS FOR EACH TABLE
-- ============================================
-- This shows columns that differ between the same tables in both databases
SELECT 
    'Column differences:' as comparison,
    COALESCE(h.table_name, t.table_name) as table_name,
    COALESCE(h.column_name, t.column_name) as column_name,
    h.data_type as heaven_bakers_type,
    t.data_type as test_type,
    h.is_nullable as heaven_bakers_nullable,
    t.is_nullable as test_nullable,
    CASE 
        WHEN h.column_name IS NULL THEN 'Only in test'
        WHEN t.column_name IS NULL THEN 'Only in Heaven_bakers'
        WHEN h.data_type != t.data_type THEN 'Type mismatch'
        WHEN h.is_nullable != t.is_nullable THEN 'Nullable mismatch'
        ELSE 'Other difference'
    END as difference_type
FROM 
    information_schema.columns h
FULL OUTER JOIN 
    information_schema.columns t 
    ON h.table_name = t.table_name 
    AND h.column_name = t.column_name
    AND t.table_schema = 'public'
    AND t.table_catalog = 'test'
WHERE 
    h.table_schema = 'public'
    AND h.table_catalog = 'Heaven_bakers'
    AND (
        h.column_name IS NULL 
        OR t.column_name IS NULL 
        OR h.data_type != t.data_type 
        OR h.is_nullable != t.is_nullable
    )
ORDER BY 
    table_name, column_name;

-- ============================================
-- 3. COMPARE PRIMARY KEYS
-- ============================================
SELECT 'Primary Key differences:' as comparison;
SELECT 
    COALESCE(h.table_name, t.table_name) as table_name,
    h.constraint_name as heaven_bakers_pk,
    t.constraint_name as test_pk,
    CASE 
        WHEN h.constraint_name IS NULL THEN 'Missing in Heaven_bakers'
        WHEN t.constraint_name IS NULL THEN 'Missing in test'
        ELSE 'Different names'
    END as difference
FROM 
    (SELECT tc.table_name, tc.constraint_name
     FROM information_schema.table_constraints tc
     WHERE tc.table_catalog = 'Heaven_bakers'
       AND tc.table_schema = 'public'
       AND tc.constraint_type = 'PRIMARY KEY') h
FULL OUTER JOIN
    (SELECT tc.table_name, tc.constraint_name
     FROM information_schema.table_constraints tc
     WHERE tc.table_catalog = 'test'
       AND tc.table_schema = 'public'
       AND tc.constraint_type = 'PRIMARY KEY') t
ON h.table_name = t.table_name
WHERE h.constraint_name IS NULL 
   OR t.constraint_name IS NULL 
   OR h.constraint_name != t.constraint_name
ORDER BY table_name;

-- ============================================
-- 4. COMPARE FOREIGN KEYS
-- ============================================
SELECT 'Foreign Key differences:' as comparison;
SELECT 
    COALESCE(h.table_name, t.table_name) as table_name,
    COALESCE(h.constraint_name, t.constraint_name) as constraint_name,
    CASE 
        WHEN h.constraint_name IS NULL THEN 'Missing in Heaven_bakers'
        WHEN t.constraint_name IS NULL THEN 'Missing in test'
        ELSE 'Exists in both'
    END as status
FROM 
    (SELECT tc.table_name, tc.constraint_name
     FROM information_schema.table_constraints tc
     WHERE tc.table_catalog = 'Heaven_bakers'
       AND tc.table_schema = 'public'
       AND tc.constraint_type = 'FOREIGN KEY') h
FULL OUTER JOIN
    (SELECT tc.table_name, tc.constraint_name
     FROM information_schema.table_constraints tc
     WHERE tc.table_catalog = 'test'
       AND tc.table_schema = 'public'
       AND tc.constraint_type = 'FOREIGN KEY') t
ON h.table_name = t.table_name AND h.constraint_name = t.constraint_name
WHERE h.constraint_name IS NULL OR t.constraint_name IS NULL
ORDER BY table_name, constraint_name;

-- ============================================
-- 5. ROW COUNT COMPARISON
-- ============================================
-- Note: This section needs to be run separately for each database
SELECT 'Row count comparison (run this in each database separately):' as note;

-- Run this query in Heaven_bakers database:
/*
SELECT 
    'Heaven_bakers' as database,
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- Run this query in test database:
/*
SELECT 
    'test' as database,
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
*/
