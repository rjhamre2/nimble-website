import React from 'react';
import { ShoppingCart, Bot, Megaphone, ShoppingBag, LayoutGrid, Brain, Users } from 'lucide-react';
import WaitlistForm from '../WaitlistForm';
import WhatsAppMockup from '../WhatsAppMockup';

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '25%+', label: 'Carts recovered' },
  { value: '98%',  label: 'Open rate' },
  { value: '45%',  label: 'Click-through' },
  { value: '10×',  label: 'vs email revenue' },
];

const CORES = [
  {
    icon: ShoppingCart,
    eyebrow: 'Revenue Recovery',
    title: 'Recover 25%+ of abandoned checkouts',
    desc: 'Trigger interactive WhatsApp carousels the moment a shopper leaves. Bring them back with one tap — no re-login, no friction.',
    metric: '25%+', metricLabel: 'carts recovered',
  },
  {
    icon: Bot,
    eyebrow: 'Instant Support',
    title: 'AI handles 80% of support, 24/7',
    desc: 'AI-powered bots resolve WISMO, product FAQs, returns and exchanges — trained on your catalogue and policies.',
    metric: '80%', metricLabel: 'auto-resolved',
  },
  {
    icon: Megaphone,
    eyebrow: 'Broadcast Marketing',
    title: '98% open rates. 45% CTR.',
    desc: 'Send targeted product drops, restocks and promos with performance that destroys SMS and email — all template-compliant.',
    metric: '10×', metricLabel: 'vs email revenue',
  },
];

const FEATURES = [
  { icon: ShoppingBag, title: 'Native Shopify & OpenCart', desc: 'One-click sync of products, orders, customers and abandoned carts. Live inventory streamed in real time.' },
  { icon: LayoutGrid,  title: 'Interactive Media',         desc: 'Carousels, quick-reply buttons, list menus and CTA cards — build journeys without writing code.' },
  { icon: Brain,       title: 'AI Knowledge Base',         desc: 'Train your bot on your storefront, policies, sizing and PDPs. Confidence-scored answers with human handoff.' },
  { icon: Users,       title: 'Multi-Agent Shared Inbox',  desc: 'Routing, tags, SLAs, internal notes and analytics. Your support team works as one across every conversation.' },
];

// ─── Components ───────────────────────────────────────────────────────────────
const Badge = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/30 bg-[#25D366]/8 px-3 py-1 text-xs font-bold text-[#25D366]">
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
    {children}
  </span>
);

const CoreCard = ({ icon: Icon, eyebrow, title, desc, metric, metricLabel }) => (
  <div className="group card p-8 card-lift">
    <div className="flex items-start justify-between mb-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-[#25D366] flex items-center justify-center transition-colors duration-200">
        <Icon className="w-6 h-6 text-[#25D366] group-hover:text-white transition-colors duration-200" />
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{metric}</div>
        <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-bold">{metricLabel}</div>
      </div>
    </div>
    <p className="eyebrow mb-2">{eyebrow}</p>
    <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50 transition-colors group">
    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#25D366]/10 flex items-center justify-center transition-colors">
      <Icon className="w-5 h-5 text-slate-500 group-hover:text-[#25D366] transition-colors" />
    </div>
    <div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const MainLanding = () => (
  <div className="min-h-screen bg-white">

    {/* ── Hero ──────────────────────────────────────────────────────────────── */}
    <section className="relative overflow-hidden bg-hero py-16 lg:py-28">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8 animate-fadeUp">
            <Badge>Exclusive Beta Pricing for Shopify Stores — Contact Us Today</Badge>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.06]">
              The WhatsApp{' '}
              <span className="text-[#25D366]">Growth Engine</span>{' '}
              for Modern D2C Brands.
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              Recover abandoned carts, automate customer support with AI, and drive 10× more revenue than email — with high-performance WhatsApp broadcasts built for scale.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Waitlist form */}
            <div id="waitlist">
              <WaitlistForm />
            </div>
          </div>

          <div className="hidden lg:block animate-fadeUp delay-150">
            <WhatsAppMockup />
          </div>
        </div>
      </div>
    </section>

    {/* ── Core 3 ────────────────────────────────────────────────────────────── */}
    <section id="solutions" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
          <p className="eyebrow">The 3 Cores</p>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            One engine. Three advantages on WhatsApp.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {CORES.map((c) => <CoreCard key={c.title} {...c} />)}
        </div>
      </div>
    </section>

    {/* ── Features ──────────────────────────────────────────────────────────── */}
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
          <p className="eyebrow">Platform Features</p>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
            Built for serious WhatsApp commerce.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-2 max-w-4xl mx-auto">
          {FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </div>
    </section>

    {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
    <section className="py-20 bg-white">
      <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
        <p className="eyebrow mb-4">Ready to grow?</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
          Start driving revenue on WhatsApp today.
        </h2>
        <p className="text-slate-500 mb-8">
          Join thousands of D2C brands using NimbleAI to automate, engage, and convert at scale.
        </p>
        <a href="#waitlist" className="btn-primary text-base px-8 py-3.5">
          Get Early Access →
        </a>
      </div>
    </section>
  </div>
);

export default MainLanding;
