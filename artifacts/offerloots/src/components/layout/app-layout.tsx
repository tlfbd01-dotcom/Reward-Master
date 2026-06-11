import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
  SidebarFooter, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Coins, ArrowDownToLine, History, Users, Settings,
  Trophy, LogOut, ChevronRight, Gamepad2, Layers, ClipboardList,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useState, useEffect } from "react";

const logoSrc = "/logo.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout: clearAuth } = useAuth();
  const logoutMutation = useLogout();
  const [earnOpen, setEarnOpen] = useState(location.startsWith("/earn"));

  useEffect(() => {
    if (location.startsWith("/earn")) setEarnOpen(true);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      // ignore
    } finally {
      clearAuth();
      setLocation("/");
    }
  };

  const navItems = [
    { label: "Withdrawals", href: "/withdrawals", icon: ArrowDownToLine },
    { label: "Transactions", href: "/transactions", icon: History },
    { label: "Referrals", href: "/referrals", icon: Users },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Settings", href: "/profile", icon: Settings },
  ];

  const earnSubItems = [
    { label: "Offers", href: "/earn", icon: Gamepad2 },
    { label: "Offerwall", href: "/earn/offerwall", icon: Layers },
    { label: "Survey", href: "/earn/survey", icon: ClipboardList },
  ];

  const isEarnActive = location === "/earn" || location.startsWith("/earn/");

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex w-full bg-background/90 selection:bg-primary/30">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-4 border-b">
            <Link href="/" className="flex items-center">
              <img src={logoSrc} alt="OfferLoots" className="h-9 w-auto" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-4 py-4 mb-4 bg-muted/30 rounded-xl mx-2 mt-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{user?.username}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user?.rank || "Bronze"}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-background rounded-lg p-2 mt-3 border">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Balance</span>
                      <span className="font-bold text-primary">${(user?.balance || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Points</span>
                      <span className="font-bold text-accent">{user?.points || 0}</span>
                    </div>
                  </div>
                </div>

                <SidebarMenu>
                  {/* Dashboard */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/dashboard"}
                      tooltip="Dashboard"
                    >
                      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Earn — collapsible sub-menu */}
                  <Collapsible open={earnOpen} onOpenChange={setEarnOpen} className="group/earn">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={isEarnActive} tooltip="Earn" className="flex items-center gap-3 px-4 py-2 text-sm w-full">
                          <Coins className="h-4 w-4 shrink-0" />
                          <span className="flex-1">Earn</span>
                          <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/earn:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {earnSubItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  item.href === "/earn"
                                    ? location === "/earn"
                                    : location === item.href || location.startsWith(`${item.href}/`)
                                }
                              >
                                <Link href={item.href} className="flex items-center gap-2">
                                  <item.icon className="h-3.5 w-3.5" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  {/* Remaining nav items */}
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href || location.startsWith(`${item.href}/`)}
                        tooltip={item.label}
                      >
                        <Link href={item.href} className="flex items-center gap-3 px-4 py-2 text-sm">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            {user?.role === "admin" && (
              <Button variant="outline" className="w-full justify-start mb-2" asChild>
                <Link href="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Link>
              </Button>
            )}
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b flex items-center px-4 md:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <SidebarTrigger className="-ml-2 mr-4" />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <Button size="sm" asChild className="hidden sm:flex rounded-full">
                <Link href="/earn">Earn Now</Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
