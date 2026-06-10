import { AppLayout } from "@/components/layout/app-layout";
import { useGetWithdrawals, useCreateWithdrawal, useGetUserDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine, Wallet, Landmark, Bitcoin, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(5, "Minimum withdrawal is $5").max(10000, "Maximum withdrawal is $10000"),
  method: z.string().min(1, "Please select a method"),
  accountInfo: z.string().min(3, "Account information is required"),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

const METHODS = [
  { id: "paypal", name: "PayPal", icon: Wallet, min: 5 },
  { id: "crypto_btc", name: "Bitcoin (BTC)", icon: Bitcoin, min: 20 },
  { id: "crypto_usdt", name: "Tether (USDT TRC20)", icon: Bitcoin, min: 10 },
  { id: "wise", name: "Wise", icon: Landmark, min: 20 },
  { id: "bkash", name: "bKash", icon: Wallet, min: 5 },
  { id: "nagad", name: "Nagad", icon: Wallet, min: 5 },
];

export default function Withdrawals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: dashboard } = useGetUserDashboard();
  const { data: withdrawalsData, isLoading: isLoadingHistory } = useGetWithdrawals();
  const createWithdrawal = useCreateWithdrawal();

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 5,
      method: "paypal",
      accountInfo: "",
    },
  });

  const selectedMethodId = form.watch("method");
  const selectedMethod = METHODS.find(m => m.id === selectedMethodId);

  const onSubmit = async (data: WithdrawalFormValues) => {
    if ((dashboard?.balance || 0) < data.amount) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You do not have enough funds for this withdrawal.",
      });
      return;
    }

    try {
      await createWithdrawal.mutateAsync({ data });
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal has been queued for processing.",
      });
      form.reset({ amount: selectedMethod?.min || 5, method: data.method, accountInfo: "" });
      
      // Invalidate queries to refresh balance and history
      queryClient.invalidateQueries({ queryKey: ["/api/user/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description: error.message || "Failed to submit withdrawal request.",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Withdrawals</h1>
          <p className="text-muted-foreground">Cash out your earnings to your preferred payment method.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">Available Balance</p>
                  <div className="text-5xl font-display font-bold text-primary mb-2">
                    ${(dashboard?.balance || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum withdrawal: $5.00</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Payout</CardTitle>
                <CardDescription>Select a method and enter amount</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {METHODS.map(method => (
                                <SelectItem key={method.id} value={method.id}>
                                  <div className="flex items-center gap-2">
                                    <method.icon className="w-4 h-4" />
                                    <span>{method.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">(Min: ${method.min})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Details</FormLabel>
                          <FormControl>
                            <Input placeholder="Email, Wallet Address, or Phone Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min={selectedMethod?.min || 5} max={dashboard?.balance || 0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full font-bold h-12" disabled={createWithdrawal.isPending}>
                      {createWithdrawal.isPending ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <ArrowDownToLine className="mr-2 h-5 w-5" /> Withdraw Funds
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
                <CardDescription>Your past and pending payout requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (withdrawalsData as any[])?.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No withdrawals yet.</p>
                    <p className="text-sm">Your cashout history will appear here.</p>
                  </div>
                ) : (
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Date</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Account</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center rounded-tr-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(withdrawalsData as any[])?.map((item: any) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3 whitespace-nowrap">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 capitalize">
                              <div className="flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-muted-foreground" />
                                {item.method.replace('_', ' ')}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {item.accountInfo.length > 15 ? `${item.accountInfo.substring(0, 15)}...` : item.accountInfo}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              ${item.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge 
                                variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}
                                className={item.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}
                              >
                                {item.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}