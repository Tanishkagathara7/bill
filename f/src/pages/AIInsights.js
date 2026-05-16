import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles, RefreshCw, TrendingUp, AlertTriangle, Info,
  Zap, Send, Bot, User, Settings2, ExternalLink, Loader2,
  MessageSquare, BarChart3, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateInsights, generateDailySummary } from '../utils/aiEngine';
import {
  sendAiMessage, generateAiSummary, buildDataContext,
  isAiEnabled, getAiConfig, AI_PROVIDERS
} from '../utils/aiService';
import { billsApi, productsApi } from '../utils/mockApi';

// ── Insight type config ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  critical: { border: 'border-red-200 dark:border-red-800/50', bg: 'bg-red-50 dark:bg-red-950/20', icon: AlertTriangle, iconColor: 'text-red-500', titleColor: 'text-red-900 dark:text-red-200' },
  warning:  { border: 'border-amber-200 dark:border-amber-800/50', bg: 'bg-amber-50 dark:bg-amber-950/20', icon: AlertTriangle, iconColor: 'text-amber-500', titleColor: 'text-amber-900 dark:text-amber-200' },
  positive: { border: 'border-emerald-200 dark:border-emerald-800/50', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: TrendingUp, iconColor: 'text-emerald-500', titleColor: 'text-emerald-900 dark:text-emerald-200' },
  info:     { border: 'border-blue-200 dark:border-blue-800/50', bg: 'bg-blue-50 dark:bg-blue-950/20', icon: Info, iconColor: 'text-blue-500', titleColor: 'text-blue-900 dark:text-blue-200' },
};

// ── Suggested prompts ─────────────────────────────────────────────────────────
const SUGGESTED = [
  'What are my top 3 products this week?',
  'Which items should I restock urgently?',
  'How is my revenue trending?',
  'Suggest a promotion strategy for slow movers',
  'What\'s my average order value this week?',
  'Which category makes the most revenue?',
];

