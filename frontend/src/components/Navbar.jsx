import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Wallet, Moon, Sun, LayoutDashboard, TrendingUp, Target, RefreshCw, Bot, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ activePage }) {
  const { logout, user, updateProfile } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Brand Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', color: 'var(--primary-color)' }}>
          <div style={{ padding: '0.4rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
            <Wallet size={24} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
            ExpenseTracker
          </h1>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
                  gap: '0.45rem',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={user?.currency || 'USD'}
            onChange={(e) => updateProfile({ currency: e.target.value })}
            style={{
              background: 'var(--bg-color)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.35rem 0.5rem',
              fontSize: '0.8rem',
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

          <button 
            onClick={toggleDark}
            className="btn-icon"
            style={{ padding: '0.4rem' }}
            title="Toggle Theme"
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

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
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            <LogOut size={17} />
            <span className="logout-text">Logout</span>
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-toggle"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'none',
              alignItems: 'center'
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mobile-drawer"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)',
              borderBottom: 'var(--glass-border)',
              padding: '1rem 1.25rem',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.key || location.pathname === item.path;
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? 'var(--primary-color)' : 'var(--text-main)',
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent'
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  marginTop: '0.5rem',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
