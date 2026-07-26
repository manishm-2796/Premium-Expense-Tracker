import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { transactionService } from '../services/api';

const ReceiptScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError('');
    }
  };

  const handleScan = async () => {
    if (!file) {
      setError('Please select a receipt image to scan.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await transactionService.scanReceipt(formData);
      
      onScanSuccess({
        amount: res.data.amount || 0,
        date: res.data.date || new Date().toISOString().split('T')[0],
        description: res.data.raw_text ? `Receipt: ${res.data.raw_text.substring(0, 30)}...` : 'Scanned Receipt'
      });
      
      onClose();
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.response?.data?.detail || 'Failed to scan receipt. Please try another image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card receipt-modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Camera style={{ color: 'var(--primary-color)' }} />
            <h3>Scan Receipt (OCR)</h3>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="upload-dropzone">
            <input 
              type="file" 
              accept="image/*" 
              id="receipt-file-input" 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            <label htmlFor="receipt-file-input" className="dropzone-label">
              {preview ? (
                <img src={preview} alt="Receipt preview" className="receipt-preview-img" />
              ) : (
                <div className="dropzone-placeholder">
                  <Upload size={36} style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }} />
                  <p>Click or Drag a receipt photo here</p>
                  <span className="dropzone-subtext">Supports PNG, JPG, JPEG</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleScan}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Loader2 className="spinner" size={18} />
                Scanning Receipt...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Auto-fill Transaction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptScannerModal;
