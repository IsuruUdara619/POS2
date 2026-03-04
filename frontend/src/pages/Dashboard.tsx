import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { get } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const roseGold = '#134E8E';
  const roseGoldLight = '#e0e0e0';
  const gold = '#134E8E';
  const goldHover = '#e6b400';
  const white = '#ffffff';
  const btnGrad = `linear-gradient(135deg, ${gold},   #134E8E)`;
  const btnHoverGrad = `linear-gradient(135deg, ${goldHover}, #134E8E)`;
  const standardColors = ['#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6'];
  function adjust(hex: string, amt: number) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0x00FF) + amt;
    let b = (num & 0x0000FF) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    const out = (r << 16) | (g << 8) | b;
    return '#' + out.toString(16).padStart(6, '0');
  }
  function logout() {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }
  function goProducts() { console.log('Navigating to Products'); navigate('/products'); }
  function goVendors() { console.log('Navigating to Vendors'); navigate('/vendors'); }
  function goPurchase() { console.log('Navigating to Purchase'); navigate('/purchase'); }
  function goInventory() { console.log('Navigating to Inventory'); navigate('/inventory'); }
  function goSales() { console.log('Navigating to Sales'); navigate('/sales'); }
  function goExpenses() { console.log('Navigating to Expenses'); navigate('/expenses'); }
  function goReports() { console.log('Navigating to Reports'); navigate('/reports'); }
  function goLoyalty() { console.log('Navigating to Loyalty'); navigate('/loyalty'); }
  function goHome() {
    navigate('/dashboard');
  }
  function goSettings() { console.log('Navigating to Settings'); navigate('/settings'); }
  const [salesRows, setSalesRows] = useState<any[]>([]);
  const [expensesRows, setExpensesRows] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const userRole = localStorage.getItem('userRole') || 'cashier';

  async function refreshData() {
    setRefreshing(true);
    try { const r = await get('/sales'); setSalesRows(r.sales || []); } catch { setSalesRows([]); }
    try { const r = await get('/expenses'); setExpensesRows(r.expenses || []); } catch { setExpensesRows([]); }
    try { const r = await get('/purchases'); setPurchases(r.purchases || []); } catch { setPurchases([]); }
    try { const r = await get('/inventory'); setInventory(r.inventory || []); } catch { setInventory([]); }
    try { const r = await get('/products'); setProducts(r.products || []); } catch { setProducts([]); }
    try { const r = await get('/inventory/low-stock'); setLowStockItems(r.alerts || []); } catch { setLowStockItems([]); }
    setRefreshing(false);
  }

  useEffect(() => {
    (async () => {
      try { const r = await get('/sales'); setSalesRows(r.sales || []); } catch {}
      try { const r = await get('/expenses'); setExpensesRows(r.expenses || []); } catch {}
      try { const r = await get('/purchases'); setPurchases(r.purchases || []); } catch {}
      try { const r = await get('/inventory'); setInventory(r.inventory || []); } catch {}
      try { const r = await get('/products'); setProducts(r.products || []); } catch {}
      try { const r = await get('/inventory/low-stock'); setLowStockItems(r.alerts || []); } catch {}
    })();
  }, []);

  function fmt(n: number) { return new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
  function localDateKey(d: Date) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
  const todayKey = localDateKey(new Date());
  const salesById = useMemo(() => {
    const map: Record<number, any> = {};
    for (const row of salesRows) {
      if (!map[row.sale_id]) {
        map[row.sale_id] = { sale_id: row.sale_id, date: row.date, total_amount: row.total_amount ?? 0, items: [] };
      }
      if (row.sales_item_id) {
        map[row.sale_id].items.push({ sales_item_id: row.sales_item_id, qty: Number(row.qty || 0), profit: Number(row.profit || 0), inventory_id: row.inventory_id });
      }
    }
    return Object.values(map);
  }, [salesRows]);

  const todaySales = useMemo(() => {
    let sum = 0;
    for (const s of salesById) {
      if (String(s.date).slice(0,10) === todayKey) sum += Number(s.total_amount || 0);
    }
    return Number(sum.toFixed(2));
  }, [salesById, todayKey]);

  const todayProfit = useMemo(() => {
    let sum = 0;
    for (const s of salesById) {
      if (String(s.date).slice(0,10) === todayKey) {
        for (const it of s.items) sum += Number(it.profit || 0);
      }
    }
    return Number(sum.toFixed(2));
  }, [salesById, todayKey]);

  const todayExpenses = useMemo(() => {
    let sum = 0;
    for (const e of expensesRows) {
      const k = e.created_at ? localDateKey(new Date(e.created_at)) : '';
      if (k === todayKey) sum += Number(e.amount || 0);
    }
    return Number(sum.toFixed(2));
  }, [expensesRows, todayKey]);

  const invNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const i of inventory) map[i.inventory_id] = `${i.product_name || 'Unknown'}${i.brand ? ` (${i.brand})` : ''}`;
    return map;
  }, [inventory]);

  const mostMoving = useMemo(() => {
    const qtyMap: Record<string, number> = {};
    for (const s of salesById) {
      for (const it of s.items) {
        const name = invNameMap[it.inventory_id] || `ID ${it.inventory_id}`;
        qtyMap[name] = (qtyMap[name] || 0) + Number(it.qty || 0);
      }
    }
    const arr = Object.entries(qtyMap).map(([name, qty]) => ({ name, qty }));
    arr.sort((a,b) => b.qty - a.qty);
    return arr.slice(0,5);
  }, [salesById, invNameMap]);

  const purchasesByVendor = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of purchases) {
      const vendor = p.vendor_name || 'Unknown';
      const items: any[] = p.items || [];
      const sum = items.reduce((acc, it) => acc + Number(it.total_price || 0), 0);
      map[vendor] = (map[vendor] || 0) + sum;
    }
    const total = Object.values(map).reduce((a,b)=>a+b,0) || 1;
    return Object.entries(map).map(([label, value]) => ({ label, value, pct: value / total }));
  }, [purchases]);

  const prodName = useMemo(() => {
    const map: Record<number, string> = {};
    for (const p of products) map[p.product_id] = p.product_name;
    return map;
  }, [products]);

  const purchasesByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of purchases) {
      const items: any[] = p.items || [];
      for (const it of items) {
        const name = prodName[it.product_id] || `Product ${it.product_id}`;
        map[name] = (map[name] || 0) + Number(it.total_price || 0);
      }
    }
    const total = Object.values(map).reduce((a,b)=>a+b,0) || 1;
    return Object.entries(map).map(([label, value]) => ({ label, value, pct: value / total })).slice(0,8);
  }, [purchases, prodName]);

  const salesLast7 = useMemo(() => {
    const days: { date: string, total: number }[] = [];
    for (let i=6;i>=0;i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const key = d.toISOString().slice(0,10);
      let sum = 0;
      for (const s of salesById) if (String(s.date).slice(0,10) === key) sum += Number(s.total_amount || 0);
      days.push({ date: key, total: Number(sum.toFixed(2)) });
    }
    return days;
  }, [salesById]);

  const maxBar = Math.max(...salesLast7.map(d=>d.total), 1);

  const expensesLast7 = useMemo(() => {
    const days: { date: string, total: number }[] = [];
    for (let i=6;i>=0;i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const key = d.toISOString().slice(0,10);
      let sum = 0;
      for (const e of expensesRows) {
        const k = e.created_at ? new Date(e.created_at).toISOString().slice(0,10) : '';
        if (k === key) sum += Number(e.amount || 0);
      }
      days.push({ date: key, total: Number(sum.toFixed(2)) });
    }
    return days;
  }, [expensesRows]);

  const maxStatusBar = Math.max(
    ...salesLast7.map(d=>d.total),
    ...expensesLast7.map(d=>d.total),
    1
  );

  return (
    <Layout backgroundColor="#  808080" mainContentPadding={0}>
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Main Content Area */}
        <div style={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 24px 0 24px',
          overflow: 'hidden',
          gap: 10,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ color: '#134E8E', fontSize: 'clamp(24px, 4vh, 44px)', fontWeight: 900, margin: 0 }}>Dashboard</h2>
            <div />
          </div>

          {/* Top Section: Quick Access & Stats */}
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div onClick={goSales} style={{ cursor: 'pointer', padding: 18, borderRadius: 14, background: '#134E8E', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)'; }}>
                <div style={{ color: '#ccc', fontWeight: 700, opacity: 0.9 }}>Quick Access</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Sales</div>
                <div style={{ fontSize: 12, color: '#ccc' }}>Create and manage sales</div>
                <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', top: 10, right: 10 }}>
                  <circle cx={9} cy={20} r={2} fill="#2e7d32" />
                  <circle cx={17} cy={20} r={2} fill="#2e7d32" />
                  <path d="M3 4h2l2 12h10l2-6H8" fill="none" stroke="#2e7d32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div onClick={goProducts} style={{ cursor: 'pointer', padding: 18, borderRadius: 14, background: '#134E8E', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)'; }}>
                <div style={{ color: '#ccc', fontWeight: 700, opacity: 0.9 }}>Quick Access</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Products</div>
                <div style={{ fontSize: 12, color: '#ccc' }}>View and edit products</div>
                <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', top: 10, right: 10 }}>
                  <path d="M3 8l9-5 9 5v8l-9 5-9-5z" fill="#1976d2" opacity={0.8} />
                  <path d="M12 3v18" stroke="#0d47a1" strokeWidth={2} opacity={0.6} />
                </svg>
              </div>
              <div onClick={() => setShowLowStockModal(true)} style={{ cursor: 'pointer', padding: 18, borderRadius: 14, background: lowStockItems.length > 0 ? '#b71c1c' : '#134E8E', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)'; }}>
                <div style={{ color: '#ccc', fontWeight: 700, opacity: 0.9 }}>Alerts</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Low Stock: {lowStockItems.length}</div>
                <div style={{ fontSize: 12, color: '#ccc' }}>Click to view details</div>
                <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', top: 10, right: 10 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#fff" opacity={0.8} />
                </svg>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ padding: 18, borderRadius: 14, background: '#134E8E', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)'; }}>
                <div style={{ color: '#ccc', fontWeight: 700, opacity: 0.9 }}>Today Sales</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Rs. {fmt(todaySales)}</div>
                <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', top: 10, right: 10 }}>
                  <path d="M4 16l4-4 4 3 6-8" fill="none" stroke="#2e7d32" strokeWidth={2} />
                  <circle cx={4} cy={16} r={2} fill="#2e7d32" />
                  <circle cx={8} cy={12} r={2} fill="#2e7d32" />
                  <circle cx={12} cy={15} r={2} fill="#2e7d32" />
                  <circle cx={18} cy={7} r={2} fill="#2e7d32" />
                </svg>
              </div>
              <div style={{ padding: 18, borderRadius: 14, background: '#134E8E', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)'; }}>
                <div style={{ color: '#ccc', fontWeight: 700, opacity: 0.9 }}>Today Expenses</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Rs. {fmt(todayExpenses)}</div>
                <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', top: 10, right: 10 }}>
                  <circle cx={12} cy={12} r={9} fill="#c62828" opacity={0.85} />
                  <path d="M8 12h8" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ padding: 18, borderRadius: 14, background: '#134E8E', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)'; }}>
                <div style={{ color: '#ccc', fontWeight: 700, opacity: 0.9 }}>Profit</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Rs. {fmt(todayProfit)}</div>
                <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', top: 10, right: 10 }}>
                  <path d="M4 16h4l3-6 4 5 5-9" fill="none" stroke="#2e7d32" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ padding: 18, borderRadius: 14, background: '#134E8E', border: 'none', boxShadow: '0 6px 18px rgba(0,0,0,0.2)', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)'; }}>
                <div style={{ color: '#ccc', fontWeight: 700, opacity: 0.9 }}>Most Moving</div>
                {mostMoving.length === 0 ? (
                  <div style={{ color: '#aaa' }}>No data</div>
                ) : (
                  mostMoving.map(m => (
                    <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                      <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      <div style={{ fontWeight: 700 }}>{m.qty}</div>
                    </div>
                  ))
                )}
                <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', top: 10, right: 10 }}>
                  <path d="M12 2l3 6h6l-4.5 3.5L18 18l-6-3-6 3 1.5-6.5L3 8h6z" fill="#f9a825" />
                </svg>
              </div>
            </div>
          </div>

          {/* Charts Section - Flexible */}
          <div style={{ flex: '1 1 0', minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 12 }}>
            {/* Purchases by Vendor */}
            <div style={{ padding: 16, borderRadius: 12, background: '#134E8E', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', border: 'none', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease', color: '#fff', display: 'flex', flexDirection: 'column' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)'; }}>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8, flex: '0 0 auto' }}>Purchases by Vendor</div>
              <svg width={36} height={36} viewBox="0 0 24 24" style={{ position: 'absolute', top: 10, right: 10 }}>
                <path d="M3 7h18l-2 12H5L3 7z" fill="#fff" opacity={0.6} />
                <path d="M7 7l2-3h6l2 3" stroke="#fff" strokeWidth={1.5} fill="none" />
              </svg>
              <div style={{ flex: '1 1 0', display: 'flex', gap: 12, alignItems: 'center', minHeight: 0, overflow: 'hidden' }}>
                <div style={{ flex: '0 0 auto', height: '100%', aspectRatio: '1/1', position: 'relative' }}>
                   <svg viewBox="0 0 280 240" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
                      <rect x={0} y={0} width={280} height={240} fill="#444" rx={12} />
                      {(() => {
                        const CX = 140, CY = 120, R = 100;
                        let acc = 0;
                        function arcPath(cx:number, cy:number, r:number, start:number, end:number) {
                          const s = (start-90) * Math.PI/180; const e = (end-90) * Math.PI/180;
                          const x1 = cx + r*Math.cos(s); const y1 = cy + r*Math.sin(s);
                          const x2 = cx + r*Math.cos(e); const y2 = cy + r*Math.sin(e);
                          const large = (end-start) > 180 ? 1 : 0;
                          return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
                        }
                        const grads = purchasesByVendor.map((seg, idx) => {
                          const base = standardColors[idx%standardColors.length];
                          const light = adjust(base, 80);
                          const dark = adjust(base, 20);
                          return { id: `vendorGrad-${idx}`, light, dark };
                        });
                        const elems = [] as JSX.Element[];
                        elems.push(
                          <defs key="defs-vendor">
                            {grads.map(g => (
                              <linearGradient id={g.id} x1="0" y1="0" x2="1" y2="1" key={g.id}>
                                <stop offset="0%" stopColor={g.light} />
                                <stop offset="100%" stopColor={g.dark} />
                              </linearGradient>
                            ))}
                          </defs>
                        );
                        purchasesByVendor.forEach((seg, idx) => {
                          const start = acc*360; const end = (acc+seg.pct)*360; acc += seg.pct;
                          elems.push(<path key={seg.label} d={arcPath(CX,CY,R,start,end)} fill={`url(#${grads[idx].id})`} opacity={0.85} />);
                        });
                        return elems;
                      })()}
                   </svg>
                </div>
                <div style={{ flex: '1 1 auto', overflowY: 'auto', maxHeight: '100%', fontSize: '0.9em' }}>
                  {purchasesByVendor.slice(0,8).map((seg, i) => (
                    <div key={seg.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: `linear-gradient(135deg, ${adjust(standardColors[i%standardColors.length], 80)}, ${adjust(standardColors[i%standardColors.length], 20)})` }} />
                        <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{seg.label}</div>
                      </div>
                      <div style={{ fontWeight: 800 }}>{Math.round(seg.pct*100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Chart */}
            <div style={{ padding: 16, borderRadius: 12, background: '#134E8E', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', border: 'none', position: 'relative', transition: 'transform 150ms ease, box-shadow 150ms ease', color: '#fff', display: 'flex', flexDirection: 'column' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)'; }}>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8, flex: '0 0 auto' }}>Status</div>
              <svg width={28} height={28} viewBox="0 0 24 24" style={{ position: 'absolute', top: 12, right: 12 }}>
                <rect x={4} y={12} width={4} height={8} rx={1} fill="#66bb6a" />
                <rect x={10} y={8} width={4} height={12} rx={1} fill="#ef5350" />
                <rect x={16} y={6} width={4} height={14} rx={1} fill="#66bb6a" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flex: '0 0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: 'linear-gradient(135deg, #66bb6a, #2e7d32)' }} />
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Sales</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: 'linear-gradient(135deg, #ef5350, #c62828)' }} />
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Expenses</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative', padding: '12px 6px 24px 6px', borderRadius: 12, background: 'repeating-linear-gradient(to top, #444 0, #444 1px, transparent 1px, transparent 32px)' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: '100%' }}>
                  {salesLast7.map((s, idx) => {
                    const e = expensesLast7[idx] || { date: s.date, total: 0 };
                    const hs = Math.round((s.total / maxStatusBar) * 80) + 5 + '%'; // Use percentage for height
                    const he = Math.round((e.total / maxStatusBar) * 80) + 5 + '%';
                    return (
                      <div key={s.date} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: '100%', flex: 1, justifyContent: 'center' }}>
                        <div title={`Sales Rs. ${fmt(s.total)}`} style={{ width: '40%', background: 'linear-gradient(180deg, #66bb6a, #2e7d32)', height: hs, borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.12)', transition: 'height 300ms ease' }} />
                        <div title={`Expenses Rs. ${fmt(e.total)}`} style={{ width: '40%', background: 'linear-gradient(180deg, #ef5350, #c62828)', height: he, borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.12)', transition: 'height 300ms ease' }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ position: 'absolute', left: 6, right: 6, bottom: 24, height: 1, background: '#666', borderRadius: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginTop: 8, padding: '0 6px', flex: '0 0 auto' }}>
                {salesLast7.map(s => (
                  <div key={s.date} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#ccc' }}>{s.date.slice(5)}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
        </div>
      </div>

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowLowStockModal(false)}>
          <div style={{
            background: '#333', padding: 24, borderRadius: 12,
            width: '90%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto',
            color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Low Stock Alerts</h2>
              <button onClick={() => setShowLowStockModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>&times;</button>
            </div>
            {lowStockItems.length === 0 ? (
              <p>No low stock items.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #555' }}>
                    <th style={{ textAlign: 'left', padding: 8 }}>Product</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Current Stock</th>
                    <th style={{ textAlign: 'right', padding: 8 }}>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => (
                    <tr key={item.product_id} style={{ borderBottom: '1px solid #444' }}>
                      <td style={{ padding: 8 }}>{item.product_name}</td>
                      <td style={{ padding: 8, textAlign: 'right', color: '#ff4444', fontWeight: 'bold' }}>{item.current_stock}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{item.low_stock_threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
