import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Loader2, Clock, Trophy, AlertCircle } from "lucide-react";
import type { Bid } from "@shared/schema";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, isEmployee, isSuperAdmin } = useAuth();
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: bids, isLoading: bidsLoading } = useQuery<Bid[]>({
    queryKey: ["/api/employee/bids"],
    enabled: isAuthenticated && (isEmployee || isSuperAdmin),
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bidId, status, notes }: { bidId: string; status: string; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/employee/bids/${bidId}/status`, {
        status,
        notes,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/bids"] });
      toast({
        title: "Status Updated",
        description: "Bid status has been updated successfully.",
      });
      setSelectedBid(null);
      setNewStatus("");
      setNotes("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveBidMutation = useMutation({
    mutationFn: async ({ bidId }: { bidId: string }) => {
      const response = await apiRequest("POST", `/api/employee/bids/${bidId}/approve`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/bids"] });
      toast({
        title: "Bid Approved",
        description: "The bid has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to approve bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectBidMutation = useMutation({
    mutationFn: async ({ bidId, notes }: { bidId: string; notes: string }) => {
      const response = await apiRequest("POST", `/api/employee/bids/${bidId}/reject`, { notes });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/bids"] });
      toast({
        title: "Bid Rejected",
        description: "The bid has been rejected.",
      });
      setSelectedBid(null);
      setNotes("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to reject bid. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Bid Management</h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, and manage customer bids
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Bids</CardTitle>
            <CardDescription>
              Manage customer auction bids and update their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bidsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : !bids || bids.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bids to display</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lot Number</TableHead>
                      <TableHead>Max Bid</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((bid) => (
                      <TableRow key={bid.id} data-testid={`row-bid-${bid.id}`}>
                        <TableCell className="font-medium">{bid.lotNumber}</TableCell>
                        <TableCell>{formatCurrency(bid.maxBidAmount)}</TableCell>
                        <TableCell>{formatCurrency(bid.totalPaid)}</TableCell>
                        <TableCell>{getStatusBadge(bid.status)}</TableCell>
                        <TableCell>{new Date(bid.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {bid.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => approveBidMutation.mutate({ bidId: bid.id })}
                                  disabled={approveBidMutation.isPending}
                                  data-testid={`button-approve-${bid.id}`}
                                >
                                  {approveBidMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    "Approve"
                                  )}
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setSelectedBid(bid)}
                                      data-testid={`button-reject-${bid.id}`}
                                    >
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Bid</DialogTitle>
                                      <DialogDescription>
                                        Provide a reason for rejecting this bid
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Reason for Rejection</Label>
                                        <Textarea
                                          placeholder="Enter rejection reason..."
                                          value={notes}
                                          onChange={(e) => setNotes(e.target.value)}
                                          data-testid="textarea-reject-notes"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedBid(null);
                                          setNotes("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          if (selectedBid) {
                                            rejectBidMutation.mutate({ bidId: selectedBid.id, notes });
                                          }
                                        }}
                                        disabled={rejectBidMutation.isPending || !notes.trim()}
                                        data-testid="button-confirm-reject"
                                      >
                                        {rejectBidMutation.isPending ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : null}
                                        Confirm Rejection
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                            {bid.status !== "pending" && bid.status !== "rejected" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedBid(bid);
                                      setNewStatus(bid.status);
                                    }}
                                    data-testid={`button-update-status-${bid.id}`}
                                  >
                                    Update Status
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update Bid Status</DialogTitle>
                                    <DialogDescription>
                                      Change the auction status for Lot #{selectedBid?.lotNumber}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>New Status</Label>
                                      <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger data-testid="select-new-status">
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="approved">Approved</SelectItem>
                                          <SelectItem value="winning">Winning</SelectItem>
                                          <SelectItem value="outbid">Outbid</SelectItem>
                                          <SelectItem value="won">Won</SelectItem>
                                          <SelectItem value="lost">Lost</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Notes (optional)</Label>
                                      <Textarea
                                        placeholder="Add notes about this status change..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        data-testid="textarea-status-notes"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedBid(null);
                                        setNewStatus("");
                                        setNotes("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        if (selectedBid && newStatus) {
                                          updateStatusMutation.mutate({
                                            bidId: selectedBid.id,
                                            status: newStatus,
                                            notes: notes || undefined,
                                          });
                                        }
                                      }}
                                      disabled={updateStatusMutation.isPending || !newStatus}
                                      data-testid="button-confirm-status-update"
                                    >
                                      {updateStatusMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      ) : null}
                                      Update Status
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
