import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Plus, Edit, Trash2, GripVertical, ExternalLink, Star, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { customFetch } from "@workspace/api-client-react/custom-fetch";

type Wall = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  urlTemplate: string;
  placementId: string;
  rating: number;
  description: string;
  isActive: boolean;
  sortOrder: number;
  totalConversions: number;
  totalRevenue: number;
};

const EMPTY_FORM = {
  name: "", slug: "", logoUrl: "", urlTemplate: "", placementId: "",
  rating: "4.5", description: "", isActive: true, sortOrder: "0",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AdminWalls() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [walls, setWalls] = useState<Wall[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingWall, setEditingWall] = useState<Wall | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = async () => {
    setLoading(true);
    try {
      const data = await customFetch<Wall[]>("/api/admin/walls");
      setWalls(data);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useState(() => { load(); });

  const openCreate = () => {
    setEditingWall(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (w: Wall) => {
    setEditingWall(w);
    setForm({
      name: w.name, slug: w.slug, logoUrl: w.logoUrl ?? "",
      urlTemplate: w.urlTemplate, placementId: w.placementId,
      rating: String(w.rating), description: w.description,
      isActive: w.isActive, sortOrder: String(w.sortOrder),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.urlTemplate || !form.placementId) {
      toast({ variant: "destructive", title: "Required fields missing" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        logoUrl: form.logoUrl || null,
        urlTemplate: form.urlTemplate,
        placementId: form.placementId,
        rating: parseFloat(form.rating),
        description: form.description,
        isActive: form.isActive,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };
      if (editingWall) {
        await customFetch(`/api/admin/walls/${editingWall.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast({ title: "Wall updated" });
      } else {
        await customFetch("/api/admin/walls", { method: "POST", body: JSON.stringify(payload) });
        toast({ title: "Wall created" });
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await customFetch(`/api/admin/walls/${deleteId}`, { method: "DELETE" });
      toast({ title: "Wall deleted" });
      setDeleteId(null);
      load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleToggle = async (w: Wall) => {
    try {
      await customFetch(`/api/admin/walls/${w.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !w.isActive }) });
      load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Offerwall Integrations</h1>
            <p className="text-muted-foreground">Manage embedded iframe offerwalls (GemiWall, Notik, Upwall, etc.)</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Offerwall
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : walls.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium">No offerwalls configured</p>
              <p className="text-sm mt-1">Add your first offerwall integration above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {walls.map((w) => (
              <Card key={w.id} className={`transition-opacity ${!w.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {w.logoUrl ? (
                        <img src={w.logoUrl} alt={w.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl font-bold text-primary">{w.name[0]}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{w.name}</h3>
                        <Badge variant={w.isActive ? "default" : "secondary"} className="text-xs">
                          {w.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <StarRating rating={w.rating} />
                      {w.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{w.description}</p>}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">Placement ID:</span>
                          <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{w.placementId}</code>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">URL Template:</span>
                          <code className="bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-xs">{w.urlTemplate}</code>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{w.totalConversions} conversions</span>
                        <span>${w.totalRevenue.toFixed(2)} revenue</span>
                        <span>Sort: {w.sortOrder}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={w.isActive} onCheckedChange={() => handleToggle(w)} />
                      <Button variant="outline" size="icon" onClick={() => openEdit(w)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setDeleteId(w.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWall ? "Edit Offerwall" : "Add Offerwall Integration"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input placeholder="GemiWall" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input placeholder="gemiwall" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Placement ID *</Label>
                <Input placeholder="694d2e31385fd920966316fd" value={form.placementId} onChange={e => setForm(f => ({ ...f, placementId: e.target.value }))} />
                <p className="text-xs text-muted-foreground">The ID provided by the offerwall network for your placement.</p>
              </div>

              <div className="space-y-1.5">
                <Label>URL Template *</Label>
                <Input
                  placeholder="https://gemiwall.com/{PLACEMENT_ID}/{USER_ID}"
                  value={form.urlTemplate}
                  onChange={e => setForm(f => ({ ...f, urlTemplate: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">&#123;PLACEMENT_ID&#125;</code> and <code className="bg-muted px-1 rounded">&#123;USER_ID&#125;</code> as placeholders.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input placeholder="https://example.com/logo.png" value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Rating (0–5)</Label>
                  <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea placeholder="Brief description of this offerwall..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} id="wall-active" />
                <Label htmlFor="wall-active">Active (visible to users)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingWall ? "Save Changes" : "Add Offerwall"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Offerwall</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove this offerwall integration. Users will no longer see it.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
