import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShoppingCart,
  MessageSquare
} from 'lucide-react';
import WaitlistForm from '../WaitlistForm';
import WhatsAppMockup from '../WhatsAppMockup';
import RtoCalculator from '../RtoCalculator';

// FinOps Hero Metrics
const STATS = [
  { value: '34% → 14%', label: 'Average RTO Rate Reduction', sub: 'Audited across 649+ Indian D2C Shopify brands' },
  { value: '22%',       label: 'COD Converted to Prepaid',   sub: 'Non-refundable UPI revenue secured before dispatch' },
  { value: '80%+',      label: 'Post-Purchase Queries Resolved Autonomously', sub: '1.2s median response via live courier API' },
  { value: '₹1.4L+',   label: 'Monthly Courier Loss Recovered', sub: 'Direct freight savings flowing back to EBITDA' },
];

// The 4 Solutions Data
const SOLUTIONS = [
  {
    icon: ShieldCheck,
    badge: 'RTO Shield',
    eyebrow: 'Margin Protection',
    title: 'Pre-dispatch Address Verification & COD-to-Prepaid Conversion',
    problem: 'Unverified delivery addresses and impulsive COD orders result in return rates exceeding 30% for many Indian D2C brands — eroding freight budgets and locking inventory in reverse logistics.',
    solution: 'nimbleAI scores every COD order against address validity and pin-code NDR history before dispatch. A conversational WhatsApp flow confirms the address and offers a 1-tap UPI incentive, converting cash orders to prepaid at a fraction of the cost of a single returned shipment.',
    metric: '22%',
    metricLabel: 'COD converted to prepaid',
    tag: 'Nimble-Confirmed'
  },
  {
    icon: ShoppingCart,
    badge: 'Cart Recovery',
    eyebrow: 'Revenue Recovery',
    title: 'Intelligent Abandoned Cart Recovery via WhatsApp',
    problem: 'Traditional email recovery achieves a 2–3% click-through rate. Customers who abandon checkout often have genuine intent but unanswered questions about sizing, ingredients, or delivery timelines.',
    solution: 'nimbleAI triggers a personalised WhatsApp conversation within 15 minutes of checkout abandonment. The AI answers product-level questions from your live catalog and presents a 1-tap checkout link — recovering revenue without requiring human support agents.',
    metric: '+26.8%',
    metricLabel: 'Recovered checkouts',
    tag: '1-Tap UPI Ready'
  },
  {
    icon: Truck,
    badge: 'Autonomous WISMO',
    eyebrow: '80% Deflection',
    title: 'Real-Time Order Tracking & Post-Purchase Support',
    problem: 'Post-purchase enquiries — primarily shipment status requests — account for over 70% of inbound support volume, overwhelming customer service staff during peak hours.',
    solution: 'Direct API integration with Shiprocket (aggregating Delhivery, Bluedart, Shadowfax & more) enables nimbleAI to fetch and respond with live tracking milestones in under 1.2 seconds. Custom doorstep exchange workflows are supported via webhook integrations.',
    metric: '82%',
    metricLabel: 'Queries resolved autonomously',
    tag: 'Instant 1.2s SLA'
  },
  {
    icon: MessageSquare,
    badge: 'Smart Broadcast',
    eyebrow: 'Precision Engagement',
    title: 'Targeted Catalog Broadcasts with 98% Open Rate',
    problem: 'Broad, untargeted WhatsApp campaigns accelerate list fatigue, inflate Meta conversation costs, and deliver diminishing returns over time.',
    solution: 'nimbleAI segments your customer base by purchase history, COD reliability, and category affinity. Each broadcast delivers an interactive multi-product carousel with 1-tap WhatsApp checkout, reaching the right buyer with the right product at the right moment.',
    metric: '10×',
    metricLabel: 'ROI vs. email campaigns',
    tag: '45% Click-Through'
  },
];

