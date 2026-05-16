import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, X, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { productsApi } from '../utils/mockApi';
import { formatCurrency } from '../utils/settings';

const CATEGORIES = ['All', 'Grains', 'Dairy', 'Beverages', 'Snacks', 'Spices', 'Personal Care', 'Cleaning', 'Stationery', 'Other'];

const EMPTY_FORM = { name: '', category: 'Grains', price: '', units: '', weight: '', unit: 'kg', sku: '' };

const StockBadge = ({ units }) => {
  if (units === 0) return <span className="badge badge-red">Out of Stock</span>;
  if (units < 10) return <span className="badge badge-yellow">Low Stock</span>;
  return <span className="badge badge-green">In Stock</span>;
};

export default function Products() {
  const { products, refreshProducts } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortKey, setSortKey] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') list = list.filter(p => p.category === category);
    list.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb || '').toLowerCase(); }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, search, category, sortKey, sortAsc]);

  const handleSort = (key) => { if (sortKey === key) setSortAsc(!sortAsc); else { setSortKey(key); setSortAsc(true); } };

  const openAdd = () => { setEditingProduct(null); setForm(EMPTY_FORM); setFormErrors({}); setShowForm(true); };
  const openEdit = (p) => { setEditingProduct(p); setForm({ name: p.name, category: p.category || 'Grains', price: p.price, units: p.units, weight: p.weight || '', unit: p.unit || 'kg', sku: p.sku || '' }); setFormErrors({}); setShowForm(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (products.some(p => p.name.toLowerCase() === form.name.trim().toLowerCase() && p.id !== editingProduct?.id)) e.name = 'Product with this name already exists';
    if (!form.price || Number(form.price) <= 0) e.price = 'Valid price required';
    if (form.units === '' || Number(form.units) < 0) e.units = 'Units cannot be negative';
    return e;
  };

  const handleSave = async () => {
    const errors = validate();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setSaving(true);
    try {
      const data = { ...form, price: Number(form.price), units: Number(form.units), weight: Number(form.weight) || 0 };
      if (editingProduct) await productsApi.update(editingProduct.id, data);
      else await productsApi.create(data);
      await refreshProducts();
      setShowForm(false);
    } catch (e) { setFormErrors({ general: e.message }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await productsApi.delete(id); await refreshProducts(); }
    catch (e) { alert(e.message); }
    finally { setDeletingId(null); setConfirmDelete(null); }
  };

  const SortIcon = ({ col }) => sortKey === col
    ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
    : <ChevronUp className="h-3 w-3 opacity-20" />;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-title">Products</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{products.length} total · {products.filter(p => p.units === 0).length} out of stock</p>
        </div>
        <button onClick={openAdd} className="btn-primary self-start">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search products or SKU..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${category === c ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {[['name', 'Product'], ['category', 'Category'], ['price', 'Price'], ['units', 'Stock'], ['', 'Status'], ['', 'Actions']].map(([key, label]) => (
                  <th key={label} className={key ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none' : ''} onClick={key ? () => handleSort(key) : undefined}>
                    <div className="flex items-center gap-1">{label}{key && <SortIcon col={key} />}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <Package className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{search || category !== 'All' ? 'No products match your filters' : 'No products yet'}</p>
                  {!search && category === 'All' && <button onClick={openAdd} className="btn-primary mt-4 text-xs">Add First Product</button>}
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                        {p.sku && <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-violet">{p.category || '—'}</span></td>
                  <td><span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.price)}</span></td>
                  <td>
                    <div className="space-y-1">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{p.units} {p.unit || 'units'}</span>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${p.units === 0 ? 'bg-red-500' : p.units < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (p.units / 50) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td><StockBadge units={p.units} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(p)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filtered.length} of {products.length} products</span>
          <span>{products.filter(p => p.units < 10).length} need attention</span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg shadow-xl animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formErrors.general && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">{formErrors.general}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Product Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`input ${formErrors.name ? 'input-error' : ''}`} placeholder="e.g. Basmati Rice 1kg" />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">SKU (optional)</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="input" placeholder="e.g. RICE-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Price (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={`input ${formErrors.price ? 'input-error' : ''}`} placeholder="0.00" />
                  {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Stock Units *</label>
                  <input type="number" min="0" value={form.units} onChange={e => setForm({ ...form, units: e.target.value })} className={`input ${formErrors.units ? 'input-error' : ''}`} placeholder="0" />
                  {formErrors.units && <p className="text-xs text-red-500 mt-1">{formErrors.units}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Weight</label>
                  <input type="number" min="0" step="0.01" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="input" placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Unit</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="input">
                    {['kg', 'g', 'L', 'mL', 'pcs', 'pack', 'box', 'dozen'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><Check className="h-4 w-4" />{editingProduct ? 'Update' : 'Add Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm shadow-xl animate-scaleIn p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Product?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>? This cannot be undone.</p>
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
