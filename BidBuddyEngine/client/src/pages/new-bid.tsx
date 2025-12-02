import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, DollarSign } from "lucide-react";
import { insertBidSchema, type InsertBid } from "@shared/schema";
import { z } from "zod";

const formSchema = insertBidSchema.extend({
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function NewBid() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [maxBid, setMaxBid] = useState<number>(0);
  const serviceFee = 215;
  const depositPercent = 0.1;

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lotNumber: "",
      maxBidAmount: "",
      serviceFee: "215.00",
      depositAmount: "0.00",
      totalPaid: "215.00",
      status: "pending",
      customerId: user?.id || "",
      isRefunded: false,
      acceptTerms: false,
    },
  });

  const createBidMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/customer/bids", {
        lotNumber: data.lotNumber,
        maxBidAmount: data.maxBidAmount,
        serviceFee: data.serviceFee,
        depositAmount: data.depositAmount,
        totalPaid: data.totalPaid,
        status: "pending",
        customerId: user?.id,
        isRefunded: false,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bids"] });
      toast({
        title: "Bid Submitted Successfully",
        description: `Your bid for lot #${data.lotNumber} has been submitted and is pending employee review.`,
      });
      // Redirect back to customer home
      navigate("/");
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
        description: error.message || "Failed to create bid. Please try again.",
        variant: "destructive",
      });
    },
  });

  const watchMaxBid = form.watch("maxBidAmount");

  useEffect(() => {
    const amount = parseFloat(watchMaxBid) || 0;
    setMaxBid(amount);
    const deposit = amount * depositPercent;
    const total = serviceFee + deposit;
    form.setValue("depositAmount", deposit.toFixed(2));
    form.setValue("totalPaid", total.toFixed(2));
  }, [watchMaxBid, form]);

  const onSubmit = (data: FormData) => {
    createBidMutation.mutate(data);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Submit a New Bid</h1>
          <p className="text-muted-foreground mt-1">
            Enter your lot number and maximum bid amount
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bid Details</CardTitle>
                <CardDescription>
                  Provide the auction lot number and your maximum bid amount
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="lotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter lot number (e.g., 12345678)"
                          {...field}
                          data-testid="input-lot-number"
                        />
                      </FormControl>
                      <FormDescription>
                        The lot number from the auction catalog
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxBidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Bid Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-9"
                            {...field}
                            data-testid="input-max-bid"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The maximum amount you're willing to bid
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Breakdown</CardTitle>
                <CardDescription>
                  Review the calculated fees and deposit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Service Fee</span>
                    <span className="font-medium">{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">
                      Deposit (10% of max bid)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(maxBid * depositPercent)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-semibold">Total Due Now</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(serviceFee + maxBid * depositPercent)}
                    </span>
                  </div>
                </div>

                <Alert className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>100% Refund Guarantee:</strong> If you don't win the auction,
                    both the service fee and deposit will be fully refunded to your payment method.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-accept-terms"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the terms and conditions
                        </FormLabel>
                        <FormDescription>
                          By checking this box, you agree to our service terms and authorize us
                          to bid on your behalf up to your maximum bid amount.
                        </FormDescription>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/")}
                  disabled={createBidMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createBidMutation.isPending}
                  data-testid="button-proceed-payment"
                >
                  {createBidMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
