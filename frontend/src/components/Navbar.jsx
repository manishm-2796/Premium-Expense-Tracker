import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Wallet, Moon, Sun, LayoutDashboard, TrendingUp, Target, RefreshCw, Bot, Settings, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiptScanner from './ReceiptScanner';
import SyncStatus from './SyncStatus';

export default function Navbar({ activePage }) {
  const { logout, user, updateProfile } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showScanner, setShowScanner] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { key: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'analytics', path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'budgets', path: '/budgets', label: 'Budgets', icon: Target },
    { key: 'subscriptions', path: '/subscriptions', label: 'Subs', icon: RefreshCw },
    { key: 'chat', path: '/chat', label: 'AI', icon: Bot },
    { key: 'settings', path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* ── TOP HEADER ── */}
      <header
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: 'var(--glass-border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem'
        }}>

          {/* Brand Logo */}
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ padding: '0.35rem', background: 'rgba(99,102,241,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', color: 'var(--primary-color)' }}>
              <Wallet size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
              ExpenseTracker
            </h1>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
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
                    gap: '0.4rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                    backgroundColor: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label === 'Subs' ? 'Subscriptions' : item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Sync status - hidden on mobile */}
            <span className="desktop-nav">
              <SyncStatus />
            </span>

            {/* Currency - hidden on mobile */}
            <select
              className="desktop-nav"
              value={user?.currency || 'USD'}
              onChange={(e) => updateProfile({ currency: e.target.value })}
              style={{
                background: 'var(--bg-color)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.3rem 0.45rem',
                fontSize: '0.78rem',
                fontWeight: '500',
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

            {/* Scan Receipt button */}
            <button
              onClick={() => setShowScanner(true)}
              className="btn btn-primary"
              style={{ padding: '0.38rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
              title="Scan Receipt"
            >
              <Camera size={14} />
              <span className="desktop-nav" style={{ display: 'inline' }}>Scan</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleDark}
              className="btn-icon"
              style={{ padding: '0.38rem' }}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Logout - desktop only */}
            <button
              onClick={handleLogout}
              className="desktop-logout-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                fontWeight: '500'
              }}
            >
              <LogOut size={16} />
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.key || location.pathname === item.path;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`mobile-bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="mobile-bottom-nav-item"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
        >
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </nav>

      {/* ── RECEIPT SCANNER MODAL ── */}
      {showScanner && (
        <ReceiptScanner
          onSuccess={() => { setShowScanner(false); window.location.reload(); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
