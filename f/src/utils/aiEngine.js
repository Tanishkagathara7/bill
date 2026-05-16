// AI Insights Engine — rule-based natural language business analysis
// Generates actionable insights from products and bills data

/**
 * Calculate daily sales velocity for a product
 */
const getSalesVelocity = (productId, bills, days = 7) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  let totalSold = 0;
  bills.filter(b => new Date(b.createdAt) >= cutoff).forEach(bill => {
    (bill.items || []).forEach(item => {
      if (item.productId === productId) totalSold += item.quantity;
    });
  });
  return totalSold / days; // units per day
};

/**
 * Get revenue for a date range
 */
const getRevenue = (bills, startDate, endDate) => {
  return bills
    .filter(b => {
      const d = new Date(b.createdAt);
      return d >= startDate && d <= endDate;
    })
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
};

/**
 * Get best-selling products by quantity sold
 */
const getBestSellers = (bills, products, days = 7) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const salesMap = {};
  bills.filter(b => new Date(b.createdAt) >= cutoff).forEach(bill => {
    (bill.items || []).forEach(item => {
      salesMap[item.productId] = (salesMap[item.productId] || 0) + item.quantity;
    });
  });
  return Object.entries(salesMap)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
    .filter(x => x.product)
    .sort((a, b) => b.qty - a.qty);
};

/**
 * Main function — generate all insights
 */
