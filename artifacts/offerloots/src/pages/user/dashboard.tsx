import { AppLayout } from "@/components/layout/app-layout";
import { useGetUserDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Coins, ArrowUpRight, History, Gamepad2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetUserDashboard();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your earning summary.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <Coins className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${(dashboard?.balance || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(dashboard?.todayEarned || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(dashboard?.totalEarned || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard?.pendingWithdrawals || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Processing</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">Rank: <span className="text-primary capitalize">{dashboard?.rank}</span></h3>
                <p className="text-sm text-muted-foreground">Earn more to reach the next rank and unlock better bonuses.</p>
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{dashboard?.rankProgress || 0}%</span>
                </div>
                <Progress value={dashboard?.rankProgress || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Conversions</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {dashboard?.recentConversions && dashboard.recentConversions.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.recentConversions.map((conv) => (
                    <div key={conv.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Gamepad2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{conv.offerName}</p>
                          <p className="text-xs text-muted-foreground">{conv.network}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">+${conv.amount.toFixed(2)}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">{conv.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent conversions.</p>
                  <Link href="/earn">
                    <Button variant="link" className="mt-2 text-primary">Start earning now</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-bold text-xl mb-2">Ready to earn?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Explore our top-paying offerwalls and start earning cash immediately.
                </p>
                <Link href="/earn">
                  <Button className="w-full font-bold">
                    Go to Offerwalls <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {dashboard.recentTransactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className={`font-bold ${tx.type === 'debit' || tx.type === 'withdrawal' ? 'text-destructive' : 'text-primary'}`}>
                          {tx.type === 'debit' || tx.type === 'withdrawal' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No recent transactions.</p>
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