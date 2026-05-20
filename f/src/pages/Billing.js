import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, X, Check, Package, User, CreditCard, Banknote, Smartphone, FileText, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { billsApi } from '../utils/api';
import { formatCurrency, getSettings, generateInvoiceNumber } from '../utils/settings';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'credit', label: 'Credit', icon: FileText },
];

export default function Billing({ onBillCreated }) {
  const { products, bills, refreshProducts, refreshBills } = useApp();
  const settings = getSettings();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [discount, setDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  
  const uniqueCustomers = useMemo(() => {
    const map = new Map();
    bills.forEach(b => {
      const name = b.customerName?.trim();
      const phone = b.customerPhone?.trim();
      if (name && name !== 'Walk-in Customer') {
        map.set(name, phone || map.get(name) || '');
      }
    });
    return Array.from(map.entries()).map(([name, phone]) => ({ name, phone }));
  }, [bills]);

  const filtered = useMemo(() => {
    let list = products.filter(p => p.units > 0);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') list = list.filter(p => p.category === category);
    return list;
  }, [products, search, category]);

  const addToCart = (product) => {
    const existing = cart.find(i => i.productId === product.id);
    const inCart = existing ? existing.quantity : 0;
    if (inCart >= product.units) return;
    if (existing) {
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice } : i));
    } else {
      setCart([...cart, { productId: product.id, productName: product.name, quantity: 1, unitPrice: Number(product.price), totalPrice: Number(product.price) }]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(cart.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      const product = products.find(p => p.id === productId);
      if (newQty > (product?.units || 0)) return i;
      return { ...i, quantity: newQty, totalPrice: newQty * i.unitPrice };
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => setCart(cart.filter(i => i.productId !== productId));

  const subtotal = cart.reduce((s, i) => s + i.totalPrice, 0);
  const discountAmt = discount ? Math.min(subtotal, Number(discount)) : 0;
  const taxRate = settings.taxRate || 0;
  const taxAmt = ((subtotal - discountAmt) * taxRate) / 100;
  const total = subtotal - discountAmt + taxAmt;

  const handleSubmit = async () => {
    if (cart.length === 0) { setError('Add at least one item to the cart.'); return; }
    setError(''); setSubmitting(true);
    try {
      const billData = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        items: cart.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice })),
        totalAmount: Number(total.toFixed(2)),
        discount: discountAmt,
        tax: taxAmt,
        paymentStatus,
        paymentMethod,
        billNumber: generateInvoiceNumber(settings),
      };
      await billsApi.create(billData);
      await refreshProducts();
      await refreshBills();
      setSuccess(billData);
      setCart([]); setCustomerName(''); setCustomerPhone(''); setDiscount(''); setPaymentMethod('cash'); setPaymentStatus('paid');
      onBillCreated?.();
    } catch (e) { setError(e.message || 'Failed to create bill.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h2 className="section-title">POS Billing</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Select products and complete the sale</p>
      </div>

      {/* Success banner */}
      {success && (() => {
        const phone = success.customerPhone?.replace(/\D/g, '');
        const waMsg = phone
          ? encodeURIComponent(
              `🧾 *${settings.shopName || 'QuickBill'} — Invoice*\n` +
              `Bill No: ${success.billNumber}\n` +
              `Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
              (success.items || []).map(i => `  • ${i.productName} ×${i.quantity} = ${formatCurrency(i.totalPrice)}`).join('\n') +
              `\n\n*Total: ${formatCurrency(success.totalAmount)}*\n` +
              `Payment: ${success.paymentMethod || 'Cash'} (${success.paymentStatus})\n\n` +
              `${settings.invoiceFooter || 'Thank you for shopping with us!'}`
            )
          : null;
        return (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">Bill created successfully!</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{success.billNumber} · {formatCurrency(success.totalAmount)} · {success.customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {waMsg && phone && (
                <a
                  href={`https://wa.me/91${phone}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                  title="Send bill on WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Send on WhatsApp
                </a>
              )}
              <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
        {/* ── Product panel ── */}
        <div className="space-y-4">
          {/* Search + category */}
          <div className="card p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search products..." />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${category === c ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{c}</button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(p => {
              const inCart = cart.find(i => i.productId === p.id);
              const atMax = inCart && inCart.quantity >= p.units;
              return (
                <button
                  key={p.id}
                  onClick={() => !atMax && addToCart(p)}
                  disabled={atMax}
                  className={`card p-3 text-left transition-all duration-150 group ${atMax ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-card-hover active:scale-[0.98]'} ${inCart ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/50 rounded-xl flex items-center justify-center mb-2">
                    <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-1 line-clamp-2">{p.name}</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(p.price)}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-400 dark:text-slate-500">{p.units} left</p>
                    {inCart && <span className="text-[10px] font-bold bg-indigo-600 text-white rounded-full px-1.5 py-0.5">{inCart.quantity}</span>}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <Package className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-slate-500">{search ? 'No products match your search' : 'No products in stock'}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Cart panel ── */}
        <div className="card flex flex-col h-fit sticky top-4">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Cart</h3>
            </div>
            <span className="badge badge-violet">{cart.length} items</span>
          </div>

          {/* Cart items */}
          <div className="flex-1 p-3 space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">Click products to add them</p>
              </div>
            ) : cart.map(item => (
              <div key={item.productId} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.productName}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{formatCurrency(item.unitPrice)} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-slate-100">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><Plus className="h-3 w-3" /></button>
                </div>
                <div className="text-right w-16 flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(item.totalPrice)}</p>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <>
              {/* Totals */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-slate-400 flex-1">Discount (₹)</span>
                  <input type="number" min="0" max={subtotal} value={discount} onChange={e => setDiscount(e.target.value)} className="input w-24 py-1 text-xs" placeholder="0" />
                </div>
                {taxRate > 0 && <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Tax ({taxRate}%)</span><span>{formatCurrency(taxAmt)}</span></div>}
                <div className="flex justify-between font-bold text-base text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total</span><span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    list="existing-customers"
                    value={customerName} 
                    onChange={e => {
                      const val = e.target.value;
                      setCustomerName(val);
                      // Auto-fill phone if matched
                      const matched = uniqueCustomers.find(c => c.name === val);
                      if (matched && matched.phone && !customerPhone) {
                        setCustomerPhone(matched.phone);
                      }
                    }} 
                    className="input pl-8 py-2 text-sm" 
                    placeholder="Customer name (optional)" 
                    autoComplete="off"
                  />
                  <datalist id="existing-customers">
                    {uniqueCustomers.map((c, i) => (
                      <option key={i} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <input value={customerPhone} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) setCustomerPhone(v); }} className="input py-2 text-sm" placeholder="Phone (optional)" maxLength={10} />
              </div>

              {/* Payment method */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map(m => {
                    const Icon = m.icon;
                    return (
                      <button key={m.value} onClick={() => setPaymentMethod(m.value)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-150 ${paymentMethod === m.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
                        <Icon className="h-3.5 w-3.5" />{m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment status */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Payment Status</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['paid', 'Paid', 'bg-emerald-600 border-emerald-600'], ['pending', 'Pending', 'bg-amber-500 border-amber-500'], ['partial', 'Partial', 'bg-blue-600 border-blue-600']].map(([v, l, active]) => (
                    <button key={v} onClick={() => setPaymentStatus(v)} className={`py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${paymentStatus === v ? `${active} text-white` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>{l}</button>
                  ))}
                </div>
              </div>

              {error && <div className="mx-3 mb-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">{error}</div>}

              {/* Confirm button */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <button onClick={handleSubmit} disabled={submitting || cart.length === 0} className="btn-success w-full py-3 text-sm font-semibold">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</> : <><Check className="h-4 w-4" />Confirm Sale · {formatCurrency(total)}</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
