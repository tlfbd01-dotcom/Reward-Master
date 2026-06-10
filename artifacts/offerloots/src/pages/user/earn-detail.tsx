import { AppLayout } from "@/components/layout/app-layout";
import { useGetOffer, getGetOfferQueryKey } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Monitor, Smartphone, Globe, ExternalLink, ShieldCheck, CheckCircle2, Layers, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type OfferEvent = { name: string; payout: number; eventId?: string };

export default function EarnDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [clicking, setClicking] = useState(false);

  const { data: offer, isLoading } = useGetOffer(Number(id), {
    query: { enabled: !!id, queryKey: getGetOfferQueryKey(Number(id)) }
  });

  const handleStart = async () => {
    if (!offer) return;
    setClicking(true);
    try {
      const result = await customFetch<{ url: string | null }>(`/api/offers/${offer.id}/click`);
      const url = result.url ?? (offer as any).offerUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast({ title: "No offer URL configured", description: "Contact support if this is an error." });
    } catch {
      const fallback = (offer as any).offerUrl;
      if (fallback) window.open(fallback, "_blank", "noopener,noreferrer");
    } finally {
      setClicking(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!offer) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Offer not found</h2>
          <Link href="/earn"><Button>Back to Offers</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const events: OfferEvent[] = (offer as any).events ?? [];
  const hasEvents = events.length > 0;
  const totalPayout = hasEvents
    ? events.reduce((s, e) => s + e.payout, 0)
    : offer.payout;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/earn">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Offers
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="h-48 md:h-64 bg-muted/30 p-8 flex items-center justify-center relative">
                {(offer as any).imageUrl ? (
                  <img src={(offer as any).imageUrl} alt={offer.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-4xl font-display font-bold text-muted-foreground/30">{offer.name}</div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur font-bold px-3 py-1">
                    {offer.network}
                  </Badge>
                  {hasEvents && (
                    <Badge variant="outline" className="bg-background/90 backdrop-blur border-primary/50 text-primary">
                      <Layers className="w-3 h-3 mr-1" /> {events.length} events
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">{offer.name}</h1>
                  <div className="text-3xl font-bold text-primary shrink-0">${totalPayout.toFixed(2)}</div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {(offer as any).device === "mobile" ? <Smartphone className="w-3 h-3" /> :
                     (offer as any).device === "desktop" ? <Monitor className="w-3 h-3" /> :
                     <Globe className="w-3 h-3" />}
                    <span className="capitalize">{(offer as any).device || "all"}</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {(offer as any).countries?.length ? (offer as any).countries.join(", ") : "Global"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{offer.category}</Badge>
                </div>

                {/* Multi-event section */}
                {hasEvents && (
                  <div className="mb-6">
                    <h3 className="font-bold text-lg border-b pb-2 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" /> Completion Events & Rewards
                    </h3>
                    <div className="space-y-2">
                      {events.map((ev, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {i + 1}
                          </div>
                          <span className="flex-1 text-sm font-medium">{ev.name}</span>
                          <div className="flex items-center gap-1 text-primary font-bold">
                            <DollarSign className="w-3.5 h-3.5" />
                            {ev.payout.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 px-3 font-bold text-sm">
                        <span>Total Reward</span>
                        <span className="text-primary text-base">${totalPayout.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-bold text-lg border-b pb-2">Description & Requirements</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {(offer as any).description || "No specific description provided. Follow the instructions on the offer page to receive your reward."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/50 shadow-lg shadow-primary/5 sticky top-4">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4 text-center">Ready to earn?</h3>
                <div className="text-center mb-2">
                  <div className="text-4xl font-bold text-primary">${totalPayout.toFixed(2)}</div>
                  {hasEvents && <p className="text-xs text-muted-foreground mt-1">across {events.length} events</p>}
                </div>

                {hasEvents && (
                  <div className="my-4 space-y-1.5">
                    {events.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-1.5">
                        <span className="text-muted-foreground text-xs line-clamp-1">{ev.name}</span>
                        <span className="font-bold text-primary text-xs shrink-0 ml-2">${ev.payout.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full h-12 text-base font-bold shadow-xl rounded-xl group mt-4"
                  onClick={handleStart}
                  disabled={clicking}
                >
                  {clicking ? "Opening..." : "Start Offer"}
                  <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Opens in a new tab via {offer.network}.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold mb-1">Important Rules</h3>
                <div className="flex gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-xs">Complete all offer requirements exactly as stated.</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-xs">Do not use VPNs or proxies — this will result in a ban.</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-xs">Rewards credit within 5–15 minutes of completion.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
