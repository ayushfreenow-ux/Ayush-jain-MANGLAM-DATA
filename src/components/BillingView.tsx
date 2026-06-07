import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreState, Customer, BillType, PaymentMode } from '../types';
import { 
  FileText, 
  Trash2, 
  Plus, 
  UploadCloud, 
  Search, 
  Check, 
  Clipboard,
  Calendar,
  AlertCircle,
  Coins,
  CreditCard,
  Printer,
  FileImage,
  X,
  Sparkles,
  Info
} from 'lucide-react';

interface BillingViewProps {
  store: StoreState;
  activeStoreKey: string;
  onAddBill: (
    billAmount: number,
    itemsCount: number,
    customerName: string,
    billNo: string,
    paymentStatus: 'Paid' | 'Cash' | 'UPI' | 'Udhaar',
    billType: string,
    items?: any[],
    notes?: string,
    hasWrittenSlip?: boolean,
    slipNotesText?: string
  ) => void;
  onNavigate: (pageId: string) => void;
  onTriggerToast?: (msg: string) => void;
}

interface BillItemRow {
  id: number;
  name: string;
  variant: string;
  qty: number;
  rate: number;
  unit: 'Pcs' | 'Mtr';
}

export default function BillingView({ store, activeStoreKey, onAddBill, onNavigate, onTriggerToast }: BillingViewProps) {
  const accentColor = '#0f765e'; // Consistent Manglam Vastralya retail teal tone

  // Form states
  const [billType, setBillType] = useState<BillType>('Sale Bill (Bikri)');
  const [payMode, setPayMode] = useState<PaymentMode>('Cash (Nakad)');
  const [discount, setDiscount] = useState<number>(0);

  // UPI payment configuration states
  const [upiId, setUpiId] = useState<string>(() => {
    return localStorage.getItem('manglam_upi_id') || 'manglamvastralya@okaxis';
  });
  const [upiName, setUpiName] = useState<string>(() => {
    return localStorage.getItem('manglam_upi_name') || 'Manglam Vastralya';
  });
  const [showUpiConfig, setShowUpiConfig] = useState<boolean>(false);
  const [isUpiPaidSimulated, setIsUpiPaidSimulated] = useState<boolean>(false);

  // Auto-save UPI details
  useEffect(() => {
    localStorage.setItem('manglam_upi_id', upiId);
  }, [upiId]);

  useEffect(() => {
    localStorage.setItem('manglam_upi_name', upiName);
  }, [upiName]);
  const [notes, setNotes] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [showCustDropdown, setShowCustDropdown] = useState<boolean>(false);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Hand-written paper slips state records
  const [hasWrittenSlip, setHasWrittenSlip] = useState<boolean>(false);
  const [slipNotesText, setSlipNotesText] = useState<string>('');
  const [slipImageMock, setSlipImageMock] = useState<string | null>(null);

  // Bill currently loaded in thermal print dialog previewer
  const [activePrintBill, setActivePrintBill] = useState<any | null>(null);
  const [isHindiBill, setIsHindiBill] = useState<boolean>(false);

  // Invoice Number
  const [invoiceNo, setInvoiceNo] = useState<string>(`SM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`);

  // Dynamic Item Rows
  const [rows, setRows] = useState<BillItemRow[]>([
    { id: 1, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' },
    { id: 2, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' }
  ]);
  const [rowCounter, setRowCounter] = useState<number>(3);

  // Load and save draft from localStorage to prevent data loss on browser refresh
  const [isDraftLoaded, setIsDraftLoaded] = useState<boolean>(false);

  useEffect(() => {
    setIsDraftLoaded(false);
    try {
      const saved = localStorage.getItem(`manglam_billing_draft_${activeStoreKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.billType) setBillType(parsed.billType);
        if (parsed.payMode) setPayMode(parsed.payMode);
        if (typeof parsed.discount === 'number') setDiscount(parsed.discount);
        if (typeof parsed.notes === 'string') setNotes(parsed.notes);
        if (typeof parsed.customerSearch === 'string') setCustomerSearch(parsed.customerSearch);
        setSelectedCust(parsed.selectedCust || null);
        if (typeof parsed.hasWrittenSlip === 'boolean') setHasWrittenSlip(parsed.hasWrittenSlip);
        if (typeof parsed.slipNotesText === 'string') setSlipNotesText(parsed.slipNotesText);
        if (parsed.invoiceNo) setInvoiceNo(parsed.invoiceNo);
        if (Array.isArray(parsed.rows)) {
          setRows(parsed.rows);
          if (typeof parsed.rowCounter === 'number') {
            setRowCounter(parsed.rowCounter);
          } else {
            const maxId = Math.max(...parsed.rows.map((r: any) => r.id || 0), 1) + 1;
            setRowCounter(maxId);
          }
        }
      } else {
        // Reset to clean states if no draft exists
        setBillType('Sale Bill (Bikri)');
        setPayMode('Cash (Nakad)');
        setDiscount(0);
        setNotes('');
        setCustomerSearch('');
        setSelectedCust(null);
        setHasWrittenSlip(false);
        setSlipNotesText('');
        setInvoiceNo(`SM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`);
        setRows([
          { id: 1, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' },
          { id: 2, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' }
        ]);
        setRowCounter(3);
      }
    } catch (err) {
      console.error('Error loading billing draft:', err);
    } finally {
      setIsDraftLoaded(true);
    }
  }, [activeStoreKey]);

  // Keep the latest draft states up-to-date in a reference to avoid stale state in the interval closure
  const lastDraftRef = useRef<any>(null);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string>('');
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  useEffect(() => {
    lastDraftRef.current = {
      billType,
      payMode,
      discount,
      notes,
      customerSearch,
      selectedCust,
      hasWrittenSlip,
      slipNotesText,
      invoiceNo,
      rows,
      rowCounter,
    };
  }, [
    billType,
    payMode,
    discount,
    notes,
    customerSearch,
    selectedCust,
    hasWrittenSlip,
    slipNotesText,
    invoiceNo,
    rows,
    rowCounter,
  ]);

  // Periodic Auto-Save Every 5 Seconds
  useEffect(() => {
    if (!isDraftLoaded) return;

    // Direct initial sync when store draft is loaded / switched
    if (lastDraftRef.current) {
      try {
        localStorage.setItem(`manglam_billing_draft_${activeStoreKey}`, JSON.stringify(lastDraftRef.current));
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        setLastAutoSavedTime(timeStr);
      } catch (e) {
        console.error('Initial draft sync failed:', e);
      }
    }

    const interval = setInterval(() => {
      if (lastDraftRef.current) {
        try {
          setIsAutoSaving(true);
          localStorage.setItem(`manglam_billing_draft_${activeStoreKey}`, JSON.stringify(lastDraftRef.current));
          
          const now = new Date();
          const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS format
          setLastAutoSavedTime(timeStr);
          
          setTimeout(() => {
            setIsAutoSaving(false);
          }, 800);
        } catch (e) {
          console.error('Auto-save failed:', e);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeStoreKey, isDraftLoaded]);

  // Helpers
  const triggerToastLocal = (msg: string) => {
    if (onTriggerToast) {
      onTriggerToast(msg);
    } else {
      console.log(msg);
    }
  };

  // Live parent bills feed
  const recentBills = store.bills;

  // AI OCR simulator
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);

  // Filter customers during search
  const filteredCustomers = store.customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  // Ref and handler to scroll the product matrix table horizontally on mobile devices easily
  const horizontalScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (direction: 'left' | 'right') => {
    if (horizontalScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      horizontalScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const addRow = () => {
    setRows([...rows, { id: rowCounter, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' }]);
    setRowCounter(rowCounter + 1);
  };

  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: number, field: keyof BillItemRow, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Pre-fill fields if item matches inventory name
  const handledItemSelect = (id: number, itemName: string) => {
    const matchedItem = store.inventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    if (matchedItem) {
      updateRow(id, 'name', matchedItem.name);
      updateRow(id, 'variant', matchedItem.variant);
      updateRow(id, 'rate', matchedItem.rate);
    } else {
      updateRow(id, 'name', itemName);
    }
  };

  // Safe Math
  const subTotal = rows.reduce((sum, r) => sum + (r.qty * r.rate), 0);
  const discountAmount = subTotal * (discount / 100);
  const finalTotal = Math.max(0, subTotal - discountAmount);

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customerLabel = selectedCust ? selectedCust.name : (customerSearch ? customerSearch : 'Walk-in Customer');
    
    // Evaluate payment status & billing type
    const paymentStatus: 'Paid' | 'Cash' | 'UPI' | 'Udhaar' = payMode.includes('Credit') 
      ? 'Udhaar' 
      : (payMode.includes('UPI') 
        ? 'UPI' 
        : (payMode.includes('Cash') ? 'Cash' : 'Paid'));

    const bType = billType.includes('Sale') ? 'Sale' : (billType.includes('Purchase') ? 'Purchase' : 'Return');

    // Create a backup list of items to store inside the bill record
    const savedItems = rows.map(r => ({
      name: r.name || 'Unlabeled Textile Piece',
      variant: r.variant || 'Standard',
      qty: r.qty,
      rate: r.rate,
      unit: r.unit
    }));

    // Bubble up to trigger application states & show notification
    onAddBill(finalTotal, rows.length, customerLabel, invoiceNo, paymentStatus, bType, savedItems, notes, hasWrittenSlip, slipNotesText);

    // Show a small thermal preview automatically for convenience!
    setActivePrintBill({
      billNo: invoiceNo,
      customerName: customerLabel,
      amount: finalTotal,
      status: paymentStatus,
      type: bType,
      items: savedItems,
      date: billDate,
      notes: notes,
      hasWrittenSlip: hasWrittenSlip,
      slipNotesText: slipNotesText
    });

    // Reset Bill Composer & invoice number
    setInvoiceNo(`SM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`);
    setRows([
      { id: rowCounter, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' },
      { id: rowCounter + 1, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' }
    ]);
    setRowCounter(rowCounter + 2);
    setDiscount(0);
    setNotes('');
    setCustomerSearch('');
    setSelectedCust(null);
    setHasWrittenSlip(false);
    setSlipNotesText('');
    setSlipImageMock(null);
    setIsUpiPaidSimulated(false);

    // Clear saved invoice draft from localStorage for this store
    localStorage.removeItem(`manglam_billing_draft_${activeStoreKey}`);

    triggerToastLocal('🧾 Saved bill of Manglam Vastralya & spooled thermal receipt sheet!');
  };

  // Simulated AI receipt reading
  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsOcrProcessing(true);
      setTimeout(() => {
        setIsOcrProcessing(false);
        // Autofill rows with clothing store template values
        setRows([
          { id: 101, name: 'Fancy Banarasi Saree', variant: 'Silk · Red-Gold', qty: 1, rate: 2850, unit: 'Pcs' },
          { id: 102, name: 'Cotton suit pieces fabric', variant: 'Unstitched', qty: 4.5, rate: 180, unit: 'Mtr' }
        ]);
        setPayMode('Cash (Nakad)');
        setNotes('Digitized printed paper counter receipt via AI OCR');
        triggerToastLocal('✨ OCR Extracted: 1x Banarasi Saree, 4.5 Meters Cotton Fabric!');
      }, 1500);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-205 pb-5">
        <div>
          <span className="text-[10px] bg-teal-50 text-teal-800 border border-teal-200 font-bold px-2.5 py-1 rounded">
            👕 Saree • Suit Pieces • Lehenga • Ready Garments Retail ERP v2.1
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-display mt-2">
            <span className="text-lg">🧾</span>
            Manglam Vastralya Invoice Center
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create fast bills, track yardage (meters), record physical hand Slips, and print counter receipts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastAutoSavedTime && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[10px] select-none shadow-sm font-mono font-bold">
              <span className="relative flex h-2 w-2">
                {isAutoSaving && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoSaving ? 'bg-teal-500' : 'bg-emerald-500'}`}></span>
              </span>
              <span>
                {isAutoSaving ? 'Auto-saving...' : `Saved ${lastAutoSavedTime}`}
              </span>
            </div>
          )}
          <button 
            type="button"
            onClick={() => onNavigate('reports')}
            className="text-xs bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg font-bold shadow-sm cursor-pointer transition-colors"
          >
            📊 View Summaries
          </button>
        </div>
      </div>

      {/* TOP WORKFLOW SELECTOR: CASH BILL vs CREDIT BILL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash Bill Path */}
        <button
          type="button"
          onClick={() => {
            setPayMode('Cash (Nakad)');
            setBillType('Sale Bill (Bikri)');
            triggerToastLocal('⚡ Cash Bill selected (नकद पर्ची / तुरंत नगद भुगतान)');
          }}
          className={`p-4 rounded-xl border-2 text-left flex items-start gap-3.5 transition-all cursor-pointer ${
            payMode !== 'Credit (Udhaar)'
              ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-bold shadow-md ring-2 ring-emerald-500/10'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
          }`}
        >
          <div className={`p-2.5 rounded-lg ${payMode !== 'Credit (Udhaar)' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            <Coins size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block font-bold text-emerald-700">Recommended for Walkins</span>
            <span className="text-sm font-extrabold block">⚡ CASH BILL (नकद पर्ची)</span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Instant payment via Counter Cash, UPI PhonePe or GPay</p>
          </div>
        </button>

        {/* Credit Bill Path */}
        <button
          type="button"
          onClick={() => {
            setPayMode('Credit (Udhaar)');
            setBillType('Sale Bill (Bikri)');
            triggerToastLocal('🔴 Credit Bill selected (उधार पर्ची / खाता प्रविष्टि)');
          }}
          className={`p-4 rounded-xl border-2 text-left flex items-start gap-3.5 transition-all cursor-pointer ${
            payMode === 'Credit (Udhaar)'
              ? 'border-rose-600 bg-rose-50/40 text-rose-950 font-bold shadow-md ring-2 ring-rose-500/10'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
          }`}
        >
          <div className={`p-2.5 rounded-lg ${payMode === 'Credit (Udhaar)' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            <CreditCard size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider block font-bold text-rose-700">Account ledger entry</span>
            <span className="text-sm font-extrabold block">🔴 CREDIT BILL (उधार पर्ची)</span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Assigned to customer's balance. Dues logged in active Udhaar ledger.</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bill Composer (span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveBill} className="space-y-6">
            
            {/* Form Section 1: Bill Settings */}
            <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
              payMode === 'Credit (Udhaar)' ? 'border-rose-200 ring-2 ring-rose-100/50' : 'border-slate-200'
            }`}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {payMode === 'Credit (Udhaar)' ? '🔴 CREDIT (उधार) CONFIGURATION' : '⚡ CASH (नकद) CONFIGURATION'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">INVOICE: #{invoiceNo}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Bill Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Bill Type</label>
                  <select 
                    value={billType}
                    onChange={(e) => setBillType(e.target.value as BillType)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.8 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold"
                  >
                    <option value="Sale Bill (Bikri)">Sale Bill (Bikri)</option>
                    <option value="Purchase Bill (Kharid)">Purchase Bill (Kharid)</option>
                    <option value="Return Bill (Wapsi)">Return Bill (Wapsi)</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Bill Date</label>
                  <input 
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.8 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium"
                  />
                </div>

                {/* Bill ID */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 block">Counter Slip ID</label>
                    <button 
                      type="button" 
                      onClick={() => setInvoiceNo(`SM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`)}
                      className="text-[9px] font-black text-teal-700 hover:underline cursor-pointer"
                    >
                      🔄 Reset Auto
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. SM-2026-100"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.8 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                {/* Payment Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Payment Mode</label>
                  <select 
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.8 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold"
                  >
                    <option value="Cash (Nakad)">Cash (Nakad)</option>
                    <option value="UPI / PhonePe / GPay">UPI / GPay</option>
                    <option value="Credit (Udhaar)">Credit (Udhaar)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Customer search selection block */}
              <div className="mt-5 relative">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-600">
                    Associate Customer <span className="text-slate-400">{payMode === 'Credit (Udhaar)' ? '(Required for Credit Bills)' : '(Optional)'}</span>
                  </label>
                  {payMode === 'Credit (Udhaar)' && !selectedCust && (
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      ⚠️ Credit needs a real client account linked
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-450">
                    <Search size={14} />
                  </span>
                  <input 
                    type="text"
                    value={customerSearch}
                    required={payMode === 'Credit (Udhaar)'}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustDropdown(true);
                      if (selectedCust) setSelectedCust(null);
                    }}
                    onFocus={() => setShowCustDropdown(true)}
                    placeholder={
                      payMode === 'Credit (Udhaar)' 
                        ? 'Type to search registered clients (उधार के लिए ग्राहक चुनें)...' 
                        : 'Search by customer name or mobile number... (Walk-in allowed for cash bills)'
                    }
                    className={`w-full bg-white border rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 outline-none font-medium ${
                      payMode === 'Credit (Udhaar)' && !selectedCust 
                        ? 'border-rose-350 focus:ring-rose-500/20 focus:border-rose-500' 
                        : 'border-slate-350 focus:ring-teal-500/20 focus:border-teal-600'
                    }`}
                  />
                  {selectedCust && (
                    <span className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-250 px-2.5 py-0.5 rounded-md font-bold">
                      <Check size={11} className="text-emerald-700" /> Account Linked
                    </span>
                  )}
                </div>

                {/* Suggestion Dropdown */}
                {showCustDropdown && customerSearch.length >= 1 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <div 
                          key={c.id}
                          onClick={() => {
                            setSelectedCust(c);
                            setCustomerSearch(c.name);
                            setShowCustDropdown(false);
                          }}
                          className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-left text-xs text-slate-700 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">{c.phone || 'No phone'} • {c.city || 'Indore'}</span>
                          </div>
                          {c.udhaar > 0 && (
                            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-300 px-2 py-0.5 rounded font-bold">
                              Udhaar: ₹{c.udhaar.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500 flex justify-between items-center">
                        <span>No customer matched.</span>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('customers');
                            triggerToastLocal("Opening customer directory...");
                          }}
                          className="text-[11px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded shadow-sm"
                        >
                          + Add Client Account
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* HANDWRITTEN SLIP RECORDING SECTION */}
              <div className="mt-5 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <FileImage size={16} className="text-teal-700" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">
                        Record Written Slip (हस्तलिखित पर्ची जोडें)
                      </h5>
                      <p className="text-[10px] text-slate-500">Attach details or snap photos of counter pencil slates</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasWrittenSlip} 
                      onChange={(e) => setHasWrittenSlip(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                <AnimatePresence>
                  {hasWrittenSlip && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3.5 space-y-3.5 mt-2 border-t border-slate-200/60">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-655 block mb-1">Written Slip Reference No. (पर्ची क्रमांक / कार्बन कॉपी)</label>
                            <input 
                              type="text"
                              value={slipNotesText}
                              onChange={(e) => setSlipNotesText(e.target.value)}
                              placeholder="e.g. Red book pencil entry #044"
                              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-teal-600 font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-655 block mb-1">Attached Scribe Image</label>
                            <div className="flex gap-2">
                              {slipImageMock ? (
                                <div className="p-1 px-3 bg-emerald-50 text-emerald-800 border border-emerald-250 text-xs rounded font-bold flex items-center justify-between w-full">
                                  <span className="truncate">📋 written_slip_snapped.png</span>
                                  <button 
                                    type="button" 
                                    onClick={() => setSlipImageMock(null)}
                                    className="text-rose-600 font-bold hover:text-rose-800 font-sans"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSlipImageMock("simulated_url");
                                    triggerToastLocal("📸 Counter pencil carbon slip successfully matched & indexed!");
                                  }}
                                  className="w-full text-center border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 py-1.5 rounded text-xs font-bold transition-colors"
                                >
                                  📷 Upload Written Paper Image
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {slipImageMock && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-2.5 flex items-center gap-2">
                            <span className="text-sm">📝</span>
                            <p className="text-[10px] text-amber-900 font-medium leading-normal">
                              <strong>Written Slip Switched ON:</strong> Physical graphite text matches live values. Image metadata has been logged under invoice #{invoiceNo} securely.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Upload billing camera card simulator */}
              <div className="mt-4 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 transition-all">
                <div className="flex gap-2 items-center">
                  <div className="text-slate-500">
                    <UploadCloud size={16} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">Use AI OCR Scan instead</h5>
                    <p className="text-[10px] text-slate-500">Autofill items instantly from a photo of a written slip receipt</p>
                  </div>
                </div>
                <label className="text-[10px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-2.5 py-1 rounded cursor-pointer transition-colors text-center shrink-0">
                  {isOcrProcessing ? 'Reading Picture...' : '📸 AI Slip Scan'}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleOcrFileSelect}
                    disabled={isOcrProcessing}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Form Section 2: Bill Item Grid */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 shadow-none">
                  Transactions Row Item Matrix
                </h3>
                <button 
                  type="button"
                  onClick={addRow}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1 flex items-center gap-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>

              {/* Mobile optimized scroll helper bar & tactile tap-scroll assistance */}
              <div className="md:hidden bg-amber-50/60 border-b border-slate-200 px-4 py-2.5 text-[11px] text-amber-900 font-sans flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1 font-bold">
                  <span>📱</span>
                  <span>Swipe to scroll, or tap helpers to slide table columns:</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollContainer('left')}
                    className="h-7 px-2 bg-white border border-slate-350 rounded text-slate-700 hover:bg-slate-50 font-black text-[10px] select-none active:scale-95 cursor-pointer shadow-sm"
                    title="Slide Table Left"
                  >
                    ◀ Left
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollContainer('right')}
                    className="h-7 px-2 bg-white border border-slate-350 rounded text-slate-700 hover:bg-slate-50 font-black text-[10px] select-none active:scale-95 cursor-pointer shadow-sm"
                    title="Slide Table Right"
                  >
                    Right ▶
                  </button>
                </div>
              </div>

              <div ref={horizontalScrollRef} className="overflow-x-auto font-sans scroll-smooth">
                <table className="w-full text-left text-xs whitespace-nowrap min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50/40 border-b border-slate-200 font-bold">
                      <th className="py-2.5 px-4 font-bold text-slate-500">PRODUCT NAME</th>
                      <th className="py-2.5 px-4 font-bold text-slate-500">VARIANT / MARK</th>
                      <th className="py-2.5 px-4 font-bold text-slate-500 w-28 text-center">UNIT MODE</th>
                      <th className="py-2.5 px-4 font-bold text-slate-500 w-24 text-center">QTY / METERS</th>
                      <th className="py-2.5 px-3 font-bold text-slate-500 w-28 text-right">RATE (₹)</th>
                      <th className="py-2.5 px-4 font-bold text-slate-500 w-24 text-right">SUBTOTAL</th>
                      <th className="py-2.5 px-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence initial={false}>
                      {rows.map((row) => (
                        <motion.tr 
                           key={row.id}
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: "auto" }}
                           exit={{ opacity: 0, height: 0 }}
                           className="hover:bg-slate-50"
                        >
                          {/* Item Search Input */}
                          <td className="py-3 px-4">
                            <input 
                              type="text"
                              value={row.name}
                              onChange={(e) => handledItemSelect(row.id, e.target.value)}
                              placeholder="e.g. Silk Saree, Lehenga, suit piece fabric..."
                              required
                              className="w-full bg-white border border-slate-350 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-medium"
                            />
                          </td>

                          {/* Variant Attribute */}
                          <td className="py-3 px-4">
                            <input 
                              type="text"
                              value={row.variant}
                              onChange={(e) => updateRow(row.id, 'variant', e.target.value)}
                              placeholder="e.g. Red / Banarasi"
                              className="w-full bg-white border border-slate-350 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-450 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-medium"
                            />
                          </td>

                          {/* Unit Mode Selector */}
                          <td className="py-3 px-4">
                            <select
                              value={row.unit || 'Pcs'}
                              onChange={(e) => {
                                const newUnit = e.target.value as 'Pcs' | 'Mtr';
                                updateRow(row.id, 'unit', newUnit);
                                triggerToastLocal(`Switched item to ${newUnit === 'Mtr' ? 'Meter (कपड़ा माप)' : 'Piece (पीस)'}`);
                              }}
                              className="w-full bg-white border border-slate-350 rounded px-2.5 py-1.5 text-xs text-slate-900 font-bold outline-none cursor-pointer focus:ring-1 focus:ring-teal-500 focus:border-teal-600"
                            >
                              <option value="Pcs">Piece (पीस)</option>
                              <option value="Mtr">Meter (मीटर)</option>
                            </select>
                          </td>

                          {/* Qty (Decimal for Meter) */}
                          <td className="py-3 px-4">
                            <input 
                              type="number"
                              min="0.01"
                              step="any"
                              inputMode="decimal"
                              value={row.qty || ''}
                              onChange={(e) => updateRow(row.id, 'qty', parseFloat(e.target.value) || 0)}
                              placeholder={row.unit === 'Mtr' ? "4.5" : "1"}
                              className="w-full bg-white border border-slate-355 rounded px-2.5 py-1.5 text-xs text-slate-900 text-center font-bold outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600"
                            />
                          </td>

                          {/* Rate price */}
                          <td className="py-3 px-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono">₹</span>
                              <input 
                                type="number"
                                min="0"
                                inputMode="numeric"
                                value={row.rate || ''}
                                onChange={(e) => updateRow(row.id, 'rate', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full bg-white border border-slate-355 rounded pl-6 pr-2 py-1.5 text-xs text-slate-900 text-right font-mono outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600"
                              />
                            </div>
                          </td>

                          {/* Subtotal */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                            ₹{Math.round(row.qty * row.rate).toLocaleString('en-IN')}
                          </td>

                          {/* Clear Row */}
                          <td className="py-3 px-4 text-center">
                            <button 
                              type="button"
                              onClick={() => removeRow(row.id)}
                              disabled={rows.length === 1}
                              className="text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Discount blocks */}
              <div className="p-5 border-t border-slate-200 bg-slate-50/50">
                <div className={`grid grid-cols-1 gap-4 ${
                  payMode === 'UPI / PhonePe / GPay' ? 'md:grid-cols-3' : 'sm:grid-cols-2'
                }`}>
                  {/* Notes */}
                  <div className="space-y-1.5 flex flex-col justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-600">Internal Counter Remarks (Memo Notes)</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Saree design book notes, lehenga delivery details or partial payment references..."
                        className="w-full h-24 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 resize-none outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-medium"
                      />
                    </div>
                    {payMode !== 'UPI / PhonePe / GPay' && (
                      <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-1 mt-1 text-[10px] text-slate-600 mt-auto">
                        <span className="font-semibold text-slate-700">💡 Customer prefers online pay?</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPayMode('UPI / PhonePe / GPay');
                            triggerToastLocal("🔄 Switched pay mode to UPI & rendered payment QR code terminal.");
                          }}
                          className="text-[10px] text-teal-800 hover:text-teal-900 font-extrabold bg-white border border-slate-250 px-2 py-0.5 rounded shadow-sm hover:bg-slate-50 cursor-pointer"
                        >
                          Generate UPI QR
                        </button>
                      </div>
                    )}
                  </div>

                  {/* UPI QR Code columns (only if UPI selected) */}
                  {payMode === 'UPI / PhonePe / GPay' && (
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600" />
                      
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">📲</span>
                          <h4 className="text-[10px] font-black uppercase text-slate-705 tracking-wider font-sans">UPI Interactive QR Panel</h4>
                        </div>
                        <span className="text-[8px] font-bold text-teal-800 uppercase font-mono bg-teal-50 px-1.5 py-0.5 border border-teal-150 rounded">Live</span>
                      </div>

                      <div className="flex flex-col items-center justify-center p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 relative">
                        {isUpiPaidSimulated ? (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center justify-center py-5 text-center space-y-2"
                          >
                            <span className="text-3xl text-emerald-600 animate-bounce">✓</span>
                            <div>
                              <h5 className="text-[11px] font-black text-emerald-900">₹{Math.round(finalTotal).toLocaleString('en-IN')} Received</h5>
                              <p className="text-[9px] text-emerald-600 font-bold mt-0.5 leading-normal">UPI transaction successfully marked paid!</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsUpiPaidSimulated(false);
                                triggerToastLocal("🔄 UPI Scanner frame reset.");
                              }}
                              className="text-[8.5px] font-bold text-slate-550 hover:text-slate-800 underline uppercase tracking-wider cursor-pointer mt-1"
                            >
                              Display QR Again
                            </button>
                          </motion.div>
                        ) : (
                          <>
                            {/* QR scanning box visualizer */}
                            <div className="relative bg-white p-1.5 rounded-lg shadow border border-slate-200 transition-transform duration-200">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=115x115&data=${encodeURIComponent(
                                  `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoiceNo)}`
                                )}`}
                                alt="UPI Billing Scan QR"
                                referrerPolicy="no-referrer"
                                className="w-[100px] h-[100px] object-contain relative z-10"
                              />
                              <div className="absolute inset-x-1.5 top-1.5 h-0.5 bg-teal-500 opacity-60 animate-bounce z-25 shadow-[0_0_8px_rgba(20,184,166,0.8)] pointer-events-none" />
                            </div>

                            <div className="text-center mt-2.5 space-y-0.5">
                              <p className="text-[10px] font-extrabold text-teal-800 flex items-center justify-center gap-1">
                                <span>Scan & Pay:</span> 
                                <span className="font-mono font-black text-[11px] text-zinc-900 bg-white border border-slate-200 rounded px-1 py-0.5">₹{Math.round(finalTotal).toLocaleString('en-IN')}</span>
                              </p>
                              <p className="text-[8.5px] text-slate-450 font-medium font-sans">
                                Voucher-ID VPA: <span className="font-mono font-bold text-slate-600">{invoiceNo}</span>
                              </p>
                            </div>

                            {/* Logos */}
                            <div className="flex gap-2 items-center justify-center mt-2 opacity-80 select-none scale-90">
                              <span className="text-[8.5px] font-bold text-blue-600 px-1 py-0.2 bg-blue-50 border border-blue-150 rounded">GPay</span>
                              <span className="text-[8.5px] font-bold text-purple-600 px-1 py-0.2 bg-purple-50 border border-purple-150 rounded">PhonePe</span>
                              <span className="text-[8.5px] font-bold text-cyan-650 px-1 py-0.2 bg-cyan-50 border border-cyan-150 rounded">Paytm</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-2 text-center space-y-1">
                        {!isUpiPaidSimulated && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsUpiPaidSimulated(true);
                              triggerToastLocal(`✅ UPI Deposit of ₹${Math.round(finalTotal).toLocaleString('en-IN')} simulated successfully!`);
                            }}
                            className="w-full text-[8.5px] py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold uppercase cursor-pointer transition-colors"
                          >
                            Mark UPI Received
                          </button>
                        )}
                        
                        <div className="flex justify-between items-center text-[8.5px] pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${finalTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoiceNo)}`);
                              triggerToastLocal("📋 Clipboard: UPI deep-link copied successfully!");
                            }}
                            className="text-slate-400 hover:text-slate-700 underline font-semibold cursor-pointer"
                          >
                            Copy UPI URI
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowUpiConfig(!showUpiConfig)}
                            className="text-teal-800 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                          >
                            {showUpiConfig ? "Hide VPA" : "⚙️ Custom UPI ID"}
                          </button>
                        </div>

                        {showUpiConfig && (
                          <div className="bg-slate-50 border border-slate-200 rounded p-2 text-left mt-1.5 space-y-1.5">
                            <div>
                              <span className="text-[8px] font-bold text-slate-550 block">BUSINESS NAME:</span>
                              <input 
                                type="text"
                                value={upiName}
                                onChange={(e) => setUpiName(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[9.5px] text-slate-800 font-bold"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-550 block">MERCHANT UPI VPA ID:</span>
                              <input 
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[9.5px] text-slate-850 font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Calculations breakdown */}
                  <div className="space-y-3.5 bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between shadow-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                        <span>Total Sum (कुल मूल्य):</span>
                        <span className="font-mono">₹{Math.round(subTotal).toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <label className="text-slate-500 font-medium">Trade Discount (%):</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={discount || ''}
                          onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          placeholder="0"
                          className="w-16 bg-white border border-slate-350 rounded text-right px-2 py-1 text-xs text-slate-900 font-mono font-bold focus:border-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 uppercase">Gross Payable (भुगतान योग्य):</span>
                      <span className="text-lg font-black font-mono text-teal-700">
                        ₹{Math.round(finalTotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-0.5">
                  <button 
                    type="submit"
                    className="w-full py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-colors shadow-md cursor-pointer flex justify-center items-center gap-2 text-white hover:bg-teal-800"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Clipboard size={14} /> Commit Bill & Disburse Stock Registers
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Right: Recent Invoice Log with Live Printing */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2 mb-3">
              Today's Saved Ledger Bills
            </h3>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {recentBills.map(rb => (
                <div key={rb.id} className="py-3 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono text-slate-450 font-bold block">{rb.billNo}</span>
                      <span className="text-xs font-bold text-slate-850 block mt-0.5">{rb.customerName}</span>
                      <span className="text-[9px] text-slate-500 mt-0.5 inline-block bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded uppercase font-extrabold">
                        {rb.type} ({rb.status})
                      </span>
                      {(rb.hasWrittenSlip || rb.hasWrittenSlipSlates) && (
                        <span className="text-[9px] text-amber-800 mt-0.5 ml-1 inline-block bg-amber-50 border border-amber-200 px-1 py-0.5 rounded font-bold animate-pulse">
                          📝 Slip Linked
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-900 block">₹{Math.round(rb.amount).toLocaleString('en-IN')}</span>
                      <div className="mt-1 flex gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePrintBill(rb);
                            triggerToastLocal(`🛋️ Loading printer layout for bill ${rb.billNo}`);
                          }}
                          className="px-2 py-1 rounded bg-teal-50 text-teal-850 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer flex items-center gap-0.5 font-bold text-[9px]"
                          title="Print / Review Paper Slip"
                        >
                          <Printer size={10} />
                          <span>पर्ची</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recentBills.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  No billing transactions committed yet today.
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-150 flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 rounded p-2.5 border border-slate-200/80">
              <AlertCircle size={13} className="text-slate-450 shrink-0" />
              <span>Click <span className="font-bold">पर्ची</span> next to any listed transaction to pull up the simulated 3-inch counter thermal sheet or prompt WhatsApp sharing instantly!</span>
            </div>
          </div>
        </div>
      </div>

      {/* THERMAL RECEIPTS PRINT PREVIEW MODAL */}
      <AnimatePresence>
        {activePrintBill && (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-100 border border-zinc-300 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative my-8"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setActivePrintBill(null)}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white text-slate-800 p-1.5 rounded-full border border-slate-200 cursor-pointer shadow-sm animate-none"
              >
                <X size={16} />
              </button>

              <div className="text-center mb-3">
                <span className="text-xs bg-zinc-200 px-2.5 py-1 rounded-md text-zinc-700 font-bold border border-zinc-350">
                  🖨️ Counter Thermal Print Roll (80mm)
                </span>
              </div>

              {/* One-Click English to Hindi conversion action toggle */}
              <div className="flex justify-center mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsHindiBill(!isHindiBill);
                    triggerToastLocal(!isHindiBill ? "हिंदी रसीद: पर्ची हिंदी में परिवर्तित!" : "English Invoice: Bill switched back to English!");
                  }}
                  className="w-full mx-2 py-2.5 px-3 bg-teal-50 drop-shadow-sm text-teal-800 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>🔄 {isHindiBill ? "अंग्रेजी में बदलें (Switch to English)" : "एक क्लिक में हिंदी करें (Convert to HINDI)"}</span>
                </button>
              </div>

              {/* Printable Target Sheet */}
              <div 
                id="thermal-slip-sheet"
                className="bg-white text-zinc-900 p-6 shadow-md border-b-8 border-dashed border-zinc-400 font-mono text-[11.5px] leading-relaxed mx-auto max-w-[280px]"
                style={{ fontFamily: "'Space Grotesk', 'JetBrains Mono', Courier, monospace" }}
              >
                <div className="text-center border-b border-dashed border-zinc-400 pb-3 mb-3">
                  <h1 className="text-base font-black tracking-wide font-sans text-stone-900">मंगलम वस्त्रालय</h1>
                  <h2 className="text-[11px] font-black uppercase tracking-wider text-stone-850 font-sans">MANGLAM VASTRALYA</h2>
                  <p className="text-[9px] text-zinc-650">
                    {isHindiBill ? "प्रोप्राइटर: आयुष साड़ी एवं फैंसी कपड़ा केंद्र" : "Prop: Ayush Saree & Fancy Fabric Center"}
                  </p>
                  <p className="text-[8px] text-zinc-500 mt-0.5">
                    {isHindiBill ? "एम.टी. कपड़ा बाजार, इंदौर, मध्य प्रदेश (४५२००२)" : "MT Cloth Market, Indore, Madhya Pradesh"}
                  </p>
                  <p className="text-[8px] text-zinc-500">
                    {isHindiBill ? "व्हाट्सएप संपर्क: ९९३९५२१३६१" : "WhatsApp Contacts: +91 9939521361"}
                  </p>
                </div>

                <div className="space-y-1 text-[10px] text-zinc-800 border-b border-dashed border-zinc-400 pb-2 mb-2">
                  <div className="flex justify-between">
                    <span>{isHindiBill ? "दिनांक / समय:" : "DATE/समय:"}</span>
                    <span>{activePrintBill.date || new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isHindiBill ? "रसीद क्रमांक:" : "RECEIPT NO:"}</span>
                    <span className="font-bold">{activePrintBill.billNo}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{isHindiBill ? "ग्राहक (कस्टमर):" : "CLIENT नाम:"}</span>
                    <span className="truncate max-w-[120px]">{activePrintBill.customerName}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{isHindiBill ? "भुगतान प्रकार:" : "PAY METHOD:"}</span>
                    <span>
                      {activePrintBill.status === 'Udhaar' 
                        ? (isHindiBill ? "🔴 बकाया उधार (CREDIT)" : "🔴 CREDIT (उधार)") 
                        : (isHindiBill ? "⚡ नकद भुगतान (CASH)" : "⚡ CASH (नकद)")}
                    </span>
                  </div>
                </div>

                {/* Items List inside receipt */}
                <div className="border-b border-dashed border-zinc-400 pb-2 mb-2">
                  <div className="flex justify-between uppercase font-bold text-[9px] mb-1.5 border-b border-zinc-200 pb-1">
                    <span className="w-1/2 text-left">{isHindiBill ? "विवरण / कपड़ा" : "ITEM DESC"}</span>
                    <span className="w-1/4 text-center">{isHindiBill ? "मात्रा" : "QTY/UNIT"}</span>
                    <span className="w-1/4 text-right">{isHindiBill ? "मूल्य" : "SUB"}</span>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] text-zinc-800">
                    {activePrintBill.items && activePrintBill.items.length > 0 ? (
                      activePrintBill.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <div className="w-1/2 text-left text-[10px] leading-tight">
                            <span>{it.name}</span>
                            {it.variant && <span className="block text-[8px] text-zinc-500">{it.variant}</span>}
                          </div>
                          <span className="w-1/4 text-center">
                            {it.qty} {it.unit === 'Mtr' ? (isHindiBill ? "मी." : "M") : (isHindiBill ? "पीस" : "Pcs")}
                          </span>
                          <span className="w-1/4 text-right font-bold">₹{Math.round(it.qty * it.rate)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between">
                        <span className="w-1/2 text-left">
                          {isHindiBill ? "थोक रेडीमेड वस्त्र" : "Garment suits/fabrics"}
                        </span>
                        <span className="w-1/4 text-center">
                          {activePrintBill.itemsCount} {isHindiBill ? "पीस" : "Pcs"}
                        </span>
                        <span className="w-1/4 text-right">₹{activePrintBill.amount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Foot comments / slip notes */}
                <div className="space-y-1 border-b border-dashed border-zinc-400 pb-2 mb-2 text-[10px]">
                  {activePrintBill.notes && (
                    <div className="text-[8.5px] text-zinc-500 leading-tight italic pb-1">
                      {isHindiBill ? "रिमार्क: " : "Rem: "}{activePrintBill.notes}
                    </div>
                  )}
                  {activePrintBill.hasWrittenSlip && (
                    <div className="text-[8.5px] text-amber-950 bg-amber-50 rounded p-1.5 mt-1 border border-dashed border-amber-200 leading-normal font-sans">
                      📝 <strong>{isHindiBill ? "हाथ की लाल पर्ची नंबर:" : "Handwritten Slip Reference:"}</strong> {activePrintBill.slipNotesText || (isHindiBill ? 'लॉग किया गया' : 'Reference logged')}
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-1.5 text-xs text-black border-t border-zinc-200">
                    <span>{isHindiBill ? "कुल देय राशि:" : "GRAND TOTAL:"}</span>
                    <span>₹{Math.round(activePrintBill.amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Thermal UPI Payment QR Section */}
                {activePrintBill.status === 'UPI' && (
                  <div className="border-b border-dashed border-zinc-400 pb-2.5 mb-2.5 flex flex-col items-center justify-center p-2.5 text-center bg-zinc-50 border border-zinc-250 rounded-xl">
                    <p className="text-[8.5px] font-black uppercase text-zinc-700 tracking-wider mb-1 px-1.5 font-sans flex items-center justify-center gap-1">
                      <span>📲</span>
                      <span>{isHindiBill ? "स्कैन कर सीधे भुगतान करें (BHIM UPI)" : "SCAN TO PAY (BHIM UPI)"}</span>
                    </p>
                    <div className="bg-white p-1 rounded border border-zinc-200 shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                          `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${activePrintBill.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(activePrintBill.billNo)}`
                        )}`}
                        alt="Receipt Thermal UPI QR"
                        referrerPolicy="no-referrer"
                        className="w-[90px] h-[90px] object-contain block"
                      />
                    </div>
                    <p className="text-[7.5px] text-zinc-500 font-mono mt-1 font-bold truncate max-w-full">
                      VPA: {upiId}
                    </p>
                  </div>
                )}

                {/* Footnotes */}
                <div className="text-center pt-2 space-y-1 text-[8.5px] text-zinc-500">
                  <p className="font-bold uppercase tracking-widest text-[9.5px] text-zinc-700 font-sans">
                    {isHindiBill ? "धन्यवाद • दोबारा पधारें !" : "Thank you • धन्यवाद"}
                  </p>
                  <p className="leading-tight">
                    {isHindiBill 
                      ? "बिना कटा हुआ मूल रोल थान का कपड़ा बिल के साथ ७ दिनों के भीतर बदला जा सकता है।" 
                      : "Exchange of uncut fabric allowed within 10 days with counter memo slip."}
                  </p>
                  <p className="border border-zinc-300 p-0.5 font-bold text-zinc-700 mt-2 block select-all">
                    🖥️ {store.name} {isHindiBill ? "खाता बही सिस्टम" : "ERP"}
                  </p>
                </div>
              </div>

              {/* Thermal Screen Options */}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    // Trigger real document standard printing
                    window.print();
                    triggerToastLocal("🖨️ Opening print dialog for thermal receipt roll...");
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-zinc-900 text-white hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-md cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Connect & Print Bill 🖨️</span>
                </button>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-center">Share Bill Slip across Apps:</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `📊 *M.V. (मंगलम वस्त्रालय) Invoice Record* 👕\n\n` +
                        `🧾 *Bill No:* ${activePrintBill.billNo}\n` +
                        `👤 *Customer Name:* ${activePrintBill.customerName}\n` +
                        `💰 *Gross Payable Amount:* ₹${Math.round(activePrintBill.amount).toLocaleString('en-IN')}\n` +
                        `📅 *Date:* ${activePrintBill.date || new Date().toLocaleDateString('en-IN')}\n` +
                        `📝 *Bill Mode:* ${activePrintBill.status === 'Udhaar' ? 'CREDIT BILL (उधार)' : 'CASH BILL (नकद)'}\n` +
                        (activePrintBill.slipNotesText ? `📌 *Memo No:* ${activePrintBill.slipNotesText}\n` : '') +
                        `\nThank you for dealing in sarees, lehengas & premium suit pieces with us! \nVisit again! ✨`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span>WhatsApp 📲</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://t.me/share/url?url=&text=${encodeURIComponent(
                        `📊 *M.V. (मंगलम वस्त्रालय) Invoice Record* 👕\n\n` +
                        `🧾 *Bill No:* ${activePrintBill.billNo}\n` +
                        `👤 *Customer Name:* ${activePrintBill.customerName}\n` +
                        `💰 *Gross Payable Amount:* ₹${Math.round(activePrintBill.amount).toLocaleString('en-IN')}\n` +
                        `📅 *Date:* ${activePrintBill.date || new Date().toLocaleDateString('en-IN')}\n` +
                        (activePrintBill.slipNotesText ? `📌 *Memo No:* ${activePrintBill.slipNotesText}\n` : '') +
                        `\nThank you for shopping at Manglam Vastralya! ✨`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 bg-sky-500 hover:bg-sky-600 text-white transition-colors rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span>Telegram ✈️</span>
                    </a>

                    {/* SMS */}
                    <a
                      href={`sms:?&body=${encodeURIComponent(
                        `M.V. Invoice: Bill No ${activePrintBill.billNo}, Customer: ${activePrintBill.customerName}, Total: Rs. ${Math.round(activePrintBill.amount).toLocaleString('en-IN')}. Thank you!`
                      )}`}
                      className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span>SMS / Text 💬</span>
                    </a>

                    {/* Copy text */}
                    <button
                      type="button"
                      onClick={() => {
                        const parsedMemo = 
                          `========================\n` +
                          `     मंगलम वस्त्रालय    \n` +
                          `========================\n` +
                          `बिल्ल संख्या: ${activePrintBill.billNo}\n` +
                          `दिनांक: ${activePrintBill.date || new Date().toLocaleDateString('en-IN')}\n` +
                          `ग्राहक नाम: ${activePrintBill.customerName}\n` +
                          `कुल मूल्य: ₹${Math.round(activePrintBill.amount).toLocaleString('en-IN')}\n` +
                          `भुगतान प्रकार: ${activePrintBill.status === 'Udhaar' ? 'CREDIT (उधार)' : 'PAID (नकद)'}\n` +
                          `========================\n` +
                          `धन्यवाद • Thank you! ✨`;
                        navigator.clipboard.writeText(parsedMemo);
                        triggerToastLocal("📋 Clipboard copied!");
                      }}
                      className="py-2.5 bg-slate-500 hover:bg-slate-600 text-white transition-colors rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer shadow-sm border border-slate-400"
                    >
                      <span>Copy Text 📋</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePrintBill(null)}
                    className="w-full mt-2 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Close Sheet ✕
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
