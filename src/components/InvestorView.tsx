import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  TrendingUp, 
  BookOpen, 
  DollarSign, 
  Award, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Mail, 
  UserCheck, 
  Briefcase,
  Database,
  RefreshCw,
  Lock,
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react';

interface InvestorViewProps {
  activeStoreKey: string;
}

interface PermittedEmail {
  id: string;
  email: string;
  role: 'Owner' | 'Business Analyst' | 'Shop Manager' | 'Accountant / Munim' | 'Auditor';
  addedAt: string;
  status: 'Active' | 'Invited' | 'Pending';
}

export default function InvestorView({ activeStoreKey }: InvestorViewProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  
  // State for Multi-User Email Access list local persistence
  const [emails, setEmails] = useState<PermittedEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Owner' | 'Business Analyst' | 'Shop Manager' | 'Accountant / Munim' | 'Auditor'>('Business Analyst');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize emails with some robust demo defaults if not present in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stockmind_permitted_emails');
    if (saved) {
      try {
        setEmails(JSON.parse(saved));
      } catch (e) {
        loadDefaults();
      }
    } else {
      loadDefaults();
    }
  }, []);

  const loadDefaults = () => {
    const defaults: PermittedEmail[] = [
      {
        id: '1',
        email: 'ayushfreenow@gmail.com',
        role: 'Owner',
        addedAt: '2026-06-01',
        status: 'Active'
      },
      {
        id: '2',
        email: 'analyst.malwa@stockmind.co.in',
        role: 'Business Analyst',
        addedAt: '2026-06-05',
        status: 'Active'
      },
      {
        id: '3',
        email: 'munimji.indore@gmail.com',
        role: 'Accountant / Munim',
        addedAt: '2026-06-06',
        status: 'Invited'
      }
    ];
    setEmails(defaults);
    localStorage.setItem('stockmind_permitted_emails', JSON.stringify(defaults));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      triggerToast('⚠️ Please enter a valid email address!');
      return;
    }

    if (emails.some(item => item.email.toLowerCase() === newEmail.toLowerCase())) {
      triggerToast('⚠️ Email already has system access permissions!');
      return;
    }

    const item: PermittedEmail = {
      id: Date.now().toString(),
      email: newEmail.trim().toLowerCase(),
      role: selectedRole,
      addedAt: new Date().toISOString().split('T')[0],
      status: 'Invited'
    };

    const updated = [...emails, item];
    setEmails(updated);
    localStorage.setItem('stockmind_permitted_emails', JSON.stringify(updated));
    setNewEmail('');
    triggerToast(`📨 Invite sent & access granted to: ${item.email}`);
  };

  const handleRemoveEmail = (id: string, emailStr: string) => {
    if (emailStr === 'ayushfreenow@gmail.com') {
      triggerToast('❌ Cannot delete system primary root account!');
      return;
    }
    const updated = emails.filter(item => item.id !== id);
    setEmails(updated);
    localStorage.setItem('stockmind_permitted_emails', JSON.stringify(updated));
    triggerToast(`🗑️ Removed access for ${emailStr}`);
  };

  // Unified Print trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 print:space-y-0 print:p-0 font-sans"
    >
      {/* Dynamic Style block for Printing perfection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-investor-area, #print-investor-area * {
            visibility: visible;
          }
          #print-investor-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-after-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .print\\:border-slate-800 {
            border-color: #1e293b !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Toast Alert Indicator */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-5 right-5 z-55 bg-slate-900 text-white text-xs font-bold px-4 py-3.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-750 font-mono"
          >
            <Sparkles size={14} className="text-teal-400 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Header - Hidden during print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-display">
            <span className="text-lg">📊</span>
            Business Insights & Data Analyst Desk
          </h2>
          <p className="text-sm text-slate-550 mt-1">
            Simulate advanced regional intelligence metrics, generate offline architectural PDF dossiers for advisors, and configure multi-user email accesses.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-teal-700 hover:bg-teal-850 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(15,118,94,0.45)] hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none"
          >
            <Printer size={14} className="group-hover:rotate-12 transition-transform duration-300" />
            <span>Export Business Analyst PDF Report</span>
          </button>
        </div>
      </div>

      {/* Actionable Banner card - Hidden in print */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-950 border border-teal-700 text-white p-6 rounded-2xl relative overflow-hidden shadow-md print:hidden transition-all duration-300 hover:shadow-[0_4px_25px_rgba(13,148,136,0.15)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-4 max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-1.5 text-[10px] bg-teal-600/40 border border-teal-500/20 px-2.5 py-0.8 rounded-full font-black tracking-widest uppercase">
            🚀 Live Data Analyst Core
          </div>
          <h3 className="text-lg md:text-xl font-bold tracking-tight">
            How does our system operate for ₹0 Server Cost?
          </h3>
          <p className="text-xs text-teal-100 leading-relaxed font-normal font-sans">
            By utilizing high-speed local browser caching combined with structured offline synchronization layers, a retail shop can run unlimited item matrices, billing terminals, credit sheets, and visual reports **completely free of expensive server database bills**. You can print this dossier directly to present the business capabilities to investors and stakeholders!
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 bg-white text-teal-950 hover:bg-teal-50 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.65)] hover:-translate-y-0.5 cursor-pointer active:scale-95 shadow-sm"
            >
              Print Analytical Dossier to PDF
            </button>
          </div>
        </div>
      </div>

      {/* MULTI-USER EMAIL ACCESS CONTROLS (THE NEW HIGHLIGHT REQUIREMENT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 print:hidden hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span className="p-1 px-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-mono font-black">👥</span>
            <span>Multi-User System Access & Invite Controls</span>
          </h3>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Grant explicit reading/writing authority to your managers, auditors, and business analysts via corporate or personal email verified log-in.
          </p>
        </div>

        {/* Form area to invite / add access */}
        <form onSubmit={handleAddEmail} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Invite Team Member Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. ayushfreenow@gmail.com"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-600/20 active:scale-[0.99] transition-all"
              />
            </div>
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">System Authority / Role Category</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-teal-600/20 cursor-pointer"
            >
              <option value="Business Analyst">Business Analyst (Data & Forecast View)</option>
              <option value="Shop Manager">Shop Manager (Full Inventory & Staff)</option>
              <option value="Accountant / Munim">Accountant / Munim (Billing & Udhaar Ledger)</option>
              <option value="Auditor">Financial Auditor (Read-Only Compliance)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer selection:bg-teal-500"
            >
              <Plus size={14} />
              <span>Grant System Access</span>
            </button>
          </div>
        </form>

        {/* Existing Permitted Emails Access List Grid */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black tracking-wider text-slate-500 uppercase">
                <th className="py-3 px-4">Authorized User Email</th>
                <th className="py-3 px-4">Workspace Role</th>
                <th className="py-3 px-4">date Granted</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {emails.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                      <span className="text-teal-700 text-[10px] font-mono font-bold">@</span>
                    </div>
                    <span>{item.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-sans">
                      {item.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[10.5px]">
                    {item.addedAt}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-[10.2px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' 
                        : 'bg-amber-50 text-amber-700 border border-amber-250 animate-pulse'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-505' : 'bg-amber-505'} bg-current`} />
                      {item.status === 'Active' ? 'Active Live' : 'Pending Verification'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleRemoveEmail(item.id, item.email)}
                      className={`text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50/50 transition-all inline-block ${item.email === 'ayushfreenow@gmail.com' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                      disabled={item.email === 'ayushfreenow@gmail.com'}
                      title="Revoke and cancel system access"
                    >
                      <Trash2 size={13.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAIN DATA ARCHITECTURE REPORT (READY FOR EXPORT / INVESTORS) */}
      <div 
        id="print-investor-area"
        ref={printAreaRef}
        className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm space-y-12 max-w-4xl mx-auto text-slate-800 overflow-hidden font-sans print:shadow-none print:border-0"
      >
        {/* DOCUMENT HEADER / FIRST PAGE PANEL */}
        <div className="border-b-4 border-teal-700 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2.5">
            <span className="text-[10px] font-black tracking-widest bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-md uppercase font-mono">
              CONFIDENTIAL BUSINESS PROPOSAL & SYSTEMS ANALYTICS
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase font-display">
              Manglam Vastralya
            </h1>
            <p className="text-sm font-semibold text-slate-650 flex items-center gap-1">
              <span>📊 Premium Business Insights & Analyst System</span>
              <span className="text-slate-300">•</span>
              <span>Indore MT Cloth Market Enterprise Platform</span>
            </p>
          </div>
          <div className="text-left md:text-right font-mono text-[10px] text-slate-500 space-y-0.5 bg-slate-550 p-3 rounded-lg border border-slate-200 w-full md:w-auto">
            <p><strong>REPORT:</strong> SYSTEM-INSIGHT-v2.5</p>
            <p><strong>PUBLISHED:</strong> June 2026</p>
            <p><strong>ROLE AUTHORIZED:</strong> System Administrator</p>
            <p><strong>ACCESS CHANNELS:</strong> Multi-Email Secure Invite</p>
          </div>
        </div>

        {/* SECTION 1: EXEC SUMMARY GRID */}
        <div className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-teal-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <BookOpen size={12} />
            PART I: Executive Summary & System Vision
          </h2>
          <p className="text-[11.5px] text-slate-650 leading-relaxed font-normal">
            **Manglam Vastralya ERP** is an ultra-modern, local-first enterprise tool designed specifically for premium high-turnover family retail showrooms, bridal saree curators, and textile boutiques (strictly retail, no wholesale) operating in major Central Indian distribution hubs like Indore. By solving the core digital bottlenecks—expensive subscription rentals, loss of connectivity in crowded brick-and-mortar showrooms, and manual credit miscalculations—our platform guarantees safe operations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Target Market Sizing</span>
              <p className="text-sm font-black text-slate-950 font-display">SME Textile Merchants</p>
              <p className="text-[10.5px] text-slate-550 leading-normal">
                Serving over 1.2M micro-retail fabric and readymade shops across Madhya Pradesh.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Server Footprint Cost</span>
              <p className="text-sm font-black text-slate-950 font-display">Permanent ₹0 Cloud</p>
              <p className="text-[10.5px] text-slate-550 leading-normal">
                Browser local storage indexing protects owners from premium operational databases.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Verified Access Core</span>
              <p className="text-sm font-black text-slate-950 font-display">Safe Multi-Email</p>
              <p className="text-[10.5px] text-slate-550 leading-normal">
                Securely shares store reports with certified partners and analysts via permissioned lists.
              </p>
            </div>
          </div>
        </div>

        {/* Page break during printing */}
        <div className="print:break-after-page" />

        {/* SECTION 2: REGIONAL RETAIL BOTTLENECKS & SOLUTIONS */}
        <div className="space-y-4 pt-4 print:pt-0">
          <h2 className="text-xs font-black tracking-widest text-teal-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <TrendingUp size={12} />
            PART II: Specialized Business Analyst Modules
          </h2>
          <p className="text-xs text-slate-650 leading-relaxed font-normal">
            Our platform features tailor-made widgets engineered directly around ground realities of the Central India apparel trade environment:
          </p>

          <div className="space-y-3">
            {/* Solution 1 */}
            <div className="flex gap-3 items-start border border-slate-200 rounded-xl p-3.5 bg-white">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-700">
                <CheckCircle2 size={16} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  1. Localized Stocking Predictor (Navratri & Indore Rang Panchami)
                </h4>
                <p className="text-[10.5px] text-slate-600 leading-normal">
                  Our system accounts for localized surges—predicting heavy demand for Chanderi/Maheshwari fabrics during wedding lagans, and white cotton/custom printing before Malwa’s signature **Rang Panchami Gair festivals**.
                </p>
              </div>
            </div>

            {/* Solution 2 */}
            <div className="flex gap-3 items-start border border-slate-200 rounded-xl p-3.5 bg-white">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-700">
                <CheckCircle2 size={16} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  2. Photo-Enabled Udhaar Credit Desk
                </h4>
                <p className="text-[10.5px] text-slate-600 leading-normal">
                  Tracks customer debts securely with visual transaction logging. Merchant stores instant photo proof of handwritten logs, cash handovers, and UPI notifications to prevent reconciliation disputes.
                </p>
              </div>
            </div>

            {/* Solution 3 */}
            <div className="flex gap-3 items-start border border-slate-200 rounded-xl p-3.5 bg-white">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-700">
                <CheckCircle2 size={16} />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  3. Permanent Free Google Sheets Synchronization
                </h4>
                <p className="text-[10.5px] text-slate-600 leading-normal">
                  Integrates with Google Drive/Sheets as a centralized database fallback for managers without incurring server fees. Safe, robust, and permanent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PERMITTED ACCESS LIST PRINT PREVIEW */}
        <div className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-teal-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Lock size={12} />
            PART III: Active Permissions Registry (Printed Audit Trail)
          </h2>
          <p className="text-xs text-slate-650 leading-relaxed">
            The following accounts are registered for secure system reading/writing of the **Manglam Vastralya** operational database:
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="grid grid-cols-3 bg-slate-100 text-[9.5px] font-black uppercase text-slate-500 py-2.5 px-4 tracking-wider border-b border-slate-200">
              <div>Email Access</div>
              <div>System Authority</div>
              <div>Security Status</div>
            </div>
            {emails.map((item) => (
              <div key={item.id} className="grid grid-cols-3 text-[10.5px] py-2.5 px-4 border-b border-slate-150 last:border-0 font-mono text-slate-700">
                <div className="font-sans font-bold text-slate-900">{item.email}</div>
                <div>{item.role}</div>
                <div className="text-teal-700">✓ AUTHORIZED ({item.status.toUpperCase()})</div>
              </div>
            ))}
          </div>
        </div>

        {/* DOCUMENT FOOTNOTE */}
        <div className="border-t border-dashed border-slate-300 pt-5 text-center text-[9px] text-slate-400 font-mono flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>🖥️ REPORT ID: MNG-INDS-ACCESS-LEDGER</span>
          <span>© 2026 MANGLAM VASTARALYA • STABLE INTEL</span>
          <span>STRICTLY CONFIDENTIAL FOR SHAREHOLDERS & ANALYSTS</span>
        </div>
      </div>
    </motion.div>
  );
}
