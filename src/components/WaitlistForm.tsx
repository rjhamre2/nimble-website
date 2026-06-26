import React, { useState, FormEvent } from "react";
import { z } from "zod";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea"; // <-- Added Textarea import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "../hooks/use-toast";

// --- Added message to the Zod Schema ---
const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid business email").max(160),
  website: z
    .string()
    .trim()
    .min(3, "Enter your website")
    .max(200)
    .refine(
      (v) => /^([a-z0-9-]+\.)+[a-z]{2,}.*$/i.test(v.replace(/^https?:\/\//, "")),
      "Enter a valid URL"
    ),
  volume: z.enum(["<500", "500-2000", "2000+"], {
    errorMap: () => ({ message: "Select your monthly order volume" }),
  }),
  message: z.string().max(1000, "Message is too long").optional(), // <-- Added optional message validation
});

const WaitlistForm = ({ variant = "light" }: { variant?: "light" | "dark" }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    website: "",
    volume: "" as "" | "<500" | "500-2000" | "2000+",
    message: ""
  });

  const dark = variant === "dark";

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
      // Direct integration with AWS Lambda via API Gateway
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
          message: parsed.data.message, // <-- Will now safely pass through Zod
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
        description: "Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className={`rounded-2xl p-8 text-center animate-float-in border ${
          dark
            ? "bg-white/5 border-primary/30 backdrop-blur"
            : "bg-accent/60 border-primary/30"
        }`}
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${dark ? "text-white" : "text-charcoal"}`}>
          You're on the list 🎉
        </h3>
        <p className={dark ? "text-white/70" : "text-muted-foreground"}>
          We'll reach out to schedule your personalized demo for our{" "}
          <span className={dark ? "text-white font-medium" : "text-charcoal font-medium"}>
            launch.
          </span>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl p-5 sm:p-6 space-y-4 border shadow-card ${
        dark
          ? "bg-white/5 backdrop-blur-xl border-white/10"
          : "bg-card border-border"
      }`}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className={dark ? "text-white/80" : ""}>
            Full name
          </Label>
          <Input
            id="fullName"
            placeholder="Alex Carter"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            maxLength={80}
            className={dark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className={dark ? "text-white/80" : ""}>
            Business email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="alex@brand.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={160}
            className={dark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : ""}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="website" className={dark ? "text-white/80" : ""}>
            Brand website
          </Label>
          <Input
            id="website"
            placeholder="yourbrand.com"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            maxLength={200}
            className={dark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : ""}
          />
        </div>
        <div className="space-y-1.5 flex flex-col justify-end">
          <Label className={`whitespace-nowrap ${dark ? "text-white/80" : ""}`}>Monthly order volume</Label>
          <Select
            value={form.volume}
            onValueChange={(v) => setForm({ ...form, volume: v as typeof form.volume })}
          >
            <SelectTrigger
              className={`w-full ${dark ? "bg-white/5 border-white/10 text-white" : ""}`}
            >
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent align="start" side="top" className="bg-white opacity-100 fill-white">
              <SelectItem value="<500">Less than 500</SelectItem>
              <SelectItem value="500-2000">500 – 2,000</SelectItem>
              <SelectItem value="2000+">2,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- Added Message Box --- */}
      <div className="space-y-1.5">
        <Label htmlFor="message" className={dark ? "text-white/80" : ""}>
          Message? (Optional)
        </Label>
        <Textarea
          id="message"
          placeholder="Tell us about your current bottlenecks..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={3}
          className={`resize-none ${dark ? "bg-white/5 border-white/10 text-white placeholder:text-white/40" : ""}`}
        />
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Securing your spot...
          </>
        ) : (
          <>
            Get Early Access <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
      <p className={`text-xs text-center ${dark ? "text-white/50" : "text-muted-foreground"}`}>
        No credit card required · Founding pricing locked for waitlist members
      </p>
    </form>
  );
};

export default WaitlistForm;