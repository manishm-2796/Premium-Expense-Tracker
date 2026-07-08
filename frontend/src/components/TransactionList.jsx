import { useState, useEffect, useRef } from 'react';
import { transactionService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Download, Upload } from 'lucide-react';

export default function TransactionList({ refreshKey }) {
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
      style={{ padding: '2rem', marginTop: '2rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Recent Transactions</h2>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', top: '50%', left: '0.75rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
              className="input-field"
              style={{ paddingLeft: '2.25rem', width: '200px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="input-field"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <button 
            onClick={handleExport}
            className="btn btn-primary"
            style={{ display: 'flex', gap: '0.5rem', background: 'var(--secondary-color)' }}
          >
            <Download size={16} />
            Export CSV
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
            style={{ display: 'flex', gap: '0.5rem', background: '#3b82f6' }}
            disabled={loading}
          >
            <Upload size={16} />
            Import CSV
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f3f4f6', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Date</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Description</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Category</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Amount</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}></th>
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
                    style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{transaction.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        background: `${transaction.category.color}20`, 
                        color: transaction.category.color,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {transaction.category.name}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                      >
                        <Trash2 size={18} />
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
