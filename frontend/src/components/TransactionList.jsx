import { useState, useEffect, useRef } from 'react';
import { transactionService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Download, Upload } from 'lucide-react';

export default function TransactionList({ refreshKey }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, [searchTerm, selectedCategory, refreshKey]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getAll({
        search: searchTerm || undefined,
        category_id: selectedCategory || undefined
      });
      setTransactions(response.data);

      const uniqueCategories = [...new Set(response.data.map(t => t.category.name))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionService.delete(id);
        setTransactions(transactions.filter(t => t.id !== id));
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await transactionService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const fileInputRef = useRef(null);
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      await transactionService.uploadCSV(formData);
      alert('CSV uploaded successfully!');
      fetchTransactions();
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      alert('Failed to upload CSV. Please ensure it has Date, Description, and Amount columns.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-panel"
      style={{ padding: '1.75rem', marginTop: '1.75rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Recent Transactions</h2>
        
        <div className="filter-controls-row" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', width: 'auto' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '130px' }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
              className="input-field"
              style={{ paddingLeft: '2.25rem', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="input-field"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ flex: 1, minWidth: '130px' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <button 
            onClick={handleExport}
            className="btn btn-primary"
            style={{ display: 'inline-flex', gap: '0.4rem', background: 'var(--secondary-color)', padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}
          >
            <Download size={15} />
            Export
          </button>
          
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', gap: '0.4rem', background: '#3b82f6', padding: '0.55rem 0.9rem', fontSize: '0.85rem' }}
            disabled={loading}
          >
            <Upload size={15} />
            Import
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {transactions.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, i) => (
                  <motion.tr 
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: '500' }}>{transaction.description}</td>
                    <td>
                      <span style={{ 
                        background: `${transaction.category.color}20`, 
                        color: transaction.category.color,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}>
                        {transaction.category.name}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {formatCurrency(transaction.amount, user?.currency)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="btn-icon"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
