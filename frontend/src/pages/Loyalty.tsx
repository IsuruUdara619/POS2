import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { get } from '../services/api'
import Layout from '../components/Layout'

const roseGold = '#134E8E'
const roseGoldLight = '#e0e0e0'
const gold = '#134E8E'
const goldHover = '#003366'

export default function Loyalty() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<any[]>([])
  const [qName, setQName] = useState('')
  const [qMobile, setQMobile] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState('')
  useEffect(() => {
    (async () => {
      try {
        const r = await get('/loyalty')
        setCustomers(r.loyalty_customers || [])
      } catch (err: any) {
        if (err?.status === 401) navigate('/login', { replace: true })
      }
    })()
  }, [navigate])
  return (
    <Layout>
      <div>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 700 }}>Loyalty</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, color: roseGold, marginBottom: 8 }}>Loyalty Customers</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <input placeholder="Search by name" value={qName} onChange={e=>setQName(e.target.value)} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #f7f7f7, #ffffff)', boxSizing: 'border-box' }} />
              <input placeholder="Search by mobile" value={qMobile} onChange={e=>setQMobile(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #f7f7f7, #ffffff)', boxSizing: 'border-box' }} />
            </div>
            {customers.length === 0 ? (
              <div style={{ fontSize: 12, color: '#777' }}>No loyalty customers yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {customers
                  .filter(c => !qName || String(c.name || '').toLowerCase().includes(qName.toLowerCase()))
                  .filter(c => !qMobile || String(c.mobile_no || '').toLowerCase().includes(qMobile.toLowerCase()))
                  .map(c => (
                    <div key={c.loyalty_customer_id} style={{ borderRadius: 8, padding: 12, background: '#808080', color: '#fff' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>Mobile: {c.mobile_no || '-'}</div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>NIC: {c.nic || '-'}</div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>Address: {c.address || '-'}</div>
                      <div style={{ fontSize: 12, color: '#ccc' }}>Joined: {c.joined_date ? new Date(c.joined_date).toLocaleDateString() : '-'}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: roseGold, marginBottom: 8 }}>Promotions</div>
            <div style={{ border: `1px solid ${roseGoldLight}`, borderRadius: 12, padding: 12, background: '#808080', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#fff' }}>Select Phone Numbers</div>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #555', borderRadius: 8, padding: 8, marginBottom: 10, background: '#444' }}>
                {customers.filter(c => !!c.mobile_no).length === 0 ? (
                  <div style={{ fontSize: 12, color: '#ccc' }}>No mobiles available</div>
                ) : (
                  customers
                    .filter(c => !!c.mobile_no)
                    .map(c => (
                      <label key={c.loyalty_customer_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: '#fff' }}>
                        <input type="checkbox" onChange={e=>{
                          const v = String(c.mobile_no)
                          if (e.target.checked) {
                            setSelected(prev => prev.includes(v) ? prev : [...prev, v])
                          } else {
                            setSelected(prev => prev.filter(x => x !== v))
                          }
                        }} />
                        <span style={{ fontSize: 12 }}>{c.name} — {c.mobile_no}</span>
                      </label>
                    ))
                )}
              </div>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#fff' }}>Message</div>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Type promotion message" style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box', resize: 'vertical' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button onClick={()=>{ setSelected([]); setMessage('') }} style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
                <button onClick={()=>{
                  if (selected.length === 0) { alert('Select at least one phone'); return }
                  if (!message.trim()) { alert('Enter a message'); return }
                  alert(`Prepared promotion to ${selected.length} numbers`) 
                }} style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; }}>Send Promotion</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
