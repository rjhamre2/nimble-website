import React, { useState, FormEvent } from "react";
import { z } from "zod";
import { Loader2, CheckCircle2, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "../hooks/use-toast";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid business email").max(160),
  website: z
    .string()
    .trim()
    .min(3, "Enter your Shopify store URL")
    .max(200)
    .refine(
      (v) => /^([a-z0-9-]+\.)+[a-z]{2,}.*$/i.test(v.replace(/^https?:\/\//, "")),
      "Enter a valid URL or domain"
    ),
  volume: z.string().min(1, "Select your daily order volume"),
  message: z.string().max(1000, "Message is too long").optional(),
});

const WaitlistForm = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    website: "",
    volume: "",
    message: ""
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    
    if (!parsed.success) {
      toast({
        title: "Please check your details",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch("https://a804judny2.execute-api.us-east-1.amazonaws.com/auto/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: parsed.data.fullName,
          businessEmail: parsed.data.email,
          brandWebsite: parsed.data.website,
          monthlyOrderVolume: parsed.data.volume,
          message: parsed.data.message,
          category: "AI Revenue & RTO Shield Early Access",
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      setSuccess(true);
    } catch {
      toast({ 
        title: "Something went wrong", 
        description: "Please try again or contact us directly at contact@nimbleai.in.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl p-8 text-center bg-white border border-gray-200 shadow-xl animate-fadeUp">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-900">
          Application Received — Welcome to The Shield 🎉
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          We prioritize onboarding for Indian D2C stores. Our FinOps strategist will email you within 2 hours to connect your Shopify store and lock in early founder pricing.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Founder Pricing Locked: ₹0 Setup Fee
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-6 sm:p-7 space-y-4 bg-white border border-gray-200 shadow-xl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-trust-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
            Deploy The AI Revenue &amp; RTO Shield
          </span>
        </div>
        <span className="tag-nimble-confirmed text-[10px]">
          Founder Tier
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700">
            Founder / Operator Name *
          </Label>
          <Input
            id="fullName"
            placeholder="e.g. Rohan Sharma"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            maxLength={80}
            className="bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 text-sm focus:border-trust-500 focus:ring-1 focus:ring-trust-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
            Work Email *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="rohan@yourbrand.in"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={160}
            className="bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 text-sm focus:border-trust-500 focus:ring-1 focus:ring-trust-500"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="website" className="text-xs font-semibold text-slate-700">
            Shopify Store / Website *
          </Label>
          <Input
            id="website"
            placeholder="brandname.com or myshopify.com"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            maxLength={200}
            className="bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 text-sm focus:border-trust-500 focus:ring-1 focus:ring-trust-500"
          />
        </div>
        <div className="space-y-1.5 flex flex-col justify-end">
          <Label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Daily Order Volume *
          </Label>
          <Select
            value={form.volume}
            onValueChange={(v) => setForm({ ...form, volume: v })}
          >
            <SelectTrigger className="w-full bg-white border-gray-300 text-slate-900 text-sm focus:border-trust-500">
              <SelectValue placeholder="Select daily order volume" />
            </SelectTrigger>
            <SelectContent align="start" className="bg-white border border-gray-200 text-slate-900 shadow-lg">
              <SelectItem value="Under 50 orders/day" className="hover:bg-slate-100 cursor-pointer">
                Under 50 orders / day
              </SelectItem>
              <SelectItem value="50-200 orders/day" className="hover:bg-slate-100 cursor-pointer">
                50 – 200 orders / day
              </SelectItem>
              <SelectItem value="200-500 orders/day" className="hover:bg-slate-100 cursor-pointer">
                200 – 500 orders / day
              </SelectItem>
              <SelectItem value="500+ orders/day" className="hover:bg-slate-100 cursor-pointer">
                500+ orders / day
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-xs font-semibold text-slate-700">
          Current RTO % or Biggest Bottleneck? (Optional)
        </Label>
        <Textarea
          id="message"
          placeholder="e.g. Current RTO is 32% on COD; courier is Shiprocket/Delhivery. Need to convert COD to prepaid & cut WISMO tickets."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={2}
          className="resize-none bg-white border-gray-300 text-slate-900 placeholder:text-slate-400 text-sm focus:border-trust-500 focus:ring-1 focus:ring-trust-500"
        />
      </div>

      <Button
        type="submit"
        className="w-full py-3.5 bg-trust-600 hover:bg-trust-700 active:bg-trust-800 text-white font-bold text-sm rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying Unit Economics...
          </>
        ) : (
          <>
            Request Founder Access &amp; Shield Store <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-slate-400" /> No credit card required
        </span>
        <span>•</span>
        <span className="text-trust-600 font-medium">5 min waba and shopify sync</span>
        <span>•</span>
        <span>Founder pricing guaranteed</span>
      </div>
    </form>
  );
};

export default WaitlistForm;