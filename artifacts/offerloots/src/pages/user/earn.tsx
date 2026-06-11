import { AppLayout } from "@/components/layout/app-layout";
import { useGetOffers, useGetNetworks } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Monitor, Smartphone, Star, TrendingUp, Layers, X, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

type Wall = {
  id: number; name: string; slug: string; logoUrl: string | null;
  rating: number; description: string; isActive: boolean;
  iframeUrl: string | null; totalConversions: number; totalRevenue: number;
};

type OfferEvent = { name: string; payout: number; eventId?: string };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function WallCard({ wall, onOpen }: { wall: Wall; onOpen: (w: Wall) => void }) {
  return (
    <Card
      className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
      onClick={() => onOpen(wall)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-primary/50 transition-all">
            {wall.logoUrl ? (
              <img src={wall.logoUrl} alt={wall.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-primary">{wall.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base mb-1">{wall.name}</h3>
            <StarRating rating={wall.rating} />
            {wall.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{wall.description}</p>
            )}
            <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {wall.totalConversions} rewards</span>
            </div>
          </div>
          <Button size="sm" className="shrink-0 rounded-full font-bold" onClick={(e) => { e.stopPropagation(); onOpen(wall); }}>
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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

export default function Earn() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [network, setNetwork] = useState<string>("all");
  const [device, setDevice] = useState<string>("all");
  const [walls, setWalls] = useState<Wall[]>([]);
  const [wallsLoading, setWallsLoading] = useState(true);
  const [activeWall, setActiveWall] = useState<Wall | null>(null);

  const { data: networksData } = useGetNetworks();
  const queryParams: any = { page, limit: 24 };
  if (network !== "all") queryParams.network = network;
  if (device !== "all") queryParams.device = device;
  const { data: offersData, isLoading } = useGetOffers(queryParams);

  useEffect(() => {
    customFetch<Wall[]>("/api/walls")
      .then(setWalls)
      .catch(() => setWalls([]))
      .finally(() => setWallsLoading(false));
  }, []);

  const handleOfferClick = async (offerId: number, offerUrl: string | null) => {
    try {
      const result = await customFetch<{ url: string | null }>(`/api/offers/${offerId}/click`);
      const url = result.url ?? offerUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast({ title: "No offer URL configured" });
    } catch {
      if (offerUrl) window.open(offerUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <AppLayout>
      {activeWall && <WallIframeModal wall={activeWall} onClose={() => setActiveWall(null)} />}
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
                <p className="text-muted-foreground">Check back soon for offerwall integrations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {walls.map((w) => (
                  <WallCard key={w.id} wall={w} onOpen={setActiveWall} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* INDIVIDUAL OFFERS TAB */}
          <TabsContent value="offers" className="mt-6 space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Network</label>
                    <Select value={network} onValueChange={(val) => { setNetwork(val); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="All Networks" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Networks</SelectItem>
                        {networksData?.map((n) => (
                          <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Device</label>
                    <Select value={device} onValueChange={(val) => { setDevice(val); setPage(1); }}>
                      <SelectTrigger><SelectValue placeholder="All Devices" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Devices</SelectItem>
                        <SelectItem value="mobile">Mobile Only</SelectItem>
                        <SelectItem value="desktop">Desktop Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full" onClick={() => { setNetwork("all"); setDevice("all"); setPage(1); }}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <Card key={i} className="animate-pulse h-64 bg-muted/50" />)}
              </div>
            ) : offersData?.data?.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border">
                <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold">No offers found</h3>
                <p className="text-muted-foreground">Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {offersData?.data.map((offer: any) => {
                    const hasEvents = offer.events && offer.events.length > 0;
                    return (
                      <Card key={offer.id} className="hover:shadow-md transition-all hover:border-primary/50 group flex flex-col overflow-hidden">
                        <Link href={`/earn/${offer.id}`} className="flex-1 flex flex-col">
                          <div className="aspect-video bg-muted/30 relative flex items-center justify-center p-2">
                            {offer.imageUrl ? (
                              <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                            ) : (
                              <Gamepad2 className="w-8 h-8 text-muted-foreground/30" />
                            )}
                            <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                              <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[9px] px-1 py-0">{offer.network}</Badge>
                              {hasEvents && (
                                <Badge variant="outline" className="bg-background/80 backdrop-blur text-[9px] px-1 py-0 border-primary/50 text-primary">
                                  {offer.events.length} events
                                </Badge>
                              )}
                            </div>
                            <div className="absolute bottom-1 right-1">
                              {offer.device === "mobile" && <Smartphone className="w-3 h-3 text-muted-foreground" />}
                              {offer.device === "desktop" && <Monitor className="w-3 h-3 text-muted-foreground" />}
                            </div>
                          </div>
                          <CardContent className="p-2.5 flex-1 flex flex-col">
                            <h3 className="font-semibold line-clamp-2 mb-1.5 flex-1 group-hover:text-primary transition-colors text-xs leading-tight">{offer.name}</h3>
                            {hasEvents && (
                              <div className="mb-1.5 space-y-0.5">
                                {offer.events.slice(0, 2).map((ev: OfferEvent, i: number) => (
                                  <div key={i} className="flex items-center justify-between text-[10px]">
                                    <span className="text-muted-foreground line-clamp-1">{ev.name}</span>
                                    <span className="font-bold text-primary shrink-0 ml-1">${ev.payout.toFixed(2)}</span>
                                  </div>
                                ))}
                                {offer.events.length > 2 && (
                                  <p className="text-[10px] text-muted-foreground">+{offer.events.length - 2} more</p>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-auto pt-2 border-t">
                              <div className="text-sm font-bold text-primary">${offer.payout.toFixed(2)}</div>
                              {hasEvents && <div className="text-[10px] text-muted-foreground">total</div>}
                            </div>
                          </CardContent>
                        </Link>
                        <div className="px-2.5 pb-2.5">
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs rounded-full font-bold gap-1"
                            onClick={() => handleOfferClick(offer.id, offer.offerUrl)}
                          >
                            Start <ExternalLink className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {offersData && offersData.total > offersData.limit && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <div className="flex items-center px-4 font-medium">
                      Page {page} of {Math.ceil(offersData.total / offersData.limit)}
                    </div>
                    <Button variant="outline" disabled={page >= Math.ceil(offersData.total / offersData.limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
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
