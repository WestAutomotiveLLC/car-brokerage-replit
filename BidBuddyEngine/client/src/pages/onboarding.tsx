import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const onboardingSchema = z.object({
  userType: z.enum(["customer", "employee"]),
  companyCode: z.string().optional(),
  idDocument: z.instanceof(File).optional(),
  addressDocument: z.instanceof(File).optional(),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      userType: "customer",
    },
  });

  const userType = form.watch("userType");

  const completeMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const formData = new FormData();
      formData.append("userType", data.userType);
      
      if (data.userType === "employee" && data.companyCode) {
        formData.append("companyCode", data.companyCode);
      }
      
      if (data.userType === "customer") {
        if (idFile) formData.append("idDocument", idFile);
        if (addressFile) formData.append("addressDocument", addressFile);
      }

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Onboarding failed");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Your account has been set up!",
      });
      // Reload to update user state
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OnboardingData) => {
    if (data.userType === "customer" && (!idFile || !addressFile)) {
      toast({
        title: "Missing Documents",
        description: "Please upload both ID and address verification documents.",
        variant: "destructive",
      });
      return;
    }

    if (data.userType === "employee" && !data.companyCode) {
      toast({
        title: "Missing Company Code",
        description: "Please enter your company code.",
        variant: "destructive",
      });
      return;
    }

    completeMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user already has a userType, redirect to home
  if (user && user.userType && user.userType !== "customer" || (user?.userType === "customer" && user.isVerified)) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Let us know how you'd like to use West Automotive
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">I am a...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="customer"
                            id="customer"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="customer"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                            data-testid="radio-customer"
                          >
                            <div className="text-center">
                              <p className="font-semibold text-lg mb-2">Customer</p>
                              <p className="text-sm text-muted-foreground">
                                Submit bids for auction vehicles
                              </p>
                            </div>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="employee"
                            id="employee"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="employee"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                            data-testid="radio-employee"
                          >
                            <div className="text-center">
                              <p className="font-semibold text-lg mb-2">Employee</p>
                              <p className="text-sm text-muted-foreground">
                                Manage customer bids
                              </p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {userType === "employee" && (
                <FormField
                  control={form.control}
                  name="companyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Code</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter company code"
                          {...field}
                          data-testid="input-company-code"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the company code provided by your employer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {userType === "customer" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ID Document</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="id-upload"
                        data-testid="input-id-document"
                      />
                      <Label
                        htmlFor="id-upload"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        {idFile ? (
                          <div className="flex items-center gap-2 text-primary">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">{idFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">
                              Upload photo of your ID (Driver's License, Passport, etc.)
                            </span>
                          </>
                        )}
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address Verification</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setAddressFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="address-upload"
                        data-testid="input-address-document"
                      />
                      <Label
                        htmlFor="address-upload"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        {addressFile ? (
                          <div className="flex items-center gap-2 text-primary">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">{addressFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">
                              Upload proof of address (Utility Bill, Bank Statement, etc.)
                            </span>
                          </>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={completeMutation.isPending}
                data-testid="button-complete-onboarding"
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
