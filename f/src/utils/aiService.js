/**
 * aiService.js — LLM integration for QuickBill AI Insights
 *
 * Supports:
 *   - Google Gemini (gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash)  ← free tier available
 *   - OpenAI (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)
 *
 * Key is stored in localStorage under 'quickbill_ai_config'.
 * No key is ever sent to any QuickBill server — requests go directly
 * from the browser to the respective LLM provider.
 */

const AI_CONFIG_KEY = 'quickbill_ai_config';

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  GROQ: 'groq',
  OLLAMA: 'ollama',
  OPENROUTER: 'openrouter',
};

export const AI_MODELS = {
  gemini: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended · Free)' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Free tier)' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Affordable)' },
    { id: 'gpt-4o', label: 'GPT-4o (Best quality)' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Ultra-fast · Free)' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast · Free)' },
  ],
  ollama: [
    { id: 'llama3', label: 'Llama 3 (Local)' },
    { id: 'phi3', label: 'Phi-3 (Local/Fast)' },
    { id: 'mistral', label: 'Mistral (Local)' },
  ],
  openrouter: [
    { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)' },
    { id: 'deepseek/deepseek-v4-flash:free', label: 'DeepSeek v4 Flash (Free)' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (Free)' },
  ],
};

// ── Config helpers ────────────────────────────────────────────────────────────
export const getAiConfig = () => {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    return raw
      ? JSON.parse(raw)
      : { provider: AI_PROVIDERS.GEMINI, model: 'gemini-2.0-flash', apiKey: '' };
  } catch {
    return { provider: AI_PROVIDERS.GEMINI, model: 'gemini-2.0-flash', apiKey: '' };
  }
};

export const saveAiConfig = (config) => {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
};

export const isAiEnabled = () => {
  const { provider, apiKey } = getAiConfig();
  if (provider === AI_PROVIDERS.OLLAMA) return true; // Ollama doesn't require an API key
  return !!(apiKey && apiKey.trim().length > 8);
};

// ── Build a compact data context string ──────────────────────────────────────
export const buildDataContext = (products = [], bills = []) => {
  const now = new Date();
  const cutoff7 = new Date(now); cutoff7.setDate(now.getDate() - 7);
  const cutoff30 = new Date(now); cutoff30.setDate(now.getDate() - 30);

  const recentBills = bills.filter(b => new Date(b.createdAt) >= cutoff7);
  const monthBills = bills.filter(b => new Date(b.createdAt) >= cutoff30);

  const weekRevenue = recentBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const monthRevenue = monthBills.reduce((s, b) => s + (b.totalAmount || 0), 0);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayBills = bills.filter(b => new Date(b.createdAt) >= today);
  const todayRevenue = todayBills.reduce((s, b) => s + (b.totalAmount || 0), 0);

  // Product sales summary
  const salesMap = {};
  recentBills.forEach(bill => {
    (bill.items || []).forEach(item => {
      if (!salesMap[item.productName]) salesMap[item.productName] = 0;
      salesMap[item.productName] += item.quantity;
    });
  });
  const topProducts = Object.entries(salesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `${name}: ${qty} units`)
    .join(', ');

  const lowStock = products.filter(p => p.units > 0 && p.units < 10).map(p => `${p.name}(${p.units})`).join(', ');
  const outOfStock = products.filter(p => p.units === 0).map(p => p.name).join(', ');

  return `
STORE DATA CONTEXT (as of ${now.toLocaleDateString('en-IN')}):
- Total products in catalogue: ${products.length}
- Today's orders: ${todayBills.length} | Today's revenue: ₹${todayRevenue.toFixed(0)}
- This week (7d) orders: ${recentBills.length} | Revenue: ₹${weekRevenue.toFixed(0)}
- This month (30d) orders: ${monthBills.length} | Revenue: ₹${monthRevenue.toFixed(0)}
- All-time orders: ${bills.length}
- Top-selling products this week: ${topProducts || 'No sales yet'}
- Low stock items (< 10 units): ${lowStock || 'None'}
- Out-of-stock items: ${outOfStock || 'None'}
- Pending invoices: ${bills.filter(b => b.paymentStatus === 'pending').length}

AVAILABLE PRODUCTS (JSON):
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.units }))) /* Keep it compact */}
`.trim();
};

const SYSTEM_PROMPT = `You are QuickBill AI — an expert retail business analyst and active agent embedded in a POS system for an Indian retail shop.

Your role:
- Analyse real-time store data provided to you and give actionable, concise advice
- Answer owner questions about sales, inventory, products, and business strategy
- Respond in a friendly, professional tone — like a trusted business consultant
- Keep answers focused and practical (2-5 sentences unless asked for detail)
- Always reference actual numbers from the context when available
- Use ₹ for amounts, not $

ACTION COMMANDS:
If the user explicitly asks you to DO something (like add a product, create a bill, update stock), you MUST output a JSON block at the VERY END of your response.
The UI will intercept this JSON and execute it.
Do NOT output the JSON block if they are just asking a question.

Available Actions:
1. CREATE_BILL
Use when user says "sell 2 milks", "create a bill for apple".
Match the product names closely to the AVAILABLE PRODUCTS list.
JSON Format:
\`\`\`json
{
  "action": "CREATE_BILL",
  "payload": {
    "customerName": "Walk-in",
    "items": [{"productId": "1", "quantity": 2, "price": 50, "productName": "Milk"}]
  }
}
\`\`\`

2. ADD_PRODUCT
Use when user says "add a new product milk for 50".
JSON Format:
\`\`\`json
{
  "action": "ADD_PRODUCT",
  "payload": { "name": "Milk", "price": 50, "units": 10, "category": "General" }
}
\`\`\`

3. UPDATE_STOCK
Use when user says "add 10 units to milk", "milk is out of stock set it to 0".
JSON Format:
\`\`\`json
{
  "action": "UPDATE_STOCK",
  "payload": { "productId": "1", "units": 20 }
}
\`\`\`

IMPORTANT: You have access to the store's live data in every message. Use the exact product IDs and names from the AVAILABLE PRODUCTS list for your JSON payloads.`;

