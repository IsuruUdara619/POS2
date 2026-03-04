-- Check inventory synchronization after sale

-- 1. Check purchase_items remaining quantities
SELECT 
    pi.purchase_item_id,
    pi.product_id,
    p.product_name,
    pi.brand,
    pr.vendor_id,
    v.name as vendor_name,
    pi.remaining_qty as purchase_remaining,
    pr.purchase_date
FROM purchase_items pi
JOIN purchases pr ON pr.purchase_id = pi.purchase_id
LEFT JOIN products p ON p.product_id = pi.product_id
LEFT JOIN vendors v ON v.vendor_id = pr.vendor_id
ORDER BY pi.product_id, pr.purchase_date DESC;

-- 2. Check inventory_items aggregated quantities
SELECT 
    i.inventory_id,
    i.product_id,
    p.product_name,
    i.brand,
    i.vendor_id,
    v.name as vendor_name,
    i.qty as inventory_total
FROM inventory_items i
LEFT JOIN products p ON p.product_id = i.product_id
LEFT JOIN vendors v ON v.vendor_id = i.vendor_id
ORDER BY i.product_id;

-- 3. Compare: What the inventory endpoint returns
SELECT
    pi.purchase_item_id,
    i.inventory_id,
    pi.product_id,
    p.product_name,
    p.sku,
    pr.vendor_id,
    v.name AS vendor_name,
    pi.brand,
    COALESCE(pi.remaining_qty, 0) AS qty,
    pr.purchase_date::date AS purchase_date
FROM purchase_items pi
JOIN purchases pr ON pr.purchase_id = pi.purchase_id
LEFT JOIN inventory_items i ON i.product_id = pi.product_id AND i.vendor_id = pr.vendor_id AND (i.brand IS NOT DISTINCT FROM pi.brand)
LEFT JOIN products p ON p.product_id = pi.product_id
LEFT JOIN vendors v ON v.vendor_id = pr.vendor_id
WHERE COALESCE(pi.remaining_qty, 0) > 0
ORDER BY pr.purchase_date::date DESC, pi.purchase_item_id DESC;

-- 4. Check recent sales to see what was sold
SELECT 
    s.sale_id,
    s.date,
    si.inventory_id,
    si.qty as sold_qty,
    si.brand,
    p.product_name
FROM sales s
JOIN sales_items si ON si.sale_id = s.sale_id
LEFT JOIN inventory_items i ON i.inventory_id = si.inventory_id
LEFT JOIN products p ON p.product_id = i.product_id
ORDER BY s.sale_id DESC
LIMIT 10;
