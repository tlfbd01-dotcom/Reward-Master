import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminConversions, useGetNetworks } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { CheckCircle2, Search } from "lucide-react";

export default function AdminConversions() {
  const [page, setPage] = useState(1);
  const [network, setNetwork] = useState<string>("all");

  const queryParams: any = { page, limit: 30 };
  if (network !== "all") queryParams.network = network;

  const { data: conversionsData, isLoading } = useGetAdminConversions(queryParams);
  const { data: networksData } = useGetNetworks();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Conversions Log</h1>
          <p className="text-muted-foreground">Real-time log of all successful postbacks and completions.</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-64">
                <Select value={network} onValueChange={(v) => { setNetwork(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Networks</SelectItem>
                    {networksData?.map((n) => (
                      <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                    ))}
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
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Offer</th>
                    <th className="px-6 py-4">Network</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">TXID / IP</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                  ) : conversionsData?.data?.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8">No conversions found.</td></tr>
                  ) : (
                    conversionsData?.data.map((conv) => (
                      <tr key={conv.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {new Date(conv.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {conv.username} <span className="text-xs text-muted-foreground">(#{conv.userId})</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold line-clamp-1">{conv.offerName}</div>
                          {conv.offerId && <div className="text-xs text-muted-foreground">ID: {conv.offerId}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary">{conv.network}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-primary">
                          ${conv.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            {conv.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs">{conv.txid}</div>
                          <div className="font-mono text-xs text-muted-foreground">{conv.ip || '-'}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {conversionsData && conversionsData.total > conversionsData.limit && (
              <div className="flex justify-center items-center gap-4 p-4 border-t">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(conversionsData.total / conversionsData.limit)}</span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(conversionsData.total / conversionsData.limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}