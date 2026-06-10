import { AppLayout } from "@/components/layout/app-layout";
import { useGetOffer, getGetOfferQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Monitor, Smartphone, Globe, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function EarnDetail() {
  const { id } = useParams();
  const { data: offer, isLoading } = useGetOffer(Number(id), {
    query: {
      enabled: !!id,
      queryKey: getGetOfferQueryKey(Number(id))
    }
  });

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
          <Link href="/earn">
            <Button>Back to Offers</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

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
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-4xl font-display font-bold text-muted-foreground/30">{offer.name}</div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur font-bold px-3 py-1">
                    {offer.network}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">{offer.name}</h1>
                  <div className="text-3xl font-bold text-primary shrink-0">${offer.payout.toFixed(2)}</div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {offer.device === "mobile" ? <Smartphone className="w-3 h-3" /> : 
                     offer.device === "desktop" ? <Monitor className="w-3 h-3" /> : 
                     <Smartphone className="w-3 h-3" />}
                    <span className="capitalize">{offer.device}</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {offer.countries?.length ? offer.countries.join(", ") : "Global"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{offer.category}</Badge>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-lg border-b pb-2">Description & Requirements</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                    {offer.description || "No specific description provided. Follow the instructions on the offer page to receive your reward."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/50 shadow-lg shadow-primary/5">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4 text-center">Ready to earn?</h3>
                <div className="text-center text-4xl font-bold text-primary mb-6">
                  ${offer.payout.toFixed(2)}
                </div>
                
                <Button size="lg" className="w-full h-14 text-lg font-bold shadow-xl rounded-xl group" asChild>
                  <a href={offer.offerUrl || "#"} target="_blank" rel="noopener noreferrer">
                    Start Offer <ExternalLink className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Opens in a new tab. You will be redirected to our partner {offer.network}.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold mb-2">Important Rules</h3>
                
                <div className="flex gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">Complete the offer requirements exactly as stated.</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">Do not use VPNs or proxies. This will result in an immediate ban.</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">Rewards are usually credited within 5-15 minutes of completion.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}