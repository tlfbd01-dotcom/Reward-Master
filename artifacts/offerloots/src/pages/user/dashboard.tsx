import { AppLayout } from "@/components/layout/app-layout";
import { useGetUserDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Coins, ArrowUpRight, History, Gamepad2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AvatarPicker } from "@/components/avatar-picker";

// ─── Live Conversion Ticker ──────────────────────────────────────────────────

const TICKER_NAMES = [
  "Ear", "Qui", "Top", "Pro", "Cas", "Fas", "Max", "Rio",
  "Zen", "Sky", "Nex", "Ace", "Vex", "Key", "Lux", "Arc",
];
const TICKER_FLAGS = ["🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇩🇪", "🇮🇳", "🇧🇷", "🇵🇭", "🇲🇽", "🇳🇬"];
const TICKER_OFFERS = [
  "App Install Task", "Shopping Survey", "Puzzle Game", "Survey Junkie",
  "Finance App", "VPN Trial", "Casino Bonus", "Game Quest", "Music Stream",
  "Fitness App", "Food Delivery", "Travel Survey", "Crypto Sign Up",
];
const TICKER_AMOUNTS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.5, 0.8, 1.2, 2.8];

function maskUser(name: string) {
  return name.slice(0, 3) + "****";
}

const TICKER_ITEMS = Array.from({ length: 18 }, (_, i) => ({
  flag: TICKER_FLAGS[i % TICKER_FLAGS.length],
  user: maskUser(TICKER_NAMES[i % TICKER_NAMES.length]),
  amount: TICKER_AMOUNTS[i % TICKER_AMOUNTS.length].toFixed(2),
  offer: TICKER_OFFERS[i % TICKER_OFFERS.length],
}));

function LiveTicker() {
  return (
    <div className="relative overflow-hidden bg-card/60 border rounded-xl px-4 py-2.5 flex items-center gap-3">
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="shrink-0 flex items-center gap-1.5 border-r pr-3 mr-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">LIVE</span>
      </div>
      <div className="overflow-hidden flex-1">
        <div
          className="flex gap-10 whitespace-nowrap will-change-transform"
          style={{ animation: "ticker-scroll 45s linear infinite" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs">
              <span className="text-base leading-none">{item.flag}</span>
              <span className="font-semibold text-foreground">{item.user}</span>
              <span className="text-muted-foreground">earned</span>
              <span className="font-bold text-primary">${item.amount}</span>
              <span className="text-muted-foreground">from</span>
              <span className="text-foreground/80">{item.offer}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetUserDashboard();
  const { user } = useAuth();
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  useEffect(() => {
    if (user && !user.avatar) {
      const key = `offerloots_avatar_prompted_${user.id}`;
      if (!localStorage.getItem(key)) {
        setAvatarPickerOpen(true);
        localStorage.setItem(key, "1");
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AvatarPicker
        open={avatarPickerOpen}
        onOpenChange={setAvatarPickerOpen}
        currentAvatarId={user?.avatar}
        firstTime
      />

      <div className="space-y-6">
        {/* Live Conversion Ticker */}
        <LiveTicker />

        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your earning summary.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <Coins className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${(dashboard?.balance || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(dashboard?.todayEarned || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(dashboard?.totalEarned || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Offers</CardTitle>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.totalConversions || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Offers completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rank Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="capitalize">{dashboard?.rank || "Bronze"}</Badge>
                  <span className="text-sm text-muted-foreground">Current Rank</span>
                </div>
                <span className="text-sm font-medium">{dashboard?.rankProgress || 0}%</span>
              </div>
              <Progress value={dashboard?.rankProgress || 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Complete more offers to rank up and earn higher bonuses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-between" asChild>
                <Link href="/earn">
                  Browse Offers
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/withdrawals">
                  Withdraw Earnings
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/referrals">
                  Refer Friends
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.recentTransactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-1 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{tx.type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{tx.description || "—"}</p>
                    </div>
                    <span className={`font-bold text-sm ${parseFloat(tx.amount) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {parseFloat(tx.amount) >= 0 ? "+" : ""}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
