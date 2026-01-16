-- ============================================
-- Rename Tables with v_ Prefix
-- ============================================
-- WARNING: This script permanently renames tables
-- Make sure to backup your database before running
-- ============================================

USE tw_tourwow_db;

-- Check if tables exist before renaming
SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'tw_tourwow_db'
AND TABLE_NAME IN (
    'Xqc7k7_orders',
    'Xqc7k7_customers',
    'Xqc7k7_bookings',
    'Xqc7k7_customer_order_installments'
);

-- Rename tables
RENAME TABLE Xqc7k7_orders TO v_Xqc7k7_orders;
RENAME TABLE Xqc7k7_customers TO v_Xqc7k7_customers;
RENAME TABLE Xqc7k7_bookings TO v_Xqc7k7_bookings;
RENAME TABLE Xqc7k7_customer_order_installments TO v_Xqc7k7_customer_order_installments;

-- Verify tables were renamed
SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'tw_tourwow_db'
AND TABLE_NAME LIKE 'v_Xqc7k7_%';

-- Test renamed tables
SELECT COUNT(*) as orders_count FROM v_Xqc7k7_orders;
SELECT COUNT(*) as customers_count FROM v_Xqc7k7_customers;
SELECT COUNT(*) as bookings_count FROM v_Xqc7k7_bookings;
SELECT COUNT(*) as installments_count FROM v_Xqc7k7_customer_order_installments;

-- ============================================
-- Script completed successfully
-- ============================================
