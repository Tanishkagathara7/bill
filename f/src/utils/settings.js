// Settings utility — read/write shop configuration from localStorage

const SETTINGS_KEY = 'quickbill_settings';

export const DEFAULT_SETTINGS = {
  shopName: 'QuickBill',
  shopTagline: 'Smart billing for modern stores',
  ownerName: 'Meera',
  taxRate: 18,
  currency: '₹',
  currencyCode: 'INR',
  invoiceFooter: 'Thank you for shopping with QuickBill!',
  invoicePrefix: 'QB',
  lowStockThreshold: 10,
  darkMode: false,
  logo: null,
};

export const getSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveSettings = (updates) => {
  try {
    const current = getSettings();
    const merged = { ...current, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Error saving settings:', e);
    return getSettings();
  }
};

export const formatCurrency = (amount, settings = null) => {
  const s = settings || getSettings();
  const num = Number(amount) || 0;
  return `${s.currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generateInvoiceNumber = (settings = null) => {
  const s = settings || getSettings();
  const prefix = s.invoicePrefix || 'QB';
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${dateStr}-${rand}`;
};
