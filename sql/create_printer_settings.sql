-- Create printer_settings table for thermal printer configuration
CREATE TABLE IF NOT EXISTS printer_settings (
  setting_id SERIAL PRIMARY KEY,
  printer_name VARCHAR(255) DEFAULT 'XP-80C',
  
  -- Font sizes (in points)
  font_header INTEGER DEFAULT 13,
  font_items INTEGER DEFAULT 6,
  font_subtotal INTEGER DEFAULT 6,
  font_total INTEGER DEFAULT 8,
  font_payment INTEGER DEFAULT 7,
  
  -- Spacing & margins (in points)
  margin_top INTEGER DEFAULT 10,
  margin_bottom INTEGER DEFAULT 10,
  footer_spacing INTEGER DEFAULT 20,
  paper_height INTEGER DEFAULT 842,
  line_spacing INTEGER DEFAULT 12,
  
  -- Text alignment (left, center, right)
  align_header VARCHAR(10) DEFAULT 'center',
  align_items VARCHAR(10) DEFAULT 'left',
  align_totals VARCHAR(10) DEFAULT 'right',
  align_payment VARCHAR(10) DEFAULT 'left',
  align_footer VARCHAR(10) DEFAULT 'center',
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings if table is empty
INSERT INTO printer_settings (
  printer_name,
  font_header, font_items, font_subtotal, font_total, font_payment,
  margin_top, margin_bottom, footer_spacing, paper_height, line_spacing,
  align_header, align_items, align_totals, align_payment, align_footer
)
SELECT 
  'XP-80C',
  13, 6, 6, 8, 7,
  10, 10, 20, 842, 12,
  'center', 'left', 'right', 'left', 'center'
WHERE NOT EXISTS (SELECT 1 FROM printer_settings LIMIT 1);
