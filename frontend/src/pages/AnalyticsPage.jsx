import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/api';
import Navbar from '../components/Navbar';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const currencySymbol = user?.currency || 'USD';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trendsRes, summaryRes] = await Promise.all([
          transactionService.getTrends(),
          transactionService.getSummary()
        ]);
        setTrends(trendsRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error('Failed to load analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoryData = summary?.by_category
    ? Object.keys(summary.by_category).map((catName) => ({
        name: catName,
        value: summary.by_category[catName]
      }))
    : [];

  const totalSpent = summary?.total_spent || 0;
  const avgMonthlySpent = trends.length > 0
    ? (trends.reduce((sum, item) => sum + item.amount, 0) / trends.length).toFixed(2)
    : 0;

  return (
    <div className="app-layout">
      <Navbar activePage="analytics" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Spending Analytics & Trends 📈</h2>
            <p className="subtitle">Visual insights into your monthly financial habits</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : (
          <div className="analytics-grid">
            {/* Stat Cards */}
            <div className="stat-cards-row">
              <div className="stat-card glass-card">
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                  <TrendingUp size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">This Month Spent</span>
                  <h3 className="stat-value">{currencySymbol} {totalSpent.toFixed(2)}</h3>
                </div>
              </div>

              <div className="stat-card glass-card">
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Calendar size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">6-Month Avg Spent</span>
                  <h3 className="stat-value">{currencySymbol} {avgMonthlySpent}</h3>
                </div>
              </div>

              <div className="stat-card glass-card">
                <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                  <PieIcon size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Active Categories</span>
                  <h3 className="stat-value">{categoryData.length}</h3>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-two-col">
              {/* Monthly Spending Trend Bar Chart */}
              <div className="chart-card glass-card">
                <div className="chart-header">
                  <h3>6-Month Spending Trend</h3>
                </div>
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={trends} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="label" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        formatter={(val) => [`${currencySymbol} ${val}`, 'Total Spent']}
                      />
                      <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown Pie Chart */}
              <div className="chart-card glass-card">
                <div className="chart-header">
                  <h3>Category Share</h3>
                </div>
                <div style={{ width: '100%', height: 320 }}>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={4}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                          formatter={(val) => [`${currencySymbol} ${val}`, 'Amount']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">No transaction category data for this month.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3>Category Expense Breakdown</h3>
              <div className="table-responsive" style={{ marginTop: '1rem' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total Amount</th>
                      <th>Percentage of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((cat, idx) => {
                      const percentage = totalSpent > 0 ? ((cat.value / totalSpent) * 100).toFixed(1) : 0;
                      return (
                        <tr key={cat.name}>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span 
                              style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: COLORS[idx % COLORS.length],
                                display: 'inline-block'
                              }}
                            />
                            <strong>{cat.name}</strong>
                          </td>
                          <td>{currencySymbol} {cat.value.toFixed(2)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="progress-bar-container" style={{ flex: 1, height: '8px' }}>
                                <div 
                                  className="progress-bar-fill" 
                                  style={{ width: `${percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }} 
                                />
                              </div>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
