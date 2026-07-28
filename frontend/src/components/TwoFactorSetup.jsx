import React, { useState } from 'react';
import { twoFactorService } from '../services/api';
import { ShieldCheck, Key, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function TwoFactorSetup({ user, onUpdate }) {
  const [step, setStep] = useState('initial'); // initial, qr, recovery
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await twoFactorService.setup();
      setSetupData(res.data);
      setStep('qr');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate 2FA setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await twoFactorService.confirm(code);
      if (res.data && res.data.success) {
        setBackupCodes(res.data.backup_codes || []);
        setStep('recovery');
        onUpdate?.();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? Your account will be less secure.')) return;

    setLoading(true);
    setError('');
    try {
      await twoFactorService.disable();
      setStep('initial');
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', width: '100%', marginTop: '1.5rem' }}>
      <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: '700' }}>
        <ShieldCheck size={20} style={{ color: user?.two_factor_enabled ? '#10b981' : 'var(--primary-color)' }} />
        Two-Factor Authentication (2FA)
      </h3>
      <p className="subtitle" style={{ marginBottom: '1.25rem' }}>
        Add bank-grade security to your account using Google Authenticator, Authy, or Microsoft Authenticator
      </p>

      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {user?.two_factor_enabled ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Check size={16} /> 2FA Protection Active
            </span>
          </div>
          <button className="btn btn-secondary" onClick={handleDisable2FA} disabled={loading} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      ) : (
        <div>
          {step === 'initial' && (
            <button className="btn btn-primary" onClick={handleStartSetup} disabled={loading}>
              {loading ? <Loader2 className="spinner" size={18} /> : <ShieldCheck size={18} />}
              Enable 2FA Protection
            </button>
          )}

          {step === 'qr' && setupData && (
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Step 1: Scan with Authenticator App</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Open Google Authenticator or Authy on your phone and scan the setup code below:
              </p>

              <div style={{ padding: '0.75rem', backgroundColor: '#ffffff', display: 'inline-block', borderRadius: '8px', marginBottom: '1rem' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(setupData.otp_uri)}`} 
                  alt="2FA QR Code"
                  style={{ width: '160px', height: '160px', display: 'block' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Secret Key (Manual Entry):</small>
                <code style={{ fontSize: '0.9rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '0.35rem 0.65rem', borderRadius: '6px', color: 'var(--primary-color)', fontWeight: '700' }}>
                  {setupData.secret}
                </code>
              </div>

              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Step 2: Enter 6-Digit Code</h4>
              <form onSubmit={handleConfirmCode} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  maxLength={6} 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="123456" 
                  style={{ maxWidth: '160px', letterSpacing: '3px', fontWeight: '700', textAlign: 'center' }}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </form>
            </div>
          )}

          {step === 'recovery' && (
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={18} /> 2FA Successfully Enabled!
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Save these emergency recovery codes in a secure place. Each code can be used once to access your account if you lose your phone:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: '8px', fontFamily: 'monospace' }}>
                {backupCodes.map((c, i) => (
                  <span key={i} style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>{c}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={copyCodes}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Recovery Codes'}
                </button>
                <button className="btn btn-primary" onClick={() => setStep('initial')}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
