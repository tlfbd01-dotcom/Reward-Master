import { AppLayout } from "@/components/layout/app-layout";
import { useGetOffers, useGetOffer } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ClipboardList, Monitor, Smartphone, Layers, ExternalLink,
  Loader2, Globe, ShieldCheck, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

type OfferEvent = { name: string; payout: number; eventId?: string };

function SurveyDetailPopup({ offerId, onClose }: { offerId: number | null; onClose: () => void }) {
  const { toast } = useToast();
  const [clicking, setClicking] = useState(false);

  const { data: offer, isLoading } = useGetOffer(offerId ?? 0, {
    query: { enabled: !!offerId, queryKey: ["offer", offerId] },
  });

  const handleStart = async () => {
    if (!offer) return;
    setClicking(true);
    try {
      const result = await customFetch<{ url: string | null }>(`/api/offers/${offer.id}/click`);
      const url = result.url ?? (offer as any).offerUrl;
      if (url) { window.open(url, "_blank", "noopener,noreferrer"); onClose(); }
      else toast({ title: "No survey URL configured" });
    } catch {
      const fallback = (offer as any).offerUrl;
      if (fallback) { window.open(fallback, "_blank", "noopener,noreferrer"); onClose(); }
    } finally { setClicking(false); }
  };

  const events: OfferEvent[] = (offer as any)?.events ?? [];
  const hasEvents = events.length > 0;
  const totalPayout = hasEvents ? events.reduce((s, e) => s + e.payout, 0) : (offer?.payout ?? 0);
  const colorIdx = offerId ? offerId % PAYOUT_COLORS.length : 0;
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
            <div className="relative h-52 bg-gradient-to-br from-violet-600/20 to-muted/20 flex items-center justify-center overflow-hidden">
              {(offer as any).imageUrl ? (
                <img src={(offer as any).imageUrl} alt={offer.name} className="max-h-full max-w-full object-contain p-6" />
              ) : (
                <ClipboardList className="w-20 h-20 text-muted-foreground/20" />
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-background/90 backdrop-blur font-bold border border-white/10 text-xs px-2.5 py-1">{offer.network}</Badge>
                <Badge variant="outline" className="bg-background/90 backdrop-blur border-violet-400/40 text-violet-400 text-xs px-2 py-1">
                  <ClipboardList className="w-3 h-3 mr-1" /> Survey
                </Badge>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold leading-tight mb-1">{offer.name}</h2>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      {(offer as any).countries?.length ? (offer as any).countries.slice(0, 3).join(", ") : "Global"}
                    </Badge>
                    {(offer as any).device === "mobile" && (
                      <Badge variant="outline" className="text-xs gap-1"><Smartphone className="w-3 h-3" /> Mobile</Badge>
                    )}
                    {(offer as any).device === "desktop" && (
                      <Badge variant="outline" className="text-xs gap-1"><Monitor className="w-3 h-3" /> Desktop</Badge>
                    )}
                  </div>
                </div>
                <div className={`text-3xl font-bold shrink-0 ${payoutColor}`}>${totalPayout.toFixed(2)}</div>
              </div>

              {(offer as any).description && (
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{(offer as any).description}</p>
                </div>
              )}

              <div className="rounded-xl border bg-muted/10 p-4 space-y-2.5">
                <h3 className="font-semibold text-sm mb-1">Survey Rules</h3>
                <div className="flex gap-2.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  Answer all questions honestly and completely.
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

              <Button size="lg" className="w-full h-12 text-base font-bold rounded-xl shadow-lg group" onClick={handleStart} disabled={clicking}>
                {clicking ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening…</>
                ) : (
                  <>Start Survey — Earn ${totalPayout.toFixed(2)}<ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Opens in a new tab via {offer.network}.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const OFFERS_PER_PAGE = 40;

export default function EarnSurvey() {
  const [page, setPage] = useState(1);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);

  const { data: offersData, isLoading } = useGetOffers({ page, limit: OFFERS_PER_PAGE, category: "survey" } as any);
  const totalPages = offersData ? Math.ceil(offersData.total / OFFERS_PER_PAGE) : 1;

  return (
    <AppLayout>
      <SurveyDetailPopup offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Surveys</h1>
          <p className="text-muted-foreground">Share your opinions and earn cash by completing surveys.</p>
        </div>

        {offersData && (
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              {offersData.total.toLocaleString()} surveys · Page {page}/{totalPages}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {[...Array(40)].map((_, i) => <div key={i} className="animate-pulse bg-muted/50 rounded-xl aspect-[3/4]" />)}
          </div>
        ) : offersData?.data?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold">No surveys available</h3>
            <p className="text-muted-foreground">Check back soon — new surveys are added regularly.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {offersData?.data.map((offer: any) => {
                const colorIdx = offer.id % CARD_ACCENT_COLORS.length;
                const payoutColor = PAYOUT_COLORS[colorIdx];
                const accentBorder = CARD_ACCENT_COLORS[colorIdx];
                const networkTagColor = NETWORK_TAG_COLORS[colorIdx];
                return (
                  <div
                    key={offer.id}
                    className={`group relative bg-card rounded-xl border ${accentBorder} transition-all hover:shadow-lg hover:scale-[1.04] overflow-hidden flex flex-col cursor-pointer`}
                    onClick={() => setSelectedOfferId(offer.id)}
                  >
                    <div className="aspect-square bg-muted/30 relative overflow-hidden flex items-center justify-center">
                      {offer.imageUrl ? (
                        <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <ClipboardList className="w-5 h-5 text-muted-foreground/30" />
                      )}
                      {offer.device !== "all" && offer.device && (
                        <div className="absolute top-1 right-1">
                          {offer.device === "mobile"
                            ? <Smartphone className="w-2.5 h-2.5 text-white/70 drop-shadow" />
                            : <Monitor className="w-2.5 h-2.5 text-white/70 drop-shadow" />}
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 flex flex-col gap-0.5 flex-1">
                      <span className={`inline-block text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${networkTagColor} leading-none self-start truncate max-w-full`}>
                        {offer.network}
                      </span>
                      <p className="text-[12px] leading-tight font-semibold line-clamp-2 text-foreground/90 mt-0.5">{offer.name}</p>
                      {offer.device && offer.device !== "all" && (
                        <span className="text-[10px] text-muted-foreground/80 leading-none mt-0.5">
                          {offer.device === "mobile" ? "📱 Mobile" : "🖥 Desktop"}
                        </span>
                      )}
                      <div className="mt-auto pt-1 flex justify-center">
                        <span className={`text-[15px] font-extrabold ${payoutColor}`}>${offer.payout.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === page ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}>
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
      </div>
    </AppLayout>
  );
}
