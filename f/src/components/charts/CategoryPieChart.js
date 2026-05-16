import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const CustomTooltip = ({ active, payload, currency = '₹' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-slate-900 dark:text-slate-100">{payload[0].name}</p>
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
          {currency}{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
        <p className="text-slate-400 text-xs">{payload[0].payload.percentage}% of revenue</p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
  if (percentage < 5) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${percentage}%`}
    </text>
  );
};

export default function CategoryPieChart({ data = [], currency = '₹' }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.map(d => ({
    ...d,
    percentage: total > 0 ? Math.round((d.value / total) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={enriched}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
        >
          {enriched.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span className="text-xs text-slate-600 dark:text-slate-400">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
