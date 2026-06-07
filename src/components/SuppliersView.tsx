import React from 'react';
import { motion } from 'motion/react';
import { Supplier } from '../types';
import { 
  Building2, 
  Award, 
  BarChart2, 
  TrendingUp, 
  Star,
  CheckCircle2
} from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  activeStoreKey: string;
}

export default function SuppliersView({ suppliers, activeStoreKey }: SuppliersViewProps) {
  const isKapda = activeStoreKey === 'kapda';
  const accentColor = '#0f766e'; // Teal theme colors

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 font-sans"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-display">
            <span className="text-lg">🏭</span>
            Supplier Quality & Perf Report card
          </h2>
          <p className="text-sm text-slate-550 mt-1">
            Assess which wholesale manufacturers and suppliers deliver the fastest moving stock catalogs to our retail showroom vs stagnant dead items.
          </p>
        </div>
      </div>

      {/* Supplier listings overview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <Building2 size={16} className="text-teal-700" />
          <h3 className="text-sm font-bold text-slate-850">
            Current Supplier Catalog Scores
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 text-slate-505 text-xs border-b border-slate-200">
                <th className="py-3 px-5 font-bold uppercase tracking-wider">SUPPLIER CONCERN</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">ITEMS SUPPLIED COUNT</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center text-emerald-800">FAST MOVING RATIO (%)</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center text-rose-600">DEAD STOCK RATIO (%)</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">A.I. MERIT SCORE (10)</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">RATING STRENGTH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {suppliers.map((sup, idx) => {
                const roundedRating = Math.round(sup.score / 2);
                return (
                  <tr key={idx} className="hover:bg-slate-50 text-slate-705">
                    <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-mono text-slate-500 text-xs font-black">
                        W{idx+1}
                      </div>
                      {sup.name}
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-bold text-slate-700">{sup.items} products</td>
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700">
                        {sup.fast}%
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
                        sup.dead > 20 
                          ? 'bg-rose-50 text-rose-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sup.dead}%
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-black text-slate-800 text-sm">{sup.score} / 10</td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex gap-0.5 justify-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            fill={i < roundedRating ? accentColor : 'transparent'}
                            className={i < roundedRating ? 'text-amber-500' : 'text-slate-200'} 
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
