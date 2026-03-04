import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../services/api';
import Layout from '../components/Layout';

const roseGold = '#134E8E';
const roseGoldLight = '#e0e0e0';
const gold = '#134E8E';
const goldHover = '#003366';

export default function Expenses() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [expenses, setExpenses] = useState<Array<{ expense_id: number; name: string; amount: number; note: string | null }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await get('/expenses');
        setExpenses(r.expenses || []);
      } catch (err: any) { if (err?.status === 401) { navigate('/login', { replace: true }); } }
    })();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amt = Number(amount);
    if (!name) { setError('Enter name'); return; }
    if (!amount || isNaN(amt) || amt < 0) { setError('Enter valid amount'); return; }
    try {
      await post('/expenses', { name, amount: amt, note: note || undefined });
      try { const r = await get('/expenses'); setExpenses(r.expenses || []); } catch {}
      setName(''); setAmount(''); setNote(''); setShowForm(false);
    } catch (err: any) {
      if (err?.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return; }
      setError(err?.message || 'Failed to add expense');
    }
  }

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 700 }}>Expenses</h2>
        </div>
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
            onMouseEnter={e => (e.currentTarget.style.background = goldHover)}
            onMouseLeave={e => (e.currentTarget.style.background = gold)}
          >
            {showForm ? 'Close' : 'Add Expense'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={submit} style={{ borderRadius: 12, padding: 16, width: '100%', maxWidth: 520, background: '#808080 ', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', boxSizing: 'border-box', marginBottom: 16, color: '#fff' }}>
            {error && (<div style={{ color: 'red', marginBottom: 12 }}>{error}</div>)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Name</label>
                <select value={name} onChange={e=>setName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }}>
                  <option value="Rent">Rent</option>
                  <option value="Employee Salary">Employee Salary</option>
                  <option value="Foods">Foods</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Amount</label>
                <input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Note</label>
                <input value={note} onChange={e=>setNote(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="submit" style={{ background: gold, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} onMouseEnter={e => (e.currentTarget.style.background = goldHover)} onMouseLeave={e => (e.currentTarget.style.background = gold)}>Save Expense</button>
            </div>
          </form>
        )}
        {!showForm && (
          <div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 8 }}>Recent Expenses</div>
            {expenses.length === 0 ? (
              <div style={{ fontSize: 12, color: '#ccc' }}>No expenses yet</div>
            ) : (
              expenses.slice(0, 20).map(ex => (
                <div key={ex.expense_id} style={{ borderRadius: 8, padding: 12, background: '#808080 ', marginBottom: 8, color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600 }}>{ex.name}</div>
                    <div style={{ fontSize: 12, color: '#ccc' }}>{ex.amount?.toFixed?.(2) ?? ex.amount}</div>
                  </div>
                  {ex.note ? (<div style={{ fontSize: 12, color: '#ccc' }}>{ex.note}</div>) : null}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
