import React, { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  IndianRupee, AlertTriangle, ArrowRight, Plus,
  Sparkles, RefreshCw, Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import RevenueChart from '../components/charts/RevenueChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { generateInsights, generateDailySummary } from '../utils/aiEngine';
import { formatCurrency } from '../utils/settings';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getLast7Days = (bills) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    return {
      label: i === 6 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      revenue: bills.filter(b => { const bd = new Date(b.createdAt); return bd >= d && bd < next; })
        .reduce((s, b) => s + (b.totalAmount || 0), 0),
    };
  });
};

const getTopProducts = (bills, products) => {
  const map = {};
  bills.forEach(b => (b.items || []).forEach(i => { map[i.productId] = (map[i.productId] || 0) + i.quantity; }));
  return Object.entries(map)
    .map(([id, qty]) => ({ name: (products.find(p => p.id === id)?.name || 'Unknown').substring(0, 14), quantity: qty }))
    .sort((a, b) => b.quantity - a.quantity).slice(0, 5);
};

const getCategoryData = (bills, products) => {
  const map = {};
  bills.forEach(b => (b.items || []).forEach(i => {
    const cat = products.find(p => p.id === i.productId)?.category || 'Other';
    map[cat] = (map[cat] || 0) + i.totalPrice;
  }));
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

const KpiCard = ({ title, value, subtitle, icon: Icon, color, onClick, trend, trendLabel }) => (
  <div className="kpi-card" onClick={onClick}>
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      {trend && (
        <span className={`badge ${trend === 'up' ? 'badge-green' : trend === 'down' ? 'badge-red' : 'badge-gray'}`}>
          {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trendLabel}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">{value}</p>
    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
    {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
  </div>
);

export default function Dashboard({ setActiveTab }) {
  const { products, bills, currentUser } = useApp();

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const yesterday = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() - 1); return d; }, [today]);

  const todayBills = bills.filter(b => new Date(b.createdAt) >= today);
  const yestBills = bills.filter(b => { const d = new Date(b.createdAt); return d >= yesterday && d < today; });
  const todayRevenue = todayBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const yestRevenue = yestBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const revPct = yestRevenue > 0 ? (((todayRevenue - yestRevenue) / yestRevenue) * 100).toFixed(1) : null;

  const monthStart = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }, []);
  const monthRevenue = bills.filter(b => new Date(b.createdAt) >= monthStart).reduce((s, b) => s + (b.totalAmount || 0), 0);

  const lowStock = products.filter(p => p.units > 0 && p.units < 10).length;
  const outOfStock = products.filter(p => p.units === 0).length;

  const chartData = useMemo(() => getLast7Days(bills), [bills]);
  const topProducts = useMemo(() => getTopProducts(bills, products), [bills, products]);
  const categoryData = useMemo(() => getCategoryData(bills, products), [bills, products]);
  const recentBills = useMemo(() => [...bills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5), [bills]);
  const insights = useMemo(() => generateInsights(products, bills).slice(0, 3), [products, bills]);
  const aiSummary = useMemo(() => generateDailySummary(products, bills, currentUser?.name?.split(' ')[0] || 'Meera'), [products, bills, currentUser]);

  const firstName = currentUser?.name?.split(' ')[0] || 'Meera';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 sm:p-8 text-white shadow-glow">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-500/20 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium">{getGreeting()},</p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-0.5">{firstName} 👋</h2>
            <p className="text-indigo-200 mt-2 text-sm leading-relaxed max-w-lg">{aiSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button onClick={() => setActiveTab('billing')} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm">
              <Plus className="h-4 w-4" /> New Sale
            </button>
            <button onClick={() => setActiveTab('reports')} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors">
              <Eye className="h-4 w-4" /> Reports
            </button>
          </div>
        </div>
        <div className="relative z-10 mt-5 flex flex-wrap gap-3">
          {[
            { label: "Today's Revenue", value: formatCurrency(todayRevenue), sub: revPct ? `${revPct >= 0 ? '+' : ''}${revPct}% vs yesterday` : 'vs yesterday' },
            { label: "Today's Orders", value: todayBills.length, sub: 'bills created' },
            { label: 'This Month', value: formatCurrency(monthRevenue), sub: 'total revenue' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-indigo-200 text-xs font-medium">{s.label}</p>
              <p className="text-xl font-bold mt-0.5">{s.value}</p>
              <p className="text-xs text-indigo-200 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Products" value={products.length} subtitle={`${lowStock} low · ${outOfStock} out`} icon={Package} color="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400" onClick={() => setActiveTab('products')} />
        <KpiCard title="All Orders" value={bills.length} subtitle="all time" icon={ShoppingCart} color="bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400" trend={todayBills.length > 0 ? 'up' : undefined} trendLabel={todayBills.length > 0 ? `+${todayBills.length} today` : undefined} onClick={() => setActiveTab('orders')} />
        <KpiCard title="Monthly Revenue" value={formatCurrency(monthRevenue)} subtitle="current month" icon={IndianRupee} color="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" onClick={() => setActiveTab('reports')} />
        <KpiCard title="Stock Alerts" value={outOfStock + lowStock} subtitle={`${outOfStock} out of stock`} icon={AlertTriangle} color={outOfStock > 0 ? 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'} onClick={() => setActiveTab('inventory')} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Revenue (Last 7 Days)</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Daily sales trend</p>
          {chartData.some(d => d.revenue > 0)
            ? <RevenueChart data={chartData} />
            : <div className="h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">Create your first bill to see the chart</div>}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Revenue by Category</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">All-time breakdown</p>
          {categoryData.length > 0
            ? <CategoryPieChart data={categoryData} />
            : <div className="h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500 text-center">No category data yet</div>}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Top Products</h3>
            <button onClick={() => setActiveTab('reports')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">All <ArrowRight className="h-3 w-3" /></button>
          </div>
          {topProducts.length > 0
            ? <TopProductsChart data={topProducts} />
            : <div className="h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">No sales yet</div>}
        </div>

        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Orders</h3>
            <button onClick={() => setActiveTab('orders')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">All <ArrowRight className="h-3 w-3" /></button>
          </div>
          {recentBills.length > 0 ? (
            <div className="space-y-0.5">
              {recentBills.map(bill => (
                <div key={bill.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{bill.customerName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{bill.billNumber}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(bill.totalAmount)}</p>
                    <span className={`badge text-[10px] ${bill.paymentStatus === 'paid' ? 'badge-green' : bill.paymentStatus === 'pending' ? 'badge-yellow' : 'badge-blue'}`}>{bill.paymentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center">No orders yet</p>
              <button onClick={() => setActiveTab('billing')} className="btn-primary text-xs">New Sale</button>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Insights</h3>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setRefreshKey(k => k + 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
              <button onClick={() => setActiveTab('ai-insights')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">All <ArrowRight className="h-3 w-3" /></button>
            </div>
          </div>
          <div className="space-y-3">
            {insights.length > 0 ? insights.map(ins => (
              <div key={ins.id} className={`p-3 rounded-xl text-sm border ${ins.type === 'critical' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50' : ins.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' : ins.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                <p className="font-medium text-slate-900 dark:text-slate-100 mb-0.5">{ins.icon} {ins.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{ins.message}</p>
              </div>
            )) : (
              <div className="py-6 text-center">
                <Sparkles className="h-7 w-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">Add products and create orders to generate insights</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low-stock alert */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className={`rounded-2xl p-4 flex items-center justify-between gap-4 ${outOfStock > 0 ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50'}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${outOfStock > 0 ? 'text-red-500' : 'text-amber-500'}`} />
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {outOfStock > 0 ? `${outOfStock} product${outOfStock !== 1 ? 's' : ''} out of stock` : `${lowStock} product${lowStock !== 1 ? 's' : ''} running low`}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Visit Inventory to restock</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('inventory')} className="btn-secondary text-xs flex-shrink-0">View Inventory <ArrowRight className="h-3 w-3" /></button>
        </div>
      )}
    </div>
  );
}
