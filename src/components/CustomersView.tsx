import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Customer, CustomerTag } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  MapPin, 
  TrendingUp, 
  AlertCircle,
  X,
  CreditCard,
  Briefcase,
  Phone,
  User,
  DollarSign,
  Calendar,
  CheckCircle,
  Edit2,
  Lock,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

const getCustomerTrendData = (customer: Customer, timeframe: '6m' | '12m') => {
  // We want to construct months. Current date is June 2026.
  const allMonths = [
    { name: 'Jul 25', monthIdx: 6, year: 2025 },
    { name: 'Aug 25', monthIdx: 7, year: 2025 },
    { name: 'Sep 25', monthIdx: 8, year: 2025 },
    { name: 'Oct 25', monthIdx: 9, year: 2025 },
    { name: 'Nov 25', monthIdx: 10, year: 2025 },
    { name: 'Dec 25', monthIdx: 11, year: 2025 },
    { name: 'Jan 26', monthIdx: 0, year: 2026 },
    { name: 'Feb 26', monthIdx: 1, year: 2026 },
    { name: 'Mar 26', monthIdx: 2, year: 2026 },
    { name: 'Apr 26', monthIdx: 3, year: 2026 },
    { name: 'May 26', monthIdx: 4, year: 2026 },
    { name: 'Jun 26', monthIdx: 5, year: 2026 },
  ];

  // Slice based on timeframe selection (6 months vs 12 months)
  const targetMonths = timeframe === '6m' ? allMonths.slice(6) : allMonths;

  // Let's seed values based on customer id string hash so it's perfectly deterministic per customer
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getHash(customer.id || 'std');
  
  // Calculate a nice spending & purchase distribution matching their total lifetime spent
  const totalLifetimeSpent = customer.spent || 3000;
  
  // Generate deterministic monthly patterns (valleys and peaks)
  const data = targetMonths.map((m, idx) => {
    const isPeak = (seed + idx) % 3 === 0;
    const isDip = (seed + idx) % 5 === 0;
    
    let spendShare = 0.08 + 0.04 * ((seed * (idx + 1)) % 10) / 10;
    if (isPeak) spendShare *= 2.2;
    if (isDip) spendShare *= 0.3;

    // Adjust spend and frequency based on tag
    if (customer.tag === 'VIP') {
      spendShare *= 1.4;
    } else if (customer.tag === 'New') {
      const isRecent = idx >= targetMonths.length - 2;
      spendShare = isRecent ? 0.45 : 0.02;
    }

    let monthlySpend = Math.round(totalLifetimeSpent * spendShare);
    if (monthlySpend < 0) monthlySpend = 0;

    // purchase count (frequency)
    let purchaseFreq = 0;
    if (monthlySpend > 0) {
      purchaseFreq = Math.round(1 + ((seed + idx) % 3));
      if (customer.tag === 'VIP') purchaseFreq += 1;
    }

    return {
      month: m.name,
      spending: monthlySpend,
      purchases: purchaseFreq,
    };
  });

  // Normalise values so the sum matches roughly the lifetime spent
  const computedSum = data.reduce((sum, item) => sum + item.spending, 0);
  if (computedSum > 0) {
    const scaleFactor = totalLifetimeSpent / computedSum;
    data.forEach(item => {
      item.spending = Math.round(item.spending * scaleFactor);
    });
  }

  return data;
};

interface CustomersViewProps {
  customers: Customer[];
  activeStoreKey: string;
  custSub: string;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'spent' | 'last'> & { occupation?: string }) => void;
  onUpdateCustomer: (customerId: string, updatedFields: Partial<Customer>) => void;
}

