import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Wallet, Moon, Sun, LayoutDashboard, TrendingUp, Target, RefreshCw, Bot, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({ activePage }) {
  const { logout, user, updateProfile } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { key: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'analytics', path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'budgets', path: '/budgets', label: 'Budgets', icon: Target },
    { key: 'subscriptions', path: '/subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { key: 'chat', path: '/chat', label: 'AI Advisor', icon: Bot },
    { key: 'settings', path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: 'var(--glass-border)',
        padding: '0.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--primary-color)' }}>
          <Wallet size={28} />
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
            ExpenseTracker
          </h1>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.key || location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <select
          value={user?.currency || 'USD'}
          onChange={(e) => updateProfile({ currency: e.target.value })}
          style={{
            background: 'var(--bg-color)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.35rem 0.65rem',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="INR">INR (₹)</option>
          <option value="JPY">JPY (¥)</option>
          <option value="CAD">CAD ($)</option>
          <option value="AUD">AUD ($)</option>
          <option value="CHF">CHF (Fr)</option>
          <option value="CNY">CNY (¥)</option>
        </select>

        <button 
          onClick={toggleDark}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.25rem'
          }}
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button 
          onClick={handleLogout} 
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </motion.nav>
  );
}
