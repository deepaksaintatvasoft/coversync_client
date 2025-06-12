import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { validateSouthAfricanID, getDateOfBirthFromIDNumber } from "@/utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/features/data/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/features/data/components/ui/form";
import { Button } from "@/features/data/components/ui/button";
import { Input } from "@/features/data/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/data/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/data/components/ui/popover";
import { Calendar } from "@/features/data/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/utils";
import { CalendarIcon, Loader2, ChevronRight } from "lucide-react";

// Schema for form validation
const policyFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
  idNumber: z.string().length(13, { message: "ID number must be exactly 13 digits" })
    .refine(
      (value) => validateSouthAfricanID(value),
      { message: "Invalid South African ID number" }
    ),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  policyType: z.enum(["Family Plan", "Pensioner Plan"], {
    required_error: "You must select a policy type",
  }),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
});

export function PolicySignupForm() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  
  // Define form with zod resolver
  const form = useForm<z.infer<typeof policyFormSchema>>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      fullName: "",
      idNumber: "",
      email: "",
      phone: "",
      address: "",
      policyType: "Family Plan",
      dateOfBirth: undefined,
    },
  });
  
  // Create client mutation
  const createPolicy = useMutation({
    mutationFn: async (data: z.infer<typeof policyFormSchema>) => {
      return apiRequest("POST", "/api/policies", {
        clientName: data.fullName,
        clientIdNumber: data.idNumber,
        clientEmail: data.email,
        clientPhone: data.phone,
        clientAddress: data.address,
        policyType: data.policyType,
        startDate: new Date(),
        coverAmount: 10000,
        premiumAmount: data.policyType === "Family Plan" ? 150 : 250,
        policyNumber: `POL-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    },
    onSuccess: () => {
      // On success, show message and redirect
      setTimeout(() => {
        navigate("/policies");
      }, 2000);
    },
    onError: (error: Error) => {
      console.error("Error creating policy:", error);
    }
  });
  
  // Handler to auto-fill date of birth from ID
  const handleIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idNumber = e.target.value;
    form.setValue("idNumber", idNumber);
    
    if (idNumber.length === 13) {
      const dob = getDateOfBirthFromIDNumber(idNumber);
      if (dob) {
        form.setValue("dateOfBirth", dob);
      }
    }
  };
  
  // Form submission handler
  function onSubmit(data: z.infer<typeof policyFormSchema>) {
    if (step === 1) {
      setStep(2);
    } else {
      createPolicy.mutate(data);
    }
  }
  
  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card className="shadow-md border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-xl font-bold text-gray-800">
            Policy Signup
          </CardTitle>
          <CardDescription className="text-gray-500">
            {step === 1 ? "Enter main member information" : "Review and confirm details"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>South African ID Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="13-digit ID Number" 
                              {...field} 
                              onChange={handleIDChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Your date of birth will be auto-filled from your ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
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
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="email@example.com" 
                              type="email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+27 12 345 6789" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Residential Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123 Main St, City" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="policyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a policy type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Family Plan">Family Plan</SelectItem>
                              <SelectItem value="Pensioner Plan">Pensioner Plan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the type of policy you want to apply for
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              
              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-md border p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Full Name</p>
                        <p>{form.getValues().fullName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">ID Number</p>
                        <p>{form.getValues().idNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date of Birth</p>
                        <p>{form.getValues().dateOfBirth ? format(form.getValues().dateOfBirth, "PPP") : "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email Address</p>
                        <p>{form.getValues().email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone Number</p>
                        <p>{form.getValues().phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Policy Type</p>
                        <p>{form.getValues().policyType}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md border p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Policy Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Policy Number</p>
                        <p>POL-{Math.floor(1000 + Math.random() * 9000)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cover Amount</p>
                        <p>R10,000</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Premium Amount</p>
                        <p>R{form.getValues().policyType === "Family Plan" ? "150" : "250"} per month</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Start Date</p>
                        <p>{format(new Date(), "PPP")}</p>
                      </div>
                    </div>
                  </div>
                  
                  {createPolicy.isSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800">
                      Policy created successfully! Redirecting to policies page...
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                )}
                
                <Button 
                  type="submit"
                  disabled={createPolicy.isPending}
                >
                  {createPolicy.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : step === 1 ? (
                    <>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Complete Application"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}