import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { transactionService, authService, categoryService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Target, AlertTriangle, CheckCircle2, DollarSign, Edit3, Save, Plus } from 'lucide-react';

const BudgetsPage = () => {
  const { user, login } = useAuth();
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [dailyBudget, setDailyBudget] = useState(user?.daily_budget || 0);
  const [monthlyBudget, setMonthlyBudget] = useState(user?.monthly_budget || 0);
  const [message, setMessage] = useState({ type: '', text: '' });

  const currencySymbol = user?.currency || 'USD';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, catRes] = await Promise.all([
        transactionService.getSummary(),
        categoryService.getAll()
      ]);
      setSummary(sumRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load budget data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveUserBudget = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.updateProfile({
        daily_budget: parseFloat(dailyBudget) || 0,
        monthly_budget: parseFloat(monthlyBudget) || 0
      });
      setMessage({ type: 'success', text: 'Budget targets updated successfully!' });
      setEditingBudget(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update budget targets.' });
    }
  };

  const handleUpdateCategoryBudget = async (catId, newLimit) => {
    try {
      await categoryService.update(catId, { budget_limit: parseFloat(newLimit) || 0 });
      fetchData();
    } catch (err) {
      console.error('Failed to update category budget limit', err);
    }
  };

  const totalSpent = summary?.total_spent || 0;
  const targetMonthly = user?.monthly_budget || 0;
  const isExceeded = targetMonthly > 0 && totalSpent > targetMonthly;
  const percentUsed = targetMonthly > 0 ? Math.min(100, (totalSpent / targetMonthly) * 100) : 0;

  return (
    <div className="app-layout">
      <Navbar activePage="budgets" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Budget & Limits 🎯</h2>
            <p className="subtitle">Track your spending targets and prevent overspending</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setEditingBudget(!editingBudget)}
          >
            <Edit3 size={18} />
            {editingBudget ? 'Cancel Edit' : 'Edit Overall Budget'}
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
            <span>{message.text}</span>
          </div>
        )}

        {/* Overall Budget Overview Card */}
        <div className="glass-card budget-overview-card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Monthly Budget Limit
              </span>
              <h1 style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}>
                {currencySymbol} {totalSpent.toFixed(2)} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {targetMonthly > 0 ? `${currencySymbol} ${targetMonthly.toFixed(2)}` : 'No limit set'}</span>
              </h1>
            </div>
            <div 
              className="badge" 
              style={{ 
                padding: '0.5rem 1rem', 
                borderRadius: '20px', 
                backgroundColor: isExceeded ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isExceeded ? '#ef4444' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}
            >
              {isExceeded ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              {isExceeded ? 'Budget Exceeded!' : 'Within Target'}
            </div>
          </div>

          <div className="progress-bar-container" style={{ height: '14px', borderRadius: '7px' }}>
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${percentUsed}%`, 
                backgroundColor: isExceeded ? '#ef4444' : percentUsed > 80 ? '#f59e0b' : '#10b981',
                borderRadius: '7px'
              }} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>{percentUsed.toFixed(1)}% Used</span>
            <span>{targetMonthly > 0 ? `${currencySymbol} ${(targetMonthly - totalSpent).toFixed(2)} Remaining` : ''}</span>
          </div>

          {/* Edit Budget Inline Form */}
          {editingBudget && (
            <form onSubmit={handleSaveUserBudget} style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label>Daily Budget ({currencySymbol})</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={dailyBudget} 
                    onChange={(e) => setDailyBudget(e.target.value)} 
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="form-group">
                  <label>Monthly Budget ({currencySymbol})</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={monthlyBudget} 
                    onChange={(e) => setMonthlyBudget(e.target.value)} 
                    placeholder="e.g. 1500"
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} />
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Category Budget Limits */}
        <h3 style={{ marginBottom: '1rem' }}>Category Budget Allocations</h3>
        <div className="category-budget-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat) => {
            const spent = summary?.by_category?.[cat.name] || 0;
            const limit = cat.budget_limit || 0;
            const catPercent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
            const catExceeded = limit > 0 && spent > limit;

            return (
              <div key={cat.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cat.color || '#6366f1' }} />
                    <strong style={{ fontSize: '1.05rem' }}>{cat.name}</strong>
                  </div>
                  {catExceeded && (
                    <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      Over Limit
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <span>Spent: {currencySymbol} {spent.toFixed(2)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Limit: {currencySymbol} {limit > 0 ? limit.toFixed(2) : 'None'}</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${catPercent}%`, 
                        backgroundColor: catExceeded ? '#ef4444' : cat.color || '#6366f1' 
                      }} 
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Set Limit:</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} 
                    defaultValue={limit || ''} 
                    placeholder="Enter limit..."
                    onBlur={(e) => handleUpdateCategoryBudget(cat.id, e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BudgetsPage;
