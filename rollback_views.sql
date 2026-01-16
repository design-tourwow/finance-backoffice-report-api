-- ============================================
-- Rollback: Drop Views with v_ Prefix
-- ============================================
-- Use this script to remove views if needed
-- ============================================

USE tw_tourwow_db;

-- Drop views
DROP VIEW IF EXISTS v_Xqc7k7_orders;
DROP VIEW IF EXISTS v_Xqc7k7_customers;
DROP VIEW IF EXISTS v_Xqc7k7_bookings;
DROP VIEW IF EXISTS v_Xqc7k7_customer_order_installments;

-- Verify views were dropped
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- ============================================
-- Rollback completed successfully
-- ============================================
