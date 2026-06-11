import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Coins, Gamepad2, Gift, ShieldCheck, Star, Users, TrendingUp, Zap } from "lucide-react";
import { useGetFeaturedOffers } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";

// ─── Live Conversions Ticker ────────────────────────────────────────────────

const FAKE_USERS = [
  "CashKing", "TopEarner", "GoldRush", "FastBucks", "EarnPro",
  "MoneyMover", "QuickCash", "ProUser99", "StarEarner", "LootHunter",
  "PaydayKing", "BonusChaser", "HighRoller", "CoinFlip", "EasyMoney",
];
const FAKE_OFFERS = [
  "Pinata Fiesta", "KOHO Visa Card", "Mobile Legends", "Coin Master",
  "Survey Junkie", "App Install Task", "Video Challenge", "Game Trial",
  "Crypto Wallet", "Shopping App", "Fitness Tracker", "Travel Survey",
  "Finance Quiz", "Brand Survey", "Puzzle Game",
];
const FAKE_AMOUNTS = [0.25, 0.50, 0.75, 1.20, 1.50, 2.00, 2.50, 3.00, 4.50, 5.00, 7.50, 10.00, 0.80, 1.00, 6.30];
const FAKE_COUNTRIES = ["🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇩🇪", "🇫🇷", "🇧🇷", "🇮🇳"];
const GRADIENT_ROWS = [
  "from-red-500/20 to-transparent",
  "from-violet-500/20 to-transparent",
  "from-blue-500/20 to-transparent",
  "from-emerald-500/20 to-transparent",
  "from-orange-500/20 to-transparent",
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEntry(id: number) {
  return {
    id,
    user: randomPick(FAKE_USERS),
    offer: randomPick(FAKE_OFFERS),
    amount: randomPick(FAKE_AMOUNTS),
    flag: randomPick(FAKE_COUNTRIES),
    ts: new Date(),
  };
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

function LiveConversionsTicker() {
  const [entries, setEntries] = useState(() =>
    Array.from({ length: 6 }, (_, i) => generateEntry(i))
  );
  const [newId, setNewId] = useState<number | null>(null);
  const counter = useRef(100);

  // Add a new conversion every 2.5s
  useEffect(() => {
    const iv = setInterval(() => {
      const id = ++counter.current;
      setEntries(prev => [generateEntry(id), ...prev.slice(0, 5)]);
      setNewId(id);
      setTimeout(() => setNewId(null), 600);
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  // Update timestamps every 10s
  useEffect(() => {
    const iv = setInterval(() => setEntries(e => [...e]), 10_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div
          key={e.id}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur transition-all duration-500 ${
            e.id === newId ? "bg-primary/10 border-primary/30 scale-[1.01]" : ""
          }`}
          style={{ opacity: 1 - i * 0.12 }}
        >
          <span className="text-base shrink-0">{e.flag}</span>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-sm text-foreground">{e.user}</span>
            <span className="text-muted-foreground text-sm"> earned </span>
            <span className="font-bold text-primary text-sm">${e.amount.toFixed(2)}</span>
            <span className="text-muted-foreground text-sm"> from </span>
            <span className="font-medium text-sm text-foreground/80 truncate">{e.offer}</span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(e.ts)}</span>
          {e.id === newId && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" /> NEW
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Home Page ──────────────────────────────────────────────────────────

export default function Home() {
  const { data: featuredOffers } = useGetFeaturedOffers();

  const CARD_GRADIENTS = [
    "from-red-600 to-rose-900",
    "from-orange-500 to-amber-800",
    "from-violet-600 to-purple-900",
    "from-blue-600 to-indigo-900",
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24 pb-32">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] opacity-25 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-[120px]" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-[120px]" />
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: headline */}
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 font-medium text-sm">
                <Star className="h-4 w-4 fill-primary" />
                <span>The highest-paying rewards platform</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 leading-tight">
                Turn your free time into{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-accent">Real Cash</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
                Complete surveys, play games, and watch videos to earn money.
                Withdraw instantly via PayPal, Crypto, or gift cards starting at just $5.00.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-lg h-14 px-8 rounded-full font-bold shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all bg-gradient-to-r from-primary to-rose-600 border-0">
                    Start Earning Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/how-it-works" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full text-lg h-14 px-8 rounded-full font-bold border-2 hover:bg-muted/50">
                    How it Works
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" /> Secure Payments
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-400" /> High Payouts
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" /> 1M+ Users
                </div>
              </div>
            </div>

            {/* Right: live conversions ticker */}
            <div className="flex-1 w-full max-w-lg">
              <div className="bg-card/50 backdrop-blur border border-white/10 rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                  <span className="text-sm font-bold text-foreground">Live Conversions</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">Real-time</Badge>
                </div>
                <LiveConversionsTicker />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="py-16 border-y relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 text-center divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-8">
              <div className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400 mb-2">$4.2M+</div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Total Paid Out</div>
            </div>
            <div className="p-8">
              <div className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400 mb-2">5 mins</div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Average Cashout Time</div>
            </div>
            <div className="p-8">
              <div className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">10k+</div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Daily Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Featured Opportunities</h2>
              <p className="text-muted-foreground max-w-2xl text-lg">
                Verified offers that pay out fast. Jump in and start earning right away.
              </p>
            </div>
            <Link href="/earn" className="hidden md:block">
              <Button variant="ghost" className="font-semibold group">
                View All <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredOffers?.slice(0, 4).map((offer, i) => (
              <div key={offer.id} className={`group relative bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]} rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/10`}>
                <div className="aspect-[4/3] relative overflow-hidden flex items-center justify-center p-6 bg-black/20">
                  {offer.imageUrl ? (
                    <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-lg" />
                  ) : (
                    <Gamepad2 className="w-16 h-16 text-white/20" />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/40 backdrop-blur text-white border-white/20 text-xs">
                      {offer.network}
                    </Badge>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1 truncate text-white">{offer.name}</h3>
                  <p className="text-sm text-white/60 line-clamp-2 mb-4 h-10">
                    {offer.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="font-bold text-2xl text-white">
                      ${offer.payout.toFixed(2)}
                    </div>
                    <Link href="/login">
                      <Button size="sm" className="rounded-full font-bold bg-white text-black hover:bg-white/90 border-0">Earn</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/earn">
              <Button variant="outline" className="w-full font-semibold">
                View All Offers <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How OfferLoots Works</h2>
            <p className="text-muted-foreground text-lg">
              Three simple steps to your first cashout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary via-violet-500 to-emerald-500 -z-10 opacity-40" />

            <div className="relative text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-rose-700 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
                <span className="text-3xl font-display font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Sign Up Free</h3>
              <p className="text-muted-foreground">Create an account in seconds. No credit card required, ever.</p>
            </div>

            <div className="relative text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-violet-500/30">
                <span className="text-3xl font-display font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Complete Tasks</h3>
              <p className="text-muted-foreground">Play games, answer surveys, or test apps from our partners.</p>
            </div>

            <div className="relative text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-teal-700 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Get Paid</h3>
              <p className="text-muted-foreground">Withdraw instantly via crypto, PayPal, or gift cards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-primary via-rose-700 to-red-900">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 max-w-3xl mx-auto">
            Ready to start making money in your free time?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Join the fastest growing rewards platform and access the highest paying offers on the web.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg h-14 px-10 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform bg-white text-red-600 hover:bg-white/90 border-0">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
