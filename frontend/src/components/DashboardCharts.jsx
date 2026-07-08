import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { transactionService, authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/format';
import { motion } from 'framer-motion';
import { TrendingUp, CreditCard, AlertTriangle, Edit2, Check, Target } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function DashboardCharts({ refreshKey }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    fetchSummary();
  }, [month, refreshKey]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getSummary(month);
      setSummary(response.data);
      if (response.data.daily_budget !== undefined) {
         setNewBudget(response.data.daily_budget);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async () => {
    try {
      await authService.updateProfile({ daily_budget: parseFloat(newBudget) });
      setIsEditingBudget(false);
      fetchSummary();
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  };

  if (loading && !summary) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading insights...</div>;
  if (!summary) return <div>No data available</div>;

  const categoryData = Object.entries(summary.by_category).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const budgetExceeded = summary.daily_budget > 0 && summary.today_spent > summary.daily_budget;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel"
      style={{ padding: '2rem', height: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Spending Overview</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input-field"
          style={{ width: 'auto', padding: '0.5rem', background: 'transparent' }}
        />
      </div>

      {budgetExceeded && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            background: '#fee2e2', borderLeft: '4px solid #ef4444', 
            padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b91c1c'
          }}
        >
          <AlertTriangle size={24} />
          <div>
            <strong>Budget Exceeded!</strong> You have spent {formatCurrency(summary.today_spent, user?.currency)} today, which is over your daily limit of {formatCurrency(summary.daily_budget, user?.currency)}.
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>Total Spent (Month)</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>{formatCurrency(summary.total_spent, user?.currency)}</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
        
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Top Category</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'var(--text-main)' }}>
                {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
              </h3>
            </div>
            <div style={{ background: '#f3f4f6', padding: '0.5rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Today's Spent</p>
                {!isEditingBudget ? (
                  <button onClick={() => setIsEditingBudget(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                    <Edit2 size={14} />
                  </button>
                ) : null}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: budgetExceeded ? '#ef4444' : 'var(--text-main)' }}>
                  {formatCurrency(summary.today_spent || 0, user?.currency)}
                </h3>
                
                {isEditingBudget ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <input 
                      type="number" 
                      value={newBudget} 
                      onChange={(e) => setNewBudget(e.target.value)}
                      style={{ width: '60px', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                    <button onClick={handleUpdateBudget} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer' }}>
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    / {formatCurrency(summary.daily_budget || 0, user?.currency)} limit
                  </span>
                )}
              </div>
            </div>
            <div style={{ background: budgetExceeded ? '#fee2e2' : '#f3f4f6', padding: '0.5rem', borderRadius: '50%', color: budgetExceeded ? '#ef4444' : 'var(--primary-color)' }}>
              <Target size={20} />
            </div>
          </div>
        </div>
      </div>

      {categoryData.length > 0 ? (
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value, user?.currency)} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          No transactions for this month.
        </div>
      )}
    </motion.div>
  );
}
