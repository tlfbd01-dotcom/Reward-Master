import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminWithdrawals, useUpdateAdminWithdrawal } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { CheckCircle2, XCircle, Wallet, MessageSquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "recharts";

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState("pending");
  
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected" | "processing">("approved");
  const [notes, setNotes] = useState("");

  const queryParams: any = { page, limit: 20, status: statusTab };

  const { data: withdrawalsData, isLoading } = useGetAdminWithdrawals(queryParams);
  const updateWithdrawal = useUpdateAdminWithdrawal();

  const openActionModal = (withdrawal: any, type: "approved" | "rejected" | "processing") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setNotes(withdrawal.notes || "");
    setActionModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedWithdrawal) return;
    try {
      await updateWithdrawal.mutateAsync({
        id: selectedWithdrawal.id,
        data: { status: actionType, notes }
      });
      toast({ title: `Withdrawal ${actionType}` });
      setActionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Withdrawal Queue</h1>
          <p className="text-muted-foreground">Process user cashout requests.</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v); setPage(1); }}>
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Method & Details</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                  ) : withdrawalsData?.data?.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8">No withdrawals found in this queue.</td></tr>
                  ) : (
                    withdrawalsData?.data.map((wd) => (
                      <tr key={wd.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-6 py-4 font-medium">User #{wd.userId}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="capitalize font-bold text-xs">{wd.method.replace('_', ' ')}</span>
                            <span className="font-mono text-xs text-muted-foreground">{wd.accountInfo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                          ${wd.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={wd.status === 'approved' ? 'default' : wd.status === 'rejected' ? 'destructive' : 'secondary'} className={wd.status === 'approved' ? 'bg-green-500' : ''}>
                            {wd.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {wd.status === 'pending' || wd.status === 'processing' ? (
                            <>
                              {wd.status === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => openActionModal(wd, 'processing')}>
                                  Process
                                </Button>
                              )}
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openActionModal(wd, 'approved')}>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => openActionModal(wd, 'rejected')}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => openActionModal(wd, wd.status as any)}>
                              <MessageSquare className="w-4 h-4 mr-1" /> View/Edit Notes
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {withdrawalsData && withdrawalsData.total > withdrawalsData.limit && (
              <div className="flex justify-center items-center gap-4 p-4 border-t">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(withdrawalsData.total / withdrawalsData.limit)}</span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(withdrawalsData.total / withdrawalsData.limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">Mark as {actionType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg flex justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="font-bold text-lg">${selectedWithdrawal?.amount.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Method</div>
                <div className="font-bold capitalize">{selectedWithdrawal?.method.replace('_', ' ')}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Admin Notes (Optional, visible to user)</Label>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder={actionType === 'rejected' ? 'Reason for rejection...' : 'Transaction ID / Hash...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>Cancel</Button>
            <Button 
              variant={actionType === 'rejected' ? 'destructive' : 'default'}
              onClick={handleAction} 
              disabled={updateWithdrawal.isPending}
            >
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}