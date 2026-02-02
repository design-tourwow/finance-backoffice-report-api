-- ============================================
-- Create Views with v_ Prefix (No DROP)
-- ============================================
-- This script creates views without dropping
-- Use when user doesn't have DROP privilege
-- ============================================

USE tw_tourwow_db;

-- Create view for orders table
CREATE VIEW v_Xqc7k7_orders AS 
SELECT * FROM Xqc7k7_orders;

-- Create view for customers table
CREATE VIEW v_Xqc7k7_customers AS 
SELECT * FROM Xqc7k7_customers;

-- Create view for bookings table
CREATE VIEW v_Xqc7k7_bookings AS 
SELECT * FROM Xqc7k7_bookings;

-- Create view for customer_order_installments table
CREATE VIEW v_Xqc7k7_customer_order_installments AS
SELECT * FROM Xqc7k7_customer_order_installments;

-- Create view for order_items table
CREATE VIEW v_Xqc7k7_order_items AS
SELECT * FROM Xqc7k7_order_items;

-- Verify views were created
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Test views
SELECT COUNT(*) as orders_count FROM v_Xqc7k7_orders;
SELECT COUNT(*) as customers_count FROM v_Xqc7k7_customers;
SELECT COUNT(*) as bookings_count FROM v_Xqc7k7_bookings;
SELECT COUNT(*) as installments_count FROM v_Xqc7k7_customer_order_installments;
SELECT COUNT(*) as order_items_count FROM v_Xqc7k7_order_items;

-- ============================================
-- Script completed successfully
-- ============================================
