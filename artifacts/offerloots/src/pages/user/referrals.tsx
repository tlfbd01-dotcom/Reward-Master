import { AppLayout } from "@/components/layout/app-layout";
import { useGetUserProfile, useGetUserReferrals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, Gift, TrendingUp, Loader2 } from "lucide-react";
import { useState } from "react";

export default function Referrals() {
  const { toast } = useToast();
  const { data: profile } = useGetUserProfile();
  const { data: referrals, isLoading } = useGetUserReferrals();
  const [copied, setCopied] = useState(false);

  // Construct referral link based on current domain
  const referralLink = profile ? `${window.location.origin}/register?ref=${profile.referralCode}` : "";

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral link copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Invite friends and earn 5% of all their earnings for life.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-primary text-primary-foreground lg:col-span-3 overflow-hidden relative">
            {/* Background patterns */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
            <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="text-3xl font-display font-bold mb-4">Earn Passive Income</h2>
                <p className="text-primary-foreground/90 text-lg mb-6">
                  Share your unique link. When someone signs up, you get a <span className="font-bold underline decoration-accent decoration-2 underline-offset-4">5% bonus</span> on every offer they complete, forever.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                  <div className="relative w-full">
                    <Input 
                      value={referralLink} 
                      readOnly 
                      className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground h-12 pr-24 font-mono font-medium"
                    />
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="absolute right-1.5 top-1.5 text-primary hover:bg-white"
                      onClick={handleCopy}
                    >
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="w-32 h-32 md:w-48 md:h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                <Gift className="w-16 h-16 md:w-24 md:h-24 text-accent drop-shadow-lg" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-display font-bold">{profile?.totalReferrals || 0}</div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Referral Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-display font-bold text-primary">$0.00</div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bonus Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-display font-bold text-accent">5%</div>
                <div className="p-3 bg-accent/10 rounded-full">
                  <Gift className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Invited Users</CardTitle>
            <CardDescription>Users who signed up using your link.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : referrals && referrals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3 text-right">Generated For You</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">
                          {ref.username.substring(0, 3)}***{ref.username.substring(ref.username.length - 2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(ref.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary">
                          ${ref.totalEarnings.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-medium">You haven't referred anyone yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Share your link to start earning passive income.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}