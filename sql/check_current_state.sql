-- Check current count and last entries
SELECT COUNT(*) as total_purchases FROM purchases;

SELECT purchase_id, invoice_no, vendor_id, date, bill_price
FROM purchases 
ORDER BY purchase_id DESC
LIMIT 5;

-- Check if INV-16 and INV-17 exist right now
SELECT purchase_id, invoice_no, vendor_id, date, bill_price
FROM purchases
WHERE invoice_no IN ('INV-16', 'INV-17');
