import { PublicLayout } from "@/components/layout/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserPlus, Gamepad2, Wallet, Zap, ShieldCheck, Clock } from "lucide-react";

export default function HowItWorks() {
  return (
    <PublicLayout>
      <div className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">How OfferLoots Works</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We partner with market research companies and app developers who want real users. They pay us, we pay you. Simple.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <Card className="bg-card border-none shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <UserPlus className="w-24 h-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create an account in under 30 seconds. No credit card required, completely free to join.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-none shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Gamepad2 className="w-24 h-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Complete Offers</h3>
                <p className="text-muted-foreground">
                  Play mobile games, answer surveys, watch videos, or test new apps to earn cash rewards.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-none shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Wallet className="w-24 h-24" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Cash Out</h3>
                <p className="text-muted-foreground">
                  Withdraw your earnings instantly starting at just $5 via PayPal, Crypto, or Bank Transfer.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl font-display font-bold mb-6">Why choose OfferLoots?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Highest Payouts</h4>
                    <p className="text-muted-foreground">We give a larger percentage of offer revenue back to our users compared to competitors.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Instant Withdrawals</h4>
                    <p className="text-muted-foreground">No waiting days for your money. Most withdrawals are processed automatically within 5 minutes.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Trusted & Secure</h4>
                    <p className="text-muted-foreground">Your data is safe. We only partner with verified, legitimate research networks and providers.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left font-bold text-lg">Is it really free?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    Yes! OfferLoots is 100% free to join and use. You will never be asked to pay money to withdraw your earnings.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left font-bold text-lg">How long does it take to get paid?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    Offers usually credit to your balance within 5-15 minutes of completion. Once you reach $5, you can request a withdrawal which is typically processed within 5 minutes.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left font-bold text-lg">Why didn't an offer credit?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    Offers may not credit if you used a VPN/Proxy, didn't complete all the steps exactly as requested, or have completed the same offer on another platform before.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left font-bold text-lg">Can I use a VPN?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    No. The use of VPNs, Proxies, or Emulators is strictly prohibited and will result in an immediate and permanent account ban.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}