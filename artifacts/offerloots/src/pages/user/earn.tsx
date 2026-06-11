import { AppLayout } from "@/components/layout/app-layout";
import { useGetOffers, useGetNetworks, useGetOffer } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Gamepad2, Monitor, Smartphone, Star, TrendingUp, Layers, X,
  ExternalLink, Loader2, Zap, Globe, ShieldCheck, CheckCircle2, DollarSign,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Wall = {
  id: number; name: string; slug: string; logoUrl: string | null;
  rating: number; description: string; isActive: boolean;
  iframeUrl: string | null; totalConversions: number; totalRevenue: number;
};

type OfferEvent = { name: string; payout: number; eventId?: string };

// ─── Color palettes ──────────────────────────────────────────────────────────

const WALL_GRADIENTS = [
  "from-red-600 via-rose-700 to-red-900",
  "from-orange-500 via-amber-600 to-orange-900",
  "from-violet-600 via-purple-700 to-violet-900",
  "from-blue-600 via-indigo-700 to-blue-900",
  "from-emerald-500 via-teal-600 to-emerald-900",
  "from-pink-500 via-rose-600 to-pink-900",
  "from-yellow-500 via-amber-500 to-yellow-800",
  "from-cyan-500 via-sky-600 to-cyan-900",
];

const CARD_ACCENT_COLORS = [
  "border-red-500/40 hover:border-red-400/70",
  "border-orange-500/40 hover:border-orange-400/70",
  "border-violet-500/40 hover:border-violet-400/70",
  "border-blue-500/40 hover:border-blue-400/70",
  "border-emerald-500/40 hover:border-emerald-400/70",
  "border-pink-500/40 hover:border-pink-400/70",
  "border-yellow-500/40 hover:border-yellow-400/70",
  "border-cyan-500/40 hover:border-cyan-400/70",
];

const PAYOUT_COLORS = [
  "text-red-400", "text-orange-400", "text-violet-400",
  "text-blue-400", "text-emerald-400", "text-pink-400",
  "text-yellow-400", "text-cyan-400",
];

const NETWORK_TAG_COLORS = [
  "bg-red-500/20 text-red-300 border-red-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
];

// ─── Star rating ─────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Offer Detail Popup ───────────────────────────────────────────────────────

