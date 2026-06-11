import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";

// Auth
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

// Public
import Home from "@/pages/public/home";
import Leaderboard from "@/pages/public/leaderboard";
import HowItWorks from "@/pages/public/how-it-works";

// User App
import Dashboard from "@/pages/user/dashboard";
import Earn from "@/pages/user/earn";
import EarnDetail from "@/pages/user/earn-detail";
import EarnOfferwall from "@/pages/user/earn-offerwall";
import EarnSurvey from "@/pages/user/earn-survey";
import VerifyEmail from "@/pages/user/verify-email";
import Withdrawals from "@/pages/user/withdrawals";
import Transactions from "@/pages/user/transactions";
import Referrals from "@/pages/user/referrals";
import Profile from "@/pages/user/profile";

// Admin
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminUserDetail from "@/pages/admin/user-detail";
import AdminOffers from "@/pages/admin/offers";
import AdminWithdrawals from "@/pages/admin/withdrawals";
import AdminConversions from "@/pages/admin/conversions";
import AdminNetworks from "@/pages/admin/networks";
import AdminApiKeys from "@/pages/admin/api-keys";
import AdminWalls from "@/pages/admin/walls";
import AdminSettings from "@/pages/admin/settings";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/how-it-works" component={HowItWorks} />
      
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      
      {/* Protected User Routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/earn"><ProtectedRoute component={Earn} /></Route>
      <Route path="/earn/offerwall"><ProtectedRoute component={EarnOfferwall} /></Route>
      <Route path="/earn/survey"><ProtectedRoute component={EarnSurvey} /></Route>
      <Route path="/earn/:id"><ProtectedRoute component={EarnDetail} /></Route>
      <Route path="/withdrawals"><ProtectedRoute component={Withdrawals} /></Route>
      <Route path="/transactions"><ProtectedRoute component={Transactions} /></Route>
      <Route path="/referrals"><ProtectedRoute component={Referrals} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>

      {/* Admin Routes */}
      <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>
      <Route path="/admin/users"><ProtectedRoute component={AdminUsers} adminOnly /></Route>
      <Route path="/admin/users/:id"><ProtectedRoute component={AdminUserDetail} adminOnly /></Route>
      <Route path="/admin/offers"><ProtectedRoute component={AdminOffers} adminOnly /></Route>
      <Route path="/admin/withdrawals"><ProtectedRoute component={AdminWithdrawals} adminOnly /></Route>
      <Route path="/admin/conversions"><ProtectedRoute component={AdminConversions} adminOnly /></Route>
      <Route path="/admin/networks"><ProtectedRoute component={AdminNetworks} adminOnly /></Route>
      <Route path="/admin/api-keys"><ProtectedRoute component={AdminApiKeys} adminOnly /></Route>
      <Route path="/admin/walls"><ProtectedRoute component={AdminWalls} adminOnly /></Route>
      <Route path="/admin/settings"><ProtectedRoute component={AdminSettings} adminOnly /></Route>
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    })}>
      <ThemeProvider defaultTheme="dark" storageKey="offerloots-theme">
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
