import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Loader2, ChevronLeft } from 'lucide-react';
import api from '../services/api';

const LoginWith2FA = ({ tempToken, onSuccess, onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (codeToVerify) => {
    const verificationCode = (codeToVerify || code).trim();
    if (!verificationCode) {
      setError('Please enter your 6-digit authentication code.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/2fa/verify-token', {
        email: tempToken,
        tempToken: tempToken,
        code: verificationCode
      });
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Verification failed. Please check your code and try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleVerify(code);
    }
  }, [code]);

  const handleChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
    setCode(val);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading) {
      handleVerify(code);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        width: '100%'
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(79, 70, 229, 0.12)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <ShieldCheck size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Two-Factor Authentication
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.4' }}>
          Enter the 6-digit code from your authenticator app
        </p>

        {error && (
          <div className="alert alert-error" style={{ width: '100%', marginBottom: '1.25rem', textAlign: 'left' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}
            >
              <KeyRound size={20} />
            </div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={handleChange}
              disabled={loading}
              maxLength={6}
              className="input-field"
              style={{
                textAlign: 'center',
                letterSpacing: '0.4em',
                fontSize: '1.5rem',
                fontWeight: 600,
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                fontFamily: 'monospace'
              }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 600 }}
          >
            {loading ? (
              <>
                <Loader2 className="spinner" size={20} />
                <span>Verifying...</span>
              </>
            ) : (
              'Verify Identity'
            )}
          </button>
        </form>

        <button
          onClick={onBack}
          type="button"
          className="btn-outline"
          style={{
            marginTop: '1.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px'
          }}
        >
          <ChevronLeft size={16} />
          <span>Back to Login</span>
        </button>
      </div>
    </div>
  );
};

export default LoginWith2FA;
