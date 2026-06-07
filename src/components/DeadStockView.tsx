import React from 'react';
import { motion } from 'motion/react';
import { DeadStockItem } from '../types';
import { 
  AlertTriangle, 
  Tag, 
  Trash2, 
  Check, 
  RefreshCw,
  Coins
} from 'lucide-react';

interface DeadStockViewProps {
  deadStock: DeadStockItem[];
  activeStoreKey: string;
  onClearDeadItem: (id: string) => void;
}

export default function DeadStockView({ deadStock, activeStoreKey, onClearDeadItem }: DeadStockViewProps) {
  const isKapda = activeStoreKey === 'kapda';
  const accentColor = '#0f766e'; // Consistent teal theme color

  const liquidVal = deadStock.filter(d => !d.cleared).reduce((sum, item) => sum + item.value, 0);

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
            <span className="text-lg">⚠️</span>
            Dead Stock Clearance & Liquidation
          </h2>
          <p className="text-sm text-slate-550 mt-1">
            Identify slow-moving inventory blocked on shelves for 60+ days and execute suggested clear-out marketing campaigns
          </p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-rose-50 border border-rose-200 p-5 rounded-xl flex flex-col sm:flex-row gap-4.5 sm:items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex gap-3.5">
          <div className="w-11 h-11 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle size={22} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wider">Tied Capital Warn Alert</h4>
            <p className="text-xs text-rose-700 leading-normal mt-0.5">
              ₹{liquidVal.toLocaleString('en-IN')} is locked in slow-moving stock units. Run bundle campaigns or mark discount actions to release working liquidity fast.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] text-rose-500 block uppercase font-mono tracking-wider font-bold">Blocked Asset Value</span>
          <span className="text-xl font-black text-rose-700 font-mono mt-0.5 block">
            ₹{liquidVal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Dead Stock Inventory Register Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">
            Identified Slow-Moving Products (60+ Days Idle)
          </h3>
          <span className="text-xs text-slate-505 font-semibold font-mono">
            {deadStock.filter(d => !d.cleared).length} active items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 text-slate-505 text-xs border-b border-slate-200">
                <th className="py-3 px-5 font-bold uppercase tracking-wider">PRODUCT DETAIL</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">QUANTITY IN STOCK</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">IDLE UNCHANGED DAYS</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-right">BLOCKED ASSET VALUATION</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-left">A.I. RECOMMENDED CAMPAIGN ACTION</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">DECISION STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {deadStock && deadStock.length > 0 ? (
                deadStock.map((item) => {
                  const isCleared = item.cleared;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isCleared ? 'text-slate-400 bg-slate-50/40 opacity-60' : 'text-slate-700'
                      }`}
                    >
                      <td className="py-4.5 px-5">
                        <span className={`font-bold block ${isCleared ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {item.name}
                        </span>
                      </td>
                      <td className="py-4.5 px-5 text-center font-mono font-medium">{item.stock} units</td>
                      <td className="py-4.5 px-5 text-center font-mono">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          isCleared ? 'bg-slate-105 text-slate-400' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.days} days idle
                        </span>
                      </td>
                      <td className="py-4.5 px-5 text-right font-mono font-bold text-slate-800">
                        ₹{item.value.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4.5 px-5 text-xs text-slate-655 font-semibold whitespace-normal max-w-sm">
                        <div className="flex items-start gap-1.5 leading-normal">
                          <Tag size={13} className="mt-0.5 text-slate-400 shrink-0" />
                          {item.suggestion}
                        </div>
                      </td>
                      <td className="py-4.5 px-5 text-center">
                        {isCleared ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Check size={14} /> Action Marked
                          </span>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => onClearDeadItem(item.id)}
                            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            Mark Taken
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No matching products located in active session register
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
