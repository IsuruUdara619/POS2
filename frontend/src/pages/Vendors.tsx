import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, get, put } from '../services/api';
import Layout from '../components/Layout';

export default function Vendors() {
  const navigate = useNavigate();
  const roseGold = '#134E8E';
  const roseGoldLight = '#e0e0e0';
  const gold = '#134E8E';
  const goldHover = '#003366';

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contact1, setContact1] = useState('');
  const [contact2, setContact2] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [vendors, setVendors] = useState<Array<{ vendor_id: number; name: string; contact_no1: string | null; contact_no2: string | null; email: string | null; address: string | null }>>([]);
  const [filterText, setFilterText] = useState('');
  const [filterId, setFilterId] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingMode, setEditingMode] = useState(false);

  function toggleForm() { setShowForm(v => !v); }

  function startEdit(v: { vendor_id: number; name: string; contact_no1: string | null; contact_no2: string | null; email: string | null; address: string | null }) {
    setEditingId(v.vendor_id);
    setEditingMode(true);
    setName(v.name || '');
    setContact1(v.contact_no1 || '');
    setContact2(v.contact_no2 || '');
    setEmail(v.email || '');
    setAddress(v.address || '');
    setError('');
    setShowForm(true);
  }

  async function fetchVendors() {
    try {
      const data = await get('/vendors');
      setVendors(data.vendors || []);
    } catch (err: any) {
      if (err?.status === 401) navigate('/login', { replace: true });
    }
  }

  useEffect(() => { fetchVendors(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editingMode && editingId !== null) {
        await put(`/vendors/${editingId}`, { name, contact_no1: contact1, contact_no2: contact2, email, address });
      } else {
        await post('/vendors', { name, contact_no1: contact1, contact_no2: contact2, email, address });
      }
      setName(''); setContact1(''); setContact2(''); setEmail(''); setAddress('');
      setShowForm(false);
      setEditingMode(false);
      setEditingId(null);
      fetchVendors();
    } catch (err: any) {
      setError(err?.message || 'Failed to save vendor');
    }
  }

  return (
    <Layout backgroundColor="#d0d0d0ff">
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 900, margin: 0 }}>Vendors</h2>
        </div>
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={toggleForm}
            style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
            onMouseEnter={e => (e.currentTarget.style.background = goldHover)}
            onMouseLeave={e => (e.currentTarget.style.background = gold)}
          >
            {showForm ? 'Close' : 'Add Vendor'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} style={{ borderRadius: 12, padding: 16, width: '100%', maxWidth: 520, background: '#808080', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', boxSizing: 'border-box', marginBottom: 16, color: '#fff' }}>
            {error && (<div style={{ color: '#ff5252', marginBottom: 12 }}>{error}</div>)}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Contact No 1</label>
                <input value={contact1} onChange={e=>setContact1(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Contact No 2</label>
                <input value={contact2} onChange={e=>setContact2(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Address</label>
              <textarea value={address} onChange={e=>setAddress(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box', minHeight: 80 }} />
            </div>
            <button type="submit" style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; }}>{editingMode ? 'Update Vendor' : 'Save Vendor'}</button>
          </form>
        )}

        {!showForm && (
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <input placeholder="Search by name" value={filterText} onChange={e=>setFilterText(e.target.value)} style={{ flex: 2, padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              <input placeholder="Search by ID" value={filterId} onChange={e=>setFilterId(e.target.value)} type="number" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            {vendors.length === 0 ? (
              <p>No vendors yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {vendors
                  .filter(v => !filterText || v.name.toLowerCase().includes(filterText.toLowerCase()))
                  .filter(v => !filterId || v.vendor_id === Number(filterId))
                  .map(v => (
                    <div key={v.vendor_id} onClick={() => startEdit(v)} style={{ borderRadius: 8, padding: 12, background: '#808080', cursor: 'pointer', border: '1px solid #555' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{v.name}</div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>Contact 1: {v.contact_no1 || '-'}</div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>Contact 2: {v.contact_no2 || '-'}</div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>Email: {v.email || '-'}</div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>Address: {v.address || '-'}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
