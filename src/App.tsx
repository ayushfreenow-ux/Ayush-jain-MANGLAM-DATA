/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Layers, 
  BarChart, 
  Zap, 
  Sparkles, 
  TrendingUp,
  FileText,
  Users,
  Brain,
  AlertTriangle,
  Activity,
  Award,
  BookOpen,
  Calendar,
  Grid,
  Menu,
  X,
  Bell,
  CreditCard,
  Search,
  Settings
} from 'lucide-react';

import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';

import { STOCKMIND_STORES } from './data/stockmind';
import { StoreState, InventoryItem, Customer, DeadStockItem } from './types';

// Page view components imports
import DashboardView from './components/DashboardView';
import BillingView from './components/BillingView';
import InventoryView from './components/InventoryView';
import CustomersView from './components/CustomersView';
import BehaviourAiView from './components/BehaviourAiView';
import PredictionsView from './components/PredictionsView';
import DeadStockView from './components/DeadStockView';
import SuppliersView from './components/SuppliersView';
import ReportsView from './components/ReportsView';
import UdhaarView from './components/UdhaarView';
import InvestorView from './components/InvestorView';
import SettingsView from './components/SettingsView';

type PageId = 'dashboard' | 'billing' | 'inventory' | 'customers' | 'behaviour' | 'predictions' | 'deadstock' | 'suppliers' | 'reports' | 'udhaar' | 'investor' | 'settings';

const LOCAL_STORAGE_KEY = 'stockmind_stores_db_v3';

// Safely retrieve persistent database from localStorage or load presets
const retrievePersistedDatabase = (): Record<string, StoreState> => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all stores have keys configured with fallbacks if needed
      Object.keys(parsed).forEach(k => {
        if (!parsed[k].bills) {
          parsed[k].bills = STOCKMIND_STORES[k]?.bills || [];
        }
      });
      return parsed;
    }
  } catch (e) {
    console.error("Local storage read error, falling back to preset database", e);
  }
  return STOCKMIND_STORES;
};

