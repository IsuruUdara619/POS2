import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { get, post } from '../services/api';

export default function Purchase() {
  const navigate = useNavigate();
  const gold = '#134E8E';
  const goldHover = '#003366';

  const [showForm, setShowForm] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [vendorId, setVendorId] = useState<number | ''>('');
  const [vendorQuery, setVendorQuery] = useState('');
  const [showVendorSuggest, setShowVendorSuggest] = useState(false);
  const [productId, setProductId] = useState<number | ''>('');
  const [productQuery, setProductQuery] = useState('');
  const [showProductSuggest, setShowProductSuggest] = useState(false);
  const [date, setDate] = useState<string>('');
  const [billPrice, setBillPrice] = useState<string>('');
  const [qty, setQty] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [sellingPriceInput, setSellingPriceInput] = useState('');
  const [sellingEdited, setSellingEdited] = useState(false);
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [vendors, setVendors] = useState<Array<{ vendor_id: number; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ product_id: number; product_name: string; sku: string | null }>>([]);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [qtyUnit, setQtyUnit] = useState<string>('PCS');
  const [purchases, setPurchases] = useState<Array<{
    purchase_id: number; invoice_no: string | null; vendor_id: number | null; vendor_name: string | null; date: string; bill_price: number;
    items: Array<{ purchase_item_id: number; product_id: number; qty: number; total_price: number; unit_price: number; brand: string | null }>
  }>>([]);
  const [fInvoice, setFInvoice] = useState('');
  const [fVendor, setFVendor] = useState('');
  const [fVendorId, setFVendorId] = useState('');
  const [fDateFrom, setFDateFrom] = useState('');
  const [fDateTo, setFDateTo] = useState('');
  const [fProduct, setFProduct] = useState('');
  const [fProductId, setFProductId] = useState('');
  const [fBrand, setFBrand] = useState('');
  const cementBrands = ['UltraTech', 'ACC', 'Ambuja', 'Shree Cement', 'MP Birla Cement'];

  function toggleForm() { setShowForm(v => !v); }

  useEffect(() => {
    (async () => {
      try {
        const v = await get('/vendors');
        setVendors((v.vendors || []).map((x: any) => ({ vendor_id: x.vendor_id, name: x.name })));
      } catch (err: any) { if (err?.status === 401) { navigate('/login', { replace: true }); return; } }
      try {
        const p = await get('/products');
        setProducts((p.products || []).map((x: any) => ({ product_id: x.product_id, product_name: x.product_name, sku: x.sku || null })));
    } catch (err: any) { if (err?.status === 401) { navigate('/login', { replace: true }); return; } }
      try {
        const r = await get('/purchases');
        setPurchases(r.purchases || []);
      } catch (err: any) { if (err?.status === 401) { navigate('/login', { replace: true }); return; } }
    })();
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const today = new Date().toISOString().slice(0,10);
    setDate(prev => prev || today);
    const nextInvoice = (() => {
      let maxNum = 0; let preferPrefix = 'INV-';
      for (const p of purchases) {
        const inv = p.invoice_no || '';
        const m = inv.match(/^(.*?)(\d+)$/);
        if (m) {
          const n = Number(m[2]);
          if (!isNaN(n) && n >= maxNum) { maxNum = n; preferPrefix = m[1]; }
        }
      }
      return `${preferPrefix}${maxNum + 1}`;
    })();
    setInvoiceNo(prev => prev || nextInvoice);
  }, [showForm, purchases]);

  const filteredVendors = useMemo(() => vendors.filter(v => v.name.toLowerCase().includes(vendorQuery.toLowerCase())), [vendors, vendorQuery]);
  const filteredProducts = useMemo(() => {
    const q = productQuery.toLowerCase();
    return products.filter(p => p.product_name.toLowerCase().includes(q) || String(p.product_id).includes(productQuery.trim()));
  }, [products, productQuery]);
  const selectedProduct = useMemo(
    () => products.find(pr => pr.product_id === Number(productId)) || null,
    [products, productId]
  );
  const isCementProduct = !!selectedProduct && selectedProduct.product_name.toLowerCase().includes('cement');

  useEffect(() => {
    const p = products.find(pr => pr.product_id === Number(productId));
    const sku = p?.sku || null;
    setSelectedSku(sku);
    setQtyUnit(sku || 'PCS');
  }, [productId, products]);

  const effectiveQty = useMemo(() => {
    const q = Number(qty);
    if (!q || isNaN(q)) return 0;
    if (selectedSku === 'Grams') {
      return qtyUnit === 'KG' ? q * 1000 : q;
    }
    return q;
  }, [qty, selectedSku, qtyUnit]);

  const unitPriceCalc = useMemo(() => {
    const totalNum = Number(billPrice);
    if (!totalNum || isNaN(totalNum) || effectiveQty <= 0) return '';
    return Number((totalNum / effectiveQty).toFixed(2));
  }, [billPrice, effectiveQty]);

  const sellingPriceCalc = useMemo(() => {
    if (typeof unitPriceCalc !== 'number' || isNaN(unitPriceCalc) || unitPriceCalc <= 0) return '';
    return Number((unitPriceCalc * 1.3).toFixed(2));
  }, [unitPriceCalc]);

  useEffect(() => {
    if (!sellingEdited) {
      setSellingPriceInput(sellingPriceCalc === '' ? '' : String(sellingPriceCalc));
    }
  }, [unitPriceCalc, sellingEdited]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (fInvoice && !p.invoice_no?.toLowerCase().includes(fInvoice.toLowerCase())) return false;
      if (fVendor && !p.vendor_name?.toLowerCase().includes(fVendor.toLowerCase())) return false;
      if (fDateFrom && new Date(p.date) < new Date(fDateFrom)) return false;
      if (fDateTo && new Date(p.date) > new Date(fDateTo)) return false;
      
      // For product/brand filtering
      if (fProduct || fBrand) {
        const hasItem = p.items.some(it => {
          const prodName = products.find(x => x.product_id === it.product_id)?.product_name || '';
          if (fProduct && !prodName.toLowerCase().includes(fProduct.toLowerCase())) return false;
          if (fBrand && !it.brand?.toLowerCase().includes(fBrand.toLowerCase())) return false;
          return true;
        });
        if (!hasItem) return false;
      }
      return true;
    });
  }, [purchases, fInvoice, fVendor, fDateFrom, fDateTo, fProduct, fBrand, products]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const qtyNum = Number(qty);
    const totalNum = Number(billPrice);
    if (!vendorId || !productId) { setError('Select vendor and product'); return; }
    if (!qtyNum || qtyNum <= 0) { setError('Invalid quantity'); return; }
    if (!billPrice) { setError('Enter bill price'); return; }
    try {
      const sku = selectedSku || products.find(p => p.product_id === Number(productId))?.sku || null;
      const effectiveQty = sku === 'Grams' ? (qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
      const payload = {
        invoice_no: invoiceNo || undefined,
        vendor_id: Number(vendorId),
        product_id: Number(productId),
        date: date || undefined,
        bill_price: totalNum,
        qty: effectiveQty,
        brand: brand || undefined,
        unit_price: unitPriceCalc === '' ? undefined : Number(unitPriceCalc),
        selling_price: sellingPriceInput ? Number(Number(sellingPriceInput).toFixed(2)) : undefined,
      };
      await post('/purchases', payload);
      try { const r = await get('/purchases'); setPurchases(r.purchases || []); } catch {}
      setConfirmVisible(true);
      setTimeout(() => setConfirmVisible(false), 800);
      setInvoiceNo(''); setVendorId(''); setProductId(''); setVendorQuery(''); setProductQuery(''); setDate(''); setBillPrice(''); setQty(''); setBrand('');
      setShowForm(false);
    } catch (err: any) {
      if (err?.status === 401) { navigate('/login', { replace: true }); return; }
      setError(err?.message || 'Failed to add purchase');
    }
  }

  return (
    <Layout backgroundColor="#d0d0d0ff">
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
      {confirmVisible && (
        <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#808080', border: `1px solid #555`, borderRadius: 12, padding: '14px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            <span style={{ fontSize: 24 }}>🧾</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>Purchase added</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 18, background: '#fff', animation: 'blink 1s step-end infinite' }} />
            </div>
          </div>
        </div>
      )}
      
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={toggleForm}
            style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
            onMouseEnter={e => (e.currentTarget.style.background = goldHover)}
            onMouseLeave={e => (e.currentTarget.style.background = gold)}
          >
            {showForm ? 'Close' : 'Add Purchase'}
          </button>
        </div>
        {showForm && (
          <form
            onSubmit={submit}
            style={{
              borderRadius: 12,
              padding: 16,
              width: '100%',
              maxWidth: 520,
              background: '#d0d0d0ff',
              boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              boxSizing: 'border-box',
              marginBottom: 16,
              color: '#fff'
            }}
          >
            {error && (<div style={{ color: 'red', marginBottom: 12 }}>{error}</div>)}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Invoice No</label>
                <input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Date</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Vendor (search)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    placeholder="Search vendor"
                    value={vendorQuery}
                    onChange={e=>{ setVendorQuery(e.target.value); setShowVendorSuggest(true); }}
                    onFocus={()=>setShowVendorSuggest(true)}
                    onBlur={()=>setTimeout(()=>setShowVendorSuggest(false), 150)}
                    onKeyDown={e=>{ if (e.key === 'Enter' && filteredVendors[0]) { const v=filteredVendors[0]; setVendorId(v.vendor_id); setVendorQuery(v.name); setShowVendorSuggest(false); } }}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box', marginBottom: 6 }}
                  />
                  {showVendorSuggest && vendorQuery && filteredVendors.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: '#444', border: `1px solid #555`, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
                      {filteredVendors.map(v => (
                        <div
                          key={v.vendor_id}
                          onMouseDown={()=>{ setVendorId(v.vendor_id); setVendorQuery(v.name); setShowVendorSuggest(false); }}
                          style={{ padding: '8px 12px', cursor: 'pointer', color: '#fff' }}
                          onMouseEnter={e=>{ e.currentTarget.style.background = '#444'; }}
                          onMouseLeave={e=>{ e.currentTarget.style.background = '#808080'; }}
                        >
                          {v.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Product (search by name or ID)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    placeholder="Search product"
                    value={productQuery}
                    onChange={e=>{ setProductQuery(e.target.value); setShowProductSuggest(true); }}
                    onFocus={()=>setShowProductSuggest(true)}
                    onBlur={()=>setTimeout(()=>setShowProductSuggest(false), 150)}
                    onKeyDown={e=>{ if (e.key === 'Enter' && filteredProducts[0]) { const p=filteredProducts[0]; setProductId(p.product_id); setSelectedSku(p.sku || null); setQtyUnit((p.sku || '') === 'Grams' ? 'Grams' : 'PCS'); setProductQuery(p.product_name); setShowProductSuggest(false); } }}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box', marginBottom: 6 }}
                  />
                  {showProductSuggest && productQuery && filteredProducts.length > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: '#444', border: `1px solid #555`, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
                      {filteredProducts.map(p => (
                        <div
                          key={p.product_id}
                          onMouseDown={()=>{ setProductId(p.product_id); setSelectedSku(p.sku || null); setQtyUnit((p.sku || '') === 'Grams' ? 'Grams' : 'PCS'); setProductQuery(p.product_name); setShowProductSuggest(false); }}
                          style={{ padding: '8px 12px', cursor: 'pointer', color: '#fff' }}
                          onMouseEnter={e=>{ e.currentTarget.style.background = '#444'; }}
                          onMouseLeave={e=>{ e.currentTarget.style.background = '#808080'; }}
                        >
                          {p.product_name} (ID: {p.product_id}){p.sku ? ` — ${p.sku}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Bill Price (total)</label>
                <input type="number" step="0.01" value={billPrice} onChange={e=>setBillPrice(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Quantity {selectedSku ? `(${selectedSku})` : ''}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" step="0.01" value={qty} onChange={e=>setQty(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
                  <select
                    value={qtyUnit}
                    onChange={e=>setQtyUnit(e.target.value)}
                    style={{ width: 120, padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }}
                  >
                    <option value="PCS">PCS</option>
                    <option value="Grams">Grams</option>
                    <option value="KG">KG</option>
                    <option value="FT">FT</option>
                    <option value="INCH">INCH</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Unit Price (auto)</label>
                <input value={unitPriceCalc === '' ? '' : String(unitPriceCalc)} readOnly style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#555', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Selling Price (+30%, editable)</label>
                <input value={sellingPriceInput} onChange={e=>{ setSellingEdited(true); setSellingPriceInput(e.target.value); }} type="number" step="0.01" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, color: '#fff' }}>Brand</label>
                {isCementProduct ? (
                  <select
                    value={brand}
                    onChange={e=>setBrand(e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="">Select brand...</option>
                    {cementBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={brand}
                    onChange={e=>setBrand(e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button type="submit" style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = goldHover)}
                onMouseLeave={e => (e.currentTarget.style.background = gold)}
              >
                Save Purchase
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
             <h3 style={{ color: '#fff', margin: 0, marginRight: 12 }}>History</h3>
             <input placeholder="Filter Invoice" value={fInvoice} onChange={e=>setFInvoice(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #555', background: '#444', color: '#fff' }} />
             <input placeholder="Filter Vendor" value={fVendor} onChange={e=>setFVendor(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #555', background: '#444', color: '#fff' }} />
             <input type="date" value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #555', background: '#444', color: '#fff' }} />
             <input type="date" value={fDateTo} onChange={e=>setFDateTo(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #555', background: '#444', color: '#fff' }} />
             <input placeholder="Filter Product" value={fProduct} onChange={e=>setFProduct(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #555', background: '#444', color: '#fff' }} />
          </div>

          <div style={{ overflowX: 'auto', background: '#808080', borderRadius: 12, padding: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #666' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ background: '#555' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Invoice</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Vendor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map(p => (
                  <tr key={p.purchase_id} style={{ borderBottom: '1px solid #666' }}>
                    <td style={{ padding: '12px 16px' }}>{p.date ? p.date.slice(0,10) : ''}</td>
                    <td style={{ padding: '12px 16px' }}>{p.invoice_no}</td>
                    <td style={{ padding: '12px 16px' }}>{p.vendor_name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>{Number(p.bill_price).toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.items.map(it => {
                         const prod = products.find(x => x.product_id === it.product_id);
                         return (
                           <div key={it.purchase_item_id} style={{ fontSize: '0.9em', marginBottom: 4 }}>
                             • {prod?.product_name || `ID:${it.product_id}`} — {it.qty} {it.brand ? `(${it.brand})` : ''}
                           </div>
                         );
                      })}
                    </td>
                  </tr>
                ))}
                {filteredPurchases.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#ddd' }}>No purchases found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
