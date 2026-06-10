import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminOffers, useCreateAdminOffer, useUpdateAdminOffer, useDeleteAdminOffer, useGetNetworks } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Search, Plus, MoreVertical, Edit, Trash, PauseCircle, PlayCircle, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const offerSchema = z.object({
  name: z.string().min(1, "Name required"),
  payout: z.coerce.number().min(0.01),
  network: z.string().min(1, "Network required"),
  category: z.string().min(1, "Category required"),
  device: z.string(),
  countries: z.string().transform(str => str.split(',').map(s => s.trim()).filter(Boolean)),
  description: z.string(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  offerUrl: z.string().url().optional().or(z.literal("")),
});

type OfferFormValues = z.infer<typeof offerSchema>;

export default function AdminOffers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);

  const queryParams: any = { page, limit: 20 };
  if (search) queryParams.search = search;
  if (status !== "all") queryParams.status = status;

  const { data: offersData, isLoading } = useGetAdminOffers(queryParams);
  const { data: networksData } = useGetNetworks();
  
  const createOffer = useCreateAdminOffer();
  const updateOffer = useUpdateAdminOffer();
  const deleteOffer = useDeleteAdminOffer();

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: "",
      payout: 1,
      network: "",
      category: "games",
      device: "all",
      countries: "",
      description: "",
      imageUrl: "",
      offerUrl: ""
    }
  });

  const openCreateModal = () => {
    setEditingOffer(null);
    form.reset({
      name: "", payout: 1, network: "", category: "games", device: "all", 
      countries: "", description: "", imageUrl: "", offerUrl: ""
    });
    setModalOpen(true);
  };

  const openEditModal = (offer: any) => {
    setEditingOffer(offer);
    form.reset({
      name: offer.name,
      payout: offer.payout,
      network: offer.network,
      category: offer.category,
      device: offer.device,
      countries: offer.countries.join(", "),
      description: offer.description,
      imageUrl: offer.imageUrl || "",
      offerUrl: offer.offerUrl || ""
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingOffer) {
        await updateOffer.mutateAsync({ id: editingOffer.id, data });
        toast({ title: "Offer updated" });
      } else {
        await createOffer.mutateAsync({ data });
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
    if (confirm("Are you sure you want to delete this offer?")) {
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
                <Input 
                  placeholder="Search offers..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
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
                    offersData?.data.map((offer) => (
                      <tr key={offer.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="font-bold line-clamp-1">{offer.name}</div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            <span className="capitalize">{offer.device}</span>
                            <span>•</span>
                            <span className="capitalize">{offer.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">{offer.network}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                          ${offer.payout.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={offer.status === 'paused' ? 'secondary' : 'default'} className={offer.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
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
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create Offer'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="payout" render={({ field }) => (
                  <FormItem><FormLabel>Payout ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="network" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {networksData?.map(n => <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>)}
                        <SelectItem value="manual">Manual/Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="device" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="countries" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Countries (comma separated, empty for Global)</FormLabel><FormControl><Input placeholder="US, UK, CA" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Image URL (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="offerUrl" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Offer Redirect URL (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Description / Requirements</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createOffer.isPending || updateOffer.isPending}>Save Offer</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}