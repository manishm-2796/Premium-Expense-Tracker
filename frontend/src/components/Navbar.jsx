import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: 'var(--glass-border)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary-color)' }}>
        <Wallet size={28} />
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
          ExpenseTracker
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '600', fontSize: '0.875rem'
          }}>
            {user?.email?.[0].toUpperCase()}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.email}</span>
        </div>
        <button 
          onClick={handleLogout} 
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </motion.nav>
  );
}
