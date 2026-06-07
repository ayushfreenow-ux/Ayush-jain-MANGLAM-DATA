import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreState } from '../types';
import { 
  Settings, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  Store, 
  CheckCircle2, 
  Database,
  RefreshCw,
  RefreshCcw,
  FileText
} from 'lucide-react';

interface SettingsViewProps {
  stores: Record<string, StoreState>;
  activeStoreKey: string;
  onUpdateStores: (newStores: Record<string, StoreState>) => void;
  onTriggerToast: (msg: string) => void;
  onSwitchStore: (storeKey: string) => void;
}

export default function SettingsView({ 
  stores, 
  activeStoreKey, 
  onUpdateStores, 
  onTriggerToast,
  onSwitchStore
}: SettingsViewProps) {
  const activeStore = stores[activeStoreKey];
  const accentColor = '#0f766e'; // Match premium teal

  // Custom metadata input states
  const [customStoreName, setCustomStoreName] = useState(activeStore.name);
  const [customCol3, setCustomCol3] = useState(activeStore.col3 || 'Size / Colour');
  const [customInvSub, setCustomInvSub] = useState(activeStore.invSub || '');
  const [customCustSub, setCustomCustSub] = useState(activeStore.custSub || '');

  // Confirm states
  const [showScratchConfirm, setShowScratchConfirm] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [showDraftClearConfirm, setShowDraftClearConfirm] = useState(false);

  // Apply custom branding details
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStoreName.trim()) {
      onTriggerToast('⚠️ Store name cannot be empty!');
      return;
    }

    const updatedStores = { ...stores };
    updatedStores[activeStoreKey] = {
      ...updatedStores[activeStoreKey],
      name: customStoreName.trim(),
      col3: customCol3.trim(),
      invSub: customInvSub.trim(),
      custSub: customCustSub.trim()
    };

    onUpdateStores(updatedStores);
    onTriggerToast('✨ Saved Merchant branding configuration details!');
  };

  // 1. Reset completely to scratch (Real Business setup empty store)
  const handleResetToScratch = () => {
    const updatedStores = { ...stores };
    
    // Construct pristine empty StoreState for BOTH stores, or active store only
    // Let's reset the active store or all stores. Doing it for the active store fits beautifully.
    updatedStores[activeStoreKey] = {
      name: customStoreName.trim() || activeStore.name,
      emoji: activeStoreKey === 'kapda' ? '👕' : '💍',
      col3: customCol3.trim() || activeStore.col3,
      invSub: customInvSub.trim() || "Clean custom catalog - register items from scratch",
      custSub: customCustSub.trim() || "Clean custom register - register customers from scratch",
      inventory: [],
      customers: [],
      bills: [],
      deadStock: [],
      suppliers: [],
      buyreco: [],
      festivals: [],
      aiSuggestions: [
        { icon: '🚀', text: 'Welcome to your pristine ERP! Start entering records to train the local AI algorithms.' },
        { icon: '📝', text: 'Create draft invoices in Billing, then save them off to automatically populate Customer profiles.' }
      ],
      waReport: "Empty dataset. Start logging transactions to view compiled reports.",
      segments: [],
      topSelling: [],
      topCust: []
    };

    // Clean out billing draft from localStorage
    localStorage.removeItem(`manglam_billing_draft_${activeStoreKey}`);

    onUpdateStores(updatedStores);
    setShowScratchConfirm(false);
    onTriggerToast('🗑️ Cleared database completely! You can now register inventory & customers from scratch.');
  };

  // 2. Reset back to Demonstration dataset
  const handleResetToDemo = () => {
    // Import the base default datasets directly by clearing storage
    localStorage.removeItem('stockmind_stores_db_v3');
    
    // Trigger window reload to repopulate initial presets
    onTriggerToast('🔄 Restoring initial demonstration dataset. Reloading ledger...!');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  // 3. Clear pending billing draft state
  const handleClearDraft = () => {
    localStorage.removeItem(`manglam_billing_draft_${activeStoreKey}`);
    setShowDraftClearConfirm(false);
    onTriggerToast('🧹 Cleared all pending draft billing invoice details cached in this browser!');
  };

  // 4. Export backup JSON file
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stores, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const timestamp = new Date().toISOString().slice(0,10);
      downloadAnchor.setAttribute("download", `Manglam_Vastralya_Backup_${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      onTriggerToast('💾 Successfully compiled & exported offline ledger backup JSON!');
    } catch (e) {
      onTriggerToast('❌ Failed to compile backup file.');
    }
  };

  // 5. Import backup JSON file
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    
    if (files && files.length > 0) {
      fileReader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result === 'string') {
            const parsedData = JSON.parse(result);
            
            // Validate basic structure
            const firstStoreKey = Object.keys(parsedData)[0];
            if (firstStoreKey && parsedData[firstStoreKey] && ('inventory' in parsedData[firstStoreKey])) {
              onUpdateStores(parsedData);
              onTriggerToast('📂 Successfully restored ledger backup. Repopulating dashboard!');
            } else {
              onTriggerToast('⚠️ Invalid backup file format structure!');
            }
          }
        } catch (error) {
          onTriggerToast('❌ Error parsing backup JSON data.');
        }
      };
      fileReader.readAsText(files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6 select-text max-w-4xl mx-auto text-left"
    >
      {/* Page header banner with settings custom illustration */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center border border-teal-100 dark:border-teal-900/50">
              <Settings size={16} className="text-teal-700 dark:text-teal-400" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Merchant Settings & Console Controls
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Configure default store profiles, clear draft cache values, download offline encrypted backups, or wipe inventory files to start logging real ledger inputs immediately.
          </p>
        </div>

        {/* Database Status indicator */}
        <div className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 p-3.5 rounded-xl flex items-center gap-3.5 select-none shrink-0 self-start md:self-auto">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <div className="text-xs">
            <p className="font-extrabold text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase tracking-wider">Storage Engine Status</p>
            <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">LOCAL_STORAGE ACTIVE</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Store Branding Configuration (8 cols) */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200/95 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150/80 dark:border-slate-850 flex items-center gap-2 bg-slate-50/30 dark:bg-slate-950/20">
              <Store size={15} className="text-teal-700 dark:text-teal-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">
                1. Store Branding Details (ERP Profile)
              </h2>
            </div>

            <form onSubmit={handleSaveBranding} className="p-5 md:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Custom Garment Store / Business Name
                </label>
                <input
                  type="text"
                  value={customStoreName}
                  onChange={(e) => setCustomStoreName(e.target.value)}
                  placeholder="Enter store name..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-650 focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Inventory Custom Header Column (Col-3 descriptor)
                  </label>
                  <input
                    type="text"
                    value={customCol3}
                    onChange={(e) => setCustomCol3(e.target.value)}
                    placeholder="e.g. Size / Colour, Length, Fabric, Batch No"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-650 focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                    Matches the third details descriptor displayed in item registers.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Category Tag Classification Label
                  </label>
                  <input
                    type="text"
                    value={customInvSub}
                    onChange={(e) => setCustomInvSub(e.target.value)}
                    placeholder="e.g. Sarees, Suit Pieces, Jeans & Ethnic Wear"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-650 focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Customer Directory Sub-heading Label
                </label>
                <input
                  type="text"
                  value={customCustSub}
                  onChange={(e) => setCustomCustSub(e.target.value)}
                  placeholder="e.g. Local retailer account directory & outstanding credits"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-650 focus:border-teal-600 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                <button
                  type="submit"
                  className="px-4.5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md shadow-teal-700/10 transition-all select-none"
                >
                  <CheckCircle2 size={14} />
                  Save ERP Branding Changes
                </button>
              </div>
            </form>
          </div>

          {/* Ledger Datastructure Backups (Import/Export block) */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/95 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150/80 dark:border-slate-850 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-teal-700 dark:text-teal-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">
                  2. Offline Datastructure backups
                </h2>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Save your transactions, customer tabs, and deadstock catalog of {activeStore.name} to a secure offline backup file, or restore old records from an exported file.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="p-4 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-2 text-left cursor-pointer transition-all"
                >
                  <Download size={18} className="text-teal-700 dark:text-teal-400" />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Export Backup File</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Saves an offline `.json` snapshot of your current stores data including all customer credits on your computer.
                    </p>
                  </div>
                </button>

                <label className="p-4 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-2 text-left cursor-pointer transition-all block relative">
                  <div className="flex items-center justify-start gap-1">
                    <Upload size={18} className="text-[#0e7490] dark:text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-2">Import/Restore Backup</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Restores a previously exported `.json` file. This overwrites active browser storage completely.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Advanced Reset & Clear operations (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200/95 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150/80 dark:border-slate-850 flex items-center gap-2 bg-slate-50/30 dark:bg-slate-950/20">
              <Trash2 size={15} className="text-rose-600 dark:text-rose-455" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">
                3. Ledger Wiping & Reset Modes
              </h2>
            </div>

            <div className="p-5 md:p-6 space-y-4">
              <p className="text-[11px] text-slate-404 font-semibold uppercase tracking-wider block">Wiping Methods Available:</p>

              {/* CARD: Enter from Scratch (Merchant Real mode) */}
              <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/25 dark:border-rose-950/40 dark:bg-rose-950/5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-rose-100/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-440 shrink-0 mt-0.5">
                    <Trash2 size={14} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-rose-900 dark:text-rose-300">Wipe All & Enter From Scratch</h4>
                    <p className="text-[10.5px] text-rose-800/80 dark:text-rose-400/80 leading-relaxed">
                      Wipes all current records (inventory listings, customers dir, unpaid Udhaar ledger accounts, bill listings) and presents a pristine blank slate.
                    </p>
                  </div>
                </div>

                {!showScratchConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowScratchConfirm(true)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm text-center"
                  >
                    🚀 Trigger Merchant Wiping Mode
                  </button>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-rose-200 rounded-lg p-3 space-y-2 animate-fadeIn">
                    <p className="text-[10px] text-rose-700 dark:text-rose-400 font-extrabold text-left leading-normal">
                      Are you absolutely sure? All inventory and customer tabs of "{activeStore.name}" will be permanently eradicated from browser memory.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleResetToScratch}
                        className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-[10px] font-bold text-center cursor-pointer"
                      >
                        Yes, Erase Permanently
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowScratchConfirm(false)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 rounded text-[10px] font-bold text-center cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD: Restore Preset Demo Dataset */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/25 dark:border-indigo-950/40 dark:bg-indigo-950/5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 shrink-0 mt-0.5">
                    <RotateCcw size={14} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300">Reset Back To Demo Dataset</h4>
                    <p className="text-[10.5px] text-indigo-800/80 dark:text-indigo-400/80 leading-relaxed">
                      Re-populates your active local database back to our standardized demonstration presets containing default sarees, invoices, and analytics insights.
                    </p>
                  </div>
                </div>

                {!showDemoConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDemoConfirm(true)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm text-center"
                  >
                    ⏮️ Reset demo preset ledger
                  </button>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-indigo-200 rounded-lg p-3 space-y-2 animate-fadeIn">
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-405 font-bold text-left leading-normal">
                      Are you sure you want to restore the default demo records? Your custom edits will be replaced.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleResetToDemo}
                        className="flex-1 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-[10px] font-bold text-center cursor-pointer"
                      >
                        Yes, Restore Demo
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDemoConfirm(false)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-705 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 rounded text-[10px] font-bold text-center cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD: Clear Cached Bill Invoices Drafts */}
              <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/40 dark:border-slate-850 dark:bg-slate-900/10 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">
                    <FileText size={14} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Clear Pending Auto-Save Draft</h4>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed">
                      Removes any saved temporary draft records in the billing designer tab (rows, payment style, loaded quantities) for this store.
                    </p>
                  </div>
                </div>

                {!showDraftClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDraftClearConfirm(true)}
                    className="w-full py-2 bg-slate-605 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-150 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700 text-center"
                  >
                    🧹 Clear stored billing drafts
                  </button>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-250 rounded-lg p-3 space-y-2 animate-fadeIn">
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold text-left leading-normal">
                      Delete current local billing composer draft? Done items and figures are not affected.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleClearDraft}
                        className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-[10px] font-bold text-center cursor-pointer"
                      >
                        Yes, Clear Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDraftClearConfirm(false)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-705 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 in-shadow rounded text-[10px] font-bold text-center cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
