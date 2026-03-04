import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../services/api';
import Layout from '../components/Layout';

const roseGold = '#134E8E';
const roseGoldLight = '#e0e0e0';
const gold = '#134E8E';
const goldHover = '#003366';

export default function Inventory() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Array<{ purchase_item_id: number; inventory_id: number; product_id: number; product_name: string | null; sku: string | null; vendor_id: number; vendor_name: string | null; brand: string | null; qty: number | string; purchase_date: string | null }>>([]);
  const [qProduct, setQProduct] = useState('');
  const [qVendor, setQVendor] = useState('');
  const [qBrand, setQBrand] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await get('/inventory');
        setInventory(r.inventory || []);
      } catch (err: any) { if (err?.status === 401) { navigate('/login', { replace: true }); } }
    })();
  }, [navigate]);

  const filtered = useMemo(() => {
    return inventory
      .filter(i => !qProduct || (i.product_name || '').toLowerCase().includes(qProduct.toLowerCase()))
      .filter(i => !qVendor || (i.vendor_name || '').toLowerCase().includes(qVendor.toLowerCase()))
      .filter(i => !qBrand || (i.brand || '').toLowerCase().includes(qBrand.toLowerCase()));
  }, [inventory, qProduct, qVendor, qBrand]);

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 700 }}>Inventory</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Filter by product" value={qProduct} onChange={e=>setQProduct(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input placeholder="Filter by vendor" value={qVendor} onChange={e=>setQVendor(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input placeholder="Filter by brand" value={qBrand} onChange={e=>setQBrand(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
          </div>
        </div>
      {filtered.length === 0 ? (
        <div style={{ color: '#666' }}>No inventory items.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {filtered.map(i => {
            const disp = (() => {
              const q = typeof i.qty === 'string' ? Number(i.qty) : Number(i.qty);
              if ((i.sku || '') === 'Grams') {
                if (q >= 1000) return { value: (q / 1000).toFixed(2), unit: 'KG' };
                return { value: q.toFixed(2), unit: 'g' };
              }
              return { value: q.toFixed(2), unit: '' };
            })();
            return (
              <div key={i.purchase_item_id || i.inventory_id} style={{ borderRadius: 10, padding: 14, background: '#808080', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                    {(i.product_name || 'Unknown')}{i.purchase_date ? ` (Purchased: ${(() => { const d = new Date(i.purchase_date as string); return isNaN(d.getTime()) ? String(i.purchase_date).slice(0,10) : d.toLocaleDateString('en-CA'); })()})` : ''}
                  </div>
                  <div style={{ background: '#444', color: '#fff', border: '1px solid #555', borderRadius: 18, padding: '6px 12px', fontWeight: 700, minWidth: 120, textAlign: 'center' }}>
                    {disp.value} {disp.unit}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: '#ccc', fontSize: 12 }}>
                  <div>Vendor: {i.vendor_name || '-'}</div>
                  <div>Brand: {i.brand || '-'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </Layout>
  );
}
