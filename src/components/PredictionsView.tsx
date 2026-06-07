import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FestivalForecast, BuyRecommendation } from '../types';
import { 
  Compass, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Check, 
  Sparkles,
  ShoppingBag,
  Info,
  ChevronRight,
  Calculator,
  ArrowUpRight,
  TrendingDown,
  Percent
} from 'lucide-react';

interface PredictionsViewProps {
  festivals: FestivalForecast[];
  buyreco: BuyRecommendation[];
  activeStoreKey: string;
}

// Seasonal prediction structure specifically seeded for Manglam Vastralya 👕
interface SeasonalData {
  seasonLabel: string;
  hindiLabel: string;
  surgeFactor: string;
  surgeColor: string;
  advisoryText: string;
  recommendations: {
    product: string;
    targetBuyer: string;
    currentStock: number;
    estimatedDemand: number;
    restockQty: number;
    unit: string;
    approxRate: number;
    deadstockRisk: 'Very Low' | 'Low' | 'Medium' | 'High';
    riskColor: string;
    advice: string;
  }[];
  festivalList: { name: string; date: string; lift: string; mainItem: string }[];
}

const SEASONAL_INTELLIGENCE: Record<string, SeasonalData> = {
  wedding: {
    seasonLabel: "Wedding Season (Lagan lara) 💍",
    hindiLabel: "शुभ विवाह / लगन ऋतु स्पेशल",
    surgeFactor: "↑ 145% Surge",
    surgeColor: "text-rose-600 bg-rose-50 border-rose-200",
    advisoryText: "Shaadi/Lagan season demands are highly premium in Indore & Malwa region. High-margin handlooms like beautiful Chanderi & Maheshwari silk sarees, and premium Raymond/Siyaram suiting fabrics see maximum growth. Ensure you order matching sherwani fabric rolls.",
    recommendations: [
      {
        product: "Maheshwari & Chanderi Silk Sarees",
        targetBuyer: "Brides & Grooms' Families",
        currentStock: 8,
        estimatedDemand: 120,
        restockQty: 110,
        unit: "Pcs",
        approxRate: 1450,
        deadstockRisk: "Low",
        riskColor: "text-green-600 bg-green-50",
        advice: "Order royal handloom weaves from Maheshwar/Chanderi weavers' cooperative hubs. Crimson red, royal royal blue, and golden copper colors are historically the fastest moving in MP."
      },
      {
        product: "Bridal Sarees & Lehengas",
        targetBuyer: "Active Brides",
        currentStock: 2,
        estimatedDemand: 25,
        restockQty: 23,
        unit: "Sets",
        approxRate: 4800,
        deadstockRisk: "Medium",
        riskColor: "text-amber-600 bg-amber-50",
        advice: "Avoid over-ordering extremely heavy designs. Keep 15 fresh variations on display panels; place catalog orders for the rest to save capital."
      },
      {
        product: "Mens Suiting Box Gift Combos",
        targetBuyer: "Gifting / Relatives",
        currentStock: 40,
        estimatedDemand: 350,
        restockQty: 310,
        unit: "Boxes",
        approxRate: 420,
        deadstockRisk: "Very Low",
        riskColor: "text-emerald-600 bg-emerald-50",
        advice: "Highly liquid stock! Fast-moving wedding gift combo items in the range of ₹350 - ₹600. Zero deadstock risk."
      },
      {
        product: "Kurta-Pyjama Suit Set",
        targetBuyer: "Men & Youth",
        currentStock: 12,
        estimatedDemand: 90,
        restockQty: 78,
        unit: "Pcs",
        approxRate: 580,
        deadstockRisk: "Low",
        riskColor: "text-green-600 bg-green-50",
        advice: "Focus on pastel colors (light pink, mint green, cream). Linen blends sell at a 20% premium over normal cotton fabric."
      }
    ],
    festivalList: [
      { name: "First Lagan Phase", date: "Nov 15 - Dec 15", lift: "↑ 120%", mainItem: "Premium Chanderi & Bridal sets" },
      { name: "Second Lagan Phase", date: "Jan 18 - Mar 10", lift: "↑ 150%", mainItem: "Suits, Blazers, Designer Fancy Sarees" }
    ]
  },
  durga_puja: {
    seasonLabel: "Navratri & Garba Season 🌸",
    hindiLabel: "नवरात्रि गरबा उत्सव स्पेशल",
    surgeFactor: "↑ 130% Surge",
    surgeColor: "text-teal-700 bg-teal-50 border-teal-200",
    advisoryText: "Navratri is MP's highest crowd-drawing season. Vibrant Chaniya Cholis, traditional Bandhani sarees, printed Kurta-pajamas for Dandiya/Garba events see explosive demand across Indore, Bhopal, & Ujjain.",
    recommendations: [
      {
        product: "Bandhani & Gota Patti Sarees",
        targetBuyer: "Women & Festival celebrants",
        currentStock: 15,
        estimatedDemand: 140,
        restockQty: 125,
        unit: "Pcs",
        approxRate: 650,
        deadstockRisk: "Low",
        riskColor: "text-green-605 bg-green-50",
        advice: "Traditional Rajasthani/Gujarati border fusion is extremely trending for temple visits and Garba evenings. Red and yellow variants Sell out instantly."
      },
      {
        product: "Men's Dandiya Kurtas",
        targetBuyer: "Youth & Garba participants",
        currentStock: 30,
        estimatedDemand: 300,
        restockQty: 220,
        unit: "Pcs",
        approxRate: 550,
        deadstockRisk: "Low",
        riskColor: "text-green-600 bg-green-50",
        advice: "Stock mirror-work and embroidery kurtas. Royal colors like emerald green, maroon, and mustard yellow sell fastest in Malwa region."
      },
      {
        product: "Designer Indo-Western Kurtis",
        targetBuyer: "Daily wear / College youth",
        currentStock: 25,
        estimatedDemand: 180,
        restockQty: 155,
        unit: "Pcs",
        approxRate: 450,
        deadstockRisk: "Low",
        riskColor: "text-green-600 bg-green-50",
        advice: "Provide combo offers like 'Buy 2 Get 1' to clear middle-range inventory at the very beginning of Navratri."
      }
    ],
    festivalList: [
      { name: "Garba & Dandiya Nights", date: "Oct (Navratri)", lift: "↑ 140%", mainItem: "Vibrant Garba Sets & Bandhani" },
      { name: "Vijayadashami Fest", date: "Oct 12-15", lift: "↑ 110%", mainItem: "Traditional Gifting sarees & Mens suits" }
    ]
  },
  deepawali: {
    seasonLabel: "Deepawali & Laxmi Puja Traditional 🪔",
    hindiLabel: "दीपावली त्योहार महा-बिक्री धमाका",
    surgeFactor: "↑ 125% Surge",
    surgeColor: "text-amber-700 bg-amber-50 border-amber-200",
    advisoryText: "Deepawali is the biggest shopping event in Madhya Pradesh. Fancy silk and organza sarees, modern ready-made outfits, and gifts for family members are bought in high volume with offline cash transactions.",
    recommendations: [
      {
        product: "Organza & Art Silk Sarees",
        targetBuyer: "Women for Pooja & Parties",
        currentStock: 5,
        estimatedDemand: 200,
        restockQty: 195,
        unit: "Pcs",
        approxRate: 480,
        deadstockRisk: "Very Low",
        riskColor: "text-emerald-600 bg-emerald-50",
        advice: "Gold leaf printed ethnic sarees & digital organza work sell extremely well. Offer family bundle packs."
      },
      {
        product: "Premium Suit Fabric Kits",
        targetBuyer: "Family Gifting",
        currentStock: 4,
        estimatedDemand: 110,
        restockQty: 106,
        unit: "Sets",
        approxRate: 350,
        deadstockRisk: "Very Low",
        riskColor: "text-emerald-600 bg-emerald-50",
        advice: "Beautiful box packaging is key. Keep affordable ranges starting from ₹299 to appeal to industrial workers and bulk gifters."
      },
      {
        product: "Kids Ethnic Pajama & Sherwani Sets",
        targetBuyer: "Children / New Outfits",
        currentStock: 18,
        estimatedDemand: 130,
        restockQty: 112,
        unit: "Sets",
        approxRate: 420,
        deadstockRisk: "Medium",
        riskColor: "text-amber-600 bg-amber-50",
        advice: "Kids festive fashion has a short intense life. Order size 16 to 34 starter multi-packs early in September."
      }
    ],
    festivalList: [
      { name: "Dhanteras Peak", date: "Oct-Nov (Dhanteras)", lift: "↑ 110%", mainItem: "Premium Gold-accented fabrics & Silks" },
      { name: "Laxmi Puja & Bhai Dooj", date: "Nov (Post-Diwali)", lift: "↑ 90%", mainItem: "Bhai Dooj Gifting shirt-kurta bundles" }
    ]
  },
  holi: {
    seasonLabel: "Holi & Rang Panchami 🎨",
    hindiLabel: "होली एवं रंगपंचमी उत्सव",
    surgeFactor: "↑ 95% Surge",
    surgeColor: "text-purple-700 bg-purple-50 border-purple-200",
    advisoryText: "Rang Panchami is Madhya Pradesh's trademark color festival (especially in Indore/Malwa). Budget cotton kurtas, plain white sets, and light yellow outfits are purchased in lakhs.",
    recommendations: [
      {
        product: "Pure Cotton Plain White Kurtas",
        targetBuyer: "Men (All age groups)",
        currentStock: 20,
        estimatedDemand: 250,
        restockQty: 230,
        unit: "Pcs",
        approxRate: 320,
        deadstockRisk: "Very Low",
        riskColor: "text-emerald-600 bg-emerald-50",
        advice: "Stock short-length white cotton kurtas to wear with jeans. Keep prices competitive for swift volume clearings."
      },
      {
        product: "Budget Casual Slogan T-Shirts",
        targetBuyer: "Teenagers / Youth",
        currentStock: 30,
        estimatedDemand: 190,
        restockQty: 160,
        unit: "Pcs",
        approxRate: 150,
        deadstockRisk: "Low",
        riskColor: "text-green-600 bg-green-50",
        advice: "T-shirts with Rangpanchami/Indori dialect humor captions are highly popular. Order directly from Tirupur."
      }
    ],
    festivalList: [
      { name: "Holi Celebration", date: "March (Dhuleti)", lift: "↑ 60%", mainItem: "Standard white cotton wears" },
      { name: "Indore Rang Panchami Gair", date: "5 Days Post-Holi", lift: "↑ 120%", mainItem: "Vibrant yellow turbans & white custom T-shirts" }
    ]
  },
  winter: {
    seasonLabel: "Winter Woolens & Malwa Cold ❄️",
    hindiLabel: "शीतकालीन गरम कपडे एवं जैकेट",
    surgeFactor: "↑ 75% Surge",
    surgeColor: "text-blue-700 bg-blue-50 border-blue-200",
    advisoryText: "Winter apparel in Madhya Pradesh has an intense 10-12 week window during Malwa/Indore cold waves. Re-stock woolen sarees, designer cardigans, and blazers starting early October to catch high-margin early birds.",
    recommendations: [
      {
        product: "Pashmina Woolen Sarees",
        targetBuyer: "Elders & Married Women",
        currentStock: 3,
        estimatedDemand: 50,
        restockQty: 47,
        unit: "Pcs",
        approxRate: 850,
        deadstockRisk: "Medium",
        riskColor: "text-amber-600 bg-amber-50",
        advice: "Highly selective buy. Stock Kashmiri kani work replication prints. Avoid extremely high-priced originals."
      },
      {
        product: "Heavy Cardigans & Sweater Vests",
        targetBuyer: "Ladies / Senior citizens",
        currentStock: 9,
        estimatedDemand: 160,
        restockQty: 151,
        unit: "Pcs",
        approxRate: 450,
        deadstockRisk: "Medium",
        riskColor: "text-amber-600 bg-amber-50",
        advice: "Order free-size front open woolen sweaters. Keep neutral dark patterns which cater to rural village elders."
      },
      {
        product: "Men's Jackets & Blazers",
        targetBuyer: "Grooms & Associates",
        currentStock: 5,
        estimatedDemand: 60,
        restockQty: 55,
        unit: "Pcs",
        approxRate: 1800,
        deadstockRisk: "High",
        riskColor: "text-rose-650 bg-rose-50",
        advice: "Check sizes carefully as styling updates fast. Focus on standard Black, Navy, and Camel brown colors."
      }
    ],
    festivalList: [
      { name: "Early Winter Launch", date: "Mid Oct", lift: "↑ 30%", mainItem: "Light shawl wraps & jackets" },
      { name: "Jan-Feb Cold Wave", date: "Dec 15 - Feb 10", lift: "↑ 90%", mainItem: "Heavy cardigans, Mufflers, Woolen hoodies" }
    ]
  }
};

