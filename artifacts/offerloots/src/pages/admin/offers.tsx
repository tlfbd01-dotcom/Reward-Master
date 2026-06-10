import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminOffers, useCreateAdminOffer, useUpdateAdminOffer, useDeleteAdminOffer, useGetNetworks } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Search, Plus, MoreVertical, Edit, Trash, PauseCircle, PlayCircle, Layers, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type EventRow = { name: string; payout: string; eventId: string };

const EMPTY_FORM = {
  name: "", payout: "1.00", network: "", category: "games", device: "all",
  countries: "US", description: "", imageUrl: "", offerUrl: "", offerExternalId: "",
};

export default function AdminOffers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [events, setEvents] = useState<EventRow[]>([]);

  const queryParams: any = { page, limit: 20 };
  if (search) queryParams.search = search;
  if (status !== "all") queryParams.status = status;

  const { data: offersData, isLoading } = useGetAdminOffers(queryParams);
  const { data: networksData } = useGetNetworks();
  const createOffer = useCreateAdminOffer();
  const updateOffer = useUpdateAdminOffer();
  const deleteOffer = useDeleteAdminOffer();

  const openCreateModal = () => {
    setEditingOffer(null);
    setForm({ ...EMPTY_FORM });
    setEvents([]);
    setModalOpen(true);
  };

  const openEditModal = (offer: any) => {
    setEditingOffer(offer);
    setForm({
      name: offer.name,
      payout: String(offer.payout),
      network: offer.network,
      category: offer.category,
      device: offer.device,
      countries: offer.countries.join(", "),
      description: offer.description,
      imageUrl: offer.imageUrl || "",
      offerUrl: offer.offerUrl || "",
      offerExternalId: offer.offerExternalId || "",
    });
    setEvents(
      Array.isArray(offer.events)
        ? offer.events.map((e: any) => ({ name: e.name, payout: String(e.payout), eventId: e.eventId || "" }))
        : []
    );
    setModalOpen(true);
  };

  const addEvent = () => setEvents(ev => [...ev, { name: "", payout: "0.50", eventId: "" }]);
  const removeEvent = (i: number) => setEvents(ev => ev.filter((_, idx) => idx !== i));
  const updateEvent = (i: number, field: keyof EventRow, value: string) =>
    setEvents(ev => ev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));

  const getEffectivePayout = () => {
    if (events.length > 0) {
      const sum = events.reduce((s, e) => s + (parseFloat(e.payout) || 0), 0);
      return sum.toFixed(2);
    }
    return form.payout;
  };

  const handleSave = async () => {
    if (!form.name || !form.network) {
      toast({ variant: "destructive", title: "Name and Network are required" });
      return;
    }
    const payload: any = {
      name: form.name,
      payout: parseFloat(getEffectivePayout()),
      network: form.network,
      category: form.category,
      device: form.device,
      countries: form.countries.split(",").map((s: string) => s.trim()).filter(Boolean),
      description: form.description,
      imageUrl: form.imageUrl || null,
      offerUrl: form.offerUrl || null,
      offerExternalId: form.offerExternalId || null,
      events: events.length > 0
        ? events.map(e => ({ name: e.name, payout: parseFloat(e.payout) || 0, eventId: e.eventId || undefined }))
        : null,
    };
    try {
      if (editingOffer) {
        await updateOffer.mutateAsync({ id: editingOffer.id, data: payload });
        toast({ title: "Offer updated" });
      } else {
        await createOffer.mutateAsync({ data: payload });
        toast({ title: "Offer created" });
      }
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateOffer.mutateAsync({ id, data: { status: newStatus } });
      toast({ title: `Status changed to ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this offer?")) {
      try {
        await deleteOffer.mutateAsync({ id });
        toast({ title: "Offer deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/offers"] });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Offers</h1>
            <p className="text-muted-foreground">Manage available offers and payouts.</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" /> Add Custom Offer
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search offers..." className="pl-9" value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <div className="w-full md:w-48">
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Offer</th>
                    <th className="px-6 py-4">Network</th>
                    <th className="px-6 py-4 text-right">Payout</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                  ) : offersData?.data?.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8">No offers found.</td></tr>
                  ) : (
                    offersData?.data.map((offer: any) => (
                      <tr key={offer.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="font-bold line-clamp-1 flex items-center gap-2">
                            {offer.name}
                            {offer.events?.length > 0 && (
                              <Badge variant="outline" className="text-[10px] border-primary/50 text-primary gap-1 px-1.5">
                                <Layers className="w-2.5 h-2.5" /> {offer.events.length}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            <span className="capitalize">{offer.device}</span>
                            <span>•</span>
                            <span className="capitalize">{offer.category}</span>
                            {offer.offerExternalId && <span>• ID: {offer.offerExternalId}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4"><Badge variant="secondary">{offer.network}</Badge></td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-primary">${offer.payout.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <Badge variant={offer.status === 'paused' ? 'secondary' : 'default'}
                            className={offer.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {offer.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditModal(offer)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              {offer.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(offer.id, "paused")}>
                                  <PauseCircle className="mr-2 h-4 w-4" /> Pause
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-green-500" onClick={() => handleStatusChange(offer.id, "active")}>
                                  <PlayCircle className="mr-2 h-4 w-4" /> Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(offer.id)}>
                                <Trash className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {offersData && offersData.total > offersData.limit && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <div className="flex items-center px-4 font-medium">Page {page} of {Math.ceil(offersData.total / offersData.limit)}</div>
            <Button variant="outline" disabled={page >= Math.ceil(offersData.total / offersData.limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOffer ? "Edit Offer" : "Create Offer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Basic Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Offer name" />
              </div>
              <div className="space-y-1.5">
                <Label>Network *</Label>
                <Select value={form.network} onValueChange={v => setForm(f => ({ ...f, network: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                  <SelectContent>
                    {networksData?.map((n: any) => <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>)}
                    <SelectItem value="manual">Manual/Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="games, survey..." />
              </div>
              <div className="space-y-1.5">
                <Label>Device</Label>
                <Select value={form.device} onValueChange={v => setForm(f => ({ ...f, device: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Countries (comma-separated)</Label>
                <Input value={form.countries} onChange={e => setForm(f => ({ ...f, countries: e.target.value }))} placeholder="US, UK, CA" />
              </div>
            </div>

            <Separator />

            {/* Multi-Event Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Completion Events</Label>
                  <p className="text-xs text-muted-foreground">Add multiple payout milestones for this offer.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addEvent} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Event
                </Button>
              </div>

              {events.length === 0 ? (
                <div className="space-y-1.5">
                  <Label>Payout ($)</Label>
                  <Input type="number" step="0.01" min="0.01" value={form.payout}
                    onChange={e => setForm(f => ({ ...f, payout: e.target.value }))} placeholder="1.00" />
                  <p className="text-xs text-muted-foreground">Single payout. Add events above for multi-step rewards.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((ev, i) => (
                    <div key={i} className="grid grid-cols-[1fr_5rem_5rem_2rem] gap-2 items-end">
                      <div className="space-y-1">
                        {i === 0 && <Label className="text-xs">Event Name</Label>}
                        <Input placeholder="e.g. Reach Level 5" value={ev.name}
                          onChange={e => updateEvent(i, "name", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        {i === 0 && <Label className="text-xs">Payout ($)</Label>}
                        <Input type="number" step="0.01" min="0" placeholder="0.50" value={ev.payout}
                          onChange={e => updateEvent(i, "payout", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        {i === 0 && <Label className="text-xs">Event ID</Label>}
                        <Input placeholder="level5" value={ev.eventId}
                          onChange={e => updateEvent(i, "eventId", e.target.value)} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeEvent(i)}
                        className={i === 0 ? "mt-5" : ""}>
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
                    <span>{events.length} event{events.length !== 1 ? "s" : ""}</span>
                    <span className="font-bold text-primary">Total: ${getEffectivePayout()}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Click Tracking */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Click Tracking</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Use <code className="bg-muted px-1 rounded">&#123;USER_ID&#125;</code> in the URL — it will be replaced with the user's account ID.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Offer URL Template</Label>
                  <Input value={form.offerUrl}
                    onChange={e => setForm(f => ({ ...f, offerUrl: e.target.value }))}
                    placeholder="https://api.gemiwall.com/api/offers/click?offerId=xxx&userId={USER_ID}&placementId=yyy" />
                </div>
                <div className="space-y-1.5">
                  <Label>External Offer ID</Label>
                  <Input value={form.offerExternalId}
                    onChange={e => setForm(f => ({ ...f, offerExternalId: e.target.value }))}
                    placeholder="cFiWFEJz" />
                </div>
                <div className="space-y-1.5">
                  <Label>Image URL (optional)</Label>
                  <Input value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..." />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label>Description / Requirements</Label>
              <Textarea rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what the user needs to do..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createOffer.isPending || updateOffer.isPending}>
              {editingOffer ? "Save Changes" : "Create Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
