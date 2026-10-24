import React, { useState, useEffect, useRef } from "react";
import {
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Zap,
  Check,
  Pause,
  Play
} from "lucide-react";

// The 4 Solutions data for the WhatsApp Carousel
const SOLUTIONS = [
  {
    id: "cod",
    tabLabel: "COD & RTO Shield",
    eyebrow: "Margin Protection",
    headline: "Pre-dispatch Address & UPI Conversion",
    stat: "RTO 34% → 3.8%",
    statSub: "₹160 courier loss shielded per order",
    badgeGreen: "Nimble-Confirmed",
    chat: {
      time1: "11:20 AM",
      time2: "11:21 AM",
      time3: "11:22 AM",
      type: "cod",
    }
  },
  {
    id: "cart",
    tabLabel: "Abandoned Cart",
    eyebrow: "Revenue Recovery",
    headline: "High-Intent Checkout Revival",
    stat: "+26.8% Recovered",
    statSub: "Zero human agent intervention",
    badgeGreen: "1-Tap UPI Ready",
    chat: {
      time1: "02:14 PM",
      time2: "02:15 PM",
      time3: "02:16 PM",
      type: "cart",
    }
  },
  {
    id: "wismo",
    tabLabel: "Autonomous WISMO",
    eyebrow: "Ticket Deflection",
    headline: "Instant Courier Sync & Exchanges",
    stat: "82% Deflected",
    statSub: "1.2s SLA vs 4h support queue",
    badgeGreen: "Auto-Resolved",
    chat: {
      time1: "04:42 PM",
      time2: "04:43 PM",
      time3: "04:44 PM",
      type: "wismo",
    }
  },
  {
    id: "broadcast",
    tabLabel: "Smart Broadcast",
    eyebrow: "Margin-First Drops",
    headline: "Handpicked 1-Tap Catalog",
    stat: "98% Open · 45% CTR",
    statSub: "10× vs traditional email revenue",
    badgeGreen: "1-Tap Checkout",
    chat: {
      time1: "10:14",
      time2: "10:15",
      time3: "10:16",
      type: "broadcast",
    }
  }
];

const BROADCAST_PRODUCTS = [
  { emoji: "⌚", name: "Chrono 42mm", price: "$249", bg: "from-slate-700 via-slate-800 to-slate-900" },
  { emoji: "👟", name: "AirRun Pro", price: "$129", bg: "from-blue-900 via-slate-800 to-indigo-950" },
  { emoji: "🧴", name: "Glow Serum", price: "$48", bg: "from-emerald-950 via-slate-900 to-teal-900" },
];

