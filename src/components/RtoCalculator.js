import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

const PRESETS = [
  { label: '50 / day', orders: 50, aov: 1299, cod: 70, rto: 30 },
  { label: '150 / day', orders: 150, aov: 1499, cod: 65, rto: 28 },
  { label: '300 / day', orders: 300, aov: 1899, cod: 60, rto: 25 },
  { label: '500 / day', orders: 500, aov: 2199, cod: 55, rto: 22 },
];

const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  }).format(val);
};

export default function RtoCalculator() {
  const [dailyOrders, setDailyOrders] = useState(150);
  const [aov, setAov] = useState(1499);
  const [codShare, setCodShare] = useState(65);
  const [rtoRate, setRtoRate] = useState(28);
  const [courierRtoCost, setCourierRtoCost] = useState(160);

  // FinOps Calculations
  const stats = useMemo(() => {
    const monthlyOrders = dailyOrders * 30;
    const monthlyCodOrders = Math.round(monthlyOrders * (codShare / 100));
    const monthlyRtoOrders = Math.round(monthlyCodOrders * (rtoRate / 100));

    // Direct freight bleed paid to courier partners (forward + reverse + packaging damage)
    const monthlyFreightLoss = monthlyRtoOrders * courierRtoCost;

    // Value of inventory locked up in reverse logistics transit (12-18 days average)
    const lockedInventoryValue = Math.round(monthlyRtoOrders * aov);

    // nimbleAI Shield Results:
    // 1. 50% average reduction in RTO orders via address validation + fraud pin scoring + WhatsApp confirmation
    const rtoOrdersPrevented = Math.round(monthlyRtoOrders * 0.50);
    const directFreightSaved = rtoOrdersPrevented * courierRtoCost;

    // 2. Recovered Abandoned Cart Net Margin (recovering ~3.9% additional checkouts at 35% gross product margin)
    const recoveredCartGross = Math.round(monthlyOrders * 0.03904783 * aov);
    const recoveredCartNetMargin = Math.round(recoveredCartGross * 0.35);

    // 3. 22% of remaining COD orders converted to upfront 1-tap UPI prepaid
    const codConvertedToPrepaid = Math.round(monthlyCodOrders * 0.22);
    const prepaidRevenueUnlocked = Math.round(codConvertedToPrepaid * aov);

    // Total Net Monthly Margin Protected (Direct Courier Freight Saved + Recovered Abandoned Cart Net Margin)
    const totalMonthlyProtected = directFreightSaved + recoveredCartNetMargin;
    const annualEbitdaShielded = totalMonthlyProtected * 12;

    return {
      monthlyOrders,
      monthlyCodOrders,
      monthlyRtoOrders,
      monthlyFreightLoss,
      lockedInventoryValue,
      rtoOrdersPrevented,
      directFreightSaved,
      recoveredCartNetMargin,
      codConvertedToPrepaid,
      prepaidRevenueUnlocked,
      totalMonthlyProtected,
      annualEbitdaShielded,
    };
  }, [dailyOrders, aov, codShare, rtoRate, courierRtoCost]);

  const applyPreset = (preset) => {
    setDailyOrders(preset.orders);
    setAov(preset.aov);
    setCodShare(preset.cod);
    setRtoRate(preset.rto);
  };

  return (
    <div id="rto-calculator" className="py-20 bg-gray-50 relative overflow-hidden border-t border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust-50 border border-trust-200 text-trust-700 text-xs font-semibold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" />
            RTO & Margin Impact Analysis
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Quantify Your Monthly RTO Loss and Recovery Potential.
          </h2>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
            Returned COD shipments carry a compounded cost: forward freight, reverse pickup, packaging waste, and inventory tied up in reverse logistics for 12–18 days. Enter your store parameters below to see your exact exposure and the recoverable margin.
          </p>

          {/* Quick Volume Presets */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Quick founder presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`text-xs px-3 py-1 rounded-lg border transition-all ${
                  dailyOrders === p.orders
                    ? 'bg-trust-50 border-trust-400 text-trust-700 font-semibold'
                    : 'bg-white border-gray-300 text-slate-600 hover:border-trust-400 hover:text-trust-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
          {/* Left Inputs Column */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-gray-100 pb-4">
              <span>Your Store Unit Economics</span>
              <span className="text-xs font-normal text-slate-400 font-mono">(Adjust sliders)</span>
            </h3>

            {/* Slider 1: Daily Orders */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-700 font-medium">Daily Orders Shipped:</span>
                <span className="font-mono font-bold text-slate-900 bg-gray-100 px-3 py-1 rounded border border-gray-200">
                  {dailyOrders} orders / day
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="500"
                step="10"
                value={dailyOrders}
                onChange={(e) => setDailyOrders(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-trust-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>30/day (Starter)</span>
                <span>150/day</span>
                <span>300/day</span>
                <span>500/day (Scale)</span>
              </div>
            </div>

            {/* Slider 2: Average Order Value (AOV) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-700 font-medium">Average Order Value (AOV):</span>
                <span className="font-mono font-bold text-slate-900 bg-gray-100 px-3 py-1 rounded border border-gray-200">
                  {formatINR(aov)}
                </span>
              </div>
              <input
                type="range"
                min="600"
                max="5000"
                step="50"
                value={aov}
                onChange={(e) => setAov(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-trust-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>₹600</span>
                <span>₹1,500</span>
                <span>₹3,000</span>
                <span>₹5,000</span>
              </div>
            </div>

            {/* Slider 3: COD Order Share */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-700 font-medium">Cash On Delivery (COD) Share:</span>
                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded border border-amber-200">
                  {codShare}% of orders
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={codShare}
                onChange={(e) => setCodShare(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>30%</span>
                <span>65% (Avg Indian D2C)</span>
                <span>90%</span>
              </div>
            </div>

            {/* Slider 4: Current COD RTO Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-700 font-medium">Current RTO Rate on COD:</span>
                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded border border-rose-200">
                  {rtoRate}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={rtoRate}
                onChange={(e) => setRtoRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>10% (Low)</span>
                <span>28% (Typical D2C)</span>
                <span>45% (Critical Bleed)</span>
              </div>
            </div>

            {/* Slider 5: Average Courier Loss per RTO */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 text-xs">Direct Courier Freight Lost per RTO:</span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  ₹{courierRtoCost} / returned order
                </span>
              </div>
              <input
                type="range"
                min="120"
                max="240"
                step="10"
                value={courierRtoCost}
                onChange={(e) => setCourierRtoCost(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
              />
              <p className="text-[10px] text-slate-400">
                Covers forward shipping, reverse courier pickup, plus packaging destruction.
              </p>
            </div>
          </div>

          {/* Right Output Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Current Financial Bleed Card */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                Current Monthly RTO Exposure
              </div>
              <div className="text-3xl font-extrabold text-rose-600 font-mono tabular-finops">
                {formatINR(stats.monthlyFreightLoss)}
                <span className="text-xs font-normal text-rose-400 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Direct courier charges on <strong className="text-slate-900 font-mono">{stats.monthlyRtoOrders} returned orders</strong>, with an additional <strong className="text-slate-900 font-mono">{formatINR(stats.lockedInventoryValue)}</strong> in inventory held in reverse transit.
              </p>
            </div>

            {/* nimbleAI Shield Recovery Card */}
            <div className="bg-white border-2 border-emerald-400 rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold font-mono border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  nimbleAI Protected Output
                </div>
                <span className="tag-nimble-confirmed text-[10px]">
                  Nimble-Confirmed
                </span>
              </div>

              {/* Protected Margin Headline */}
              <div className="space-y-1 mb-6">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Total Net Monthly Margin Protected
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold text-emerald-600 font-mono tabular-finops tracking-tight">
                  +{formatINR(stats.totalMonthlyProtected)}
                  <span className="text-xs font-normal text-slate-500 ml-1">/ mo</span>
                </div>
                <div className="text-xs text-emerald-700 font-medium pt-1">
                  Plus {formatINR(stats.prepaidRevenueUnlocked)} / mo in locked-in Prepaid UPI cashflow!
                </div>
              </div>

              {/* Verifiable FinOps Breakdown */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-3">
                  Verifiable FinOps Margin Breakdown:
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between items-start pb-2 border-b border-emerald-100">
                    <div>
                      <span className="font-medium text-slate-900">• Direct Courier Freight Saved</span>
                      <p className="text-[10px] text-slate-500 font-mono">(50% RTO Reduction on Remaining COD)</p>
                    </div>
                    <strong className="text-emerald-700 font-mono text-xs whitespace-nowrap">+{formatINR(stats.directFreightSaved)} / mo</strong>
                  </div>
                  <div className="flex justify-between items-start pb-2 border-b border-emerald-100">
                    <div>
                      <span className="font-medium text-slate-900">• Recovered Abandoned Cart Net Margin</span>
                      <p className="text-[10px] text-slate-500 font-mono">(at 35% Gross Margin)</p>
                    </div>
                    <strong className="text-emerald-700 font-mono text-xs whitespace-nowrap">+{formatINR(stats.recoveredCartNetMargin)} / mo</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-slate-900">Total Net Monthly Margin Protected:</span>
                    <strong className="text-emerald-700 font-mono text-sm whitespace-nowrap">+{formatINR(stats.totalMonthlyProtected)} / mo</strong>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-emerald-200 text-[11px] text-slate-600 flex justify-between items-center font-mono">
                  <span>Locked-in Prepaid UPI Cashflow:</span>
                  <span className="text-emerald-700 font-bold">{formatINR(stats.prepaidRevenueUnlocked)} / mo</span>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 flex justify-between items-center font-mono">
                  <span>Annual EBITDA Shielded:</span>
                  <span className="text-slate-800 font-bold">+{formatINR(stats.annualEbitdaShielded)} / yr</span>
                </div>
              </div>

              {/* Call to action */}
              <a
                href="#waitlist"
                className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all duration-150"
              >
                <span>Shield Your Store Margins</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <p className="text-[10px] text-center text-slate-400 mt-3 font-mono">
                5 min waba and shopify sync · Zero code required · Payback in &lt; 7 days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
