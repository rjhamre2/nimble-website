import React from 'react';
import {
  ShoppingCart,
  Bot,
  Megaphone,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  LayoutGrid,
  Brain,
  Users,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
// Ensure these sub-components are copied to your local /src/components folder
import { Button } from "../ui/button"; 
import WaitlistForm from "../WaitlistForm";
import WhatsAppMockup from "../WhatsAppMockup";
import SignInButton from "../SignInButton";
import Navbar from '../Navbar';

const core3 = [
  {
    icon: ShoppingCart,
    eyebrow: "Revenue Recovery",
    title: "Recover 25%+ of abandoned checkouts",
    desc: "Trigger interactive WhatsApp carousels the moment a shopper leaves. Bring them back with one tap — no re-login, no friction.",
    metric: "25%+",
    metricLabel: "carts recovered",
  },
  {
    icon: Bot,
    eyebrow: "Instant Support",
    title: "AI handles 80% of support, 24/7",
    desc: "AI-powered bots resolve WISMO (Where is my order), product FAQs, returns and exchanges — trained on your catalogue and policies.",
    metric: "80%",
    metricLabel: "auto-resolved",
  },
  {
    icon: Megaphone,
    eyebrow: "Broadcast Marketing",
    title: "98% open rates. 45% CTR.",
    desc: "Send targeted product drops, restocks and promos with performance that destroys SMS and email — all template-compliant.",
    metric: "10×",
    metricLabel: "vs email revenue",
  },
];

const features = [
  {
    icon: ShoppingBag,
    title: "Native Shopify & OpenCart",
    desc: "One-click sync of products, orders, customers and abandoned carts. Live inventory and order events streamed in real time.",
  },
  {
    icon: LayoutGrid,
    title: "Interactive Media",
    desc: "Carousels, quick-reply buttons, list menus and CTA cards — build conversational journeys without writing code.",
  },
  {
    icon: Brain,
    title: "AI Knowledge Base",
    desc: "Train your bot on your storefront, policies, sizing and PDPs. Confidence-scored answers with seamless human handoff.",
  },
  {
    icon: Users,
    title: "Multi-Agent Shared Inbox",
    desc: "Routing, tags, SLAs, internal notes and analytics. Your support team works as one across every WhatsApp conversation.",
  },
];

const stats = [
  { value: "25%+", label: "Carts recovered" },
  { value: "98%", label: "Open rate" },
  { value: "45%", label: "CTR" },
  { value: "10×", label: "vs email" },
];

const MainLanding = () => {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                <Sparkles className="w-3.5 h-3.5" />
                Exclusive Beta Pricing for Shopify Store Owners — Contact Us Today.
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                The WhatsApp{" "}
                <span className="text-green-600">Growth Engine</span>{" "}
                for Modern D2C Brands.
              </h1>
              <p className="text-xl text-slate-600 max-w-xl leading-relaxed">
                Recover abandoned carts, automate customer support with AI, and drive 10× more
                revenue than email with high-performance WhatsApp broadcasts. Built for scale.
              </p>

              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">{s.label}</div>
                  </div>
                ))}
              </div>

              <div id="waitlist" className="pt-4">
                <WaitlistForm />
              </div>
            </div>

            <div className="lg:pl-8">
              <WhatsAppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / Core 3 */}
      <section id="solutions" className="py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
            <p className="text-sm font-bold text-green-600 uppercase tracking-[0.2em]">
              The 3 Cores
            </p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
              One engine. Three advantages on WhatsApp.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {core3.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                    <f.icon className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 leading-none">{f.metric}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 font-bold">
                      {f.metricLabel}
                    </div>
                  </div>
                </div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">
                  {f.eyebrow}
                </p>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/*}
        <section className="bg-[#F9FAFB] py-12 px-24 flex flex-col items-center justify-center border border-slate-200 rounded-2xl shadow-sm">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500 mb-6">
            Already have an account?
          </h2>
          <SignInButton 
            className="bg-[#25D366] text-white font-bold py-3 px-8 rounded-lg transition-transform duration-200 hover:scale-[1.02] shadow-[0_0_20px_rgba(37,211,102,0.1)]" 
          />
        </section>
        */}
    </div>
  );
};

export default MainLanding;