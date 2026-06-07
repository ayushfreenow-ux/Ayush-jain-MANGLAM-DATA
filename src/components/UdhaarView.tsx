import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, LedgerEntry } from '../types';
import { 
  CreditCard, 
  Search, 
  Plus, 
  CheckCircle2, 
  History, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  ChevronRight, 
  TrendingUp, 
  IndianRupee,
  Download,
  AlertCircle,
  FileText,
  BadgeAlert,
  Send,
  MessageSquare,
  Camera,
  Image as ImageIcon,
  Trash2,
  Eye,
  Paperclip,
  X
} from 'lucide-react';

interface UdhaarViewProps {
  customers: Customer[];
  activeStoreKey: string;
  onRecordTransaction: (
    customerId: string, 
    type: 'Credit' | 'Payment', 
    amount: number, 
    mode?: string, 
    notes?: string,
    image?: string
  ) => void;
  onTriggerToast: (msg: string) => void;
  onUpdateCustomerImage?: (customerId: string, image: string) => void;
}

export default function UdhaarView({ 
  customers, 
  activeStoreKey, 
  onRecordTransaction, 
  onTriggerToast,
  onUpdateCustomerImage
}: UdhaarViewProps) {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithDues, setShowOnlyWithDues] = useState(true);
  
  // Specific Customer Selection for deep ledger tracking
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers.find(c => c.udhaar > 0)?.id || customers[0]?.id || ''
  );

  // Form states for new entry transactions
  const [entryType, setEntryType] = useState<'Credit' | 'Payment'>('Payment'); // Defaults to Payment (Repayment / जमा)
  const [amountInput, setAmountInput] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI / PhonePe / GPay');
  const [notesInput, setNotesInput] = useState('');
  const [billImageFile, setBillImageFile] = useState<string | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);

  // Selected customer model
  const selectedCust = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Derive metrics
  const totalOutstandingUdhaar = customers.reduce((sum, c) => sum + c.udhaar, 0);
  const debtorCount = customers.filter(c => c.udhaar > 0).length;

  // Search filter implementation
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDuesFilter = showOnlyWithDues ? c.udhaar > 0 : true;
    return matchesSearch && matchesDuesFilter;
  });

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;

    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      onTriggerToast('❌ Please enter a valid payment/credit amount!');
      return;
    }

    if (entryType === 'Payment' && amt > selectedCust.udhaar) {
      if (!confirm(`Warning: Payment amount (₹${amt}) is greater than outstanding udhaar (₹${selectedCust.udhaar}). Continue?`)) {
        return;
      }
    }

    // Call the parent callback to update system state
    onRecordTransaction(
      selectedCust.id,
      entryType,
      Math.round(amt),
      entryType === 'Payment' ? paymentMode : undefined,
      notesInput || (entryType === 'Payment' ? `Udhaar cleared via ${paymentMode}` : 'Manual credit purchase'),
      billImageFile || undefined
    );

    // Reset Form Input states
    setAmountInput('');
    setNotesInput('');
    setBillImageFile(null);
    onTriggerToast(`✅ Ledger successfully updated for ${selectedCust.name}!`);
  };

  // Automated WhatsApp Message builder for one-touch dispatching
  const getWhatsAppReminderLink = (cust: Customer) => {
    if (!cust) return '#';
    const cleanPhone = cust.phone.replace(/\D/g, '');
    
    const textMessage = `📊 *Manglam Vastralya (मंगलम वस्त्रालय) - Udhaar Reminder* 👕\n\n` +
      `Dear *${cust.name}*,\n` +
      `Your current outstanding *Udhaar balance* in our ledger is *₹${cust.udhaar.toLocaleString('en-IN')}*.\n\n` +
      `🙏 kindly clear your outstanding dues soon using direct UPI (PhonePe/GPay), Cash, or by visiting our store.\n\n` +
      `If you have already paid, please ignore this or send us a screenshot of your transaction.\n\n` +
      `Thank you for shopping with us! ✨`;

    return `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(textMessage)}`;
  };

  // Automated WhatsApp Repayment Receipt builder
  const getWhatsAppReceiptLink = (cust: Customer, amount: number, remains: number, mode: string) => {
    if (!cust) return '#';
    const cleanPhone = cust.phone.replace(/\D/g, '');
    const today = new Date().toLocaleDateString('en-IN');
    
    const receiptMessage = `✅ *Manglam Vastralya (मंगलम वस्त्रालय) - Payment Received* 🧾\n\n` +
      `Dear *${cust.name}*,\n` +
      `Thank you! We have successfully received and credited your payment in our customer ledger:\n\n` +
      `💰 *Amount Paid:* ₹${amount.toLocaleString('en-IN')}\n` +
      `💳 *Payment Mode:* ${mode}\n` +
      `📅 *Date:* ${today}\n\n` +
      `📉 *Remaining Balance:* *₹${remains.toLocaleString('en-IN')}*\n\n` +
      `Your ledger has been updated instantly. Thank you! 🙏✨`;

    return `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(receiptMessage)}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 font-sans"
    >
      {/* HEADER SECTION PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-display">
            <span className="text-lg">💰</span>
            Udhaar Credit Ledger Manager
          </h2>
          <p className="text-sm text-slate-550 mt-1">
            Track customer outstanding credits, record account repayments, view specific customer payment histories, and send direct WhatsApp reminders.
          </p>
        </div>
        <div className="flex bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-800 items-center gap-1.5 self-start md:self-center">
          <BadgeAlert size={15} className="text-amber-600 animate-pulse" />
          <span className="text-xs uppercase font-mono tracking-wider font-extrabold">{debtorCount} customers have active dues</span>
        </div>
      </div>

      {/* METRICS ROW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total outstanding credit balance */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full blur-2xl opacity-70 pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Credit</span>
            <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600 font-bold">₹</div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-rose-600 font-display tracking-tight">
              ₹{totalOutstandingUdhaar.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Total pending business capital stuck in market credit</p>
          </div>
        </div>

        {/* Active debtor accounts count */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-70 pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Credits Accounts</span>
            <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
              <User size={15} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-emerald-700 font-display tracking-tight">
              {debtorCount} Accounts
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Customers with non-zero outstanding balances</p>
          </div>
        </div>

        {/* Quick reminder help card */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-emerald-50/25 to-teal-50/25">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">One-Click Dispatch</span>
            <span className="text-lg">📲</span>
          </div>
          <div className="mt-3.5">
            <h4 className="text-sm font-bold text-slate-800">Direct WhatsApp Alerts</h4>
            <p className="text-xs text-slate-600 leading-normal mt-1">
              Select any customer below to generate pre-filled payments receipt and ledger balance messages of their records in one click.
            </p>
          </div>
        </div>
      </div>

      {/* CORE INTERACTIVE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CUSTOMERS DUERS LIST (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">Select Customer Account</h3>
            </div>
            
            {/* Search inputs */}
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, phone or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 hover:border-slate-350 transition-all outline-none text-slate-900 font-medium"
                />
              </div>

              {/* Dues filter toggle checkboxes */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnlyWithDues}
                  onChange={(e) => setShowOnlyWithDues(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                />
                <span className="text-xs font-semibold text-slate-600">Show only accounts with outstanding dues</span>
              </label>
            </div>

            {/* Scrollable list directory */}
            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto custom-scrollbar">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle size={22} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold font-sans">No matching customers found</p>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomerId === cust.id;
                  return (
                    <button
                      key={cust.id}
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setAmountInput('');
                        setNotesInput('');
                      }}
                      className={`w-full text-left p-3.5 flex justify-between items-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-teal-50/55 border-l-4 border-teal-600 font-bold' 
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 pr-2 flex-1 min-w-0">
                        {cust.image ? (
                          <img 
                            src={cust.image} 
                            alt={cust.name} 
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-teal-600/30 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0 uppercase">
                            {cust.name.split(' ').map(n=>n[0]).join('').substring(0, 2)}
                          </div>
                        )}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`${isSelected ? 'text-teal-950 font-extrabold' : 'text-slate-800'} text-xs font-bold truncate`}>
                              {cust.name}
                            </span>
                            {cust.tag === 'VIP' && (
                              <span className="text-[8px] px-1 bg-purple-50 text-purple-700 font-black tracking-wider border border-purple-200 uppercase rounded">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone size={10} className="shrink-0 text-slate-400" />
                            {cust.phone}
                          </p>
                          {cust.city && (
                            <p className="text-[9px] text-slate-400 flex items-center gap-1 font-medium">
                              <MapPin size={9} className="shrink-0" />
                              {cust.city} {cust.occupation && `• 💼 ${cust.occupation}`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                          cust.udhaar > 0 
                            ? 'bg-rose-50 text-rose-700' 
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          ₹{cust.udhaar.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[8px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                          {cust.udhaar > 0 ? 'Dues Outstanding' : 'All Clear'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED SPECIFIC CUSTOMER LEDGER STATEMENT & ACTIONS (lg:col-span-8) */}
        <div className="lg:col-span-8">
          {selectedCust ? (
            <div className="space-y-6">
              
              {/* TARGET CUSTOMER DOSSIER SUMMARY CARD */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative group shrink-0">
                      {selectedCust.image ? (
                        <img 
                          src={selectedCust.image} 
                          alt={selectedCust.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-teal-600 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center font-mono font-bold text-teal-700 text-xs uppercase">
                          {selectedCust.name.split(' ').map(n=>n[0]).join('').substring(0, 2)}
                        </div>
                      )}
                      
                      {/* Upload Photo Overlay Hover Button */}
                      <label className="absolute -bottom-1 -right-1 bg-teal-700 hover:bg-teal-850 text-white rounded-full p-1.5 border border-white cursor-pointer shadow shadow-teal-900/40 transition-all select-none hover:scale-110 active:scale-95 flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (onUpdateCustomerImage && typeof reader.result === 'string') {
                                  onUpdateCustomerImage(selectedCust.id, reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Camera size={10} />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                        {selectedCust.name}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest ${
                          selectedCust.udhaar > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {selectedCust.udhaar > 0 ? 'Dues Active' : 'All Clear'}
                        </span>
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={12} className="text-slate-400 shrink-0" />
                          {selectedCust.phone}
                        </span>
                        {selectedCust.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400 shrink-0" />
                            {selectedCust.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex flex-col items-center justify-center min-w-[140px]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Outstanding Balance</span>
                    <span className="text-2xl font-black font-mono tracking-tight mt-0.5">
                      ₹{selectedCust.udhaar.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-sans">
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Lifetime Store Business</span>
                    <span className="text-slate-700 font-bold text-sm block mt-0.5">₹{selectedCust.spent.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Customer Segment & Tag</span>
                    <span className="inline-block mt-0.5 font-bold tracking-wide uppercase px-2 py-0.5 text-[10px] rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all">
                      {selectedCust.tag} Customer
                    </span>
                  </div>
                  {selectedCust.notes && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Staff Ledger / Business Notes</span>
                      <p className="text-slate-600 mt-1 italic font-semibold leading-relaxed">
                        &ldquo;{selectedCust.notes}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* INTERACTIVE FORM PANEL: PAY OR DEBIT CREDIT RECORD */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  Quick Action: Record repayment or credit entry
                </h4>

                <form onSubmit={handleRecordSubmit} className="space-y-4 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Entry Type Select Option */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Transaction Type</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-250 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setEntryType('Payment')}
                          className={`py-1.5 px-3 rounded-md text-xs font-black uppercase text-center cursor-pointer transition-all ${
                            entryType === 'Payment' 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Received (जमा / Repay)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEntryType('Credit')}
                          className={`py-1.5 px-3 rounded-md text-xs font-black uppercase text-center cursor-pointer transition-all ${
                            entryType === 'Credit' 
                              ? 'bg-rose-600 text-white shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Given (उधार / Credit)
                        </button>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2 py-0.5 text-xs text-slate-500 font-black">₹</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          required
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          className="w-full bg-white border border-slate-350 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 hover:border-slate-400 outline-none font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Mode options (only if Payment is selected) */}
                  {entryType === 'Payment' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Payment Mode</label>
                      <div className="flex flex-wrap gap-2">
                        {['UPI / PhonePe / GPay', 'Cash (Nakad)', 'Cheque', 'Bank Transfer'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMode(m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border cursor-pointer transition-all ${
                              paymentMode === m 
                                ? 'bg-teal-550 border-teal-600 text-slate-900 font-black bg-teal-50' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Preset Quick buttons */}
                  {selectedCust.udhaar > 0 && (
                    <div className="flex gap-1.5 flex-wrap items-center">
                      <span className="text-[10px] font-bold text-slate-400">Quick Fill:</span>
                      {selectedCust.udhaar > 500 && (
                        <button
                          type="button"
                          onClick={() => setAmountInput('500')}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold border border-slate-200 text-slate-600 rounded cursor-pointer"
                        >
                          ₹500
                        </button>
                      )}
                      {selectedCust.udhaar > 1000 && (
                        <button
                          type="button"
                          onClick={() => setAmountInput('1000')}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold border border-slate-200 text-slate-600 rounded cursor-pointer"
                        >
                          ₹1000
                        </button>
                      )}
                      {selectedCust.udhaar > 2000 && (
                        <button
                          type="button"
                          onClick={() => setAmountInput('2000')}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold border border-slate-200 text-slate-600 rounded cursor-pointer"
                        >
                          ₹2000
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAmountInput(selectedCust.udhaar.toString());
                          setNotesInput(entryType === 'Payment' ? 'Full ledger dues repayment cleared' : '');
                        }}
                        className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-[10px] font-black border border-rose-200 text-rose-700 rounded cursor-pointer"
                      >
                        Pay Full ₹{selectedCust.udhaar} Dues
                      </button>
                    </div>
                  )}

                  {/* Statement Notes */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Particulars / Transaction Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Saree dues clear, Kurti buy, Cash payment etc..."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 hover:border-slate-400 outline-none text-slate-900 font-medium"
                    />
                  </div>

                  {/* Photo of Payment Bill Slip Attachment Option */}
                  <div className="border border-dashed border-slate-250 bg-slate-50/55 rounded-xl p-3.5 space-y-2">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-teal-600 shrink-0" />
                      Attach Slip Photo / Deposit Bill Screenshot
                    </label>
                    
                    {billImageFile ? (
                      <div className="flex items-center justify-between bg-white border border-slate-250 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={billImageFile} 
                            alt="Receipt thumb" 
                            className="w-11 h-11 object-cover rounded border border-slate-205 shadow-sm" 
                          />
                          <div>
                            <p className="text-[10px] font-bold text-slate-800">Slip_Attachment.png</p>
                            <p className="text-[8.5px] text-slate-450">Base64 transaction screenshot</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBillImageFile(null)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <label className="flex-1 py-1.5 px-3 border border-slate-300 hover:border-teal-600 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    setBillImageFile(reader.result);
                                    onTriggerToast("📸 Receipt bill photo attached!");
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Camera size={13} className="text-slate-500" />
                          <span>Upload / Capture Photo</span>
                        </label>
                        
                        <button
                          type="button"
                          onClick={() => {
                            // Professional test clip representation
                            const dummyReceipt = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAG1pVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowMjozMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1Jlc291cmNlIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjREQjA5ODYyRUUzNjExRThCQUIzQzE5MTMyRDc5REQyIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjREQjA5ODYxRUUzNjExRThCQUIzQzE5MTMyRDc5REQyIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE3IChNYWNpbnRvc2gpIj4gPHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NERCMDk4NjBFRTM2MTFFOEJBQjNDMTkxMzJENzlERDIiLyA8c3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpIQUIwOTg1OUVFMzYxMUU4QkFCM0MxOTEzMkQ3OUREMiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuM7FNAAAAGCSURBVHgB7dKxSgNBFIXhM7vEIrZWFqK9vYVgYWFtbe0tbK0iFhasbK6vYC0pLG0E8QQWFvYpAsIiIom7K3gK899bCEnIFCHzZ96A8b6W3p97587sNAs6vDaeX2/T2Uv609m9992o5629XwSBMmQW70M4O0gCWWm9I1NWy6WbT9y89A3W+e+L4+X7D0fL+9+Plnff7C0u3+6CjZAhs7h5HcL63pFr3pIpxaWbybXGidM3g8U9EAnZ2F66OnNlS4vLt7pA0shWshXCSvI8pJKp/bL3uLwAETJkdAeyuX30YenKlG6uXbyCRAiRkInXN9+XWshW6e7S6fIn9T+yQv6RIWQIETJkCBEyZAglvT4vW4qgECIIECEIECEDKOnmZaU0GgSFIBAECEKGCCOEkAECQYAgZAghZAghZID0f0P+bgiRIUQIERQiCBCEDEIEhRABIkDIEAgiQ6gIQRD9B0H0PwhB9B8EIYMgBEEgCBiEIDpBECJCEIQQBBlCDf0VYAActN6E0vIidQAAAABJRU5ErkJggg==";
                            setBillImageFile(dummyReceipt);
                            onTriggerToast("📝 Pre-filled camera demo slip added!");
                          }}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-[10px] font-black text-slate-700 cursor-pointer active:scale-95 shrink-0 transition-colors"
                          title="Generate sample payment receipt image instantly"
                        >
                          Demo Capture 🖼️
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded-xl text-xs font-black uppercase text-center transition-colors cursor-pointer text-white shadow-md select-none ${
                      entryType === 'Payment' 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                    }`}
                  >
                    Commit {entryType === 'Payment' ? 'Repayment Deposit' : 'Credit Dues'} Entry 💰
                  </button>
                </form>
              </div>

              {/* QUICK DISPATCH SECTION: WHATSAPP SHARES & CORRESPONDENCE */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <MessageSquare size={14} className="text-slate-400" />
                  📱 One-Click WhatsApp Correspondence
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Balance Dues Reminders Card */}
                  <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between items-start bg-slate-50/50 hover:border-teal-500 transition-all">
                    <div>
                      <span className="text-[9px] font-black uppercase bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded tracking-widest">
                        Dues Reminder
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 mt-2">Dues Reminder Notice</h5>
                      <p className="text-[10px] text-slate-500 leading-normal mt-1 mb-3">
                        Drafts a professional balance notice requesting GPay/ATM deposits.
                      </p>
                    </div>
                    <a
                      href={getWhatsAppReminderLink(selectedCust)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-center text-xs font-black tracking-normal transition-colors flex items-center justify-center gap-1.5 self-end"
                      onClick={() => onTriggerToast(`📲 Dues reminder opened with ${selectedCust.name}`)}
                    >
                      Send Dues Alert 💬
                    </a>
                  </div>

                  {/* Payment Receipt Acknowledgements Card */}
                  <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between items-start bg-slate-50/50 hover:border-teal-500 transition-all">
                    <div>
                      <span className="text-[9px] font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded tracking-widest">
                        Receipt Dispatch
                      </span>
                      <h5 className="text-xs font-bold text-slate-800 mt-2">Repayment Receipt Dispatch</h5>
                      <p className="text-[10px] text-slate-500 leading-normal mt-1 mb-3">
                        Generates an acknowledgement receipt for their last transaction.
                      </p>
                    </div>
                    <a
                      href={getWhatsAppReceiptLink(
                        selectedCust, 
                        selectedCust.ledger?.filter(l=>l.type==='Payment').pop()?.amount || 0,
                        selectedCust.udhaar,
                        selectedCust.ledger?.filter(l=>l.type==='Payment').pop()?.mode || 'GPay'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-center text-xs font-black tracking-normal transition-colors flex items-center justify-center gap-1.5 self-end"
                      onClick={() => onTriggerToast(`📲 Receipt dispatch opened with ${selectedCust.name}`)}
                    >
                      Send Last Receipt 💬
                    </a>
                  </div>
                </div>
              </div>

              {/* CHRONOLOGICAL CUSTOMER LEDGER STATEMENT TIMELINE */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <History size={14} className="text-teal-700" />
                    Ledger Statement Transaction History
                  </h3>
                  <button
                    onClick={() => {
                      onTriggerToast('⬇️ Exporting ledger statement to client terminal...');
                      alert(`Ledger Exported:\nCustomer: ${selectedCust.name}\nTotal Dues: ₹${selectedCust.udhaar}\nEntries: ${(selectedCust.ledger || []).length}`);
                    }}
                    className="flex items-center gap-1 text-[10px] bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-1 px-2 rounded-lg font-bold cursor-pointer transition-all"
                  >
                    <Download size={10} />
                    Export Ledger PDF
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap font-sans">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-505 text-[10px] border-b border-slate-200 font-bold tracking-wider uppercase">
                        <th className="py-3 px-5">DATE</th>
                        <th className="py-3 px-5">TRANSACTION ID</th>
                        <th className="py-3 px-5 text-center">TYPE</th>
                        <th className="py-3 px-5">PARTICULARS / REMARKS</th>
                        <th className="py-3 px-5 text-right">CREDIT AMOUNT (DEBT)</th>
                        <th className="py-3 px-5 text-right">DEPOSIT AMOUNT (PAID)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {!selectedCust.ledger || selectedCust.ledger.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 px-5 text-center text-slate-400 italic">
                            No ledger history found. Record a payment or credit above to begin ledger track.
                          </td>
                        </tr>
                      ) : (
                        [...selectedCust.ledger].reverse().map((led, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="py-3 px-5 font-mono text-slate-500 font-bold">{led.date}</td>
                            <td className="py-3 px-5 font-mono font-bold text-[10px] uppercase text-slate-400">{led.id}</td>
                            <td className="py-3 px-5 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                                led.type === 'Credit' 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-250/50' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-250/50'
                              }`}>
                                {led.type === 'Credit' ? 'उधार Credit' : 'जमा Payment'}
                              </span>
                            </td>
                            <td className="py-3 px-5 max-w-xs overflow-hidden text-ellipsis font-bold text-slate-800">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{led.notes}</span>
                                  {led.image && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingSlipUrl(led.image || null);
                                        onTriggerToast("🔍 Opening attached slip/bill copy...");
                                      }}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[10px] text-teal-800 hover:bg-teal-100 transition-all font-black select-none pointer-events-auto cursor-pointer"
                                    >
                                      <Eye size={10} />
                                      <span>पर्ची Slip</span>
                                    </button>
                                  )}
                                </div>
                                {led.mode && <span className="text-[9px] text-slate-400 font-normal">Method: {led.mode}</span>}
                                {led.billNo && <span className="text-[9px] text-teal-600 font-bold font-mono">Invoice Reference: {led.billNo}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-5 text-right font-mono font-black text-rose-600">
                              {led.type === 'Credit' ? `+ ₹${led.amount.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="py-3 px-5 text-right font-mono font-black text-emerald-600">
                              {led.type === 'Payment' ? `— ₹${led.amount.toLocaleString('en-IN')}` : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-sans shadow-sm">
              <User size={32} className="mx-auto text-slate-350 mb-3" />
              <h3 className="text-sm font-bold text-slate-750">No customer ledger selected</h3>
              <p className="text-xs text-slate-500 mt-1">Select a customer's folder profile on the left sidebar directory to review balance history logs.</p>
            </div>
          )}
        </div>

      </div>

      {/* Attached slip image full view overlay dialog popup */}
      <AnimatePresence>
        {viewingSlipUrl && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl relative"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 font-sans">
                <h4 className="text-xs font-black text-slate-850 uppercase tracking-widest font-sans flex items-center gap-1">
                  📸 Attached Slip Copy (रसीद पर्ची)
                </h4>
                <button
                  onClick={() => setViewingSlipUrl(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 flex justify-center bg-slate-900 border-b border-slate-200">
                <img 
                  src={viewingSlipUrl} 
                  alt="Full Slip screenshot" 
                  className="max-h-[300px] w-auto object-contain rounded shadow border border-slate-700 bg-white" 
                />
              </div>
              <div className="p-3.5 bg-slate-100 text-center font-sans">
                <button
                  onClick={() => setViewingSlipUrl(null)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
