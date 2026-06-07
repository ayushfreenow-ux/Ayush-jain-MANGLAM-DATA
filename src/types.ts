/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ItemStatus = 'fast' | 'normal' | 'low' | 'dead';
export type CustomerTag = 'VIP' | 'Regular' | 'New' | 'Wholesale' | 'Walk-in';
export type PaymentStatus = 'Paid' | 'Cash' | 'UPI' | 'Udhaar';
export type BillType = 'Sale Bill (Bikri)' | 'Purchase Bill (Kharid)' | 'Return Bill (Wapsi)';
export type PaymentMode = 'Cash (Nakad)' | 'UPI / PhonePe / GPay' | 'Credit (Udhaar)' | 'Cheque';

export interface InventoryItem {
  id: string;
  name: string;
  variant: string;
  stock: number;
  rate: number;
  status: ItemStatus;
  category: string;
  soldThisWeek?: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'Credit' | 'Payment';
  amount: number;
  mode?: string;
  notes?: string;
  billNo?: string;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  spent: number;
  last: string;
  udhaar: number;
  tag: CustomerTag;
  notes?: string;
  occupation?: string;
  city?: string;
  ledger?: LedgerEntry[];
  image?: string;
}

export interface Bill {
  id: string;
  billNo: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
  status: PaymentStatus;
  date: string;
  type: string;
  itemsCount: number;
  items?: any[];
  notes?: string;
  hasWrittenSlip?: boolean;
  hasWrittenSlipSlates?: boolean;
  slipNotesText?: string;
}

export interface FestivalForecast {
  name: string;
  date: string;
  lift: string;
  items: string;
}

export interface BuyRecommendation {
  name: string;
  stock: number;
  demand: number;
  buy: number;
  reason: string;
}

export interface DeadStockItem {
  id: string;
  name: string;
  stock: number;
  days: number;
  value: number;
  suggestion: string;
  cleared?: boolean;
}

export interface Supplier {
  name: string;
  items: number;
  fast: number;
  dead: number;
  score: number;
}

export interface AiSuggestion {
  icon: string;
  text: string;
}

export interface StoreState {
  name: string;
  emoji: string;
  col3: string;
  invSub: string;
  custSub: string;
  inventory: InventoryItem[];
  customers: Customer[];
  topSelling: { name: string; sold: number; rev: string }[];
  deadStock: DeadStockItem[];
  suppliers: Supplier[];
  buyreco: BuyRecommendation[];
  festivals: FestivalForecast[];
  aiSuggestions: AiSuggestion[];
  waReport: string;
  bills: Bill[];
  segments: { label: string; count: number; color: string; desc: string }[];
  topCust: { name: string; spend: string; fav: string; tag: string }[];
}
