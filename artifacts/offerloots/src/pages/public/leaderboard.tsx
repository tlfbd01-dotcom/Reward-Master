import { PublicLayout } from "@/components/layout/public-layout";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getAvatarUrl } from "@/lib/avatars";
import { AVATARS } from "@/lib/avatars";

// ── Seeded PRNG (mulberry32) ───────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    let s = (seed + 0x6d2b79f5) | 0;
    s = Math.imul(s ^ (s >>> 15), 1 | s);
    s = (s + Math.imul(s ^ (s >>> 7), 61 | s)) ^ s;
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRand(seed: number): number {
  const r = mulberry32(seed);
  r(); r(); // warm up
  return r();
}

// ── User pool ─────────────────────────────────────────────────────────────
interface FakeUser {
  id: number;
  username: string;
  flag: string;
  skill: number; // 0-1, higher = tends to earn more
  avatarId: string;
}

const USER_POOL: FakeUser[] = [
  { id: 1,  username: "CashKing99",   flag: "🇺🇸", skill: 0.97, avatarId: "m_felix" },
  { id: 2,  username: "TopEarnerX",   flag: "🇬🇧", skill: 0.94, avatarId: "f_sophia" },
  { id: 3,  username: "ProSurveyor",  flag: "🇨🇦", skill: 0.91, avatarId: "m_liam" },
  { id: 4,  username: "GoldHunter",   flag: "🇦🇺", skill: 0.88, avatarId: "f_emma" },
  { id: 5,  username: "RichieRich",   flag: "🇩🇪", skill: 0.85, avatarId: "m_noah" },
  { id: 6,  username: "OfferMaster",  flag: "🇮🇳", skill: 0.82, avatarId: "f_olivia" },
  { id: 7,  username: "SurveyKing",   flag: "🇧🇷", skill: 0.79, avatarId: "m_oliver" },
  { id: 8,  username: "DailyGrind",   flag: "🇵🇭", skill: 0.76, avatarId: "f_ava" },
  { id: 9,  username: "FastCash22",   flag: "🇲🇽", skill: 0.73, avatarId: "m_james" },
  { id: 10, username: "PaydayPro",    flag: "🇳🇬", skill: 0.70, avatarId: "f_isabella" },
  { id: 11, username: "LootLegend",   flag: "🇺🇸", skill: 0.67, avatarId: "m_william" },
  { id: 12, username: "ClickQueen",   flag: "🇬🇧", skill: 0.63, avatarId: "f_mia" },
  { id: 13, username: "EarnZone",     flag: "🇨🇦", skill: 0.60, avatarId: "m_benjamin" },
  { id: 14, username: "SurveyStar",   flag: "🇦🇺", skill: 0.56, avatarId: "f_charlotte" },
  { id: 15, username: "MoneyMoves",   flag: "🇩🇪", skill: 0.53, avatarId: "m_lucas" },
  { id: 16, username: "GigWizard",    flag: "🇵🇰", skill: 0.49, avatarId: "f_amelia" },
  { id: 17, username: "EasyMoney7",   flag: "🇧🇩", skill: 0.46, avatarId: "m_henry" },
  { id: 18, username: "HustleHero",   flag: "🇮🇩", skill: 0.42, avatarId: "f_harper" },
  { id: 19, username: "LootieMcLoot", flag: "🇫🇷", skill: 0.38, avatarId: "m_alexander" },
  { id: 20, username: "BonusHunter",  flag: "🇵🇭", skill: 0.34, avatarId: "f_evelyn" },
];

// ── Leaderboard engine ─────────────────────────────────────────────────────

function getWeekIndex(): number {
  // Epoch weeks (resets every Monday)
  return Math.floor(Date.now() / (7 * 24 * 3600 * 1000));
}

function getHourIndexInWeek(): number {
  const now = new Date();
  return now.getUTCDay() * 24 + now.getUTCHours();
}

/** Hourly earning for a user at a given hour in the week */
function hourlyEarning(weekSeed: number, userId: number, hourIndex: number): number {
  const user = USER_POOL.find((u) => u.id === userId)!;
  // Base max hourly = $8 for skill 1.0, tapering to $1.5 for skill 0.3
  const maxHourly = 1.5 + user.skill * 6.5;
  // Seed unique per (week, user, hour)
  const r = seededRand(weekSeed * 100000 + userId * 200 + hourIndex);
  // 30% chance of earning nothing in an hour (simulates offline time)
  if (r < 0.30) return 0;
  const amount = ((r - 0.30) / 0.70) * maxHourly;
  // Round to nearest cent
  return Math.round(amount * 100) / 100;
}