export const generateInsights = (products = [], bills = []) => {
  const insights = [];
  const now = new Date();

  // ── Revenue comparison (this week vs last week) ──
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(now); lastWeekStart.setDate(now.getDate() - 14);
  const lastWeekEnd = new Date(now); lastWeekEnd.setDate(now.getDate() - 7);

  const thisWeekRevenue = getRevenue(bills, thisWeekStart, now);
  const lastWeekRevenue = getRevenue(bills, lastWeekStart, lastWeekEnd);

  if (lastWeekRevenue > 0 && thisWeekRevenue > 0) {
    const change = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1);
    const trend = change >= 0 ? 'up' : 'down';
    insights.push({
      id: 'revenue-trend',
      type: trend === 'up' ? 'positive' : 'warning',
      icon: trend === 'up' ? '📈' : '📉',
      title: 'Weekly Revenue Trend',
      message: `Revenue is ${trend === 'up' ? 'up' : 'down'} ${Math.abs(change)}% this week (₹${thisWeekRevenue.toFixed(0)}) compared to last week (₹${lastWeekRevenue.toFixed(0)}).`,
      priority: 1,
    });
  }

  // ── Best sellers ──
  const bestSellers = getBestSellers(bills, products, 7);
  if (bestSellers.length > 0) {
    const top = bestSellers[0];
    insights.push({
      id: 'best-seller',
      type: 'info',
      icon: '🏆',
      title: 'Top Seller This Week',
      message: `"${top.product.name}" is your best-selling product this week with ${top.qty} units sold.`,
      priority: 2,
    });
    if (bestSellers.length > 1) {
      const names = bestSellers.slice(0, 3).map(x => x.product.name).join(', ');
      insights.push({
        id: 'top-3',
        type: 'info',
        icon: '⭐',
        title: 'Top 3 Products',
        message: `Your top performers this week: ${names}. Consider keeping these well-stocked.`,
        priority: 5,
      });
    }
  }

  // ── Stock-out predictions ──
  products.forEach(product => {
    const velocity = getSalesVelocity(product.id, bills, 7);
    if (velocity > 0 && product.units > 0) {
      const daysLeft = Math.floor(product.units / velocity);
      if (daysLeft <= 3) {
        insights.push({
          id: `stockout-${product.id}`,
          type: 'critical',
          icon: '🚨',
          title: 'Critical Stock Alert',
          message: `"${product.name}" will run out in ~${daysLeft} day${daysLeft !== 1 ? 's' : ''} at the current sales rate. Consider restocking ${Math.ceil(velocity * 14)} units.`,
          priority: 0,
        });
      } else if (daysLeft <= 7) {
        insights.push({
          id: `lowstock-${product.id}`,
          type: 'warning',
          icon: '⚠️',
          title: 'Restock Recommendation',
          message: `"${product.name}" projected to run out in ~${daysLeft} days. Recommended reorder: ${Math.ceil(velocity * 14)} units.`,
          priority: 1,
        });
      }
    }
    // Currently out of stock
    if (product.units === 0) {
      insights.push({
        id: `oos-${product.id}`,
        type: 'critical',
        icon: '❌',
        title: 'Out of Stock',
        message: `"${product.name}" is out of stock. You may be missing sales. Restock immediately.`,
        priority: 0,
      });
    }
  });

  // ── Category performance ──
  const categoryRevenue = {};
  bills.forEach(bill => {
    (bill.items || []).forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const cat = product.category || 'Other';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.totalPrice;
      }
    });
  });
  const topCategory = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    const total = Object.values(categoryRevenue).reduce((s, v) => s + v, 0);
    const pct = total > 0 ? ((topCategory[1] / total) * 100).toFixed(0) : 0;
    insights.push({
      id: 'top-category',
      type: 'info',
      icon: '🗂️',
      title: 'Top Revenue Category',
      message: `"${topCategory[0]}" accounts for ${pct}% of total revenue. This is your strongest category.`,
      priority: 3,
    });
  }

  // ── Today's performance ──
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayBills = bills.filter(b => new Date(b.createdAt) >= today);
  const todayRevenue = todayBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  if (todayBills.length > 0) {
    const avgOrder = todayRevenue / todayBills.length;
    insights.push({
      id: 'today-perf',
      type: 'positive',
      icon: '☀️',
      title: "Today's Performance",
      message: `You've completed ${todayBills.length} order${todayBills.length !== 1 ? 's' : ''} today with ₹${todayRevenue.toFixed(0)} revenue. Average order value: ₹${avgOrder.toFixed(0)}.`,
      priority: 2,
    });
  } else {
    insights.push({
      id: 'no-sales-today',
      type: 'info',
      icon: '🌟',
      title: 'Start the Day Strong',
      message: 'No orders yet today. Your store is ready! Serve customers and track sales here.',
      priority: 4,
    });
  }

  // ── High-margin opportunity ──
  const slowMovers = products.filter(p => {
    const velocity = getSalesVelocity(p.id, bills, 14);
    return velocity < 0.1 && p.units > 20;
  });
  if (slowMovers.length > 0) {
    insights.push({
      id: 'slow-movers',
      type: 'warning',
      icon: '🔄',
      title: 'Slow-Moving Inventory',
      message: `${slowMovers.length} product${slowMovers.length !== 1 ? 's' : ''} (e.g., "${slowMovers[0].name}") have high stock but low sales. Consider promoting or discounting these items.`,
      priority: 4,
    });
  }

  // Sort by priority (0 = most critical)
  return insights.sort((a, b) => a.priority - b.priority);
};

/**
 * Generate a natural language daily business summary
 */
export const generateDailySummary = (products = [], bills = [], userName = 'there') => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayBills = bills.filter(b => new Date(b.createdAt) >= today);
  const todayRevenue = todayBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const lowStock = products.filter(p => p.units > 0 && p.units < 10);
  const outOfStock = products.filter(p => p.units === 0);
  const bestSellers = getBestSellers(bills, products, 7);

  let summary = `${greeting}, ${userName}! `;

  if (todayBills.length === 0) {
    summary += `Your store is open and ready. `;
  } else {
    summary += `Great day so far — ${todayBills.length} order${todayBills.length !== 1 ? 's' : ''} worth ₹${todayRevenue.toFixed(0)}. `;
  }

  if (outOfStock.length > 0) {
    summary += `⚠️ ${outOfStock.length} item${outOfStock.length !== 1 ? 's are' : ' is'} out of stock. `;
  }
  if (lowStock.length > 0) {
    summary += `${lowStock.length} item${lowStock.length !== 1 ? 's' : ''} running low. `;
  }
  if (bestSellers.length > 0) {
    summary += `"${bestSellers[0].product.name}" is flying off the shelves this week!`;
  }

  return summary;
};
