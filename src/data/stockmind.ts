import { StoreState } from '../types';

export const STOCKMIND_STORES: Record<string, StoreState> = {
  kapda: {
    name: "Manglam Vastralya",
    emoji: "👕",
    col3: "Size / Colour",
    invSub: "Fashion catalog — Sarees, Suit Pieces, Jeans & Ethic Wear",
    custSub: "Manglam Vastralya Customer Ledger Directory",
    inventory: [
      { id: "k-1", name: "Blue Jeans", variant: "32 · Blue", stock: 45, rate: 850, status: "fast", category: "jeans", soldThisWeek: 45 },
      { id: "k-2", name: "Black Jeans", variant: "34 · Black", stock: 32, rate: 900, status: "fast", category: "jeans", soldThisWeek: 38 },
      { id: "k-3", name: "White Shirt", variant: "M · White", stock: 18, rate: 550, status: "normal", category: "shirt", soldThisWeek: 29 },
      { id: "k-4", name: "Floral Saree", variant: "Free Size · Pink", stock: 8, rate: 1200, status: "low", category: "saree", soldThisWeek: 11 },
      { id: "k-5", name: "Old Kurta Set", variant: "L · Yellow", stock: 60, rate: 480, status: "dead", category: "kurta", soldThisWeek: 0 },
      { id: "k-6", name: "Denim Jacket", variant: "XL · Dark Blue", stock: 5, rate: 1800, status: "low", category: "jacket", soldThisWeek: 4 },
      { id: "k-7", name: "Red Kurti", variant: "S · Red", stock: 22, rate: 380, status: "normal", category: "kurti", soldThisWeek: 15 },
      { id: "k-8", name: "Printed Shirt", variant: "M · Grey", stock: 75, rate: 420, status: "dead", category: "shirt", soldThisWeek: 0 }
    ],
    customers: [
      { 
        id: "c-k1", 
        name: "Ramesh Kumar", 
        phone: "9876543210", 
        spent: 48500, 
        last: "2 days ago", 
        udhaar: 0, 
        tag: "VIP", 
        city: "Andheri, Mumbai", 
        notes: "Prefers slim fit jeans, size 32. Friendly local trader.",
        occupation: "Independent Textile Trader",
        ledger: [
          { id: "led-rk1", date: "2026-05-10", type: "Credit", amount: 15000, notes: "Purchased premium sherwani set", billNo: "SM-2026-004" },
          { id: "led-rk2", date: "2026-05-15", type: "Payment", amount: 15000, mode: "UPI / PhonePe / GPay", notes: "Cleared wedding attire balance" }
        ]
      },
      { 
        id: "c-k2", 
        name: "Sunita Sharma", 
        phone: "9823456789", 
        spent: 32000, 
        last: "1 week ago", 
        udhaar: 4500, 
        tag: "Regular", 
        city: "Bandra, Mumbai", 
        notes: "Buys kurtas on credit, clears dues monthly.",
        occupation: "High School Principal",
        ledger: [
          { id: "led-ss1", date: "2026-05-20", type: "Credit", amount: 12000, notes: "Printed Saree set & boutique kurtis", billNo: "SM-2026-010" },
          { id: "led-ss2", date: "2026-06-01", type: "Payment", amount: 7500, mode: "Cash (Nakad)", notes: "Partial cash deposit at counter" }
        ]
      },
      { 
        id: "c-k3", 
        name: "Mohan Patel", 
        phone: "9712345678", 
        spent: 21000, 
        last: "3 days ago", 
        udhaar: 0, 
        tag: "Regular", 
        city: "Borivali, Mumbai", 
        notes: "Values high-quality cotton shirts.",
        occupation: "Civil Contractor",
        ledger: []
      },
      { 
        id: "c-k4", 
        name: "Priya Singh", 
        phone: "9654321098", 
        spent: 67000, 
        last: "Yesterday", 
        udhaar: 0, 
        tag: "VIP", 
        city: "South Mumbai", 
        notes: "Premium heavy sarees and bridal lehengas.",
        occupation: "Wedding Event Designer",
        ledger: []
      },
      { 
        id: "c-k5", 
        name: "Abdul Rehman", 
        phone: "9543210987", 
        spent: 8500, 
        last: "2 weeks ago", 
        udhaar: 2000, 
        tag: "New", 
        city: "Kurla, Mumbai", 
        notes: "Referred by Mohan. Prefers neutral colours.",
        occupation: "Chartered Accountant",
        ledger: [
          { id: "led-ar1", date: "2026-05-25", type: "Credit", amount: 4500, notes: "Selected shirts & casual jeans bundle", billNo: "SM-2026-015" },
          { id: "led-ar2", date: "2026-05-30", type: "Payment", amount: 2500, mode: "UPI / PhonePe / GPay", notes: "Repaid via PhonePe QR scan" }
        ]
      },
      { 
        id: "c-k6", 
        name: "Kavita Joshi", 
        phone: "9432109876", 
        spent: 15000, 
        last: "5 days ago", 
        udhaar: 1200, 
        tag: "Regular", 
        city: "Thane", 
        notes: "Regular buyer of printed kurtas.",
        occupation: "Boutique Owner & Homemaker",
        ledger: [
          { id: "led-kj1", date: "2026-06-02", type: "Credit", amount: 3200, notes: "Daily printed suit pieces", billNo: "SM-2026-017" },
          { id: "led-kj2", date: "2026-06-04", type: "Payment", amount: 2000, mode: "Cash (Nakad)", notes: "Deposited at store" }
        ]
      }
    ],
    topSelling: [
      { name: "Blue Jeans", sold: 45, rev: "₹38,250" },
      { name: "Black Jeans", sold: 38, rev: "₹34,200" },
      { name: "White Shirt", sold: 29, rev: "₹15,950" }
    ],
    deadStock: [
      { id: "ds-k1", name: "Old Kurta Set", stock: 60, days: 82, value: 28800, suggestion: "Discount 40% — Summer clearance" },
      { id: "ds-k2", name: "Printed Shirt", stock: 75, days: 95, value: 31500, suggestion: "Bundle offer — Buy 2 Get 1 Free" },
      { id: "ds-k3", name: "Pink Lehenga", stock: 20, days: 120, value: 120000, suggestion: "Liquidate at cost price to clear shelf" }
    ],
    suppliers: [
      { name: "Surat Textiles Pvt", items: 85, fast: 78, dead: 8, score: 9.2 },
      { name: "Mumbai Fabrics Co", items: 62, fast: 65, dead: 18, score: 7.1 },
      { name: "Jaipur Saree House", items: 40, fast: 42, dead: 35, score: 5.8 }
    ],
    buyreco: [
      { name: "Black Jeans 34", stock: 32, demand: 120, buy: 90, reason: "Diwali + wedding season surge expected" },
      { name: "Blue Jeans 32", stock: 45, demand: 150, buy: 110, reason: "Best seller, current stock won't last 2 weeks" },
      { name: "Silk Sarees", stock: 8, demand: 60, buy: 55, reason: "Winter wedding season starting next month" }
    ],
    festivals: [
      { name: "Ganesh Chaturthi", date: "Aug 2026", lift: "↑ 45%", items: "Kurtas, Sarees, Ethnic wear" },
      { name: "Navratri / Dussehra", date: "Oct 2026", lift: "↑ 80%", items: "Chaniya Choli, Lehenga, Festive ethnic" },
      { name: "Diwali", date: "Oct 2026", lift: "↑ 120%", items: "All ethnic wear, New Jeans, Gifting Shirts" },
      { name: "Wedding Season", date: "Nov–Feb", lift: "↑ 95%", items: "Heavy silk sarees, Bridal lehengas, Sherwanis" }
    ],
    aiSuggestions: [
      { icon: "🛍️", text: "Buy 350 Black Jeans now — category demand up 40% next month (wedding season prep)" },
      { icon: "🏷️", text: "Start 30% discount on Painted Shirts — 95 days without a sale. ₹31,500 cash stuck" },
      { icon: "⭐", text: "Ramesh Kumar hasn't visited in 14 days — send a friendly WhatsApp with custom offer" },
      { icon: "📦", text: "Floral Sarees almost out of stock — reorder from Surat Textiles instantly" }
    ],
    waReport: `📊 StockMind AI — Daily Report\n👕 Kapda Store | Sunday, 7 June 2026\n\n💰 Today's Sales:     ₹1,25,000\n🧾 Bills Made:        23\n👥 New Customers:     3\n\n🔥 Best Seller:       Blue Jeans (12 pcs)\n⚠️ Slow Mover:        Old Kurta Set (0 sold)\n\n🤖 AI Action:\n→ Start discount on Printed Shirts\n→ Reorder Black Jeans 34 (stock low)\n→ Send custom catalog to Ramesh Kumar`,
    bills: [
      { id: "b-k1", billNo: "SM-2026-023", customerName: "Ramesh Kumar", amount: 4250, status: "Paid", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 3 },
      { id: "b-k2", billNo: "SM-2026-022", customerName: "Walk-in Customer", amount: 1800, status: "Cash", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 1 },
      { id: "b-k3", billNo: "SM-2026-021", customerName: "Sunita Sharma", amount: 9600, status: "Udhaar", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 5 },
      { id: "b-k4", billNo: "SM-2026-020", customerName: "Walk-in Customer", amount: 3200, status: "UPI", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 2 },
      { id: "b-k5", billNo: "SM-2026-019", customerName: "Priya Singh", amount: 12400, status: "Paid", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 4 },
      { id: "b-k6", billNo: "SM-2026-018", customerName: "Walk-in Customer", amount: 93750, status: "Paid", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 8 }
    ],
    segments: [
      { label: "VIP / High Value", count: 4, color: "bg-purple-100 dark:bg-purple-950/45 text-purple-700 dark:text-purple-300", desc: "Spent ₹30,000+ · Orders every fortnight" },
      { label: "Regular Buyers", count: 18, color: "bg-green-100 dark:bg-green-950/45 text-green-700 dark:text-green-300", desc: "Spent ₹5,000–30,000 · Orders monthly" },
      { label: "Udhaar Customers", count: 6, color: "bg-red-100 dark:bg-red-950/45 text-red-700 dark:text-red-300", desc: "Active ledger credit balance outstanding" },
      { label: "Seasonal Shoppers", count: 10, color: "bg-amber-100 dark:bg-amber-950/45 text-amber-700 dark:text-amber-300", desc: "Purchase spikes purely during festivals" }
    ],
    topCust: [
      { name: "Priya Singh", spend: "₹67,000", fav: "Sarees & Ethnic", tag: "Loyal VIP" },
      { name: "Ramesh Kumar", spend: "₹48,500", fav: "Jeans & Shirts", tag: "Weekend Regular" },
      { name: "Sunita Sharma", spend: "₹32,000", fav: "Designer Kurtis", tag: "Monthly Regular" }
    ]
  },
  bartan: {
    name: "Bartan Store",
    emoji: "🍳",
    col3: "Type / Size",
    invSub: "Bartan store — all kitchen & utensil items",
    custSub: "Bartan store customers",
    inventory: [
      { id: "b-1", name: "Pressure Cooker", variant: "5L · Aluminium", stock: 22, rate: 1200, status: "fast", category: "pressure", soldThisWeek: 22 },
      { id: "b-2", name: "Non-stick Pan", variant: "28cm · Black Oxide", stock: 35, rate: 650, status: "fast", category: "pan", soldThisWeek: 28 },
      { id: "b-3", name: "Steel Thali Set", variant: "6pc · Premium Steel", stock: 14, rate: 480, status: "normal", category: "thali", soldThisWeek: 15 },
      { id: "b-4", name: "Copper Lota", variant: "500ml · Solid Copper", stock: 60, rate: 180, status: "dead", category: "copper", soldThisWeek: 0 },
      { id: "b-5", name: "Iron Kadai", variant: "Large · Cast Iron", stock: 8, rate: 900, status: "low", category: "kadai", soldThisWeek: 10 },
      { id: "b-6", name: "Mixer Jar", variant: "1L · Borosilicate Glass", stock: 18, rate: 320, status: "normal", category: "mixer", soldThisWeek: 6 }
    ],
    customers: [
      { id: "c-b1", name: "Geeta Mehta", phone: "9876501234", spent: 28000, last: "3 days ago", udhaar: 0, tag: "VIP", city: "Ghatkopar, Mumbai", notes: "Regular host. Prefers heavy-gauge copper-bottom steel cookware." },
      { id: "c-b2", name: "Suresh Nair", phone: "9765432109", spent: 15000, last: "1 week ago", udhaar: 3000, tag: "Regular", city: "Chembur, Mumbai", notes: "Caters small family functions. Buys on credit." },
      { id: "c-b3", name: "Lakshmi Rao", phone: "9654320198", spent: 9500, last: "2 weeks ago", udhaar: 0, tag: "Regular", city: "Mulund", notes: "Always buys non-stick pans. Prefers black coating." },
      { id: "c-b4", name: "Vijay Tiwari", phone: "9543201987", spent: 42000, last: "Yesterday", udhaar: 0, tag: "VIP", city: "Sion, Mumbai", notes: "Owner of Tiwari Catering. Buys in bulk kitchenware sets." }
    ],
    topSelling: [
      { name: "Non-stick Pan", sold: 28, rev: "₹18,200" },
      { name: "Pressure Cooker 5L", sold: 22, rev: "₹26,400" },
      { name: "Steel Thali Set", sold: 15, rev: "₹7,200" }
    ],
    deadStock: [
      { id: "ds-b1", name: "Copper Lota", stock: 60, days: 110, value: 10800, suggestion: "Bundle with steel thali set as gift combo" },
      { id: "ds-b2", name: "Old Brass Urli Set", stock: 30, days: 140, value: 18000, suggestion: "Sell at cost — decorative demand low in summers" }
    ],
    suppliers: [
      { name: "Rajkot Hardware Co", items: 65, fast: 82, dead: 6, score: 9.5 },
      { name: "Pune Utensils Ltd", items: 40, fast: 60, dead: 22, score: 6.8 }
    ],
    buyreco: [
      { name: "Pressure Cooker 5L", stock: 22, demand: 80, buy: 60, reason: "High gifting demand expected for upcoming wedding season" },
      { name: "Non-stick Pan 28cm", stock: 35, demand: 100, buy: 70, reason: "Consistent high fast-moving performance score" }
    ],
    festivals: [
      { name: "Diwali / Dhanteras", date: "Oct 2026", lift: "↑ 150%", items: "Steel Thalis, Gifting Utensil Sets, Cookware" },
      { name: "Wedding Season", date: "Nov–Feb", lift: "↑ 110%", items: "Full Kitchen Brass Sets, Luxury Dinner Kits" },
      { name: "Gudi Padwa", date: "Mar 2027", lift: "↑ 60%", items: "Copper Kalash, Puja Brassware, New Thalis" }
    ],
    aiSuggestions: [
      { icon: "🎁", text: "Dhanteras/Diwali stock warning — start ordering Gifting Thali Sets 2 months early to beat premium prices" },
      { icon: "🏷️", text: "Copper Lota has 110 days without sales — bundle with steel thalis for an attractive combo" },
      { icon: "⭐", text: "Vijay Tiwari (catering VIP) bought last week — offer exclusive commercial iron kadais" },
      { icon: "📦", text: "Iron Kadai stock critical (8 items left) — order immediately from Rajkot Hardware" }
    ],
    waReport: `📊 StockMind AI — Daily Report\n🍳 Bartan Store | Sunday, 7 June 2026\n\n💰 Today's Sales:     ₹68,000\n🧾 Bills Made:        11\n👥 New Customers:     1\n\n🔥 Best Seller:       Non-stick Pan (8 pcs)\n⚠️ Slow Mover:        Copper Lota (0 sold)\n\n🤖 AI Action:\n→ Bundle Copper Lota with Steel Thali\n→ Reorder Iron Kadai (only 8 left)\n→ Draft pre-booking catalogs for Diwali Dhanteras sets`,
    bills: [
      { id: "b-b1", billNo: "SM-2026-111", customerName: "Geeta Mehta", amount: 28000, status: "Paid", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 4 },
      { id: "b-b2", billNo: "SM-2026-110", customerName: "Suresh Nair", amount: 15000, status: "Udhaar", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 3 },
      { id: "b-b3", billNo: "SM-2026-109", customerName: "Lakshmi Rao", amount: 9500, status: "Paid", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 2 },
      { id: "b-b4", billNo: "SM-2026-108", customerName: "Vijay Tiwari", amount: 15500, status: "Paid", date: "2026-06-07", type: "Sale Bill (Bikri)", itemsCount: 3 }
    ],
    segments: [
      { label: "VIP / High Value", count: 2, color: "bg-purple-100 dark:bg-purple-950/45 text-purple-700 dark:text-purple-300", desc: "Spent ₹25,000+ · Catering & commercial orders" },
      { label: "Regular Buyers", count: 12, color: "bg-green-100 dark:bg-green-950/45 text-green-700 dark:text-green-300", desc: "Spent ₹3,000–25,000 · Monthly kitchen upgrades" },
      { label: "Udhaar Customers", count: 3, color: "bg-red-100 dark:bg-red-950/45 text-red-700 dark:text-red-300", desc: "Credit entries on copper or high-end items" },
      { label: "One-time Buyers", count: 8, color: "bg-amber-100 dark:bg-amber-950/45 text-amber-700 dark:text-amber-300", desc: "Holiday gifts or wedding registry items" }
    ],
    topCust: [
      { name: "Vijay Tiwari", spend: "₹42,000", fav: "Pressure Cookers", tag: "Bulk Caterer" },
      { name: "Geeta Mehta", spend: "₹28,000", fav: "Non-stick Range", tag: "Loyal VIP" },
      { name: "Suresh Nair", spend: "₹15,000", fav: "Steel Sets", tag: "Monthly Regular" }
    ]
  }
};
