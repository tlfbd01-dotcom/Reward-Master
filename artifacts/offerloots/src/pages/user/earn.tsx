import { AppLayout } from "@/components/layout/app-layout";
import { useGetOffers, useGetNetworks } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gamepad2, Search, Filter, Monitor, Smartphone, Globe } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce"; // We'll assume simple state for now

export default function Earn() {
  const [page, setPage] = useState(1);
  const [network, setNetwork] = useState<string>("all");
  const [device, setDevice] = useState<string>("all");

  const { data: networksData } = useGetNetworks();
  
  const queryParams: any = { page, limit: 24 };
  if (network !== "all") queryParams.network = network;
  if (device !== "all") queryParams.device = device;

  const { data: offersData, isLoading } = useGetOffers(queryParams);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Earn Cash</h1>
            <p className="text-muted-foreground">Complete offers to earn real money.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Network</label>
                <Select value={network} onValueChange={(val) => { setNetwork(val); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Networks" />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="All Devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="mobile">Mobile Only</SelectItem>
                    <SelectItem value="desktop">Desktop Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => { setNetwork("all"); setDevice("all"); setPage(1); }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse h-64 bg-muted/50" />
            ))}
          </div>
        ) : offersData?.data?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border">
            <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold">No offers found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more offers.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {offersData?.data.map((offer) => (
                <Link key={offer.id} href={`/earn/${offer.id}`}>
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group flex flex-col overflow-hidden">
                    <div className="aspect-video bg-muted/30 relative flex items-center justify-center p-4">
                      {offer.imageUrl ? (
                        <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                      ) : (
                        <Gamepad2 className="w-12 h-12 text-muted-foreground/30" />
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[10px]">
                          {offer.network}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        {offer.device === "mobile" && <Smartphone className="w-4 h-4 text-muted-foreground" />}
                        {offer.device === "desktop" && <Monitor className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold line-clamp-2 mb-2 flex-1 group-hover:text-primary transition-colors">{offer.name}</h3>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t">
                        <div className="text-xl font-bold text-primary">
                          ${offer.payout.toFixed(2)}
                        </div>
                        <Button size="sm" className="rounded-full">Start</Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            {/* Simple Pagination */}
            {offersData && offersData.total > offersData.limit && (
              <div className="flex justify-center gap-2 mt-8">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 font-medium">
                  Page {page} of {Math.ceil(offersData.total / offersData.limit)}
                </div>
                <Button 
                  variant="outline" 
                  disabled={page >= Math.ceil(offersData.total / offersData.limit)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}