import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { transactionService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { User, Key, Moon, Sun, Download, Upload, Save, CheckCircle2, AlertCircle } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' }
];

const SettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const { isDark, toggleDark } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [dailyBudget, setDailyBudget] = useState(user?.daily_budget || 0);
  const [monthlyBudget, setMonthlyBudget] = useState(user?.monthly_budget || 0);
  const [geminiApiKey, setGeminiApiKey] = useState(user?.gemini_api_key || '');
  
  const [saving, setSaving] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setCurrency(user.currency || 'USD');
      setDailyBudget(user.daily_budget || 0);
      setMonthlyBudget(user.monthly_budget || 0);
      setGeminiApiKey(user.gemini_api_key || '');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateProfile({
        full_name: fullName,
        currency: currency,
        daily_budget: parseFloat(dailyBudget) || 0,
        monthly_budget: parseFloat(monthlyBudget) || 0,
        gemini_api_key: geminiApiKey
      });
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await transactionService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export CSV failed:', err);
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await transactionService.uploadCSV(formData);
      setMessage({ type: 'success', text: res.data.message || 'CSV imported successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to import CSV.' });
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="settings" />
      <main className="main-content" style={{ flex: 1 }}>
        <div className="page-header">
          <div>
            <h2>Settings & Preferences ⚙️</h2>
            <p className="subtitle">Manage profile, currency, budgets, AI key, and data backup</p>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="settings-grid">
          {/* Profile & Currency Form */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: '700' }}>
              <User size={20} style={{ color: 'var(--primary-color)' }} />
              Profile & Currency
            </h3>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Account Email</label>
                <input type="text" className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Enter full name" 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Preferred Currency</label>
                <select 
                  className="input-field" 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Daily Budget Limit</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={dailyBudget} 
                    onChange={(e) => setDailyBudget(e.target.value)} 
                    placeholder="0" 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Monthly Budget Limit</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={monthlyBudget} 
                    onChange={(e) => setMonthlyBudget(e.target.value)} 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Key size={16} /> Personal Gemini API Key
                </label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={geminiApiKey} 
                  onChange={(e) => setGeminiApiKey(e.target.value)} 
                  placeholder="AIZASy..." 
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                  Enables personalized Gemini AI responses in AI Advisor.
                </small>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving Preferences...' : 'Save All Settings'}
              </button>
            </form>
          </div>

          {/* Theme & Data Import/Export */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Theme Toggle */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: '700' }}>
                {isDark ? <Moon size={20} style={{ color: '#8b5cf6' }} /> : <Sun size={20} style={{ color: '#f59e0b' }} />}
                Appearance Theme
              </h3>
              <p className="subtitle" style={{ marginBottom: '1.25rem' }}>Switch between dark mode and sleek light mode</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem' }}>Current Mode: <strong>{isDark ? 'Dark Mode 🌙' : 'Light Mode ☀️'}</strong></span>
                <button className="btn btn-secondary" onClick={toggleDark} style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}>
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </button>
              </div>
            </div>

            {/* CSV Backup & Restore */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: '700' }}>
                <Download size={20} style={{ color: 'var(--primary-color)' }} />
                Data Migration & Backup
              </h3>
              <p className="subtitle" style={{ marginBottom: '1.25rem' }}>Export your transactions or import external bank CSV files</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <button className="btn btn-secondary" onClick={handleExportCSV} style={{ justifyContent: 'center', padding: '0.65rem' }}>
                  <Download size={18} />
                  Export All Transactions to CSV
                </button>

                <div>
                  <input 
                    type="file" 
                    accept=".csv" 
                    id="csv-settings-input" 
                    style={{ display: 'none' }} 
                    onChange={handleImportCSV} 
                  />
                  <label htmlFor="csv-settings-input" className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', padding: '0.65rem' }}>
                    <Upload size={18} />
                    {csvLoading ? 'Importing CSV...' : 'Import Transactions from CSV'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
