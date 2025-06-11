import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  validateSouthAfricanID, 
  extractDateOfBirthFromID, 
  extractGenderFromID,
  validateSouthAfricanPhoneNumber 
} from "@/lib/utils";

// UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Payment Method Components
import { PaymentMethodForm } from "@/components/payment-methods/PaymentMethodForm";

// Icons
import { AlertCircle, Baby, CalendarIcon, Check, CheckCircle2, ChevronLeft, ChevronRight, Heart, HelpCircle, Info, Landmark, Loader2, Mail, Phone, Plus, Shield, User, Users, X, XCircle } from "lucide-react";

// Client schema
const clientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  surname: z.string().min(2, "Surname must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .refine(phone => validateSouthAfricanPhoneNumber(phone), "Please enter a valid South African phone number"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  idNumber: z.string()
    .length(13, "ID number must be exactly 13 digits")
    .refine(id => validateSouthAfricanID(id), "Invalid South African ID number"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Invalid date format",
  }),
});

// Dependent schema
const dependentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  surname: z.string().min(2, "Surname must be at least 2 characters"),
  idNumber: z.string()
    .length(13, "ID number must be exactly 13 digits")
    .refine(id => validateSouthAfricanID(id), "Invalid South African ID number")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.date().optional().nullable(),
  relationship: z.string(),
});

// Beneficiary schema
const beneficiarySchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  surname: z.string().min(2, "Surname must be at least 2 characters"),
  idNumber: z.string()
    .length(13, "ID number must be exactly 13 digits")
    .refine(id => validateSouthAfricanID(id), "Invalid South African ID number")
    .optional()
    .or(z.literal("")),
  phone: z.string()
    .optional()
    .or(z.literal(""))
    .refine(
      phone => !phone || validateSouthAfricanPhoneNumber(phone), 
      "Please enter a valid South African phone number"
    ),
  address: z.string().optional().or(z.literal("")),
  relationship: z.string(),
  percentage: z.number().min(1).max(100).optional(),
});

// Bank details schema
const bankDetailSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(5, "Account number is required"),
  accountType: z.string().min(1, "Account type is required"),
  branchCode: z.string().min(4, "Branch code is required"),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  debitDate: z.string().min(1, "Debit date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  sassaNumber: z.string().optional().or(z.literal("")),
  preferredStore: z.string().optional().or(z.literal("")),
});

// Policy schema
const policySchema = z.object({
  policyNumber: z.string().min(5, "Policy number is required"),
  policyTypeId: z.number({
    required_error: "Please select a policy type",
  }),
  premium: z.number().min(1, "Premium amount is required"),
  frequency: z.string().min(1, "Payment frequency is required"),
  agentId: z.number().optional().nullable(),
});

// Types to infer from schemas
type ClientFormValues = z.infer<typeof clientSchema>;
type DependentFormValues = z.infer<typeof dependentSchema>;
type BeneficiaryFormValues = z.infer<typeof beneficiarySchema>;
type BankDetailFormValues = z.infer<typeof bankDetailSchema>;
type PolicyFormValues = z.infer<typeof policySchema>;

