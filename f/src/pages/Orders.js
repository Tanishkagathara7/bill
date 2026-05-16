import React, { useState, useMemo } from 'react';
import { Search, Eye, Trash2, MessageCircle, X, Filter, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { billsApi } from '../utils/mockApi';
import { formatCurrency } from '../utils/settings';

const STATUS_OPTS = ['all', 'paid', 'pending', 'partial'];

const BillDetail = ({ bill, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="card w-full max-w-2xl shadow-xl animate-scaleIn max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{bill.billNumber}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{new Date(bill.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="h-4 w-4" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Customer</p><p className="font-semibold text-slate-900 dark:text-slate-100">{bill.customerName}</p>{bill.customerPhone && <p className="text-slate-400 dark:text-slate-500">{bill.customerPhone}</p>}</div>
          <div><p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Payment</p><p className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{bill.paymentMethod || 'cash'}</p><span className={`badge ${bill.paymentStatus === 'paid' ? 'badge-green' : bill.paymentStatus === 'pending' ? 'badge-yellow' : 'badge-blue'}`}>{bill.paymentStatus}</span></div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Items</p>
          <div className="space-y-2">
            {(bill.items || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm">
                <div><p className="font-medium text-slate-900 dark:text-slate-100">{item.productName}</p><p className="text-xs text-slate-400 dark:text-slate-500">{item.quantity} × {formatCurrency(item.unitPrice)}</p></div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-1 text-sm">
          {bill.discount > 0 && <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Discount</span><span>-{formatCurrency(bill.discount)}</span></div>}
          {bill.tax > 0 && <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Tax</span><span>{formatCurrency(bill.tax)}</span></div>}
          <div className="flex justify-between font-bold text-base text-slate-900 dark:text-slate-100"><span>Total</span><span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(bill.totalAmount)}</span></div>
        </div>
      </div>
    </div>
  </div>
);

export default function Orders({ setActiveTab }) {
  const { bills, refreshBills } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [viewing, setViewing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    let list = [...bills];
    if (search) list = list.filter(b => b.billNumber?.toLowerCase().includes(search.toLowerCase()) || b.customerName?.toLowerCase().includes(search.toLowerCase()) || b.customerPhone?.includes(search));
    if (status !== 'all') list = list.filter(b => b.paymentStatus === status);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bills, search, status]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await billsApi.delete(id); await refreshBills(); }
    catch (e) { alert(e.message); }
    finally { setDeletingId(null); setConfirmDelete(null); }
  };

  const totalRevenue = filtered.reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-title">Orders</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{bills.length} total · {formatCurrency(totalRevenue)} revenue</p>
        </div>
        <button onClick={() => setActiveTab('billing')} className="btn-primary self-start">
          <ShoppingCart className="h-4 w-4" /> New Sale
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search bill number or customer..." />
        </div>
        <div className="flex gap-2">
          <Filter className="h-4 w-4 text-slate-400 self-center" />
          {STATUS_OPTS.map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <ShoppingCart className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 dark:text-slate-500">{search || status !== 'all' ? 'No orders match your filters' : 'No orders yet'}</p>
                  {!search && status === 'all' && <button onClick={() => setActiveTab('billing')} className="btn-primary mt-4 text-xs">Create First Sale</button>}
                </td></tr>
              ) : filtered.map(bill => (
                <tr key={bill.id}>
                  <td>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs">{bill.billNumber}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{(bill.items || []).length} items</p>
                    </div>
                  </td>
                  <td>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{bill.customerName}</p>
                    {bill.customerPhone && <p className="text-xs text-slate-400 dark:text-slate-500">{bill.customerPhone}</p>}
                  </td>
                  <td><span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(bill.totalAmount)}</span></td>
                  <td><span className="badge badge-gray capitalize">{bill.paymentMethod || 'cash'}</span></td>
                  <td>
                    <span className={`badge ${bill.paymentStatus === 'paid' ? 'badge-green' : bill.paymentStatus === 'pending' ? 'badge-yellow' : 'badge-blue'}`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewing(bill)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors" title="View"><Eye className="h-4 w-4" /></button>
                      {bill.customerPhone && (
                        <a href={`https://wa.me/91${bill.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${bill.customerName},\nBill: ${bill.billNumber}\nAmount: ${formatCurrency(bill.totalAmount)}\nStatus: ${bill.paymentStatus}\nThank you!`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors" title="WhatsApp">
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      <button onClick={() => setConfirmDelete(bill)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Showing {filtered.length} orders</span>
            <span>Total: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(totalRevenue)}</strong></span>
          </div>
        )}
      </div>

      {viewing && <BillDetail bill={viewing} onClose={() => setViewing(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm shadow-xl animate-scaleIn p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Order?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Delete <strong>"{confirmDelete.billNumber}"</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={deletingId === confirmDelete.id} className="btn-danger flex-1">
                {deletingId === confirmDelete.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