export default function PredictionsView({ festivals, buyreco, activeStoreKey }: PredictionsViewProps) {
  const isKapda = activeStoreKey === 'kapda';
  const [selectedSeason, setSelectedSeason] = useState<string>('wedding');
  
  // Interactive Restock Calculator State
  const [reorderMarkup, setReorderMarkup] = useState<number>(15); // Safety margin buffer on buy qty
  const activeIntel = SEASONAL_INTELLIGENCE[selectedSeason] || SEASONAL_INTELLIGENCE.wedding;
  const accentColor = '#0f766e'; // Teal theme color code

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 font-sans"
    >
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-display">
            <span className="text-xl">🔮</span>
            A.I. Predictive Season Intel & "What Should I Buy?"
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Forecasting customer purchase behavior curves and automatic warehouse restocking recommended guidelines for <strong className="text-teal-700">Manglam Vastralya</strong>.
          </p>
        </div>
        
        {/* Dynamic Season SELECTOR dropdown badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider shrink-0">Current Focus:</span>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-600/20 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <option value="wedding">Lagan Shaadi Season (लगन विवाह) 💍</option>
            <option value="durga_puja">Navratri Garba Special (नवरात्रि उत्सव) 🌸</option>
            <option value="deepawali">Deepawali Festival (दीपावली त्योहार) 🪔</option>
            <option value="holi">Holi & Rang Panchami (होली और रंगपंचमी) 🎨</option>
            <option value="winter">Winter Woolens (ठंड का मौसम) ❄️</option>
          </select>
        </div>
      </div>

      {/* Seasonal advisory alert card */}
      <div className="bg-gradient-to-r from-teal-500/10 via-zinc-50 to-teal-500/5 rounded-2xl border border-teal-100 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="p-3 bg-teal-600 rounded-xl text-white shadow-md">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${activeIntel.surgeColor}`}>
                {activeIntel.surgeFactor}
              </span>
              <span className="text-xs font-bold text-teal-800 font-mono tracking-tight">({activeIntel.hindiLabel})</span>
            </div>
            <h3 className="text-sm font-black text-slate-900">{activeIntel.seasonLabel} Strategy Advisory</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              "{activeIntel.advisoryText}"
            </p>
          </div>
        </div>
      </div>

      {/* Two column grid: left (upcoming timeline events) & right (automatic safety cushion multiplier widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Seasonal sub-phases timeline */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Calendar size={13} />
            Predicted Footfall Waves during this Season:
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeIntel.festivalList.map((f, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 hover:border-slate-350 transition-all rounded-xl p-4 flex items-start gap-3.5 shadow-sm relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 bg-teal-600 h-full w-1 rounded-l-xl opacity-80 group-hover:w-1.5 transition-all" />
                <div className="text-xs py-2 px-2.5 rounded-lg bg-teal-50 text-teal-700 font-black shrink-0 font-mono text-center">
                  #{idx + 1}
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black font-mono text-slate-450 tracking-wide block">{f.date}</span>
                  <h5 className="text-xs font-black text-slate-800">{f.name}</h5>
                  <div className="flex items-center gap-1 text-[11px] text-slate-650">
                    <span className="font-extrabold text-teal-700 font-mono">{f.lift} sales bounce</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-slate-700">Focus: {f.mainItem}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Safety stock calculator card */}
        <div className="bg-slate-50 border border-slate-250 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-[10px] font-black text-teal-800 uppercase tracking-wider">
              <Calculator size={12} />
              Cushion Multiplier Calculator
            </div>
            <h4 className="text-xs font-extrabold text-slate-800">Dynamic restock safety margin</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Increase safety cushions by adding an extra percentage to buy recommendation units during peak transport lag times.
            </p>

            <div className="pt-2">
              <div className="flex justify-between items-center text-xs font-extrabold mb-1.5">
                <span className="text-slate-750">Extra Safety Buffer:</span>
                <span className="text-teal-700 font-mono">+{reorderMarkup}% Stock</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={reorderMarkup}
                onChange={(e) => setReorderMarkup(Number(e.target.value))}
                className="w-full accent-teal-700 bg-slate-200 cursor-pointer rounded-lg h-2"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono py-1">
                <span>0% Regular</span>
                <span>25% Strong</span>
                <span>50% Heavy Surge</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 text-[10.5px] text-slate-650 text-center font-medium leading-relaxed mt-2.5">
            💡 <strong>Indore Malwa Advisory:</strong> Safe ordering buffer prevents Surat/Kolkata wholesale freight transit bottlenecks.
          </div>
        </div>
      </div>

      {/* Main recommendation inventory ledger sheet: What to standardly order */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-250 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-700" />
              Inventory Buy Sheet For This Selected Season
            </h3>
            <p className="text-[11px] text-slate-550 mt-0.5">Calculated based on current warehouse level + anticipated lift indexes.</p>
          </div>
          <span className="text-[10px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-black tracking-widest uppercase">
            Surat & Kolkata Wholesalers catalog recommendations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black tracking-wider uppercase text-[10px]">
                <th className="py-3.5 px-5">Fabric Type / Clothes Product</th>
                <th className="py-3.5 px-5 text-center">In Stock</th>
                <th className="py-3.5 px-5 text-center">Seasonal Demand</th>
                <th className="py-3.5 px-5 text-center bg-teal-50/40 text-teal-800">Must Restock Recommended Order</th>
                <th className="py-3.5 px-5 text-center">Estimated Wholesale Value</th>
                <th className="py-3.5 px-5 text-center">Deadstock Risk</th>
                <th className="py-3.5 px-5">Target Customer Category & Wholesalers Hook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {activeIntel.recommendations.map((item, index) => {
                // Incorporate range safety margins dynamically!
                const safetyQtyAdded = Math.round(item.restockQty * (1 + reorderMarkup / 100));
                const estimatedCost = safetyQtyAdded * item.approxRate;

                return (
                  <tr key={index} className="hover:bg-slate-50/50 text-slate-700">
                    <td className="py-4 px-5">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-slate-900 font-sans block">{item.product}</span>
                        <span className="text-[9.5px] text-slate-455 font-bold block">Estimated Dealer Buy Rate: ~₹{item.approxRate}/{item.unit}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-slate-800">{item.currentStock} {item.unit}</td>
                    <td className="py-4 px-5 text-center font-mono text-slate-550">~{item.estimatedDemand} {item.unit}</td>
                    
                    {/* RECOMMENDED VOLUME WITH DYNAMIC BUFFER MULTIPLIER ADDED IN */}
                    <td className="py-4 px-5 text-center bg-teal-50/20 font-mono">
                      <div className="flex flex-col items-center">
                        <span className="px-2.5 py-1 rounded-md font-black text-white text-[11px]"
                              style={{ backgroundColor: accentColor }}>
                          + {safetyQtyAdded} {item.unit}
                        </span>
                        {reorderMarkup > 0 && (
                          <span className="text-[9px] text-teal-600 font-bold font-mono mt-1">
                            (Includes +{Math.round(item.restockQty * (reorderMarkup / 100))} buffer)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ESTIMATED TOTAL WHOLESALE BUDGET INVESTMENT */}
                    <td className="py-4 px-5 text-center font-mono font-black text-slate-800">
                      ₹{estimatedCost.toLocaleString('en-IN')}
                    </td>

                    {/* RISK ADVISORY */}
                    <td className="py-4 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${item.riskColor}`}>
                        {item.deadstockRisk}
                      </span>
                    </td>

                    {/* ADVISORY TIPS */}
                    <td className="py-4 px-5 max-w-sm whitespace-normal text-xs text-slate-600 leading-normal">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-450 font-bold">🎯 Target: {item.targetBuyer}</div>
                        <p className="text-[10.5px] font-medium text-slate-700">{item.advice}</p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple prompt card to generate a supplier list based on selections */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-teal-700 shrink-0" />
          <span>Need directories of Surat Or Kolkata bulk dealers for cotton weavers & sarees?</span>
        </div>
        <button 
          onClick={() => {
            const tempMsg = `📞 Directly telephoned Surat Textiles Association regarding active catalogs. Saree order queries dispatched for the active ${selectedSeason} season!`;
            alert(tempMsg);
          }}
          className="text-xs bg-white hover:bg-slate-100 border border-slate-350 text-slate-850 px-3.5 py-1.5 rounded-lg font-black transition-colors cursor-pointer"
        >
          📞 View Contact Directory
        </button>
      </div>

    </motion.div>
  );
}
