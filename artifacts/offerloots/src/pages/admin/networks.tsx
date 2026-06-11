import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Plus, Link as LinkIcon, Edit, Key, RefreshCw, Check, X, Loader2, Zap, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

type Network = {
  id: number; name: string; slug: string; logoUrl: string | null;
  isActive: boolean; postbackUrl: string; secretKey: string | null;
  pullEnabled: boolean; apiKey: string | null; pubId: string | null;
  appId: string | null; pullUrl: string | null;
  lastSyncedAt: string | null; syncedOfferCount: number;
  totalConversions: number; totalRevenue: number;
};

type FormData = {
  name: string; slug: string; logoUrl: string; secretKey: string;
  pullEnabled: boolean; apiKey: string; pubId: string; appId: string; pullUrl: string;
};

type TestPostbackForm = {
  networkSlug: string; userId: string; txid: string; amount: string; status: string;
};

const defaultForm: FormData = {
  name: "", slug: "", logoUrl: "", secretKey: "",
  pullEnabled: false, apiKey: "", pubId: "", appId: "", pullUrl: "",
};

const defaultTestForm: TestPostbackForm = {
  networkSlug: "", userId: "", txid: "", amount: "", status: "approved",
};

export default function AdminNetworks() {
  const { toast } = useToast();

  const [networks, setNetworks] = useState<Network[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // Test postback state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testForm, setTestForm] = useState<TestPostbackForm>(defaultTestForm);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Postback URL expand state per card
  const [expandedPostback, setExpandedPostback] = useState<number | null>(null);

  const loadNetworks = async () => {
    setIsLoading(true);
    try {
      const data = await customFetch<Network[]>("/api/admin/networks");
      setNetworks(data);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to load networks", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  useState(() => { void loadNetworks(); });

  const handleToggleActive = async (id: number, current: boolean) => {
    try {
      await customFetch<Network>(`/api/admin/networks/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: !current }) });
      toast({ title: "Status updated" });
      void loadNetworks();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const openCreate = () => {
    setEditingNetwork(null);
    setFormData(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (n: Network) => {
    setEditingNetwork(n);
    setFormData({
      name: n.name, slug: n.slug, logoUrl: n.logoUrl ?? "", secretKey: n.secretKey ?? "",
      pullEnabled: n.pullEnabled, apiKey: n.apiKey ?? "", pubId: n.pubId ?? "",
      appId: n.appId ?? "", pullUrl: n.pullUrl ?? "",
    });
    setModalOpen(true);
  };

  const openTestPostback = (n?: Network) => {
    setTestResult(null);
    setTestForm({
      networkSlug: n?.slug ?? (networks[0]?.slug ?? ""),
      userId: "",
      txid: `test-${Date.now()}`,
      amount: "0.50",
      status: "approved",
    });
    setTestModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body: Record<string, any> = {
      name: formData.name,
      logoUrl: formData.logoUrl || null,
      secretKey: formData.secretKey || null,
      pullEnabled: formData.pullEnabled,
      apiKey: formData.apiKey || null,
      pubId: formData.pubId || null,
      appId: formData.appId || null,
      pullUrl: formData.pullUrl || null,
    };
    if (!editingNetwork) body.slug = formData.slug;

    try {
      if (editingNetwork) {
        await customFetch<Network>(`/api/admin/networks/${editingNetwork.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast({ title: "Network updated" });
      } else {
        await customFetch<Network>("/api/admin/networks", { method: "POST", body: JSON.stringify(body) });
        toast({ title: "Network created" });
      }
      setModalOpen(false);
      void loadNetworks();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (n: Network) => {
    setSyncingId(n.id);
    try {
      const result = await customFetch<{ ok: boolean; added: number; updated: number; total: number }>(
        `/api/admin/networks/${n.id}/sync`, { method: "POST" }
      );
      toast({ title: `Sync complete — ${result.added} added, ${result.updated} updated (${result.total} total)` });
      void loadNetworks();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync failed", description: e.message });
    } finally {
      setSyncingId(null);
    }
  };

  const handleTestPostback = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSending(true);
    setTestResult(null);
    const { networkSlug, userId, txid, amount, status } = testForm;
    const url = `/api/postback?network=${encodeURIComponent(networkSlug)}&subid=${encodeURIComponent(userId)}&txid=${encodeURIComponent(txid)}&amount=${encodeURIComponent(amount)}&status=${encodeURIComponent(status)}`;
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      if (resp.ok) {
        setTestResult({ ok: true, message: `Success (HTTP ${resp.status}): ${text}` });
        toast({ title: "Postback delivered successfully" });
        void loadNetworks();
      } else {
        setTestResult({ ok: false, message: `HTTP ${resp.status}: ${text}` });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
    } finally {
      setTestSending(false);
    }
  };

  const copyPostbackUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied to clipboard!" });
  };

  const setField = (k: keyof FormData, v: any) => setFormData(f => ({ ...f, [k]: v }));
  const setTestField = (k: keyof TestPostbackForm, v: string) => setTestForm(f => ({ ...f, [k]: v }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h1 className="text-3xl font-display font-bold">Offerwall Networks</h1>
            <p className="text-muted-foreground">Configure integrations, auto-pull settings, and test postbacks.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openTestPostback()}>
              <Zap className="w-4 h-4 mr-2" /> Test Postback
            </Button>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Add Network
            </Button>
          </div>
        </div>

        {/* Postback URL Format Guide */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              Default Postback URL Format
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-mono text-xs bg-background rounded-lg p-3 border border-border break-all select-all">
              {window.location.origin}/api/postback?network=<span className="text-primary font-bold">{"{network_slug}"}</span>&subid=<span className="text-primary font-bold">{"{user_id}"}</span>&amount=<span className="text-primary font-bold">{"{payout}"}</span>&txid=<span className="text-primary font-bold">{"{txid}"}</span>&status=<span className="text-primary font-bold">approved</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
              <div><span className="text-primary font-semibold">network</span> — network slug</div>
              <div><span className="text-primary font-semibold">subid</span> — user ID</div>
              <div><span className="text-primary font-semibold">amount</span> — payout in USD</div>
              <div><span className="text-primary font-semibold">txid</span> — unique transaction ID</div>
              <div><span className="text-primary font-semibold">status</span> — approved / 1 / 2</div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading networks…
          </div>
        ) : networks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-semibold mb-1">No networks yet</p>
              <p className="text-sm mb-4">Add your first offerwall network to get started.</p>
              <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Network</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {networks.map((network) => (
              <Card key={network.id} className={!network.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">{network.name}</CardTitle>
                      <CardDescription className="font-mono text-xs mt-0.5">slug: {network.slug}</CardDescription>
                    </div>
                    <Switch checked={network.isActive} onCheckedChange={() => handleToggleActive(network.id, network.isActive)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 py-2 border-y">
                    <div>
                      <div className="text-xs text-muted-foreground">Conversions</div>
                      <div className="font-bold text-lg">{network.totalConversions}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                      <div className="font-bold text-lg text-primary">${network.totalRevenue.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Auto-Pull Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {network.pullEnabled ? (
                      <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
                        <Check className="w-3 h-3" /> Auto-Pull On
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <X className="w-3 h-3" /> Auto-Pull Off
                      </Badge>
                    )}
                    {network.lastSyncedAt && (
                      <span className="text-xs text-muted-foreground">
                        {network.syncedOfferCount} offers synced
                      </span>
                    )}
                  </div>

                  {network.lastSyncedAt && (
                    <div className="text-xs text-muted-foreground">
                      Last sync: {new Date(network.lastSyncedAt).toLocaleString()}
                    </div>
                  )}

                  {/* Postback URL */}
                  <div className="space-y-1.5">
                    <button
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setExpandedPostback(expandedPostback === network.id ? null : network.id)}
                    >
                      <LinkIcon className="w-3 h-3" />
                      Postback URL
                      {expandedPostback === network.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {expandedPostback === network.id && (
                      <div className="flex gap-2">
                        <Input value={network.postbackUrl} readOnly className="font-mono text-xs h-8 bg-muted/50" />
                        <Button size="sm" variant="secondary" className="h-8 shrink-0" onClick={() => copyPostbackUrl(network.postbackUrl)}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(network)}>
                      <Edit className="w-4 h-4 mr-1.5" /> Configure
                    </Button>
                    <Button variant="outline" size="sm" className="shrink-0 text-primary border-primary/30 hover:bg-primary/10" onClick={() => openTestPostback(network)}>
                      <Zap className="w-4 h-4" />
                    </Button>
                    {network.pullEnabled && (
                      <Button variant="secondary" size="sm" className="shrink-0" onClick={() => handleSync(network)} disabled={syncingId === network.id}>
                        {syncingId === network.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Configure / Add Network Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNetwork ? `Configure — ${editingNetwork.name}` : "Add New Network"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Network Name</Label>
                <Input value={formData.name} onChange={e => setField("name", e.target.value)} required />
              </div>
              {!editingNetwork && (
                <div className="space-y-1.5">
                  <Label>Slug <span className="text-muted-foreground">(lowercase, no spaces)</span></Label>
                  <Input value={formData.slug} onChange={e => setField("slug", e.target.value)} required pattern="^[a-z0-9-]+" placeholder="e.g. notik" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Logo URL <span className="text-muted-foreground">(optional)</span></Label>
                <Input value={formData.logoUrl} onChange={e => setField("logoUrl", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2"><Key className="w-4 h-4" /> Postback Secret Key <span className="text-muted-foreground">(optional)</span></Label>
                <Input value={formData.secretKey} onChange={e => setField("secretKey", e.target.value)} placeholder="For postback signature verification" />
              </div>
            </div>

            <Separator />

            {/* Auto-Pull */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Auto-Pull Offers</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatically fetch offers from this network's API every 15 minutes.</p>
                </div>
                <Switch checked={formData.pullEnabled} onCheckedChange={v => setField("pullEnabled", v)} />
              </div>

              <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                <div className="space-y-1.5">
                  <Label>
                    API URL <span className="text-muted-foreground text-xs">(leave blank for Notik default)</span>
                  </Label>
                  <Input
                    value={formData.pullUrl}
                    onChange={e => setField("pullUrl", e.target.value)}
                    placeholder="https://notik.me/api/v2/get-offers/all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>API Key <span className="text-muted-foreground text-xs">(api_key)</span></Label>
                  <Input value={formData.apiKey} onChange={e => setField("apiKey", e.target.value)} placeholder="Your api_key" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Publisher ID <span className="text-muted-foreground text-xs">(pub_id)</span></Label>
                    <Input value={formData.pubId} onChange={e => setField("pubId", e.target.value)} placeholder="Your pub_id" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>App ID <span className="text-muted-foreground text-xs">(app_id)</span></Label>
                    <Input value={formData.appId} onChange={e => setField("appId", e.target.value)} placeholder="Your app_id" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The <code className="bg-muted px-1 rounded">[user_id]</code> macro in click URLs is automatically replaced with <code className="bg-muted px-1 rounded">&#123;userid&#125;</code> during sync.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Test Postback Modal */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Test Postback
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTestPostback} className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Send a test conversion postback to verify your setup. This will credit the user's balance.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Network <span className="text-destructive">*</span></Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={testForm.networkSlug}
                  onChange={e => setTestField("networkSlug", e.target.value)}
                  required
                >
                  <option value="">Select network…</option>
                  {networks.map(n => (
                    <option key={n.id} value={n.slug}>{n.name} ({n.slug})</option>
                  ))}
                  <option value="__custom">Custom slug…</option>
                </select>
                {testForm.networkSlug === "__custom" && (
                  <Input
                    placeholder="Enter network slug manually"
                    onChange={e => setTestField("networkSlug", e.target.value || "__custom")}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label>User ID <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  placeholder="e.g. 1"
                  value={testForm.userId}
                  onChange={e => setTestField("userId", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Transaction ID <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Unique txid"
                    value={testForm.txid}
                    onChange={e => setTestField("txid", e.target.value)}
                    required
                  />
                  <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setTestField("txid", `test-${Date.now()}`)}>
                    New
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount (USD) <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.50"
                    value={testForm.amount}
                    onChange={e => setTestField("amount", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={testForm.status}
                    onChange={e => setTestField("status", e.target.value)}
                  >
                    <option value="approved">approved</option>
                    <option value="1">1 (approved)</option>
                    <option value="2">2 (approved)</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Generated URL preview */}
            {testForm.networkSlug && testForm.userId && testForm.txid && testForm.amount && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Generated URL</Label>
                <div className="font-mono text-xs bg-muted/50 rounded-md p-2 border break-all">
                  /api/postback?network={testForm.networkSlug}&subid={testForm.userId}&amount={testForm.amount}&txid={testForm.txid}&status={testForm.status}
                </div>
              </div>
            )}

            {testResult && (
              <div className={`p-3 rounded-lg text-sm font-mono border ${testResult.ok ? "bg-primary/10 border-primary/30 text-primary" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
                {testResult.ok ? <Check className="w-4 h-4 inline mr-2" /> : <X className="w-4 h-4 inline mr-2" />}
                {testResult.message}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTestModalOpen(false)}>Close</Button>
              <Button type="submit" disabled={testSending}>
                {testSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Send Postback
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
