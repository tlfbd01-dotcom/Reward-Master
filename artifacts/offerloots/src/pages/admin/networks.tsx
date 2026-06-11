import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Plus, Link as LinkIcon, Edit, Key, RefreshCw, Check, X, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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

const defaultForm: FormData = {
  name: "", slug: "", logoUrl: "", secretKey: "",
  pullEnabled: false, apiKey: "", pubId: "", appId: "", pullUrl: "",
};

export default function AdminNetworks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [networks, setNetworks] = useState<Network[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);

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

  const setField = (k: keyof FormData, v: any) => setFormData(f => ({ ...f, [k]: v }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Offerwall Networks</h1>
            <p className="text-muted-foreground">Configure integrations and auto-pull settings for each network.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add Network
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading networks…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {networks.map((network) => (
              <Card key={network.id} className={!network.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">{network.name}</CardTitle>
                      <CardDescription className="font-mono text-xs mt-0.5">Slug: {network.slug}</CardDescription>
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
                  <div className="flex items-center gap-2">
                    {network.pullEnabled ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
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

                  <div className="space-y-2">
                    <Label className="text-xs">Postback URL</Label>
                    <div className="flex gap-2">
                      <Input value={network.postbackUrl} readOnly className="font-mono text-xs h-8 bg-muted/50" />
                      <Button size="sm" variant="secondary" className="h-8 shrink-0" onClick={() => {
                        navigator.clipboard.writeText(network.postbackUrl);
                        toast({ title: "Copied!" });
                      }}>
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(network)}>
                      <Edit className="w-4 h-4 mr-2" /> Configure
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNetwork ? `Configure — ${editingNetwork.name}` : "Add New Network"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Basic */}
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

              {formData.pullEnabled && (
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg border">
                  <div className="space-y-1.5">
                    <Label>API URL <span className="text-muted-foreground">(base URL, without params)</span></Label>
                    <Input
                      value={formData.pullUrl}
                      onChange={e => setField("pullUrl", e.target.value)}
                      placeholder="https://notik.me/api/v2/get-offers/all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>API Key <span className="text-destructive">*</span></Label>
                    <Input value={formData.apiKey} onChange={e => setField("apiKey", e.target.value)} placeholder="Your api_key" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Publisher ID <span className="text-muted-foreground">(pub_id)</span></Label>
                      <Input value={formData.pubId} onChange={e => setField("pubId", e.target.value)} placeholder="Your pub_id" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>App ID <span className="text-muted-foreground">(app_id)</span></Label>
                      <Input value={formData.appId} onChange={e => setField("appId", e.target.value)} placeholder="Your app_id" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The <code className="bg-muted px-1 rounded">[user_id]</code> macro in click URLs will be automatically replaced with <code className="bg-muted px-1 rounded">&#123;userid&#125;</code> during sync.
                  </p>
                </div>
              )}
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
    </AdminLayout>
  );
}
