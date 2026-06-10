import { PublicLayout } from "@/components/layout/public-layout";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen pt-12 pb-24">
        {/* Header section with glow */}
        <div className="relative mb-16">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-accent/10 rounded-full mb-4 border border-accent/20">
              <Trophy className="w-8 h-8 text-accent drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-4">Top Earners</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The most dedicated users on OfferLoots. Compete to reach the top and unlock exclusive bonuses.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
            </div>
          ) : (
            <Card className="border-accent/20 shadow-2xl overflow-hidden bg-card/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 text-xs uppercase font-bold tracking-wider text-muted-foreground border-b border-border/50">
                      <tr>
                        <th className="px-6 py-4 w-24 text-center">Rank</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4 text-right">Total Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {leaderboard?.map((entry) => {
                        const isTop3 = entry.rank <= 3;
                        return (
                          <tr 
                            key={entry.userId} 
                            className={`group transition-colors ${
                              entry.rank === 1 ? 'bg-accent/5 hover:bg-accent/10' : 
                              entry.rank === 2 ? 'bg-muted/30 hover:bg-muted/50' : 
                              entry.rank === 3 ? 'bg-orange-500/5 hover:bg-orange-500/10' : 
                              'hover:bg-muted/30'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                {entry.rank === 1 ? <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-md" /> :
                                 entry.rank === 2 ? <Medal className="w-8 h-8 text-zinc-300 drop-shadow-md" /> :
                                 entry.rank === 3 ? <Medal className="w-8 h-8 text-orange-400 drop-shadow-md" /> :
                                 <span className="text-lg font-bold text-muted-foreground w-8 text-center">{entry.rank}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner
                                  ${entry.rank === 1 ? 'bg-yellow-400/20 text-yellow-500 border border-yellow-400/50' : 
                                    entry.rank === 2 ? 'bg-zinc-300/20 text-zinc-400 border border-zinc-300/50' : 
                                    entry.rank === 3 ? 'bg-orange-400/20 text-orange-500 border border-orange-400/50' : 
                                    'bg-primary/10 text-primary border border-primary/20'}`}
                                >
                                  {entry.username.charAt(0).toUpperCase()}
                                </div>
                                <span className={`font-bold text-lg ${isTop3 ? 'text-foreground' : 'text-foreground/80'}`}>
                                  {entry.username.substring(0, 3)}***{entry.username.substring(entry.username.length - 2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`font-mono font-bold text-xl tracking-tight
                                ${entry.rank === 1 ? 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 
                                  'text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.2)]'}`}
                              >
                                ${entry.totalEarned.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}