// ── Chat bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5
        ${isUser
          ? 'bg-gradient-to-br from-indigo-500 to-violet-500'
          : 'bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 border border-slate-200 dark:border-slate-700'
        }`}>
        {isUser
          ? <User className="h-3.5 w-3.5 text-white" />
          : <Sparkles className="h-3.5 w-3.5 text-indigo-300" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
        ${isUser
          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
        }`}>
        {msg.content && msg.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
        ))}
        {msg.actionResult && (
          <div className="mt-2 text-xs font-medium flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            <Zap className="h-3 w-3" />
            {msg.actionResult.text}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-200 dark:border-slate-700">
        <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 0.2, 0.4].map((delay, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${delay}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── AI Chat Panel ─────────────────────────────────────────────────────────────
function AiChatPanel({ products, bills, onGoToSettings, refreshProducts, refreshBills }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('qb_ai_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const dataContext = useMemo(() => buildDataContext(products, bills), [products, bills]);
  const aiConf = getAiConfig();

  useEffect(() => {
    localStorage.setItem('qb_ai_chat_history', JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;
    setInput('');
    setError(null);

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build history (exclude latest user msg — we pass it separately)
      const history = newMessages.slice(0, -1);
      const reply = await sendAiMessage(history, userMsg, dataContext);
      
      // Parse for JSON Action blocks
      let cleanReply = reply;
      let executedAction = null;
      
      try {
        const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const actionData = JSON.parse(jsonMatch[1]);
          cleanReply = reply.replace(jsonMatch[0], '').trim();
          
          if (actionData.action === 'CREATE_BILL') {
            const payload = actionData.payload;
            
            // Calculate proper totals since the AI might only provide raw item prices
            const augmentedItems = (payload.items || []).map(item => {
              const product = products.find(p => String(p.id) === String(item.productId));
              const unitPrice = item.price || product?.price || 0;
              const quantity = item.quantity || 1;
              return {
                productId: item.productId,
                productName: item.productName || product?.name || 'Unknown Item',
                quantity,
                unitPrice,
                totalPrice: unitPrice * quantity
              };
            });
            
            const totalAmount = augmentedItems.reduce((sum, item) => sum + item.totalPrice, 0);
            
            await billsApi.create({
              ...payload,
              items: augmentedItems,
              totalAmount,
              paymentMethod: payload.paymentMethod || 'cash',
              paymentStatus: payload.paymentStatus || 'paid'
            });
            
            refreshBills?.();
            refreshProducts?.();
            executedAction = { type: 'success', text: `Created new bill for ₹${totalAmount.toFixed(2)}` };
          } else if (actionData.action === 'ADD_PRODUCT') {
            await productsApi.add(actionData.payload);
            refreshProducts?.();
            executedAction = { type: 'success', text: `Added product: ${actionData.payload.name}` };
          } else if (actionData.action === 'UPDATE_STOCK') {
            await productsApi.update(actionData.payload.productId, actionData.payload);
            refreshProducts?.();
            executedAction = { type: 'success', text: `Updated stock` };
          }
        }
      } catch (err) {
        console.error('Failed to parse or execute AI action:', err);
      }
      
      const finalReply = cleanReply || (executedAction ? 'I have completed that action for you.' : reply);

      setMessages(m => [...m, { 
        role: 'assistant', 
        content: finalReply,
        actionResult: executedAction
      }]);
    } catch (e) {
      setError(e.message);
      setMessages(m => m.slice(0, -1)); // remove the user msg on error
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="card flex flex-col" style={{ height: 520 }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-sm">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">QuickBill AI Assistant</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {aiConf.provider === AI_PROVIDERS.GEMINI ? 'Powered by Google Gemini' : 'Powered by OpenAI'} · {aiConf.model}
          </p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {empty && (
          <div className="flex flex-col items-center justify-center h-full pb-4 gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/40 dark:to-violet-950/40 rounded-2xl flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Ask me about your store</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">I have access to your real-time sales and inventory data.</p>
            </div>
            {/* Suggested prompts */}
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {SUGGESTED.slice(0, 4).map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                    hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30
                    text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300
                    transition-all duration-150 flex items-center gap-2"
                >
                  <ChevronRight className="h-3 w-3 flex-shrink-0 text-slate-300 dark:text-slate-600" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
        {loading && <TypingIndicator />}

        {error && (
          <div className="rounded-xl p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            ❌ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about sales, inventory, trends..."
            className="input flex-1 text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600
              flex items-center justify-center text-white shadow-sm
              hover:from-indigo-700 hover:to-violet-700 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        {!empty && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED.slice(4).map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800
                  hover:bg-indigo-100 dark:hover:bg-indigo-950/40 text-slate-500 dark:text-slate-400
                  hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors duration-150 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── No-key prompt card ────────────────────────────────────────────────────────
function NoKeyCard({ onGoToSettings }) {
  return (
    <div className="card p-8 text-center space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
      <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/40 dark:to-violet-950/40 rounded-2xl flex items-center justify-center mx-auto">
        <Sparkles className="h-7 w-7 text-indigo-400 dark:text-indigo-500" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Enable AI Chat</h3>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
          Add your Google Gemini or OpenAI API key to unlock the AI business assistant. It's free to start.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onGoToSettings}
          className="btn-primary"
        >
          <Settings2 className="h-4 w-4" />
          Configure AI Key
        </button>
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          <ExternalLink className="h-4 w-4" />
          Get Gemini Key (Free)
        </a>
      </div>
      <p className="text-[11px] text-slate-400 dark:text-slate-600">
        Your API key stays in your browser — never shared with QuickBill.
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIInsights({ onGoToSettings }) {
  const { products, bills, refreshProducts, refreshBills } = useApp();
  const aiEnabled = isAiEnabled();

  const goToAiSettings = () => {
    onGoToSettings?.();
  };

  return (
    <div className="space-y-5 animate-fadeIn h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="section-title">AI Assistant</h2>
            {aiEnabled && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                LLM Active
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chat with your store data to get insights, add products, or create bills.
          </p>
        </div>
        <div className="flex gap-2">
          {!aiEnabled && (
            <button onClick={goToAiSettings} className="btn-primary text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Enable AI
            </button>
          )}
        </div>
      </div>

      {/* AI Chat panel */}
      <div className="flex-1">
        {aiEnabled
          ? <AiChatPanel products={products} bills={bills} onGoToSettings={goToAiSettings} refreshProducts={refreshProducts} refreshBills={refreshBills} />
          : <NoKeyCard onGoToSettings={goToAiSettings} />
        }
      </div>
    </div>
  );
}
