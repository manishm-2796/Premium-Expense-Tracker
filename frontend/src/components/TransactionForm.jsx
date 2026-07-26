import { useState, useEffect } from 'react';
import { transactionService, categoryService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { PlusCircle, Tag, Camera } from 'lucide-react';
import ReceiptScannerModal from './ReceiptScannerModal';

export default function TransactionForm({ onTransactionAdded }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const response = await categoryService.create({ name: newCategory, color: '#4f46e5' });
      setCategories([...categories, response.data]);
      setFormData({ ...formData, category_id: response.data.id });
      setNewCategory('');
      setShowNewCategory(false);
    } catch (error) {
      setError('Failed to create category');
    }
  };

  const handleScanSuccess = ({ amount, date, description }) => {
    setFormData((prev) => ({
      ...prev,
      amount: amount || prev.amount,
      date: date || prev.date,
      description: description || prev.description
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.category_id || !formData.amount || !formData.description) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    try {
      await transactionService.create({
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id)
      });

      setFormData({
        category_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });

      onTransactionAdded();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel"
      style={{ padding: '2rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#e0e7ff', color: 'var(--primary-color)', padding: '0.5rem', borderRadius: '8px' }}>
            <PlusCircle size={20} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Quick Add</h3>
        </div>

        <button 
          type="button" 
          className="btn btn-outline" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
          onClick={() => setShowScanner(true)}
        >
          <Camera size={16} />
          Scan Receipt
        </button>
      </div>

      <ReceiptScannerModal 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScanSuccess={handleScanSuccess} 
      />
      
      {error && <div className="error-msg">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="input-label">Category</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="input-field"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              disabled={loading}
              style={{ flex: 1 }}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCategory(!showNewCategory)}
              className="btn"
              style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}
            >
              <Tag size={16} />
            </button>
          </div>

          {showNewCategory && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}
            >
              <input
                type="text"
                className="input-field"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button type="button" onClick={handleAddCategory} className="btn btn-primary">
                Add
              </button>
            </motion.div>
          )}
        </div>

        <div className="form-group">
          <label className="input-label">
            Amount ({user?.currency || 'USD'})
          </label>
          <input
            className="input-field"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="input-label">Description</label>
          <input
            className="input-field"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Coffee, Groceries"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label className="input-label">Date</label>
          <input
            className="input-field"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            disabled={loading}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
          {loading ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>
    </motion.div>
  );
}
