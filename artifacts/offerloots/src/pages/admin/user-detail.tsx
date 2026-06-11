import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminUser, getGetAdminUserQueryKey, useUpdateAdminUser } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Ban, ShieldCheck, Wallet, Activity, Mail, Globe, Clock, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

const MAIN_ADMIN_ID = 1;

export default function AdminUserDetail() {
  const { id } = useParams();
  const userId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: user, isLoading } = useGetAdminUser(userId, {
    query: {
      enabled: !!id,
      queryKey: getGetAdminUserQueryKey(userId)
    }
  });

  const updateUser = useUpdateAdminUser();

  const isProtected = userId === MAIN_ADMIN_ID && currentUser?.id !== MAIN_ADMIN_ID;

  const handleStatusToggle = async () => {
    if (!user) return;
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    try {
      await updateUser.mutateAsync({ id: userId, data: { status: newStatus as any } });
      toast({ title: `User is now ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: getGetAdminUserQueryKey(userId) });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update failed", description: e.message });
    }
  };

  if (isLoading) {
    return <AdminLayout><div className="text-center py-20">Loading...</div></AdminLayout>;
  }

  if (!user) {
    return <AdminLayout><div className="text-center py-20">User not found</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/users">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <h1 className="text-3xl font-display font-bold">User Details</h1>
          </div>
          <div className="flex gap-2">
            {!isProtected && (
              <Button
                variant={user.status === 'banned' ? "default" : "destructive"}
                onClick={handleStatusToggle}
              >
                {user.status === 'banned' ? <><ShieldCheck className="w-4 h-4 mr-2" /> Unban</> : <><Ban className="w-4 h-4 mr-2" /> Ban User</>}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center pb-6 border-b">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mb-4">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge variant={user.status === 'banned' ? 'destructive' : 'default'} className={user.status === 'active' ? 'bg-green-500' : ''}>
                    {user.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  {userId === MAIN_ADMIN_ID && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-500">Main Admin</Badge>
                  )}
                </div>
              </div>

              <div className="pt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-24">Balance:</span>
                  <span className="font-mono font-bold">${user.balance.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-24">Points:</span>
                  <span className="font-mono font-bold">{user.points}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-24">Country:</span>
                  <span className="font-medium">{user.country || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-24">Joined:</span>
                  <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Earned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">${user.totalEarned.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Withdrawn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-500">${user.totalWithdrawn.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" /> Recent Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  History view would go here. (Detailed logs available via other endpoints)
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
