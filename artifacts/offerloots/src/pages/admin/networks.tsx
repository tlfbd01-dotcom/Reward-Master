import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminNetworks, useCreateAdminNetwork, useUpdateAdminNetwork } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Plus, Link as LinkIcon, Edit, Key } from "lucide-react";
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

export default function AdminNetworks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: networks, isLoading } = useGetAdminNetworks();
  const createNetwork = useCreateAdminNetwork();
  const updateNetwork = useUpdateAdminNetwork();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", secretKey: "" });

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await updateNetwork.mutateAsync({ id, data: { isActive: !currentActive } });
      toast({ title: "Network status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/networks"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const openCreateModal = () => {
    setEditingNetwork(null);
    setFormData({ name: "", slug: "", secretKey: "" });
    setModalOpen(true);
  };

  const openEditModal = (network: any) => {
    setEditingNetwork(network);
    setFormData({ name: network.name, slug: network.slug, secretKey: network.secretKey || "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNetwork) {
        await updateNetwork.mutateAsync({ 
          id: editingNetwork.id, 
          data: { name: formData.name, secretKey: formData.secretKey } 
        });
        toast({ title: "Network updated" });
      } else {
        await createNetwork.mutateAsync({ data: formData });
        toast({ title: "Network created" });
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/networks"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Offerwall Networks</h1>
            <p className="text-muted-foreground">Configure integrations with 3rd party offer providers.</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" /> Add Network
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">Loading networks...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {networks?.map((network) => (
              <Card key={network.id} className={!network.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">{network.name}</CardTitle>
                    <Switch 
                      checked={network.isActive} 
                      onCheckedChange={() => handleToggleActive(network.id, network.isActive)}
                    />
                  </div>
                  <CardDescription className="font-mono text-xs mt-1">Slug: {network.slug}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 py-2 border-y">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Conversions</div>
                      <div className="font-bold text-lg">{network.totalConversions}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Revenue</div>
                      <div className="font-bold text-lg text-primary">${network.totalRevenue.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Postback URL (Give this to {network.name})</Label>
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

                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => openEditModal(network)}>
                      <Edit className="w-4 h-4 mr-2" /> Configure Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNetwork ? `Edit ${editingNetwork.name}` : 'Add New Network'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Network Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            {!editingNetwork && (
              <div className="space-y-2">
                <Label>Slug (Internal ID, lowercase, no spaces)</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required pattern="^[a-z0-9-]+$" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Key className="w-4 h-4" /> Secret Key / Hash Key (Optional)</Label>
              <Input value={formData.secretKey} onChange={(e) => setFormData({...formData, secretKey: e.target.value})} placeholder="Used for postback signature verification" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createNetwork.isPending || updateNetwork.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}