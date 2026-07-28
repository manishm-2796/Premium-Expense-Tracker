import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { chatService, transactionService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Bot, Send, User as UserIcon, Sparkles, Loader2, Lightbulb } from 'lucide-react';

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
      text: `Hello ${user?.full_name || (user?.email ? user.email.split('@')[0] : 'there')}! 👋 I am your personal AI Financial Assistant. How can I help you analyze or optimize your expenses today?`
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const currencySymbol = user?.currency || 'USD';

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const generateFallbackReply = (queryText) => {
    const q = queryText.toLowerCase();
    if (q.includes('doing') || q.includes('summary') || q.includes('month')) {
      return `Your budget and expenses are logged in ${currencySymbol}. Check out the Dashboard & Analytics pages for full monthly trends!`;
    } else if (q.includes('reduce') || q.includes('save') || q.includes('cut')) {
      return `Review your highest spending categories in the Budgets section and set monthly targets to save significantly in ${currencySymbol}.`;
    } else if (q.includes('category') || q.includes('highest')) {
      return `Your top spending categories are visualized in pie charts under Analytics. Setting category caps will prevent overspending!`;
    }
    return `I am your AI Financial Assistant. You can ask me about your monthly budget, category allocations, or smart saving strategies in ${currencySymbol}.`;
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMsg;
    if (!query.trim() || loading) return;

    const userMessage = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg('');
    setLoading(true);

    try {
      const res = await chatService.sendMessage({ message: query });
      if (res.data && res.data.reply) {
        const botMessage = { sender: 'bot', text: res.data.reply };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const detailMsg = err.response?.data?.detail;
      const fallbackText = typeof detailMsg === 'string' ? detailMsg : generateFallbackReply(query);
      
      const errorMessage = { 
        sender: 'bot', 
        text: fallbackText
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="chat" />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: 'calc(100vh - 80px)', paddingBottom: '1rem' }}>
        <div className="page-header" style={{ marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2>AI Financial Advisor 🤖</h2>
              <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={13} /> Powered by AI
              </span>
            </div>
            <p className="subtitle">Ask questions about your budget, transactions, and saving strategies</p>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="suggestion-chips-row" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.75rem', scrollbarWidth: 'none' }}>
          {SUGGESTIONS.map((sug, idx) => (
            <button 
              key={idx} 
              className="btn btn-outline" 
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '16px', whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => handleSend(sug)}
            >
              <Lightbulb size={13} style={{ color: '#f59e0b', marginRight: '0.3rem' }} />
              {sug}
            </button>
          ))}
        </div>

        {/* Chat Messages Container */}
        <div className="chat-container glass-card" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRadius: '16px' }}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: '0.65rem',
                alignItems: 'flex-start',
                width: '100%'
              }}
            >
              {msg.sender === 'bot' && (
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                  <Bot size={18} />
                </div>
              )}

              <div 
                style={{
                  maxWidth: '82%',
                  padding: '0.8rem 1.1rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  lineHeight: '1.5',
                  fontSize: '0.925rem',
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', flexShrink: 0 }}>
                  <UserIcon size={18} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', flexShrink: 0 }}>
                <Bot size={18} />
              </div>
              <div style={{ padding: '0.8rem 1.1rem', borderRadius: '18px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 className="spinner" size={16} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>AI Assistant is thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ marginTop: '0.75rem' }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}
          >
            <input 
              type="text" 
              className="input-field"
              style={{ borderRadius: '24px', padding: '0.8rem 1.15rem', fontSize: '0.925rem' }}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask AI about your money, budget, or saving..."
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ borderRadius: '50%', width: '46px', height: '46px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              disabled={!inputMsg.trim() || loading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ChatbotPage;
