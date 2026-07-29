import React, { useState } from 'react';
import { Copy, Check, Download, RefreshCw, AlertTriangle, ShieldOff } from 'lucide-react';

const RecoveryCodes = ({ codes = [], usedCodes = [], onRegenerate, loading = false }) => {
  const [copied, setCopied] = useState(false);

  let codeList = [];
  if (Array.isArray(codes)) {
    codeList = codes;
  } else if (typeof codes === 'string') {
    try {
      codeList = JSON.parse(codes);
    } catch (e) {
      codeList = [];
    }
  }

  let usedList = [];
  if (Array.isArray(usedCodes)) {
    usedList = usedCodes;
  } else if (typeof usedCodes === 'string') {
    try {
      usedList = JSON.parse(usedCodes);
    } catch (e) {
      usedList = [];
    }
  }

  const handleCopy = async () => {
    if (!codeList || codeList.length === 0) return;
    const text = codeList.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for clipboard copy
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!codeList || codeList.length === 0) return;
    const text = `EXPENSE TRACKER - 2FA RECOVERY CODES\n${'=' .repeat(40)}\nStore these codes safely. Each code can only be used once.\n\n` + codeList.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recovery-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateClick = async () => {
    if (window.confirm('Are you sure you want to generate new recovery codes? Any previous codes will become invalid.')) {
      if (onRegenerate) {
        await onRegenerate();
      }
    }
  };

  if (!codeList || codeList.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '0.75rem',
          color: 'var(--text-muted)'
        }}
      >
        <ShieldOff size={40} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>
          No recovery codes available. Enable 2FA to generate codes.
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%'
      }}
    >
      {/* Warning Alert */}
      <div
        className="alert"
        style={{
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 500
        }}
      >
        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
        <span>Store these codes safely — each can only be used once</span>
      </div>

      {/* 2-Column Monospace Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          fontFamily: 'monospace',
          fontSize: '1rem',
          letterSpacing: '0.05em'
        }}
      >
        {codeList.map((codeItem, index) => {
          const isUsed = usedList.some(
            (u) => u.toString().toUpperCase() === codeItem.toString().toUpperCase()
          );
          return (
            <div
              key={index}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                textAlign: 'center',
                color: 'var(--text-main)',
                textDecoration: isUsed ? 'line-through' : 'none',
                opacity: isUsed ? 0.4 : 1,
                userSelect: 'all',
                transition: 'opacity 0.2s'
              }}
            >
              {codeItem}
            </div>
          );
        })}
      </div>

      {/* Action Buttons Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-outline"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            {copied ? (
              <>
                <Check size={16} style={{ color: 'var(--secondary-color)' }} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy All</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-outline"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleRegenerateClick}
          disabled={loading}
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 0.85rem',
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spinner' : ''} />
          <span>Generate New Codes</span>
        </button>
      </div>
    </div>
  );
};

export default RecoveryCodes;
