import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { get, post, put, del } from '../services/api';
import ErrorLogViewer from '../components/ErrorLogViewer';

export default function Settings() {
  const navigate = useNavigate();
  const roseGold = '#134E8E';
  const gold = '#134E8E';
  const goldHover = '#003366';
  const white = '#ffffff';
  const theme = 'dark';

  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'cashier' });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Printer Settings State
  const [printerSettings, setPrinterSettings] = useState<any>({
    printer_name: 'XP-80C',
    font_header: 16,
    font_items: 8,
    font_subtotal: 8,
    font_total: 10,
    font_payment: 6,
    margin_top: 10,
    margin_bottom: 5,
    footer_spacing: 20,
    paper_height: 842,
    line_spacing: 12,
    align_header: 'center',
    align_items: 'left',
    align_totals: 'right',
    align_payment: 'left',
    align_footer: 'center'
  });
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [printerSettingsLoading, setPrinterSettingsLoading] = useState(false);
  const [showErrorLogs, setShowErrorLogs] = useState(false);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/sales', { replace: true });
      return;
    }
    loadUsers();
    loadWhatsAppStatus();
    loadPrinterSettings();
    loadAvailablePrinters();
    
    // Setup WhatsApp status change listener if running in Electron
    if ((window as any).electronAPI?.whatsapp) {
      (window as any).electronAPI.whatsapp.onStatusChange((status: any) => {
        setWhatsappStatus(status);
      });
    } else {
      // Fallback to polling if not in Electron
      const interval = setInterval(loadWhatsAppStatus, 10000);
      return () => clearInterval(interval);
    }
    
    return () => {
      // Cleanup listener when component unmounts
      if ((window as any).electronAPI?.whatsapp?.removeStatusChangeListener) {
        (window as any).electronAPI.whatsapp.removeStatusChangeListener();
      }
    };
  }, []);

  async function loadUsers() {
    try {
      const r = await get('/users');
      setUsers(r.users || []);
    } catch (e: any) {
      alert(e?.message || 'Failed to load users');
    }
  }

  async function handleCreateUser() {
    if (!newUser.username || !newUser.password) {
      alert('Username and password are required');
      return;
    }
    try {
      await post('/users', newUser);
      setShowModal(false);
      setNewUser({ username: '', password: '', role: 'cashier' });
      loadUsers();
    } catch (e: any) {
      alert(e?.message || 'Failed to create user');
    }
  }

  async function handleUpdateRole(userId: number, newRole: string) {
    try {
      await put(`/users/${userId}`, { role: newRole });
      loadUsers();
    } catch (e: any) {
      alert(e?.message || 'Failed to update role');
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await del(`/users/${userId}`);
      loadUsers();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete user');
    }
  }

  async function loadWhatsAppStatus() {
    try {
      // Use IPC if in Electron, otherwise fallback to HTTP
      if ((window as any).electronAPI?.whatsapp) {
        const r = await (window as any).electronAPI.whatsapp.getStatus();
        setWhatsappStatus(r);
      } else {
        const r = await get('/whatsapp/status');
        setWhatsappStatus(r);
      }
    } catch (e: any) {
      // Silently fail, status will be null
      console.error('Failed to load WhatsApp status:', e);
    }
  }

  async function handleConnectWhatsApp() {
    setShowQRModal(true);
    setQrLoading(true);
    setQrCode(null);
    await loadQRCode();
  }

  async function loadQRCode() {
    setQrLoading(true);
    setQrCode(null);

    let attempts = 0;
    const maxAttempts = 30; // 60 seconds total

    const checkQR = async () => {
      try {
        console.log('Fetching QR code...');
        
        // Use IPC if in Electron, otherwise fallback to HTTP
        const r = (window as any).electronAPI?.whatsapp 
          ? await (window as any).electronAPI.whatsapp.getQRCode()
          : await get('/whatsapp/qr');
          
        console.log('QR fetch response:', r.qrCode ? 'QR Received' : 'No QR');
        
        if (r.qrCode) {
          setQrCode(r.qrCode);
          setQrLoading(false);
          
          // In Electron, status updates come via events, no need to poll
          // In browser, poll for status
          if (!(window as any).electronAPI?.whatsapp) {
            const pollInterval = setInterval(async () => {
              try {
                const status = await get('/whatsapp/status');
                setWhatsappStatus(status);
                
                if (status.isConnected) {
                  clearInterval(pollInterval);
                  setShowQRModal(false);
                  setQrCode(null);
                  alert('✅ WhatsApp connected successfully!');
                } else if (status.isAuthenticated || status.isLoading) {
                  setQrCode(null);
                  setQrLoading(false);
                } else {
                  const r = await get('/whatsapp/qr');
                  if (r.qrCode) {
                    setQrCode(r.qrCode);
                    setQrLoading(false);
                  }
                }
              } catch (e) {
                console.error('Error polling status:', e);
              }
            }, 2000);

            setTimeout(() => clearInterval(pollInterval), 120000);
          }
          return;
        }
        
        // If not ready, retry
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkQR, 2000);
        } else {
          setQrLoading(false);
        }
      } catch (e: any) {
        // Check if already connected
        if (e.status === 400 || e.error === 'Already connected' || (e.response && e.response.status === 400)) {
          setShowQRModal(false);
          setQrCode(null);
          loadWhatsAppStatus();
          alert('✅ WhatsApp is already connected!');
          return;
        }

        console.error('Error loading QR code:', e);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkQR, 2000);
        } else {
          setQrLoading(false);
        }
      }
    };

    checkQR();
  }

  async function handleRefreshQR() {
    try {
      // Use IPC if in Electron, otherwise fallback to HTTP
      if ((window as any).electronAPI?.whatsapp) {
        await (window as any).electronAPI.whatsapp.reconnect();
      } else {
        await post('/whatsapp/reconnect', {});
      }
      // Wait a moment for initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Then load the new QR code
      await loadQRCode();
    } catch (e: any) {
      alert(e?.message || 'Failed to refresh QR code');
    }
  }

  async function handleDisconnectWhatsApp() {
    if (!confirm('Are you sure you want to disconnect WhatsApp?')) return;
    
    try {
      // Use IPC if in Electron, otherwise fallback to HTTP
      if ((window as any).electronAPI?.whatsapp) {
        const result = await (window as any).electronAPI.whatsapp.disconnect();
        if (result.success) {
          setWhatsappStatus(null);
          alert('WhatsApp disconnected successfully');
        } else {
          alert(result.error || 'Failed to disconnect');
        }
      } else {
        await post('/whatsapp/disconnect', {});
        setWhatsappStatus(null);
        alert('WhatsApp disconnected successfully');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to disconnect');
    }
  }

  async function handleTestConnection() {
    try {
      // Use IPC if in Electron, otherwise fallback to HTTP
      const status = (window as any).electronAPI?.whatsapp
        ? await (window as any).electronAPI.whatsapp.getStatus()
        : await get('/whatsapp/status');
        
      if (status.isConnected) {
        alert('✅ WhatsApp is connected and working properly!');
      } else {
        alert('❌ WhatsApp is not connected. Please connect first.');
      }
    } catch (e: any) {
      alert('❌ Failed to test connection: ' + (e?.message || 'Unknown error'));
    }
  }

  // Printer Settings Functions
  async function loadPrinterSettings() {
    try {
      const settings = await get('/printer-settings');
      setPrinterSettings(settings);
    } catch (e: any) {
      console.error('Failed to load printer settings:', e);
    }
  }

  async function loadAvailablePrinters() {
    try {
      const result = await get('/print/printers');
      if (result.printers && result.printers.length > 0) {
        setAvailablePrinters(result.printers);
      }
    } catch (e: any) {
      console.error('Failed to load available printers:', e);
    }
  }

  async function handleSavePrinterSettings() {
    setPrinterSettingsLoading(true);
    try {
      await put('/printer-settings', printerSettings);
      alert('✅ Printer settings saved successfully!');
    } catch (e: any) {
      alert('❌ Failed to save printer settings: ' + (e?.message || 'Unknown error'));
    } finally {
      setPrinterSettingsLoading(false);
    }
  }

  async function handleResetPrinterSettings() {
    if (!confirm('Are you sure you want to reset printer settings to defaults?')) return;
    
    setPrinterSettingsLoading(true);
    try {
      const result = await post('/printer-settings/reset', {});
      if (result.settings) {
        setPrinterSettings(result.settings);
      }
      alert('✅ Printer settings reset to defaults!');
    } catch (e: any) {
      alert('❌ Failed to reset printer settings: ' + (e?.message || 'Unknown error'));
    } finally {
      setPrinterSettingsLoading(false);
    }
  }

  async function handleTestPrint() {
    setPrinterSettingsLoading(true);
    try {
      const result = await post('/print/test-receipt', {});
      if (result.success) {
        alert('✅ Test receipt sent to printer! Check your thermal printer.');
      } else {
        alert('❌ Test print failed: ' + (result.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('❌ Failed to send test print: ' + (e?.message || 'Unknown error'));
    } finally {
      setPrinterSettingsLoading(false);
    }
  }

  return (
    <Layout backgroundColor="#808080">
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 900, margin: 0 }}>User Management</h2>
          <button onClick={() => setShowModal(true)} style={{ background: gold, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', transition: 'transform 150ms ease, box-shadow 150ms ease' }} onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.16)'; }} onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'; }}>Add User</button>
        </div>

        <div style={{ background: '#808080', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#444' }}>
                <th style={{ padding: 16, textAlign: 'left', color: '#fff', fontWeight: 700 }}>Username</th>
                <th style={{ padding: 16, textAlign: 'left', color: '#fff', fontWeight: 700 }}>Role</th>
                <th style={{ padding: 16, textAlign: 'right', color: '#fff', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id} style={{ borderBottom: '1px solid #555' }}>
                  <td style={{ padding: 16, color: '#fff' }}>{user.username}</td>
                  <td style={{ padding: 16 }}>
                    <select value={user.role} onChange={(e) => handleUpdateRole(user.user_id, e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }}>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </td>
                  <td style={{ padding: 16, textAlign: 'right' }}>
                    <button onClick={() => handleDeleteUser(user.user_id)} style={{ background: 'linear-gradient(135deg, #ef5350, #c62828)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* WhatsApp Configuration Section */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 900, marginBottom: 24 }}>📱 WhatsApp Invoice Messenger</h2>
          
          <div style={{ background: '#808080', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 32 }}>
            {whatsappStatus?.isConnected ? (
              // Connected State
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)' }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Connected</div>
                    <div style={{ fontSize: 14, color: '#ccc' }}>
                      {whatsappStatus.lastConnectedAt ? 
                        `Last synced: ${new Date(whatsappStatus.lastConnectedAt).toLocaleString()}` : 
                        'Active'}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#444', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: '#fff', marginBottom: 12 }}>
                    ℹ️ <strong>How it works:</strong>
                  </div>
                  <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
                    When printing receipts at checkout, you can automatically send invoice details to your loyalty customers via WhatsApp. 
                    The system will check if the customer's phone number matches a registered loyalty customer and ask if you want to send the invoice.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={handleTestConnection}
                    style={{ 
                      flex: 1,
                      background: '#4caf50', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '12px 24px', 
                      borderRadius: 8, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    🔍 Test Connection
                  </button>
                  <button 
                    onClick={handleDisconnectWhatsApp}
                    style={{ 
                      flex: 1,
                      background: '#ef5350', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '12px 24px', 
                      borderRadius: 8, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 83, 80, 0.3)'
                    }}
                  >
                    🔌 Disconnect
                  </button>
                </div>
              </div>
            ) : (
              // Disconnected State
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#666', boxShadow: '0 0 10px rgba(128, 128, 128, 0.3)' }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Not Connected</div>
                    <div style={{ fontSize: 14, color: '#fff' }}>Connect WhatsApp to send invoices automatically</div>
                  </div>
                </div>

                <div style={{ background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: theme === 'dark' ? '#ccc' : '#555', marginBottom: 12 }}>
                    ✨ <strong>Benefits:</strong>
                  </div>
                  <ul style={{ fontSize: 13, color: theme === 'dark' ? '#bbb' : '#666', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Send invoices to loyalty customers via WhatsApp</li>
                    <li>Completely free - no monthly fees</li>
                    <li>Easy one-time setup (just scan a QR code)</li>
                    <li>Works with your existing WhatsApp account</li>
                  </ul>
                </div>

                <button 
                  onClick={handleConnectWhatsApp}
                  style={{ 
                    width: '100%',
                    background: gold, 
                    color: '#fff', 
                    border: 'none', 
                    padding: '16px 24px', 
                    borderRadius: 12, 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    fontSize: 16,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                    transition: 'transform 150ms ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  🔗 Connect WhatsApp Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Developer Tools Section */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 900, marginBottom: 24 }}>🔧 Developer Tools</h2>
          
          <div style={{ background: '#808080', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 32 }}>
            <div style={{ background: '#444', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#fff', marginBottom: 8 }}>
                🐛 <strong>Debugging & Error Tracking</strong>
              </div>
              <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
                View all frontend errors, warnings, and info messages in real-time. Export logs for troubleshooting.
              </div>
            </div>

            <button 
              onClick={() => setShowErrorLogs(true)}
              style={{ 
                width: '100%',
                background: '#9c27b0', 
                color: '#fff', 
                border: 'none', 
                padding: '16px 24px', 
                borderRadius: 12, 
                fontWeight: 700, 
                cursor: 'pointer',
                fontSize: 16,
                boxShadow: '0 6px 16px rgba(156, 39, 176, 0.3)',
                transition: 'transform 150ms ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#7b1fa2'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#9c27b0'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              📋 View Error Logs
            </button>
          </div>
        </div>

        {/* Thermal Printer Settings Section */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 900, marginBottom: 24 }}>🖨️ Thermal Printer Settings</h2>
          
          <div style={{ background: '#808080', borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 32 }}>
            <div style={{ background: '#444', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#fff', marginBottom: 8 }}>
                ℹ️ <strong>Configure your thermal printer settings</strong>
              </div>
              <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
                Adjust font sizes, paper dimensions, and margins for your thermal receipt printer. 
                Use the test print button to verify your settings before saving.
              </div>
            </div>

            {/* Printer Selection */}
            {availablePrinters.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 14 }}>
                  🖨️ Selected Printer
                </label>
                <select 
                  value={printerSettings.printer_name} 
                  onChange={(e) => setPrinterSettings({...printerSettings, printer_name: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    borderRadius: 8, 
                    border: '1px solid #555', 
                    background: '#333', 
                    color: '#fff',
                    fontSize: 14
                  }}
                >
                  {availablePrinters.map(printer => (
                    <option key={printer} value={printer}>{printer}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Font Size Settings */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📝 Font Sizes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Header</label>
                  <input 
                    type="number" 
                    value={printerSettings.font_header} 
                    onChange={(e) => setPrinterSettings({...printerSettings, font_header: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="6" max="20"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Items</label>
                  <input 
                    type="number" 
                    value={printerSettings.font_items} 
                    onChange={(e) => setPrinterSettings({...printerSettings, font_items: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="6" max="20"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Subtotal</label>
                  <input 
                    type="number" 
                    value={printerSettings.font_subtotal} 
                    onChange={(e) => setPrinterSettings({...printerSettings, font_subtotal: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="6" max="20"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Total</label>
                  <input 
                    type="number" 
                    value={printerSettings.font_total} 
                    onChange={(e) => setPrinterSettings({...printerSettings, font_total: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="6" max="20"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Payment</label>
                  <input 
                    type="number" 
                    value={printerSettings.font_payment} 
                    onChange={(e) => setPrinterSettings({...printerSettings, font_payment: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="6" max="20"
                  />
                </div>
              </div>
            </div>

            {/* Paper & Spacing Settings */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📏 Paper & Spacing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Paper Height (px)</label>
                  <input 
                    type="number" 
                    value={printerSettings.paper_height} 
                    onChange={(e) => setPrinterSettings({...printerSettings, paper_height: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="100" max="2000"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Line Spacing</label>
                  <input 
                    type="number" 
                    value={printerSettings.line_spacing} 
                    onChange={(e) => setPrinterSettings({...printerSettings, line_spacing: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="8" max="30"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Top Margin</label>
                  <input 
                    type="number" 
                    value={printerSettings.margin_top} 
                    onChange={(e) => setPrinterSettings({...printerSettings, margin_top: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="0" max="50"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Bottom Margin</label>
                  <input 
                    type="number" 
                    value={printerSettings.margin_bottom} 
                    onChange={(e) => setPrinterSettings({...printerSettings, margin_bottom: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="0" max="50"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Footer Spacing</label>
                  <input 
                    type="number" 
                    value={printerSettings.footer_spacing} 
                    onChange={(e) => setPrinterSettings({...printerSettings, footer_spacing: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                    min="0" max="50"
                  />
                </div>
              </div>
            </div>

            {/* Text Alignment Settings */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📐 Text Alignment</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Header</label>
                  <select 
                    value={printerSettings.align_header} 
                    onChange={(e) => setPrinterSettings({...printerSettings, align_header: e.target.value})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Items</label>
                  <select 
                    value={printerSettings.align_items} 
                    onChange={(e) => setPrinterSettings({...printerSettings, align_items: e.target.value})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Totals</label>
                  <select 
                    value={printerSettings.align_totals} 
                    onChange={(e) => setPrinterSettings({...printerSettings, align_totals: e.target.value})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Payment</label>
                  <select 
                    value={printerSettings.align_payment} 
                    onChange={(e) => setPrinterSettings({...printerSettings, align_payment: e.target.value})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600, fontSize: 13 }}>Footer</label>
                  <select 
                    value={printerSettings.align_footer} 
                    onChange={(e) => setPrinterSettings({...printerSettings, align_footer: e.target.value})}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #555', background: '#333', color: '#fff' }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button 
                onClick={handleSavePrinterSettings}
                disabled={printerSettingsLoading}
                style={{ 
                  flex: '1 1 200px',
                  background: printerSettingsLoading ? '#666' : gold, 
                  color: '#fff', 
                  border: 'none', 
                  padding: '14px 24px', 
                  borderRadius: 8, 
                  fontWeight: 700, 
                  cursor: printerSettingsLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  fontSize: 15
                }}
                onMouseEnter={e => !printerSettingsLoading && (e.currentTarget.style.background = goldHover)}
                onMouseLeave={e => !printerSettingsLoading && (e.currentTarget.style.background = gold)}
              >
                {printerSettingsLoading ? '⏳ Saving...' : '💾 Save Settings'}
              </button>
              <button 
                onClick={handleTestPrint}
                disabled={printerSettingsLoading}
                style={{ 
                  flex: '1 1 200px',
                  background: printerSettingsLoading ? '#666' : '#2196f3', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '14px 24px', 
                  borderRadius: 8, 
                  fontWeight: 700, 
                  cursor: printerSettingsLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  fontSize: 15
                }}
                onMouseEnter={e => !printerSettingsLoading && (e.currentTarget.style.background = '#1976d2')}
                onMouseLeave={e => !printerSettingsLoading && (e.currentTarget.style.background = '#2196f3')}
              >
                {printerSettingsLoading ? '⏳ Printing...' : '🖨️ Test Print'}
              </button>
              <button 
                onClick={handleResetPrinterSettings}
                disabled={printerSettingsLoading}
                style={{ 
                  flex: '1 1 200px',
                  background: printerSettingsLoading ? '#666' : '#ff9800', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '14px 24px', 
                  borderRadius: 8, 
                  fontWeight: 700, 
                  cursor: printerSettingsLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                  fontSize: 15
                }}
                onMouseEnter={e => !printerSettingsLoading && (e.currentTarget.style.background = '#f57c00')}
                onMouseLeave={e => !printerSettingsLoading && (e.currentTarget.style.background = '#ff9800')}
              >
                🔄 Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: theme === 'dark' ? '#263238' : '#fff', borderRadius: 16, padding: 40, maxWidth: 500, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: theme === 'dark' ? '#f8bbd0' : roseGold, fontSize: 24, fontWeight: 700 }}>Connect WhatsApp</h3>
              <button 
                onClick={() => { setShowQRModal(false); setQrCode(null); }}
                style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: theme === 'dark' ? '#fff' : '#333' }}
              >
                ✕
              </button>
            </div>

            {whatsappStatus?.isAuthenticated || whatsappStatus?.isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>⏳</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: theme === 'dark' ? '#4caf50' : '#2e7d32', marginBottom: 12 }}>
                  ✅ QR Code Scanned!
                </div>
                <div style={{ fontSize: 16, color: theme === 'dark' ? '#bbb' : '#666', marginBottom: 16 }}>
                  Connecting to WhatsApp...
                </div>
                <div style={{ fontSize: 14, color: theme === 'dark' ? '#999' : '#999', lineHeight: 1.6 }}>
                  {whatsappStatus?.isLoading ? 
                    'Loading your chats and contacts. This may take a minute.' :
                    'Please wait while we establish the connection.'}
                </div>
                <div style={{ marginTop: 24, padding: 16, background: theme === 'dark' ? '#1a1a1a' : '#f5f5f5', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#666' }}>
                    ℹ️ Don't close this window. The connection will complete automatically.
                  </div>
                </div>
              </div>
            ) : qrLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                <div style={{ fontSize: 16, color: theme === 'dark' ? '#bbb' : '#666' }}>Generating QR code...</div>
                <div style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#999', marginTop: 8 }}>This may take a few moments</div>
              </div>
            ) : qrCode ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 280, height: 280, border: `4px solid ${roseGold}`, borderRadius: 12 }} />
                </div>

                <div style={{ background: theme === 'dark' ? '#1a1a1a' : '#f9f9f9', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme === 'dark' ? '#fff' : '#333', marginBottom: 12 }}>
                    📱 How to scan:
                  </div>
                  <ol style={{ fontSize: 13, color: theme === 'dark' ? '#bbb' : '#666', lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                    <li>Open <strong>WhatsApp</strong> on your phone</li>
                    <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong></li>
                    <li>Tap <strong>Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li>Point your camera at this QR code</li>
                  </ol>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: theme === 'dark' ? '#999' : '#999', marginBottom: 12, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                    <span style={{ animation: 'blink 1s step-end infinite' }}>■</span> WAITING FOR SCAN...
                  </div>
                  <div style={{ fontSize: 12, color: '#ccc', fontFamily: 'monospace' }}>
                    QR code expires in 30s
                  </div>
                </div>

                <button 
                  onClick={handleRefreshQR}
                  style={{ 
                    width: '100%',
                    background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '12px 24px', 
                    borderRadius: 8, 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
                  }}
                >
                  🔄 Refresh QR Code
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
                <div style={{ fontSize: 16, color: '#ccc', marginBottom: 8 }}>Failed to generate QR code</div>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>
                  This usually happens if:<br/>
                  • The server is still starting up<br/>
                  • Chrome/Chromium is not installed<br/>
                  • There's a session conflict
                </div>
                <button 
                  onClick={handleRefreshQR}
                  style={{ marginTop: 16, background: gold, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; }}
                >
                  🔄 Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#808080', borderRadius: 12, padding: 32, minWidth: 400, boxShadow: '0 12px 48px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 24px', color: '#fff', fontSize: 24, fontWeight: 700 }}>Add New User</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600 }}>Username</label>
              <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600 }}>Password</label>
              <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#fff', fontWeight: 600 }}>Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #555', background: '#444', color: '#fff' }}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setNewUser({ username: '', password: '', role: 'cashier' }); }} style={{ background: '#ddd', color: '#333', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateUser} style={{ background: gold, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.background = goldHover; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = gold; e.currentTarget.style.color = '#fff'; }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Error Log Viewer Modal */}
      <ErrorLogViewer 
        isOpen={showErrorLogs} 
        onClose={() => setShowErrorLogs(false)} 
      />
    </Layout>
  );
}
