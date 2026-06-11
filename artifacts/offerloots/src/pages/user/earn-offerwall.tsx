import { AppLayout } from "@/components/layout/app-layout";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, TrendingUp, Star, X, Loader2, Zap } from "lucide-react";
import { useState, useEffect } from "react";

type Wall = {
  id: number; name: string; slug: string; logoUrl: string | null;
  rating: number; description: string; isActive: boolean;
  iframeUrl: string | null; totalConversions: number; totalRevenue: number;
};

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
          {wall.logoUrl
            ? <img src={wall.logoUrl} alt={wall.name} className="w-full h-full object-contain" />
            : <span className="text-3xl font-bold text-white">{wall.name[0]}</span>}
        </div>
        <h3 className="font-bold text-white text-lg text-center drop-shadow">{wall.name}</h3>
        <StarRating rating={wall.rating} />
      </div>
      <CardContent className="p-4 space-y-3 bg-card">
        {wall.description && <p className="text-sm text-muted-foreground line-clamp-2">{wall.description}</p>}
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

function WallIframeModal({ wall, onClose }: { wall: Wall; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {wall.logoUrl
            ? <img src={wall.logoUrl} alt={wall.name} className="w-full h-full object-contain" />
            : <span className="text-sm font-bold text-primary">{wall.name[0]}</span>}
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

export default function EarnOfferwall() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWall, setActiveWall] = useState<Wall | null>(null);

  useEffect(() => {
    customFetch<Wall[]>("/api/walls")
      .then(setWalls)
      .catch(() => setWalls([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      {activeWall && <WallIframeModal wall={activeWall} onClose={() => setActiveWall(null)} />}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Offerwall</h1>
          <p className="text-muted-foreground">Open a network and complete offers directly inside the wall to earn cash.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
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
      </div>
    </AppLayout>
  );
}
