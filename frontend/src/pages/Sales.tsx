import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { get, post } from '../services/api';
import Layout from '../components/Layout';

const roseGold = '#134E8E';
const roseGoldLight = '#e0e0e0';
const gold = '#134E8E';
const goldHover = '#003366';

export default function Sales() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [lcName, setLcName] = useState('');
  const [lcMobile, setLcMobile] = useState('');
  const [lcJoined, setLcJoined] = useState('');
  const [lcNic, setLcNic] = useState('');
  const [lcAddress, setLcAddress] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [discount, setDiscount] = useState('');
  const [note, setNote] = useState('');
  const [inventory, setInventory] = useState<Array<{ inventory_id: number; product_id: number; product_name: string | null; vendor_name: string | null; brand: string | null; sku: string | null; qty: number | string; purchase_date: string | null }>>([]);
  const [error, setError] = useState('');
  const [items, setItems] = useState<Array<{ inventory_id: number | null; invQuery: string; showSuggest: boolean; sku: string | null; qtyUnit: string; qty: string; brand: string; unitPrice: number | null; sellingPrice: number | null; productDiscount: string; barcode: string | null; purchase_date: string | null; availableQty: number | null }>>([
    { inventory_id: null, invQuery: '', showSuggest: false, sku: null, qtyUnit: 'PCS', qty: '', brand: '', unitPrice: null, sellingPrice: null, productDiscount: '', barcode: null, purchase_date: null, availableQty: null }
  ]);
  const [sales, setSales] = useState<Array<{ sale_id: number; sale_invoice_no: string | null; date: string; total_amount: number | null; discount: number | null; note: string | null; customer_name: string | null; items: Array<{ sales_item_id: number; inventory_id: number; qty: number; brand: string | null; unit_price: number | null; selling_price: number | null; profit: number | null }> }>>([]);
  const [latestInvoiceNo, setLatestInvoiceNo] = useState<string | null>(null);
  const [fInvoice, setFInvoice] = useState('');
  const [fCustomer, setFCustomer] = useState('');
  const [fContact, setFContact] = useState('');
  const [fDateFrom, setFDateFrom] = useState('');
  const [fDateTo, setFDateTo] = useState('');
  const [fProduct, setFProduct] = useState('');
  const [fInventoryId, setFInventoryId] = useState('');
  const [fBrand, setFBrand] = useState('');
  const [fTotalMin, setFTotalMin] = useState('');
  const [fTotalMax, setFTotalMax] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'Cash Payment' | 'Card Payment' | null>(null);
  const [amountGiven, setAmountGiven] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const [hoveredSaleId, setHoveredSaleId] = useState<number | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappInvoiceData, setWhatsappInvoiceData] = useState<any>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoyaltyCustomer, setIsLoyaltyCustomer] = useState(false);
  const [loyaltyCustomerName, setLoyaltyCustomerName] = useState('');

  const invRefs = useRef<Array<HTMLInputElement | null>>([]);
  const qtyRefs = useRef<Array<HTMLInputElement | null>>([]);
  const unitRefs = useRef<Array<HTMLSelectElement | null>>([]);
  const brandRefs = useRef<Array<HTMLInputElement | null>>([]);
  const invoiceRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLInputElement | null>(null);
  const customerRef = useRef<HTMLInputElement | null>(null);
  const contactRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLInputElement | null>(null);
  const discountRef = useRef<HTMLInputElement | null>(null);
  const noteRef = useRef<HTMLInputElement | null>(null);

  async function refreshInventoryLatest() {
    try {
      const r = await get('/inventory');
      setInventory(r.inventory || []);
    } catch (err: any) {
      if (err?.status === 401) navigate('/login', { replace: true });
    }
  }

  useEffect(() => {
    setItems(prev => prev.map(it => {
      if (!it.inventory_id) return it;
      const match = inventory.find(rr => rr.inventory_id === it.inventory_id && (!it.purchase_date || (rr.purchase_date && String(rr.purchase_date).slice(0,10) === it.purchase_date)));
      const avail = match ? Number((match as any).qty) : NaN;
      if (isNaN(avail)) return it;
      const isGrams = (it.sku || '') === 'Grams';
      const curQtyNum = Number(it.qty || 0);
      if (isNaN(curQtyNum)) return { ...it, availableQty: avail };
      if (isGrams) {
        const eff = it.qtyUnit === 'KG' ? curQtyNum * 1000 : curQtyNum;
        const clampedEff = Math.min(eff, avail);
        const nextQtyStr = it.qtyUnit === 'KG' ? String(clampedEff / 1000) : String(clampedEff);
        return { ...it, availableQty: avail, qty: nextQtyStr };
      } else {
        const nextQtyStr = String(Math.min(curQtyNum, avail));
        return { ...it, availableQty: avail, qty: nextQtyStr };
      }
    }));
  }, [inventory]);

  function focusField(row: number, field: 'inv'|'qty'|'unit'|'brand') {
    if (field === 'inv') { const el = invRefs.current[row]; if (el) el.focus(); }
    else if (field === 'qty') { const el = qtyRefs.current[row]; if (el) el.focus(); }
    else if (field === 'unit') { const el = unitRefs.current[row]; if (el) el.focus(); }
    else { const el = brandRefs.current[row]; if (el) el.focus(); }
  }

  function keyOrder() {
    const arr: string[] = ['invoice','date','customer','contact','address'];
    for (let i = 0; i < items.length; i++) {
      arr.push(`inv-${i}`, `qty-${i}`, `unit-${i}`, `brand-${i}`);
    }
    arr.push('discount','note');
    return arr;
  }

  function focusByKey(k: string) {
    if (k === 'invoice') { const el = invoiceRef.current; if (el) el.focus(); return; }
    if (k === 'date') { const el = dateRef.current; if (el) el.focus(); return; }
    if (k === 'customer') { const el = customerRef.current; if (el) el.focus(); return; }
    if (k === 'contact') { const el = contactRef.current; if (el) el.focus(); return; }
    if (k === 'address') { const el = addressRef.current; if (el) el.focus(); return; }
    if (k === 'discount') { const el = discountRef.current; if (el) el.focus(); return; }
    if (k === 'note') { const el = noteRef.current; if (el) el.focus(); return; }
    const m = /^(inv|qty|unit|brand)-(\d+)$/.exec(k);
    if (m) {
      const field = m[1] as 'inv'|'qty'|'unit'|'brand';
      const row = Number(m[2]);
      focusField(row, field);
    }
  }

  function handleNavKey(e: React.KeyboardEvent, currentKey: string) {
    const key = e.key;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'ArrowUp' && key !== 'ArrowDown') return;
    e.preventDefault();
    const order = keyOrder();
    const idx = order.indexOf(currentKey);
    if (idx === -1) return;
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      const next = Math.min(idx + 1, order.length - 1);
      focusByKey(order[next]);
    } else {
      const prev = Math.max(idx - 1, 0);
      focusByKey(order[prev]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, row: number, field: 'inv'|'qty'|'unit'|'brand') {
    const key = e.key;
    if (key === 'Enter') {
      e.preventDefault();
      if (field === 'inv') {
        const it = items[row];
        const list = (it && it.invQuery) ? filteredFor(it.invQuery) : [];
        if (list && list[0]) {
          pickInventory({ inventory_id: list[0].inventory_id, product_name: list[0].product_name, brand: list[0].brand, sku: list[0].sku, purchase_date: list[0].purchase_date || null }, row);
          setTimeout(() => focusField(row, 'qty'), 0);
        } else {
          focusField(row, 'qty');
        }
      } else if (field === 'qty' || field === 'unit') {
        focusField(row, 'brand');
      } else if (field === 'brand') {
        setItems(prev => {
          const next = [...prev, { inventory_id: null, invQuery: '', showSuggest: false, sku: null, qtyUnit: 'PCS' as 'PCS', qty: '', brand: '', unitPrice: null, sellingPrice: null, productDiscount: '', barcode: null, purchase_date: null, availableQty: null }];
          setTimeout(() => focusField(prev.length, 'inv'), 0);
          return next;
        });
      }
      return;
    }
    handleNavKey(e, `${field}-${row}`);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sales_form_cache');
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.invoiceNo === 'string') setInvoiceNo(d.invoiceNo);
        if (typeof d.customerName === 'string') setCustomerName(d.customerName);
        if (typeof d.contactNo === 'string') setContactNo(d.contactNo);
        if (typeof d.address === 'string') setAddress(d.address);
        if (typeof d.date === 'string') setDate(d.date);
        if (typeof d.discount === 'string') setDiscount(d.discount);
        if (typeof d.note === 'string') setNote(d.note);
        if (Array.isArray(d.items)) setItems(d.items);
        if (d.showForm === true) setShowForm(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const data = { invoiceNo, customerName, contactNo, address, date, discount, note, items, showForm };
    try { localStorage.setItem('sales_form_cache', JSON.stringify(data)); } catch {}
  }, [invoiceNo, customerName, contactNo, address, date, discount, note, items, showForm]);

  useEffect(() => {
    if (!showForm) return;
    const hasBarcode = items.some(it => {
      const code = (it.barcode || '').trim();
      return code.length > 0;
    });
    if (hasBarcode) { refreshInventoryLatest(); }
  }, [showForm, items]);

  useEffect(() => {
    (async () => {
      const next: typeof items = [...items];
      let changed = false;
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const code = (it.barcode || '').trim();
        if (!isValidBarcode(code)) continue;
        try {
          const r = await get(`/barcode/${encodeURIComponent(code)}/pricing`);
          const availServer = (r?.available_qty !== undefined && r?.available_qty !== null) ? Number(r.available_qty) : NaN;
          if (!isNaN(availServer)) {
            const isGrams = (it.sku || r?.sku || '') === 'Grams';
            const qtyNum = Number(it.qty || 0);
            const eff = isGrams ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
            const clampedEff = Math.min(eff, availServer);
            const nextQtyStr = isGrams ? (it.qtyUnit === 'KG' ? String(clampedEff / 1000) : String(clampedEff)) : String(clampedEff);
            const curAvail = it.availableQty;
            if (curAvail !== availServer || eff > availServer) {
              next[idx] = { ...it, availableQty: availServer, qty: nextQtyStr };
              changed = true;
            }
          }
        } catch {}
      }
      if (changed) setItems(next);
    })();
  }, [items]);

  function logout() {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }
  function goHome() { navigate('/dashboard'); }

  function computeNextInvoice(prev: string | null) {
    const p = (prev || '').toString().trim();
    const m = /(.*?)(\d+)\s*$/.exec(p);
    if (!m) return 'INV-1';
    const prefix = m[1];
    const numStr = m[2];
    const num = Number(numStr);
    const inc = isNaN(num) ? 1 : (num + 1);
    const padded = String(inc).padStart(numStr.length, '0');
    return `${prefix}${padded}`;
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await get('/inventory');
        setInventory(r.inventory || []);
      } catch (err: any) {
        if (err?.status === 401) navigate('/login', { replace: true });
      }
      try {
        const r = await get('/sales');
        const rows: any[] = r.sales || [];
        const latest = rows.find(row => row.sale_invoice_no)?.sale_invoice_no || null;
        setLatestInvoiceNo(latest);
        const map: Record<number, any> = {};
        for (const row of rows) {
          if (!map[row.sale_id]) {
            map[row.sale_id] = {
              sale_id: row.sale_id,
              sale_invoice_no: row.sale_invoice_no || null,
              date: row.date,
              total_amount: row.total_amount ?? null,
              discount: row.discount ?? null,
              note: row.note ?? null,
              customer_name: row.customer_name || null,
              contact_no: row.contact_no || null,
              items: []
            };
          }
          if (row.sales_item_id) {
            map[row.sale_id].items.push({
              sales_item_id: row.sales_item_id,
              inventory_id: row.inventory_id,
              qty: row.qty,
              brand: row.brand ?? null,
              unit_price: row.unit_price ?? null,
              selling_price: row.selling_price ?? null,
              profit: row.profit ?? null,
            });
          }
        }
        setSales(Object.values(map));
      } catch (err: any) {
        if (err?.status === 401) navigate('/login', { replace: true });
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!showForm || !contactNo || contactNo.trim().length === 0) {
      setIsLoyaltyCustomer(false);
      setLoyaltyCustomerName('');
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const r = await get(`/loyalty/check/${encodeURIComponent(contactNo.trim())}`);
        if (r.isLoyaltyCustomer && r.customer) {
          setIsLoyaltyCustomer(true);
          setLoyaltyCustomerName(r.customer.name || '');
          if (!customerName) {
            setCustomerName(r.customer.name || '');
          }
        } else {
          setIsLoyaltyCustomer(false);
          setLoyaltyCustomerName('');
        }
      } catch (err) {
        console.error('Error checking loyalty status:', err);
        setIsLoyaltyCustomer(false);
        setLoyaltyCustomerName('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [contactNo, showForm]);

  useEffect(() => {
    if (!showForm) return;
    (async () => {
      try {
        const rInv = await get('/inventory');
        setInventory(rInv.inventory || []);
      } catch (err: any) {
        if (err?.status === 401) navigate('/login', { replace: true });
      }
      try {
        const r = await get('/sales');
        const rows: any[] = r.sales || [];
        let latestStr: string | null = null;
        let latestNum = -1;
        for (const row of rows) {
          const inv = row.sale_invoice_no ? String(row.sale_invoice_no) : '';
          const m = /(.*?)(\d+)\s*$/.exec(inv);
          if (m) {
            const num = Number(m[2]);
            if (!isNaN(num) && num >= latestNum) {
              latestNum = num;
              latestStr = inv;
            }
          }
        }
        setLatestInvoiceNo(latestStr);
        setInvoiceNo(computeNextInvoice(latestStr));
      } catch (err: any) {
        if (err?.status === 401) navigate('/login', { replace: true });
      }
      if (!date || date.trim().length === 0) {
        setDate(new Date().toLocaleDateString('en-CA'));
      }
    })();
  }, [showForm]);

  function filteredFor(q: string) {
    const vv = (q || '').trim();
    if (/^\d+(?:\s*,\s*\d+)*$/.test(vv)) {
      const ids = vv.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      const set = new Set(ids);
      return inventory.filter(i => set.has(i.product_id));
    }
    const qq = vv.toLowerCase();
    return inventory.filter(i =>
      (i.product_name || '').toLowerCase().includes(qq)
      || (i.brand || '').toLowerCase().includes(qq)
      || (i.vendor_name || '').toLowerCase().includes(qq)
      || (i.sku || '').toLowerCase().includes(qq)
      || String(i.inventory_id || '').includes(vv)
    );
  }

  function roundUpToNearest5(n: number) {
    return Math.ceil(n / 5) * 5;
  }

  // Unified function to calculate total amount with all discounts applied
  function calculateTotalAmount(itemsList: typeof items, discountPercent: string, isLoyalty: boolean): number {
    const sum = itemsList.reduce((acc, it) => {
      const qtyNum = Number(it.qty || 0);
      const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
      let lineTotal = 0;
      if ((it.sku || '') === 'Grams') {
        const perUnit = (it.unitPrice || 0) * 1.3;
        lineTotal = roundUpToNearest5(perUnit * effectiveQty);
      } else {
        lineTotal = effectiveQty * (it.sellingPrice || 0);
      }
      // Apply per-product discount
      const prodDisc = Number(it.productDiscount || 0);
      if (prodDisc > 0) {
        lineTotal = lineTotal * (1 - prodDisc / 100);
      }
      return acc + lineTotal;
    }, 0);
    // Apply loyalty discount (12%), then overall discount
    const afterLoyalty = isLoyalty ? sum * 0.88 : sum;
    const d = Number(discountPercent || 0);
    const net = afterLoyalty * (1 - (isNaN(d) ? 0 : d / 100));
    return net;
  }

  function isValidBarcode(code: string): boolean {
    const trimmed = (code || '').trim();
    if (!trimmed) return false;
    // Accept both custom "BC-" format and standard retail barcodes (numeric)
    return trimmed.toUpperCase().startsWith('BC-') || /^\d+$/.test(trimmed);
  }

  function parseBarcodeInfo(code: string): { inventory_id: number | null; purchase_date: string | null } {
    const vv = (code || '').trim().toUpperCase();
    const m = vv.match(/^BC-(\d+)-(?:[A-Z0-9_-]+-)?INV-(\d+)-(\d{8})$/);
    if (!m) return { inventory_id: null, purchase_date: null };
    const invId = Number(m[2]);
    const y = m[3].slice(0,4), mo = m[3].slice(4,6), d = m[3].slice(6,8);
    const date = `${y}-${mo}-${d}`;
    return { inventory_id: isNaN(invId) ? null : invId, purchase_date: date };
  }

  function normDate(val: any): string | null {
    if (!val) return null;
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0,10);
    } catch {}
    const s = String(val);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
    return null;
  }

  function computeAvailableQty(it: { inventory_id: number | null; purchase_date: string | null; availableQty: number | null }): number | null {
    const invId = it.inventory_id as number | null;
    if (!invId) return null;
    const itDate = normDate(it.purchase_date);
    if (itDate) {
      const row = inventory.find(rr => {
        const rrDate = normDate((rr as any).purchase_date);
        return rr.inventory_id === invId && rrDate === itDate;
      });
      const qty = row ? Number((row as any).qty) : NaN;
      if (!isNaN(qty)) return qty;
    }
    let sum = 0;
    let found = false;
    for (const rr of inventory) {
      if (rr.inventory_id === invId) {
        const q = Number((rr as any).qty);
        if (!isNaN(q)) { sum += q; found = true; }
      }
    }
    return found ? sum : null;
  }

  async function pickInventory(i: { inventory_id: number; product_name: string | null; brand: string | null; sku?: string | null; purchase_date?: string | null }, row?: number) {
    if (typeof row === 'number') {
      try { await refreshInventoryLatest(); } catch {}
      const sku = i.sku ?? null;
      const invMatch = inventory.find(r => r.inventory_id === i.inventory_id && (i.purchase_date ? normDate(r.purchase_date) === normDate(i.purchase_date) : true));
      const avail = invMatch ? Number((invMatch as any).qty) : null;
      setItems(prev => prev.map((it, idx) => {
        if (idx !== row) return it;
        const pd = i.purchase_date ? (() => { const d2 = new Date(i.purchase_date as string); return isNaN(d2.getTime()) ? String(i.purchase_date).slice(0,10) : d2.toLocaleDateString('en-CA'); })() : null;
        const curQtyNum = Number(it.qty || 0);
        let nextQtyStr = it.qty;
        if (!isNaN(curQtyNum) && avail !== null && !isNaN(avail)) {
          if ((sku || '') === 'Grams') {
            const eff = it.qtyUnit === 'KG' ? curQtyNum * 1000 : curQtyNum;
            const clampedEff = Math.min(eff, avail);
            nextQtyStr = it.qtyUnit === 'KG' ? String(clampedEff / 1000) : String(clampedEff);
          } else {
            nextQtyStr = String(Math.min(curQtyNum, avail));
          }
        }
        return { ...it, inventory_id: i.inventory_id, invQuery: `${i.product_name || ''} ${i.brand ? `(${i.brand})` : ''}`.trim(), showSuggest: false, sku, qtyUnit: sku || 'PCS', brand: i.brand || '', purchase_date: pd, availableQty: (avail !== null && !isNaN(avail)) ? avail : null, qty: nextQtyStr };
      }));
      try {
        const dLocal = i.purchase_date ? (() => { const d3 = new Date(i.purchase_date as string); return isNaN(d3.getTime()) ? String(i.purchase_date).slice(0,10) : d3.toLocaleDateString('en-CA'); })() : null;
        const dateParam = dLocal ? `?date=${encodeURIComponent(dLocal)}` : '';
        const brandParam = i.brand ? `${dateParam ? '&' : '?'}brand=${encodeURIComponent(i.brand)}` : '';
        console.log('🔍 Fetching pricing for inventory_id:', i.inventory_id, 'date:', dLocal, 'brand:', i.brand);
        const r = await get(`/inventory/${i.inventory_id}/unit-price${dateParam}${brandParam}`);
        console.log('📦 API Response:', r);
        const u = r.unit_price !== undefined && r.unit_price !== null ? Number(r.unit_price) : null;
        const s = r.selling_price !== undefined && r.selling_price !== null ? Number(r.selling_price) : null;
        console.log('💰 Parsed values - unit_price:', u, 'selling_price:', s);
        setItems(prev => prev.map((it, idx) => {
          if (idx !== row) return it;
          const isGrams = sku === 'Grams';
          const perUnitSell = s !== null ? s : (u !== null ? (isGrams ? Number((u * 1.3).toFixed(2)) : roundUpToNearest5(u * 1.3)) : null);
          return { ...it, unitPrice: u, sellingPrice: perUnitSell };
        }));
      } catch {}
    }
  }

  async function checkLoyaltyAndSendWhatsApp(invoiceData: any) {
    // Check if contact number exists
    if (!invoiceData.contact_no || !invoiceData.contact_no.trim()) {
      return; // No contact number, skip WhatsApp
    }

    try {
      // Check WhatsApp connection status - use IPC if in Electron, otherwise HTTP
      const statusResult = (window as any).electronAPI?.whatsapp
        ? await (window as any).electronAPI.whatsapp.getStatus()
        : await get('/whatsapp/status');
        
      if (!statusResult.isConnected) {
        return; // WhatsApp not connected, skip
      }

      // Prepare invoice data for WhatsApp modal
      setWhatsappInvoiceData(invoiceData);
      setShowWhatsAppModal(true);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      // Silently fail, don't interrupt the sale process
    }
  }

  async function sendWhatsAppInvoice() {
    if (!whatsappInvoiceData) return;

    setSendingWhatsApp(true);
    try {
      // Use IPC if in Electron, otherwise fallback to HTTP
      if ((window as any).electronAPI?.whatsapp) {
        const result = await (window as any).electronAPI.whatsapp.sendInvoice({
          contact_no: whatsappInvoiceData.contact_no,
          invoice_no: whatsappInvoiceData.invoice_no,
          date: whatsappInvoiceData.date,
          customer_name: whatsappInvoiceData.customer_name,
          items: whatsappInvoiceData.items,
          discount: whatsappInvoiceData.discount,
          total_amount: whatsappInvoiceData.total_amount,
          payment_type: whatsappInvoiceData.payment_type
        });

        if (result.success) {
          alert('✅ Invoice sent via WhatsApp successfully!');
          setShowWhatsAppModal(false);
          setWhatsappInvoiceData(null);
        } else {
          alert('❌ ' + (result.error || result.message || 'Failed to send WhatsApp message'));
        }
      } else {
        await post('/whatsapp/send-invoice', {
          contact_no: whatsappInvoiceData.contact_no,
          invoice_no: whatsappInvoiceData.invoice_no,
          date: whatsappInvoiceData.date,
          customer_name: whatsappInvoiceData.customer_name,
          items: whatsappInvoiceData.items,
          discount: whatsappInvoiceData.discount,
          total_amount: whatsappInvoiceData.total_amount,
          payment_type: whatsappInvoiceData.payment_type
        });

        alert('✅ Invoice sent via WhatsApp successfully!');
        setShowWhatsAppModal(false);
        setWhatsappInvoiceData(null);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to send WhatsApp message';
      alert('❌ ' + errorMsg);
    } finally {
      setSendingWhatsApp(false);
    }
  }

  async function reprintReceipt(sale: any) {
    try {
      // Get product names for all items
      const receiptItems = sale.items.map((item: any) => {
        const invItem = inventory.find(inv => inv.inventory_id === item.inventory_id);
        const productName = invItem?.product_name || 'Unknown Product';
        return {
          product_name: productName,
          qty: item.qty,
          selling_price: item.selling_price || 0
        };
      });

      await post('/print/receipt-escpos', {
        invoice_no: sale.sale_invoice_no,
        date: sale.date,
        customer_name: sale.customer_name,
        items: receiptItems,
        discount: sale.discount || 0,
        total_amount: sale.total_amount,
        payment_type: 'Cash Payment' // Default for old sales without payment_type
      });
    } catch (err: any) {
      if (err?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return;
      }
      
      // Display detailed error information
      let errorMessage = '❌ Failed to reprint receipt\n\n';
      
      if (err?.data && typeof err.data === 'object') {
        const errorData = err.data;
        errorMessage += `Error: ${errorData.message || err.message}\n`;
        
        if (errorData.errorCategory) {
          errorMessage += `\nCategory: ${errorData.errorCategory}\n`;
        }
        
        if (errorData.details) {
          errorMessage += `\nDetails:\n`;
          errorMessage += `  • Printer: ${errorData.details.printerName}\n`;
          if (errorData.details.errorCode) {
            errorMessage += `  • Error Code: ${errorData.details.errorCode}\n`;
          }
        }
        
        if (errorData.troubleshooting && errorData.troubleshooting.length > 0) {
          errorMessage += `\nTroubleshooting Steps:\n`;
          errorData.troubleshooting.forEach((step: string) => {
            errorMessage += `${step}\n`;
          });
        }
        
        if (errorData.availablePrinters && errorData.availablePrinters.length > 0) {
          errorMessage += `\nAvailable Printers:\n`;
          errorData.availablePrinters.forEach((printer: string) => {
            errorMessage += `  • ${printer}\n`;
          });
        }
      } else {
        errorMessage += err?.message || 'Unknown error occurred';
      }
      
      alert(errorMessage);
    }
  }

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 700 }}>Sales</h2>
        </div>
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowForm(v => { const nv = !v; if (!v) { const todayStr = new Date().toLocaleDateString('en-CA'); if (!invoiceNo) { const p = (latestInvoiceNo || '').toString().trim(); const m = /(.*?)(\d+)\s*$/.exec(p); const next = m ? `${m[1]}${String((Number(m[2])||0)+1).padStart(m[2].length, '0')}` : 'INV-1'; setInvoiceNo(next); } if (!date) setDate(todayStr); } return nv; })}
            style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
            onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff' }}
          >
            {showForm ? 'Close' : 'Add Sale'}
          </button>
          <button
            onClick={() => setShowLoyalty(true)}
            style={{ marginLeft: 8, background: roseGold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
          >
            Add Loyalty Customer
          </button>
        </div>

        {showForm && (
          <div style={{ borderRadius: 12, padding: 16, width: '100%', maxWidth: 1400, background: '#808080', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', boxSizing: 'border-box', marginBottom: 16, color: '#fff' }}>
            {error && (<div style={{ color: '#ff6b6b', marginBottom: 12 }}>{error}</div>)}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Invoice No</label>
                <input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} onKeyDown={e=>handleNavKey(e,'invoice')} ref={invoiceRef} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Date</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} onKeyDown={e=>handleNavKey(e,'date')} ref={dateRef} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Customer Name</label>
                <input value={customerName} onChange={e=>setCustomerName(e.target.value)} onKeyDown={e=>handleNavKey(e,'customer')} ref={customerRef} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Contact No</label>
                <input value={contactNo} onChange={e=>setContactNo(e.target.value)} onKeyDown={e=>handleNavKey(e,'contact')} ref={contactRef} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: 'span 2', marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Address</label>
                <input value={address} onChange={e=>setAddress(e.target.value)} onKeyDown={e=>handleNavKey(e,'address')} ref={addressRef} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              {isLoyaltyCustomer && (
                <div style={{ gridColumn: '1 / -1', marginTop: 8, marginBottom: 12, padding: 16, background: '#444', border: `2px solid ${gold}`, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 24 }}>🎁</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>Loyalty Benefits</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#ccc', marginBottom: 4 }}>
                        <strong>Customer:</strong> {loyaltyCustomerName}
                      </div>
                      <div style={{ fontSize: 13, color: '#aaa' }}>
                        This loyal customer automatically receives a special discount
                      </div>
                    </div>
                    <div style={{ padding: '12px 20px', background: gold, color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 16, textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                      12% OFF
                    </div>
                  </div>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: '#fff' }}>Products</div>
                  <button type="button" onClick={() => setItems(prev => [...prev, { inventory_id: null, invQuery: '', showSuggest: false, sku: null, qtyUnit: 'PCS', qty: '', brand: '', unitPrice: null, sellingPrice: null, productDiscount: '', barcode: null, purchase_date: null, availableQty: null }])} style={{ background: gold, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.color = '#fff' }} onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#fff' }}>Add Product</button>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.7fr auto', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6 }}>Inventory Item</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          placeholder="Search product, brand, SKU, or ID"
                          value={it.invQuery}
                          onChange={async e=>{ const v = e.target.value; setItems(prev => prev.map((x, i) => i === idx ? { ...x, invQuery: v, showSuggest: true } : x)); const vv = v.trim();  { try { await refreshInventoryLatest(); const parsed = parseBarcodeInfo(vv); const r = await get(`/barcode/${encodeURIComponent(vv)}/pricing`); const invId = (r?.inventory_id ?? parsed.inventory_id) ?? null; const pDate = normDate(r?.purchase_date || parsed.purchase_date); if (invId) { await pickInventory({ inventory_id: invId, product_name: r.product_name, brand: r.brand, sku: r.sku, purchase_date: pDate || null }, idx); } const unit = (r?.unit_price !== undefined && r?.unit_price !== null) ? Number(r.unit_price) : null; const sell = (r?.selling_price !== undefined && r?.selling_price !== null) ? Number(r.selling_price) : (unit !== null ? (r.sku === 'Grams' ? Number((unit * 1.3).toFixed(2)) : Math.ceil((unit * 1.3) / 5) * 5) : null); const serverAvail = (r?.available_qty !== undefined && r?.available_qty !== null) ? Number(r.available_qty) : NaN; const availQty = !isNaN(serverAvail) ? serverAvail : computeAvailableQty({ inventory_id: invId, purchase_date: pDate || null, availableQty: null }); setItems(prev => prev.map((x, i) => { if (i !== idx) return x; const curNum = Number(x.qty || 0); let nextQtyStr = x.qty; if (!isNaN(curNum) && availQty !== null && !isNaN(availQty as any)) { if ((r.sku || x.sku) === 'Grams') { const eff = x.qtyUnit === 'KG' ? curNum * 1000 : curNum; const clampedEff = Math.min(eff, Number(availQty)); nextQtyStr = x.qtyUnit === 'KG' ? String(clampedEff / 1000) : String(clampedEff); } else { nextQtyStr = String(Math.min(curNum, Number(availQty))); } } return { ...x, inventory_id: (invId ?? x.inventory_id ?? null), invQuery: `${r.product_name || ''}${(r.brand || x.brand) ? ` (${r.brand || x.brand})` : ''}`.trim(), showSuggest: false, sku: r.sku || x.sku || null, qtyUnit: ((r.sku || x.sku) === 'Grams' ? 'Grams' : 'PCS'), brand: r.brand || x.brand || '', unitPrice: unit ?? x.unitPrice ?? null, sellingPrice: sell ?? x.sellingPrice ?? null, barcode: vv, purchase_date: (pDate ?? x.purchase_date ?? null), availableQty: (!isNaN(serverAvail) ? serverAvail : (availQty !== null && !isNaN(availQty as any) ? Number(availQty as any) : (x.availableQty ?? null))), qty: nextQtyStr }; })); } catch {} } }}
                          onKeyDown={e => { handleNavKey(e, `inv-${idx}`); handleKeyDown(e, idx, 'inv'); }}
                          ref={el => { invRefs.current[idx] = el }}
                          onPaste={async e=>{ e.preventDefault(); e.stopPropagation(); const text = (e.clipboardData?.getData('text') || '').trim(); if (isValidBarcode(text)) { try { await refreshInventoryLatest(); const parsed = parseBarcodeInfo(text); const r = await get(`/barcode/${encodeURIComponent(text)}/pricing`); const invId = (r?.inventory_id ?? parsed.inventory_id) ?? null; const pDate = normDate(r?.purchase_date || parsed.purchase_date); if (invId) { await pickInventory({ inventory_id: invId, product_name: r.product_name, brand: r.brand, sku: r.sku, purchase_date: pDate || null }, idx); } const unit = (r?.unit_price !== undefined && r?.unit_price !== null) ? Number(r.unit_price) : null; const sell = (r?.selling_price !== undefined && r?.selling_price !== null) ? Number(r.selling_price) : (unit !== null ? (r.sku === 'Grams' ? Number((unit * 1.3).toFixed(2)) : Math.ceil((unit * 1.3) / 5) * 5) : null); const serverAvail = (r?.available_qty !== undefined && r?.available_qty !== null) ? Number(r.available_qty) : NaN; const availQty = !isNaN(serverAvail) ? serverAvail : computeAvailableQty({ inventory_id: invId, purchase_date: pDate || null, availableQty: null }); setItems(prev => prev.map((x, i) => { if (i !== idx) return x; const curNum = Number(x.qty || 0); let nextQtyStr = x.qty; if (!isNaN(curNum) && availQty !== null && !isNaN(availQty as any)) { if ((r.sku || x.sku) === 'Grams') { const eff = x.qtyUnit === 'KG' ? curNum * 1000 : curNum; const clampedEff = Math.min(eff, Number(availQty)); nextQtyStr = x.qtyUnit === 'KG' ? String(clampedEff / 1000) : String(clampedEff); } else { nextQtyStr = String(Math.min(curNum, Number(availQty))); } } return { ...x, inventory_id: (invId ?? x.inventory_id ?? null), invQuery: `${r.product_name || ''}${(r.brand || x.brand) ? ` (${r.brand || x.brand})` : ''}`.trim(), showSuggest: false, sku: r.sku || x.sku || null, qtyUnit: ((r.sku || x.sku) === 'Grams' ? 'Grams' : 'PCS'), brand: r.brand || x.brand || '', unitPrice: unit ?? x.unitPrice ?? null, sellingPrice: sell ?? x.sellingPrice ?? null, barcode: text, purchase_date: (pDate ?? x.purchase_date ?? null), availableQty: (!isNaN(serverAvail) ? serverAvail : (availQty !== null && !isNaN(availQty as any) ? Number(availQty as any) : (x.availableQty ?? null))), qty: nextQtyStr }; })); } catch {} } }}
                          onFocus={()=>setItems(prev => prev.map((x, i) => i === idx ? { ...x, showSuggest: true } : x))}
                          onBlur={()=>setTimeout(()=>setItems(prev => prev.map((x, i) => i === idx ? { ...x, showSuggest: false } : x)), 150)}
                          style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }}
                        />
                        {it.showSuggest && it.invQuery && filteredFor(it.invQuery).length > 0 && (
                          <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: '#808080', border: '1px solid #555', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
                    {filteredFor(it.invQuery).map(i => (
                              <div key={i.inventory_id} onMouseDown={()=>pickInventory({ inventory_id: i.inventory_id, product_name: i.product_name, brand: i.brand, sku: i.sku, purchase_date: i.purchase_date || null }, idx)} style={{ padding: '8px 12px', cursor: 'pointer', color: '#fff' }} onMouseEnter={e=>{ e.currentTarget.style.background = '#444'; }} onMouseLeave={e=>{ e.currentTarget.style.background = '#808080'; }}>
                                {(i.product_name || 'Unknown')}{i.brand ? ` (${i.brand})` : ''}{i.purchase_date ? ` (Purchased: ${(() => { const d = new Date(i.purchase_date as string); return isNaN(d.getTime()) ? String(i.purchase_date).slice(0,10) : d.toLocaleDateString('en-CA'); })()})` : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6 }}>Qty {it.sku ? `(${it.sku})` : ''}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => { const availCalc = (() => { const a = it.availableQty; if (a !== null && !isNaN(a as any)) return Number(a as any); const m = inventory.find(rr => rr.inventory_id === (it.inventory_id as number) && (!it.purchase_date || (rr.purchase_date && String(rr.purchase_date).slice(0,10) === it.purchase_date))); return m ? Number(m.qty as any) : 0; })(); const qtyNum = Number(it.qty || 0); if (isNaN(qtyNum)) return; if ((it.sku || '') === 'Grams') { const eff = it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum; const stepEff = it.qtyUnit === 'KG' ? 0.01 * 1000 : 0.01; const nextEff = Math.max(0, eff - stepEff); const nextQtyStr = it.qtyUnit === 'KG' ? String(Number((nextEff / 1000).toFixed(3))) : String(nextEff); setItems(prev => prev.map((x, i) => i === idx ? { ...x, qty: nextQtyStr } : x)); } else { const next = Math.max(0, qtyNum - 1); setItems(prev => prev.map((x, i) => i === idx ? { ...x, qty: String(next) } : x)); } }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #555', background: '#444', color: '#fff', cursor: 'pointer' }}>-</button>
                        <input type="number" step={(it.sku || '') === 'PCS' ? 1 : 0.01} value={it.qty} onChange={e=>{ const vStr = e.target.value; const vNum = Number(vStr || 0); const availCalc = (() => { const a = it.availableQty; if (a !== null && !isNaN(a as any)) return Number(a as any); const c = computeAvailableQty({ inventory_id: it.inventory_id as number | null, purchase_date: it.purchase_date, availableQty: it.availableQty }); return c ?? 0; })(); let nextQtyStr = vStr; if (!isNaN(vNum)) { if ((it.sku || '') === 'Grams') { const eff = it.qtyUnit === 'KG' ? vNum * 1000 : vNum; const clampedEff = Math.min(eff, availCalc); nextQtyStr = it.qtyUnit === 'KG' ? String(clampedEff / 1000) : String(clampedEff); } else { const clamped = Math.min(vNum, availCalc); nextQtyStr = String(clamped); } } setItems(prev => prev.map((x, i) => { if (i !== idx) return x; const a2 = computeAvailableQty({ inventory_id: x.inventory_id as number | null, purchase_date: x.purchase_date, availableQty: x.availableQty }); return { ...x, qty: nextQtyStr, availableQty: (x.availableQty === null && a2 !== null && !isNaN(a2 as any)) ? Number(a2 as any) : x.availableQty }; })); }} max={(() => { const a = it.availableQty; const availCalc = (a !== null && !isNaN(a as any)) ? Number(a as any) : (() => { const c = computeAvailableQty({ inventory_id: it.inventory_id as number | null, purchase_date: it.purchase_date, availableQty: it.availableQty }); return c ?? 0; })(); if ((it.sku || '') === 'Grams') { return it.qtyUnit === 'KG' ? Number((availCalc / 1000).toFixed(3)) : availCalc; } return availCalc; })()} onKeyDown={e => { handleNavKey(e, `qty-${idx}`); handleKeyDown(e, idx, 'qty'); }} ref={el => { qtyRefs.current[idx] = el }} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
                        <button type="button" onClick={() => { const availCalc = (() => { const a = it.availableQty; if (a !== null && !isNaN(a as any)) return Number(a as any); const m = inventory.find(rr => rr.inventory_id === (it.inventory_id as number) && (!it.purchase_date || (rr.purchase_date && String(rr.purchase_date).slice(0,10) === it.purchase_date))); return m ? Number(m.qty as any) : 0; })(); const qtyNum = Number(it.qty || 0); if (isNaN(qtyNum)) return; if ((it.sku || '') === 'Grams') { const eff = it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum; const stepEff = it.qtyUnit === 'KG' ? 0.01 * 1000 : 0.01; const nextEff = Math.min(availCalc, eff + stepEff); const nextQtyStr = it.qtyUnit === 'KG' ? String(Number((nextEff / 1000).toFixed(3))) : String(nextEff); setItems(prev => prev.map((x, i) => i === idx ? { ...x, qty: nextQtyStr } : x)); } else { const next = Math.min(availCalc, qtyNum + 1); setItems(prev => prev.map((x, i) => i === idx ? { ...x, qty: String(next) } : x)); } }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #555', background: '#444', color: '#fff', cursor: 'pointer' }}>+</button>
                        <select
                          value={it.qtyUnit}
                          onChange={e=>{ const v = e.target.value; setItems(prev => prev.map((x, i) => { if (i !== idx) return x; const curNum = Number(x.qty || 0); if ((x.sku || '') === 'Grams') { const eff = x.qtyUnit === 'KG' ? curNum * 1000 : curNum; const nextQty = v === 'KG' ? eff / 1000 : eff; const avail = x.availableQty ?? null; const clampedEff = (avail !== null && !isNaN(avail)) ? Math.min(eff, avail) : eff; const nextQtyClamped = v === 'KG' ? clampedEff / 1000 : clampedEff; return { ...x, qtyUnit: v, qty: String(nextQtyClamped) }; } return { ...x, qtyUnit: v }; })); }}
                          onKeyDown={e => { handleNavKey(e, `unit-${idx}`); handleKeyDown(e, idx, 'unit'); }}
                          ref={el => { unitRefs.current[idx] = el }}
                          style={{ width: 120, padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff' }}
                        >
                          <option value="PCS">PCS</option>
                          <option value="Grams">Grams</option>
                          <option value="KG">KG</option>
                          <option value="FT">FT</option>
                          <option value="INCH">INCH</option>
                          <option value="Meters">Meters</option>
                        </select>
                        <div style={{ alignSelf: 'center', fontSize: 13, fontWeight: 700, color: '#fff', background: '#555', border: '1px solid #666', borderRadius: 999, padding: '4px 10px', lineHeight: 1.2 }}>
                          Available: {(() => { const a = it.availableQty; const availCalc = (a !== null && !isNaN(a as any)) ? Number(a as any) : (() => { const c = computeAvailableQty({ inventory_id: it.inventory_id as number | null, purchase_date: it.purchase_date, availableQty: it.availableQty }); return c ?? NaN; })(); if (isNaN(availCalc)) return '-'; if ((it.sku || '') === 'Grams') { return it.qtyUnit === 'KG' ? `${Number((availCalc / 1000).toFixed(3))} KG` : `${availCalc} Grams`; } return `${availCalc} ${it.sku || 'PCS'}`; })()}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6 }}>Brand</label>
                      <input value={it.brand} onChange={e=>{ const v = e.target.value; setItems(prev => prev.map((x, i) => i === idx ? { ...x, brand: v } : x)); }} onKeyDown={e => { handleNavKey(e, `brand-${idx}`); handleKeyDown(e, idx, 'brand'); }} ref={el => { brandRefs.current[idx] = el }} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6 }}>Unit Price</label>
                      <input value={it.unitPrice ?? ''} readOnly style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6 }}>Selling Price</label>
                      <input value={it.sellingPrice ?? ''} readOnly style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6 }}>Discount (%)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min={0} 
                        max={100} 
                        value={it.productDiscount} 
                        onChange={e => {
                          const v = e.target.value;
                          setItems(prev => prev.map((x, i) => i === idx ? { ...x, productDiscount: v } : x));
                        }} 
                        style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} style={{ background: roseGold, color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Total Amount</label>
                  <input value={(() => {
                    const sum = items.reduce((acc, it) => {
                      const qtyNum = Number(it.qty || 0);
                      const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                      let lineTotal = 0;
                      if ((it.sku || '') === 'Grams') {
                        const perUnit = (it.unitPrice || 0) * 1.3;
                        lineTotal = roundUpToNearest5(perUnit * effectiveQty);
                      } else {
                        lineTotal = effectiveQty * (it.sellingPrice || 0);
                      }
                      // Apply per-product discount
                      const prodDisc = Number(it.productDiscount || 0);
                      if (prodDisc > 0) {
                        lineTotal = lineTotal * (1 - prodDisc / 100);
                      }
                      return acc + lineTotal;
                    }, 0);
                    // Apply loyalty discount (12%), then overall discount
                    const afterLoyalty = isLoyaltyCustomer ? sum * 0.88 : sum;
                    const d = Number(discount || 0);
                    const net = afterLoyalty * (1 - (isNaN(d) ? 0 : d / 100));
                    return net ? Number(net.toFixed(2)) : '';
                  })()} readOnly style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Discount (%)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" step="0.01" min={0} max={100} value={discount} onChange={e=>setDiscount(e.target.value)} onKeyDown={e=>handleNavKey(e,'discount')} ref={discountRef} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
                    <button 
                      type="button" 
                      onClick={() => {
                        const validItems = items.filter(it => (it.inventory_id || it.barcode) && it.qty && Number(it.qty) > 0);
                        if (validItems.length === 0) { 
                          alert('Add at least one product with qty'); 
                          return; 
                        }
                        setShowPaymentModal(true);
                      }}
                      style={{ background: gold, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => (e.currentTarget.style.background = goldHover)}
                      onMouseLeave={e => (e.currentTarget.style.background = gold)}
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: 4, marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Note</label>
                <input value={note} onChange={e=>setNote(e.target.value)} onKeyDown={e=>handleNavKey(e,'note')} ref={noteRef} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        )}
        {showLoyalty && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: 420, maxWidth: '90%', background: '#333', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid #555', color: '#fff' }}>
              <div style={{ padding: 12, borderBottom: '1px solid #555', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, color: '#fff' }}>Add Loyalty Customer</div>
                <button onClick={() => setShowLoyalty(false)} style={{ background: 'transparent', color: '#fff', border: 'none', padding: 6, cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
                  <input value={lcName} onChange={e=>setLcName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Mobile No</label>
                  <input value={lcMobile} onChange={e=>setLcMobile(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Joined Date</label>
                  <input type="date" value={lcJoined} onChange={e=>setLcJoined(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>NIC</label>
                  <input value={lcNic} onChange={e=>setLcNic(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff' }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Address</label>
                  <input value={lcAddress} onChange={e=>setLcAddress(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, background: '#444', border: '1px solid #555', color: '#fff' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => setShowLoyalty(false)} style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button
                    onClick={async () => {
                      if (!lcName) { alert('Enter name'); return }
                      try {
                        const payload = { name: lcName, mobile_no: lcMobile || undefined, nic: lcNic || undefined, address: lcAddress || undefined, joined_date: lcJoined || undefined }
                        await post('/loyalty', payload)
                        setShowLoyalty(false); setLcName(''); setLcMobile(''); setLcJoined(''); setLcNic(''); setLcAddress('')
                      } catch (err: any) {
                        if (err?.status === 401) navigate('/login', { replace: true });
                        else alert(err?.message || 'Failed to save customer')
                      }
                    }}
                    style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = goldHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = gold)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showPaymentModal && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div style={{ width: 600, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', background: '#808080', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid #555', color: '#fff' }}>
              <div style={{ padding: 12, borderBottom: '1px solid #555', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#808080', zIndex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fff' }}>Payment Summary</div>
                <button onClick={() => { setShowPaymentModal(false); setPaymentType(null); setAmountGiven(''); setChangeAmount(0); }} style={{ background: 'transparent', color: '#fff', border: 'none', padding: 6, cursor: 'pointer', fontSize: 20 }}>✕</button>
              </div>
              <div style={{ padding: 16 }}>
                {/* Items Summary */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#fff' }}>Items:</div>
                  {items.filter(it => (it.inventory_id || it.barcode) && it.qty && Number(it.qty) > 0).map((it, idx) => {
                    const qtyNum = Number(it.qty || 0);
                    const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                    const productName = it.invQuery || 'Unknown Product';
                    const displayQty = `${it.qty} ${it.qtyUnit}`;
                    let lineTotal = (it.sku || '') === 'Grams' 
                      ? roundUpToNearest5((it.unitPrice || 0) * 1.3 * effectiveQty)
                      : effectiveQty * (it.sellingPrice || 0);
                    // Apply per-product discount
                    const prodDisc = Number(it.productDiscount || 0);
                    if (prodDisc > 0) {
                      lineTotal = lineTotal * (1 - prodDisc / 100);
                    }
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #555' }}>
                        <div style={{ flex: 1 }}>{productName}{prodDisc > 0 ? ` (${prodDisc}% off)` : ''}</div>
                        <div style={{ width: 100, textAlign: 'right' }}>{displayQty}</div>
                        <div style={{ width: 100, textAlign: 'right', fontWeight: 600 }}>Rs. {lineTotal.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Section */}
                <div style={{ marginBottom: 20, padding: 12, background: '#444', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>Subtotal:</div>
                    <div style={{ fontWeight: 600 }}>Rs. {(() => {
                      return items.reduce((acc, it) => {
                        const qtyNum = Number(it.qty || 0);
                        const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                        let lineTotal = 0;
                        if ((it.sku || '') === 'Grams') {
                          const perUnit = (it.unitPrice || 0) * 1.3;
                          lineTotal = roundUpToNearest5(perUnit * effectiveQty);
                        } else {
                          lineTotal = effectiveQty * (it.sellingPrice || 0);
                        }
                        // Apply per-product discount
                        const prodDisc = Number(it.productDiscount || 0);
                        if (prodDisc > 0) {
                          lineTotal = lineTotal * (1 - prodDisc / 100);
                        }
                        return acc + lineTotal;
                      }, 0).toFixed(2);
                    })()}</div>
                  </div>
                  {isLoyaltyCustomer && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: gold }}>
                      <div>🎁 Loyalty Discount (12%):</div>
                      <div style={{ fontWeight: 600 }}>- Rs. {(() => {
                        const sum = items.reduce((acc, it) => {
                          const qtyNum = Number(it.qty || 0);
                          const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                          let lineTotal = 0;
                          if ((it.sku || '') === 'Grams') {
                            const perUnit = (it.unitPrice || 0) * 1.3;
                            lineTotal = roundUpToNearest5(perUnit * effectiveQty);
                          } else {
                            lineTotal = effectiveQty * (it.sellingPrice || 0);
                          }
                          // Apply per-product discount
                          const prodDisc = Number(it.productDiscount || 0);
                          if (prodDisc > 0) {
                            lineTotal = lineTotal * (1 - prodDisc / 100);
                          }
                          return acc + lineTotal;
                        }, 0);
                        const loyaltyDiscountAmount = sum * 0.12;
                        return loyaltyDiscountAmount.toFixed(2);
                      })()}</div>
                    </div>
                  )}
                  {discount && Number(discount) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>Additional Discount ({discount}%):</div>
                      <div style={{ fontWeight: 600 }}>- Rs. {(() => {
                        const sum = items.reduce((acc, it) => {
                          const qtyNum = Number(it.qty || 0);
                          const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                          let lineTotal = 0;
                          if ((it.sku || '') === 'Grams') {
                            const perUnit = (it.unitPrice || 0) * 1.3;
                            lineTotal = roundUpToNearest5(perUnit * effectiveQty);
                          } else {
                            lineTotal = effectiveQty * (it.sellingPrice || 0);
                          }
                          // Apply per-product discount
                          const prodDisc = Number(it.productDiscount || 0);
                          if (prodDisc > 0) {
                            lineTotal = lineTotal * (1 - prodDisc / 100);
                          }
                          return acc + lineTotal;
                        }, 0);
                        const afterLoyalty = isLoyaltyCustomer ? sum * 0.88 : sum;
                        const discountAmount = afterLoyalty * (Number(discount) / 100);
                        return discountAmount.toFixed(2);
                      })()}</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: roseGold, borderTop: `2px solid ${roseGold}`, paddingTop: 8 }}>
                    <div>Total Amount:</div>
                    <div>Rs. {(() => {
                      const sum = items.reduce((acc, it) => {
                        const qtyNum = Number(it.qty || 0);
                        const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                        let lineTotal = 0;
                        if ((it.sku || '') === 'Grams') {
                          const perUnit = (it.unitPrice || 0) * 1.3;
                          lineTotal = roundUpToNearest5(perUnit * effectiveQty);
                        } else {
                          lineTotal = effectiveQty * (it.sellingPrice || 0);
                        }
                        // Apply per-product discount
                        const prodDisc = Number(it.productDiscount || 0);
                        if (prodDisc > 0) {
                          lineTotal = lineTotal * (1 - prodDisc / 100);
                        }
                        return acc + lineTotal;
                      }, 0);
                      // Apply loyalty discount (12%), then overall discount
                      const afterLoyalty = isLoyaltyCustomer ? sum * 0.88 : sum;
                      const d = Number(discount || 0);
                      const net = afterLoyalty * (1 - (isNaN(d) ? 0 : d / 100));
                      return net.toFixed(2);
                    })()}</div>
                  </div>
                </div>

                {/* Payment Type Selection */}
                {!paymentType && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 12, color: roseGold }}>Select Payment Method:</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                onClick={() => setPaymentType('Cash Payment')}
                style={{ flex: 1, background: gold, color: '#fff', border: 'none', padding: '16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 16 }}
                onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff' }}
              >
                Cash Payment
              </button>
                      <button
                        onClick={() => setPaymentType('Card Payment')}
                        style={{ flex: 1, background: roseGold, color: '#fff', border: 'none', padding: '16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 16 }}
                      >
                        Card Payment
                      </button>
                    </div>
                  </div>
                )}

                {/* Cash Payment Flow */}
                {paymentType === 'Cash Payment' && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 12, color: roseGold }}>Cash Payment</div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 6, color: '#ccc' }}>Amount Given:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={amountGiven}
                        onChange={e => {
                          setAmountGiven(e.target.value);
                          const total = calculateTotalAmount(items, discount, isLoyaltyCustomer);
                          const given = Number(e.target.value || 0);
                          setChangeAmount(Math.max(0, given - total));
                        }}
                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', fontSize: 16 }}
                      />
                    </div>
                    {amountGiven && Number(amountGiven) > 0 && (
                      <div style={{ marginBottom: 16, padding: 12, background: '#444', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                          <div style={{ color: '#fff' }}>Change to Return:</div>
                          <div style={{ color: roseGold }}>Rs. {changeAmount.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setPaymentType(null); setAmountGiven(''); setChangeAmount(0); }}
                        style={{ flex: 1, background: '#555', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Back
                      </button>
                      <button
                        onClick={async () => {
                          if (isSubmitting) return;
                          
                          const total = calculateTotalAmount(items, discount, isLoyaltyCustomer);
                          const given = Number(amountGiven || 0);
                          
                          if (given < total) {
                            alert('Amount given is less than total amount');
                            return;
                          }

                          setIsSubmitting(true);
                          try {
                            await refreshInventoryLatest();
                            const validItems = items.filter(it => (it.inventory_id || it.barcode) && it.qty && Number(it.qty) > 0);
                            
                            // Save sale with payment_type
                            const payload = {
                              sale_invoice_no: invoiceNo || undefined,
                              customer_name: customerName || undefined,
                              contact_no: contactNo || undefined,
                              address: address || undefined,
                              date: date || undefined,
                              discount: discount ? Number(discount) : undefined,
                              note: note || undefined,
                              payment_type: 'Cash Payment',
                              items: validItems.map(it => {
                                const qtyNum = Number(it.qty || 0);
                                const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                                if (it.barcode) {
                                  return { barcode: it.barcode, qty: effectiveQty };
                                }
                                return { inventory_id: it.inventory_id, qty: effectiveQty, brand: it.brand || undefined, purchase_date: it.purchase_date || undefined };
                              })
                            };
                            await post('/sales', payload);

                            // Print receipt
                            const receiptItems = validItems.map(it => {
                              const productName = it.invQuery || 'Unknown Product';
                              const qtyNum = Number(it.qty || 0);
                              const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                              const sellingPrice = (it.sku || '') === 'Grams' ? (it.unitPrice || 0) * 1.3 : (it.sellingPrice || 0);
                              return {
                                product_name: productName,
                                qty: effectiveQty,
                                selling_price: sellingPrice,
                                item_discount: it.productDiscount ? Number(it.productDiscount) : undefined
                              };
                            });

                            await post('/print/receipt-escpos', {
                              invoice_no: invoiceNo,
                              date: date,
                              customer_name: customerName,
                              items: receiptItems,
                              discount: discount ? Number(discount) : 0,
                              loyalty_discount: isLoyaltyCustomer ? 12 : undefined,
                              total_amount: total,
                              payment_type: 'Cash Payment',
                              amount_given: given,
                              change_amount: changeAmount
                            });

                            // Check for loyalty customer and show WhatsApp option
                            const invoiceData = {
                              contact_no: contactNo,
                              invoice_no: invoiceNo,
                              date: date,
                              customer_name: customerName,
                              items: receiptItems,
                              discount: discount ? Number(discount) : 0,
                              total_amount: total,
                              payment_type: 'Cash Payment'
                            };
                            await checkLoyaltyAndSendWhatsApp(invoiceData);

                            // Reset form
                            setInvoiceNo(''); 
                            setCustomerName(''); 
                            setContactNo(''); 
                            setAddress(''); 
                            setDate(''); 
                            setDiscount(''); 
                            setNote(''); 
                            setItems([{ inventory_id: null, invQuery: '', showSuggest: false, sku: null, qtyUnit: 'PCS', qty: '', brand: '', unitPrice: null, sellingPrice: null, productDiscount: '', barcode: null, purchase_date: null, availableQty: null }]); 
                            setShowForm(false);
                            setShowPaymentModal(false);
                            setPaymentType(null);
                            setAmountGiven('');
                            setChangeAmount(0);
                            try { localStorage.removeItem('sales_form_cache'); } catch {}
                            // Removed window.location.reload() - causes white screen in packaged Electron app
                          } catch (err: any) {
                            setIsSubmitting(false);
                            if (err?.status === 401) { 
                              localStorage.removeItem('token'); 
                              navigate('/login', { replace: true }); 
                              return; 
                            }
                            
                            // Display detailed error information
                            let errorMessage = '❌ Failed to complete sale\n\n';
                            
                            if (err?.data && typeof err.data === 'object') {
                              const errorData = err.data;
                              errorMessage += `Error: ${errorData.message || err.message}\n`;
                              
                              if (errorData.errorCategory) {
                                errorMessage += `\nCategory: ${errorData.errorCategory}\n`;
                              }
                              
                              if (errorData.details) {
                                errorMessage += `\nDetails:\n`;
                                errorMessage += `  • Printer: ${errorData.details.printerName}\n`;
                                if (errorData.details.errorCode) {
                                  errorMessage += `  • Error Code: ${errorData.details.errorCode}\n`;
                                }
                              }
                              
                              if (errorData.troubleshooting && errorData.troubleshooting.length > 0) {
                                errorMessage += `\nTroubleshooting Steps:\n`;
                                errorData.troubleshooting.forEach((step: string) => {
                                  errorMessage += `${step}\n`;
                                });
                              }
                              
                              if (errorData.availablePrinters && errorData.availablePrinters.length > 0) {
                                errorMessage += `\nAvailable Printers:\n`;
                                errorData.availablePrinters.forEach((printer: string) => {
                                  errorMessage += `  • ${printer}\n`;
                                });
                              }
                            } else {
                              errorMessage += err?.message || 'Unknown error occurred';
                            }
                            
                            alert(errorMessage);
                          }
                        }}
                        disabled={!amountGiven || Number(amountGiven) <= 0 || isSubmitting}
                        style={{ flex: 1, background: gold, color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: (amountGiven && Number(amountGiven) > 0 && !isSubmitting) ? 'pointer' : 'not-allowed', opacity: (amountGiven && Number(amountGiven) > 0 && !isSubmitting) ? 1 : 0.5 }}
                        onMouseEnter={e => { if (amountGiven && Number(amountGiven) > 0 && !isSubmitting) { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; } }}
                        onMouseLeave={e => { if (amountGiven && Number(amountGiven) > 0 && !isSubmitting) { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; } }}
                      >
                        {isSubmitting ? 'Processing...' : 'Print Receipt'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Payment Flow */}
                {paymentType === 'Card Payment' && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 12, color: roseGold }}>Card Payment</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setPaymentType(null); }}
                        style={{ flex: 1, background: '#555', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Back
                      </button>
                      <button
                        onClick={async () => {
                          if (isSubmitting) return;
                          
                          setIsSubmitting(true);
                          try {
                            await refreshInventoryLatest();
                            const validItems = items.filter(it => (it.inventory_id || it.barcode) && it.qty && Number(it.qty) > 0);
                            const total = calculateTotalAmount(items, discount, isLoyaltyCustomer);
                            
                            // Save sale with payment_type
                            const payload = {
                              sale_invoice_no: invoiceNo || undefined,
                              customer_name: customerName || undefined,
                              contact_no: contactNo || undefined,
                              address: address || undefined,
                              date: date || undefined,
                              discount: discount ? Number(discount) : undefined,
                              note: note || undefined,
                              payment_type: 'Card Payment',
                              items: validItems.map(it => {
                                const qtyNum = Number(it.qty || 0);
                                const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                                if (it.barcode) {
                                  return { barcode: it.barcode, qty: effectiveQty };
                                }
                                return { inventory_id: it.inventory_id, qty: effectiveQty, brand: it.brand || undefined, purchase_date: it.purchase_date || undefined };
                              })
                            };
                            await post('/sales', payload);

                            // Print receipt
                            const receiptItems = validItems.map(it => {
                              const productName = it.invQuery || 'Unknown Product';
                              const qtyNum = Number(it.qty || 0);
                              const effectiveQty = (it.sku || '') === 'Grams' ? (it.qtyUnit === 'KG' ? qtyNum * 1000 : qtyNum) : qtyNum;
                              const sellingPrice = (it.sku || '') === 'Grams' ? (it.unitPrice || 0) * 1.3 : (it.sellingPrice || 0);
                              return {
                                product_name: productName,
                                qty: effectiveQty,
                                selling_price: sellingPrice,
                                item_discount: it.productDiscount ? Number(it.productDiscount) : undefined
                              };
                            });

                            await post('/print/receipt-escpos', {
                              invoice_no: invoiceNo,
                              date: date,
                              customer_name: customerName,
                              items: receiptItems,
                              discount: discount ? Number(discount) : 0,
                              loyalty_discount: isLoyaltyCustomer ? 12 : undefined,
                              total_amount: total,
                              payment_type: 'Card Payment'
                            });

                            // Check for loyalty customer and show WhatsApp option
                            const invoiceData = {
                              contact_no: contactNo,
                              invoice_no: invoiceNo,
                              date: date,
                              customer_name: customerName,
                              items: receiptItems,
                              discount: discount ? Number(discount) : 0,
                              total_amount: total,
                              payment_type: 'Card Payment'
                            };
                            await checkLoyaltyAndSendWhatsApp(invoiceData);

                            // Reset form
                            setInvoiceNo(''); 
                            setCustomerName(''); 
                            setContactNo(''); 
                            setAddress(''); 
                            setDate(''); 
                            setDiscount(''); 
                            setNote(''); 
                            setItems([{ inventory_id: null, invQuery: '', showSuggest: false, sku: null, qtyUnit: 'PCS', qty: '', brand: '', unitPrice: null, sellingPrice: null, productDiscount: '', barcode: null, purchase_date: null, availableQty: null }]); 
                            setShowForm(false);
                            setShowPaymentModal(false);
                            setPaymentType(null);
                            try { localStorage.removeItem('sales_form_cache'); } catch {}
                            // Removed window.location.reload() - causes white screen in packaged Electron app
                          } catch (err: any) {
                            setIsSubmitting(false);
                            if (err?.status === 401) { 
                              localStorage.removeItem('token'); 
                              navigate('/login', { replace: true }); 
                              return; 
                            }
                            alert(err?.message || 'Failed to complete sale');
                          }
                        }}
                        disabled={isSubmitting}
                        style={{ flex: 1, background: gold, color: '#000', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
                        onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = goldHover; }}
                        onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = gold; }}
                      >
                        {isSubmitting ? 'Processing...' : 'Print Receipt'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div style={{ marginTop: 16, display: showForm ? 'none' : 'block' }}>
          <div style={{ fontWeight: 700, color: roseGold, marginBottom: 8 }}>Recent Sales</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <input placeholder="Invoice" value={fInvoice} onChange={e=>setFInvoice(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input placeholder="Customer" value={fCustomer} onChange={e=>setFCustomer(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input placeholder="Contact" value={fContact} onChange={e=>setFContact(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input type="date" value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input type="date" value={fDateTo} onChange={e=>setFDateTo(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input placeholder="Product" value={fProduct} onChange={e=>setFProduct(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input placeholder="Inventory ID" value={fInventoryId} onChange={e=>setFInventoryId(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', width: 120 }} />
            <input placeholder="Brand" value={fBrand} onChange={e=>setFBrand(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            <input placeholder="Min Total" type="number" step="0.01" value={fTotalMin} onChange={e=>setFTotalMin(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', width: 140 }} />
            <input placeholder="Max Total" type="number" step="0.01" value={fTotalMax} onChange={e=>setFTotalMax(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', width: 140 }} />
          </div>
          {(() => {
            const filtered = sales
              .filter(s => !fInvoice || (s.sale_invoice_no || '').toLowerCase().includes(fInvoice.toLowerCase()))
              .filter(s => !fCustomer || (s.customer_name || '').toLowerCase().includes(fCustomer.toLowerCase()))
              .filter(s => !fContact || (s as any).contact_no && String((s as any).contact_no).toLowerCase().includes(fContact.toLowerCase()))
              .filter(s => !fDateFrom || new Date(s.date) >= new Date(fDateFrom))
              .filter(s => !fDateTo || new Date(s.date) <= new Date(fDateTo))
              .filter(s => !fTotalMin || (s.total_amount ?? 0) >= Number(fTotalMin))
              .filter(s => !fTotalMax || (s.total_amount ?? 0) <= Number(fTotalMax))
              .filter(s => !fBrand || s.items.some(it => (it.brand || '').toLowerCase().includes(fBrand.toLowerCase())))
              .filter(s => !fInventoryId || s.items.some(it => String(it.inventory_id).includes(fInventoryId.trim())))
              .filter(s => !fProduct || s.items.some(it => (inventory.find(inv => inv.inventory_id === it.inventory_id)?.product_name || '').toLowerCase().includes(fProduct.toLowerCase())));
            if (filtered.length === 0) return (<div style={{ fontSize: 12, color: '#aaa' }}>No sales</div>);
            return filtered.slice(0, 20).map(s => (
              <div 
                key={s.sale_id} 
                onMouseEnter={() => setHoveredSaleId(s.sale_id)}
                onMouseLeave={() => setHoveredSaleId(null)}
                style={{ 
                  borderRadius: 8, 
                  padding: 12, 
                  background: '#444', 
                  border: '1px solid #555',
                  marginBottom: 8,
                  position: 'relative',
                  transition: 'box-shadow 0.2s',
                  boxShadow: hoveredSaleId === s.sale_id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, color: '#fff' }}>Invoice: {s.sale_invoice_no || '-'}</div>
                  <div style={{ fontSize: 12, color: '#ccc' }}>{new Date(s.date).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Customer: {s.customer_name || '-'}</div>
                <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>Total: {s.total_amount?.toFixed?.(2) ?? s.total_amount}</div>
                {s.items.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#aaa' }}>No items</div>
                ) : (
                  <div style={{ fontSize: 12, color: '#ccc' }}>Items: {s.items.length}</div>
                )}
                {hoveredSaleId === s.sale_id && (
                  <button
                    onClick={() => reprintReceipt(s)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: gold,
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      zIndex: 10
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = goldHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = gold)}
                  >
                    🖨️ Reprint
                  </button>
                )}
              </div>
            ));
          })()}
        </div>
        {showWhatsAppModal && whatsappInvoiceData && (
          <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: '#333', borderRadius: 16, padding: 32, maxWidth: 500, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid #555', color: '#fff' }}>
              <h3 style={{ margin: '0 0 16px', color: roseGold, fontSize: 20, fontWeight: 700 }}>📱 Send Invoice via WhatsApp?</h3>
              <p style={{ color: '#ccc', marginBottom: 20 }}>
                Send invoice details to <strong>{whatsappInvoiceData.customer_name || 'customer'}</strong> at <strong>{whatsappInvoiceData.contact_no}</strong>
              </p>
              <div style={{ background: '#444', padding: 16, borderRadius: 8, marginBottom: 20, border: '1px solid #555' }}>
                <div style={{ fontSize: 13, color: '#ccc' }}>
                  📋 Invoice: {whatsappInvoiceData.invoice_no}<br/>
                  💰 Total: Rs. {whatsappInvoiceData.total_amount.toFixed(2)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setShowWhatsAppModal(false); setWhatsappInvoiceData(null); }} style={{ flex: 1, background: '#555', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Skip</button>
                <button onClick={sendWhatsAppInvoice} disabled={sendingWhatsApp} style={{ flex: 1, background: gold, color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: sendingWhatsApp ? 'not-allowed' : 'pointer', opacity: sendingWhatsApp ? 0.6 : 1 }} onMouseEnter={e => { if (!sendingWhatsApp) e.currentTarget.style.background = goldHover; }} onMouseLeave={e => { if (!sendingWhatsApp) e.currentTarget.style.background = gold; }}>
                  {sendingWhatsApp ? 'Sending...' : '✅ Send Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
