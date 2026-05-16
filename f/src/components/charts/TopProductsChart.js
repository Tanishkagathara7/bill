import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-slate-900 dark:text-slate-100 mb-1 max-w-[160px] truncate">{label}</p>
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold">{payload[0].value} units sold</p>
      </div>
    );
  }
  return null;
};

export default function TopProductsChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 40, left: 0 }} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'currentColor' }}
          className="text-slate-500 dark:text-slate-400"
          axisLine={false}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-slate-500 dark:text-slate-400"
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
