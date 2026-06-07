import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { StoreState } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  FileText, 
  Layers, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp as ProfitIcon,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  store: StoreState;
  activeStoreKey: string;
  onNavigate: (pageId: string) => void;
}

export default function DashboardView({ store, activeStoreKey, onNavigate }: DashboardViewProps) {
  const accentColor = '#0f766e'; // Match teal theme

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Stats data
  const totalSalesVal = store.bills.reduce((sum, b) => sum + b.amount, 0);
  const totalBillsVal = store.bills.length;
  const deadStockCapital = store.deadStock.filter(d => !d.cleared).reduce((sum, d) => sum + d.value, 0);

  const stats = [
    {
      id: "stat-sales",
      label: "Today's Sales",
      value: `₹${totalSalesVal.toLocaleString('en-IN')}`,
      change: "↑ 18% vs yesterday",
      changeType: "up",
      icon: ShoppingBag,
      color: "text-emerald-600 bg-emerald-50",
      changeColor: "text-emerald-700"
    },
    {
      id: "stat-bills",
      label: "Bills Today",
      value: totalBillsVal.toString(),
      change: "5 more than average",
      changeType: "up",
      icon: FileText,
      color: "text-amber-600 bg-amber-50",
      changeColor: "text-amber-700"
    },
    {
      id: "stat-stock",
      label: "Total Inventory Items",
      value: store.inventory.reduce((sum, item) => sum + item.stock, 0).toString(),
      change: `${store.inventory.filter(i => i.status === 'low').length} products low in stock`,
      changeType: "neutral",
      icon: Layers,
      color: "text-blue-600 bg-blue-50",
      changeColor: "text-blue-700"
    },
    {
      id: "stat-dead",
      label: "Tied Dead Stock Capital",
      value: `₹${deadStockCapital.toLocaleString('en-IN')}`,
      change: `${store.deadStock.filter(d => !d.cleared).length} lazy items (90+ days)`,
      changeType: "down",
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50",
      changeColor: "text-rose-700"
    }
  ];

  // Helper to extract day of week from date string (like "2026-06-07")
  const getDayOfWeek = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[d.getDay()];
    } catch (e) {
      return '';
    }
  };

  // High-fidelity baseline data for Cash vs. Credit/Udhaar proportions
  const dailyData: Record<string, { cash: number; credit: number }> = {
    'Mon': { cash: 45, credit: 17 },
    'Tue': { cash: 58, credit: 20 },
    'Wed': { cash: 32, credit: 13 },
    'Thu': { cash: 65, credit: 25 },
    'Fri': { cash: 60, credit: 28 },
    'Sat': { cash: 92, credit: 28 },
    'Sun': { cash: 0, credit: 0 },
  };

  if (activeStoreKey === 'bartan') {
    dailyData['Mon'] = { cash: 25, credit: 10 };
    dailyData['Tue'] = { cash: 32, credit: 12 };
    dailyData['Wed'] = { cash: 18, credit: 7 };
    dailyData['Thu'] = { cash: 38, credit: 15 };
    dailyData['Fri'] = { cash: 35, credit: 14 };
    dailyData['Sat'] = { cash: 50, credit: 15 };
  }

  // Dynamically add any real bills in the store state to make the chart update live!
  store.bills.forEach(bill => {
    const day = getDayOfWeek(bill.date);
    if (day && dailyData[day] !== undefined) {
      const amtK = bill.amount / 1000;
      const isUdhaar = bill.status === 'Udhaar';
      if (isUdhaar) {
        dailyData[day].credit += amtK;
      } else {
        dailyData[day].cash += amtK;
      }
    }
  });

  const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const processedChartData = chartDays.map(day => {
    const info = dailyData[day];
    const cash = Math.round(info.cash);
    const credit = Math.round(info.credit);
    const total = cash + credit;
    return { day, cash, credit, total };
  });

  const maxVal = Math.max(...processedChartData.map(d => d.total), 10);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 font-display">
            <span className="text-xl">{store.emoji}</span>
            MANGLAM DASHBORD
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sunday, 7 June 2026 • Real-time AI learning insights active
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Offline/Online Support status indicator badge */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`} />
            <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
              {isOnline ? 'CLOUD SYNCED' : 'OFFLINE ACTIVE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-[11px] text-teal-600 dark:text-teal-400">📶</span>
            <span className="text-[10px] font-mono font-bold text-teal-800 dark:text-teal-300">OFFLINE CACHE OK</span>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-lg shadow-sm">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse mr-1" />
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">AI MODEL: LEARNED</span>
          </div>
        </div>
      </div>

      {/* Dead Stock Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Idle Cash Clearance Recommendation</h4>
            <p className="text-xs text-slate-650 mt-0.5">
              ₹{deadStockCapital.toLocaleString('en-IN')} locked in products not sold in over 60 days. Discounting suggestions prepared.
            </p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('deadstock')}
          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0 bg-amber-100/60 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 transition-all cursor-pointer"
        >
          Clear Dead Stock <ArrowRight size={14} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st) => (
          <motion.div 
            key={st.id} 
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white border border-slate-200 rounded-xl p-5 relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all duration-300 cursor-default"
          >
            <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accentColor }} />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-600 transition-colors">{st.label}</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight transition-transform duration-300 group-hover:translate-x-0.5">{st.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm ${st.color}`}>
                <st.icon size={19} className="transition-transform duration-300" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-xs font-semibold flex items-center gap-1 ${st.changeColor}`}>
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">✨</span>
                {st.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grid: Weekly Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Products Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="text-red-500">🔥</span>
              Top Selling Products (This Week)
            </h3>
            <button 
              onClick={() => onNavigate('inventory')} 
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
            >
              View Inventory
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                  <th className="py-2.5 px-5 font-bold uppercase tracking-wider">PRODUCT</th>
                  <th className="py-2.5 px-5 font-bold uppercase tracking-wider text-center">QUANTITY SOLD</th>
                  <th className="py-2.5 px-5 font-bold uppercase tracking-wider text-right">TOTAL REVENUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {store.topSelling.map((ts, index) => (
                  <tr key={index} className="hover:bg-slate-50 text-slate-705">
                    <td className="py-3.5 px-5 font-medium text-slate-900">{ts.name}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {ts.sold} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold text-slate-800">{ts.rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 7-Days Sales Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="border-b border-slate-200 pb-3 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span className="text-teal-600">📅</span>
              Weekly Sales Velocity
            </h3>
            <div className="flex items-center gap-3.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block border border-emerald-400/25 shadow-sm" />
                <span className="text-[10px] font-bold text-slate-650 font-sans">नकद (Cash/UPI)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block border border-rose-400/25 shadow-sm" />
                <span className="text-[10px] font-bold text-slate-650 font-sans">उधार (Udhaar Credit)</span>
              </div>
              <span className="text-xs font-mono text-slate-400 font-bold uppercase shrink-0">Unit: ₹(k)</span>
            </div>
          </div>
          
          {/* Custom Multi-Color Stacked Bar Chart */}
          <div className="flex items-end justify-between h-44 px-2 gap-3 pt-6 relative">
            {processedChartData.map((item, i) => {
              const heightPct = Math.max(12, Math.round((item.total / maxVal) * 100));
              const creditPct = item.total > 0 ? (item.credit / item.total) * 100 : 0;
              const cashPct = item.total > 0 ? (item.cash / item.total) * 100 : 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                  {/* Advanced Multi-Color Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 mb-2 bg-slate-900 border border-slate-800 px-3 py-2 text-[10px] text-slate-200 rounded-xl pointer-events-none transition-all duration-150 transform -translate-y-1 select-none whitespace-nowrap absolute bottom-full z-25 shadow-2xl text-left font-mono">
                    <p className="font-sans font-black text-white border-b border-slate-800 pb-1.5 mb-1.5 flex items-center gap-4 justify-between">
                      <span>{item.day} Sales</span>
                      <span className="text-[9px] bg-slate-800 text-teal-400 px-1.5 py-0.5 rounded-md font-mono font-bold">Total: ₹{item.total}K</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Cash/UPI: ₹{item.cash}K</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-rose-400 font-bold mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>Credit: ₹{item.credit}K</span>
                    </p>
                  </div>

                  {/* Stacked Bar Container */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    whileHover={{ scale: 1.05, shadow: "0 4px 10px rgba(0,0,0,0.08)" }}
                    transition={{ 
                      height: { delay: i * 0.05, duration: 0.6, ease: "easeOut" },
                      scale: { duration: 0.15 }
                    }}
                    className="w-full rounded-t-lg relative transition-all duration-200 cursor-pointer overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-end"
                  >
                    {/* Credit / Udhaar Segment (Rose color at top stack) */}
                    {item.credit > 0 && (
                      <div 
                        style={{ height: `${creditPct}%` }}
                        className="w-full bg-gradient-to-t from-rose-600 to-rose-400 hover:brightness-110 transition-all"
                        title={`Credit: ₹${item.credit}K`}
                      />
                    )}
                    {/* Cash Segment (Emerald color at base stack) */}
                    {item.cash > 0 && (
                      <div 
                        style={{ height: `${cashPct}%` }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-110 transition-all"
                        title={`Cash: ₹${item.cash}K`}
                      />
                    )}
                  </motion.div>
                  {/* Day marker */}
                  <span className="text-xs text-slate-500 font-bold font-mono mt-2.5">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={16} className="text-teal-600" />
            StockMind Intelligent Copilot Recommendations
          </h3>
          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-500/10 px-2 py-0.5 rounded font-black uppercase tracking-wider">
            RECOMMENDED FOR CLOTHINGS
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {store.aiSuggestions.map((as, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ x: 2 }}
              className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex gap-3.5 items-start"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0 select-none shadow-sm">
                {as.icon}
              </div>
              <div>
                <p className="text-xs leading-relaxed text-slate-700 font-semibold">
                  {as.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
