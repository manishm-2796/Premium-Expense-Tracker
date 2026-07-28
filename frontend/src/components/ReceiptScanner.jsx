import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, Loader2, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { receiptService } from '../services/api';

export default function ReceiptScanner({ onSuccess, onClose }) {
  const [step, setStep] = useState('menu'); // menu, camera, processing, preview
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      setStep('camera');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError('Camera access unavailable. Try uploading an image instead.');
      setStep('menu');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Helper: File to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Capture photo from video stream
  const capturePhoto = async () => {
    try {
      setLoading(true);
      setError(null);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];

      stopCamera();
      await processImage(base64);
    } catch (err) {
      setError(`Capture failed: ${err.message}`);
      setStep('menu');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setLoading(true);
      setError(null);

      const base64 = await fileToBase64(file);
      await processImage(base64);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Process image via API
  const processImage = async (base64) => {
    try {
      setStep('processing');

      const res = await receiptService.process({ image: base64 });
      const result = res.data;

      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      setScannedData(result);
      setEditedData(result.data);
      setStep('preview');
    } catch (err) {
      setError(`Processing error: ${err.response?.data?.detail || err.message}`);
      setStep('menu');
    }
  };

  // Save confirmed receipt
  const handleConfirm = async () => {
    try {
      setLoading(true);

      const res = await receiptService.confirm(scannedData.receipt_id, editedData);
      if (res.data && res.data.success) {
        onSuccess?.(res.data);
        onClose?.();
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      setError(`Failed to save: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(6px)',
          padding: '1rem'
        }}
      >
        <motion.div 
          className="glass-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '1.75rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          <button 
            onClick={() => { stopCamera(); onClose?.(); }}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>

          {/* Menu Step */}
          {step === 'menu' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', marginBottom: '1rem' }}>
                <Camera size={28} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.35rem' }}>📷 Scan Receipt (AI OCR)</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Instantly extract store name, total amount, date, and category using Gemini AI
              </p>

              {error && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <button 
                  onClick={startCamera} 
                  className="btn btn-primary"
                  style={{ padding: '0.75rem', justifyContent: 'center', fontSize: '0.95rem' }}
                  disabled={loading}
                >
                  <Camera size={18} /> Use Camera
                </button>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline"
                  style={{ padding: '0.75rem', justifyContent: 'center', fontSize: '0.95rem' }}
                  disabled={loading}
                >
                  <Upload size={18} /> Upload Receipt Photo
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Camera Step */}
          {step === 'camera' && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Position Receipt in Frame</h3>
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '1.25rem' }}>
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                />
              </div>

              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={capturePhoto}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="spinner" size={18} /> : <Camera size={18} />}
                  Capture Photo
                </button>

                <button 
                  onClick={() => { stopCamera(); setStep('menu'); }}
                  className="btn btn-secondary"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Loader2 className="spinner" size={48} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>Analyzing Receipt...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Extracting merchant, total, date & category</p>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && editedData && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} style={{ color: 'var(--primary-color)' }} /> Confirm Details
                </h3>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '600' }}>
                  Confidence: {Math.round((editedData.confidence || 0.9) * 100)}%
                </span>
              </div>

              {error && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="input-label">Merchant Name</label>
                  <input 
                    type="text"
                    value={editedData.merchant}
                    onChange={(e) => updateField('merchant', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div className="form-group">
                    <label className="input-label">Amount</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={editedData.amount}
                      onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">Date</label>
                    <input 
                      type="date"
                      value={editedData.date}
                      onChange={(e) => updateField('date', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="input-label">Category</label>
                  <select 
                    value={editedData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="input-field"
                  >
                    <option value="Food">Food</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Medical">Medical</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Travel">Travel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '0.7rem' }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="spinner" size={18} /> : <Check size={18} />}
                    Confirm & Save Expense
                  </button>

                  <button 
                    type="button"
                    onClick={() => setStep('menu')}
                    className="btn btn-secondary"
                  >
                    Rescan
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
