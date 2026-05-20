import React, { useState, useMemo } from 'react';
import { Warehouse, AlertTriangle, Plus, Search, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { productsApi } from '../utils/api';
import { formatCurrency } from '../utils/settings';

export default function Inventory() {
  const { products, refreshProducts } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'low') list = list.filter(p => p.units > 0 && p.units < 10);
    if (filter === 'out') list = list.filter(p => p.units === 0);
    return list.sort((a, b) => a.units - b.units);
  }, [products, search, filter]);

  const handleRestock = async () => {
    const qty = Number(restockQty);
    if (!qty || qty <= 0) return;
    setSaving(true);
    try {
      await productsApi.update(restockModal.id, { ...restockModal, units: restockModal.units + qty });
      await refreshProducts();
      setRestockModal(null); setRestockQty('');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const outOfStock = products.filter(p => p.units === 0);
  const lowStock = products.filter(p => p.units > 0 && p.units < 10);
  const healthy = products.filter(p => p.units >= 10);

  const getStatus = (units) => {
    if (units === 0) return { label: 'Out of Stock', cls: 'badge-red', color: 'bg-red-500' };
    if (units < 10) return { label: 'Low Stock', cls: 'badge-yellow', color: 'bg-amber-500' };
    return { label: 'In Stock', cls: 'badge-green', color: 'bg-emerald-500' };
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="section-title">Inventory</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Monitor stock levels and restock products</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Healthy Stock', count: healthy.length, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' },
          { label: 'Low Stock', count: lowStock.length, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' },
          { label: 'Out of Stock', count: outOfStock.length, color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border ${s.bg}`}>
            <div className={`w-2 h-2 rounded-full ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.count}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {outOfStock.length > 0 && (
        <div className="card p-4 border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h3 className="font-semibold text-sm text-red-900 dark:text-red-300">Out of Stock ({outOfStock.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map(p => (
              <button key={p.id} onClick={() => setRestockModal(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5">
                <Plus className="h-3 w-3" /> {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search products..." />
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['low', 'Low Stock'], ['out', 'Out of Stock']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === val ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Warehouse className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 dark:text-slate-500">No products found</p>
                </td></tr>
              ) : filtered.map(p => {
                const status = getStatus(p.units);
                const maxUnits = 100;
                const pct = Math.min(100, (p.units / maxUnits) * 100);
                return (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{p.unit || 'units'}</p>
                      </div>
                    </td>
                    <td><span className="badge badge-violet">{p.category || '—'}</span></td>
                    <td><span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.price)}</span></td>
                    <td>
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{p.units} units</span>
                          {p.units > 0 && p.units < 10 && <TrendingDown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${status.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                    <td>
                      <button onClick={() => { setRestockModal(p); setRestockQty(''); }} className="btn-secondary text-xs">
                        <Plus className="h-3.5 w-3.5" /> Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm shadow-xl animate-scaleIn">
            <div className="p-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mb-4">
                <Warehouse className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Restock Product</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                <strong>"{restockModal.name}"</strong> currently has <strong>{restockModal.units}</strong> units.
              </p>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Units to Add</label>
              <input
                type="number" min="1"
                value={restockQty}
                onChange={e => setRestockQty(e.target.value)}
                className="input mb-2"
                placeholder="e.g. 50"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleRestock()}
              />
              {restockQty && Number(restockQty) > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">
                  New total: {restockModal.units + Number(restockQty)} units
                </p>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setRestockModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleRestock} disabled={saving || !restockQty || Number(restockQty) <= 0} className="btn-primary flex-1">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
