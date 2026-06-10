import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Coins, Gamepad2, Gift, ShieldCheck, Star, Users } from "lucide-react";
import { useGetFeaturedOffers } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: featuredOffers } = useGetFeaturedOffers();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24 pb-32">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 font-medium text-sm">
              <Star className="h-4 w-4 fill-primary" />
              <span>The highest-paying rewards platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 leading-tight">
              Turn your free time into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Real Cash</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
              Complete surveys, play games, and watch videos to earn money. 
              Withdraw instantly via PayPal, Crypto, or gift cards starting at just $5.00.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg h-14 px-8 rounded-full font-bold shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all">
                  Start Earning Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-it-works" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-lg h-14 px-8 rounded-full font-bold border-2 hover:bg-muted/50">
                  How it Works
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" /> Secure Payments
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-accent" /> High Payouts
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> 1M+ Users
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust Section */}
      <section className="py-20 bg-card border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">$4.2M+</div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Total Paid Out</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">5 mins</div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Average Cashout Time</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">10k+</div>
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
                These offers are verified to pay out fast. Jump in and start earning right away.
              </p>
            </div>
            <Link href="/earn" className="hidden md:block">
              <Button variant="ghost" className="font-semibold group">
                View All Offers <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredOffers?.slice(0, 4).map((offer) => (
              <div key={offer.id} className="group relative bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden flex items-center justify-center p-6">
                  {offer.imageUrl ? (
                    <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Gamepad2 className="w-16 h-16 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur font-bold">
                      {offer.network}
                    </Badge>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1 truncate">{offer.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {offer.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="font-bold text-xl text-primary">
                      ${offer.payout.toFixed(2)}
                    </div>
                    <Link href={`/login`}>
                      <Button size="sm" className="rounded-full font-bold">Earn</Button>
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
              Three simple steps to your first cashout. It's really that easy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-border -z-10" />
            
            <div className="relative text-center">
              <div className="w-24 h-24 mx-auto bg-background border-4 border-card rounded-full flex items-center justify-center mb-6 shadow-lg relative z-10">
                <span className="text-3xl font-display font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Sign Up Free</h3>
              <p className="text-muted-foreground">Create an account in seconds. No credit card required, ever.</p>
            </div>
            
            <div className="relative text-center">
              <div className="w-24 h-24 mx-auto bg-background border-4 border-card rounded-full flex items-center justify-center mb-6 shadow-lg relative z-10">
                <span className="text-3xl font-display font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Complete Tasks</h3>
              <p className="text-muted-foreground">Play games, answer surveys, or test apps from our partners.</p>
            </div>
            
            <div className="relative text-center">
              <div className="w-24 h-24 mx-auto bg-primary border-4 border-card rounded-full flex items-center justify-center mb-6 shadow-lg relative z-10">
                <Gift className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Get Paid</h3>
              <p className="text-muted-foreground">Withdraw your earnings instantly via crypto, PayPal, or gift cards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        {/* Abstract pattern */}
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
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-6 max-w-3xl mx-auto">
            Ready to start making money in your free time?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
            Join the fastest growing rewards platform today and get access to the highest paying offers on the web.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg h-14 px-10 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform text-primary">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}