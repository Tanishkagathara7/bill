import React, { useState, useMemo } from 'react';
import { BarChart2, Download, Calendar, TrendingUp, ShoppingCart, IndianRupee, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RevenueChart from '../components/charts/RevenueChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { formatCurrency } from '../utils/settings';

const RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: 'All Time', days: 36500 },
];

export default function Reports() {
  const { bills, products } = useApp();
  const [range, setRange] = useState(30);

  const cutoff = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - range); d.setHours(0, 0, 0, 0); return d; }, [range]);
  const periodBills = useMemo(() => bills.filter(b => new Date(b.createdAt) >= cutoff), [bills, cutoff]);

  const totalRevenue = periodBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const avgOrder = periodBills.length > 0 ? totalRevenue / periodBills.length : 0;
  const paidBills = periodBills.filter(b => b.paymentStatus === 'paid').length;

  // Chart data
  const chartData = useMemo(() => {
    const buckets = range <= 7 ? 7 : range <= 30 ? 30 : range <= 90 ? 12 : 12;
    const data = [];
    for (let i = buckets - 1; i >= 0; i--) {
      const d = new Date();
      if (range <= 30) {
        d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const next = new Date(d); next.setDate(d.getDate() + 1);
        const revenue = periodBills.filter(b => { const bd = new Date(b.createdAt); return bd >= d && bd < next; }).reduce((s, b) => s + (b.totalAmount || 0), 0);
        data.push({ label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue });
      } else {
        d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0, 0, 0, 0);
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const revenue = bills.filter(b => { const bd = new Date(b.createdAt); return bd >= d && bd < next; }).reduce((s, b) => s + (b.totalAmount || 0), 0);
        data.push({ label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), revenue });
      }
    }
    return data;
  }, [bills, periodBills, range]);

  const topProducts = useMemo(() => {
    const map = {};
    periodBills.forEach(b => (b.items || []).forEach(i => { map[i.productId] = (map[i.productId] || 0) + i.quantity; }));
    return Object.entries(map)
      .map(([id, qty]) => ({ name: (products.find(p => p.id === id)?.name || 'Unknown').substring(0, 14), quantity: qty }))
      .sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [periodBills, products]);

  const categoryData = useMemo(() => {
    const map = {};
    periodBills.forEach(b => (b.items || []).forEach(i => {
      const cat = products.find(p => p.id === i.productId)?.category || 'Other';
      map[cat] = (map[cat] || 0) + i.totalPrice;
    }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [periodBills, products]);

  const exportCSV = () => {
    const header = ['Bill Number', 'Customer', 'Phone', 'Amount', 'Payment Method', 'Status', 'Date'];
    const rows = periodBills.map(b => [b.billNumber, b.customerName, b.customerPhone || '', b.totalAmount, b.paymentMethod || 'cash', b.paymentStatus, new Date(b.createdAt).toLocaleDateString('en-IN')]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = `quickbill-report-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400' },
    { label: 'Total Orders', value: periodBills.length, icon: ShoppingCart, color: 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' },
    { label: 'Avg. Order Value', value: formatCurrency(avgOrder), icon: TrendingUp, color: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' },
    { label: 'Paid Orders', value: `${paidBills} / ${periodBills.length}`, icon: Package, color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-title">Reports</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Business analytics and performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Range selector */}
      <div className="card p-4 flex items-center gap-3">
        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRange(r.days)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${range === r.days ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{r.label}</button>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{periodBills.length} orders in period</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="kpi-card">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-0.5">{s.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Revenue Trend</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Over the selected period</p>
        {chartData.some(d => d.revenue > 0)
          ? <RevenueChart data={chartData} />
          : <div className="h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">No data in this period</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Top Products</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">By units sold</p>
          {topProducts.length > 0 ? <TopProductsChart data={topProducts} /> : <div className="h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">No data</div>}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Category Breakdown</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Revenue share by category</p>
          {categoryData.length > 0 ? <CategoryPieChart data={categoryData} /> : <div className="h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">No data</div>}
        </div>
      </div>

      {/* Top products table */}
      {topProducts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Product Performance</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {(() => {
                const map = {};
                periodBills.forEach(b => (b.items || []).forEach(i => { map[i.productId] = { qty: (map[i.productId]?.qty || 0) + i.quantity, rev: (map[i.productId]?.rev || 0) + i.totalPrice, name: i.productName }; }));
                return Object.entries(map).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10).map(([id, v], idx) => (
                  <tr key={id}>
                    <td><span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-6 text-center block">{idx + 1}</span></td>
                    <td><p className="font-medium text-slate-900 dark:text-slate-100">{v.name}</p></td>
                    <td><span className="font-semibold text-slate-900 dark:text-slate-100">{v.qty}</span></td>
                    <td><span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(v.rev)}</span></td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
