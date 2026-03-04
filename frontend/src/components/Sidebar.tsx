import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logoImage from '/BLOOM_SWIFT_POS_LOGO_XS_T.png';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role) {
      setUserRole(role);
    }
  }, []);

  const navItems = [
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      role: 'all',
      icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>
    },
    { 
      label: 'Products', 
      path: '/products', 
      role: ['admin', 'manager'],
      icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>
    },
    { 
      label: 'Vendors', 
      path: '/vendors', 
      role: ['admin', 'manager'],
      icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>
    },
    { 
      label: 'Purchase', 
      path: '/purchase', 
      role: ['admin', 'manager'],
      icon: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>
    },
    { 
      label: 'Inventory', 
      path: '/inventory', 
      role: 'all',
      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>
    },
    { 
      label: 'Sales', 
      path: '/sales', 
      role: 'all',
      icon: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>
    },
    { 
      label: 'Expenses', 
      path: '/expenses', 
      role: ['admin', 'manager'],
      icon: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>
    },
    { 
      label: 'Reports', 
      path: '/reports', 
      role: ['admin', 'manager'],
      icon: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>
    },
    { 
      label: 'Loyalty', 
      path: '/loyalty', 
      role: 'all',
      icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    },
    { 
      label: 'Settings', 
      path: '/settings', 
      role: ['admin'],
      icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>
    },
  ];

  const btnGrad = 'transparent';
  const btnHoverGrad = '#f0f2f5';
  const sidebarBg = '#134E8E'; 

  return (
    <div style={{
      width: isCollapsed ? '80px' : '260px',
      minWidth: isCollapsed ? '80px' : '260px',
      background: sidebarBg,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 10px',
      boxShadow: '4px 0 15px rgba(0,0,0,0.3)',
      zIndex: 1000,
      height: '100%',
      transition: 'width 0.3s ease, min-width 0.3s ease',
      overflow: 'hidden'
    }}>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { display: none; }
        .sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Header / Toggle */}
      <div style={{ marginBottom: 30, display: 'flex', flexDirection: isCollapsed ? 'column' : 'row', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', gap: isCollapsed ? 15 : 0, paddingLeft: isCollapsed ? 0 : 10 }}>
        {!isCollapsed ? (
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={logoImage} alt="Bloom Swift POS" style={{ height: 40, width: 40, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2 }} />
              <div>
                 <h2 style={{ margin: 0, color: '#fff', fontSize: 16, lineHeight: 1.2, fontWeight: 700, fontFamily: 'ITC Avant Garde Gothic Demi Condensed, sans-serif' }}>Bloom Swift POS</h2>
              </div>
           </div>
        ) : (
           <img src={logoImage} alt="Bloom Swift POS" style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2 }} />
        )}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ 
            cursor: 'pointer', 
            padding: 5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.1)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed ? <polyline points="13 17 18 12 13 7" /> : <polyline points="11 17 6 12 11 7" />}
            {isCollapsed ? <line x1="6" y1="12" x2="18" y2="12" /> : <line x1="18" y1="12" x2="6" y2="12" />}
          </svg>
        </div>
      </div>

      <div className="sidebar-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item) => {
          if (item.role !== 'all' && Array.isArray(item.role) && !item.role.includes(userRole)) {
            return null;
          }

          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : ''}
              style={{
                background: isActive ? btnHoverGrad : btnGrad,
                color: isActive ? '#134E8E' : '#fff',
                border: 'none',
                padding: '12px 16px',
                borderRadius: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: isCollapsed ? 'center' : 'left',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: 12,
                width: '100%'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                   e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                   if (!isCollapsed) e.currentTarget.style.transform = 'translateX(5px)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = btnGrad;
                  if (!isCollapsed) e.currentTarget.style.transform = 'none';
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: 20 }}>
                {item.icon}
              </svg>
              {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Logout Button at Bottom */}
      <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 10 }}>
        <button
          onClick={() => {
            // Clear all authentication data
            localStorage.clear();
            // Navigate to login page
            navigate('/');
          }}
          title={isCollapsed ? 'Logout' : ''}
          style={{
            background: btnGrad,
            color: '#fff',
            border: 'none',
            padding: '12px 16px',
            borderRadius: 12,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: isCollapsed ? 'center' : 'left',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 12,
            width: '100%'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,0,0,0.2)';
            if (!isCollapsed) e.currentTarget.style.transform = 'translateX(5px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = btnGrad;
            if (!isCollapsed) e.currentTarget.style.transform = 'none';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: 20 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Logout</span>}
        </button>
      </div>
    </div>
  );
}