function OfferDetailPopup({
  offerId,
  onClose,
}: {
  offerId: number | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [clicking, setClicking] = useState(false);

  const { data: offer, isLoading } = useGetOffer(offerId ?? 0, {
    query: { enabled: !!offerId },
  });

  const handleStart = async () => {
    if (!offer) return;
    setClicking(true);
    try {
      const result = await customFetch<{ url: string | null }>(`/api/offers/${offer.id}/click`);
      const url = result.url ?? (offer as any).offerUrl;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        onClose();
      } else {
        toast({ title: "No offer URL configured" });
      }
    } catch {
      const fallback = (offer as any).offerUrl;
      if (fallback) {
        window.open(fallback, "_blank", "noopener,noreferrer");
        onClose();
      }
    } finally {
      setClicking(false);
    }
  };

  const events: OfferEvent[] = (offer as any)?.events ?? [];
  const hasEvents = events.length > 0;
  const totalPayout = hasEvents
    ? events.reduce((s, e) => s + e.payout, 0)
    : (offer?.payout ?? 0);

  const colorIdx = offerId ? offerId % CARD_ACCENT_COLORS.length : 0;
  const payoutColor = PAYOUT_COLORS[colorIdx];

  return (
    <Dialog open={!!offerId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {isLoading || !offer ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Header image */}
            <div className="relative h-52 bg-gradient-to-br from-muted/60 to-muted/20 flex items-center justify-center overflow-hidden">
              {(offer as any).imageUrl ? (
                <img
                  src={(offer as any).imageUrl}
                  alt={offer.name}
                  className="max-h-full max-w-full object-contain p-6"
                />
              ) : (
                <Gamepad2 className="w-20 h-20 text-muted-foreground/20" />
              )}
              {/* Network badge */}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-background/90 backdrop-blur font-bold border border-white/10 text-xs px-2.5 py-1">
                  {offer.network}
                </Badge>
                {hasEvents && (
                  <Badge variant="outline" className="bg-background/90 backdrop-blur border-primary/40 text-primary text-xs px-2 py-1">
                    <Layers className="w-3 h-3 mr-1" />{events.length} events
                  </Badge>
                )}
              </div>
              {/* Device indicator */}
              <div className="absolute top-3 right-3">
                {(offer as any).device === "mobile" && (
                  <Badge variant="outline" className="bg-background/90 backdrop-blur gap-1 text-xs">
                    <Smartphone className="w-3 h-3" /> Mobile
                  </Badge>
                )}
                {(offer as any).device === "desktop" && (
                  <Badge variant="outline" className="bg-background/90 backdrop-blur gap-1 text-xs">
                    <Monitor className="w-3 h-3" /> Desktop
                  </Badge>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold leading-tight mb-1">{offer.name}</h2>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs capitalize">{offer.category}</Badge>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      {(offer as any).countries?.length ? (offer as any).countries.slice(0, 3).join(", ") : "Global"}
                    </Badge>
                  </div>
                </div>
                <div className={`text-3xl font-bold shrink-0 ${payoutColor}`}>
                  ${totalPayout.toFixed(2)}
                </div>
              </div>

              {/* Multi-event breakdown */}
              {hasEvents && (
                <div className="rounded-xl border bg-muted/20 overflow-hidden">
                  <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">Completion Events</span>
                  </div>
                  <div className="divide-y">
                    {events.map((ev, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {i + 1}
                        </div>
                        <span className="flex-1 text-sm">{ev.name}</span>
                        <span className={`font-bold text-sm ${payoutColor}`}>${ev.payout.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 py-2.5 bg-muted/20 font-bold text-sm">
                      <span>Total Reward</span>
                      <span className={payoutColor}>${totalPayout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {(offer as any).description && (
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {(offer as any).description}
                  </p>
                </div>
              )}

              {/* Rules */}
              <div className="rounded-xl border bg-muted/10 p-4 space-y-2.5">
                <h3 className="font-semibold text-sm mb-1">Important Rules</h3>
                <div className="flex gap-2.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  Complete all offer requirements exactly as stated.
                </div>
                <div className="flex gap-2.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  Do not use VPNs or proxies — this may result in a ban.
                </div>
                <div className="flex gap-2.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  Rewards credit within 5–15 minutes of completion.
                </div>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                className="w-full h-12 text-base font-bold rounded-xl shadow-lg group"
                onClick={handleStart}
                disabled={clicking}
              >
                {clicking ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening…</>
                ) : (
                  <>
                    Start Offer — Earn ${totalPayout.toFixed(2)}
                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Opens in a new tab via {offer.network}.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Wall card ────────────────────────────────────────────────────────────────

function WallCard({ wall, index, onOpen }: { wall: Wall; index: number; onOpen: (w: Wall) => void }) {
  const gradient = WALL_GRADIENTS[index % WALL_GRADIENTS.length];
  return (
    <Card
      className="hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group overflow-hidden border-0"
      onClick={() => onOpen(wall)}
    >
      <div className={`bg-gradient-to-br ${gradient} p-6 flex flex-col items-center justify-center min-h-[120px] relative`}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white,transparent)]" />
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden mb-3 ring-2 ring-white/30 shadow-lg">
          {wall.logoUrl ? (
            <img src={wall.logoUrl} alt={wall.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-3xl font-bold text-white">{wall.name[0]}</span>
          )}
        </div>
        <h3 className="font-bold text-white text-lg text-center drop-shadow">{wall.name}</h3>
        <StarRating rating={wall.rating} />
      </div>
      <CardContent className="p-4 space-y-3 bg-card">
        {wall.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{wall.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            {wall.totalConversions.toLocaleString()} rewards paid
          </span>
          <Button
            size="sm"
            className={`rounded-full font-bold text-xs px-4 bg-gradient-to-r ${gradient} border-0 text-white hover:opacity-90`}
            onClick={(e) => { e.stopPropagation(); onOpen(wall); }}
          >
            Open <Zap className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Wall iframe modal ────────────────────────────────────────────────────────

function WallIframeModal({ wall, onClose }: { wall: Wall; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {wall.logoUrl ? (
            <img src={wall.logoUrl} alt={wall.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-sm font-bold text-primary">{wall.name[0]}</span>
          )}
        </div>
        <div>
          <span className="font-bold text-sm">{wall.name}</span>
          <p className="text-xs text-muted-foreground">Complete offers to earn cash. Rewards credit automatically.</p>
        </div>
        <Button variant="outline" size="icon" className="ml-auto shrink-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      {wall.iframeUrl ? (
        <iframe
          src={wall.iframeUrl}
          className="flex-1 w-full border-0"
          title={wall.name}
          allow="clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No URL configured for this offerwall.
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const OFFERS_PER_PAGE = 40;

export default function Earn() {
  const [page, setPage] = useState(1);
  const [network, setNetwork] = useState<string>("all");
  const [device, setDevice] = useState<string>("all");
  const [walls, setWalls] = useState<Wall[]>([]);
  const [wallsLoading, setWallsLoading] = useState(true);
  const [activeWall, setActiveWall] = useState<Wall | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);

  const { data: networksData } = useGetNetworks();
  const queryParams: any = { page, limit: OFFERS_PER_PAGE };
  if (network !== "all") queryParams.network = network;
  if (device !== "all") queryParams.device = device;
  const { data: offersData, isLoading } = useGetOffers(queryParams);

  useEffect(() => {
    customFetch<Wall[]>("/api/walls")
      .then(setWalls)
      .catch(() => setWalls([]))
      .finally(() => setWallsLoading(false));
  }, []);

  const totalPages = offersData ? Math.ceil(offersData.total / OFFERS_PER_PAGE) : 1;

  return (
    <AppLayout>
      {activeWall && <WallIframeModal wall={activeWall} onClose={() => setActiveWall(null)} />}
      <OfferDetailPopup offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Earn Cash</h1>
          <p className="text-muted-foreground">Complete offers or browse offerwall networks to earn real money.</p>
        </div>

        <Tabs defaultValue="walls">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="walls" className="gap-2">
              <Layers className="w-4 h-4" /> Offerwalls
              {walls.length > 0 && <Badge variant="secondary" className="text-xs px-1.5">{walls.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2">
              <Gamepad2 className="w-4 h-4" /> Individual Offers
              {offersData && <Badge variant="secondary" className="text-xs px-1.5">{offersData.total.toLocaleString()}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* OFFERWALLS TAB */}
          <TabsContent value="walls" className="mt-6">
            {wallsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : walls.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border">
                <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold">No offerwalls available</h3>
                <p className="text-muted-foreground">Check back soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {walls.map((w, i) => (
                  <WallCard key={w.id} wall={w} index={i} onOpen={setActiveWall} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* INDIVIDUAL OFFERS TAB */}
          <TabsContent value="offers" className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={network} onValueChange={(val) => { setNetwork(val); setPage(1); }}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Networks" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  {networksData?.map((n) => (
                    <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={device} onValueChange={(val) => { setDevice(val); setPage(1); }}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All Devices" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                </SelectContent>
              </Select>
              {(network !== "all" || device !== "all") && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setNetwork("all"); setDevice("all"); setPage(1); }}>
                  Clear
                </Button>
              )}
              {offersData && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {offersData.total.toLocaleString()} offers · Page {page}/{totalPages}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {[...Array(40)].map((_, i) => <div key={i} className="animate-pulse bg-muted/50 rounded-xl aspect-[3/4]" />)}
              </div>
            ) : offersData?.data?.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border">
                <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold">No offers found</h3>
                <p className="text-muted-foreground">Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                {/* 8-per-row compact grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                  {offersData?.data.map((offer: any) => {
                    const colorIdx = offer.id % CARD_ACCENT_COLORS.length;
                    const payoutColor = PAYOUT_COLORS[colorIdx];
                    const accentBorder = CARD_ACCENT_COLORS[colorIdx];
                    const networkTagColor = NETWORK_TAG_COLORS[colorIdx];
                    const hasEvents = offer.events && offer.events.length > 0;
                    return (
                      <div
                        key={offer.id}
                        className={`group relative bg-card rounded-xl border ${accentBorder} transition-all hover:shadow-lg hover:scale-[1.04] overflow-hidden flex flex-col cursor-pointer`}
                        onClick={() => setSelectedOfferId(offer.id)}
                      >
                        {/* Image */}
                        <div className="aspect-square bg-muted/30 relative overflow-hidden flex items-center justify-center">
                          {offer.imageUrl ? (
                            <img
                              src={offer.imageUrl}
                              alt={offer.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <Gamepad2 className="w-5 h-5 text-muted-foreground/30" />
                          )}
                          {/* Device icon */}
                          {offer.device !== "all" && offer.device && (
                            <div className="absolute top-1 right-1">
                              {offer.device === "mobile"
                                ? <Smartphone className="w-2.5 h-2.5 text-white/70 drop-shadow" />
                                : <Monitor className="w-2.5 h-2.5 text-white/70 drop-shadow" />}
                            </div>
                          )}
                          {/* Multi-event badge */}
                          {hasEvents && (
                            <div className="absolute top-1 left-1 bg-black/60 rounded px-1 py-0.5">
                              <span className="text-[8px] text-white font-bold">{offer.events.length}✦</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-1.5 flex flex-col gap-0.5 flex-1">
                          {/* Network tag */}
                          <span className={`inline-block text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${networkTagColor} leading-none self-start truncate max-w-full`}>
                            {offer.network}
                          </span>
                          {/* Name */}
                          <p className="text-[10px] leading-tight font-medium line-clamp-2 text-foreground/90 mt-0.5">{offer.name}</p>
                          {/* Payout */}
                          <div className={`text-[11px] font-bold mt-auto ${payoutColor}`}>${offer.payout.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                        return (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === page ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
