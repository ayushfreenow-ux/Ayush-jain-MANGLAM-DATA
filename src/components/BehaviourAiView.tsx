import React, { useState } from 'react';
import { motion } from 'motion/react';
import { StoreState, Customer } from '../types';
import { 
  Brain, 
  Search, 
  Sparkles, 
  Award, 
  Clock, 
  Calendar, 
  DollarSign, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface BehaviourAiViewProps {
  store: StoreState;
  activeStoreKey: string;
}

export default function BehaviourAiView({ store, activeStoreKey }: BehaviourAiViewProps) {
  const isKapda = activeStoreKey === 'kapda';
  const accentColor = '#0f766e'; // Teal theme colors

  // Individual customer dossier selection
  const [searchVal, setSearchVal] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<Customer>(store.customers[0]);

  const handleSearchAction = (search: string) => {
    setSearchVal(search);
    const match = store.customers.find(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    );
    if (match) {
      setSelectedProfile(match);
    }
  };

  const initials = selectedProfile.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-display">
            <span className="text-lg">🧠</span>
            Customer Behaviour AI Engine
          </h2>
          <p className="text-sm text-slate-550 mt-1">
            Deep customer data clustering, loyalty segmentation models, and outreach response algorithms
          </p>
        </div>
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3.5 py-1.5 rounded-lg text-teal-850">
          <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs font-bold uppercase font-mono tracking-wider">Cognitive Clustering Active</span>
        </div>
      </div>

      {/* Segment Summary Cards */}
      <div className="space-y-3 font-sans">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
          Clustered Loyalty Clusters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {store.segments.map((seg, idx) => (
            <div key={idx} className="bg-white border border-slate-205 rounded-xl p-4.5 flex gap-4 items-center shadow-sm">
              <div className="min-w-6 text-center shrink-0">
                <span className="text-lg block mb-0.5">👥</span>
                <span className="text-[10px] text-slate-400 block uppercase font-black tracking-wide">Clust #{idx+1}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{seg.label}</p>
                <p className="text-xs text-teal-700 font-extrabold mt-1 font-mono">{seg.count} Customer{seg.count !== 1 ? 's' : ''}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug font-medium">{seg.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual dossier selector and lookup profile mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 font-sans">
        
        {/* Left Side: Directory and rankings */}
        <div className="space-y-4">
          
          {/* Champion listings card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <Award size={16} className="text-amber-500" />
              🏆 Top Spending Customer Champions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] border-b border-slate-200 font-bold">
                    <th className="py-2.5">CUSTOMER</th>
                    <th className="py-2.5 text-right">LIFETIME REVENUE</th>
                    <th className="py-2.5 text-right font-mono">FAVOURITE CATEGORY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {store.topCust.map((tc, index) => (
                    <tr 
                      key={index} 
                      onClick={() => handleSearchAction(tc.name)}
                      className="hover:bg-slate-55 text-slate-700 cursor-pointer group transition-colors"
                    >
                      <td className="py-3 pr-2">
                        <span className="font-bold text-slate-900 block group-hover:text-teal-700 transition-colors">{tc.name}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-semibold">{tc.tag}</span>
                      </td>
                      <td className="py-3 text-right font-black text-slate-800 font-mono">{tc.spend}</td>
                      <td className="py-3 text-right text-slate-600 font-bold">{tc.fav}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick dossier selector search */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Search Individual Dossier
            </h3>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search size={14} />
              </span>
              <input 
                type="text"
                value={searchVal}
                onChange={(e) => handleSearchAction(e.target.value)}
                placeholder="Type customer name to generate insights..."
                className="w-full bg-white border border-slate-350 rounded-lg pl-9 pr-4 py-1.8 text-xs text-slate-900 placeholder-slate-450 outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
              />
            </div>
          </div>

        </div>

        {/* Right Side: Deep Cognitive Dossier Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:p-6 space-y-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-55/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Header Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-sm font-mono text-slate-700 tracking-wider"
                style={{ border: `1.5px solid ${accentColor}` }}
              >
                {initials}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-display uppercase tracking-wide">{selectedProfile.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedProfile.phone} • {selectedProfile.city || 'Local Area'}</p>
              </div>
            </div>
            <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded font-black uppercase tracking-wider self-start sm:self-center">
              {selectedProfile.tag} TIER
            </span>
          </div>

          {/* Financial summary tags */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Ltv Purchases</span>
              <span className="text-sm font-black text-teal-800 block mt-1 font-mono">₹{selectedProfile.spent.toLocaleString('en-IN')}</span>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Ledger Outstanding</span>
              <span className={`text-sm font-black block mt-1 font-mono ${selectedProfile.udhaar > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                ₹{selectedProfile.udhaar.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Avg Invoice Sum</span>
              <span className="text-sm font-black text-teal-800 block mt-1 font-mono">
                ₹{Math.round(selectedProfile.spent / 5).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* AI Behavioral Insights Block */}
          <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl space-y-2 relative overflow-hidden">
            <div className="flex gap-2 items-center text-xs font-black text-teal-700">
              <Sparkles size={14} className="animate-pulse" />
              Intelligence Dossier Insights
            </div>
            <p className="text-xs leading-relaxed text-teal-800 font-semibold">
              🤖 <strong>Outreach Insight:</strong> {selectedProfile.name} historically acquires {isKapda ? "premium denim and printed textile materials" : "premium-grade cookware items"}. 
              Optimal touchpoint broadcasting slot: <strong>Friday evenings</strong>. High marketing resonance score towards custom discount incentives above 15%.
            </p>
          </div>

          {/* Purchase transaction history preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Clock size={12} />
              Recent Purchase Tracks (Last 30 Days)
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-xs font-semibold">
              <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white">
                <span className="font-bold text-slate-800">Sunday (Last visit)</span>
                <span className="font-mono text-slate-600">₹4,250</span>
              </div>
              <div className="p-3 flex justify-between items-center text-slate-500">
                <span>Completed checkout for flagship units</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                  Paid
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