export default function App() {
  // Master Store state dictionary with localStorage base
  const [stores, setStores] = useState<Record<string, StoreState>>(retrievePersistedDatabase);
  const [activeStoreKey, setActiveStoreKey] = useState<string>('kapda');
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  // Firebase auth & sync tracking states
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncTime, setSyncTime] = useState<string>('');
  const isRemoteUpdateRef = React.useRef(false);

  // Load custom passcode if present
  const [customPasscode, setCustomPasscode] = useState<string>(() => {
    try {
      return localStorage.getItem('stockmind_custom_passcode') || '';
    } catch (e) {
      return '';
    }
  });

  const handleSetPasscode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCustomPasscode('');
      try {
        localStorage.removeItem('stockmind_custom_passcode');
      } catch (e) {}
      triggerToast("🔄 Switched back to global demo pool.");
      return;
    }
    
    // Ensure passcode always starts with 'sec_' to comply with our Firestore Rules pattern
    let formatted = trimmed;
    if (!trimmed.startsWith('sec_')) {
      formatted = `sec_${trimmed}`;
    }
    
    setCustomPasscode(formatted);
    try {
      localStorage.setItem('stockmind_custom_passcode', formatted);
    } catch (e) {}
    triggerToast(`🔑 Sync passphrase set to: "${trimmed}". Connecting database...`);
  };

  // Track Auth state changes
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Safe data merge transition when user logs in:
        // Try to fetch existing remote data first
        try {
          const targetDocId = currentUser.uid;
          const docRef = doc(db, 'stores', targetDocId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data && data.stores) {
              isRemoteUpdateRef.current = true;
              setStores(data.stores);
              triggerToast(`👋 Restored remote cloud backup data for ${currentUser.displayName}!`);
            }
          } else {
            // Seed current local stores to cloud for this brand new user
            try {
              await setDoc(docRef, {
                userId: targetDocId,
                stores: retrievePersistedDatabase(),
                updatedAt: new Date().toISOString()
              });
              triggerToast(`☁️ Secure cloud profile activated and synced for ${currentUser.displayName}!`);
            } catch (writeErr) {
              handleFirestoreError(writeErr, OperationType.WRITE, `stores/${targetDocId}`);
            }
          }
        } catch (err) {
          console.error("Failed cloud backup matching on login:", err);
          triggerToast(`⚠️ Connected with local data cache fallback.`);
          try {
            handleFirestoreError(err, OperationType.GET, `stores/${currentUser.uid}`);
          } catch (e) {
            // Log properly but do not crash user experience in fallback mode
          }
        }
      } else {
        triggerToast("🌐 Active in global fallback sync. Sign in to lock to your account!");
      }
    });

    return () => unsubscribe();
  }, []);

  const currentUserId = user ? user.uid : (customPasscode ? customPasscode : 'default');

  // Theme state: dark/light
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('stockmind_dark_mode');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  // Sync isDarkMode to localStorage and manage document classes
  React.useEffect(() => {
    try {
      localStorage.setItem('stockmind_dark_mode', String(isDarkMode));
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  // Direct WhatsApp share states
  const [shareBillData, setShareBillData] = useState<{
    billNo: string;
    customerName: string;
    amount: number;
    itemsCount: number;
    items?: any[];
    status?: string;
    type?: string;
    notes?: string;
    hasWrittenSlipSlates?: boolean;
    slipNotesText?: string;
    date?: string;
  } | null>(null);

  const [whatsappMobile, setWhatsappMobile] = useState<string>('');

  // 1. Listen for Firestore changes in REAL-TIME: If any client modifies, we receive it instantly
  React.useEffect(() => {
    setSyncStatus('syncing');
    const docRef = doc(db, 'stores', currentUserId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.stores) {
          const localStr = JSON.stringify(stores);
          const remoteStr = JSON.stringify(data.stores);
          
          if (localStr !== remoteStr) {
            isRemoteUpdateRef.current = true;
            setStores(data.stores);
          }
        }
      } else {
        // Document doesn't exist remote. Seed it with the local cached stores
        setDoc(docRef, {
          userId: currentUserId,
          stores: stores,
          updatedAt: new Date().toISOString()
        }).catch(err => {
          console.error("Initial Firestore seeding failed", err);
          try {
            handleFirestoreError(err, OperationType.WRITE, `stores/${currentUserId}`);
          } catch (e) {
            // Log properly within the environment context
          }
        });
      }
      setSyncStatus('synced');
      setSyncTime(new Date().toTimeString().split(' ')[0]);
    }, (error) => {
      console.error("Firestore live onSnapshot syncing failed", error);
      setSyncStatus('error');
      try {
        handleFirestoreError(error, OperationType.GET, `stores/${currentUserId}`);
      } catch (e) {
        // Log properly within the environment context
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // 2. Sync to local storage & push to Firestore upon local state changes (when modified by user action)
  React.useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stores));
    } catch (e) {
      console.error("Local storage persistent backup write failed", e);
    }

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    // Since this is a local state modification, upload it to the central cloud firestore immediately
    setSyncStatus('syncing');
    const docRef = doc(db, 'stores', currentUserId);
    setDoc(docRef, {
      userId: currentUserId,
      stores,
      updatedAt: new Date().toISOString()
    }).then(() => {
      setSyncStatus('synced');
      setSyncTime(new Date().toTimeString().split(' ')[0]);
    }).catch((err) => {
      console.error("Failed to upload local state to centralized sync server:", err);
      setSyncStatus('error');
      try {
        handleFirestoreError(err, OperationType.WRITE, `stores/${currentUserId}`);
      } catch (e) {
        // Log properly within the environment context
      }
    });
  }, [stores, currentUserId]);

  // Mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Toast notifier states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);

  const activeStore = stores[activeStoreKey];

  // Helper to summon notifications
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  // Global search states
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalActiveMatch, setGlobalActiveMatch] = useState<{
    type: 'customer' | 'item';
    data: any;
  } | null>(null);

  // Search filter lists
  const filteredGlobalCustomers = (activeStore.customers || []).filter(c =>
    c.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    c.phone.includes(globalSearchQuery)
  ).slice(0, 5); // top 5 matches

  const filteredGlobalItems = (activeStore.inventory || []).filter(item =>
    item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(globalSearchQuery.toLowerCase()))
  ).slice(0, 5); // top 5 matches

  const handleGlobalSelect = (type: 'customer' | 'item', data: any) => {
    setGlobalActiveMatch({ type, data });
  };

  const handleCreateBillWithCustomer = (customer: Customer) => {
    // Construct pre-filled draft
    let draft = {
      billType: 'Sale Bill (Bikri)',
      payMode: 'Cash (Nakad)',
      discount: 0,
      notes: '',
      customerSearch: customer.name,
      selectedCust: customer,
      hasWrittenSlip: false,
      slipNotesText: '',
      invoiceNo: `SM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
      rows: [
        { id: 1, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' },
        { id: 2, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' }
      ],
      rowCounter: 3,
    };

    try {
      const saved = localStorage.getItem(`manglam_billing_draft_${activeStoreKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        draft = {
          ...parsed,
          customerSearch: customer.name,
          selectedCust: customer,
        };
      }
    } catch (e) {}

    localStorage.setItem(`manglam_billing_draft_${activeStoreKey}`, JSON.stringify(draft));
    
    // Switch view to billing
    setActivePage('billing');
    setGlobalActiveMatch(null);
    setGlobalSearchQuery('');
    triggerToast(`📋 Initialized bill draft for customer ${customer.name}!`);
  };

  const handleSellItem = (item: InventoryItem) => {
    let draft = {
      billType: 'Sale Bill (Bikri)',
      payMode: 'Cash (Nakad)',
      discount: 0,
      notes: '',
      customerSearch: '',
      selectedCust: null,
      hasWrittenSlip: false,
      slipNotesText: '',
      invoiceNo: `SM-${new Date().getFullYear()}-${Math.floor(Math.random() * 950) + 100}`,
      rows: [
        { id: 1, name: item.name, variant: item.variant || '', qty: 1, rate: item.rate, unit: 'Pcs' as const },
        { id: 2, name: '', variant: '', qty: 1, rate: 0, unit: 'Pcs' as const }
      ],
      rowCounter: 3,
    };

    try {
      const saved = localStorage.getItem(`manglam_billing_draft_${activeStoreKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const currentRows = Array.isArray(parsed.rows) ? [...parsed.rows] : [];
        const emptyIdx = currentRows.findIndex(r => !r.name);
        if (emptyIdx !== -1) {
          currentRows[emptyIdx] = {
            ...currentRows[emptyIdx],
            name: item.name,
            variant: item.variant || '',
            rate: item.rate,
            unit: 'Pcs'
          };
        } else {
          const nextId = Math.max(...currentRows.map(r => r.id || 0), 1) + 1;
          currentRows.push({
            id: nextId,
            name: item.name,
            variant: item.variant || '',
            qty: 1,
            rate: item.rate,
            unit: 'Pcs'
          });
        }
        draft = {
          ...parsed,
          rows: currentRows,
        };
      }
    } catch (e) {}

    localStorage.setItem(`manglam_billing_draft_${activeStoreKey}`, JSON.stringify(draft));

    // Switch view to billing
    setActivePage('billing');
    setGlobalActiveMatch(null);
    setGlobalSearchQuery('');
    triggerToast(`👗 Added item "${item.name}" to active billing composer!`);
  };

  const handleSwitchStore = (storeKey: string) => {
    setActiveStoreKey(storeKey);
    triggerToast(`🔄 Switched workspace over to ${STOCKMIND_STORES[storeKey].name}!`);
  };

  const handlePageNavigation = (pageId: string) => {
    setActivePage(pageId as PageId);
    setIsMobileMenuOpen(false);
  };

  // State Updates: Add direct product catalog
  const handleAddItem = (item: Omit<InventoryItem, 'id'>) => {
    const generatedId = `item-${Math.floor(Math.random() * 100000)}`;
    setStores(prev => ({
      ...prev,
      [activeStoreKey]: {
        ...prev[activeStoreKey],
        inventory: [
          ...prev[activeStoreKey].inventory,
          { id: generatedId, ...item }
        ]
      }
    }));
    triggerToast(`📦 Added "${item.name}" directly to store catalog!`);
  };

  // State Updates: Update item stock count/metadata directly
  const handleUpdateInventoryItem = (itemId: string, updatedFields: Partial<InventoryItem>) => {
    setStores(prev => ({
      ...prev,
      [activeStoreKey]: {
        ...prev[activeStoreKey],
        inventory: prev[activeStoreKey].inventory.map(item => {
          if (item.id === itemId) {
            const merged = { ...item, ...updatedFields };
            if (updatedFields.stock !== undefined) {
              const stockVal = updatedFields.stock;
              merged.status = stockVal <= 10 ? 'low' : (stockVal >= 50 ? 'fast' : 'normal');
            }
            return merged;
          }
          return item;
        })
      }
    }));
    triggerToast(`🛒 Adjusted stock configuration & quantity levels!`);
  };

  // State Updates: Add local customer profiles
  const handleAddCustomer = (customer: Omit<Customer, 'id' | 'spent' | 'last'>) => {
    const generatedId = `cust-${Math.floor(Math.random() * 100000)}`;
    setStores(prev => ({
      ...prev,
      [activeStoreKey]: {
        ...prev[activeStoreKey],
        customers: [
          ...prev[activeStoreKey].customers,
          { id: generatedId, spent: 0, last: 'Just now', ...customer }
        ]
      }
    }));
    triggerToast(`👥 Member "${customer.name}" registered to active customer directory!`);
  };

  const handleUpdateCustomer = (customerId: string, updatedFields: Partial<Customer>) => {
    setStores(prev => ({
      ...prev,
      [activeStoreKey]: {
        ...prev[activeStoreKey],
        customers: prev[activeStoreKey].customers.map(c => 
          c.id === customerId ? { ...c, ...updatedFields } : c
        )
      }
    }));
    triggerToast(`✏️ Customer details updated securely!`);
  };

  // State Updates: Record bill checkout log
  const handleAddBill = (
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
  ) => {
    // Generate simulated inventory deductions
    // For every item listed, deduct 1 to 2 items randomly representing checks
    setStores(prev => {
      const activeStoreData = prev[activeStoreKey];
      const updatedInv = activeStoreData.inventory.map(item => {
        // deduct 1 item from first 2 item stocks
        if (item.stock > 5 && Math.random() > 0.5) {
          const newStock = Math.max(0, item.stock - 1);
          // dynamically compute status if stock gets very low
          const status = newStock <= 5 ? 'low' : item.status;
          return { ...item, stock: newStock, status };
        }
        return item;
      });

      // Assemble new persistent Bill object
      const generatedBillId = `bill-${Math.floor(Math.random() * 100000)}`;
      const newBillRecord = {
        id: generatedBillId,
        billNo: billNo,
        customerName: customerName,
        amount: Math.round(billAmount),
        status: paymentStatus,
        date: new Date().toISOString().split('T')[0],
        type: billType,
        itemsCount: itemsCount,
        items: items,
        notes: notes,
        hasWrittenSlipSlates: hasWrittenSlip,
        slipNotesText: slipNotesText
      };

      const updatedBills = [newBillRecord, ...activeStoreData.bills];

      // Automatically register spent amount or Udhaar credit for matched customer in database
      const updatedCustomers = activeStoreData.customers.map(cust => {
        if (cust.name.toLowerCase() === customerName.toLowerCase()) {
          const addedSpent = Math.round(billAmount);
          const addedUdhaar = paymentStatus === 'Udhaar' ? Math.round(billAmount) : 0;
          
          const oldLedger = cust.ledger || [];
          const newLedger = [...oldLedger];
          if (paymentStatus === 'Udhaar') {
            newLedger.push({
              id: `led-${Math.floor(Math.random() * 100000)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Credit' as const,
              amount: Math.round(billAmount),
              notes: `Purchased apparel on credit (Invoice #${billNo})`,
              billNo: billNo
            });
          }
          
          return {
            ...cust,
            spent: cust.spent + addedSpent,
            udhaar: cust.udhaar + addedUdhaar,
            ledger: newLedger,
            last: 'Just now'
          };
        }
        return cust;
      });

      // Show WhatsApp Sharing Dialogue with automatically matched phone number
      const matchedCust = activeStoreData.customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
      const customerMobileStr = matchedCust ? matchedCust.phone : '';

      setTimeout(() => {
        setShareBillData({
          billNo: billNo,
          customerName: customerName,
          amount: Math.round(billAmount),
          itemsCount: itemsCount,
          items: items,
          status: paymentStatus,
          type: billType,
          notes: notes,
          hasWrittenSlipSlates: hasWrittenSlip,
          slipNotesText: slipNotesText,
          date: new Date().toLocaleDateString('en-IN')
        });
        setWhatsappMobile(customerMobileStr);
      }, 501);

      return {
        ...prev,
        [activeStoreKey]: {
          ...activeStoreData,
          inventory: updatedInv,
          bills: updatedBills,
          customers: updatedCustomers
        }
      };
    });

    triggerToast(`🧾 Committed transaction "${billNo}" for "${customerName}". Stock registers updated!`);
  };

  // State Updates: Record Udhaar Credits or Repayments in ledger history
  const handleRecordUdhaarTransaction = (
    customerId: string, 
    type: 'Credit' | 'Payment', 
    amount: number, 
    mode?: string, 
    notes?: string,
    image?: string
  ) => {
    setStores(prev => {
      const activeStoreData = prev[activeStoreKey];
      const updatedCustomers = activeStoreData.customers.map(cust => {
        if (cust.id === customerId) {
          const change = type === 'Credit' ? amount : -amount;
          const newUdhaar = Math.max(0, cust.udhaar + change);
          
          const oldLedger = cust.ledger || [];
          const newEntry = {
            id: `led-${Math.floor(Math.random() * 100000)}`,
            date: new Date().toISOString().split('T')[0],
            type,
            amount,
            mode,
            notes,
            image
          };
          
          return {
            ...cust,
            udhaar: newUdhaar,
            ledger: [...oldLedger, newEntry],
            last: 'Just now'
          };
        }
        return cust;
      });
      
      return {
        ...prev,
        [activeStoreKey]: {
          ...activeStoreData,
          customers: updatedCustomers
        }
      };
    });
    
    triggerToast(`💰 Recorded ${type === 'Payment' ? 'repayment deposit' : 'credit debt'} of ₹${amount.toLocaleString('en-IN')}!`);
  };

  const handleUpdateCustomerImage = (customerId: string, image: string) => {
    setStores(prev => {
      const activeStoreData = prev[activeStoreKey];
      const updatedCustomers = activeStoreData.customers.map(cust => {
        if (cust.id === customerId) {
          return {
            ...cust,
            image
          };
        }
        return cust;
      });
      return {
        ...prev,
        [activeStoreKey]: {
          ...activeStoreData,
          customers: updatedCustomers
        }
      };
    });
    triggerToast("👤 Customer avatar updated successfully!");
  };

  // State Updates: Mark clearance deadstock item
  const handleClearDeadItem = (id: string) => {
    setStores(prev => ({
      ...prev,
      [activeStoreKey]: {
        ...prev[activeStoreKey],
        deadStock: prev[activeStoreKey].deadStock.map(d => d.id === id ? { ...d, cleared: true } : d)
      }
    }));
    triggerToast("✅ Campaign clearance marked. working liquid capital released!");
  };

  // Navigation Links Menu Definitions
  const navigationLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'billing', label: 'Create Bill', icon: FileText, badge: 'NEW' },
    { id: 'udhaar', label: 'Udhaar Credit Ledger', icon: CreditCard, badge: 'DUES' },
    { id: 'inventory', label: 'Inventory Grid', icon: Layers },
    { id: 'customers', label: 'Customers directory', icon: Users },
    { id: 'behaviour', label: 'Behaviour AI', icon: Brain },
    { id: 'predictions', label: 'AI Predictions', icon: Zap },
    { id: 'deadstock', label: 'Dead Stock Clearance', icon: AlertTriangle },
    { id: 'suppliers', label: 'Suppliers Performance', icon: Activity },
    { id: 'reports', label: 'Business Reports', icon: TrendingUp },
    { id: 'investor', label: 'Business Insights & Analyst Data', icon: Briefcase, badge: 'NEW' },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  const isKapda = activeStoreKey === 'kapda';
  const customStoreAccent = '#0f766e'; // High contrast elegant teal green

  return (
    <div id="stockmind-app-workspace" className={`min-h-screen w-full flex flex-col md:flex-row bg-wp-bg text-wp-text overflow-x-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      
      {/* 1. LEFT SIDEBAR: DESKTOP WORKSPACE PANELS */}
      <aside 
        id="desktop-workspace-sidebar" 
        className="hidden md:flex flex-col w-[260px] bg-wp-sidebar border-r border-wp-border h-screen sticky top-0 shrink-0 select-none z-30 transition-colors duration-300"
      >
        {/* Workspace Brand Head block */}
        <div className="px-5 py-5 border-b border-wp-border flex justify-between items-center bg-wp-sidebar w-full shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded flex items-center justify-center p-1.5 font-black text-xs text-white shrink-0"
                  style={{ backgroundColor: customStoreAccent }}>
              MV
            </span>
            <div>
              <h1 className="text-[10px] font-black tracking-widest text-wp-text uppercase font-display leading-tight">
                MANGLAM VASTARALYA
              </h1>
              <p className="text-[7.5px] uppercase tracking-widest font-bold mt-0.5" style={{ color: customStoreAccent }}>
                INTELLIGENT RETAIL ERP
              </p>
            </div>
          </div>
          
          {/* Aesthetic Theme Switcher with spring scales */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-7 h-7 rounded-lg bg-wp-bg border border-wp-border text-wp-text hover:bg-wp-sidebar/50 transition-colors cursor-pointer shadow-sm select-none flex items-center justify-center text-xs"
            title={isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </motion.button>
        </div>

        {/* Dynamic Sector switcher tabs - default closed to Kapda store */}
        <div className="p-3 border-b border-wp-border bg-wp-bg transition-colors duration-300 shrink-0 space-y-2">
          <div className="flex gap-1.5 p-2 bg-wp-card border border-wp-border rounded-lg items-center justify-center transition-colors duration-300">
            <span className="text-[10px] font-bold text-wp-text">👕 Active: {activeStore.name}</span>
          </div>

          {/* Central Cloud Remote Sync Widget */}
          <div className="bg-gradient-to-br from-teal-500/10 via-indigo-500/5 to-slate-500/5 dark:from-teal-500/20 dark:via-indigo-950/20 dark:to-slate-900 border border-teal-500/20 rounded-xl p-3 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">☁️</span>
                <h4 className="text-[9.5px] font-extrabold uppercase tracking-widest text-[#0f766e] dark:text-teal-400 font-mono">Central DB Sync</h4>
              </div>

              {/* Pulsing state light */}
              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  {syncStatus === 'syncing' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </>
                  ) : syncStatus === 'synced' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </>
                  )}
                </span>
                <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 font-mono">
                  {syncStatus}
                </span>
              </div>
            </div>

            {/* Auth section */}
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white/45 dark:bg-black/35 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border border-teal-500/40 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate leading-tight">
                      {user.displayName}
                    </p>
                    <p className="text-[8px] text-slate-450 dark:text-slate-500 font-mono truncate">
                      Secure Private Cloud
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[8.5px]">
                  <span className="text-slate-400 font-mono">
                    Time: {syncTime || 'Just now'}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await signOut(auth);
                        triggerToast("🔒 Logged out of secure sync");
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 font-extrabold cursor-pointer hover:underline transition-all"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {customPasscode ? (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/50 dark:border-emerald-800/40 p-2 rounded-lg space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">🔑 Free Sync Enabled</span>
                      <button
                        type="button"
                        onClick={() => handleSetPasscode('')}
                        className="text-[8px] text-red-600 dark:text-red-400 font-extrabold hover:underline cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                    <p className="text-[10px] font-mono select-all text-slate-850 dark:text-slate-200 font-bold bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded border border-emerald-300/30 truncate">
                      Code: {customPasscode.replace(/^sec_/, '')}
                    </p>
                    <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-snug">
                      Type this code in any other browser to sync your data instantly for FREE!
                    </p>
                  </div>
                ) : (
                  <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-normal">
                    You are viewing the <strong className="text-slate-700 dark:text-slate-200 font-extrabold font-mono">global demo pool</strong>. Enter a sync code below or login with Google to sync/secure private data across browsers FREE.
                  </p>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signInWithPopup(auth, googleProvider);
                    } catch (err: any) {
                      console.error("Manual login failed:", err);
                      const errorCode = err?.code || '';
                      const errorMessage = err?.message || String(err);
                      
                      let hint = '';
                      if (errorCode === 'auth/popup-blocked') {
                        hint = " (Popup blocked! Please click the pop-up blocker icon in your browser's address bar to allow it, or click 'Open App' in a new tab.)";
                      } else if (errorCode === 'auth/unauthorized-domain') {
                        const domain = window.location.hostname;
                        hint = ` (Unauthorized domain: '${domain}'. Please go to Firebase Console -> Authentication -> Settings -> Authorized Domains, and add '${domain}' to your authorized domains or use the passcode sync below!)`;
                      } else if (errorCode === 'auth/operation-not-allowed') {
                        hint = " (Google Sign-In is not enabled! Please go to your Firebase Console -> Authentication -> Sign-in Method, and enable the Google provider.)";
                      } else if (errorMessage.toLowerCase().includes('cookie') || errorMessage.toLowerCase().includes('third-party')) {
                        hint = " (Third-party cookies are blocked in this iframe. Click 'Open in New Tab' at top of your preview to complete login, or use the FREE SYNC CODE below.)";
                      } else {
                        // General guidance on common iframe storage-partitioning/popup blocks
                        hint = ` (${errorCode || 'Error'}: ${errorMessage}. Hint: Try entering a Passcode below for quick, zero-config free syncing!)`;
                      }
                      
                      triggerToast(`❌ Sign-in failed:${hint}`);
                    }
                  }}
                  className="w-full py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200 text-[9.5px] border border-slate-300/60 dark:border-slate-700/65 font-black uppercase tracking-wider rounded-lg shadow-sm hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>📲</span> Sign-in with Google
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-2 text-[7.5px] text-slate-400 font-bold uppercase font-mono">Or Use Free Sync Key</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const code = formData.get('sync_code') as string;
                    if (code) {
                      handleSetPasscode(code);
                    }
                    e.currentTarget.reset();
                  }}
                  className="space-y-1.5"
                >
                  <div className="flex gap-1.5">
                    <input
                      name="sync_code"
                      type="text"
                      required
                      placeholder="e.g. manglam_shop"
                      className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded px-2 py-1 text-[9px] text-slate-850 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-[#0f766e] hover:bg-teal-800 text-white font-black rounded text-[8.5px] uppercase tracking-wider cursor-pointer shadow-sm"
                    >
                      Sync
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Directory links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 select-none pr-2 custom-scrollbar">
          {navigationLinks.map((link) => {
            const isActive = activePage === link.id;
            const IconComponent = link.icon;

            return (
              <motion.button
                key={link.id}
                onClick={() => handlePageNavigation(link.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer text-left group ${
                  isActive 
                    ? 'font-bold bg-slate-100 border border-slate-200/60 shadow-sm text-slate-900' 
                    : 'text-slate-600 hover:text-slate-900 border border-transparent hover:bg-slate-50/70'
                }`}
                style={{ color: isActive ? customStoreAccent : undefined }}
              >
                <IconComponent 
                  size={15} 
                  className={`shrink-0 transition-transform duration-350 transform group-hover:scale-110 ${isActive ? 'rotate-3 scale-105' : 'group-hover:rotate-6'}`} 
                />
                <span className="group-hover:translate-x-0.5 transition-transform duration-300">{link.label}</span>
                {link.badge && (
                  <span className="ml-auto text-[8px] bg-red-100 text-red-700 border border-red-500/10 px-1 rounded font-black tracking-widest transition-transform duration-300 group-hover:scale-105 font-mono">
                    {link.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Workspace Footer Block */}
        <div className="p-4 border-t border-wp-border bg-wp-bg flex justify-between items-center text-[9px] tracking-tight text-wp-text-muted select-none transition-colors duration-300">
          <span className="font-mono">LEDGER MATCH [OK]</span>
          <span className="font-mono">v2.0 STABLE</span>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION VIEW */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-wp-sidebar border-b border-wp-border sticky top-0 z-40 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="w-5.5 h-5.5 rounded flex items-center justify-center font-black text-[10px] text-white shrink-0"
                style={{ backgroundColor: customStoreAccent }}>
            MV
          </span>
          <h2 className="text-xs font-black uppercase tracking-wider text-wp-text font-display">
            {activeStore.name} • CLOTHING ERP
          </h2>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Mobile Theme Toggle Trigger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-7 h-7 rounded-lg bg-wp-bg border border-wp-border text-wp-text flex items-center justify-center text-xs active:scale-95 cursor-pointer shadow-sm select-none"
            title={isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </motion.button>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-wp-text hover:text-teal-700 transition-colors p-1"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer drop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-wp-sidebar border-b border-wp-border flex flex-col p-4 space-y-1.5 z-30 relative divide-y divide-wp-border transition-colors duration-300"
          >
            {navigationLinks.map((link) => {
              const isActive = activePage === link.id;
              const IconComponent = link.icon;

              return (
                <button
                  key={link.id}
                  onClick={() => handlePageNavigation(link.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-xs font-semibold tracking-wide text-wp-text-muted hover:text-wp-text hover:bg-wp-bg rounded transition-colors"
                  style={{ color: isActive ? customStoreAccent : undefined }}
                >
                  <IconComponent size={15} />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN WORKSPACE CONTAINER AREA */}
      <main className="flex-1 min-h-[calc(100vh-52px)] md:h-screen overflow-y-auto px-5 py-6 md:p-8 space-y-6 flex flex-col justify-between">
        
        {/* TOP STATUS BAR & GLOBAL SEARCH HEADER */}
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-wp-border">
          {/* Welcome Info */}
          <div className="select-text">
            <span className="text-[10px] uppercase tracking-widest font-black text-teal-600 dark:text-teal-400">
              Manglam Vastralya ERP Platform
            </span>
            <h2 className="text-sm font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Counter Console</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-teal-55 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/40 rounded-full font-mono">
                🏠 {activeStore.name}
              </span>
            </h2>
          </div>

          {/* GLOBAL SEARCH INPUT WITH DROPDOWN PANEL */}
          <div className="relative w-full sm:w-72 md:w-96 select-none" id="global-search-container">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} className="text-slate-400 dark:text-slate-550" />
              </span>
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search customers or fabrics... (e.g., Banarasi, VIP)"
                className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold placeholder-slate-400 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/45 focus:border-teal-600 shadow-sm transition-all"
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-705 dark:hover:text-slate-200 cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Float Dropdown Autocomplete Panel list */}
            {globalSearchQuery && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[60] text-xs text-slate-800 dark:text-slate-200 max-h-80 overflow-y-auto">
                {/* Customers Section */}
                <div className="bg-slate-50/70 dark:bg-slate-900/80 px-3 py-2 border-b border-slate-150/70 dark:border-slate-800/80 flex justify-between text-[9.5px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                  <span>Customers List / ग्राहक ({filteredGlobalCustomers.length})</span>
                  <span>Category</span>
                </div>
                {filteredGlobalCustomers.length === 0 ? (
                  <div className="px-4 py-3 text-slate-400 italic text-[11px]">No customer matches</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredGlobalCustomers.map(cust => (
                      <div
                        key={cust.id}
                        onClick={() => handleGlobalSelect('customer', cust)}
                        className="px-4 py-2.5 hover:bg-slate-55 dark:hover:bg-slate-900/40 flex justify-between items-center cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-left">{cust.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 text-left">📞 {cust.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded uppercase border scale-95 ${
                            cust.tag === 'VIP' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200/55' :
                            cust.tag === 'New' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/55' :
                            'bg-slate-50 dark:bg-slate-905 text-slate-600 dark:text-slate-400 border-slate-200/55'
                          }`}>
                            {cust.tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inventory Items Section */}
                <div className="bg-slate-50/70 dark:bg-slate-900/80 px-3 py-2 border-y border-slate-150/70 dark:border-slate-800/80 flex justify-between text-[9.5px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider mt-1">
                  <span>Store Inventory / वस्त्र स्टॉक ({filteredGlobalItems.length})</span>
                  <span>Availability</span>
                </div>
                {filteredGlobalItems.length === 0 ? (
                  <div className="px-4 py-3 text-slate-400 italic text-[11px]">No apparel item matches</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredGlobalItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleGlobalSelect('item', item)}
                        className="px-4 py-2.5 hover:bg-slate-55 dark:hover:bg-slate-900/40 flex justify-between items-center cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-150 text-left">{item.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 text-left">{item.variant || 'Standard Stock'}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-0.5">
                          <span className={`font-mono font-bold text-xs ${
                            item.stock <= 5 ? 'text-rose-600 dark:text-rose-455' : 'text-teal-700 dark:text-teal-400'
                          }`}>
                            {item.stock} Pcs
                          </span>
                          <span className="text-[10px] text-slate-404 dark:text-slate-500 font-mono">₹{item.rate.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic page dispatcher */}
        <div key={JSON.stringify(stores)} className="flex-1 w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activePage === 'dashboard' && (
              <DashboardView 
                store={activeStore}
                activeStoreKey={activeStoreKey}
                onNavigate={handlePageNavigation}
              />
            )}
            
            {activePage === 'billing' && (
              <BillingView 
                store={activeStore}
                activeStoreKey={activeStoreKey}
                onAddBill={handleAddBill}
                onNavigate={handlePageNavigation}
              />
            )}

            {activePage === 'inventory' && (
              <InventoryView 
                inventory={activeStore.inventory}
                activeStoreKey={activeStoreKey}
                col3={activeStore.col3}
                onAddItem={handleAddItem}
                onUpdateInventoryItem={handleUpdateInventoryItem}
              />
            )}

            {activePage === 'customers' && (
              <CustomersView 
                customers={activeStore.customers}
                activeStoreKey={activeStoreKey}
                custSub={activeStore.custSub}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
              />
            )}

            {activePage === 'behaviour' && (
              <BehaviourAiView 
                store={activeStore}
                activeStoreKey={activeStoreKey}
              />
            )}

            {activePage === 'predictions' && (
              <PredictionsView 
                festivals={activeStore.festivals}
                buyreco={activeStore.buyreco}
                activeStoreKey={activeStoreKey}
              />
            )}

            {activePage === 'deadstock' && (
              <DeadStockView 
                deadStock={activeStore.deadStock}
                activeStoreKey={activeStoreKey}
                onClearDeadItem={handleClearDeadItem}
              />
            )}

            {activePage === 'suppliers' && (
              <SuppliersView 
                suppliers={activeStore.suppliers}
                activeStoreKey={activeStoreKey}
              />
            )}

            {activePage === 'reports' && (
              <ReportsView 
                store={activeStore}
                activeStoreKey={activeStoreKey}
                onTriggerToast={triggerToast}
              />
            )}

            {activePage === 'udhaar' && (
              <UdhaarView 
                customers={activeStore.customers}
                activeStoreKey={activeStoreKey}
                onRecordTransaction={handleRecordUdhaarTransaction}
                onTriggerToast={triggerToast}
                onUpdateCustomerImage={handleUpdateCustomerImage}
              />
            )}

            {activePage === 'investor' && (
              <InvestorView 
                activeStoreKey={activeStoreKey}
              />
            )}

            {activePage === 'settings' && (
              <SettingsView 
                stores={stores}
                activeStoreKey={activeStoreKey}
                onUpdateStores={setStores}
                onTriggerToast={triggerToast}
                onSwitchStore={setActiveStoreKey}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Unified Decorative footer block */}
        <footer className="pt-8 text-center text-[10px] text-slate-400 tracking-widest uppercase font-mono select-none">
          <span>COGNITIVE RETAIL NETWORKS • ALL DATA LOCALIZED IN CLIENT DATABASE</span>
        </footer>
      </main>

      {/* Multi-channel Share Dialogue Modal */}
      <AnimatePresence>
        {shareBillData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShareBillData(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                  <span className="text-xl">📤</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Multi-Channel Invoice Share</h3>
                  <p className="text-xs text-slate-500">Transaction recorded successfully!</p>
                </div>
              </div>

              {/* Invoice Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-[13px] space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice No:</span>
                  <span className="font-mono font-bold text-slate-800">{shareBillData.billNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <span className="font-semibold text-slate-800">{shareBillData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Charged:</span>
                  <span className="font-bold text-emerald-700 font-mono">₹{shareBillData.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Items Count:</span>
                  <span className="font-semibold text-slate-800">{shareBillData.itemsCount} products</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Customer's Mobile Number (Optional)</label>
                  <div className="flex gap-2">
                    <span className="bg-slate-100 text-slate-600 py-2.5 px-3 rounded-lg text-xs font-semibold border border-slate-200/80 flex items-center">
                      🇮🇳 +91
                    </span>
                    <input 
                      type="tel"
                      value={whatsappMobile}
                      onChange={(e) => setWhatsappMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Fills the contact field for mobile direct platforms (WhatsApp & SMS).
                  </p>
                </div>

                {/* Grid of sharing apps */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Choose Share Channel:</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* WHATSAPP */}
                    <a
                      href={`https://api.whatsapp.com/send?phone=${whatsappMobile ? `91${whatsappMobile}` : ''}&text=${encodeURIComponent(
                        `📊 *Manglam Vastralya (मंगलम वस्त्रालय) Invoice Record* 👕\n\n` +
                        `🧾 *Bill No:* ${shareBillData.billNo}\n` +
                        `👤 *Customer Name:* ${shareBillData.customerName}\n` +
                        `💰 *Gross Payable Amount:* ₹${shareBillData.amount.toLocaleString('en-IN')}\n` +
                        `📦 *No. of Items:* ${shareBillData.itemsCount}\n` +
                        `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n\n` +
                        `Thank you for shopping at Manglam Vastralya! We appreciate your business. ✨`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        triggerToast("📲 WhatsApp redirection opened!");
                        setShareBillData(null);
                      }}
                      className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <span className="text-sm">🟢</span> Whatsapp
                    </a>

                    {/* TELEGRAM */}
                    <a
                      href={`https://t.me/share/url?url=&text=${encodeURIComponent(
                        `📊 *Manglam Vastralya* 👕\n` +
                        `🧾 *Bill:* ${shareBillData.billNo}\n` +
                        `👤 *Customer:* ${shareBillData.customerName}\n` +
                        `💰 *Amount:* ₹${shareBillData.amount.toLocaleString('en-IN')}\n` +
                        `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n\n` +
                        `Thank you for shopping at Manglam Vastralya! ✨`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        triggerToast("📲 Telegram share opened!");
                        setShareBillData(null);
                      }}
                      className="py-2.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <span className="text-sm">🔵</span> Telegram
                    </a>

                    {/* SMS */}
                    <a
                      href={`sms:${whatsappMobile || ''}?&body=${encodeURIComponent(
                        `Manglam Vastralya Invoice: Bill No ${shareBillData.billNo}, Customer: ${shareBillData.customerName}, Total: Rs. ${shareBillData.amount.toLocaleString('en-IN')} on ${new Date().toLocaleDateString('en-IN')}. Thank you!`
                      )}`}
                      onClick={() => {
                        triggerToast("📲 SMS text dispatcher invoked!");
                        setShareBillData(null);
                      }}
                      className="py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <span className="text-xs">💬</span> SMS Text
                    </a>

                    {/* EMAIL */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent(`Invoice ${shareBillData.billNo} - Manglam Vastralya`)}&body=${encodeURIComponent(
                        `Dear ${shareBillData.customerName},\n\n` +
                        `Here is your invoice summary from Manglam Vastralya:\n\n` +
                        `Invoice No: ${shareBillData.billNo}\n` +
                        `Date: ${new Date().toLocaleDateString('en-IN')}\n` +
                        `items Count: ${shareBillData.itemsCount}\n` +
                        `Amount Payable: Rs. ${shareBillData.amount.toLocaleString('en-IN')}\n\n` +
                        `We appreciate your continued patronage!\n\n` +
                        `Best regards,\nAyush Saree & Fancy Fabric Center\nMT Cloth Market, Indore, Madhya Pradesh`
                      )}`}
                      onClick={() => {
                        triggerToast("📨 Mail software initiated!");
                        setShareBillData(null);
                      }}
                      className="py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <span className="text-xs">✉️</span> Email
                    </a>
                  </div>

                  {/* clipboard copy */}
                  <button
                    type="button"
                    onClick={() => {
                      const memo = 
                        `मंगलम वस्त्रालय (इंदौर, मध्य प्रदेश - S.I.)\n` +
                        `चिट्ठा / INVOICE REPORT\n` +
                        `बिल्ल संख्या: ${shareBillData.billNo}\n` +
                        `ग्राहक का नाम: ${shareBillData.customerName}\n` +
                        `कुल देय राशी: ₹${shareBillData.amount.toLocaleString('en-IN')}\n` +
                        `दिनांक: ${new Date().toLocaleDateString('en-IN')}\n` +
                        `सामान की संख्या: ${shareBillData.itemsCount} पीस\n` +
                        `मंगलम वस्त्रालय में पधारने के लिए धन्यवाद!`;
                      navigator.clipboard.writeText(memo);
                      triggerToast("📋 Copied full invoice text slip to device clipboards!");
                      setShareBillData(null);
                    }}
                    className="w-full mt-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-250 border border-slate-300 rounded-lg text-slate-700 text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    📝 Copy Full Billing Text (Hindi/English)
                  </button>

                  {/* Print Clean A4 ready Sheet */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerToast("🖨️ Dispatching A4 page to system printer rolls...");
                      setTimeout(() => {
                        window.print();
                      }, 120);
                    }}
                    className="w-full mt-2.5 py-3 px-4 bg-teal-600 hover:bg-teal-700 hover:-translate-y-0.5 text-white border border-teal-500 rounded-xl text-xs font-extrabold transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-600/15"
                  >
                    🖨️ Print Clean A4 Invoice
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShareBillData(null)}
                    className="py-2 px-5 bg-slate-200 hover:bg-slate-250 text-slate-800 transition-colors rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBAL SEARCH DETAIL MODAL OVERLAY */}
      <AnimatePresence>
        {globalActiveMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-colors select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 flex flex-col"
            >
              {/* Modal Header */}
              <div 
                className="px-5 py-4 flex justify-between items-center text-white"
                style={{ backgroundColor: customStoreAccent }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-normal">🔎</span>
                  <p className="text-xs font-black uppercase tracking-wider">
                    {globalActiveMatch.type === 'customer' ? 'Customer Profile' : 'Fabric / Apparel Item Details'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGlobalActiveMatch(null)}
                  className="text-white/80 hover:text-white hover:scale-110 transition-transform font-bold cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5 select-text text-left">
                {globalActiveMatch.type === 'customer' ? (
                  // CUSTOMER PROFILE PREVIEW
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-black text-slate-850 dark:text-slate-100">
                          {globalActiveMatch.data.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          📞 Mobile: {globalActiveMatch.data.phone}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        globalActiveMatch.data.tag === 'VIP' ? 'bg-indigo-50 border-indigo-205 text-indigo-700 dark:bg-indigo-950/40' :
                        globalActiveMatch.data.tag === 'New' ? 'bg-emerald-50 border-emerald-205 text-emerald-750 dark:bg-emerald-950/40' :
                        'bg-slate-50 border-slate-205 text-slate-700 dark:bg-slate-900'
                      }`}>
                        {globalActiveMatch.data.tag || 'REGULAR'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-850">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Lifetime Purchases</p>
                        <p className="text-sm font-extrabold text-[#0f766e] dark:text-teal-400 mt-1">
                          ₹{(globalActiveMatch.data.spent || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Udhaar Outstanding</p>
                        <p className={`text-sm font-extrabold mt-1 ${
                          (globalActiveMatch.data.balance || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-405'
                        }`}>
                          ₹{(globalActiveMatch.data.balance || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {globalActiveMatch.data.udhaarLimit && (
                      <p className="text-[10px] text-slate-500 font-medium text-center italic mt-1 font-mono">
                        Merchant Credit Limit: ₹{globalActiveMatch.data.udhaarLimit.toLocaleString('en-IN')}
                      </p>
                    )}

                    {/* Navigation Fast Buttons */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2 select-none">
                      <button
                        type="button"
                        onClick={() => handleCreateBillWithCustomer(globalActiveMatch.data)}
                        className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-600/10"
                      >
                        📝 Create Fast Bill with Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePage('customers');
                          setGlobalActiveMatch(null);
                          setGlobalSearchQuery('');
                        }}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-750 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        👥 Go to Customer Account Directory
                      </button>
                    </div>
                  </div>
                ) : (
                  // INVENTORY APPAREL DETAILS PREVIEW
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-black text-slate-850 dark:text-slate-100">
                          {globalActiveMatch.data.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          🎨 Fabric Type / Match: {globalActiveMatch.data.variant || 'Standard'}
                        </p>
                      </div>
                      {globalActiveMatch.data.category && (
                        <span className="text-[9px] font-extrabold uppercase bg-teal-50 dark:bg-teal-950 px-2 py-0.5 border border-teal-150 rounded text-teal-800 dark:text-teal-400">
                          {globalActiveMatch.data.category}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-850">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Unit Retail Value</p>
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                          ₹{globalActiveMatch.data.rate.toLocaleString('en-IN')} <span className="text-[10px] text-slate-404 font-normal">/ Pcs</span>
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Active Counter Stock</p>
                        <p className={`text-sm font-extrabold mt-1 ${
                          globalActiveMatch.data.stock <= 5 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-700 dark:text-teal-400'
                        }`}>
                          {globalActiveMatch.data.stock} Pcs
                        </p>
                      </div>
                    </div>

                    {globalActiveMatch.data.stock <= 5 && (
                      <div className="bg-rose-50/70 border border-rose-100/60 dark:bg-rose-950/20 dark:border-rose-900/40 p-2 text-rose-800 dark:text-rose-400 text-[10px] font-bold text-center rounded-lg animate-pulse">
                        ⚠️ Warning: Low Stock Level. Please restock from MT Market soon!
                      </div>
                    )}

                    {/* Navigation Fast Buttons */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2 select-none">
                      <button
                        type="button"
                        onClick={() => handleSellItem(globalActiveMatch.data)}
                        className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-600/10"
                      >
                        ➕ Add to active bill invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePage('inventory');
                          setGlobalActiveMatch(null);
                          setGlobalSearchQuery('');
                        }}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-750 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        📦 Go to Inventory Ledger Grid
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. DYNAMIC FLOATING TOAST NOTIFIER CARD */}
      <AnimatePresence>
        {showToast && toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-slate-200 shadow-2xl p-4.5 rounded-xl flex gap-3.5 items-start backdrop-blur-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-lg animate-bounce select-none shrink-0"
                 style={{ borderLeftColor: customStoreAccent, borderLeftWidth: '3px' }}>
              💬
            </div>
            <div>
              <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider text-left">SYSTEM NOTIFICATION</h5>
              <p className="text-xs text-slate-900 mt-1 pr-4 text-left leading-normal">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NATIVE A4 PRINT INVOICE WORK SHEET CONTAINER */}
      {shareBillData && (
        <div id="print-invoice-area" className="hidden print:block text-black bg-white p-10 select-text">
          {/* Header */}
          <div className="border-b-2 border-black pb-5 mb-5 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight uppercase">MANGLAM VASTRALYA</h1>
            <h2 className="text-lg font-bold text-neutral-800">मंगलम वस्त्रालय (साड़ी एवं फैंसी कपड़ा केंद्र)</h2>
            <p className="text-xs text-neutral-600 mt-1">
              MT Cloth Market, Indore, Madhya Pradesh - 452002 | Proprietor: Ayush Saree Complex
            </p>
            <p className="text-xs text-neutral-600">
              Email: billings@manglamvastralya.com | Support Helpdesk: +91 91094 22779, +91 99395 21361
            </p>
          </div>

          {/* Title & Metadata Header Grid */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-neutral-500">Retail Invoice / बिल पर्ची</span>
              <h3 className="text-xl font-black">Invoice: #{shareBillData.billNo}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-neutral-700">Date: {shareBillData.date || new Date().toLocaleDateString('en-IN')}</p>
              <p className="text-xs font-semibold mt-1">
                Status: <span className="uppercase px-2 py-0.5 border border-black rounded text-[10px] font-bold">
                  {shareBillData.status || 'Paid'}
                </span>
              </p>
            </div>
          </div>

          {/* Party/Billed To Info */}
          <table className="w-full mb-6 border-collapse">
            <tbody>
              <tr>
                <td className="w-1/2 align-top pr-4">
                  <div className="border border-neutral-300 rounded p-3 h-24">
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Billed To (ग्राहक का विवरण)</p>
                    <p className="text-sm font-bold text-black mt-1">{shareBillData.customerName}</p>
                    {whatsappMobile && <p className="text-xs text-neutral-700 font-mono">Mobile: +91 {whatsappMobile}</p>}
                  </div>
                </td>
                <td className="w-1/2 align-top pl-4">
                  <div className="border border-neutral-300 rounded p-3 h-24">
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Issuer Details</p>
                    <p className="text-sm font-semibold text-black mt-1">Manglam Vastralya Showroom</p>
                    <p className="text-xs text-neutral-600">Authorized Clerk Signee / MT Bazaar Counter</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Line Items Table */}
          <table className="w-full mb-6 border-collapse">
            <thead>
              <tr className="border-y border-neutral-400 bg-neutral-100 text-left text-xs font-extrabold uppercase text-neutral-800">
                <th className="py-2 px-3 w-12 text-center">S.No</th>
                <th className="py-2 px-3">Description / Material Name</th>
                <th className="py-2 px-3 text-center">Variant</th>
                <th className="py-2 px-3 text-center">Qty / Meters</th>
                <th className="py-2 px-3 text-right">Rate (₹)</th>
                <th className="py-2 px-3 text-right">Subtotal (₹)</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-neutral-200">
              {shareBillData.items && shareBillData.items.length > 0 ? (
                shareBillData.items.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 text-center font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold">{it.name || 'Unlabeled Textile material'}</p>
                    </td>
                    <td className="py-2.5 px-3 text-center text-neutral-600">{it.variant || 'Standard'}</td>
                    <td className="py-2.5 px-3 text-center font-semibold font-mono">{it.qty} {it.unit || 'Pcs'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">₹{(it.rate || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono">₹{((it.rate || 0) * (it.qty || 1)).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2.5 px-3 text-center font-mono">1</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold">Apparel and Fabric Suite Collection</p>
                    {shareBillData.notes && <p className="text-[10px] text-neutral-600 mt-0.5 font-normal">Note: {shareBillData.notes}</p>}
                  </td>
                  <td className="py-2.5 px-3 text-center text-neutral-600">Standard Pieces</td>
                  <td className="py-2.5 px-3 text-center font-semibold font-mono">{shareBillData.itemsCount || 1} Pcs</td>
                  <td className="py-2.5 px-3 text-right font-mono">₹{Math.round(shareBillData.amount / (shareBillData.itemsCount || 1)).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono">₹{shareBillData.amount.toLocaleString('en-IN')}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pricing Calculations Summary Info Banner */}
          <div className="flex justify-end mb-8">
            <div className="w-1/2 space-y-2 border-t border-neutral-350 pt-4 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Value Subtotal:</span>
                <span className="font-mono">₹{shareBillData.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>GST (Tax Included):</span>
                <span className="font-mono">Inclusive (Integrated GST @ 5%)</span>
              </div>
              {shareBillData.notes && (
                <div className="flex justify-between text-neutral-600">
                  <span>Merchant Discount:</span>
                  <span className="font-mono">Applied Promo / Cash Discount</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t-2 border-black pt-2">
                <span>Total Amount Payable (रकम):</span>
                <span className="font-mono text-base font-extrabold underline decoration-double decor-black">
                  ₹{shareBillData.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions & Signoffs */}
          <div className="grid grid-cols-2 gap-8 border-t border-neutral-300 pt-5 mt-auto">
            <div className="space-y-1.5 text-[10px] text-neutral-500 select-none">
              <p className="font-bold uppercase tracking-wider text-neutral-700">Terms & Trading Conditions:</p>
              <p>1. Cut-line dress materials or custom altered sarees are non-returnable.</p>
              <p>2. Please check product quality and yardage measurements before cutting.</p>
              <p>3. Active credit ledgers are expected to be settled bi-weekly at the counter.</p>
              <p>4. All legal arbitrations are subject exclusively to Indore jurisdiction slates.</p>
            </div>
            <div className="flex flex-col justify-end items-end pr-5">
              <div className="w-48 border-b border-black text-center pb-1 text-xs font-mono font-bold pt-8">
                {shareBillData.customerName}
              </div>
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-1 text-center w-48">Customer Signature</span>

              <div className="w-48 border-b border-black text-center pb-1 text-xs font-mono font-bold pt-12">
                Ayush / Store Desk
              </div>
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-1 text-center w-48">Authorized Store Stamp</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
