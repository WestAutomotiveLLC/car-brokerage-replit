import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertCircle, CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";
import type { Bid } from "@shared/schema";

export default function CustomerHome() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const { data: bids, isLoading: bidsLoading } = useQuery<Bid[]>({
    queryKey: ["/api/customer/bids"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle2 },
      rejected: { variant: "destructive", icon: XCircle },
      winning: { variant: "default", icon: Trophy },
      outbid: { variant: "outline", icon: AlertCircle },
      won: { variant: "default", icon: Trophy },
      lost: { variant: "destructive", icon: XCircle },
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">My Bids</h1>
            <p className="text-muted-foreground mt-1">
              Manage your auction bids and track their status
            </p>
          </div>
          <Button asChild data-testid="button-new-bid">
            <Link href="/bids/new">
              <a className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Bid
              </a>
            </Link>
          </Button>
        </div>

        {bidsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : !bids || bids.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bids yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Start by submitting your first auction bid
              </p>
              <Button asChild data-testid="button-create-first-bid">
                <Link href="/bids/new">
                  <a className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Bid
                  </a>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bids.map((bid) => (
              <Card key={bid.id} className="hover-elevate" data-testid={`card-bid-${bid.id}`}>
                <CardHeader className="gap-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">Lot #{bid.lotNumber}</CardTitle>
                    {getStatusBadge(bid.status)}
                  </div>
                  <CardDescription>
                    Submitted {new Date(bid.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Bid:</span>
                    <span className="font-semibold" data-testid={`text-max-bid-${bid.id}`}>
                      {formatCurrency(bid.maxBidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Fee:</span>
                    <span>{formatCurrency(bid.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit:</span>
                    <span>{formatCurrency(bid.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground font-medium">Total Paid:</span>
                    <span className="font-semibold">{formatCurrency(bid.totalPaid)}</span>
                  </div>
                  {bid.isRefunded && (
                    <div className="pt-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Refunded
                      </Badge>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full" data-testid={`button-view-details-${bid.id}`}>
                    <Link href={`/bids/${bid.id}`}>
                      <a>View Details</a>
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
