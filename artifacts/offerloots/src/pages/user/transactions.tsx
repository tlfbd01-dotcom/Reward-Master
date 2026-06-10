import { AppLayout } from "@/components/layout/app-layout";
import { useGetUserTransactions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, Coins } from "lucide-react";

export default function Transactions() {
  const [page, setPage] = useState(1);
  const { data: transactionsData, isLoading } = useGetUserTransactions({ page, limit: 20 });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Transactions</h1>
          <p className="text-muted-foreground">Your complete ledger of earnings and withdrawals.</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactionsData?.data?.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Coins className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No transactions found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionsData?.data.map((tx) => {
                        const isCredit = tx.type === 'credit' || tx.type === 'referral_bonus';
                        return (
                          <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                              #{tx.id.toString().padStart(8, '0')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {tx.description}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="capitalize">
                                {tx.type.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className={`flex items-center justify-end font-bold ${isCredit ? 'text-primary' : 'text-destructive'}`}>
                                {isCredit ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                                ${Math.abs(tx.amount).toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {transactionsData && transactionsData.total > transactionsData.limit && (
                  <div className="flex justify-center items-center gap-4 p-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {Math.ceil(transactionsData.total / transactionsData.limit)}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page >= Math.ceil(transactionsData.total / transactionsData.limit)}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}