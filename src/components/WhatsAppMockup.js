import { Check, CheckCheck, Phone, Video, MoreVertical, ArrowLeft, Truck } from "lucide-react";

const products = [
  { emoji: "⌚", name: "Chrono 42mm", price: "$249", from: "from-slate-300 via-slate-400 to-slate-600" },
  { emoji: "👟", name: "AirRun Pro", price: "$129", from: "from-emerald-200 via-teal-300 to-cyan-400" },
  { emoji: "🧴", name: "Glow Serum", price: "$48", from: "from-rose-200 via-pink-300 to-fuchsia-300" },
];

const WhatsAppMockup = () => {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="absolute -inset-10 bg-primary/30 blur-3xl rounded-full -z-10" />

      <div className="rounded-[2.5rem] bg-charcoal p-3 shadow-phone border border-white/5">
        <div className="rounded-[2rem] overflow-hidden bg-[#ECE5DD]">
          {/* Header */}
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
            <ArrowLeft className="w-5 h-5" />
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-semibold text-sm">
              N
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Your Brand</p>
              <p className="text-[11px] text-white/70">powered by NimbleAI</p>
            </div>
            <Video className="w-5 h-5" />
            <Phone className="w-5 h-5" />
            <MoreVertical className="w-5 h-5" />
          </div>

          {/* Chat */}
          <div
            className="px-3 py-4 space-y-2.5 min-h-[520px]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='2' cy='2' r='1' fill='%23d9d2c5'/></svg>\")",
            }}
          >
            {/* Order update */}
            <div className="max-w-[85%] bg-white rounded-xl rounded-tl-none shadow-sm overflow-hidden">
              <div className="px-3 pt-3 pb-2 flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-charcoal">Order #A24-8821 shipped</p>
                  <p className="text-[12px] text-muted-foreground">
                    Out for delivery · ETA Tomorrow, 6 PM
                  </p>
                </div>
              </div>
              <div className="border-t border-border">
                <button className="w-full text-[12px] py-2 font-medium text-[#075E54]">
                  Track Order
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground text-right px-2 pb-1.5">10:14</div>
            </div>

            {/* New arrivals headline */}
            <div className="max-w-[80%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm text-[13px] text-charcoal">
              ✨ Just dropped — handpicked for you
              <div className="text-[10px] text-muted-foreground text-right mt-1">10:15</div>
            </div>

            {/* Carousel */}
            <div className="-mx-3 px-3 overflow-x-auto">
              <div className="flex gap-2.5 pb-1">
                {products.map((p) => (
                  <div
                    key={p.name}
                    className="w-40 shrink-0 bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    <div
                      className={`h-24 bg-gradient-to-br ${p.from} flex items-center justify-center text-4xl`}
                    >
                      {p.emoji}
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-[12px] font-semibold text-charcoal truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.price}</p>
                    </div>
                    <div className="grid grid-cols-2 border-t border-border">
                      <button className="text-[11px] py-1.5 font-medium text-[#075E54]">View</button>
                      <button className="text-[11px] py-1.5 font-medium text-[#075E54] border-l border-border">
                        Buy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply */}
            <div className="ml-auto max-w-[70%] bg-[#DCF8C6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm text-[13px] text-charcoal">
              Love the watch — checkout please 🛒
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-muted-foreground">10:16</span>
                <CheckCheck className="w-3 h-3 text-[#34B7F1]" />
              </div>
            </div>

            <div className="max-w-[75%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm text-[13px] text-charcoal">
              Done ✅ Secure checkout link ready — pay in 1 tap.
              <div className="text-[10px] text-muted-foreground text-right mt-1">10:16</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      {/* <div className="absolute -left-4 top-24 hidden md:flex items-center gap-2 bg-white rounded-full pl-2 pr-4 py-2 shadow-card animate-float-in">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
       <span className="text-xs font-medium text-charcoal">+$1,248 recovered</span> 
      </div>
      <div className="absolute -right-4 bottom-28 hidden md:flex items-center gap-2 bg-white rounded-full pl-2 pr-4 py-2 shadow-card animate-float-in">
        <span className="text-xs font-medium text-charcoal">98% open rate</span>
      </div> */}
    </div> 
  );
};

export default WhatsAppMockup;