const WhatsAppMockup = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const activeSolution = SOLUTIONS[activeIdx];
  const DURATION = 2000; // 2 seconds per solution

  // Auto-running carousel timer with smooth progress bar
  useEffect(() => {
    if (isPaused) return;

    const interval = 50; // update progress every 50ms
    const step = (interval / DURATION) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIdx((curr) => (curr + 1) % SOLUTIONS.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [activeIdx, isPaused]);

  const handleSelectTab = (idx) => {
    setActiveIdx(idx);
    setProgress(0);
  };

  return (
    <div 
      className="relative mx-auto w-full max-w-[420px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Removed absolute ambient lighting to keep light theme clean */}


      {/* Top Carousel Navigation Tabs */}
      <div className="mb-4 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-md">
        <div className="grid grid-cols-4 gap-1">
          {SOLUTIONS.map((s, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectTab(idx)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all duration-200 ${
                  isActive
                    ? "bg-trust-50 text-trust-700 shadow-sm border border-trust-300"
                    : "text-slate-500 hover:text-slate-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-[10px] font-semibold tracking-tight leading-tight line-clamp-1">
                  {s.tabLabel}
                </span>

                {/* Active progress bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-trust-500 transition-all duration-75 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-2 pt-2 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-conversion-500 animate-pulse" />
            Live Solution: <strong className="text-slate-700">{activeSolution.tabLabel}</strong>
          </span>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            title={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
          >
            {isPaused ? <Play className="w-2.5 h-2.5 text-trust-600" /> : <Pause className="w-2.5 h-2.5" />}
            <span>{isPaused ? "Paused" : "Auto-playing"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Device Frame */}
      <div className="rounded-[2.8rem] bg-slate-200 p-3 shadow-xl border border-gray-300 relative overflow-visible">
        {/* Speaker ear piece notch */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-center gap-2">
          <div className="w-10 h-1 bg-slate-800 rounded-full" />
          <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
        </div>

        {/* Screen container */}
        <div className="rounded-[2.2rem] overflow-hidden bg-[#ECE5DD] border border-black shadow-inner relative flex flex-col h-[560px]">
          {/* WhatsApp Header */}
          <div className="bg-[#075E54] text-white px-3.5 pt-7 pb-3 flex items-center gap-2.5 shadow-md z-20">
            <ArrowLeft className="w-4 h-4 opacity-90 cursor-pointer" />
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-trust-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                N
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-conversion-500 rounded-full border-2 border-[#075E54] flex items-center justify-center">
                <Check className="w-2 h-2 text-white stroke-[3]" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold truncate leading-tight">Your Brand Store</p>
                <span className="bg-emerald-700/60 text-[9px] px-1 rounded text-emerald-200 font-mono">VERIFIED</span>
              </div>
              <p className="text-[10px] text-emerald-100/80 truncate">
                powered by <strong className="text-white">nimbleAI</strong> Shield
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Video className="w-4 h-4 cursor-pointer" />
              <Phone className="w-4 h-4 cursor-pointer" />
              <MoreVertical className="w-4 h-4 cursor-pointer" />
            </div>
          </div>

          {/* WhatsApp Chat Body */}
          <div
            className="flex-1 p-3 space-y-2.5 overflow-y-auto scrollbar-thin"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='2' cy='2' r='1' fill='%23d9d2c5'/></svg>\")",
            }}
          >
            {/* ─── SCENARIO 1: COD CONFIRMATION & PREPAID CONVERSION ─── */}
            {activeSolution.id === "cod" && (
              <div className="space-y-2.5 animate-fadeIn">
                {/* Time stamp pill */}
                <div className="flex justify-center my-1">
                  <span className="bg-slate-200/80 text-[10px] text-slate-600 px-2 py-0.5 rounded-md font-medium shadow-xs">
                    Today
                  </span>
                </div>

                {/* AI order address & COD confirmation card */}
                <div className="max-w-[88%] bg-white rounded-xl rounded-tl-none shadow-sm p-3 text-[12px] text-slate-800 space-y-2 border-l-4 border-trust-600">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="font-semibold text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-trust-600" />
                      Order #IND-9042 Received
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                      COD ₹2,499
                    </span>
                  </div>

                  <p className="text-slate-600 leading-snug">
                    Namaste Rahul! 👋 Confirm your address before dispatch:
                  </p>

                  <div className="bg-slate-50 p-2 rounded border border-slate-200/80 text-[11px] text-slate-700">
                    📍 <strong>Flat 402, Green Glen Layout</strong>, Bellandur, Bengaluru - 560103
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-[11px] text-emerald-900">
                    <p className="font-bold text-emerald-800 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                      Instant Founder Incentive:
                    </p>
                    Pay now via UPI and get <strong>₹150 instant cashback</strong> + priority courier dispatch.
                  </div>

                  {/* WhatsApp Quick Action Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <button className="w-full py-1.5 bg-trust-600 hover:bg-trust-700 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1 shadow-xs">
                      ⚡ Convert to UPI &amp; Save ₹150
                    </button>
                    <button className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium border border-slate-200">
                      ✅ Confirm COD Dispatch
                    </button>
                  </div>

                  <div className="text-[9px] text-slate-400 text-right">{activeSolution.chat.time1}</div>
                </div>

                {/* Customer tap response */}
                <div className="ml-auto max-w-[78%] bg-[#DCF8C6] rounded-xl rounded-tr-none px-3 py-2 shadow-sm text-[12px] text-slate-800">
                  <p className="font-medium">Convert to UPI &amp; Save ₹150 ⚡</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px] text-slate-500">{activeSolution.chat.time2}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                  </div>
                </div>

                {/* AI Instant Confirmation & Prepaid Tagging */}
                <div className="max-w-[85%] bg-white rounded-xl rounded-tl-none shadow-sm p-3 text-[12px] text-slate-800 space-y-1.5">
                  <p className="text-slate-800">
                    Done! ✅ UPI Link ready (GPay / PhonePe / Paytm):
                  </p>
                  <div className="bg-trust-50 border border-trust-200 rounded p-2 text-trust-900 font-mono text-[11px] flex items-center justify-between">
                    <span>Pay ₹2,349 via UPI</span>
                    <span className="text-trust-600 font-bold underline cursor-pointer">1-Tap Pay →</span>
                  </div>
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[10px]">
                    <span className="tag-nimble-confirmed">Nimble-Confirmed: Low Risk</span>
                    <span className="text-[9px] text-slate-400">{activeSolution.chat.time3}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SCENARIO 2: ABANDONED CART RECOVERY ─── */}
            {activeSolution.id === "cart" && (
              <div className="space-y-2.5 animate-fadeIn">
                <div className="flex justify-center my-1">
                  <span className="bg-slate-200/80 text-[10px] text-slate-600 px-2 py-0.5 rounded-md font-medium shadow-xs">
                    15 mins after cart abandon
                  </span>
                </div>

                <div className="max-w-[88%] bg-white rounded-xl rounded-tl-none shadow-sm p-3 text-[12px] text-slate-800 space-y-2">
                  <p className="text-slate-700">
                    Hey Sneha! 👋 We held your <strong>Hydrating Ceramide Tint (50ml)</strong> in your cart. Units are running low today!
                  </p>
                  
                  {/* Product preview */}
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/70 flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded bg-rose-100 flex items-center justify-center text-xl shrink-0">
                      🧴
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-[11px]">Ceramide Glow Tint (50ml)</p>
                      <p className="text-trust-600 font-bold text-[11px]">₹899 <span className="text-slate-400 line-through text-[10px]">₹1,199</span></p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-[11px]">
                    Have a question on ingredients or shade before ordering?
                  </p>
                  <div className="text-[9px] text-slate-400 text-right">{activeSolution.chat.time1}</div>
                </div>

                {/* Customer asks policy/product question */}
                <div className="ml-auto max-w-[78%] bg-[#DCF8C6] rounded-xl rounded-tr-none px-3 py-2 shadow-sm text-[12px] text-slate-800">
                  <p>Is this non-comedogenic for oily Indian skin?</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px] text-slate-500">{activeSolution.chat.time2}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                  </div>
                </div>

                {/* AI Answers Knowledge Base & offers 1-tap checkout */}
                <div className="max-w-[88%] bg-white rounded-xl rounded-tl-none shadow-sm p-3 text-[12px] text-slate-800 space-y-2">
                  <p className="text-slate-700 leading-snug">
                    Yes 100%! 🌿 Formulated oil-free with niacinamide specifically for humid climates.
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-[11px] text-emerald-900">
                    Applied discount code <strong>NIMBLE10</strong> (-10%): Total is now <strong>₹809</strong>.
                  </div>
                  <button className="w-full py-1.5 bg-trust-600 text-white rounded text-[11px] font-semibold shadow-xs">
                    🛒 Complete Order in 1 Tap (Free Shipping)
                  </button>
                  <div className="text-[9px] text-slate-400 text-right">{activeSolution.chat.time3}</div>
                </div>
              </div>
            )}

            {/* ─── SCENARIO 3: AUTONOMOUS WISMO & EXCHANGES ─── */}
            {activeSolution.id === "wismo" && (
              <div className="space-y-2.5 animate-fadeIn">
                <div className="flex justify-center my-1">
                  <span className="bg-slate-200/80 text-[10px] text-slate-600 px-2 py-0.5 rounded-md font-medium shadow-xs">
                    Customer Support Query
                  </span>
                </div>

                {/* Customer agitated */}
                <div className="ml-auto max-w-[80%] bg-[#DCF8C6] rounded-xl rounded-tr-none px-3 py-2 shadow-sm text-[12px] text-slate-800">
                  <p>Where is my order??? Ordered 2 days ago, no update on delivery!</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px] text-slate-500">{activeSolution.chat.time1}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                  </div>
                </div>

                {/* AI Instant SLA 1.2s live courier tracking card */}
                <div className="max-w-[88%] bg-white rounded-xl rounded-tl-none shadow-sm p-3 text-[12px] text-slate-800 space-y-2 border-l-4 border-emerald-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-[12px]">Order #A24-8821 via Bluedart</p>
                      <p className="text-[10px] text-emerald-600 font-bold">Out for Delivery · ETA Today 5:30 PM</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded p-2 text-[11px] text-slate-600 space-y-0.5">
                    <p>📍 Rider: <strong>Ramesh K.</strong> (Ph: +91 98201xxxxx)</p>
                    <p>🔑 Delivery Verification OTP: <strong className="font-mono text-slate-900">4819</strong></p>
                  </div>

                  <div className="border-t border-slate-100 pt-1.5 flex gap-2">
                    <button className="flex-1 py-1 text-center font-medium text-[11px] text-trust-600 bg-trust-50 rounded">
                      Live GPS Track
                    </button>
                    <button className="flex-1 py-1 text-center font-medium text-[11px] text-slate-700 bg-slate-100 rounded">
                      Change Slot
                    </button>
                  </div>
                  <div className="text-[9px] text-slate-400 text-right">{activeSolution.chat.time2}</div>
                </div>

                {/* Customer asks about exchange */}
                <div className="ml-auto max-w-[75%] bg-[#DCF8C6] rounded-xl rounded-tr-none px-3 py-2 shadow-sm text-[12px] text-slate-800">
                  <p>What if the size is too small?</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px] text-slate-500">{activeSolution.chat.time3}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                  </div>
                </div>

                {/* AI resolves exchange policy autonomously */}
                <div className="max-w-[85%] bg-white rounded-xl rounded-tl-none shadow-sm p-2.5 text-[12px] text-slate-800 space-y-1">
                  <p className="text-slate-700 text-[11px]">
                    No worries! 🔁 7-Day Doorstep Exchange is 100% free. Just tap <em>"Exchange Size"</em> here once delivered and the courier will swap it at your door.
                  </p>
                  <div className="text-[9px] text-slate-400 text-right">Instant AI Deflection</div>
                </div>
              </div>
            )}

            {/* ─── SCENARIO 4: SMART BROADCAST (The User's Exact Quoted Flow) ─── */}
            {activeSolution.id === "broadcast" && (
              <div className="space-y-2.5 animate-fadeIn">
                {/* Order update */}
                <div className="max-w-[85%] bg-white rounded-xl rounded-tl-none shadow-sm overflow-hidden">
                  <div className="px-3 pt-3 pb-2 flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">Order #A24-8821 shipped</p>
                      <p className="text-[12px] text-slate-500">
                        Out for delivery · ETA Tomorrow, 6 PM
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100">
                    <button className="w-full text-[12px] py-1.5 font-medium text-[#075E54]">
                      Track Order
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right px-2 pb-1.5">10:14</div>
                </div>

                {/* New arrivals headline */}
                <div className="max-w-[82%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm text-[13px] text-slate-800">
                  ✨ Just dropped — handpicked for you
                  <div className="text-[10px] text-slate-400 text-right mt-1">10:15</div>
                </div>

                {/* User's Exact Products Horizontal Carousel */}
                <div className="-mx-3 px-3 overflow-x-auto scrollbar-thin">
                  <div className="flex gap-2.5 pb-1">
                    {BROADCAST_PRODUCTS.map((p) => (
                      <div
                        key={p.name}
                        className="w-36 shrink-0 bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100"
                      >
                        <div
                          className={`h-20 bg-gradient-to-br ${p.bg} flex items-center justify-center text-3xl shadow-inner`}
                        >
                          {p.emoji}
                        </div>
                        <div className="px-2.5 py-1.5">
                          <p className="text-[12px] font-semibold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-emerald-600 font-bold">{p.price}</p>
                        </div>
                        <div className="grid grid-cols-2 border-t border-slate-100 text-center">
                          <button className="text-[11px] py-1.5 font-medium text-[#075E54] hover:bg-slate-50">
                            View
                          </button>
                          <button className="text-[11px] py-1.5 font-medium text-[#075E54] border-l border-slate-100 hover:bg-slate-50">
                            Buy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User's Exact Reply */}
                <div className="ml-auto max-w-[74%] bg-[#DCF8C6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm text-[13px] text-slate-800">
                  Love the watch — checkout please 🛒
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-slate-500">10:16</span>
                    <CheckCheck className="w-3 h-3 text-[#34B7F1]" />
                  </div>
                </div>

                {/* User's Exact Done message */}
                <div className="max-w-[80%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm text-[13px] text-slate-800">
                  Done ✅ Secure checkout link ready — pay in 1 tap.
                  <div className="text-[10px] text-slate-400 text-right mt-1">10:16</div>
                </div>
              </div>
            )}
          </div>

          {/* Chat input footer (WhatsApp mockup) */}
          <div className="bg-[#F0F2F5] px-2 py-2 flex items-center gap-2 border-t border-slate-200/80">
            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400 border border-slate-200">
              Type a message...
            </div>
            <div className="w-7 h-7 rounded-full bg-[#075E54] flex items-center justify-center text-white text-xs">
              🎙️
            </div>
          </div>
        </div>
      </div>

      {/* FinOps Stat Row — always visible below the phone */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-conversion-500 animate-ping shrink-0" />
            <span className="text-[12px] font-bold text-conversion-600 tabular-finops leading-tight">
              {activeSolution.stat}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 leading-tight">
            {activeSolution.statSub}
          </p>
        </div>
        <div className="flex-1 bg-white border border-trust-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="tag-nimble-confirmed text-[10px]">{activeSolution.badgeGreen}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Autonomous FinOps Agent</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMockup;
