import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function SocialAuthButtons() {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  // ── Load Google Identity Services SDK ──
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (document.getElementById('google-gsi-script')) return;

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);
  }, []);

  // ── Google credential callback ──
  const handleGoogleResponse = useCallback(async (response) => {
    setLoadingProvider('google');
    setError('');

    try {
      // Decode the JWT credential to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));

      await socialLogin({
        provider: 'google',
        email: payload.email,
        full_name: payload.name || payload.email.split('@')[0],
        token: response.credential
      });

      navigate('/dashboard');
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  }, [socialLogin, navigate]);

  // ── Initialize Google Sign In button after SDK loads ──
  useEffect(() => {
    if (!googleReady || !GOOGLE_CLIENT_ID || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
  }, [googleReady, handleGoogleResponse]);

  // ── Trigger Google One-Tap / popup ──
  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.');
      return;
    }
    if (!window.google) {
      setError('Google SDK still loading. Please try again.');
      return;
    }

    setLoadingProvider('google');
    setError('');

    // Use the prompt (One Tap) flow
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: open a popup OAuth window
        window.google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile',
          ux_mode: 'popup',
          callback: async (codeResponse) => {
            if (codeResponse.error) {
              setError('Google sign-in was cancelled.');
              setLoadingProvider(null);
              return;
            }
            // For code flow, we'd need backend exchange. Use credential flow instead.
            setLoadingProvider(null);
          }
        }).requestCode();
      }
    });

    // Timeout to reset loading state if user closes popup
    setTimeout(() => setLoadingProvider(null), 15000);
  };

  // ── Other providers (coming soon) ──
  const handleComingSoon = (name) => {
    setError(`${name} sign-in coming soon! Use Google or email/password for now.`);
    setTimeout(() => setError(''), 4000);
  };

  const socialPlatforms = [
    {
      id: 'google',
      name: 'Google',
      bg: 'rgba(234, 67, 53, 0.1)',
      border: 'rgba(234, 67, 53, 0.3)',
      onClick: handleGoogleSignIn,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
          <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
        </svg>
      )
    },
    {
      id: 'facebook',
      name: 'Facebook',
      bg: 'rgba(24, 119, 242, 0.1)',
      border: 'rgba(24, 119, 242, 0.3)',
      onClick: () => handleComingSoon('Facebook'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      id: 'instagram',
      name: 'Instagram',
      bg: 'rgba(225, 48, 108, 0.1)',
      border: 'rgba(225, 48, 108, 0.3)',
      onClick: () => handleComingSoon('Instagram'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#E1306C">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      bg: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.25)',
      onClick: () => handleComingSoon('X (Twitter)'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    }
  ];

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Or continue with
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
          style={{ 
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          {error}
        </motion.div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
        {socialPlatforms.map((platform) => (
          <motion.button
            key={platform.id}
            type="button"
            whileHover={{ scale: 1.1, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.93 }}
            onClick={platform.onClick}
            disabled={!!loadingProvider}
            title={`Sign in with ${platform.name}`}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: platform.bg,
              border: `1.5px solid ${platform.border}`,
              cursor: loadingProvider ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease-in-out',
              opacity: loadingProvider && loadingProvider !== platform.id ? 0.4 : 1,
              position: 'relative'
            }}
          >
            {loadingProvider === platform.id ? (
              <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid var(--text-muted)', borderTopColor: 'var(--primary-color)', borderRadius: '50%' }} />
            ) : (
              platform.icon
            )}
          </motion.button>
        ))}
      </div>

      {!GOOGLE_CLIENT_ID && (
        <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>
          Add VITE_GOOGLE_CLIENT_ID to enable Google Sign-In
        </p>
      )}
    </div>
  );
}
