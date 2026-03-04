import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Vendors from './pages/Vendors';
import Purchase from './pages/Purchase';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Loyalty from './pages/Loyalty';
import Settings from './pages/Settings';
import { API_BASE_URL } from './config';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function getUserRole() {
  return localStorage.getItem('userRole') || 'cashier';
}

function Protected({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles) {
    const userRole = getUserRole();
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/sales" replace />;
    }
  }
  
  return children;
}

export default function App() {
  useEffect(() => {
    console.log('App started');
    console.log('API_BASE_URL:', API_BASE_URL);
  }, []);

  const bg = '#edf8e9';
  return (
    <div style={{ background: bg, minHeight: '100vh', color: '#fff' }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/products" element={<Protected allowedRoles={['admin', 'manager']}><Products /></Protected>} />
        <Route path="/vendors" element={<Protected allowedRoles={['admin', 'manager']}><Vendors /></Protected>} />
        <Route path="/purchase" element={<Protected allowedRoles={['admin', 'manager']}><Purchase /></Protected>} />
        <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
        <Route path="/sales" element={<Protected><Sales /></Protected>} />
        <Route path="/expenses" element={<Protected allowedRoles={['admin', 'manager']}><Expenses /></Protected>} />
        <Route path="/reports" element={<Protected allowedRoles={['admin', 'manager']}><Reports /></Protected>} />
        <Route path="/loyalty" element={<Protected><Loyalty /></Protected>} />
        <Route path="/settings" element={<Protected allowedRoles={['admin']}><Settings /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