export default function CustomersView({ 
  customers, 
  activeStoreKey, 
  custSub, 
  onAddCustomer,
  onUpdateCustomer 
}: CustomersViewProps) {
  const accentColor = '#0f766e'; // Teal theme color

  // State managers
  const [activeTab, setActiveTab] = useState<'all' | 'vip' | 'udhaar' | 'new'>('all');
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // Selected customer for full Profile Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Timeframe for the Recharts activity sparklines
  const [trendTimeframe, setTrendTimeframe] = useState<'6m' | '12m'>('12m');

  // Customer reference being edited
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields for Creating
  const [ncName, setNcName] = useState<string>('');
  const [ncPhone, setNcPhone] = useState<string>('');
  const [ncCity, setNcCity] = useState<string>('');
  const [ncTag, setNcTag] = useState<CustomerTag>('Regular');
  const [ncUdhaar, setNcUdhaar] = useState<number>(0);
  const [ncNotes, setNcNotes] = useState<string>('');
  const [ncOccupation, setNcOccupation] = useState<string>('');

  // Form Fields for Editing
  const [ecName, setEcName] = useState<string>('');
  const [ecPhone, setEcPhone] = useState<string>('');
  const [ecCity, setEcCity] = useState<string>('');
  const [ecTag, setEcTag] = useState<CustomerTag>('Regular');
  const [ecUdhaar, setEcUdhaar] = useState<number>(0);
  const [ecNotes, setEcNotes] = useState<string>('');
  const [ecOccupation, setEcOccupation] = useState<string>('');

  // Filtering Logic
  const filteredCustomers = customers.filter(c => {
    // Search matching name, phone, or occupation
    const matchesSearch = 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search) ||
      (c.occupation && c.occupation.toLowerCase().includes(search.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()));
    
    // Tab filtering
    if (activeTab === 'vip') return matchesSearch && (c.tag === 'VIP' || c.spent >= 25000);
    if (activeTab === 'udhaar') return matchesSearch && c.udhaar > 0;
    if (activeTab === 'new') return matchesSearch && c.tag === 'New';
    return matchesSearch;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncName || !ncPhone) return;

    onAddCustomer({
      name: ncName,
      phone: ncPhone,
      city: ncCity || 'Local Area',
      tag: ncTag,
      udhaar: ncUdhaar,
      notes: ncNotes,
      occupation: ncOccupation || 'Retail Customer'
    });

    // Reset Form Fields
    setNcName('');
    setNcPhone('');
    setNcCity('');
    setNcTag('Regular');
    setNcUdhaar(0);
    setNcNotes('');
    setNcOccupation('');
    setShowAddModal(false);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setEcName(cust.name);
    setEcPhone(cust.phone);
    setEcCity(cust.city || '');
    setEcTag(cust.tag);
    setEcUdhaar(cust.udhaar);
    setEcNotes(cust.notes || '');
    setEcOccupation(cust.occupation || '');
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const fieldsToUpdate = {
      name: ecName,
      phone: ecPhone,
      city: ecCity || 'Local Area',
      tag: ecTag,
      udhaar: ecUdhaar,
      notes: ecNotes,
      occupation: ecOccupation || 'Retail Customer'
    };

    onUpdateCustomer(editingCustomer.id, fieldsToUpdate);

    // Sync selected profile state if currently active
    if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
      setSelectedCustomer({
        ...selectedCustomer,
        ...fieldsToUpdate
      });
    }

    setEditingCustomer(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header and Add trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 font-display">
            <span className="text-lg">👥</span>
            Associate Client Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {custSub} • Build robust customer ledgers, track buying behaviors, or record dues
          </p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold text-white hover:bg-teal-800 px-4 py-2.5 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 duration-200"
            style={{ backgroundColor: accentColor }}
          >
            <Plus size={15} /> Add Custom Customer
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto select-none">
        {(['all', 'vip', 'udhaar', 'new'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const labels: Record<string, string> = {
            all: "All Customers",
            vip: "⭐ VIP / High Value",
            udhaar: "🔴 Udhaar / Creditors",
            new: "🆕 New Registrations"
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? 'text-teal-800 dark:text-teal-400 border-b-teal-700 dark:border-b-teal-500 font-extrabold' 
                  : 'text-slate-500 dark:text-slate-400 border-b-transparent hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              style={{ borderBottomColor: isActive ? accentColor : 'transparent' }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Controllers: Search Field */}
      <div className="relative max-w-sm">
        <span className="absolute left-3 top-2.5 text-slate-400">
          <Search size={14} />
        </span>
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, phone, occupation, or town..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.8 text-xs text-slate-900 dark:text-white placeholder-slate-450 outline-none focus:ring-1 focus:ring-teal-500/20 focus:border-teal-600 font-semibold"
        />
      </div>

      {/* customer List grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                <th className="py-3 px-5 font-bold uppercase tracking-wider">CUSTOMER NAME</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider">MOBILE / PHONE</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider">REGIONAL CITY</th>
                <th className="py-3 px-4 font-bold uppercase tracking-wider">OCCUPATION & JOBS</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-right font-mono">LIFETIME REVENUE</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-right">LEDGER UDHAAR DUES</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">SEGMENT</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => {
                  const initials = cust.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                  const isVip = cust.tag === 'VIP' || cust.spent >= 25000;
                  const isUdhaar = cust.udhaar > 0;
                  
                  // Tags mapping
                  let tagStyles = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                  if (isVip) tagStyles = 'bg-purple-50 text-purple-700 dark:bg-purple-950/45 dark:text-purple-300 border-purple-250 dark:border-purple-900';
                  else if (cust.tag === 'New') tagStyles = 'bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300 border-blue-250 dark:border-blue-900';
                  else if (cust.tag === 'Regular') tagStyles = 'bg-green-50 text-green-700 dark:bg-green-950/45 dark:text-green-300 border-green-250 dark:border-green-900';

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-705 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => setSelectedCustomer(cust)}
                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black font-mono text-slate-700 dark:text-slate-300 uppercase shrink-0 cursor-pointer hover:border-teal-500 duration-200 border"
                            style={{ borderColor: `${accentColor}2A` }}
                          >
                            {initials}
                          </div>
                          <div>
                            <span 
                              onClick={() => setSelectedCustomer(cust)}
                              className="font-bold text-slate-900 dark:text-white block hover:text-teal-700 dark:hover:text-teal-400 cursor-pointer hover:underline transition-colors leading-tight"
                            >
                              {cust.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block max-w-xs overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
                              {cust.notes || 'No active preferences notes'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-850 dark:text-slate-200 font-bold">{cust.phone}</td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          {cust.city || 'Local Area'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-sans">
                        <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          💼 {cust.occupation || 'Retail Showroom Buyer'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                        ₹{cust.spent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {isUdhaar ? (
                          <span className="inline-block font-mono text-xs font-black bg-rose-50 dark:bg-rose-950/45 text-rose-700 dark:text-rose-300 border border-rose-250 dark:border-rose-900 px-2.5 py-1 rounded-md">
                            ₹{cust.udhaar.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-350 dark:text-slate-600 text-xs font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex items-center text-[9.5px] font-black px-2.5 py-0.5 rounded-full border tracking-wider ${tagStyles}`}>
                          {isVip ? 'VIP TIER' : cust.tag.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-right">
                          <button 
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-2.5 py-1.2 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/45 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-[10.5px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                            title="Open Customer Profile Sheet"
                          >
                            👁️ View Profile
                          </button>
                          <button 
                            onClick={() => handleOpenEditModal(cust)}
                            className="px-2 py-1.2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-250 text-[10.5px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                            title="Edit Client Information"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No customers found matching input criteria in active dataset
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. ADD CUSTOMER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-display flex items-center gap-1.5">
                  <span>👤</span> Registered Showroom Customer Profile
                </h4>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="p-5 space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Customer Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs"><User size={13} /></span>
                    <input 
                      type="text" 
                      required
                      value={ncName}
                      onChange={(e) => setNcName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Mobile Phone</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs"><Phone size={13} /></span>
                      <input 
                        type="tel" 
                        required
                        maxLength={10}
                        value={ncPhone}
                        onChange={(e) => setNcPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Customer Occupation</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs"><Briefcase size={13} /></span>
                      <input 
                        type="text" 
                        value={ncOccupation}
                        onChange={(e) => setNcOccupation(e.target.value)}
                        placeholder="e.g. Govt. Teacher"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">City / Neighborhood</label>
                    <input 
                      type="text" 
                      value={ncCity}
                      onChange={(e) => setNcCity(e.target.value)}
                      placeholder="e.g. Bandra, Mumbai"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Client Segment</label>
                    <select 
                      value={ncTag}
                      onChange={(e) => setNcTag(e.target.value as CustomerTag)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-bold"
                    >
                      <option value="Regular">Regular Showroom Buyer</option>
                      <option value="VIP">VIP Tier Profile</option>
                      <option value="New">Fresh New Client</option>
                      <option value="Walk-in">Walk-In / Casual</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Opening outstanding Udhaar credit ledger balance (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      value={ncUdhaar || ''}
                      onChange={(e) => setNcUdhaar(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg pl-6 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Personal Profile Preferences / Notes</label>
                  <textarea 
                    value={ncNotes}
                    onChange={(e) => setNcNotes(e.target.value)}
                    placeholder="e.g. Prefers printed heavy materials, usually shops with family during festivals..."
                    className="w-full h-18 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 resize-none outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold font-sans"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-1 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-black select-none cursor-pointer border border-slate-200 dark:border-slate-700 h-9"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-1 px-1 rounded-lg text-xs font-black text-white select-none cursor-pointer hover:bg-teal-850 h-9"
                    style={{ backgroundColor: accentColor }}
                  >
                    Save Dossier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SPECIFIC EDIT CUSTOMER DETAILS MODAL */}
      <AnimatePresence>
        {editingCustomer && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-display flex items-center gap-1.5">
                  📁 Edit Specific Details for "{editingCustomer.name}"
                </h4>
                <button 
                  onClick={() => setEditingCustomer(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEditCustomer} className="p-5 space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Customer Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs"><User size={13} /></span>
                    <input 
                      type="text" 
                      required
                      value={ecName}
                      onChange={(e) => setEcName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Mobile Phone</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs"><Phone size={13} /></span>
                      <input 
                        type="tel" 
                        required
                        maxLength={10}
                        value={ecPhone}
                        onChange={(e) => setEcPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Customer Occupation</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs"><Briefcase size={13} /></span>
                      <input 
                        type="text" 
                        value={ecOccupation}
                        onChange={(e) => setEcOccupation(e.target.value)}
                        placeholder="e.g. Saree Weaver"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">City / Neighborhood</label>
                    <input 
                      type="text" 
                      value={ecCity}
                      onChange={(e) => setEcCity(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Customer Segment Category</label>
                    <select 
                      value={ecTag}
                      onChange={(e) => setEcTag(e.target.value as CustomerTag)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-bold"
                    >
                      <option value="Regular">Regular Showroom Buyer</option>
                      <option value="VIP">VIP Tier Profile</option>
                      <option value="New">Fresh New Client</option>
                      <option value="Walk-in">Walk-In / Casual</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Active Udhaar Credit Balance (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono">₹</span>
                    <input 
                      type="number" 
                      min="0"
                      value={ecUdhaar}
                      onChange={(e) => setEcUdhaar(parseInt(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-lg pl-6 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-350 uppercase tracking-wider block">Personal Profile Preferences / Notes</label>
                  <textarea 
                    value={ecNotes}
                    onChange={(e) => setEcNotes(e.target.value)}
                    className="w-full h-18 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-450 resize-none outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold font-sans animate-none"
                  />
                </div>

                <div className="pt-3 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="flex-1 py-1.8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-black select-none cursor-pointer border border-slate-250 dark:border-slate-700"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-1.8 rounded-lg text-xs font-black text-white select-none cursor-pointer hover:bg-teal-850"
                    style={{ backgroundColor: accentColor }}
                  >
                    Apply Modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. CORE CUSTOMER PROFILE SLIDING PANEL & TRANSIT LEDGER VIEW */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] font-sans"
            >
              {/* Profile Top header section */}
              <div className="px-5 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">💼</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Showroom Customer Profile Sheet & Ledgers
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* Profile Card & Bio segment */}
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center bg-gradient-to-r from-teal-800 to-slate-900 dark:from-teal-950 dark:to-slate-950 text-white rounded-xl p-6 shadow-md relative overflow-hidden border border-teal-700/30">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Avatar Circle Display */}
                  <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center font-mono font-black text-lg text-teal-100 uppercase shrink-0">
                    {selectedCustomer.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                  </div>

                  {/* Information fields */}
                  <div className="space-y-1.5 flex-1 select-text">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black tracking-tight text-white leading-none">{selectedCustomer.name}</h3>
                      <span className="text-[9px] font-black bg-white/20 border border-white/10 px-2.5 py-0.5 rounded-full tracking-wider uppercase text-teal-100">
                        {selectedCustomer.tag} Profile
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs text-teal-100 mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">💼</span>
                        <span className="text-teal-100 font-semibold">Occupation: <strong className="text-white font-extrabold">{selectedCustomer.occupation || 'Retail Buyer'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">📍</span>
                        <span className="text-teal-100 font-semibold">Region: <strong className="text-white font-extrabold">{selectedCustomer.city || 'Local Area'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">📞</span>
                        <span className="text-teal-100 font-semibold">Mobile No: <strong className="text-white font-mono font-extrabold">{selectedCustomer.phone}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0">🕒</span>
                        <span className="text-teal-100 font-semibold">Last Visit: <strong className="text-white font-extrabold">{selectedCustomer.last || 'Unavailable'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Quick WhatsApp reminding actions */}
                  <div className="shrink-0 pt-2 sm:pt-0">
                    <a
                      href={`https://wa.me/91${selectedCustomer.phone}?text=${encodeURIComponent(`Dear ${selectedCustomer.name}, thank you for choosing Manglam Vastralya family showroom. Your premium client folder is registered with us! 👍`)}`}
                      target="_blank"
                      rel="noreferrer referrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-teal-600 hover:bg-teal-500 hover:-translate-y-0.5 transition-all rounded-lg select-none text-white shadow-md border border-teal-500/30"
                    >
                      <MessageSquare size={13} />
                      WhatsApp Ping
                    </a>
                  </div>
                </div>

                {/* Financial Summary KPIs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">Lifetime Revenue Spent</p>
                      <h4 className="text-xl font-extrabold text-slate-900 dark:text-teal-400 mt-1 font-mono">
                        ₹{selectedCustomer.spent.toLocaleString('en-IN')}
                      </h4>
                    </div>
                    <span className="text-xl p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700">💰</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">Udhaar Credit Liability</p>
                      <h4 className={`text-xl font-extrabold mt-1 font-mono ${selectedCustomer.udhaar > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-650 dark:text-slate-400'}`}>
                        ₹{selectedCustomer.udhaar.toLocaleString('en-IN')}
                      </h4>
                    </div>
                    <span className={`text-xl p-2 rounded-lg ${selectedCustomer.udhaar > 0 ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>⚠️</span>
                  </div>
                </div>

                {/* Micro Sparkline Trends Segment using Recharts */}
                <div className="bg-[#f8fafc] dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 space-y-3.5 shadow-sm">
                  <div className="flex justify-between items-center bg-slate-100/40 dark:bg-slate-900/45 px-2.5 py-1.5 rounded-lg border border-slate-150/50 dark:border-slate-800/60">
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-650 dark:text-slate-400 flex items-center gap-1.5 font-sans">
                      <TrendingUp size={12} className="text-teal-600 dark:text-teal-455 shrink-0" />
                      <span>Activity & Spend History Trends (Recharts Sparkline)</span>
                    </h4>
                    
                    {/* Timeframe Selector Button Tabs */}
                    <div className="flex border border-slate-200 dark:border-slate-850 rounded-md p-0.5 text-[9.5px] bg-white dark:bg-slate-900 select-none">
                      <button
                        type="button"
                        onClick={() => setTrendTimeframe('6m')}
                        className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          trendTimeframe === '6m'
                            ? 'bg-teal-700 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        6 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrendTimeframe('12m')}
                        className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                          trendTimeframe === '12m'
                            ? 'bg-teal-700 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        1 Year
                      </button>
                    </div>
                  </div>

                  {/* Two columns layout for sparklines */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Spend Trend Micro Area Chart */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-800/80 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-1 select-text">
                        <div>
                          <p className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Spending Patterns</p>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {trendTimeframe === '6m' ? 'Last 6 Months Trace' : 'Annual Spend Path'}
                          </p>
                        </div>
                        <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono font-bold bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded">
                          Total: ₹{getCustomerTrendData(selectedCustomer, trendTimeframe).reduce((acc, curr) => acc + curr.spending, 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      {/* Responsive Area Chart Container */}
                      <div className="h-16 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={getCustomerTrendData(selectedCustomer, trendTimeframe)}
                            margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                          >
                            <defs>
                              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.01}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" hide />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900 dark:bg-neutral-950 text-white px-2 py-1 rounded text-[10px] font-mono shadow-md border border-slate-800">
                                      <p className="font-bold">{payload[0].payload.month}</p>
                                      <p className="text-teal-300 font-bold">Spent: ₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="spending"
                              stroke="#0f766e"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#colorSpend)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Frequency Trend Line Chart */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-150 dark:border-slate-800/80 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-1 select-text">
                        <div>
                          <p className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Visit Frequency</p>
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {trendTimeframe === '6m' ? 'Store Visited Count' : 'Annual Billing Footprint'}
                          </p>
                        </div>
                        <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono font-bold bg-cyan-50 dark:bg-cyan-950/40 px-1.5 py-0.5 rounded">
                          Total: {getCustomerTrendData(selectedCustomer, trendTimeframe).reduce((acc, curr) => acc + curr.purchases, 0)} Visits
                        </span>
                      </div>

                      {/* Responsive Line Chart Container */}
                      <div className="h-16 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={getCustomerTrendData(selectedCustomer, trendTimeframe)}
                            margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                          >
                            <XAxis dataKey="month" hide />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900 dark:bg-neutral-950 text-white px-2 py-1 rounded text-[10px] font-mono shadow-md border border-slate-800">
                                      <p className="font-bold">{payload[0].payload.month}</p>
                                      <p className="text-cyan-300 font-bold">Bills Made: {payload[0].value} visits</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="purchases"
                              stroke="#06b6d4"
                              strokeWidth={2}
                              dot={{ r: 2.5, strokeWidth: 1 }}
                              activeDot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences Book Notes */}
                <div className="bg-[#f8fafc] dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-[10.5px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-450 flex items-center gap-1">
                    <span>📝</span> Buyer Character Profile & Taste Preferences
                  </h4>
                  <p className="text-xs text-slate-755 dark:text-slate-300 leading-relaxed font-medium">
                    {selectedCustomer.notes || 'No custom preferences. Double click edit or tap "Edit Customer" to register custom fit dimensions, aesthetic colors requested, or preferred clothing items.'}
                  </p>
                </div>

                {/* Past Transactions Ledger list */}
                <div className="space-y-3">
                  <h4 className="text-[10.5px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span>🧾</span> Account Credit Dues Sheet History
                  </h4>

                  {selectedCustomer.ledger && selectedCustomer.ledger.length > 0 ? (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {selectedCustomer.ledger.map((entry) => {
                        const isCredit = entry.type === 'Credit';
                        return (
                          <div key={entry.id} className="p-3.5 bg-white dark:bg-slate-900 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded tracking-wide ${isCredit ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-350' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-350'}`}>
                                  {isCredit ? 'CREDIT REVENUE' : 'PAYMENT RECEIVED'}
                                </span>
                                {entry.billNo && (
                                  <span className="font-mono text-slate-500 dark:text-slate-450 font-semibold">Bill #{entry.billNo}</span>
                                )}
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 font-bold">{entry.notes || 'Counter Billing checkout session'}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-slate-500">
                                <span>📅 Date: {entry.date}</span>
                                {entry.mode && (
                                  <>
                                    <span>•</span>
                                    <span>Method: {entry.mode}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`text-sm font-black font-mono ${isCredit ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                {isCredit ? '+' : '-'} ₹{entry.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl py-6 px-4 text-center">
                      <p className="text-slate-400 dark:text-slate-500 text-xs">🔒 No account transactional debit slates registered for this customer ledger balance.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons Footer row */}
              <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditModal(selectedCustomer);
                  }}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                >
                  <Edit2 size={12} /> Edit Client Details
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="py-2 px-5 text-white rounded-xl text-xs font-black hover:brightness-110 active:scale-95 duration-150 transition-all cursor-pointer shadow-md select-none"
                  style={{ backgroundColor: accentColor }}
                >
                  Close Profile Dashboard
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
