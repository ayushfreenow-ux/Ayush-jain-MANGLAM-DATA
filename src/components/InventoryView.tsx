import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem, ItemStatus } from '../types';
import { 
  Search, 
  Layers, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Coins,
  Filter,
  Sliders,
  ChevronDown,
  X
} from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  activeStoreKey: string;
  col3: string;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateInventoryItem?: (itemId: string, updatedFields: Partial<InventoryItem>) => void;
}

export default function InventoryView({ inventory, activeStoreKey, col3, onAddItem, onUpdateInventoryItem }: InventoryViewProps) {
  const accentColor = '#0f766e'; // Teal theme colors

  // State managers
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Edit Product Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editVariant, setEditVariant] = useState<string>('');
  const [editStock, setEditStock] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editStatus, setEditStatus] = useState<ItemStatus>('normal');

  // Form Fields
  const [newName, setNewName] = useState<string>('');
  const [newVariant, setNewVariant] = useState<string>('');
  const [newStock, setNewStock] = useState<number>(50);
  const [newRate, setNewRate] = useState<number>(500);
  const [newCategory, setNewCategory] = useState<string>('');

  // Categories list
  const categories = Array.from(new Set(inventory.map(item => item.category)));

  // Analytical aggregates
  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.variant.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalDistinct = inventory.length;
  const totalStockCount = inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = inventory.filter(item => item.stock <= 10).length;
  const deadStockCount = inventory.filter(item => item.status === 'dead').length;
  const totalFinancialValue = inventory.reduce((sum, item) => sum + (item.stock * item.rate), 0);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    // Determine status
    let status: ItemStatus = 'normal';
    if (newStock <= 10) status = 'low';
    else if (newStock >= 50) status = 'fast';

    onAddItem({
      name: newName,
      variant: newVariant || 'Standard Spec',
      stock: newStock,
      rate: newRate,
      status: status,
      category: newCategory || 'general'
    });

    // Reset fields
    setNewName('');
    setNewVariant('');
    setNewStock(50);
    setNewRate(500);
    setNewCategory('');
    setShowAddModal(false);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !onUpdateInventoryItem) return;

    onUpdateInventoryItem(editingItem.id, {
      name: editName,
      variant: editVariant || 'Standard Spec',
      stock: editStock,
      rate: editRate,
      category: editCategory || 'general',
      status: editStatus
    });

    setShowEditModal(false);
    setEditingItem(null);
  };

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
            <span className="text-lg">📦</span>
            Real-time Inventory Ledger
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse and coordinate your physical stock assets and valuation metrics
          </p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold text-white hover:bg-teal-850 px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: accentColor }}
          >
            <Plus size={15} /> Add Stock Item
          </button>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Distinct */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Distinct Products</span>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{totalDistinct}</div>
          <p className="text-[10px] text-slate-500 mt-1">Summing {totalStockCount} units in hand</p>
        </div>

        {/* Low Stock count */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Low Stock Alerts</span>
          <div className={`mt-2 text-2xl font-black font-mono ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {lowStockCount}
          </div>
          <p className="text-[10px] text-slate-505 mt-1">Items at or below critical 10 threshold</p>
        </div>

        {/* Lazy Stock Count */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lazy Items (Dead)</span>
          <div className={`mt-2 text-2xl font-black font-mono ${deadStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {deadStockCount}
          </div>
          <p className="text-[10px] text-slate-505 mt-1">Zero commercial activity for 60+ days</p>
        </div>

        {/* Aggregate tied value */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Consolidated Asset Value</span>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            ₹{(totalFinancialValue / 100000).toFixed(2)}L
          </div>
          <p className="text-[10px] text-slate-505 mt-1">Total physical capital invested</p>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Controllers panel */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <Search size={14} />
            </span>
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product metadata..."
              className="w-full bg-white border border-slate-350 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-450 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-550 font-bold px-1 py-2">
              <Filter size={13} /> Filter Category:
            </span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Show All Categories</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-xs">
                <th className="py-3 px-5 font-bold uppercase tracking-wider">PRODUCT DETAIL</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider">{col3.toUpperCase()}</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">QUANTITY IN STOCK</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-right">UNIT SALES VALUE</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-right">CONSOLIDATED VALUE</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">VELOCITY STATUS</th>
                <th className="py-3 px-5 font-bold uppercase tracking-wider text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const subtotal = item.stock * item.rate;
                  const isLow = item.stock <= 10;

                  // Velocity rendering labels & shapes
                  let badgeColors = 'bg-slate-100 text-slate-505 border-slate-200';
                  let textLabel = 'Normal Velocity';

                  if (item.status === 'fast') {
                    badgeColors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    textLabel = 'Fast-Moving (Hot)';
                  } else if (item.status === 'low') {
                    badgeColors = 'bg-amber-50 text-amber-700 border-amber-200';
                    textLabel = 'Low-Stock Alert';
                  } else if (item.status === 'dead') {
                    badgeColors = 'bg-rose-50 text-rose-700 border-rose-200';
                    textLabel = 'Dead-Stock Idle';
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 text-slate-705">
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 uppercase tracking-wide font-black">CAT: {item.category}</span>
                      </td>
                      <td className="py-4 px-5 text-slate-600 text-xs font-mono font-medium">{item.variant}</td>
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {onUpdateInventoryItem && (
                            <button
                              type="button"
                              onClick={() => {
                                if (item.stock > 0) {
                                  onUpdateInventoryItem(item.id, { stock: item.stock - 1 });
                                }
                              }}
                              className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] flex items-center justify-center cursor-pointer select-none active:scale-90 transition-all border border-slate-350"
                              title="Decrease Stock"
                            >
                              -
                            </button>
                          )}
                          <span className={`inline-block px-2.5 py-1 text-xs font-black rounded-md font-mono ${
                            isLow 
                              ? 'bg-rose-50 text-rose-700 border border-rose-250 animate-pulse' 
                              : 'bg-slate-100 border border-slate-200 text-slate-900'
                          }`}>
                            {item.stock} unit{item.stock !== 1 ? 's' : ''}
                          </span>
                          {onUpdateInventoryItem && (
                            <button
                              type="button"
                              onClick={() => onUpdateInventoryItem(item.id, { stock: item.stock + 1 })}
                              className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] flex items-center justify-center cursor-pointer select-none active:scale-90 transition-all border border-slate-350"
                              title="Increase Stock"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-800">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-5 text-right font-mono font-black text-slate-900">₹{subtotal.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-flex items-center text-[10px] font-black px-2.5 py-0.5 rounded-full border ${badgeColors}`}>
                          {textLabel}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setEditName(item.name);
                            setEditVariant(item.variant);
                            setEditStock(item.stock);
                            setEditRate(item.rate);
                            setEditCategory(item.category);
                            setEditStatus(item.status);
                            setShowEditModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-md text-[10px] bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 transition-colors font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          ✏️ Edit Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-550 text-xs">
                    No matching products located in active session register
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-display">
                  Add Stock Item Entry
                </h4>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="p-5 space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">Product Name (Aarti / Jeans / Metal)</label>
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Designer Saree"
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">{col3} details</label>
                  <input 
                    type="text" 
                    value={newVariant}
                    onChange={(e) => setNewVariant(e.target.value)}
                    placeholder="e.g. Free Size · Pink"
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Opening Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Selling Unit Rate (₹)</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={newRate}
                      onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">Inventory Category Tag</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                  >
                    <option value="">Other / General</option>
                    <option value="jeans">Jeans (Denim)</option>
                    <option value="shirt">Shirts</option>
                    <option value="kurta">Kurta & Ethnic</option>
                    <option value="saree">Sarees</option>
                    <option value="kurti">Kurtis</option>
                  </select>
                </div>

                <div className="pt-3 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 rounded-lg text-xs font-black select-none cursor-pointer border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 rounded-lg text-xs font-black text-white select-none cursor-pointer hover:bg-teal-850"
                    style={{ backgroundColor: accentColor }}
                  >
                    Confirm & Store Unit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-display">
                  Edit Stock Item Details
                </h4>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditProduct} className="p-5 space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 block">{col3} details</label>
                  <input 
                    type="text" 
                    value={editVariant}
                    onChange={(e) => setEditVariant(e.target.value)}
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Quantity in Stock</label>
                    <input 
                    type="number" 
                    min="0"
                    required
                    value={editStock}
                    onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                  />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Selling Unit Rate (₹)</label>
                    <input 
                    type="number" 
                    min="1"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-350 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                  />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Category Tag</label>
                    <select 
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    >
                      <option value="">Other / General</option>
                      <option value="jeans">Jeans (Denim)</option>
                      <option value="shirt">Shirts</option>
                      <option value="kurta">Kurta & Ethnic</option>
                      <option value="saree">Sarees</option>
                      <option value="kurti">Kurtis</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-600 block">Sales Velocity</label>
                    <select 
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ItemStatus)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-600 font-semibold"
                    >
                      <option value="normal">Normal Velocity</option>
                      <option value="fast">Fast-Moving (Hot) 🔥</option>
                      <option value="low">Low stock alert ⚠️</option>
                      <option value="dead">Dead stock idle ❄️</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 rounded-lg text-xs font-black select-none cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                  <button 
                  type="submit"
                  className="flex-1 py-2 rounded-lg text-xs font-black text-white select-none cursor-pointer hover:bg-teal-850"
                  style={{ backgroundColor: accentColor }}
                >
                  Save Changes
                </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
