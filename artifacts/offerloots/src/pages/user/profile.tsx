import { AppLayout } from "@/components/layout/app-layout";
import { useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, User, MailWarning, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile, isLoading } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();

  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const emailVerified = (user as any)?.emailVerified === true;

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setCountry(profile.country || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ data: { username, country } });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed", description: error.message || "Failed to update profile" });
    }
  };

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      const result = await customFetch<{ sent: boolean; verifyUrl?: string; alreadyVerified?: boolean; message: string }>(
        "/api/auth/send-verification",
        { method: "POST" }
      );
      if (result.alreadyVerified) {
        toast({ title: "Already verified", description: "Your email is already verified." });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      } else if (result.verifyUrl) {
        setVerifyUrl(result.verifyUrl);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err?.message ?? "Could not send verification." });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleCopyUrl = () => {
    if (verifyUrl) {
      navigator.clipboard.writeText(verifyUrl);
      toast({ title: "Copied!", description: "Verification link copied to clipboard." });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Verify URL Dialog */}
      <Dialog open={!!verifyUrl} onOpenChange={(open) => { if (!open) setVerifyUrl(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailWarning className="w-5 h-5 text-amber-400" /> Verification Link
            </DialogTitle>
            <DialogDescription>
              SMTP is not yet configured. Copy this link and open it in your browser to verify your email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex gap-2 items-start">
              <Input readOnly value={verifyUrl ?? ""} className="text-xs font-mono break-all" />
              <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopyUrl}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button className="w-full gap-2" asChild>
              <a href={verifyUrl ?? ""} target="_blank" rel="noopener noreferrer" onClick={() => setVerifyUrl(null)}>
                <ExternalLink className="w-4 h-4" /> Open Link to Verify
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-display font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mb-4 border-4 border-background shadow-xl">
                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <h3 className="font-bold text-xl">{profile?.username}</h3>
                <p className="text-muted-foreground text-sm mb-4">{profile?.email}</p>
                <div className="w-full pt-4 border-t flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-medium">{profile ? new Date(profile.createdAt).toLocaleDateString() : ""}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email</span>
                  {emailVerified ? (
                    <span className="flex items-center gap-1 text-green-500 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-xs">Unverified</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-green-500 font-medium">Active</span>
                </div>

                {!emailVerified && (
                  <div className="pt-2 border-t space-y-2">
                    <p className="text-xs text-muted-foreground leading-snug">
                      Verify your email to enable withdrawals.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-xs border-amber-500/40 text-amber-400 hover:text-amber-300 hover:border-amber-400/60"
                      onClick={handleSendVerification}
                      disabled={sendingVerification}
                    >
                      {sendingVerification
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <MailWarning className="w-3.5 h-3.5" />}
                      Send Verification Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Update your public facing information.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={profile?.email || ""} disabled className="bg-muted/50" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">🇺🇸 United States</SelectItem>
                        <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                        <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                        <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                        <SelectItem value="FR">🇫🇷 France</SelectItem>
                        <SelectItem value="IN">🇮🇳 India</SelectItem>
                        <SelectItem value="BR">🇧🇷 Brazil</SelectItem>
                        <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                        <SelectItem value="PH">🇵🇭 Philippines</SelectItem>
                        <SelectItem value="PK">🇵🇰 Pakistan</SelectItem>
                        <SelectItem value="BD">🇧🇩 Bangladesh</SelectItem>
                        <SelectItem value="ID">🇮🇩 Indonesia</SelectItem>
                        <SelectItem value="MX">🇲🇽 Mexico</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
