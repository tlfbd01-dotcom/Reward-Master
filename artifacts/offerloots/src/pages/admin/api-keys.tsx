import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetApiKeys, useCreateApiKey, useDeleteApiKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Key, Copy, Plus, Trash2 } from "lucide-react";
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

export default function AdminApiKeys() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: apiKeys, isLoading } = useGetApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();

  const [modalOpen, setModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createKey.mutateAsync({ data: { name: newKeyName } });
      setCreatedKey(result.key);
      toast({ title: "API Key created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure? Any services using this key will immediately break.")) {
      try {
        await deleteKey.mutateAsync({ id });
        toast({ title: "API Key deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">API Keys</h1>
            <p className="text-muted-foreground">Manage keys for external server integrations.</p>
          </div>
          <Button onClick={() => { setModalOpen(true); setCreatedKey(null); setNewKeyName(""); }}>
            <Plus className="w-4 h-4 mr-2" /> Generate New Key
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Key Preview</th>
                    <th className="px-6 py-4 text-center">Usage Count</th>
                    <th className="px-6 py-4">Last Used</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                  ) : apiKeys?.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8">No API keys generated yet.</td></tr>
                  ) : (
                    apiKeys?.map((k) => (
                      <tr key={k.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-6 py-4 font-bold">{k.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {k.key.substring(0, 8)}************************
                        </td>
                        <td className="px-6 py-4 text-center font-bold">{k.usageCount}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(k.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
          </DialogHeader>
          
          {createdKey ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-lg text-sm">
                <strong>Important:</strong> Copy this key now. You will not be able to see it again.
              </div>
              <div className="flex gap-2">
                <Input value={createdKey} readOnly className="font-mono text-xs" />
                <Button onClick={() => {
                  navigator.clipboard.writeText(createdKey);
                  toast({ title: "Copied to clipboard!" });
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => setModalOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input 
                  value={newKeyName} 
                  onChange={(e) => setNewKeyName(e.target.value)} 
                  placeholder="e.g. Production Server" 
                  required 
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createKey.isPending}>Generate</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}