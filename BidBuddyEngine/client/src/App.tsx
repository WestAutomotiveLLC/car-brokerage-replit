import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import CustomerHome from "@/pages/customer-home";
import NewBid from "@/pages/new-bid";
import EmployeeDashboard from "@/pages/employee-dashboard";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, isCustomer, isEmployee, isSuperAdmin, user } = useAuth();

  if (isLoading) {
    return null;
  }

  // Check if user needs onboarding
  const needsOnboarding = isAuthenticated && user && (!user.userType || (user.userType === "customer" && !user.isVerified));

  return (
    <>
      {isAuthenticated && !needsOnboarding && <Navbar />}
      <Switch>
        {/* Unauthenticated */}
        {!isAuthenticated && (
          <>
            <Route path="/" component={Landing} />
            <Route component={NotFound} />
          </>
        )}
        
        {/* Onboarding */}
        {isAuthenticated && needsOnboarding && (
          <>
            <Route path="/" component={Onboarding} />
            <Route component={Onboarding} />
          </>
        )}
        
        {/* Customer routes */}
        {isAuthenticated && !needsOnboarding && isCustomer && (
          <>
            <Route path="/" component={CustomerHome} />
            <Route path="/bids/new" component={NewBid} />
            <Route component={NotFound} />
          </>
        )}
        
        {/* Employee routes (not super admin) */}
        {isAuthenticated && !needsOnboarding && isEmployee && !isSuperAdmin && (
          <>
            <Route path="/" component={EmployeeDashboard} />
            <Route path="/employee" component={EmployeeDashboard} />
            <Route component={NotFound} />
          </>
        )}
        
        {/* Super admin routes */}
        {isAuthenticated && !needsOnboarding && isSuperAdmin && (
          <>
            <Route path="/" component={EmployeeDashboard} />
            <Route path="/employee" component={EmployeeDashboard} />
            <Route path="/admin" component={SuperAdminDashboard} />
            <Route component={NotFound} />
          </>
        )}
        
        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