interface LeaderEntry {
  id: number;
  username: string;
  flag: string;
  avatarId: string;
  totalEarned: number;
  rank: number;
  prevRank: number;
  move: number; // positive = moved up, negative = moved down
}

function computeLeaderboard(hourIndex: number): LeaderEntry[] {
  const weekSeed = getWeekIndex();

  const totals = USER_POOL.map((u) => {
    let earned = 0;
    for (let h = 0; h <= hourIndex; h++) {
      earned += hourlyEarning(weekSeed, u.id, h);
    }
    return { ...u, totalEarned: Math.round(earned * 100) / 100 };
  });

  const prevTotals = USER_POOL.map((u) => {
    let earned = 0;
    for (let h = 0; h <= Math.max(0, hourIndex - 1); h++) {
      earned += hourlyEarning(weekSeed, u.id, h);
    }
    return { id: u.id, totalEarned: earned };
  });

  const sortedCurrent = [...totals].sort((a, b) => b.totalEarned - a.totalEarned);
  const sortedPrev = [...prevTotals].sort((a, b) => b.totalEarned - a.totalEarned);

  const prevRankMap = new Map(sortedPrev.map((u, i) => [u.id, i + 1]));

  return sortedCurrent.map((u, i) => {
    const rank = i + 1;
    const prevRank = prevRankMap.get(u.id) ?? rank;
    return {
      id: u.id,
      username: u.username,
      flag: u.flag,
      avatarId: u.avatarId,
      totalEarned: u.totalEarned,
      rank,
      prevRank,
      move: prevRank - rank, // positive means moved up in rankings
    };
  });
}

// ── Countdown helpers ──────────────────────────────────────────────────────