// ── Gemini API call ───────────────────────────────────────────────────────────
async function callGemini(apiKey, model, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('You have exceeded your Gemini API rate limit or quota. Please try again later or check your API usage.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

// ── OpenAI-Compatible API call (OpenAI, Groq, Ollama) ────────────────────────
async function callOpenAiCompatible(url, apiKey, model, messages, providerName) {
  const body = {
    model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_tokens: 1024,
  };

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(`You have exceeded your ${providerName} rate limit or quota. Please check your account.`);
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `${providerName} API error ${res.status}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'No response generated.';
}

// ── Main public API ───────────────────────────────────────────────────────────
/**
 * Send a chat message to the configured LLM.
 * @param {Array} history - Array of {role, content} messages (prior turns)
 * @param {string} userMessage - The new user message
 * @param {string} dataContext - buildDataContext() output injected into first message
 * @returns {Promise<string>} - AI response text
 */
export const sendAiMessage = async (history, userMessage, dataContext) => {
  const { provider, model, apiKey } = getAiConfig();

  if (!apiKey?.trim()) throw new Error('No API key configured. Go to Settings → AI to add your key.');

  // Prepend data context to the first user message in the conversation
  const messagesWithContext = [
    ...(history.length === 0
      ? [{ role: 'user', content: `${dataContext}\n\n---\n\n${userMessage}` }]
      : [
          { role: 'user', content: `${dataContext}\n\n---\n\n${history[0]?.content || userMessage}` },
          ...history.slice(1),
          { role: 'user', content: userMessage },
        ]),
  ];

  if (history.length > 0) {
    // For subsequent turns just append context refresh at start
    const msgs = [
      { role: 'user', content: `[Store data refreshed: ${dataContext.split('\n')[1]}]\n\n${userMessage}` },
    ];
    const fullHistory = history.map(m => ({ role: m.role, content: m.content }));

    const allMsgs = [...fullHistory, ...msgs];

    if (provider === AI_PROVIDERS.OPENAI) return callOpenAiCompatible('https://api.openai.com/v1/chat/completions', apiKey, model, allMsgs, 'OpenAI');
    if (provider === AI_PROVIDERS.GROQ) return callOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', apiKey, model, allMsgs, 'Groq');
    if (provider === AI_PROVIDERS.OPENROUTER) return callOpenAiCompatible('https://openrouter.ai/api/v1/chat/completions', apiKey, model, allMsgs, 'OpenRouter');
    if (provider === AI_PROVIDERS.OLLAMA) return callOpenAiCompatible('http://localhost:11434/v1/chat/completions', '', model, allMsgs, 'Ollama');
    return callGemini(apiKey, model, allMsgs);
  }

  if (provider === AI_PROVIDERS.OPENAI) return callOpenAiCompatible('https://api.openai.com/v1/chat/completions', apiKey, model, messagesWithContext, 'OpenAI');
  if (provider === AI_PROVIDERS.GROQ) return callOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', apiKey, model, messagesWithContext, 'Groq');
  if (provider === AI_PROVIDERS.OPENROUTER) return callOpenAiCompatible('https://openrouter.ai/api/v1/chat/completions', apiKey, model, messagesWithContext, 'OpenRouter');
  if (provider === AI_PROVIDERS.OLLAMA) return callOpenAiCompatible('http://localhost:11434/v1/chat/completions', '', model, messagesWithContext, 'Ollama');
  return callGemini(apiKey, model, messagesWithContext);
};

/**
 * Quick one-shot analysis call — generates a full AI business summary.
 */
export const generateAiSummary = async (products, bills) => {
  const { provider, model, apiKey } = getAiConfig();
  if (!apiKey?.trim()) return null;

  const ctx = buildDataContext(products, bills);
  const prompt = `${ctx}\n\nWrite a 2-3 sentence executive summary of this store's current performance. Highlight the most important insight or action the owner should take today.`;

  const msgs = [{ role: 'user', content: prompt }];
  try {
    if (provider === AI_PROVIDERS.OPENAI) return await callOpenAiCompatible('https://api.openai.com/v1/chat/completions', apiKey, model, msgs, 'OpenAI');
    if (provider === AI_PROVIDERS.GROQ) return await callOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', apiKey, model, msgs, 'Groq');
    if (provider === AI_PROVIDERS.OPENROUTER) return await callOpenAiCompatible('https://openrouter.ai/api/v1/chat/completions', apiKey, model, msgs, 'OpenRouter');
    if (provider === AI_PROVIDERS.OLLAMA) return await callOpenAiCompatible('http://localhost:11434/v1/chat/completions', '', model, msgs, 'Ollama');
    return await callGemini(apiKey, model, msgs);
  } catch (e) {
    return null;
  }
};
