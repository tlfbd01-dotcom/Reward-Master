import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ 
  component: Component, 
  adminOnly = false 
}: { 
  component: React.ComponentType;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Save the current path so login can redirect back
      const returnTo = encodeURIComponent(location);
      setLocation(`/login?returnTo=${returnTo}`);
    } else if (!isLoading && isAuthenticated && adminOnly && user?.role !== "admin") {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, adminOnly, setLocation, location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || (adminOnly && user?.role !== "admin")) {
    return null;
  }

  return <Component />;
}