function secondsUntilNextHour(): number {
  const now = new Date();
  return (60 - now.getMinutes()) * 60 - now.getSeconds();
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Mask username ──────────────────────────────────────────────────────────

function maskName(name: string): string {
  if (name.length <= 4) return name.substring(0, 2) + "***";
  return name.substring(0, 3) + "***" + name.slice(-2);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [hourIndex, setHourIndex] = useState(getHourIndexInWeek);
  const [countdown, setCountdown] = useState(secondsUntilNextHour);
  const [entries, setEntries] = useState<LeaderEntry[]>(() =>
    computeLeaderboard(getHourIndexInWeek())
  );
  const [flash, setFlash] = useState(false);

  // Tick every second: update countdown, refresh leaderboard on the hour
  useEffect(() => {
    const interval = setInterval(() => {
      const secs = secondsUntilNextHour();
      setCountdown(secs);

      const newHour = getHourIndexInWeek();
      if (newHour !== hourIndex) {
        setHourIndex(newHour);
        setEntries(computeLeaderboard(newHour));
        setFlash(true);
        setTimeout(() => setFlash(false), 1500);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hourIndex]);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  const periodLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen pt-12 pb-24">
        {/* Header */}
        <div className="relative mb-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-4 border border-accent/20">
              <Trophy className="w-8 h-8 text-accent drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-3">
              Top Earners <span className="text-accent">Weekly</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              The most dedicated users on OfferLoots. Compete to reach the top and unlock exclusive bonuses.
            </p>

            {/* Period + Countdown */}
            <div className="inline-flex items-center gap-6 bg-card/60 border border-border/50 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Period</div>
                <div className="text-sm font-semibold">{periodLabel}</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5 flex items-center gap-1 justify-center">
                  <Clock className="w-2.5 h-2.5" /> Next Update
                </div>
                <div className={`font-mono font-bold text-lg tabular-nums transition-colors ${countdown <= 60 ? "text-accent" : "text-primary"}`}>
                  {formatCountdown(countdown)}
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Resets In</div>
                <div className="text-sm font-semibold">{7 - Math.floor(hourIndex / 24)}d left</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 podium */}
        <div className="container mx-auto px-4 max-w-4xl mb-8 relative z-10">
          <div className="grid grid-cols-3 gap-4 items-end">
            {/* 2nd */}
            <PodiumCard entry={entries[1]} />
            {/* 1st */}
            <PodiumCard entry={entries[0]} large />
            {/* 3rd */}
            <PodiumCard entry={entries[2]} />
          </div>
        </div>

        {/* Table rows 4-20 */}
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <Card className={`border-accent/20 shadow-2xl overflow-hidden bg-card/80 backdrop-blur-sm transition-all duration-500 ${flash ? "ring-2 ring-accent/40" : ""}`}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-xs uppercase font-bold tracking-wider text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 w-20 text-center">Rank</th>
                      <th className="px-4 py-4 w-10 text-center">Move</th>
                      <th className="px-4 py-4">User</th>
                      <th className="px-6 py-4 text-right">This Week</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {entries.slice(3).map((entry) => (
                      <TableRow key={entry.id} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}

// ── Podium Card ───────────────────────────────────────────────────────────

function PodiumCard({ entry, large }: { entry?: LeaderEntry; large?: boolean }) {
  if (!entry) return <div />;
  const avatarUrl = getAvatarUrl(entry.avatarId);

  const colors = {
    1: {
      bg: "from-yellow-500/20 to-yellow-400/5",
      border: "border-yellow-400/50",
      text: "text-yellow-400",
      badge: "bg-yellow-400 text-black",
      glow: "drop-shadow-[0_0_16px_rgba(250,204,21,0.5)]",
      ring: "ring-yellow-400/60",
    },
    2: {
      bg: "from-zinc-400/20 to-zinc-300/5",
      border: "border-zinc-400/40",
      text: "text-zinc-300",
      badge: "bg-zinc-400 text-black",
      glow: "drop-shadow-[0_0_12px_rgba(161,161,170,0.4)]",
      ring: "ring-zinc-400/50",
    },
    3: {
      bg: "from-orange-500/20 to-orange-400/5",
      border: "border-orange-400/40",
      text: "text-orange-400",
      badge: "bg-orange-500 text-white",
      glow: "drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]",
      ring: "ring-orange-400/50",
    },
  }[entry.rank as 1 | 2 | 3];

  return (
    <div className={`relative rounded-2xl border bg-gradient-to-b ${colors.bg} ${colors.border} p-4 flex flex-col items-center text-center ${large ? "py-6 scale-105 shadow-2xl z-10" : "opacity-90"}`}>
      {large && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Trophy className={`w-7 h-7 text-yellow-400 ${colors.glow}`} />
        </div>
      )}

      <div className={`relative mb-3 ${large ? "mt-4" : "mt-1"}`}>
        <div className={`rounded-full overflow-hidden flex items-center justify-center font-bold bg-muted/50 ring-2 ${colors.ring} ${large ? "w-20 h-20 text-3xl" : "w-14 h-14 text-xl"}`}>
          {avatarUrl
            ? <img src={avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
            : <span className={colors.text}>{entry.username.charAt(0).toUpperCase()}</span>
          }
        </div>
        <span className={`absolute -bottom-1 -right-1 ${colors.badge} text-xs font-black rounded-full w-5 h-5 flex items-center justify-center`}>
          {entry.rank}
        </span>
      </div>

      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-base">{entry.flag}</span>
        <span className={`font-bold ${large ? "text-base" : "text-sm"}`}>{maskName(entry.username)}</span>
      </div>

      <span className={`font-mono font-black ${large ? "text-2xl" : "text-lg"} ${colors.text} ${colors.glow}`}>
        ${entry.totalEarned.toFixed(2)}
      </span>

      <MoveBadge move={entry.move} small />
    </div>
  );
}

// ── Table Row ─────────────────────────────────────────────────────────────

function TableRow({ entry }: { entry: LeaderEntry }) {
  const avatarUrl = getAvatarUrl(entry.avatarId);
  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      <td className="px-6 py-3 text-center">
        <span className="text-base font-bold text-muted-foreground">{entry.rank}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <MoveBadge move={entry.move} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt={entry.username} className="w-full h-full object-cover" />
              : entry.username.charAt(0).toUpperCase()
            }
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">{entry.flag}</span>
            <span className="font-semibold">{maskName(entry.username)}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-3 text-right">
        <span className="font-mono font-bold text-primary">${entry.totalEarned.toFixed(2)}</span>
      </td>
    </tr>
  );
}

// ── Move badge ─────────────────────────────────────────────────────────────

function MoveBadge({ move, small }: { move: number; small?: boolean }) {
  const sz = small ? "text-[10px] px-1 py-0.5" : "text-xs px-1.5 py-0.5";
  if (move > 0) {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded font-bold bg-green-500/15 text-green-400 ${sz}`}>
        <TrendingUp className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {move}
      </span>
    );
  }
  if (move < 0) {
    return (
      <span className={`inline-flex items-center gap-0.5 rounded font-bold bg-red-500/15 text-red-400 ${sz}`}>
        <TrendingDown className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {Math.abs(move)}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-0.5 rounded font-bold bg-muted/50 text-muted-foreground ${sz}`}>
      <Minus className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
    </span>
  );
}
