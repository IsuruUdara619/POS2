-- Check for INV-16 and INV-17 purchases
SELECT purchase_id, invoice_no, vendor_id, date, purchase_date, bill_price, unit_price, selling_price
FROM purchases 
WHERE invoice_no IN ('INV-16', 'INV-17')
ORDER BY purchase_id DESC;

-- Check all recent purchases
SELECT purchase_id, invoice_no, vendor_id, date, purchase_date, bill_price
FROM purchases 
ORDER BY purchase_id DESC
LIMIT 10;

-- Check purchase_items for these invoices
SELECT pi.purchase_item_id, pi.purchase_id, pi.product_id, pi.qty, pi.total_price, pi.unit_price, pi.brand, pi.selling_price, pi.remaining_qty
FROM purchase_items pi
JOIN purchases p ON p.purchase_id = pi.purchase_id
WHERE p.invoice_no IN ('INV-16', 'INV-17');
