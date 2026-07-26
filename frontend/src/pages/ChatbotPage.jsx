import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { chatService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Bot, Send, User as UserIcon, Sparkles, Loader2, Key, Lightbulb } from 'lucide-react';

const SUGGESTIONS = [
  "How am I doing this month?",
  "Where can I reduce my spending?",
  "What is my highest spending category?",
  "Give me financial tips to save more money."
];

const ChatbotPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.email ? user.email.split('@')[0] : 'there'}! 👋 I am your personal AI Financial Assistant. How can I help you analyze or optimize your expenses today?`
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMsg;
    if (!query.trim() || loading) return;

    const userMessage = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage({ message: query });
      const botMessage = { sender: 'bot', text: res.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = { 
        sender: 'bot', 
        text: err.response?.data?.detail === 'GEMINI_KEY_MISSING' 
          ? '⚠️ Personal Gemini API Key missing! You can set your Gemini API key in Settings, or use our instant budget insights.'
          : 'Sorry, I encountered an issue retrieving insights right now.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Navbar activePage="chat" />
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2>AI Financial Advisor 🤖</h2>
              <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#6366f1' }}>
                <Sparkles size={14} /> Powered by AI
              </span>
            </div>
            <p className="subtitle">Ask questions about your budget, transactions, and saving strategies</p>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="suggestion-chips-row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {SUGGESTIONS.map((sug, idx) => (
            <button 
              key={idx} 
              className="btn btn-outline" 
              style={{ fontSize: '0.825rem', padding: '0.35rem 0.75rem', borderRadius: '15px' }}
              onClick={() => handleSend(sug)}
            >
              <Lightbulb size={13} style={{ color: '#f59e0b', marginRight: '0.25rem' }} />
              {sug}
            </button>
          ))}
        </div>

        {/* Chat Messages Container */}
        <div className="chat-container glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '12px' }}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`chat-bubble-row ${msg.sender === 'user' ? 'chat-row-user' : 'chat-row-bot'}`}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}
            >
              {msg.sender === 'bot' && (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <Bot size={20} />
                </div>
              )}

              <div 
                className="chat-bubble"
                style={{
                  maxWidth: '70%',
                  padding: '0.85rem 1.15rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  lineHeight: '1.5',
                  fontSize: '0.95rem'
                }}
              >
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                  <UserIcon size={20} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble-row chat-row-bot" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <Bot size={20} />
              </div>
              <div className="chat-bubble" style={{ padding: '0.85rem 1.15rem', borderRadius: '18px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 className="spinner" size={16} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>AI Assistant is thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ marginTop: '1rem' }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
          >
            <input 
              type="text" 
              className="form-input"
              style={{ borderRadius: '24px', padding: '0.85rem 1.25rem', fontSize: '0.95rem' }}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask AI anything about your money, budget, or saving..."
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              disabled={!inputMsg.trim() || loading}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