// Comparison Data
const COMPARISON = [
  {
    feature: 'Core Focus',
    ruleBased: 'Generic chat automation for broad messaging',
    enterprise: 'Enterprise-grade marketing platform',
    nimble: 'Autonomous revenue & RTO protection for Indian D2C'
  },
  {
    feature: 'Address & COD Risk Scoring',
    ruleBased: '❌ Not available',
    enterprise: '⚠️ Rule-based templates only',
    nimble: '✅ AI-powered address validation & pin-code NDR scoring'
  },
  {
    feature: 'COD-to-Prepaid Conversion',
    ruleBased: '❌ Not available',
    enterprise: '⚠️ Static payment links',
    nimble: '✅ 1-Tap UPI incentive flow — 22% conversion rate'
  },
  {
    feature: 'Post-Purchase Support (WISMO)',
    ruleBased: '❌ Keyword-based, limited resolution',
    enterprise: '⚠️ Partial automation with human escalation',
    nimble: '✅ 80%+ resolved autonomously via live courier APIs'
  },
  {
    feature: 'Pricing Model',
    ruleBased: 'Per-conversation fees with no RTO protection',
    enterprise: '₹15,000 – ₹40,000/mo base retainer',
    nimble: 'Usage-based pricing starting at ₹1,999/mo'
  },
];

// Integrations Stack
const INTEGRATIONS = [
  { name: 'Shopify', desc: '1-Click Catalog & Order Sync · Live' },
  { name: 'Shiprocket', desc: 'Real-Time NDR & Tracking Sync · Live' },
  { name: 'Razorpay', desc: '1-Tap UPI Instant Checkout · Live' },
  { name: 'Meta Cloud API', desc: 'Official Direct WABA · Live' },
  { name: 'Delhivery / Bluedart', desc: 'Via Shiprocket & Custom Webhooks' },
  { name: 'Custom ERP', desc: 'Available on Growth & Scale Tiers' },
];

