import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { insertPolicySchema, insertClientSchema, insertDependentSchema, insertBankDetailSchema } from "@shared/schema";
import { apiRequest } from "@/services/queryClient";
import { 
  CalendarIcon, ChevronRight, ChevronLeft, CheckCircle2, Check, Plus, X, 
  User, Users, CreditCard, Mail, Phone, MapPin, FileText, Heart, Gift, 
  Landmark, Baby, FileCheck, Loader2, Star 
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/features/data/components/ui/card";
import { Button } from "@/features/data/components/ui/button";
import { Input } from "@/features/data/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/data/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/features/data/components/ui/form";
import { Separator } from "@/features/data/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/data/components/ui/popover";
import { Calendar } from "@/features/data/components/ui/calendar";
import { cn } from "@/utils";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/features/data/components/ui/textarea";
import { Badge } from "@/features/data/components/ui/badge";
import { Checkbox } from "@/features/data/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/features/data/components/ui/radio-group";
import { Label } from "@/features/data/components/ui/label";

// Modified policy form schema without policy number and with status hardcoded to "pending"
const policyFormSchema = insertPolicySchema.extend({
  premium: z.number().min(1, "Premium must be at least 1"),
  clientId: z.number().optional(), // Will be populated from client creation or selection
  policyTypeId: z.number().min(1, "Please select a policy type"),
  captureDate: z.date(),
  inceptionDate: z.date().nullable(),
  // Status will always be "pending" for new policies
  status: z.string().default("pending").optional(),
  frequency: z.string().min(1, "Please select a payment frequency"),
  renewalDate: z.date().nullable(),
}).omit({ policyNumber: true }); // Remove policy number from form requirements

// Client form schema
const clientFormSchema = insertClientSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  gender: z.string({
    required_error: "Gender is required",
  }).min(1, "Please select a gender"),
  idNumber: z.string().min(1, "ID number is required"),
  occupation: z.string().optional(),
  employerName: z.string().optional(),
});

// Import the validation functions
import { validateSouthAfricanID, getDateOfBirthFromIDNumber, getGenderFromIDNumber } from "@/utils";

// Dependent form schema with ID number validation
const dependentFormSchema = insertDependentSchema.extend({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  // Make these fields truly optional
  dateOfBirth: z.date().optional().nullable(),
  gender: z.string().optional().nullable().or(z.literal("")),
  idNumber: z.string().optional().nullable().or(z.literal(""))
    .refine(value => {
      // Skip validation if no ID number provided
      if (!value) return true;
      
      // Validate South African ID number
      return validateSouthAfricanID(value);
    }, { message: "Invalid South African ID number" }),
});

// Bank detail form schema
const bankDetailFormSchema = insertBankDetailSchema.extend({
  accountHolderName: z.string().min(2, "Account holder name must be at least 2 characters"),
  accountNumber: z.string().min(5, "Account number must be at least 5 characters"),
  bankName: z.string().min(1, "Please select a bank"),
  accountType: z.string().min(1, "Please select an account type"),
  branchCode: z.string().min(1, "Branch code is required"),
  isDefault: z.boolean().default(true),
});

// Define types for all forms
type PolicyFormValues = z.infer<typeof policyFormSchema>;
type ClientFormValues = z.infer<typeof clientFormSchema>;
type DependentFormValues = z.infer<typeof dependentFormSchema>;
type BankDetailFormValues = z.infer<typeof bankDetailFormSchema>;

type PolicySignupFormProps = {
  onComplete?: (policyData: any) => void;
};

