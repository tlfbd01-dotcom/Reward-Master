import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Coins, 
  ArrowDownToLine, 
  History, 
  Network, 
  Key, 
  LogOut,
  ArrowLeft,
  Layers
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

const logoSrc = "/logo.png";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout: clearAuth } = useAuth();
  const logoutMutation = useLogout();

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
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Offers", href: "/admin/offers", icon: Coins },
    { label: "Withdrawals", href: "/admin/withdrawals", icon: ArrowDownToLine },
    { label: "Conversions", href: "/admin/conversions", icon: History },
    { label: "Networks", href: "/admin/networks", icon: Network },
    { label: "Offerwalls", href: "/admin/walls", icon: Layers },
    { label: "API Keys", href: "/admin/api-keys", icon: Key },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-[100dvh] flex w-full bg-background selection:bg-primary/30">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <img src={logoSrc} alt="OfferLoots" className="h-9 w-auto" />
              <span className="font-display font-bold text-sm text-muted-foreground">Admin</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-4 py-4 mb-4 bg-primary/10 rounded-xl mx-2 mt-4 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {user?.username?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{user?.username}</div>
                      <div className="text-xs text-primary font-medium tracking-wide">ADMINISTRATOR</div>
                    </div>
                  </div>
                </div>

                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.href || (location.startsWith(`${item.href}/`) && item.href !== '/admin')}
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
          <SidebarFooter className="p-4 border-t space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Link>
            </Button>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded-md border border-border">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Online
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