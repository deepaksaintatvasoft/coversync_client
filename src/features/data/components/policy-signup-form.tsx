import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { insertPolicySchema } from "@shared/schema";
import { apiRequest } from "@/services/queryClient";
import { CalendarIcon, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/features/data/components/ui/card";
import { Button } from "@/features/data/components/ui/button";
import { Input } from "@/features/data/components/ui/input";
import { Label } from "@/features/data/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/data/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/features/data/components/ui/form";
import { Separator } from "@/features/data/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/data/components/ui/popover";
import { Calendar } from "@/features/data/components/ui/calendar";
import { cn } from "@/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertPolicySchema.extend({
  policyNumber: z.string().min(3, "Policy number must be at least 3 characters"),
  premium: z.number().min(1, "Premium must be at least 1"),
  clientId: z.number().min(1, "Please select a client"),
  policyTypeId: z.number().min(1, "Please select a policy type"),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string().min(1, "Please select a status"),
  frequency: z.string().min(1, "Please select a payment frequency"),
  renewalDate: z.date().nullable(),
});

type PolicyFormValues = z.infer<typeof formSchema>;

type PolicySignupFormProps = {
  onComplete?: (policyData: PolicyFormValues) => void;
};

export function PolicySignupForm({ onComplete }: PolicySignupFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [, navigate] = useLocation();
  
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      policyNumber: "",
      premium: 0,
      clientId: 0,
      policyTypeId: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      status: "Active",
      frequency: "Monthly",
      renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: policyTypes = [] } = useQuery({
    queryKey: ["/api/policy-types"],
  });

  const createPolicy = useMutation({
    mutationFn: async (policy: PolicyFormValues) => {
      return apiRequest("POST", "/api/policies", policy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies/renewals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success!",
        description: "Policy has been created successfully.",
      });
      if (onComplete) {
        onComplete(form.getValues());
      } else {
        navigate("/policies");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create policy. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating policy:", error);
    },
  });

  const onSubmit = async (data: PolicyFormValues) => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      createPolicy.mutate(data);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-primary-900">New Policy Application</h2>
        <div className="flex items-center justify-between mt-6">
          <div className="w-full">
            <div className="relative">
              <div className="overflow-hidden h-2 flex rounded bg-gray-200">
                <div
                  className="bg-primary-600 transition-all"
                  style={{ width: `${(step / 3) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2">
                <div className="text-center">
                  <div
                    className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors
                      ${step >= 1 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                  </div>
                  <div className="text-xs mt-1 font-medium">Client Info</div>
                </div>
                <div className="text-center">
                  <div
                    className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors
                      ${step >= 2 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
                  </div>
                  <div className="text-xs mt-1 font-medium">Policy Type</div>
                </div>
                <div className="text-center">
                  <div
                    className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors
                      ${step >= 3 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}
                  >
                    3
                  </div>
                  <div className="text-xs mt-1 font-medium">Payment Details</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {step === 1 && "Client Information"}
                {step === 2 && "Policy Type & Coverage"}
                {step === 3 && "Payment & Confirmation"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Select the client for this policy"}
                {step === 2 && "Choose policy type and coverage details"}
                {step === 3 && "Finalize payment information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Client Information */}
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients?.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The client who will be the policyholder
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="policyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Unique identifier for this policy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 2: Policy Type & Coverage */}
              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="policyTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Type</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a policy type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {policyTypes?.map((type: any) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Type of insurance coverage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When coverage begins
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When coverage ends
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                            <SelectItem value="Expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 3: Payment & Confirmation */}
              {step === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="premium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Premium Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <Input
                              type="number"
                              className="pl-7"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The amount to be paid for the policy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                            <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                            <SelectItem value="Annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often premiums will be paid
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="renewalDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Renewal Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the policy needs to be renewed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={goBack} 
                disabled={step === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                type="submit" 
                disabled={createPolicy.isPending}
              >
                {step < 3 ? (
                  <>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Create Policy"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}