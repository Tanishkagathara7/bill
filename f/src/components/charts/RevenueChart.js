import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';

const CustomTooltip = ({ active, payload, label, currency = '₹' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-indigo-600 dark:text-indigo-400 font-semibold">
            {currency}{Number(entry.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data = [], currency = '₹' }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-slate-500 dark:text-slate-400"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-slate-500 dark:text-slate-400"
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${currency}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={50}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
          activeDot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 2, r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
