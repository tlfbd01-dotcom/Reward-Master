import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminUsers, useUpdateAdminUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Search, MoreVertical, Eye, ShieldBan, ShieldCheck, DollarSign } from "lucide-react";
import { Link } from "wouter";
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

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newBalance, setNewBalance] = useState<string>("");

  const queryParams: any = { page, limit: 20 };
  if (search) queryParams.search = search;
  if (status !== "all") queryParams.status = status;

  const { data: usersData, isLoading } = useGetAdminUsers(queryParams);
  const updateUser = useUpdateAdminUser();

  const handleStatusChange = async (userId: number, newStatus: "active" | "banned") => {
    try {
      await updateUser.mutateAsync({ id: userId, data: { status: newStatus } });
      toast({ title: `User ${newStatus === 'banned' ? 'banned' : 'unbanned'}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleSaveBalance = async () => {
    if (!selectedUser || !newBalance) return;
    try {
      await updateUser.mutateAsync({ id: selectedUser.id, data: { balance: Number(newBalance) } });
      toast({ title: "Balance updated" });
      setBalanceModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const openBalanceModal = (user: any) => {
    setSelectedUser(user);
    setNewBalance(user.balance.toString());
    setBalanceModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Users Management</h1>
          <p className="text-muted-foreground">View and manage all registered users on the platform.</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by username or email..." 
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
                    <SelectItem value="banned">Banned</SelectItem>
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
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Balance</th>
                    <th className="px-6 py-4">Total Earned</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                  ) : usersData?.data?.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8">No users found.</td></tr>
                  ) : (
                    usersData?.data.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="font-bold">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.status === 'banned' ? 'destructive' : 'default'} className={user.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {user.status}
                          </Badge>
                          {user.role === 'admin' && <Badge variant="outline" className="ml-2 border-primary text-primary">Admin</Badge>}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold">
                          ${user.balance.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          ${user.totalEarned.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
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
                              <Link href={`/admin/users/${user.id}`}>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem onClick={() => openBalanceModal(user)}>
                                <DollarSign className="mr-2 h-4 w-4" /> Edit Balance
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'active' ? (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(user.id, "banned")}>
                                  <ShieldBan className="mr-2 h-4 w-4" /> Ban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-green-500" onClick={() => handleStatusChange(user.id, "active")}>
                                  <ShieldCheck className="mr-2 h-4 w-4" /> Unban User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {usersData && usersData.total > usersData.limit && (
              <div className="flex justify-center items-center gap-4 p-4 border-t">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(usersData.total / usersData.limit)}</span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(usersData.total / usersData.limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Balance for {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Balance: ${selectedUser?.balance.toFixed(2)}</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={newBalance} 
                onChange={(e) => setNewBalance(e.target.value)} 
                placeholder="New balance amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBalance} disabled={updateUser.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}