export default function MainLanding() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-trust-600 selection:text-white">

      {/* ── 1. HERO SECTION ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-50 pt-12 pb-20 lg:pt-20 lg:pb-32 border-b border-gray-200">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">

            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-7 animate-fadeUp">
              {/* Category Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-trust-600/30 bg-trust-600/10 px-3.5 py-1 text-xs font-bold text-trust-700 font-mono">
                <span className="w-2 h-2 rounded-full bg-trust-500 animate-pulse" />
                THE AI REVENUE &amp; RTO SHIELD FOR INDIAN D2C
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08]">
                Stop RTO Bleeding.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-trust-600 via-trust-500 to-trust-700">
                  Convert COD to Prepaid.
                </span>{' '}
                <span className="text-conversion-600">
                  Protect Your Unit Economics.
                </span>
              </h1>

              {/* FinOps Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Designed exclusively for Indian D2C brands on Shopify.
                <strong className="text-slate-900"> nimbleAI</strong> is an autonomous AI agent that eliminates RTO losses at the source — verifying delivery addresses before dispatch, converting COD orders to prepaid via 1-tap UPI, and resolving over 80% of post-purchase support queries without human intervention.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#rto-calculator"
                  className="px-6 py-3.5 bg-trust-600 hover:bg-trust-700 active:bg-trust-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-150"
                >
                  <span>See Your RTO Recovery Potential</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#waitlist"
                  className="px-6 py-3.5 border border-slate-300 hover:border-trust-500 text-slate-700 hover:text-trust-700 text-sm rounded-xl text-center font-medium transition-all duration-150 bg-white"
                >
                  Request Early Access
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-conversion-500" />
                  5 min waba and shopify sync
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-conversion-500" />
                  Official Meta Cloud API
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-conversion-500" />
                  Shiprocket Live Courier Sync
                </span>
              </div>
            </div>

            {/* Right Column: Auto-running WhatsApp Carousel */}
            <div className="lg:col-span-5 animate-fadeUp delay-150">
              <WhatsAppMockup />
            </div>
          </div>

          {/* FinOps KPI Row */}
          <div className="mt-16 pt-10 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-finops">
                  {s.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-trust-600">
                  {s.label}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. THE 4 CORE SOLUTIONS SHOWCASE ─────────────────────────────────── */}
      <section id="solutions" className="py-24 bg-white relative border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="eyebrow">Core Capabilities</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              One Autonomous Agent. Four Revenue Protection Capabilities.
            </h2>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
              nimbleAI addresses the four most significant revenue leakage points in Indian D2C operations — reducing returns, recovering abandoned revenue, automating post-purchase support, and improving broadcast efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {SOLUTIONS.map((sol) => {
              const Icon = sol.icon;
              return (
                <div
                  key={sol.title}
                  className="bg-white border border-gray-200 hover:border-trust-400 rounded-2xl p-7 transition-all duration-200 hover:shadow-md flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-trust-50 border border-trust-200 flex items-center justify-center text-trust-600">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-conversion-600 font-mono tabular-finops">
                          {sol.metric}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">
                          {sol.metricLabel}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-trust-600 font-mono">
                          {sol.eyebrow}
                        </span>
                        <span className="tag-nimble-confirmed text-[10px]">
                          {sol.tag}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        {sol.title}
                      </h3>
                    </div>

                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 leading-relaxed">
                      <strong className="text-rose-600 uppercase font-mono text-[10px] block mb-0.5">The Bleed:</strong>
                      {sol.problem}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-trust-600 uppercase font-mono text-[10px] block mb-0.5">nimbleAI Resolution:</strong>
                      {sol.solution}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Shopify native integration</span>
                    <a href="#waitlist" className="text-trust-600 hover:text-trust-700 font-bold flex items-center gap-1">
                      Deploy Core →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. INTERACTIVE FINOPS RTO & MARGIN CALCULATOR ───────────────────────── */}
      <RtoCalculator />

      {/* ── 4. THE ENEMY: WHY WE WIN ─────────────────────────────────────────── */}
      <section id="the-enemy" className="py-24 bg-gray-50 relative border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="eyebrow">How We Compare</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Purpose-Built for Indian D2C. Not Repurposed for It.
            </h2>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
              Generic automation tools and enterprise platforms were not designed around the realities of Indian logistics, COD prevalence, or the Hinglish-fluent customer. nimbleAI was.
            </p>
          </div>

          {/* Side-by-side comparison cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Dumb Rule-Based Tools */}
            <div className="bg-white border border-rose-200 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Rule-Based Automation</h3>
                <p className="text-xs text-slate-500 font-mono">Legacy Keyword Chatbots</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Keyword-driven workflows with rigid decision trees. They lack natural language understanding and cannot handle address corrections, Hinglish queries, or any input outside predefined patterns.
                </p>
                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500 font-bold">✕</span> No address or risk validation
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500 font-bold">✕</span> No COD-to-prepaid conversion
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-500 font-bold">✕</span> High fallback rate increases RTO
                  </div>
                </div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-700 font-mono">
                Unaddressed RTO losses often exceed ₹1,50,000/month in courier freight alone.
              </div>
            </div>

            {/* Overpriced Enterprise Tools */}
            <div className="bg-white border border-amber-200 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Enterprise Platforms</h3>
                <p className="text-xs text-slate-500 font-mono">Complex Enterprise Software</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Platforms engineered for large-scale enterprise operations. The pricing structures, onboarding complexity, and feature overhead are rarely matched to the economics of a growing D2C brand.
                </p>
                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">!</span> High base retainer fees
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">!</span> Significant human agent dependency
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">!</span> Per-conversation markup costs
                  </div>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-700 font-mono">
                Retainer and markup costs can consume a disproportionate share of net margin for scaling brands.
              </div>
            </div>

            {/* nimbleAI Shield */}
            <div className="bg-white border-2 border-trust-500 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg relative">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-trust-600 text-[10px] font-bold text-white font-mono tracking-wider">
                PURPOSE-BUILT
              </div>
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-trust-50 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-trust-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">nimbleAI RTO Shield</h3>
                <p className="text-xs text-trust-600 font-mono">The AI FinOps Agent</p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  An autonomous AI agent purpose-built for Indian D2C commerce. nimbleAI understands the nuances of local buyer behaviour, validates delivery addresses before dispatch, converts COD orders to prepaid, and resolves the majority of post-purchase support queries — without any human intervention.
                </p>
                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-conversion-500" /> Autonomous Address Risk Verification
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-conversion-500" /> 1-Tap UPI Incentive Conversion (22%)
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-conversion-500" /> 80%+ Autonomous WISMO Deflection
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-[11px] text-green-700 font-mono">
                Net Result: Protects +₹1,40,000+ monthly gross margin.
              </div>
            </div>
          </div>

          {/* Detailed comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-slate-500 font-mono text-xs bg-gray-50">
                  <th className="py-4 px-6 font-semibold text-slate-700">Capability</th>
                  <th className="py-4 px-6 font-semibold text-rose-600">Rule-Based Automation</th>
                  <th className="py-4 px-6 font-semibold text-amber-600">Enterprise Platforms</th>
                  <th className="py-4 px-6 font-semibold text-trust-700 bg-trust-50">nimbleAI Shield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {row.ruleBased}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {row.enterprise}
                    </td>
                    <td className="py-4 px-6 text-slate-800 font-medium bg-trust-50/50">
                      {row.nimble}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 5. INDIAN LOGISTICS & SHOPIFY ECOSYSTEM ──────────────────────────── */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <p className="eyebrow">Integrations</p>
            <h3 className="text-2xl font-bold text-slate-900">
              Connects to Your Existing Stack in Under 5 Minutes
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              No engineering resources required. Connect your Shopify store and courier accounts with a single authorisation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.name}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-trust-400 hover:shadow-sm transition-all"
              >
                <div className="text-sm font-bold text-slate-900 mb-0.5">{item.name}</div>
                <div className="text-[10px] text-slate-500 font-mono leading-tight">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. UNIT ECONOMICS & FOUNDER PRICING ───────────────────────────────── */}
      <section id="unit-economics" className="py-24 bg-gray-50 relative border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="eyebrow">Pricing</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Transparent Pricing Aligned to Your Growth.
            </h2>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
              14-Day Live ROI Pilot — Watch nimbleAI convert COD orders to UPI and deflect WISMO tickets live on your store before your subscription starts. No hidden conversation markups or percentage-of-revenue cuts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 1. Starter Shield */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                      Starter Shield
                    </span>
                    <p className="text-[11px] text-trust-600 font-medium mt-0.5">
                      Founding Cohort — First 5 Stores
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono bg-gray-100 border border-gray-200 px-2 py-0.5 rounded whitespace-nowrap">
                    Up to 50 orders/day
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  ~1,500 orders/mo
                </p>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono">₹1,999</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                    <span className="line-through text-slate-400">Regular ₹3,499/mo</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                      Locked for 12 mos
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-800 font-mono">
                  💰 <strong>Pays for itself</strong> by preventing just 13 RTOs/month
                </div>

                <ul className="space-y-2.5 pt-3 border-t border-gray-100 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-800">14-Day Live ROI Pilot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Pre-Dispatch COD Confirmation &amp; Risk Tagging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>1-Tap UPI COD-to-Prepaid Converter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>30-Min Abandoned Cart Recovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Autonomous AI WISMO &amp; FAQ Agent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>0% Markup on Meta API Rates</span>
                  </li>
                </ul>
              </div>
              <a
                href="#waitlist"
                className="w-full py-3 border border-trust-500 bg-trust-50/60 hover:bg-trust-600 text-trust-700 hover:text-white text-xs text-center font-bold rounded-xl transition-all shadow-xs block"
              >
                Start 14-Day Pilot (3 Spots Left) →
              </a>
            </div>

            {/* 2. Growth Shield (Featured - MOST POPULAR) */}
            <div className="bg-white border-2 border-trust-500 rounded-2xl p-7 flex flex-col justify-between space-y-6 shadow-xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-trust-600 text-white font-mono text-[10px] font-bold tracking-wider uppercase shadow-sm">
                MOST POPULAR
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-xs font-bold font-mono text-trust-700 uppercase tracking-wider">
                      Growth Shield
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Scaling D2C Brands
                    </p>
                  </div>
                  <span className="text-[10px] text-trust-700 font-mono bg-trust-50 border border-trust-200 px-2 py-0.5 rounded whitespace-nowrap font-medium">
                    50 – 200 orders/day
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  ~6,000 orders/mo
                </p>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono">₹2,999</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                    <span className="line-through text-slate-400">Regular ₹5,999/mo</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                      Locked for 12 mos
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-800 font-mono">
                  💰 <strong>Pays for itself</strong> by preventing just 19 RTOs/month
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-slate-800 mb-2.5 font-mono uppercase tracking-wide">
                    Everything in Starter Shield, plus:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span className="font-semibold text-slate-900">Up to 6,000 monthly orders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span>Live Courier Tracking Sync (Shiprocket/Delhivery)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span>Smart Segmented Catalog Broadcasts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span>48-Hour White-Glove Concierge Setup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span>Priority WhatsApp Founder Support</span>
                    </li>
                  </ul>
                </div>
              </div>
              <a
                href="#waitlist"
                className="w-full py-3 bg-trust-600 hover:bg-trust-700 active:bg-trust-800 text-white font-bold text-xs rounded-xl shadow-md text-center block transition-all"
              >
                Deploy Growth Shield →
              </a>
            </div>

            {/* 3. Scale Shield */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                      Scale Shield
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      High-Volume D2C
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono bg-gray-100 border border-gray-200 px-2 py-0.5 rounded whitespace-nowrap">
                    200 – 500+ orders/day
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  15,000+ orders/mo
                </p>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono">₹6,999</span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 font-mono">
                    (Custom above 500/day)
                  </div>
                </div>

                <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-700 font-mono">
                  ⚡ <strong>Replaces ₹25k–₹40k/mo</strong> legacy enterprise retainers
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-slate-800 mb-2.5 font-mono uppercase tracking-wide">
                    Everything in Growth Shield, plus:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span className="font-semibold text-slate-900">High-Throughput Broadcast Queues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span>Custom NDR &amp; Doorstep Exchange Flows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span>Custom Webhook &amp; ERP Integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-conversion-500 shrink-0 mt-0.5" />
                      <span>Dedicated FinOps Account Strategist</span>
                    </li>
                  </ul>
                </div>
              </div>
              <a
                href="#waitlist"
                className="w-full py-3 border border-gray-300 hover:border-trust-500 text-slate-700 hover:text-trust-700 text-xs text-center font-bold rounded-xl transition-all bg-white block"
              >
                Talk to FinOps Team →
              </a>
            </div>
          </div>

          {/* Transparent Meta Pricing Notice */}
          <div className="mt-12 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wide">
                    Zero Markup on Meta WhatsApp Rates
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Meta base conversation charges (~₹0.125/utility, ~₹0.88/marketing) are paid directly by you to Meta via official Embedded Signup or your Meta Business wallet. nimbleAI charges 0% commission on conversation volume.
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-[11px] font-mono text-slate-700 whitespace-nowrap shrink-0">
                Billed Directly by Meta · 0% Markup
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. PROPRIETARY MYSTERY SHOPPER STORE AUDITS ─────────────────────── */}
      <section className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <p className="eyebrow">Mystery Shopper Intelligence</p>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What We Found Auditing 649 Indian D2C Shopify Stores This Week
            </h3>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              We tested automated workflows across hundreds of fast-growing Indian D2C storefronts. Here is how legacy bot setups are silently bleeding gross margins — and how nimbleAI fixes each failure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Audit Finding 1 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    Audit Finding #1 · Footwear &amp; Apparel
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  ₹2,499 Order Lost to "Sorry, I Didn't Understand"
                </h4>
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1.5 font-mono">
                  <p className="text-[11px] text-slate-600 font-sans">
                    <strong>Customer:</strong> "Hey, can I change size to UK 9 and please update landmark to near Metro Pillar 42?"
                  </p>
                  <p className="text-rose-700">
                    ❌ <strong>Legacy Bot:</strong> "Sorry, I didn't understand that. Type MENU to see options."
                  </p>
                  <p className="text-[10px] text-rose-600 italic">
                    Result: Dispatched with wrong size &amp; vague address → 100% RTO.
                  </p>
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    How nimbleAI Solves It:
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Understands natural Hinglish, validates the pin-code landmark, automatically updates the Shopify order fulfillment tags, and offers a ₹100 instant 1-tap UPI discount to convert the COD order to prepaid.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>RTO Risk Avoided</span>
                <span className="text-emerald-700 font-bold">Protected ₹160 freight + inventory</span>
              </div>
            </div>

            {/* Audit Finding 2 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Audit Finding #2 · Skincare &amp; Beauty
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  ₹0.88/Msg Broadcasts Leaking 78% of Mobile Buyers
                </h4>
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1.5 font-mono">
                  <p className="text-[11px] text-slate-600 font-sans">
                    <strong>Campaign:</strong> Brand spent ₹35,000 broadcasting a discount banner with a generic link redirecting to their mobile store.
                  </p>
                  <p className="text-amber-800">
                    ⚠️ <strong>Legacy Drop-off:</strong> 78% bounced on website load. Inquisitive buyers had nowhere to ask about ingredients.
                  </p>
                  <p className="text-[10px] text-amber-700 italic">
                    Result: Burned Meta marketing fees with zero conversational conversion.
                  </p>
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    How nimbleAI Solves It:
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Deploys interactive multi-product WhatsApp carousels with 1-tap checkout links and live AI product catalog Q&amp;A directly within the chat window, lifting conversions by 10× vs static redirects.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Direct Checkout Lift</span>
                <span className="text-emerald-700 font-bold">+26.8% Cart Recovery</span>
              </div>
            </div>

            {/* Audit Finding 3 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    Audit Finding #3 · Streetwear &amp; Lifestyle
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  140+ Daily "Where Is My Order?" Tickets Crushing Staff
                </h4>
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1.5 font-mono">
                  <p className="text-[11px] text-slate-600 font-sans">
                    <strong>Support Queue:</strong> 3 customer support agents spent 4+ hours daily manually looking up tracking URLs on courier portals.
                  </p>
                  <p className="text-blue-800">
                    ⌛ <strong>Support Delay:</strong> Anxious customers waited 3–5 hours for status, resulting in door-refusals on transit delays.
                  </p>
                  <p className="text-[10px] text-blue-700 italic">
                    Result: Support payroll bloated, while late delivery NDRs escalated.
                  </p>
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    How nimbleAI Solves It:
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Live Shiprocket API integration checks real-time courier milestones in &lt;1.2 seconds, sends proactive out-for-delivery alerts, and autonomously resolves 82% of WISMO enquiries without agent intervention.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>SLA Response Time</span>
                <span className="text-emerald-700 font-bold">1.2s Median Deflection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FINAL WAITLIST & FOUNDER ONBOARDING ──────────────────────────── */}
      <section id="waitlist" className="py-24 bg-gray-50 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-trust-50 border border-trust-200 text-trust-700 text-xs font-mono font-bold uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-trust-600" />
              Early Access — Indian D2C Brands
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              Protect Your Margins. Start Recovering Revenue Today.
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              5 min waba and shopify sync. Reduce return rates, convert COD orders to prepaid, and resolve post-purchase queries autonomously — from day one.
            </p>
          </div>

          <WaitlistForm />
        </div>
      </section>

    </div>
  );
}
