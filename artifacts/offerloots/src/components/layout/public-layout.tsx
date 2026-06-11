import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogIn, Menu, UserPlus, LogOut, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useLogout } from "@workspace/api-client-react";

const logoSrc = "/logo.png";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout: clearAuth } = useAuth();
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  
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

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background/80 selection:bg-primary/30">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src={logoSrc} alt="OfferLoots" className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4">
                <Link href={user?.role === "admin" ? "/admin" : "/dashboard"}>
                  <Button variant="default" className="rounded-full px-6 font-semibold">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/how-it-works"><DropdownMenuItem>How it Works</DropdownMenuItem></Link>
                <Link href="/leaderboard"><DropdownMenuItem>Leaderboard</DropdownMenuItem></Link>
                
                {isAuthenticated ? (
                  <>
                    <Link href={user?.role === "admin" ? "/admin" : "/dashboard"}>
                      <DropdownMenuItem className="font-bold text-primary">Dashboard</DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">Log out</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <Link href="/login"><DropdownMenuItem><LogIn className="mr-2 h-4 w-4" /> Log in</DropdownMenuItem></Link>
                    <Link href="/register"><DropdownMenuItem><UserPlus className="mr-2 h-4 w-4" /> Sign up</DropdownMenuItem></Link>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center mb-4">
                <img src={logoSrc} alt="OfferLoots" className="h-10 w-auto" />
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm">
                The highest-paying rewards platform. Complete surveys, play games, and watch videos to earn real cash. Fast withdrawals via PayPal, Crypto, and more.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/earn" className="hover:text-primary transition-colors">Earn Money</Link></li>
                <li><Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link></li>
                <li><Link href="/how-it-works" className="hover:text-primary transition-colors">How it Works</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} OfferLoots. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Must be 18+ to participate.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}