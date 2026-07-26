import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { recurringService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { RefreshCw, Plus, Trash2, Edit2, Calendar, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

const SubscriptionsPage = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    frequency: 'Monthly',
    next_date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');

  const currencySymbol = user?.currency || 'USD';

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await recurringService.getAll();
      setSubscriptions(res.data);
    } catch (err) {
      console.error('Failed to load subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleOpenModal = (sub = null) => {
    if (sub) {
      setEditingSub(sub);
      setFormData({
        merchant: sub.merchant,
        amount: sub.amount,
        frequency: sub.frequency || 'Monthly',
        next_date: sub.next_date ? sub.next_date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingSub(null);
      setFormData({
        merchant: '',
        amount: '',
        frequency: 'Monthly',
        next_date: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.merchant || !formData.amount) {
      setError('Merchant name and amount are required.');
      return;
    }

    try {
      const payload = {
        merchant: formData.merchant,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        next_date: new Date(formData.next_date).toISOString()
      };

      if (editingSub) {
        await recurringService.update(editingSub.id, payload);
      } else {
        await recurringService.create(payload);
      }

      setShowModal(false);
      fetchSubscriptions();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save subscription.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring subscription?')) {
      try {
        await recurringService.delete(id);
        fetchSubscriptions();
      } catch (err) {
        console.error('Failed to delete subscription', err);
      }
    }
  };

  const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
    const amt = sub.amount || 0;
    if (sub.frequency === 'Yearly') return sum + amt / 12;
    if (sub.frequency === 'Weekly') return sum + amt * 4.33;
    return sum + amt; // Monthly
  }, 0);

  return (
    <div className="app-layout">
      <Navbar activePage="subscriptions" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Subscriptions & Recurring Expenses 🔄</h2>
            <p className="subtitle">Manage automated bills, memberships, and recurring payments</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Subscription
          </button>
        </div>

        {/* Overview Stats */}
        <div className="stat-cards-row" style={{ marginBottom: '2rem' }}>
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
              <RefreshCw size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Active Subscriptions</span>
              <h3 className="stat-value">{subscriptions.length}</h3>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Est. Monthly Recurring</span>
              <h3 className="stat-value">{currencySymbol} {totalMonthlyCost.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Subscriptions Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="glass-card empty-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <RefreshCw size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No recurring subscriptions found</h3>
            <p className="subtitle">Keep track of Netflix, Gym, Rent, Spotify, and internet bills here.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleOpenModal()}>
              <Plus size={18} />
              Add Your First Subscription
            </button>
          </div>
        ) : (
          <div className="subscriptions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {subscriptions.map((sub) => (
              <div key={sub.id} className="glass-card subscription-card" style={{ padding: '1.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{sub.merchant}</h3>
                    <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                      {sub.frequency}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" onClick={() => handleOpenModal(sub)} title="Edit"><Edit2 size={16} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(sub.id)} style={{ color: '#ef4444' }} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                    {currencySymbol} {sub.amount.toFixed(2)}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> / {sub.frequency.toLowerCase()}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <Calendar size={14} />
                  <span>Next Renewal: {new Date(sub.next_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3>{editingSub ? 'Edit Subscription' : 'Add Subscription'}</h3>
                <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                  <div className="form-group">
                    <label>Merchant / Service Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.merchant} 
                      onChange={(e) => setFormData({ ...formData, merchant: e.target.value })} 
                      placeholder="e.g. Netflix, Spotify, Gym, Rent" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Amount ({currencySymbol}) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      value={formData.amount} 
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                      placeholder="e.g. 15.99" 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Frequency</label>
                    <select 
                      className="form-input" 
                      value={formData.frequency} 
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Next Billing Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formData.next_date} 
                      onChange={(e) => setFormData({ ...formData, next_date: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingSub ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
