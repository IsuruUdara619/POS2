-- Check if this database has any purchases
SELECT COUNT(*) as total_purchases FROM purchases;

-- Check last 5 purchases
SELECT purchase_id, invoice_no, vendor_id, date 
FROM purchases 
ORDER BY purchase_id DESC 
LIMIT 5;
