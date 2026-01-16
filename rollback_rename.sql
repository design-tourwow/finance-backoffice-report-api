-- ============================================
-- Rollback: Rename Tables Back to Original
-- ============================================
-- Use this script to revert table names
-- ============================================

USE tw_tourwow_db;

-- Rename tables back to original names
RENAME TABLE v_Xqc7k7_orders TO Xqc7k7_orders;
RENAME TABLE v_Xqc7k7_customers TO Xqc7k7_customers;
RENAME TABLE v_Xqc7k7_bookings TO Xqc7k7_bookings;
RENAME TABLE v_Xqc7k7_customer_order_installments TO Xqc7k7_customer_order_installments;

-- Verify tables were renamed back
SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'tw_tourwow_db'
AND TABLE_NAME LIKE 'Xqc7k7_%';

-- ============================================
-- Rollback completed successfully
-- ============================================
