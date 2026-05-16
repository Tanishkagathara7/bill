import React, { useState } from 'react';
import { Save, Zap, CheckCircle, Users, Sparkles, Eye, EyeOff, ExternalLink, Key } from 'lucide-react';
import { getSettings, saveSettings } from '../utils/settings';
import { getAiConfig, saveAiConfig, AI_PROVIDERS, AI_MODELS, sendAiMessage } from '../utils/aiService';
import { useApp } from '../context/AppContext';
import { getOwnerStaff, USER_ROLES } from '../utils/userManager';

export default function Settings() {
  const { currentUser, refreshSettings } = useApp();
  const [settings, setSettingsState] = useState(getSettings());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('store');
  const [aiConfig, setAiConfig] = useState(getAiConfig());
  const [showKey, setShowKey] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);

  const users = currentUser?.role === USER_ROLES.OWNER ? getOwnerStaff(currentUser.id) : [];

  const update = (key, value) => setSettingsState(s => ({ ...s, [key]: value }));

  const handleSave = () => {
    saveSettings(settings);
    refreshSettings?.();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const TABS = [
    { id: 'store', label: 'Store' },
    { id: 'billing', label: 'Billing' },
    ...(currentUser?.role === USER_ROLES.OWNER ? [
      { id: 'ai', label: '✨ AI' },
      { id: 'staff', label: 'Staff' },
    ] : []),
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="space-y-5 animate-fadeIn max-w-2xl">
      <div>
        <h2 className="section-title">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configure your QuickBill store</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>{t.label}</button>
        ))}
      </div>

      {/* Store tab */}
      {activeTab === 'store' && (
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shop Name</label>
            <input value={settings.shopName} onChange={e => update('shopName', e.target.value)} className="input" placeholder="QuickBill" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shop Tagline</label>
            <input value={settings.shopTagline} onChange={e => update('shopTagline', e.target.value)} className="input" placeholder="Smart billing for modern stores" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Owner Name</label>
            <input value={settings.ownerName} onChange={e => update('ownerName', e.target.value)} className="input" placeholder="Meera" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency Symbol</label>
            <div className="grid grid-cols-4 gap-2">
              {['₹', '$', '€', '£'].map(c => (
                <button key={c} onClick={() => update('currency', c)} className={`py-2 rounded-xl border text-lg font-semibold transition-all ${settings.currency === c ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Low Stock Threshold</label>
            <input type="number" min="1" value={settings.lowStockThreshold} onChange={e => update('lowStockThreshold', Number(e.target.value))} className="input" placeholder="10" />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Products with fewer units than this will show a low stock warning</p>
          </div>
        </div>
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tax Rate (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={settings.taxRate} onChange={e => update('taxRate', Number(e.target.value))} className="input" />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Applied automatically in POS billing. Set to <strong>0</strong> to disable. <span className="text-amber-500 dark:text-amber-400">18% is standard Indian GST for most goods.</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Invoice Number Prefix</label>
            <input value={settings.invoicePrefix} onChange={e => update('invoicePrefix', e.target.value.toUpperCase())} className="input font-mono" placeholder="QB" maxLength={5} />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Example: QB-20260516-1234</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Invoice Footer Message</label>
            <textarea value={settings.invoiceFooter} onChange={e => update('invoiceFooter', e.target.value)} className="input resize-none h-20" placeholder="Thank you for shopping with QuickBill!" />
          </div>
        </div>
      )}

      {/* AI tab */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          {/* Provider */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Configuration</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">
              Your API key is stored only in this browser and sent directly to the AI provider. QuickBill never sees it.
            </p>

            {/* Provider selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AI Provider</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: AI_PROVIDERS.GEMINI, label: 'Google Gemini', sub: 'Free tier available', href: 'https://aistudio.google.com/apikey' },
                  { id: AI_PROVIDERS.OPENAI, label: 'OpenAI', sub: 'GPT-4o / 3.5 Turbo', href: 'https://platform.openai.com/api-keys' },
                  { id: AI_PROVIDERS.OPENROUTER, label: 'OpenRouter', sub: 'Access free models', href: 'https://openrouter.ai/keys' },
                  { id: AI_PROVIDERS.GROQ, label: 'Groq', sub: 'Ultra-fast • Free', href: 'https://console.groq.com/keys' },
                  { id: AI_PROVIDERS.OLLAMA, label: 'Ollama (Local)', sub: '100% Free • Offline', href: 'https://ollama.com' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setAiConfig(c => ({ ...c, provider: p.id, model: AI_MODELS[p.id][0].id }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      aiConfig.provider === p.id
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{p.label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Model picker */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Model</label>
              <select
                value={aiConfig.model}
                onChange={e => setAiConfig(c => ({ ...c, model: e.target.value }))}
                className="input"
              >
                {(AI_MODELS[aiConfig.provider] || []).map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* API Key */}
            {aiConfig.provider !== AI_PROVIDERS.OLLAMA ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    API Key
                  </label>
                  <a
                    href={
                      aiConfig.provider === AI_PROVIDERS.GEMINI ? 'https://aistudio.google.com/apikey' : 
                      aiConfig.provider === AI_PROVIDERS.GROQ ? 'https://console.groq.com/keys' : 
                      aiConfig.provider === AI_PROVIDERS.OPENROUTER ? 'https://openrouter.ai/keys' : 
                      'https://platform.openai.com/api-keys'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Get API key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={aiConfig.apiKey}
                    onChange={e => setAiConfig(c => ({ ...c, apiKey: e.target.value }))}
                    placeholder={
                      aiConfig.provider === AI_PROVIDERS.GEMINI ? 'AIzaSy...' : 
                      aiConfig.provider === AI_PROVIDERS.GROQ ? 'gsk_...' : 
                      aiConfig.provider === AI_PROVIDERS.OPENROUTER ? 'sk-or-v1-...' : 
                      'sk-...'
                    }
                    className="input pl-10 pr-10 font-mono text-sm"
                    autoComplete="off"
                  />
                  <button
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Stored in your browser only. Never shared with QuickBill.
                </p>
              </div>
            ) : (
              <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Running Locally</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ensure Ollama is running on your computer. Make sure you have downloaded the selected model by running <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">ollama run {aiConfig.model}</code> in your terminal. No API key is required.
                </p>
              </div>
            )}

            {/* Test connection */}
            {aiTestResult && (
              <div className={`rounded-xl p-3 text-sm ${
                aiTestResult.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}>
                {aiTestResult.ok ? '✅ ' : '❌ '}{aiTestResult.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  saveAiConfig(aiConfig);
                  setAiTesting(true);
                  setAiTestResult(null);
                  try {
                    const reply = await sendAiMessage([], 'Reply with exactly: "QuickBill AI connected!"', 'Test connection.');
                    setAiTestResult({ ok: true, message: reply.slice(0, 80) });
                  } catch (e) {
                    setAiTestResult({ ok: false, message: e.message });
                  } finally {
                    setAiTesting(false);
                  }
                }}
                disabled={aiTesting || !aiConfig.apiKey}
                className="btn-secondary"
              >
                {aiTesting ? <><div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />Testing...</> : 'Test Connection'}
              </button>
              <button
                onClick={() => { saveAiConfig(aiConfig); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className="btn-primary"
              >
                {saved ? <><CheckCircle className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save AI Settings</>}
              </button>
            </div>
          </div>

          {/* Status card */}
          <div className="card p-4 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              aiConfig.apiKey ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-slate-300 dark:bg-slate-600'
            }`} />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {aiConfig.apiKey
                ? `AI active · ${aiConfig.provider === AI_PROVIDERS.GEMINI ? 'Google Gemini' : 'OpenAI'} · ${aiConfig.model}`
                : 'AI not configured — add an API key above to enable the AI chat in AI Insights.'}
            </p>
          </div>
        </div>
      )}

      {/* Staff tab */}
      {activeTab === 'staff' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Staff Members</h3>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No staff members yet</p>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{(u.name || 'U').charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{u.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                  </div>
                  <span className={`badge ${u.role === USER_ROLES.OWNER ? 'badge-violet' : 'badge-green'}`}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* About tab */}
      {activeTab === 'about' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-glow">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">QuickBill</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Version 2.0 · Smart POS</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            QuickBill is a production-grade Point of Sale system designed for Indian retail businesses. Manage inventory, create bills, track customers, and grow your business — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[['Role', currentUser?.role], ['Email', currentUser?.email], ['Data Storage', 'Local (Offline Ready)'], ['Currency', settings.currency]].map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-slate-400 dark:text-slate-500 mb-0.5">{k}</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      {activeTab !== 'staff' && activeTab !== 'about' && activeTab !== 'ai' && (
        <button onClick={handleSave} className="btn-primary">
          {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Settings</>}
        </button>
      )}
    </div>
  );
}