export function PolicySignupForm({ onComplete }: PolicySignupFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [, navigate] = useLocation();
  const [dependents, setDependents] = useState<DependentFormValues[]>([]);
  const [isAddingDependent, setIsAddingDependent] = useState(false);
  const [currentClientId, setCurrentClientId] = useState<number | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>("");
  
  // Gamification disabled for now
  
  // Forms for each step
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const dependentForm = useForm<DependentFormValues>({
    resolver: zodResolver(dependentFormSchema),
    defaultValues: {
      name: "",
      relationship: "child", // Set default relationship
      dateOfBirth: undefined,
      gender: "",
      idNumber: "",
    },
  });

  const policyForm = useForm<PolicyFormValues>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      premium: 0,
      policyTypeId: 0,
      captureDate: new Date(), // Today's date
      inceptionDate: null, // Will be set when payment is received
      // Status is always set to pending by default, no form field needed
      status: "pending",
      frequency: "monthly",
      renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  const bankDetailForm = useForm<BankDetailFormValues>({
    resolver: zodResolver(bankDetailFormSchema),
    defaultValues: {
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      accountType: "cheque",
      branchCode: "",
      isDefault: true,
    },
  });

  // Queries
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: policyTypes = [] } = useQuery({
    queryKey: ["/api/policy-types"],
  });

  // Mutations
  const createClient = useMutation({
    mutationFn: async (client: ClientFormValues) => {
      const response = await apiRequest("POST", "/api/clients", client);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success!",
        description: "Client has been created successfully.",
      });
      // Set the created client ID for use in subsequent steps
      setCurrentClientId(data.id);
      // Move to next step
      setStep(2);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating client:", error);
    },
  });

  const createBankDetail = useMutation({
    mutationFn: async (bankDetail: BankDetailFormValues & { clientId: number }) => {
      const response = await apiRequest("POST", "/api/bank-details", bankDetail);
      const data = await response.json();
      return data;
    },
  });

  const createDependent = useMutation({
    mutationFn: async (dependent: DependentFormValues & { clientId: number }) => {
      const response = await apiRequest("POST", "/api/dependents", dependent);
      const data = await response.json();
      return data;
    },
  });

  const createPolicyWithDependents = useMutation({
    mutationFn: async (data: { policy: PolicyFormValues, bankDetailId?: number, dependentIds?: number[] }) => {
      // First create the policy
      const policyResponse = await apiRequest("POST", "/api/policies", {
        ...data.policy,
        // The policy number will be generated on the server
        bankDetailId: data.bankDetailId
      });
      const policy = await policyResponse.json();
      
      // Then add any dependents to the policy
      if (data.dependentIds && data.dependentIds.length > 0) {
        await Promise.all(data.dependentIds.map(async dependentId => {
          const response = await apiRequest("POST", "/api/policy-dependents", {
            policyId: policy.id,
            dependentId,
            coveragePercentage: 100 // Default coverage
          });
          return response.json();
        }));
      }
      
      return policy;
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
      
      // Navigate to policies page
      navigate("/policies");
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

  // Handle dependent form submission
  const handleAddDependent = async () => {
    // Basic name validation - only check for name
    if (!dependentForm.getValues().name) {
      toast({
        title: "Validation Error",
        description: "Dependent name is required.",
        variant: "destructive",
      });
      return;
    }
    
    // Set relationship based on current step if not provided
    if (!dependentForm.getValues().relationship) {
      const stepToRelationship = {
        2: "child",
        3: "parent",
        4: "spouse",
        5: "beneficiary"
      };
      
      const defaultRelationship = stepToRelationship[step as keyof typeof stepToRelationship];
      
      if (defaultRelationship) {
        dependentForm.setValue("relationship", defaultRelationship);
      }
    }
    
    // Handle optional fields with null/undefined values
    const formData = dependentForm.getValues();
    
    // Validate South African ID number if provided
    if (formData.idNumber && formData.idNumber.length > 0) {
      // Check ID number length
      if (formData.idNumber.length !== 13) {
        toast({
          title: "Validation Error",
          description: "The South African ID number must be exactly 13 digits.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate using Luhn algorithm
      const isValidID = validateSouthAfricanID(formData.idNumber);
      
      if (!isValidID) {
        toast({
          title: "Validation Error",
          description: "The South African ID number is invalid. Please check the number and try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if ID number matches main member's ID number
      const mainMemberIdNumber = clientForm.getValues().idNumber;
      if (mainMemberIdNumber && formData.idNumber === mainMemberIdNumber) {
        toast({
          title: "Validation Error",
          description: "Dependent's ID number cannot be the same as the main member's ID number.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if ID number is already used by another dependent
      const duplicateId = dependents.some(
        dependent => dependent.idNumber && dependent.idNumber === formData.idNumber
      );
      
      if (duplicateId) {
        toast({
          title: "Validation Error",
          description: "This ID number is already used by another dependent on this policy.",
          variant: "destructive",
        });
        return;
      }
      
      // Auto-fill date of birth and gender if not already set
      if (isValidID) {
        // Only set date of birth if not already provided
        if (!formData.dateOfBirth) {
          const dateOfBirth = getDateOfBirthFromIDNumber(formData.idNumber);
          if (dateOfBirth) {
            dependentForm.setValue("dateOfBirth", dateOfBirth);
            formData.dateOfBirth = dateOfBirth;
          }
        }
        
        // Only set gender if not already provided
        if (!formData.gender) {
          const gender = getGenderFromIDNumber(formData.idNumber);
          if (gender) {
            dependentForm.setValue("gender", gender);
            formData.gender = gender;
          }
        }
      }
    }
    
    // Create a sanitized version of the data
    const cleanData: DependentFormValues = {
      name: formData.name,
      relationship: formData.relationship || "",
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender || "",
      idNumber: formData.idNumber || "",
      clientId: formData.clientId
    };
    
    // Add dependent to local state with sanitized data
    setDependents([...dependents, cleanData]);
    
    // Reset form with appropriate relationship for the current step
    const defaultRelationship = step === 2 ? "child" : 
                              step === 3 ? "parent" : 
                              step === 4 ? "spouse" : 
                              step === 5 ? "beneficiary" : "";
    
    dependentForm.reset({
      name: "",
      relationship: defaultRelationship,
      dateOfBirth: undefined,
      gender: "",
      idNumber: "",
    });
    
    // Close form
    setIsAddingDependent(false);
    
    toast({
      title: "Success",
      description: "Dependent has been added successfully.",
    });
  };
  
  const removeDependent = (index: number) => {
    setDependents(dependents.filter((_, i) => i !== index));
  };

  // Step handlers
  const handleClientStep = async () => {
    // First check if all fields are valid
    const isValid = await clientForm.trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please complete all required client information fields correctly.",
        variant: "destructive",
      });
      return;
    }
    
    // Additional validation for South African ID Number if provided
    const idNumber = clientForm.getValues().idNumber;
    if (idNumber && idNumber.length > 0) {
      // First check that ID number is exactly 13 digits
      if (idNumber.length !== 13) {
        toast({
          title: "ID Number Validation Error",
          description: "The South African ID number must be exactly 13 digits.",
          variant: "destructive",
        });
        return;
      }
      
      // If ID number is 13 digits but invalid, show error
      if (!validateSouthAfricanID(idNumber)) {
        toast({
          title: "ID Number Validation Error",
          description: "The South African ID number is invalid. Please check and correct it.",
          variant: "destructive",
        });
        return;
      }
      
      // Auto-fill date of birth and gender if not already provided
      if (validateSouthAfricanID(idNumber)) {
        const formData = clientForm.getValues();
        
        // Only set date of birth if not already provided
        if (!formData.dateOfBirth) {
          const dateOfBirth = getDateOfBirthFromIDNumber(idNumber);
          if (dateOfBirth) {
            clientForm.setValue("dateOfBirth", dateOfBirth);
          }
        }
        
        // Only set gender if not already provided
        if (!formData.gender) {
          const gender = getGenderFromIDNumber(idNumber);
          if (gender) {
            clientForm.setValue("gender", gender);
          }
        }
      }
    }
    
    // Create client
    createClient.mutate(clientForm.getValues());
  };
  
  const handleDependentsStep = () => {
    // Move to next step
    setStep(step + 1);
  };

  const handleBankDetailsStep = async () => {
    // First check if all fields are valid
    const isValid = await bankDetailForm.trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please complete all required bank details fields correctly.",
        variant: "destructive",
      });
      return;
    }
    
    // Create bank detail
    if (currentClientId) {
      createBankDetail.mutate({
        ...bankDetailForm.getValues(),
        clientId: currentClientId
      });
      
      // Move to next step
      setStep(step + 1);
    } else {
      toast({
        title: "Error",
        description: "Client information is missing. Please go back and complete the client details.",
        variant: "destructive",
      });
    }
  };

  const handlePolicyDetailsStep = async () => {
    // First check if all fields are valid
    const isValid = await policyForm.trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please complete all required policy details fields correctly.",
        variant: "destructive",
      });
      return;
    }
    
    // Create dependents, bank details, and policy
    if (currentClientId) {
      try {
        // Create all dependents
        const createdDependents = await Promise.all(
          dependents.map(async (dependent) => {
            const result = await createDependent.mutateAsync({
              ...dependent,
              clientId: currentClientId
            });
            return result;
          })
        );
        
        // Create bank details
        const bankDetail = await createBankDetail.mutateAsync({
          ...bankDetailForm.getValues(),
          clientId: currentClientId
        });
        
        // Create policy with dependents
        await createPolicyWithDependents.mutateAsync({
          policy: {
            ...policyForm.getValues(),
            clientId: currentClientId,
          },
          bankDetailId: bankDetail.id,
          dependentIds: createdDependents.map(d => d.id)
        });
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete({
            policy: policyForm.getValues(),
            client: { id: currentClientId },
            dependents: createdDependents,
            bankDetail
          });
        }
      } catch (error) {
        console.error("Error creating policy:", error);
        toast({
          title: "Error",
          description: "Failed to create policy. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Client information is missing. Please go back and complete the client details.",
        variant: "destructive",
      });
    }
  };
  
  const handleBankNameChange = (value: string) => {
    bankDetailForm.setValue("bankName", value);
    setSelectedBank(value);
    
    // Set branch code based on bank selection
    const branchCodes: Record<string, string> = {
      "ABSA Bank": "632005",
      "African Bank": "430000",
      "Bidvest Bank": "462005",
      "Capitec Bank": "470010",
      "Discovery Bank": "679000",
      "First National Bank": "250655",
      "Nedbank": "198765",
      "Standard Bank": "051001",
      "Mukuru": "800002",
      "TymeBank": "678910",
    };
    
    if (value in branchCodes) {
      bankDetailForm.setValue("branchCode", branchCodes[value]);
    } else {
      bankDetailForm.setValue("branchCode", "");
    }
  };

  // Bank account types in South Africa
  const accountTypes = [
    { value: "cheque", label: "Cheque Account" },
    { value: "savings", label: "Savings Account" },
    { value: "transmission", label: "Transmission Account" },
  ];

  // South African banks
  const southAfricanBanks = [
    "ABSA Bank",
    "African Bank",
    "Bidvest Bank",
    "Capitec Bank",
    "Discovery Bank",
    "First National Bank",
    "Nedbank",
    "Standard Bank",
    "Mukuru",
    "TymeBank",
  ];

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">New Policy Application</CardTitle>
          <CardDescription>
            Complete all steps to create a new funeral policy. We just need a few details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex justify-between">
              <div className={`flex-1 text-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  {step > 1 ? <Check className="h-6 w-6" /> : "1"}
                </div>
                <p className="mt-1 text-sm">Client Details</p>
              </div>
              <div className="w-full mx-2 mt-5">
                <div className={`h-1 ${step > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
              </div>
              <div className={`flex-1 text-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  {step > 2 ? <Check className="h-6 w-6" /> : "2"}
                </div>
                <p className="mt-1 text-sm">Children</p>
              </div>
              <div className="w-full mx-2 mt-5">
                <div className={`h-1 ${step > 2 ? 'bg-primary' : 'bg-muted'}`}></div>
              </div>
              <div className={`flex-1 text-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  {step > 3 ? <Check className="h-6 w-6" /> : "3"}
                </div>
                <p className="mt-1 text-sm">Extended Family</p>
              </div>
              <div className="w-full mx-2 mt-5">
                <div className={`h-1 ${step > 3 ? 'bg-primary' : 'bg-muted'}`}></div>
              </div>
              <div className={`flex-1 text-center ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 ${step >= 4 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  {step > 4 ? <Check className="h-6 w-6" /> : "4"}
                </div>
                <p className="mt-1 text-sm">Spouse</p>
              </div>
              <div className="w-full mx-2 mt-5">
                <div className={`h-1 ${step > 4 ? 'bg-primary' : 'bg-muted'}`}></div>
              </div>
              <div className={`flex-1 text-center ${step >= 5 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 ${step >= 5 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  {step > 5 ? <Check className="h-6 w-6" /> : "5"}
                </div>
                <p className="mt-1 text-sm">Beneficiary</p>
              </div>
              <div className="w-full mx-2 mt-5">
                <div className={`h-1 ${step > 5 ? 'bg-primary' : 'bg-muted'}`}></div>
              </div>
              <div className={`flex-1 text-center ${step >= 6 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 ${step >= 6 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  {step > 6 ? <Check className="h-6 w-6" /> : "6"}
                </div>
                <p className="mt-1 text-sm">Bank Details</p>
              </div>
              <div className="w-full mx-2 mt-5">
                <div className={`h-1 ${step > 6 ? 'bg-primary' : 'bg-muted'}`}></div>
              </div>
              <div className={`flex-1 text-center ${step >= 7 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 ${step >= 7 ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  7
                </div>
                <p className="mt-1 text-sm">Policy Details</p>
              </div>
            </div>
          </div>

          {/* Step 1: Client Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Main Member Details</h3>
                <p className="text-muted-foreground mb-6">
                  Enter the details of the policy holder. This person will be the main member on the policy.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={clientForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              const idNumber = e.target.value;
                              
                              // Auto-fill date of birth and gender if valid ID number
                              if (idNumber && idNumber.length === 13 && validateSouthAfricanID(idNumber)) {
                                const dateOfBirth = getDateOfBirthFromIDNumber(idNumber);
                                const gender = getGenderFromIDNumber(idNumber);
                                
                                if (dateOfBirth) {
                                  clientForm.setValue("dateOfBirth", dateOfBirth);
                                }
                                
                                if (gender) {
                                  clientForm.setValue("gender", gender);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {field.value && (
                          field.value.length !== 13 ? (
                            <p className="text-xs text-amber-600 mt-1">
                              South African ID must be 13 digits
                            </p>
                          ) : (
                            <p className={validateSouthAfricanID(field.value) 
                              ? "text-xs text-green-600 mt-1" 
                              : "text-xs text-red-600 mt-1"
                            }>
                              {validateSouthAfricanID(field.value) 
                                ? "✓ Valid South African ID" 
                                : "✗ Invalid South African ID"}
                            </p>
                          )
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={clientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={clientForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
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
                              selected={field.value instanceof Date ? field.value : undefined}
                              onSelect={(date) => field.onChange(date || null)}
                              initialFocus
                              disabled={(date) => date > new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={clientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter residential address"
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={clientForm.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="employerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Children */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Add Children to the Policy</h3>
                <p className="text-muted-foreground mb-6">
                  Add the details of any children that should be covered by this policy. This is optional, you can add up to 8 children.
                </p>
                
                {/* Display added children */}
                {dependents.filter(d => d.relationship === "child").length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2">Added Children</h4>
                    <div className="space-y-2">
                      {dependents.filter(d => d.relationship === "child").map((child, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center space-x-4">
                            <Baby className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{child.name}</p>
                              <div className="flex space-x-4 text-sm text-muted-foreground">
                                {child.dateOfBirth && (
                                  <span>DOB: {format(child.dateOfBirth, "PP")}</span>
                                )}
                                {child.gender && (
                                  <span>Gender: {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}</span>
                                )}
                                {child.idNumber && (
                                  <span>ID: {child.idNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDependent(dependents.indexOf(child))}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Form to add a new child */}
                {isAddingDependent ? (
                  <div className="border rounded-md p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium">Child Details</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAddingDependent(false)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <FormField
                        control={dependentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Child's Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Hidden field - automatically set to "child" */}
                      <input 
                        type="hidden" 
                        {...dependentForm.register("relationship")} 
                        value="child" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={dependentForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const idNumber = e.target.value;
                                  
                                  // Auto-fill date of birth and gender if valid ID number
                                  if (idNumber && idNumber.length === 13 && validateSouthAfricanID(idNumber)) {
                                    const dateOfBirth = getDateOfBirthFromIDNumber(idNumber);
                                    const gender = getGenderFromIDNumber(idNumber);
                                    
                                    if (dateOfBirth) {
                                      dependentForm.setValue("dateOfBirth", dateOfBirth);
                                    }
                                    
                                    if (gender) {
                                      dependentForm.setValue("gender", gender);
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            {field.value && (
                              field.value.length !== 13 ? (
                                <p className="text-xs text-amber-600 mt-1">
                                  South African ID must be 13 digits
                                </p>
                              ) : (
                                <p className={validateSouthAfricanID(field.value) 
                                  ? "text-xs text-green-600 mt-1" 
                                  : "text-xs text-red-600 mt-1"
                                }>
                                  {validateSouthAfricanID(field.value) 
                                    ? "✓ Valid South African ID" 
                                    : "✗ Invalid South African ID"}
                                </p>
                              )
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dependentForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
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
                                  initialFocus
                                  disabled={(date) => date > new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dependentForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button type="button" onClick={handleAddDependent}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Child
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddingDependent(true)}
                    className="mb-6"
                    disabled={dependents.filter(d => d.relationship === "child").length >= 8}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Child
                  </Button>
                )}
                
                {dependents.filter(d => d.relationship === "child").length >= 8 && (
                  <p className="text-sm text-muted-foreground mb-6">
                    You have reached the maximum number of children allowed (8).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Extended Family */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Add Extended Family to the Policy</h3>
                <p className="text-muted-foreground mb-6">
                  Add parents or other extended family members that should be covered by this policy. This is optional, you can add up to 8 family members.
                </p>
                
                {/* Display added family members */}
                {dependents.filter(d => d.relationship === "parent").length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2">Added Extended Family Members</h4>
                    <div className="space-y-2">
                      {dependents.filter(d => d.relationship === "parent").map((parent, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center space-x-4">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{parent.name}</p>
                              <div className="flex space-x-4 text-sm text-muted-foreground">
                                {parent.dateOfBirth && (
                                  <span>DOB: {format(parent.dateOfBirth, "PP")}</span>
                                )}
                                {parent.gender && (
                                  <span>Gender: {parent.gender.charAt(0).toUpperCase() + parent.gender.slice(1)}</span>
                                )}
                                {parent.idNumber && (
                                  <span>ID: {parent.idNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDependent(dependents.indexOf(parent))}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Form to add a new extended family member */}
                {isAddingDependent ? (
                  <div className="border rounded-md p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium">Extended Family Member Details</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAddingDependent(false)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <FormField
                        control={dependentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Family Member's Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Hidden field - automatically set to "parent" */}
                      <input 
                        type="hidden" 
                        {...dependentForm.register("relationship")} 
                        value="parent" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={dependentForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const idNumber = e.target.value;
                                  
                                  // Auto-fill date of birth and gender if valid ID number
                                  if (idNumber && idNumber.length === 13 && validateSouthAfricanID(idNumber)) {
                                    const dateOfBirth = getDateOfBirthFromIDNumber(idNumber);
                                    const gender = getGenderFromIDNumber(idNumber);
                                    
                                    if (dateOfBirth) {
                                      dependentForm.setValue("dateOfBirth", dateOfBirth);
                                    }
                                    
                                    if (gender) {
                                      dependentForm.setValue("gender", gender);
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            {field.value && (
                              field.value.length !== 13 ? (
                                <p className="text-xs text-amber-600 mt-1">
                                  South African ID must be 13 digits
                                </p>
                              ) : (
                                <p className={validateSouthAfricanID(field.value) 
                                  ? "text-xs text-green-600 mt-1" 
                                  : "text-xs text-red-600 mt-1"
                                }>
                                  {validateSouthAfricanID(field.value) 
                                    ? "✓ Valid South African ID" 
                                    : "✗ Invalid South African ID"}
                                </p>
                              )
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dependentForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
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
                                  initialFocus
                                  disabled={(date) => date > new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dependentForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button type="button" onClick={handleAddDependent}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Family Member
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddingDependent(true)}
                    className="mb-6"
                    disabled={dependents.filter(d => d.relationship === "parent").length >= 8}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Extended Family Member
                  </Button>
                )}
                
                {dependents.filter(d => d.relationship === "parent").length >= 8 && (
                  <p className="text-sm text-muted-foreground mb-6">
                    You have reached the maximum number of extended family members allowed (8).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Spouse */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Add Spouse to the Policy</h3>
                <p className="text-muted-foreground mb-6">
                  Add spouse details if applicable. This is optional.
                </p>
                
                {/* Display added spouse */}
                {dependents.filter(d => d.relationship === "spouse").length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2">Added Spouse</h4>
                    <div className="space-y-2">
                      {dependents.filter(d => d.relationship === "spouse").map((spouse, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center space-x-4">
                            <Heart className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{spouse.name}</p>
                              <div className="flex space-x-4 text-sm text-muted-foreground">
                                {spouse.dateOfBirth && (
                                  <span>DOB: {format(spouse.dateOfBirth, "PP")}</span>
                                )}
                                {spouse.gender && (
                                  <span>Gender: {spouse.gender.charAt(0).toUpperCase() + spouse.gender.slice(1)}</span>
                                )}
                                {spouse.idNumber && (
                                  <span>ID: {spouse.idNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDependent(dependents.indexOf(spouse))}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Form to add a spouse */}
                {isAddingDependent ? (
                  <div className="border rounded-md p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium">Spouse Details</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAddingDependent(false)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <FormField
                        control={dependentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spouse's Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Hidden field - automatically set to "spouse" */}
                      <input 
                        type="hidden" 
                        {...dependentForm.register("relationship")} 
                        value="spouse" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={dependentForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const idNumber = e.target.value;
                                  
                                  // Auto-fill date of birth and gender if valid ID number
                                  if (idNumber && idNumber.length === 13 && validateSouthAfricanID(idNumber)) {
                                    const dateOfBirth = getDateOfBirthFromIDNumber(idNumber);
                                    const gender = getGenderFromIDNumber(idNumber);
                                    
                                    if (dateOfBirth) {
                                      dependentForm.setValue("dateOfBirth", dateOfBirth);
                                    }
                                    
                                    if (gender) {
                                      dependentForm.setValue("gender", gender);
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            {field.value && (
                              field.value.length !== 13 ? (
                                <p className="text-xs text-amber-600 mt-1">
                                  South African ID must be 13 digits
                                </p>
                              ) : (
                                <p className={validateSouthAfricanID(field.value) 
                                  ? "text-xs text-green-600 mt-1" 
                                  : "text-xs text-red-600 mt-1"
                                }>
                                  {validateSouthAfricanID(field.value) 
                                    ? "✓ Valid South African ID" 
                                    : "✗ Invalid South African ID"}
                                </p>
                              )
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dependentForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
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
                                  initialFocus
                                  disabled={(date) => date > new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dependentForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button type="button" onClick={handleAddDependent}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Spouse
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddingDependent(true)}
                    className="mb-6"
                    disabled={dependents.filter(d => d.relationship === "spouse").length >= 1}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Spouse
                  </Button>
                )}
                
                {dependents.filter(d => d.relationship === "spouse").length >= 1 && (
                  <p className="text-sm text-muted-foreground mb-6">
                    You have already added a spouse to this policy.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Beneficiary */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Add Beneficiary to the Policy</h3>
                <p className="text-muted-foreground mb-6">
                  Add a beneficiary who will receive benefits in the event of the policyholder's death. This is required.
                </p>
                
                {/* Display added beneficiary */}
                {dependents.filter(d => d.relationship === "beneficiary").length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-2">Added Beneficiary</h4>
                    <div className="space-y-2">
                      {dependents.filter(d => d.relationship === "beneficiary").map((beneficiary, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center space-x-4">
                            <Gift className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{beneficiary.name}</p>
                              <div className="flex space-x-4 text-sm text-muted-foreground">
                                {beneficiary.dateOfBirth && (
                                  <span>DOB: {format(beneficiary.dateOfBirth, "PP")}</span>
                                )}
                                {beneficiary.gender && (
                                  <span>Gender: {beneficiary.gender.charAt(0).toUpperCase() + beneficiary.gender.slice(1)}</span>
                                )}
                                {beneficiary.idNumber && (
                                  <span>ID: {beneficiary.idNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDependent(dependents.indexOf(beneficiary))}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Form to add a beneficiary */}
                {isAddingDependent ? (
                  <div className="border rounded-md p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium">Beneficiary Details</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsAddingDependent(false)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancel</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <FormField
                        control={dependentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beneficiary's Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Hidden field - automatically set to "beneficiary" */}
                      <input 
                        type="hidden" 
                        {...dependentForm.register("relationship")} 
                        value="beneficiary" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={dependentForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const idNumber = e.target.value;
                                  
                                  // Auto-fill date of birth and gender if valid ID number
                                  if (idNumber && idNumber.length === 13 && validateSouthAfricanID(idNumber)) {
                                    const dateOfBirth = getDateOfBirthFromIDNumber(idNumber);
                                    const gender = getGenderFromIDNumber(idNumber);
                                    
                                    if (dateOfBirth) {
                                      dependentForm.setValue("dateOfBirth", dateOfBirth);
                                    }
                                    
                                    if (gender) {
                                      dependentForm.setValue("gender", gender);
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            {field.value && (
                              field.value.length !== 13 ? (
                                <p className="text-xs text-amber-600 mt-1">
                                  South African ID must be 13 digits
                                </p>
                              ) : (
                                <p className={validateSouthAfricanID(field.value) 
                                  ? "text-xs text-green-600 mt-1" 
                                  : "text-xs text-red-600 mt-1"
                                }>
                                  {validateSouthAfricanID(field.value) 
                                    ? "✓ Valid South African ID" 
                                    : "✗ Invalid South African ID"}
                                </p>
                              )
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dependentForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
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
                                  initialFocus
                                  disabled={(date) => date > new Date()}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dependentForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button type="button" onClick={handleAddDependent}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Beneficiary
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddingDependent(true)}
                    className="mb-6"
                    disabled={dependents.filter(d => d.relationship === "beneficiary").length >= 1}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Beneficiary
                  </Button>
                )}
                
                {dependents.filter(d => d.relationship === "beneficiary").length >= 1 && (
                  <p className="text-sm text-muted-foreground mb-6">
                    You have already added a beneficiary to this policy.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Bank Details */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
                <p className="text-muted-foreground mb-6">
                  Enter bank details for premium payments. These will be used for monthly debit orders.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={bankDetailForm.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankDetailForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={bankDetailForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank</FormLabel>
                        <Select
                          onValueChange={handleBankNameChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {southAfricanBanks.map((bank) => (
                              <SelectItem key={bank} value={bank}>
                                {bank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankDetailForm.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={bankDetailForm.control}
                    name="branchCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Code</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value}
                            readOnly={selectedBank && selectedBank in {
                              "ABSA Bank": "632005",
                              "African Bank": "430000",
                              "Bidvest Bank": "462005",
                              "Capitec Bank": "470010",
                              "Discovery Bank": "679000",
                              "First National Bank": "250655",
                              "Nedbank": "198765",
                              "Standard Bank": "051001",
                              "Mukuru": "800002",
                              "TymeBank": "678910",
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={bankDetailForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Set as default bank account for this client</FormLabel>
                          <FormDescription>
                            This bank account will be selected by default for future policies.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Policy Details */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Policy Details</h3>
                <p className="text-muted-foreground mb-6">
                  Select the policy type and premium details.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={policyForm.control}
                    name="policyTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Type</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select policy type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {policyTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={policyForm.control}
                    name="premium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Premium Amount (R)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={policyForm.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="biannually">Bi-annually</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={policyForm.control}
                    name="captureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capture Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
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
                              selected={field.value instanceof Date ? field.value : undefined}
                              onSelect={(date) => field.onChange(date || null)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={policyForm.control}
                    name="inceptionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inception Date</FormLabel>
                        <FormDescription>
                          Optional. The date when the first payment is received.
                        </FormDescription>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
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
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={policyForm.control}
                    name="renewalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renewal Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
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
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="text-md font-medium mb-2">Policy Status</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                      Pending
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      All new policies are created with a pending status.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-medium mb-2">Summary</h4>
                  <div className="rounded-md border p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Policy Type:</span>
                      <span className="font-medium">
                        {policyForm.getValues().policyTypeId ? 
                          policyTypes.find(t => t.id === policyForm.getValues().policyTypeId)?.name : 
                          "Not selected"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Main Member:</span>
                      <span className="font-medium">{clientForm.getValues().name}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Dependents:</span>
                      <span className="font-medium">{dependents.filter(d => d.relationship !== "beneficiary").length} added</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Beneficiary:</span>
                      <span className="font-medium">
                        {dependents.find(d => d.relationship === "beneficiary")?.name || "None added"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Premium:</span>
                      <span className="font-medium">
                        R {policyForm.getValues().premium.toFixed(2)} per {policyForm.getValues().frequency}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bank Account:</span>
                      <span className="font-medium">
                        {bankDetailForm.getValues().bankName} - {bankDetailForm.getValues().accountNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
          <div>
            {step === 1 && (
              <Button 
                type="button" 
                onClick={handleClientStep}
                disabled={createClient.isPending}
              >
                {createClient.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            {(step === 2 || step === 3 || step === 4 || step === 5) && (
              <Button 
                type="button" 
                onClick={handleDependentsStep}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 6 && (
              <Button 
                type="button" 
                onClick={handleBankDetailsStep}
                disabled={createBankDetail.isPending}
              >
                {createBankDetail.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            {step === 7 && (
              <Button
                type="button"
                onClick={handlePolicyDetailsStep}
                disabled={createPolicyWithDependents.isPending}
              >
                {createPolicyWithDependents.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Policy...
                  </>
                ) : (
                  <>
                    Complete Application
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}