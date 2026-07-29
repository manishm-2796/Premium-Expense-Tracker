import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2, ChevronLeft } from 'lucide-react';
import SocialAuthButtons from '../components/SocialAuthButtons';
import { twoFactorService } from '../services/api';
import { setToken, setUser } from '../utils/auth';
import '../index.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      // Normal login success (no 2FA)
      navigate('/dashboard');
    } catch (err) {
      // Check if the error response indicates 2FA is required
      const msg = err.message || '';
      if (msg.includes('requires_2fa') || msg.includes('Two-factor')) {
        setRequires2FA(true);
        setTwoFAEmail(email);
        setError('');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    if (!twoFACode || twoFACode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setVerifying2FA(true);
    setError('');

    try {
      const res = await twoFactorService.verifyToken(twoFACode, twoFAEmail);
      if (res.data && res.data.access_token) {
        setToken(res.data.access_token);
        setUser(res.data.user);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid authentication code');
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTwoFACode('');
    setError('');
  };

  // ── 2FA Challenge Screen ──
  if (requires2FA) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
        <motion.div 
          className="glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--primary-color)' }}>
              <ShieldCheck size={28} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '700' }}>Two-Factor Verification</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-msg">{error}</motion.div>}

          <form onSubmit={handle2FAVerify}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">Authentication Code</label>
              <input
                className="input-field"
                type="text"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                required
                disabled={verifying2FA}
                placeholder="123456"
                autoFocus
                style={{ 
                  textAlign: 'center', 
                  letterSpacing: '8px', 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  padding: '0.85rem'
                }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={verifying2FA}>
              {verifying2FA ? (
                <><Loader2 className="spinner" size={18} /> Verifying...</>
              ) : (
                <><ShieldCheck size={18} /> Verify Identity</>
              )}
            </button>
          </form>

          <button
            onClick={handleBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              width: '100%',
              marginTop: '1rem',
              padding: '0.65rem',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            <ChevronLeft size={16} /> Back to Login
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Lost your device? Use a recovery code instead.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Normal Login Screen ──
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-color)', borderRadius: '50%', marginBottom: '1rem', color: 'white' }}>
            <LogIn size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Login to your expense tracker</p>
        </div>
        
        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-msg">{error}</motion.div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={18} />
              </div>
              <input
                className="input-field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{ paddingLeft: '2.75rem' }}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input
                className="input-field"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '1rem',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <SocialAuthButtons />

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
