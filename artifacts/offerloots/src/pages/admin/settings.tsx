import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { customFetch } from "@workspace/api-client-react/custom-fetch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mail, Server, Save, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

type MailSettings = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
  requireEmailVerification: boolean;
};

const defaults: MailSettings = {
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  fromName: "OfferLoots",
  fromEmail: "noreply@offerloots.com",
  requireEmailVerification: false,
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MailSettings>(defaults);

  useEffect(() => {
    customFetch<MailSettings>("/api/admin/mail-settings")
      .then(data => setForm({ ...defaults, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof MailSettings, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await customFetch<{ success: boolean; message: string }>("/api/admin/mail-settings", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast({ title: "Settings saved", description: "Mail server configuration updated successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: err?.message ?? "Could not save settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure platform settings and mail server.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Verification Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Withdrawal Security
                </CardTitle>
                <CardDescription>Control user requirements before allowing withdrawals.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                  <div>
                    <p className="font-semibold text-sm">Require Email Verification</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Users must verify their email address before they can request a withdrawal.
                    </p>
                  </div>
                  <Switch
                    checked={form.requireEmailVerification}
                    onCheckedChange={(val) => handleChange("requireEmailVerification", val)}
                  />
                </div>
                {form.requireEmailVerification && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Ensure the SMTP server below is configured so users can receive verification emails.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SMTP Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  Mail Server (SMTP)
                </CardTitle>
                <CardDescription>
                  Configure the SMTP server for sending verification emails, withdrawal notifications, and password resets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>SMTP Host</Label>
                    <Input
                      placeholder="smtp.gmail.com"
                      value={form.smtpHost}
                      onChange={(e) => handleChange("smtpHost", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SMTP Port</Label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={form.smtpPort}
                      onChange={(e) => handleChange("smtpPort", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>SMTP Username</Label>
                    <Input
                      placeholder="your@email.com"
                      value={form.smtpUser}
                      onChange={(e) => handleChange("smtpUser", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SMTP Password</Label>
                    <Input
                      type="password"
                      placeholder="App password or SMTP key"
                      value={form.smtpPass}
                      onChange={(e) => handleChange("smtpPass", e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Sender Info</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>From Name</Label>
                      <Input
                        placeholder="OfferLoots"
                        value={form.fromName}
                        onChange={(e) => handleChange("fromName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>From Email</Label>
                      <Input
                        type="email"
                        placeholder="noreply@offerloots.com"
                        value={form.fromEmail}
                        onChange={(e) => handleChange("fromEmail", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground bg-muted/20 border rounded-lg px-3 py-2.5">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-primary" />
                  Supports any SMTP-compatible provider: Gmail (App Password), Mailgun, SendGrid, Postmark, Amazon SES, etc.
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" className="gap-2 font-bold px-8" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