// Main component
export function PolicySignupForm() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  
  // Fetch agent data once at the component level for use throughout the component
  const { data: allAgentsData } = useQuery<any[]>({
    queryKey: ["/api/agents"],
  });
  const [dependents, setDependents] = useState<Array<any>>([]);
  const [beneficiaries, setBeneficiaries] = useState<Array<any>>([]);
  const [showDependentForm, setShowDependentForm] = useState(false);
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  const [dependentType, setDependentType] = useState<string>("spouse");
  const [spouseIdValidation, setSpouseIdValidation] = useState<{isValid: boolean | null, message: string | null}>({
    isValid: null,
    message: null
  });
  const [childIdValidation, setChildIdValidation] = useState<{isValid: boolean | null, message: string | null}>({
    isValid: null,
    message: null
  });
  const [extendedIdValidation, setExtendedIdValidation] = useState<{isValid: boolean | null, message: string | null}>({
    isValid: null,
    message: null
  });
  const [beneficiaryIdValidation, setBeneficiaryIdValidation] = useState<{isValid: boolean | null, message: string | null}>({
    isValid: null,
    message: null
  });
  
  // State for phone number validation
  const [phoneValidation, setPhoneValidation] = useState<{isValid: boolean | null, message: string | null}>({
    isValid: null,
    message: null
  });
  
  // State for beneficiary phone validation
  const [beneficiaryPhoneValidation, setBeneficiaryPhoneValidation] = useState<{isValid: boolean | null, message: string | null}>({
    isValid: null,
    message: null
  });
  
  // Fetch policy types
  const { data: policyTypes } = useQuery({
    queryKey: ["/api/policy-types"],
  });
  
  // Forms
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      email: "",
      phone: "",
      address: "",
      idNumber: "",
    },
  });
  
  const spouseForm = useForm<DependentFormValues>({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      idNumber: "",
      dateOfBirth: null,
      relationship: "spouse",
    },
  });
  
  const childForm = useForm<DependentFormValues>({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      idNumber: "",
      dateOfBirth: null,
      relationship: "child",
    },
  });
  
  const extendedFamilyForm = useForm<DependentFormValues>({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      firstName: "",
      surname: "",
      idNumber: "",
      dateOfBirth: null,
      relationship: "parent",
    },
  });
  
  const beneficiaryForm = useForm<BeneficiaryFormValues>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      firstName: "",
      surname: "",
      idNumber: "",
      phone: "",
      address: "",
      relationship: "family",
      percentage: 100,
    },
  });
  
  const bankDetailForm = useForm<BankDetailFormValues>({
    resolver: zodResolver(bankDetailSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      accountType: "savings",
      branchCode: "",
      accountHolderName: "",
      debitDate: "1",
      paymentMethod: "bank",
      sassaNumber: "",
      preferredStore: "",
    },
  });
  
  const policyForm = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      policyNumber: `POL-${Math.floor(1000 + Math.random() * 9000)}`,
      policyTypeId: undefined,
      premium: 0,
      frequency: "monthly",
      agentId: null,
    },
  });
  
  // Effect to set account holder name same as client firstName + surname
  useEffect(() => {
    const firstName = clientForm.watch("firstName");
    const surname = clientForm.watch("surname");
    if (firstName && surname) {
      bankDetailForm.setValue("accountHolderName", `${firstName} ${surname}`);
    }
  }, [clientForm.watch("firstName"), clientForm.watch("surname")]);
  
  // Reset dependent form when changing dependent type
  useEffect(() => {
    setShowDependentForm(false);
  }, [step]);
  
  // Helper function to validate ID number and auto-fill form fields
  const validateAndAutoFillFromID = (idNumber: string, form: any) => {
    const isValid = validateSouthAfricanID(idNumber);
    
    if (isValid) {
      const dob = extractDateOfBirthFromID(idNumber);
      if (dob) {
        form.setValue("dateOfBirth", dob);
      }
    }
    
    return { isValid };
  };
  
  // Handle form field errors
  const getFieldErrorDetail = (fieldName: any, form: any) => {
    return form.formState.errors[fieldName]?.message;
  };
  
  // Mutations
  const createClient = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      // Combine firstName and surname into name for API compatibility
      const apiData = {
        ...data,
        name: `${data.firstName} ${data.surname}`
      };
      const response = await apiRequest("POST", "/api/clients", apiData);
      const clientData = await response.json();
      return clientData;
    },
  });
  
  const createDependent = useMutation({
    mutationFn: async (data: any) => {
      const clientId = createClient.data?.id;
      if (!clientId) {
        throw new Error("Client ID not found");
      }
      
      const dependentData = {
        ...data,
        clientId,
        name: `${data.firstName} ${data.surname}` // Combine for API compatibility
      };
      
      const response = await apiRequest("POST", "/api/dependents", dependentData);
      return response.json();
    },
  });
  
  const createBankDetail = useMutation({
    mutationFn: async (data: BankDetailFormValues) => {
      const clientId = createClient.data?.id;
      if (!clientId) {
        throw new Error("Client ID not found");
      }
      
      const bankDetailData = {
        ...data,
        clientId,
        isDefault: true,
      };
      
      const response = await apiRequest("POST", "/api/bank-details", bankDetailData);
      return response.json();
    },
  });
  
  const createPolicy = useMutation({
    mutationFn: async (data: PolicyFormValues) => {
      const clientId = createClient.data?.id;
      if (!clientId) {
        throw new Error("Client ID not found");
      }
      
      const policyData = {
        ...data,
        clientId,
        status: "pending",
        startDate: new Date(),
      };
      
      const response = await apiRequest("POST", "/api/policies", policyData);
      return response.json();
    },
  });
  
  const createPolicyDependents = useMutation({
    mutationFn: async (data: { policyId: number, dependentIds: number[] }) => {
      const promises = data.dependentIds.map(dependentId => 
        apiRequest("POST", "/api/policy-dependents", {
          policyId: data.policyId,
          dependentId,
          coverageAmount: 10000, // Default coverage amount
        })
      );
      
      return Promise.all(promises);
    },
  });
  
  const createPolicyWithDependents = useMutation({
    mutationFn: async (policyData: PolicyFormValues) => {
      // Create the policy
      const policyResponse = await createPolicy.mutateAsync(policyData);
      const policyId = policyResponse.id;
      
      // If we have dependents, link them to the policy
      if (dependents.length > 0) {
        const dependentIds = dependents
          .filter(d => d.id) // Only use dependents that have been created
          .map(d => d.id);
        
        if (dependentIds.length > 0) {
          await createPolicyDependents.mutateAsync({
            policyId,
            dependentIds,
          });
        }
      }
      
      return policyResponse;
    },
    onSuccess: () => {
      // Navigate to the policies page
      navigate('/policies');
    },
  });
  
  // Remove dependent from list
  const removeDependentFromList = (index: number) => {
    setDependents(prev => {
      const newDependents = [...prev];
      newDependents.splice(index, 1);
      return newDependents;
    });
  };
  
  // Remove beneficiary from list
  const removeBeneficiaryFromList = (index: number) => {
    setBeneficiaries(prev => {
      const newBeneficiaries = [...prev];
      newBeneficiaries.splice(index, 1);
      return newBeneficiaries;
    });
  };
  
  // Handle client step
  const handleClientStep = async () => {
    try {
      clientForm.handleSubmit(async (data) => {
        createClient.mutate(data);
        setStep(2);
      })();
    } catch (error) {
      console.error("Error in client step:", error);
    }
  };
  
  // Handle dependent submission
  const handleDependentSubmit = (data: DependentFormValues) => {
    // Check limits based on relationship type
    if (dependentType === "spouse" && dependents.filter(d => d.relationship === "spouse").length >= 1) {
      toast({
        title: "Maximum spouse limit reached",
        description: "You can only add one spouse to this policy.",
        variant: "destructive"
      });
      return;
    }
    
    if (dependentType === "child" && dependents.filter(d => d.relationship === "child").length >= 6) {
      toast({
        title: "Maximum children limit reached",
        description: "You can only add up to 6 children to this policy.",
        variant: "destructive"
      });
      return;
    }
    
    if (dependentType === "parent" || dependentType === "extended" && 
        dependents.filter(d => d.relationship === "parent" || d.relationship === "extended").length >= 10) {
      toast({
        title: "Maximum extended family limit reached",
        description: "You can only add up to 10 extended family members to this policy.",
        variant: "destructive"
      });
      return;
    }
    
    // Add to local state first for immediate UI feedback
    const newDependent = {
      ...data,
      relationship: dependentType,
      name: `${data.firstName} ${data.surname}` // Add name field for API compatibility
    };
    
    setDependents(prev => [...prev, newDependent]);
    
    // Reset the form and hide it
    if (dependentType === "spouse") {
      spouseForm.reset({ 
        firstName: "", 
        surname: "", 
        idNumber: "", 
        dateOfBirth: null, 
        relationship: "spouse" 
      });
    } else if (dependentType === "child") {
      childForm.reset({ 
        firstName: "", 
        surname: "", 
        idNumber: "", 
        dateOfBirth: null, 
        relationship: "child" 
      });
    } else {
      extendedFamilyForm.reset({ 
        firstName: "", 
        surname: "", 
        idNumber: "", 
        dateOfBirth: null, 
        relationship: "parent" 
      });
    }
    
    setShowDependentForm(false);
    setSpouseIdValidation({ isValid: null, message: null });
    setChildIdValidation({ isValid: null, message: null });
    setExtendedIdValidation({ isValid: null, message: null });
  };
  
  // Handle beneficiary submission
  const handleBeneficiarySubmit = (data: BeneficiaryFormValues) => {
    // Add to local state and also add combined name field for API compatibility
    const beneficiaryData = {
      ...data,
      name: `${data.firstName} ${data.surname}` // Add name field for API compatibility
    };
    setBeneficiaries(prev => [...prev, beneficiaryData]);
    
    // Reset the form and hide it
    beneficiaryForm.reset({
      firstName: "",
      surname: "",
      idNumber: "",
      phone: "",
      address: "",
      relationship: "family",
      percentage: 100,
    });
    
    setShowBeneficiaryForm(false);
    setBeneficiaryIdValidation({ isValid: null, message: null });
  };
  
  // Handle dependents step (moving to next step)
  const handleDependentsStep = () => {
    // Depending on which step we're on, we'll go to the next
    if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      setStep(6);
    }
  };
  
  // Handle bank details step
  const handleBankDetailsStep = () => {
    const paymentMethod = bankDetailForm.getValues().paymentMethod;
    
    // First validate that we have a payment method
    if (!paymentMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method to continue",
        variant: "destructive",
      });
      return;
    }

    // For bank payments, validate and submit the bank details
    if (paymentMethod === "bank") {
      bankDetailForm.handleSubmit((data) => {
        // Only try to create bank detail if we have the required fields
        if (data.bankName && data.accountNumber && data.branchCode && data.accountHolderName) {
          createBankDetail.mutate(data);
        }
        // Move to the next step regardless
        setStep(7); // Go to summary step
      })();
    } else {
      // For non-bank payment methods (sassa or pay@), just proceed to the next step
      // We'll store the payment method preference in the policy data
      setStep(7); // Go to summary step
    }
  };
  
  // Handle policy details step
  const handlePolicyDetailsStep = () => {
    policyForm.handleSubmit((data) => {
      createPolicyWithDependents.mutate(data);
    })();
  };
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, (step / 8) * 100);
  
  // Helper function to safely render policy types
  const renderPolicyTypes = () => {
    if (!policyTypes || !Array.isArray(policyTypes)) {
      return <SelectItem value="" disabled>No policy types available</SelectItem>;
    }
    
    return policyTypes.map((type: any) => {
      const id = type?.id?.toString() || '';
      const name = String(type?.name || 'Policy');
      const premium = type?.basePremium 
        ? String(Number(type.basePremium).toFixed(2)) 
        : '0.00';
        
      return (
        <SelectItem key={id} value={id}>
          {name} - R{premium}/month
        </SelectItem>
      );
    });
  };
  
  // Mock data for demonstration
  const mockMainMember = {
    firstName: clientForm.getValues().firstName || "John",
    surname: clientForm.getValues().surname || "Doe",
    email: clientForm.getValues().email || "john.doe@example.com",
    phone: clientForm.getValues().phone || "0123456789", 
    address: clientForm.getValues().address || "123 Main St, Johannesburg",
    idNumber: clientForm.getValues().idNumber || "8001015009087",
    dateOfBirth: clientForm.getValues().dateOfBirth || new Date(1980, 0, 1),
  };
  
  // Prepare a client data object if we're in step 2 or higher
  const clientData = step >= 2 ? {
    firstName: clientForm.getValues().firstName,
    surname: clientForm.getValues().surname,
    email: clientForm.getValues().email,
    phone: clientForm.getValues().phone,
    address: clientForm.getValues().address,
    idNumber: clientForm.getValues().idNumber,
    dateOfBirth: clientForm.getValues().dateOfBirth,
  } : null;
  
  // Handler for ID number change with auto-fill
  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idNumber = e.target.value;
    clientForm.setValue("idNumber", idNumber);
    
    if (idNumber.length === 13) {
      if (validateSouthAfricanID(idNumber)) {
        // Extract date of birth
        const dob = extractDateOfBirthFromID(idNumber);
        if (dob) {
          clientForm.setValue("dateOfBirth", dob);
        }
        
        // Extract gender if needed
        const gender = extractGenderFromID(idNumber);
        // Could set gender field if you have one
      }
    }
  };
  
  return (
    <div className="container mx-auto py-2 sm:py-4 px-2 sm:px-4 max-w-4xl">
      {/* Stepper with connecting lines between steps */}
      <div className="w-full mb-4 py-2">
        <div className="relative grid grid-cols-8 gap-1">
          {/* Connecting lines */}
          <div className="absolute top-3 sm:top-3.5 left-0 w-full z-0">
            <div className="relative mx-3 h-1 w-full bg-gray-200 rounded-full">
              <div 
                className="absolute h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(step - 1) * 100 / 7}%` }}
              />
            </div>
          </div>
          
          {[
            { num: 1, name: "Member" },
            { num: 2, name: "Children" },
            { num: 3, name: "Spouse" },
            { num: 4, name: "Extended" },
            { num: 5, name: "Beneficiary" },
            { num: 6, name: "Payment" },
            { num: 7, name: "Summary" },
            { num: 8, name: "Policy" }
          ].map(({ num: stepNumber, name }) => (
            <div 
              key={stepNumber}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-medium mb-1",
                  "border-2 border-white",  // Add border to make step indicator stand out
                  stepNumber === step 
                    ? "bg-primary text-white" 
                    : stepNumber < step 
                      ? "bg-primary/20 text-primary" 
                      : "bg-gray-100 text-gray-400"
                )}
              >
                {stepNumber}
              </div>
              <span 
                className={cn(
                  "text-[9px] xs:text-xs font-medium text-center",
                  stepNumber === step 
                    ? "text-primary" 
                    : stepNumber < step 
                      ? "text-primary/70" 
                      : "text-gray-400"
                )}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <Card className="shadow border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-3 sm:p-4 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">
                {step === 1 && "Policy and Main Member Details"}
                {step === 2 && "Children Details"}
                {step === 3 && "Spouse Details"}
                {step === 4 && "Extended Family Details"}
                {step === 5 && "Beneficiary Details"}
                {step === 6 && "Payment Details"}
                {step === 7 && "Policy Summary"}
                {step === 8 && "Policy Details"}
              </CardTitle>
              <CardDescription className="text-gray-500 mt-1 text-sm">
                {step === 1 && "Enter policy information and main member details"}
                {step === 2 && "Add your children as dependents (optional)"}
                {step === 3 && "Add your spouse as a dependent (optional)"}
                {step === 4 && "Add extended family members (optional)"}
                {step === 5 && "Add policy beneficiaries"}
                {step === 6 && "Enter payment method details"}
                {step === 7 && "Review your policy information"}
                {step === 8 && "Complete policy details and finalize application"}
              </CardDescription>
            </div>
          </div>
          
          <div className="mt-3 sm:mt-5 block">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {/* Progress bar without text labels */}
          </div>
        </CardHeader>
        
          {/* Step 1: Main Member */}
          {step === 1 && (
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
              <Form {...clientForm}>
                <div className="space-y-4 sm:space-y-5">
                  {/* Policy Info Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-2">
                    {/* Policy Number Field */}
                    <FormField
                      control={policyForm.control}
                      name="policyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. POL-12345" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Policy number for this application
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Agent Select Field */}
                    <FormField
                      control={policyForm.control}
                      name="agentId"
                      render={({ field }) => {
                        // Use the global agents data
                        const agents = allAgentsData;
                        const isLoadingAgents = !agents;
                        
                        return (
                          <FormItem>
                            <FormLabel>Agent</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value === "none" ? null : value ? Number(value) : null);
                              }}
                              value={field.value?.toString() || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select agent who sold the policy" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {!isLoadingAgents && agents?.map((agent) => (
                                  <SelectItem key={agent.id} value={agent.id.toString()}>
                                    {agent.firstName} {agent.surname}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  
                  {/* Main Member Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={clientForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={clientForm.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Doe" {...field} />
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
                          <FormLabel>South African ID Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="13-digit ID Number" 
                                {...field} 
                                onChange={handleIdNumberChange}
                              />
                              {field.value && field.value.length === 13 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {validateSouthAfricanID(field.value) ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Your date of birth will be auto-filled based on your ID
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={clientForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
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
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription className="text-xs">
                            Your date of birth from your ID
                          </FormDescription>
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
                            <div className="relative">
                              <Input 
                                placeholder="e.g. 0123456789" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  const phone = e.target.value;
                                  if (phone.length >= 10) {
                                    const isValid = validateSouthAfricanPhoneNumber(phone);
                                    setPhoneValidation({
                                      isValid,
                                      message: isValid ? "Valid South African phone number" : "Invalid South African phone number format"
                                    });
                                  } else if (phone.length > 0) {
                                    setPhoneValidation({
                                      isValid: null,
                                      message: "Enter complete phone number"
                                    });
                                  } else {
                                    setPhoneValidation({
                                      isValid: null,
                                      message: null
                                    });
                                  }
                                }}
                              />
                              {field.value && field.value.length > 0 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {phoneValidation.isValid === true && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  )}
                                  {phoneValidation.isValid === false && (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                  {phoneValidation.isValid === null && field.value.length > 0 && (
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {phoneValidation.message && (
                            <div className={`text-xs mt-1 ${
                              phoneValidation.isValid === true 
                                ? "text-green-600" 
                                : phoneValidation.isValid === false 
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }`}>
                              {phoneValidation.message}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={clientForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="e.g. john@example.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={clientForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Residential Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your full residential address" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Tips and guidance */}
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 text-sm">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      ID Number Tips
                    </h4>
                    <ul className="space-y-1 text-blue-700 text-xs sm:text-sm">
                      <li>All policy holders must have a valid South African ID number</li>
                      <li>South African ID validation automatically fills your date of birth</li>
                      <li>We will use this contact information for all policy communications</li>
                      <li>Please ensure your details are accurate to avoid claim processing delays</li>
                    </ul>
                  </div>
                </div>
              </Form>
            </div>
          </CardContent>
          )}
          
          {/* Step 2: Children */}
          {step === 2 && (
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Main Policy Holder</h3>
                    <p className="text-sm text-gray-600 mt-1">{clientForm.getValues().firstName} {clientForm.getValues().surname}</p>
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <Mail className="mr-1 h-3 w-3" />
                      {clientForm.getValues().email}
                    </div>
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <Phone className="mr-1 h-3 w-3" />
                      {clientForm.getValues().phone}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="mr-1 h-3 w-3" />
                    Information Saved
                  </Badge>
                </div>
              </div>
              
              {showDependentForm ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">Add a Child</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowDependentForm(false)}
                      className="h-8 px-2 text-gray-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                  
                  <Form {...childForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={childForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Mary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={childForm.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surname</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={childForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>South African ID Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="13-digit ID Number" 
                                  value={field.value || ''} 
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    if (e.target.value.length === 13) {
                                      const validation = validateAndAutoFillFromID(e.target.value, childForm);
                                      if (validation.isValid) {
                                        setChildIdValidation({ 
                                          isValid: true, 
                                          message: "Valid South African ID" 
                                        });
                                      } else {
                                        setChildIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number format or checksum" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setChildIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
                                      });
                                    } else {
                                      setChildIdValidation({ isValid: null, message: null });
                                    }
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {childIdValidation.isValid === true && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {childIdValidation.isValid === false && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {childIdValidation.isValid === null && field.value.length > 0 && (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {childIdValidation.message && (
                              <div className={`text-xs mt-1 ${
                                childIdValidation.isValid === true 
                                  ? "text-green-600" 
                                  : childIdValidation.isValid === false 
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}>
                                {childIdValidation.message}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={childForm.control}
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
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        type="button" 
                        onClick={() => childForm.handleSubmit(handleDependentSubmit)()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Save Child
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <Users className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-md font-medium text-gray-700 mb-1">Add Your Children</h3>
                  <p className="text-sm text-gray-500 mb-4 text-center">Would you like to add your children as dependents on this policy?</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => { 
                        setDependentType("child");
                        setShowDependentForm(true);
                      }}
                      className="border-primary text-primary hover:bg-primary/5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Child
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleDependentsStep}
                      className="text-gray-600"
                    >
                      Skip this step
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {dependents.filter(d => d.relationship === "child").length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-2">Added Children</h3>
                  <div className="space-y-2">
                    {dependents.filter(d => d.relationship === "child").map((dependent, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-primary/10 mr-3">
                            <Baby className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{dependent.firstName} {dependent.surname}</h4>
                            <p className="text-xs text-gray-500">
                              Child · {dependent.dateOfBirth ? format(new Date(dependent.dateOfBirth), "PP") : "Date of birth not provided"}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDependentFromList(dependents.indexOf(dependent))}
                          className="text-gray-500 hover:text-red-500 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          )}
          
          {/* Step 3: Spouse */}
          {step === 3 && (
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Main Policy Holder</h3>
                    <p className="text-sm text-gray-600 mt-1">{clientForm.getValues().firstName} {clientForm.getValues().surname}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dependents.filter(d => d.relationship === "spouse").length > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          <Heart className="mr-1 h-3 w-3" />
                          Spouse Added
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {showDependentForm ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">Add Spouse</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowDependentForm(false)}
                      className="h-8 px-2 text-gray-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                  
                  <Form {...spouseForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={spouseForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spouse's First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Jane" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={spouseForm.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spouse's Surname</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={spouseForm.control}
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
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        type="button" 
                        onClick={() => spouseForm.handleSubmit(handleDependentSubmit)()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Spouse
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <Heart className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-md font-medium text-gray-700 mb-1">Add Your Spouse</h3>
                  <p className="text-sm text-gray-500 mb-4 text-center">Would you like to add your spouse as a dependent on this policy?</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => { 
                        setDependentType("spouse");
                        setShowDependentForm(true);
                      }}
                      className="border-primary text-primary hover:bg-primary/5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Spouse
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleDependentsStep}
                      className="text-gray-600"
                    >
                      Skip this step
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {dependents.filter(d => d.relationship === "spouse").length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-2">Added Spouse</h3>
                  <div className="space-y-2">
                    {dependents.filter(d => d.relationship === "spouse").map((dependent, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-primary/10 mr-3">
                            <Heart className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{dependent.firstName} {dependent.surname}</h4>
                            <p className="text-xs text-gray-500">
                              Spouse · {dependent.dateOfBirth ? format(new Date(dependent.dateOfBirth), "PP") : "Date of birth not provided"}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDependentFromList(dependents.indexOf(dependent))}
                          className="text-gray-500 hover:text-red-500 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {dependents.filter(d => d.relationship === "child").length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-2">Added Children</h3>
                  <div className="space-y-2">
                    {dependents.filter(d => d.relationship === "child").map((dependent, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-primary/10 mr-3">
                            <Baby className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{dependent.firstName} {dependent.surname}</h4>
                            <p className="text-xs text-gray-500">
                              Child · {dependent.dateOfBirth ? format(new Date(dependent.dateOfBirth), "PP") : "Date of birth not provided"}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDependentFromList(dependents.indexOf(dependent))}
                          className="text-gray-500 hover:text-red-500 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          )}
          
          {/* Step 4: Extended Family */}
          {step === 4 && (
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Family Members</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {clientForm.getValues().firstName} {clientForm.getValues().surname}
                      {dependents.filter(d => d.relationship === "spouse").length > 0 ? 
                        ` + ${dependents.filter(d => d.relationship === "spouse")[0].firstName} ${dependents.filter(d => d.relationship === "spouse")[0].surname}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dependents.filter(d => d.relationship === "child").length > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          <Check className="mr-1 h-3 w-3" />
                          {dependents.filter(d => d.relationship === "child").length} Children
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {showDependentForm ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">Add Extended Family Member</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowDependentForm(false)}
                      className="h-8 px-2 text-gray-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                  
                  <Form {...extendedFamilyForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={extendedFamilyForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Mary" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={extendedFamilyForm.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surname</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Jones" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={extendedFamilyForm.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship to Main Member</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="parent-in-law">Parent-in-law</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="other">Other Family Member</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={extendedFamilyForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>South African ID Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="13-digit ID Number" 
                                  value={field.value || ''} 
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    if (e.target.value.length === 13) {
                                      const validation = validateAndAutoFillFromID(e.target.value, extendedFamilyForm);
                                      if (validation.isValid) {
                                        setExtendedIdValidation({ 
                                          isValid: true, 
                                          message: "Valid South African ID" 
                                        });
                                      } else {
                                        setExtendedIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number format or checksum" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setExtendedIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
                                      });
                                    } else {
                                      setExtendedIdValidation({ isValid: null, message: null });
                                    }
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {extendedIdValidation.isValid === true && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {extendedIdValidation.isValid === false && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {extendedIdValidation.isValid === null && field.value.length > 0 && (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {extendedIdValidation.message && (
                              <div className={`text-xs mt-1 ${
                                extendedIdValidation.isValid === true 
                                  ? "text-green-600" 
                                  : extendedIdValidation.isValid === false 
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}>
                                {extendedIdValidation.message}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={extendedFamilyForm.control}
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
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        type="button" 
                        onClick={() => extendedFamilyForm.handleSubmit(handleDependentSubmit)()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Family Member
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <Users className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-md font-medium text-gray-700 mb-1">Add Extended Family Members</h3>
                  <p className="text-sm text-gray-500 mb-4 text-center">Would you like to add parents, parents-in-law, or siblings to this policy?</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => { 
                        setDependentType("parent");
                        setShowDependentForm(true);
                      }}
                      className="border-primary text-primary hover:bg-primary/5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Family Member
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleDependentsStep}
                      className="text-gray-600"
                    >
                      Skip this step
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {dependents.filter(d => ["parent", "parent-in-law", "sibling", "other"].includes(d.relationship)).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-2">Added Extended Family</h3>
                  <div className="space-y-2">
                    {dependents
                      .filter(d => ["parent", "parent-in-law", "sibling", "other"].includes(d.relationship))
                      .map((dependent, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full bg-primary/10 mr-3">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{dependent.firstName} {dependent.surname}</h4>
                              <p className="text-xs text-gray-500 capitalize">
                                {dependent.relationship.replace('-', ' ')}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeDependentFromList(dependents.indexOf(dependent))}
                            className="text-gray-500 hover:text-red-500 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => { 
                        setDependentType("parent");
                        setShowDependentForm(true);
                      }}
                      className="border-primary text-primary hover:bg-primary/5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Family Member
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          )}
          
          {/* Step 5: Beneficiary */}
          {step === 5 && (
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Policy Members</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Main: {clientForm.getValues().firstName} {clientForm.getValues().surname}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dependents.filter(d => d.relationship === "spouse").length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        Spouse
                      </Badge>
                    )}
                    {dependents.filter(d => d.relationship === "child").length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        {dependents.filter(d => d.relationship === "child").length} Children
                      </Badge>
                    )}
                    {dependents.filter(d => ["parent", "parent-in-law", "sibling", "other"].includes(d.relationship)).length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <Check className="mr-1 h-3 w-3" />
                        {dependents.filter(d => ["parent", "parent-in-law", "sibling", "other"].includes(d.relationship)).length} Extended Family
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {showBeneficiaryForm ? (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">Add Beneficiary</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowBeneficiaryForm(false)}
                      className="h-8 px-2 text-gray-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                  
                  <Form {...beneficiaryForm}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={beneficiaryForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={beneficiaryForm.control}
                          name="surname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Surname</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={beneficiaryForm.control}
                          name="relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship to Main Member</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select relationship" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="child">Child</SelectItem>
                                  <SelectItem value="parent">Parent</SelectItem>
                                  <SelectItem value="sibling">Sibling</SelectItem>
                                  <SelectItem value="family">Other Family</SelectItem>
                                  <SelectItem value="friend">Friend</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={beneficiaryForm.control}
                          name="idNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>South African ID Number (Optional)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="13-digit ID Number" 
                                    value={field.value || ''} 
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      if (e.target.value.length === 13) {
                                        if (validateSouthAfricanID(e.target.value)) {
                                          setBeneficiaryIdValidation({ 
                                            isValid: true, 
                                            message: "Valid South African ID" 
                                          });
                                        } else {
                                          setBeneficiaryIdValidation({ 
                                            isValid: false, 
                                            message: "Invalid ID number" 
                                          });
                                        }
                                      } else if (e.target.value.length > 0) {
                                        setBeneficiaryIdValidation({ 
                                          isValid: null, 
                                          message: "Enter full 13-digit ID" 
                                        });
                                      } else {
                                        setBeneficiaryIdValidation({ isValid: null, message: null });
                                      }
                                    }}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                  {field.value && field.value.length > 0 && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      {beneficiaryIdValidation.isValid === true && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                      )}
                                      {beneficiaryIdValidation.isValid === false && (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                      )}
                                      {beneficiaryIdValidation.isValid === null && field.value.length > 0 && (
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              {beneficiaryIdValidation.message && (
                                <div className={`text-xs mt-1 ${
                                  beneficiaryIdValidation.isValid === true 
                                    ? "text-green-600" 
                                    : beneficiaryIdValidation.isValid === false 
                                      ? "text-red-600"
                                      : "text-amber-600"
                                }`}>
                                  {beneficiaryIdValidation.message}
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={beneficiaryForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number (Optional)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="e.g. 0123456789" 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      const phone = e.target.value;
                                      if (phone.length >= 10) {
                                        const isValid = validateSouthAfricanPhoneNumber(phone);
                                        setBeneficiaryPhoneValidation({
                                          isValid,
                                          message: isValid ? "Valid South African phone number" : "Invalid South African phone number format"
                                        });
                                      } else if (phone.length > 0) {
                                        setBeneficiaryPhoneValidation({
                                          isValid: null,
                                          message: "Enter complete phone number"
                                        });
                                      } else {
                                        setBeneficiaryPhoneValidation({
                                          isValid: null,
                                          message: null
                                        });
                                      }
                                    }}
                                  />
                                  {field.value && field.value.length > 0 && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      {beneficiaryPhoneValidation.isValid === true && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                      )}
                                      {beneficiaryPhoneValidation.isValid === false && (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                      )}
                                      {beneficiaryPhoneValidation.isValid === null && field.value.length > 0 && (
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              {beneficiaryPhoneValidation.message && (
                                <div className={`text-xs mt-1 ${
                                  beneficiaryPhoneValidation.isValid === true 
                                    ? "text-green-600" 
                                    : beneficiaryPhoneValidation.isValid === false 
                                      ? "text-red-600"
                                      : "text-amber-600"
                                }`}>
                                  {beneficiaryPhoneValidation.message}
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={beneficiaryForm.control}
                          name="percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Benefit Percentage</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type="number" 
                                    min="1"
                                    max="100"
                                    className="pr-10"
                                    placeholder="100"
                                    {...field}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 0;
                                      field.onChange(Math.max(1, Math.min(100, value)));
                                    }}
                                  />
                                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500">%</span>
                                  </div>
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                Percentage of the benefit to be paid to this beneficiary
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={beneficiaryForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Residential Address (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter address" 
                                  className="resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={() => beneficiaryForm.handleSubmit(handleBeneficiarySubmit)()}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Beneficiary
                        </Button>
                      </div>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50 mb-6">
                  <Heart className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-md font-medium text-gray-700 mb-1">Add Beneficiaries</h3>
                  <p className="text-sm text-gray-500 mb-4 text-center">Please add at least one beneficiary for this policy.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBeneficiaryForm(true)}
                    className="border-primary text-primary hover:bg-primary/5"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Beneficiary
                  </Button>
                </div>
              )}
              
              {beneficiaries.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">Added Beneficiaries</h3>
                  
                  <div className="space-y-3">
                    {beneficiaries.map((beneficiary, index) => (
                      <div key={index} className="flex justify-between items-start p-3 border rounded-md bg-white">
                        <div className="flex items-start">
                          <div className="p-2 rounded-full bg-primary/10 mr-3 mt-1">
                            <Heart className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-medium text-sm mr-2">{beneficiary.firstName} {beneficiary.surname}</h4>
                              <Badge className="bg-primary">{beneficiary.percentage || 100}%</Badge>
                            </div>
                            <p className="text-xs text-gray-500 capitalize mt-1">
                              {beneficiary.relationship}
                            </p>
                            {beneficiary.phone && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                {beneficiary.phone}
                              </div>
                            )}
                            {beneficiary.idNumber && (
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {beneficiary.idNumber}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeBeneficiaryFromList(index)}
                          className="text-gray-500 hover:text-red-500 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowBeneficiaryForm(true)}
                      className="border-primary text-primary hover:bg-primary/5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Beneficiary
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={handleDependentsStep}
                  disabled={beneficiaries.length === 0}
                  className="w-full"
                >
                  {beneficiaries.length === 0 ? (
                    "Please add at least one beneficiary"
                  ) : (
                    <>
                      Continue to Payment Details
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {beneficiaries.length === 0 && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    At least one beneficiary is required
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          )}
          
          {/* Step 6: Payment Details */}
          {step === 6 && (
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
              <Form {...bankDetailForm}>
                <div className="space-y-5">
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 text-blue-800 text-sm">
                    <h4 className="font-medium flex items-center mb-1">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      Payment Details
                    </h4>
                    <p className="text-xs sm:text-sm text-blue-700">
                      Select how you would like to pay for your policy. We offer bank debit orders, SASSA deductions, or PAY@ payment options.
                    </p>
                  </div>
                  
                  <FormField
                    control={bankDetailForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            <FormItem className="flex flex-col items-center space-y-3 p-4 border rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
                              <FormControl>
                                <RadioGroupItem value="bank" className="sr-only" />
                              </FormControl>
                              <Landmark className="h-6 w-6 text-primary" />
                              <FormLabel className="font-normal cursor-pointer text-center">
                                <div className="font-medium">Bank Debit Order</div>
                                <p className="text-xs text-gray-500 mt-1">Automatic monthly debit from your bank account</p>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex flex-col items-center space-y-3 p-4 border rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
                              <FormControl>
                                <RadioGroupItem value="sassa" className="sr-only" />
                              </FormControl>
                              <Shield className="h-6 w-6 text-primary" />
                              <FormLabel className="font-normal cursor-pointer text-center">
                                <div className="font-medium">SASSA Deduction</div>
                                <p className="text-xs text-gray-500 mt-1">Direct deduction from your SASSA grant</p>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex flex-col items-center space-y-3 p-4 border rounded-md shadow-sm cursor-pointer hover:bg-gray-50">
                              <FormControl>
                                <RadioGroupItem value="pay@" className="sr-only" />
                              </FormControl>
                              <svg className="h-6 w-6 text-primary" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
                                <path d="M25 2C12.317 2 2 12.317 2 25s10.317 23 23 23 23-10.317 23-23S37.683 2 25 2zm10 28h-7v7a3 3 0 0 1-6 0v-7h-7a3 3 0 0 1 0-6h7v-7a3 3 0 0 1 6 0v7h7a3 3 0 0 1 0 6z"/>
                              </svg>
                              <FormLabel className="font-normal cursor-pointer text-center">
                                <div className="font-medium">PAY@ Options</div>
                                <p className="text-xs text-gray-500 mt-1">Pay at any retail location with PAY@</p>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Payment method fields */}
                  <PaymentMethodForm form={bankDetailForm} clientName={`${clientData?.firstName} ${clientData?.surname}`} />
                  
                  <div className="p-3 sm:p-4 bg-amber-50 rounded-md border border-amber-200 text-amber-800 text-sm">
                    <h4 className="font-medium flex items-center mb-1">
                      <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                      Important Payment Terms
                    </h4>
                    <ul className="space-y-1 text-xs sm:text-sm text-amber-700 pl-6 list-disc">
                      <li>Premium payments are due monthly on your selected date.</li>
                      <li>Missed payments may result in a policy lapse after the grace period.</li>
                      <li>A 30-day grace period applies for late payments.</li>
                      <li>Policy will lapse if we're unable to collect premiums for 3 consecutive months.</li>
                    </ul>
                  </div>
                </div>
              </Form>
            </div>
          </CardContent>
          )}
          
          {/* Step 7: Policy Summary */}
          {step === 7 && (
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
                <h3 className="text-md font-medium text-blue-800 flex items-center">
                  <Info className="mr-2 h-5 w-5 text-blue-500" />
                  Review Your Policy Information
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Please review all the information below before finalizing your policy. You can go back to previous steps to make changes if needed.
                </p>
              </div>

              <div className="space-y-6">
                {/* Main Member Information */}
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <h3 className="text-md font-medium text-gray-800 flex items-center mb-3">
                    <User className="mr-2 h-5 w-5 text-primary" />
                    Main Member Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-sm text-gray-800">{clientForm.getValues().firstName} {clientForm.getValues().surname}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Policy Number</p>
                      <p className="text-sm text-gray-800">{policyForm.getValues().policyNumber || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Agent</p>
                      <p className="text-sm text-gray-800">
                        {(() => {
                          const agentId = policyForm.getValues().agentId;
                          // We'll use the global agents data from above
                          const agents = allAgentsData;
                          
                          if (agentId && agents && Array.isArray(agents)) {
                            const agent = agents.find((a: any) => a.id === agentId);
                            return agent ? `${agent.firstName} ${agent.surname}` : "Loading...";
                          }
                          return "None";
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">ID Number</p>
                      <p className="text-sm text-gray-800">{clientForm.getValues().idNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-sm text-gray-800">
                        {(() => {
                          const dob = clientForm.getValues().dateOfBirth;
                          return dob ? format(new Date(dob), "PP") : "Not specified";
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email Address</p>
                      <p className="text-sm text-gray-800">{clientForm.getValues().email || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <p className="text-sm text-gray-800">{clientForm.getValues().phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Residential Address</p>
                      <p className="text-sm text-gray-800">{clientForm.getValues().address}</p>
                    </div>
                  </div>
                </div>

                {/* Dependents Information */}
                {dependents.length > 0 && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h3 className="text-md font-medium text-gray-800 flex items-center mb-3">
                      <Users className="mr-2 h-5 w-5 text-primary" />
                      Dependents
                    </h3>
                    <div className="space-y-4">
                      {dependents.map((dependent, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between">
                            <div className="font-medium text-sm text-gray-700">
                              {dependent.firstName} {dependent.surname}
                            </div>
                            <Badge variant="outline" className="capitalize text-xs">
                              {dependent.relationship}
                            </Badge>
                          </div>
                          {dependent.idNumber && (
                            <div className="text-xs text-gray-600 mt-1">ID: {dependent.idNumber}</div>
                          )}
                          {dependent.dateOfBirth && (
                            <div className="text-xs text-gray-600">
                              Born: {format(new Date(dependent.dateOfBirth), "PP")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beneficiary Information */}
                {beneficiaries.length > 0 && (
                  <div className="bg-white p-4 rounded-md border border-gray-200">
                    <h3 className="text-md font-medium text-gray-800 flex items-center mb-3">
                      <Heart className="mr-2 h-5 w-5 text-primary" />
                      Beneficiaries
                    </h3>
                    <div className="space-y-4">
                      {beneficiaries.map((beneficiary, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between">
                            <div className="font-medium text-sm text-gray-700">
                              {beneficiary.firstName} {beneficiary.surname}
                            </div>
                            <div className="text-sm text-gray-600">
                              {beneficiary.percentage ? `${beneficiary.percentage}%` : "100%"}
                            </div>
                          </div>
                          {beneficiary.idNumber && (
                            <div className="text-xs text-gray-600 mt-1">ID: {beneficiary.idNumber}</div>
                          )}
                          {beneficiary.phone && (
                            <div className="text-xs text-gray-600">Phone: {beneficiary.phone}</div>
                          )}
                          {beneficiary.address && (
                            <div className="text-xs text-gray-600">Address: {beneficiary.address}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Details Information */}
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <h3 className="text-md font-medium text-gray-800 flex items-center mb-3">
                    <Landmark className="mr-2 h-5 w-5 text-primary" />
                    Payment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Type</p>
                      <p className="text-sm text-gray-800 capitalize">{bankDetailForm.getValues().paymentMethod}</p>
                    </div>
                    
                    {bankDetailForm.getValues().paymentMethod === "bank" && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Account Holder</p>
                          <p className="text-sm text-gray-800">{bankDetailForm.getValues().accountHolderName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Account Number</p>
                          <p className="text-sm text-gray-800">{bankDetailForm.getValues().accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Bank Name</p>
                          <p className="text-sm text-gray-800">{bankDetailForm.getValues().bankName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Branch Code</p>
                          <p className="text-sm text-gray-800">{bankDetailForm.getValues().branchCode}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Account Type</p>
                          <p className="text-sm text-gray-800">{bankDetailForm.getValues().accountType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Debit Date</p>
                          <p className="text-sm text-gray-800">{bankDetailForm.getValues().debitDate}st of each month</p>
                        </div>
                      </>
                    )}
                    
                    {bankDetailForm.getValues().paymentMethod === "sassa" && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">SASSA Number</p>
                        <p className="text-sm text-gray-800">{bankDetailForm.getValues().sassaNumber}</p>
                      </div>
                    )}
                    
                    {bankDetailForm.getValues().paymentMethod === "pay@" && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Preferred Store</p>
                        <p className="text-sm text-gray-800">{bankDetailForm.getValues().preferredStore || "Any store"}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          )}
          
          {/* Step 8: Policy Details */}
          {step === 8 && (
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div>
              <Form {...policyForm}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={policyForm.control}
                    name="policyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. POL-12345" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Enter a unique policy number for this policy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={policyForm.control}
                    name="agentId"
                    render={({ field }) => {
                      const { data: agents, isLoading: isLoadingAgents } = useQuery<any[]>({
                        queryKey: ["/api/agents"],
                      });
                      
                      return (
                        <FormItem>
                          <FormLabel>Agent</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              // Properly handle "none" as null
                              field.onChange(value === "none" ? null : value ? Number(value) : null);
                            }}
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select agent who sold the policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {!isLoadingAgents && agents?.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.firstName} {user.surname}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Select the agent who sold this policy
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  
                  <FormField
                    control={policyForm.control}
                    name="policyTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Type</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select policy type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {renderPolicyTypes()}
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
                        <FormLabel>Premium Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                            <Input 
                              type="number"
                              className="pl-8"
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                            />
                          </div>
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
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-3 gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="monthly" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Monthly
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="quarterly" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Quarterly
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="annually" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Annually
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Capture Date is managed by the API */}
                </div>
                
                {/* Date fields are managed by the API */}
                <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 text-blue-800 text-sm">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Dates are auto-managed</p>
                      <p className="mt-1 text-xs sm:text-sm text-blue-700">
                        Inception date and capture date will be automatically set when the policy is created.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="text-sm sm:text-md font-medium mb-1 sm:mb-2">Policy Status</h4>
                  <div className="flex items-center flex-wrap gap-2">
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                      Pending
                    </Badge>
                    <p className="text-xs sm:text-sm text-gray-500">
                      All new policies are created with a pending status.
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <h4 className="text-sm sm:text-md font-medium mb-1 sm:mb-2">Summary</h4>
                  <div className="rounded-md border border-gray-200 p-3 sm:p-4 space-y-1 sm:space-y-2 text-xs sm:text-sm bg-white">
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Policy Number:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">
                        {policyForm.watch('policyNumber') || "Not entered"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Agent:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">
                        {(() => {
                          const agentId = policyForm.watch('agentId');
                          // Use the global agents data
                          const agents = allAgentsData;
                          
                          if (agentId && agents && Array.isArray(agents)) {
                            const agent = agents.find(a => a.id === agentId);
                            return agent ? `${agent.firstName} ${agent.surname}` : "Loading...";
                          }
                          return "None";
                        })()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Policy Type:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">
                        {(() => {
                          const policyTypeId = policyForm.watch('policyTypeId');
                          if (policyTypeId && policyTypes && Array.isArray(policyTypes)) {
                            const policyType = policyTypes.find((t: any) => t?.id === policyTypeId);
                            return policyType ? String(policyType.name || 'Unknown policy') : "Not selected";
                          }
                          return "Not selected";
                        })()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Main Member:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">{`${clientForm.watch('firstName')} ${clientForm.watch('surname')}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Dependents:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">{dependents.filter(d => d.relationship !== "beneficiary").length} added</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Beneficiaries:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">
                        {beneficiaries.length > 0 ? `${beneficiaries.length} added` : "None added"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Premium:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">
                        R {(() => {
                          const premium = policyForm.watch('premium');
                          return premium ? Number(premium).toFixed(2) : '0.00';
                        })()} per {policyForm.watch('frequency') || 'monthly'}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Bank Account:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">
                        {(() => {
                          const bankName = bankDetailForm.watch('bankName');
                          const accountNumber = bankDetailForm.watch('accountNumber');
                          return bankName && accountNumber 
                            ? `${bankName} - ${accountNumber}` 
                            : "Not provided";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </Form>
            </div>
          </CardContent>
          )}
        
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between p-3 sm:p-4 md:p-6 gap-3 bg-gray-50 border-t border-gray-200">
          <div className="w-full sm:w-auto">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="text-xs sm:text-sm w-full sm:w-auto"
                size="sm"
                aria-label="Previous step"
              >
                <ChevronLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </Button>
            )}
          </div>
          <div className="w-full sm:w-auto">
            {step === 1 && (
              <Button 
                type="button" 
                onClick={handleClientStep}
                disabled={createClient.isPending}
                className="text-xs sm:text-sm w-full sm:w-auto"
                size="sm"
                aria-label="Next step"
              >
                {createClient.isPending ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </>
                )}
              </Button>
            )}
            {(step === 2 || step === 3 || step === 4 || step === 5) && (
              <Button 
                type="button" 
                onClick={handleDependentsStep}
                className="text-xs sm:text-sm w-full sm:w-auto"
                size="sm"
                aria-label="Next step"
              >
                <span>Next</span>
                <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
            {step === 6 && (
              <Button 
                type="button" 
                onClick={handleBankDetailsStep}
                disabled={createBankDetail.isPending}
                className="text-xs sm:text-sm w-full sm:w-auto"
                size="sm"
                aria-label="Next step"
              >
                {createBankDetail.isPending ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </>
                )}
              </Button>
            )}
            {step === 7 && (
              <Button 
                type="button" 
                onClick={() => setStep(8)}
                className="text-xs sm:text-sm w-full sm:w-auto"
                size="sm"
                aria-label="Next step"
              >
                <span>Continue to Policy Details</span>
                <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
            {step === 8 && (
              <Button
                type="button"
                onClick={handlePolicyDetailsStep}
                disabled={createPolicyWithDependents.isPending}
                className="text-xs sm:text-sm bg-primary hover:bg-primary/90 w-full sm:w-auto"
                size="sm"
                aria-label="Complete application"
              >
                {createPolicyWithDependents.isPending ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="hidden sm:inline">Creating Policy...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Complete Application</span>
                    <span className="sm:hidden">Complete</span>
                    <CheckCircle2 className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
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