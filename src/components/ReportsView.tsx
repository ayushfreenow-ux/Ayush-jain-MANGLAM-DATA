import React from 'react';
import { motion } from 'motion/react';
import { StoreState } from '../types';
import { 
  BarChart4, 
  MessageSquareOff, 
  Clipboard, 
  Check, 
  RefreshCw,
  Coins,
  Smile,
  Globe,
  Share2
} from 'lucide-react';

interface ReportsViewProps {
  store: StoreState;
  activeStoreKey: string;
  onTriggerToast: (msg: string) => void;
}

export default function ReportsView({ store, activeStoreKey, onTriggerToast }: ReportsViewProps) {
  const isKapda = activeStoreKey === 'kapda';
  const accentColor = '#0f766e'; // Teal theme colors

  // Dynamic values
  const todaySalesVal = store.bills.reduce((sum, b) => sum + b.amount, 0);
  const billsCountVal = store.bills.length;

  const monthSales = `₹${(1715000 + todaySalesVal).toLocaleString('en-IN')}`;

  const avgBillSize = billsCountVal > 0 
    ? `₹${Math.round(todaySalesVal / billsCountVal).toLocaleString('en-IN')}` 
    : "₹5,420";

  const udhaarPending = `₹${store.customers.reduce((sum, c) => sum + c.udhaar, 0).toLocaleString('en-IN')}`;

  // Generate real-time dynamic WhatsApp report text
  const bestSeller = "Blue Jeans";
  const slowMover = "Old Kurta Set";
  
  const dynamicReport = `📊 StockMind AI — Daily Report
👕 ${store.name} | Sunday, 7 June 2026

💰 Today's Sales:     ₹${todaySalesVal.toLocaleString('en-IN')}
🧾 Bills Made:        ${billsCountVal}
👥 Active Patrons:     ${store.customers.length}

🔥 Best Seller:       ${bestSeller}
⚠️ Slow Mover:        ${slowMover}

🤖 AI Action Suggestion:
→ ${store.aiSuggestions[0]?.text || "Monitor inventory thresholds"}
→ ${store.aiSuggestions[1]?.text || "Promote slow moving clearance campaign"}`;

  const handleCopyReport = () => {
    navigator.clipboard.writeText(dynamicReport);
    onTriggerToast("📊 Daily Business Report copied to clipboard! Ready to paste into WhatsApp. ✅");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-display">
            <span className="text-lg">📈</span>
            Business Analytics & Reports
          </h2>
          <p className="text-sm text-slate-550 mt-1">
            Browse calculated periodic summaries, operational efficiency indices, or export daily ledger registers
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* sales */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">This Month Sales</span>
          <div className="mt-2 text-xl font-black font-mono text-slate-900">{monthSales}</div>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">↑ 22% vs previous run</p>
        </div>

        {/* patrons */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Customer Directories</span>
          <div className="mt-2 text-xl font-black font-mono text-slate-900">{store.customers.length} entries</div>
          <p className="text-[10px] text-slate-505 mt-1 font-semibold">6 new patrons registered</p>
        </div>

        {/* average receipts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Average Bill Value</span>
          <div className="mt-2 text-xl font-black font-mono text-slate-900">{avgBillSize}</div>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">↑ 8% shopping ticket growth</p>
        </div>

        {/* credit dues */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Outstanding Udhaar</span>
          <div className="mt-2 text-xl font-black font-mono text-rose-600">{udhaarPending}</div>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">Pending collections ledger</p>
        </div>
      </div>

      {/* WhatsApp Report Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="text-emerald-600">📲</span>
              Smart WhatsApp Daily Ledger Summary Preview
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Ready to share directly with partners and colleagues via mobile messaging</p>
          </div>
          <button 
            onClick={handleCopyReport}
            className="text-xs font-black text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-teal-850 flex items-center gap-1.5 transition-all self-start sm:self-center shrink-0 shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <Clipboard size={14} /> Copy Formatting String
          </button>
        </div>

        {/* Monospaced visual container block */}
        <div className="relative font-mono">
          <pre className="w-full bg-slate-950 border border-slate-800 p-5 rounded-xl text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap select-all font-semibold">
            {dynamicReport}
          </pre>
          <div className="absolute bottom-3 right-3 text-[10px] font-mono font-bold text-emerald-500 select-none bg-slate-900 px-2 py-0.5 border border-slate-800 rounded">
            UTF-8 RAW TEXT
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-4 flex gap-3 text-xs text-emerald-800 leading-normal font-semibold">
          <Smile size={16} className="text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
          <span>Need to update accounting parameters instantly? This dynamic string adapts automatically as soon as you save sales records or registers under the Create Bill tab above!</span>
        </div>
      </div>
    </motion.div>
  );
}
