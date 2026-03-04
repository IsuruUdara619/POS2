import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
//import backgroundLogo from '/logo.png';
//import companyLogo from '/wh_logo.png';

export default function Layout({ children, backgroundColor = '#d3d3d3ff', mainContentPadding = '24px' }: { children: React.ReactNode, backgroundColor?: string, mainContentPadding?: string|number }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time and date
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: backgroundColor, overflow: 'hidden', position: 'relative' }}>
        {/* Background Logo Layer */}
        {/*
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${backgroundLogo})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    opacity: 0.5,
    zIndex: 0,
    pointerEvents: 'none'
  }} />
*/}
 
        {/* Top Bar */}
        <div style={{ 
          padding: '16px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '16px',
          background: 'rgba(0,0,0,0.2)', // Subtle background for separation
          backdropFilter: 'blur(5px)',
          position: 'relative',
          zIndex: 1
        }}>
           {/* Left Side: Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             {/* <img src={companyLogo} alt="WH" style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 4 }} /> */}
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <h2 style={{ margin: 0, color: '#fff', fontSize: 22, lineHeight: 1.2, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Demo POS System</h2>
                 <div style={{ color: '#ddd', fontSize: 13, fontWeight: 500, letterSpacing: '0.5px' }}>Slogan</div>
              </div>
           </div>

           {/* Right Side: System Clock */}
           <div style={{ 
             display: 'flex', 
             alignItems: 'center', 
             gap: 12,
             background: 'rgba(255, 255, 255, 0.1)',
             padding: '12px 20px',
             borderRadius: 12,
             backdropFilter: 'blur(10px)',
             boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
           }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff', flexShrink: 0 }}>
               <circle cx="12" cy="12" r="10" />
               <polyline points="12 6 12 12 16 14" />
             </svg>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
               <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: 0.5, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                 {formatTime(currentTime)}
               </div>
               <div style={{ color: '#ddd', fontSize: 12, fontWeight: 500, letterSpacing: 0.3 }}>
                 {formatDate(currentTime)}
               </div>
             </div>
           </div>

        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: mainContentPadding, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
