import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { insertPolicySchema, insertClientSchema, insertDependentSchema, insertBankDetailSchema } from "@shared/schema";
import { apiRequest } from "@/services/queryClient";
import { validateSouthAfricanID, getDateOfBirthFromIDNumber, getGenderFromIDNumber } from "@/utils";
import { 
  AlertCircle, BadgeCheck, CalendarIcon, ChevronRight, ChevronLeft, CheckCircle2, Check, Plus, X, 
  User, Users, CreditCard, Mail, Phone, MapPin, FileText, Heart, Gift, 
  Landmark, Baby, FileCheck, Loader2, Star, ShieldCheck, Store, Info, XCircle
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/features/data/components/ui/card";
import { Button } from "@/features/data/components/ui/button";
import { ToastAction } from "@/features/data/components/ui/toast";
import { Input } from "@/features/data/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/data/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/features/data/components/ui/form";
import { Separator } from "@/features/data/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/data/components/ui/popover";
import { Calendar } from "@/features/data/components/ui/calendar";
import { cn } from "@/utils";
import { useToast, toast as showToast } from "@/hooks/use-toast";
import { Textarea } from "@/features/data/components/ui/textarea";
import { Badge } from "@/features/data/components/ui/badge";
import { Checkbox } from "@/features/data/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/features/data/components/ui/radio-group";
import { Label } from "@/features/data/components/ui/label";

// Helper function to determine if a field is required
const isFieldRequired = (fieldName: string): boolean => {
  // Common required fields for most forms
  const commonRequiredFields: Record<string, boolean> = {
    // Client form required fields
    "name": true,
    "idNumber": true,
    "dateOfBirth": true,
    "phone": true,
    "address": true,
    
    // Bank details required fields (for bank payment method)
    "paymentMethod": true,
    "accountHolderName": true,
    "accountNumber": true,
    "bankName": true,
    "branchCode": true,
    "accountType": true,
    "debitDate": true,
    
    // Policy form required fields
    "policyTypeId": true,
    "premium": true,
    "frequency": true,
    "policyNumber": true,
    
    // Dependent/Beneficiary form required fields
    "relationship": true
  };
  
  // Email is not required
  if (fieldName === "email") return false;
  
  // Return based on common required fields
  return commonRequiredFields[fieldName] || false;
};

// Required asterisk component
const RequiredAsterisk = () => <span className="text-red-500 ml-0.5">*</span>;

// Modified policy form schema with policy number field and with status hardcoded to "pending"
const policyFormSchema = insertPolicySchema.extend({
  premium: z.number().min(1, "Premium must be at least 1"),
  clientId: z.number().optional(), // Will be populated from client creation or selection
  policyTypeId: z.number().min(1, "Please select a policy type"),
  agentId: z.number().nullable().optional(), // Agent who sold the policy
  policyNumber: z.string().min(3, "Policy number is required"),
  // Status will always be "pending" for new policies
  status: z.string().default("pending").optional(),
  frequency: z.string().min(1, "Please select a payment frequency"),
}).omit({ 
  renewalDate: true,
  captureDate: true, 
  inceptionDate: true 
}); // Remove date fields as they will be set by the API

// Client form schema
const clientFormSchema = insertClientSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  idNumber: z.string()
    .min(13, "South African ID number must be 13 digits")
    .max(13, "South African ID number must be 13 digits")
    .regex(/^\d+$/, "ID number should only contain digits")
    .refine((val) => validateSouthAfricanID(val), "Invalid South African ID number (Luhn algorithm checksum failed)"),
  dateOfBirth: z.date().nullable(),
});

// Dependent form schema
const dependentFormSchema = insertDependentSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  relationship: z.string().min(1, "Please select a relationship"),
  idNumber: z.string().nullable().optional()
    .refine(
      (val) => !val || validateSouthAfricanID(val), 
      "If provided, ID number must be a valid South African ID"
    ),
  dateOfBirth: z.date().nullable().optional(),
  clientId: z.number().optional(), // Will be populated from client creation or selection
  // Additional fields for beneficiaries
  percentage: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Bank details form schema
const bankDetailFormSchema = insertBankDetailSchema.extend({
  paymentMethod: z.enum(["bank", "sassa", "pay@"]),
  // Bank fields (required if paymentMethod is 'bank')
  accountHolderName: z.string().min(2, "Account holder name must be at least 2 characters").optional(),
  accountNumber: z.string().min(5, "Account number must be at least 5 characters").optional(),
  bankName: z.string().min(2, "Bank name must be at least 2 characters").optional(),
  branchCode: z.string().min(4, "Branch code must be at least 4 characters").optional(),
  accountType: z.string().min(1, "Please select an account type").optional(),
  debitDate: z.number().min(1, "Please select a debit date").max(31).optional(),
  // SASSA fields (optional)
  sassaNumber: z.string().min(5, "SASSA number must be at least 5 characters").optional(),
  // Pay@ fields (optional)
  preferredStore: z.string().optional(),
  isDefault: z.boolean().default(true),
  clientId: z.number().optional(), // Will be populated from client creation or selection
});

// Note: This local function is not used anymore as we now use the utility function from utils.ts
// const validateSouthAfricanIDLocal = (idNumber: string) => {
//   // This function has been replaced with the utility function
// };

// Main component
export function PolicySignupForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // State management
  const [step, setStep] = useState(1);
  const [createdClientId, setCreatedClientId] = useState<number | null>(null);
  const [dependents, setDependents] = useState<Array<any>>([]);
  const [beneficiaries, setBeneficiaries] = useState<Array<any>>([]);
  const [dependentType, setDependentType] = useState<string>("spouse");
  const [showDependentForm, setShowDependentForm] = useState(false);
  
  // ID Validation states
  const [mainIdValidation, setMainIdValidation] = useState<{ isValid: boolean | null, message: string | null }>({ isValid: null, message: null });
  const [spouseIdValidation, setSpouseIdValidation] = useState<{ isValid: boolean | null, message: string | null }>({ isValid: null, message: null });
  const [parentIdValidation, setParentIdValidation] = useState<{ isValid: boolean | null, message: string | null }>({ isValid: null, message: null });
  const [extendedFamilyIdValidation, setExtendedFamilyIdValidation] = useState<{ isValid: boolean | null, message: string | null }>({ isValid: null, message: null });
  const [beneficiaryIdValidation, setBeneficiaryIdValidation] = useState<{ isValid: boolean | null, message: string | null }>({ isValid: null, message: null });
  const [bankOptions, setBankOptions] = useState([
    { name: "ABSA Bank", code: "632005" },
    { name: "Capitec Bank", code: "470010" },
    { name: "FNB", code: "250655" },
    { name: "Nedbank", code: "198765" },
    { name: "Standard Bank", code: "051001" },
    { name: "Discovery Bank", code: "679000" }
  ]);
  const [selectedBank, setSelectedBank] = useState<{ name: string, code: string } | null>(null);
  
  // Fetch policy types
  const { data: policyTypes, isLoading: isLoadingPolicyTypes } = useQuery<any[]>({
    queryKey: ["/api/policy-types"],
  });
  
  // Form initialization
  const clientForm = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      idNumber: "",
      dateOfBirth: null,
    },
  });
  
  const spouseForm = useForm<z.infer<typeof dependentFormSchema>>({
    resolver: zodResolver(dependentFormSchema),
    defaultValues: {
      name: "",
      relationship: "spouse",
      idNumber: null,
      dateOfBirth: null,
    },
  });
  
  const childForm = useForm<z.infer<typeof dependentFormSchema>>({
    resolver: zodResolver(dependentFormSchema),
    defaultValues: {
      name: "",
      relationship: "child",
      idNumber: null,
      dateOfBirth: null,
    },
  });
  
  const parentForm = useForm<z.infer<typeof dependentFormSchema>>({
    resolver: zodResolver(dependentFormSchema),
    defaultValues: {
      name: "",
      relationship: "parent",
      idNumber: null,
      dateOfBirth: null,
    },
  });
  
  const extendedFamilyForm = useForm<z.infer<typeof dependentFormSchema>>({
    resolver: zodResolver(dependentFormSchema),
    defaultValues: {
      name: "",
      relationship: "extendedFamily",
      idNumber: null,
      dateOfBirth: null,
    },
  });
  
  const beneficiaryForm = useForm<z.infer<typeof dependentFormSchema>>({
    resolver: zodResolver(dependentFormSchema),
    defaultValues: {
      name: "",
      relationship: "beneficiary",
      idNumber: null,
      dateOfBirth: null,
      percentage: "",
      phone: "",
      address: "",
    },
  });
  
  const bankDetailForm = useForm<z.infer<typeof bankDetailFormSchema>>({
    resolver: zodResolver(bankDetailFormSchema),
    defaultValues: {
      paymentMethod: "bank",
      accountHolderName: "",
      accountNumber: "",
      bankName: "",
      branchCode: "",
      accountType: "",
      debitDate: 1,
      sassaNumber: "",
      preferredStore: "",
      isDefault: true,
    },
  });
  
  // Generate a random policy number with format CS-YYYY-XXXXXX
  const generatePolicyNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    return `CS-${year}-${random}`;
  };

  const policyForm = useForm<z.infer<typeof policyFormSchema>>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      premium: 0,
      policyTypeId: 0,
      policyNumber: generatePolicyNumber(),
      agentId: null,
      status: "pending",
      frequency: "monthly",
      // Date fields will be set by the API
    },
  });
  
  // Update created client ID in dependent forms
  useEffect(() => {
    if (createdClientId) {
      spouseForm.setValue("clientId", createdClientId);
      childForm.setValue("clientId", createdClientId);
      parentForm.setValue("clientId", createdClientId);
      extendedFamilyForm.setValue("clientId", createdClientId);
      beneficiaryForm.setValue("clientId", createdClientId);
      bankDetailForm.setValue("clientId", createdClientId);
      policyForm.setValue("clientId", createdClientId);
    }
  }, [createdClientId]);
  
  // ID validation and auto-filling
  const validateAndAutoFillFromID = (idNumber: string, form: any) => {
    // Check if the ID is valid using the Luhn algorithm
    const isValid = validateSouthAfricanID(idNumber);
    
    // Get date of birth and gender if the ID is valid
    const birthDate = getDateOfBirthFromIDNumber(idNumber);
    const gender = getGenderFromIDNumber(idNumber);
    
    // Make sure we return an object with isValid, birthDate, gender, etc.
    // Here isValid is a boolean property
    const validationResult = {
      isValid: isValid, // The boolean result from validateSouthAfricanID
      birthDate,
      gender,
      idNumber
    };
    
    // Auto-fill the date of birth if valid
    if (isValid && birthDate) {
      form.setValue("dateOfBirth", birthDate);
    }
    
    return validationResult;
  };
  
  // Client creation mutation
  const createClient = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedClientId(data.id);
      toast({
        title: "Client Created",
        description: "Client information has been saved successfully.",
      });
      setStep(2);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create client: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Bank details creation mutation
  const createBankDetail = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bank-details", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bank Details Saved",
        description: "Bank details have been saved successfully.",
      });
      // Move to policy summary page (step 7)
      setStep(7);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save bank details: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Dependent creation mutation
  const createDependent = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/dependents", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Dependent Added",
        description: "Dependent has been added successfully.",
      });
      setDependents([...dependents, data]);
      setShowDependentForm(false);
      
      // Reset the appropriate form based on the dependent type
      if (dependentType === "spouse") {
        spouseForm.reset({
          name: "",
          relationship: "spouse",
          idNumber: null,
          dateOfBirth: null,
          clientId: createdClientId || undefined,
        });
      } else if (dependentType === "child") {
        childForm.reset({
          name: "",
          relationship: "child",
          idNumber: null,
          dateOfBirth: null,
          clientId: createdClientId || undefined,
        });
      } else if (dependentType === "parent") {
        parentForm.reset({
          name: "",
          relationship: "parent",
          idNumber: null,
          dateOfBirth: null,
          clientId: createdClientId || undefined,
        });
      } else if (dependentType === "extendedFamily") {
        extendedFamilyForm.reset({
          name: "",
          relationship: "extendedFamily",
          idNumber: null,
          dateOfBirth: null,
          clientId: createdClientId || undefined,
        });
      } else if (dependentType === "beneficiary") {
        beneficiaryForm.reset({
          name: "",
          relationship: "beneficiary",
          idNumber: null,
          dateOfBirth: null,
          clientId: createdClientId || undefined,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add dependent: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Policy creation with dependents
  const createPolicyWithDependents = useMutation({
    mutationFn: async (policyData: any) => {
      // First create the policy
      const policyRes = await apiRequest("POST", "/api/policies", policyData);
      const policy = await policyRes.json();
      
      // Then add all dependents to the policy
      const policyDependents = dependents.map((dependent) => ({
        policyId: policy.id,
        dependentId: dependent.id,
        coveragePercentage: dependent.relationship === "beneficiary" ? 100 : 100,
      }));
      
      for (const pd of policyDependents) {
        await apiRequest("POST", "/api/policy-dependents", pd);
      }
      
      return policy;
    },
    onSuccess: (data) => {
      toast({
        title: "Policy Created",
        description: "Policy has been created successfully with all dependents.",
      });
      navigate("/policies");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create policy: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submissions
  const handleClientStep = (e: React.MouseEvent) => {
    e.preventDefault();
    clientForm.handleSubmit((data) => {
      createClient.mutate(data);
    })();
  };
  
  const handleDependentSubmit = (data: any) => {
    data.clientId = createdClientId;
    createDependent.mutate(data);
  };
  
  const handleDependentsStep = () => {
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
  
  const handleBankDetailsStep = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!createdClientId) {
      toast({
        title: "Error",
        description: "Client information is missing. Please go back and complete the client details.",
        variant: "destructive",
      });
      return;
    }
    
    // Get form data
    const formData = bankDetailForm.getValues();
    
    // Add clientId to the data
    const dataWithClientId = {
      ...formData,
      clientId: createdClientId
    };
    
    // Submit the data - the success handler in the mutation will move to the policy summary step
    createBankDetail.mutate(dataWithClientId);
  };
  
  const handlePolicyDetailsStep = (e: React.MouseEvent) => {
    e.preventDefault();
    policyForm.handleSubmit((data) => {
      // Add date fields that are needed by the API
      const policyData = {
        ...data,
        captureDate: new Date(),
        inceptionDate: new Date(),
        renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Set renewal to 1 year from now
      };
      
      // Submit policy data with dates
      createPolicyWithDependents.mutate(policyData);
    })();
  };
  
  const removeDependentFromList = (index: number) => {
    const newDependents = [...dependents];
    newDependents.splice(index, 1);
    setDependents(newDependents);
  };
  
  const removeBeneficiaryFromList = (index: number) => {
    const newBeneficiaries = [...beneficiaries];
    newBeneficiaries.splice(index, 1);
    setBeneficiaries(newBeneficiaries);
  };
  
  const handleBeneficiarySubmit = (data: any) => {
    data.clientId = createdClientId;
    setBeneficiaries([...beneficiaries, data]);
    setShowDependentForm(false);
    
    beneficiaryForm.reset({
      name: "",
      relationship: "beneficiary",
      idNumber: null,
      dateOfBirth: null,
      percentage: "",
      phone: "",
      address: "",
      clientId: createdClientId || undefined,
    });
  };
  
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  const getFormForDependentType = (type: string) => {
    switch (type) {
      case "spouse":
        return {
          form: spouseForm,
          title: "Add Spouse",
          description: "Add your spouse's details",
        };
      case "child":
        return {
          form: childForm,
          title: "Add Child",
          description: "Add your child's details",
        };
      case "parent":
        return {
          form: parentForm,
          title: "Add Parent",
          description: "Add your parent's details",
        };
      case "extendedFamily":
        return {
          form: extendedFamilyForm,
          title: "Add Extended Family Member",
          description: "Add your extended family member's details",
        };
      case "beneficiary":
        return {
          form: beneficiaryForm,
          title: "Add Beneficiary",
          description: "Add your beneficiary's details (who receives the payout)",
        };
      default:
        return {
          form: spouseForm,
          title: "Add Spouse",
          description: "Add your spouse's details",
        };
    }
  };

  // Get current form based on dependent type
  const { form: currentDependentForm, title: formTitle, description: formDescription } = getFormForDependentType(dependentType);

  // Steps progress indicators
  const stepTitles = [
    "Main Member",
    "Children",
    "Spouse",
    "Extended Family",
    "Beneficiary",
    "Payment Method",
    "Policy Summary",
    "Policy Details"
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6 px-2">
        <div className="flex justify-between relative mb-1">
          {stepTitles.map((title, index) => (
            <div 
              key={index}
              className={`z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all ${
                index + 1 === step 
                  ? "bg-primary text-white" 
                  : index + 1 < step 
                    ? "bg-green-100 text-green-800 border border-green-300" 
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {index + 1 < step ? <Check className="h-4 w-4" /> : index + 1}
            </div>
          ))}
          <div className="absolute h-0.5 bg-gray-200 top-4 left-0 right-0 -translate-y-1/2 z-0"></div>
        </div>
        <div className="hidden sm:flex justify-between text-xs text-gray-600 px-0.5">
          {stepTitles.map((title, index) => (
            <div 
              key={index} 
              className={`text-center transition-all ${
                index + 1 === step ? "text-primary font-medium" : ""
              }`}
              style={{ width: `${100 / stepTitles.length}%`, maxWidth: "100px" }}
            >
              {title}
            </div>
          ))}
        </div>
      </div>

      {/* Main Card */}
      <Card className="shadow-md border-gray-200 bg-white">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              {step === 1 && <User className="h-5 w-5" />}
              {(step === 2 || step === 3 || step === 4) && <Users className="h-5 w-5" />}
              {step === 5 && <Heart className="h-5 w-5" />}
              {step === 6 && <Landmark className="h-5 w-5" />}
              {step === 7 && <FileText className="h-5 w-5" />}
              {step === 8 && <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-lg text-gray-800">
                {step === 1 && "Main Member Information"}
                {step === 2 && "Children Information"}
                {step === 3 && "Spouse Information"}
                {step === 4 && "Extended Family Information"}
                {step === 5 && "Beneficiary Information"}
                {step === 6 && "Payment Method"}
                {step === 7 && "Policy Summary"}
                {step === 8 && "Policy Details"}
              </CardTitle>
              <CardDescription className="text-gray-500 mt-1">
                {step === 1 && "Provide the main policyholder's personal information"}
                {step === 2 && "Add children as dependents if applicable"}
                {step === 3 && "Add spouse details if applicable"}
                {step === 4 && "Add extended family members if applicable"}
                {step === 5 && "Add beneficiaries who will receive the policy payout"}
                {step === 6 && "Choose your preferred payment method for premium collection"}
                {step === 7 && "Review all information before finalizing"}
                {step === 8 && "Select policy type and coverage details"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {/* Step 1: Main Member Information */}
          {step === 1 && (
            <CardContent className="p-4 sm:p-6">
              <div>
                <Form {...clientForm}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={clientForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name {isFieldRequired('name') && <RequiredAsterisk />}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. John Doe" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                          Enter a unique policy number
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
                        queryKey: ["/api/users"],
                      });
                      
                      return (
                        <FormItem>
                          <FormLabel>Agent</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              // Properly handle "none" as null
                              field.onChange(value === "none" ? null : value ? Number(value) : null);
                            }}
                            value={field.value?.toString() || "none"}
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
                                  {user.name}
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
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value.length === 13) {
                                  const validation = validateAndAutoFillFromID(e.target.value, clientForm);
                                  if (validation.isValid) {
                                    setMainIdValidation({ 
                                      isValid: true, 
                                      message: "Valid South African ID" 
                                    });
                                  } else {
                                    setMainIdValidation({ 
                                      isValid: false, 
                                      message: "Invalid ID number format or checksum" 
                                    });
                                  }
                                } else if (e.target.value.length > 0) {
                                  setMainIdValidation({ 
                                    isValid: null, 
                                    message: "Enter full 13-digit ID number" 
                                  });
                                } else {
                                  setMainIdValidation({ isValid: null, message: null });
                                }
                              }}
                            />
                            {field.value && field.value.length > 0 && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {mainIdValidation.isValid === true && (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                )}
                                {mainIdValidation.isValid === false && (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                {mainIdValidation.isValid === null && field.value.length > 0 && (
                                  <AlertCircle className="h-5 w-5 text-amber-500" />
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        {mainIdValidation.message && (
                          <div className={`text-xs mt-1 ${
                            mainIdValidation.isValid === true 
                              ? "text-green-600" 
                              : mainIdValidation.isValid === false 
                                ? "text-red-600"
                                : "text-amber-600"
                          }`}>
                            {mainIdValidation.message}
                          </div>
                        )}
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
                  
                  <FormField
                    control={clientForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input 
                              className="pl-10" 
                              placeholder="email@example.com" 
                              {...field} 
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
                    control={clientForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input 
                              className="pl-10" 
                              placeholder="+27 12 345 6789" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={clientForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residential Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input 
                              className="pl-10" 
                              placeholder="123 Main St, City" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="text-sm font-medium mb-2 flex items-center text-gray-700">
                    <FileCheck className="mr-2 h-4 w-4 text-primary" />
                    <span>Important Information</span>
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-gray-600">
                    <li>All information provided will be verified</li>
                    <li>South African ID validation automatically fills your date of birth</li>
                    <li>We will use this contact information for all policy communications</li>
                    <li>Please ensure your details are accurate to avoid claim processing delays</li>
                  </ul>
                </div>
              </Form>
            </div>
          </CardContent>
          )}
          
          {/* Step 2: Children Information */}
          {step === 2 && (
            <div>
              <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Main Policy Holder</h3>
                    <p className="text-sm text-gray-600 mt-1">{clientForm.getValues().name}</p>
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
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={spouseForm.control}
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
                                      const validation = validateAndAutoFillFromID(e.target.value, spouseForm);
                                      if (validation.isValid) {
                                        setSpouseIdValidation({ 
                                          isValid: true, 
                                          message: "Valid South African ID" 
                                        });
                                      } else {
                                        setSpouseIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number format or checksum" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setSpouseIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
                                      });
                                    } else {
                                      setSpouseIdValidation({ isValid: null, message: null });
                                    }
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {spouseIdValidation.isValid === true && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {spouseIdValidation.isValid === false && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {spouseIdValidation.isValid === null && field.value.length > 0 && (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {spouseIdValidation.message && (
                              <div className={`text-xs mt-1 ${
                                spouseIdValidation.isValid === true 
                                  ? "text-green-600" 
                                  : spouseIdValidation.isValid === false 
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}>
                                {spouseIdValidation.message}
                              </div>
                            )}
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
                  <Users className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-md font-medium text-gray-700 mb-1">Add Your Spouse</h3>
                  <p className="text-sm text-gray-500 mb-4 text-center">Would you like to add your spouse as a dependent on this policy?</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDependentForm(true)}
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
                            <h4 className="font-medium text-sm">{dependent.name}</h4>
                            <p className="text-xs text-gray-500">Spouse</p>
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
          )}
          
          {/* Step 3: Spouse Information */}
          {step === 3 && (
            <div>
              <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Main Policy Holder</h3>
                    <p className="text-sm text-gray-600 mt-1">{clientForm.getValues().name}</p>
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
                    <h3 className="text-md font-medium">Add Child</h3>
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
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Child's Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. James Doe" {...field} />
                            </FormControl>
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
                        Add Child
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <Baby className="h-10 w-10 text-gray-400 mb-3" />
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-medium">Added Children</h3>
                    {!showDependentForm && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setDependentType("child");
                          setShowDependentForm(true);
                        }}
                        className="h-8"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Another
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dependents.filter(d => d.relationship === "child").map((dependent, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-primary/10 mr-3">
                            <Baby className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{dependent.name}</h4>
                            <p className="text-xs text-gray-500">
                              {dependent.dateOfBirth ? format(new Date(dependent.dateOfBirth), "PP") : "Child"}
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
          )}
          
          {/* Step 4: Extended Family & Beneficiaries */}
          {step === 4 && (
            <div>
              <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Main Policy Holder</h3>
                    <p className="text-sm text-gray-600 mt-1">{clientForm.getValues().name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dependents.filter(d => d.relationship === "spouse").length > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          <Heart className="mr-1 h-3 w-3" />
                          {dependents.filter(d => d.relationship === "spouse").length} Spouse
                        </Badge>
                      )}
                      {dependents.filter(d => d.relationship === "child").length > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          <Baby className="mr-1 h-3 w-3" />
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
                    <h3 className="text-md font-medium">Add Parent</h3>
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
                  
                  <Form {...parentForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={parentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent's Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Mary Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={parentForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>South African ID Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="13-digit ID Number (optional)" 
                                  value={field.value || ''} 
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    if (e.target.value.length === 13) {
                                      const validation = validateAndAutoFillFromID(e.target.value, parentForm);
                                      if (validation.isValid) {
                                        setParentIdValidation({ 
                                          isValid: true, 
                                          message: "Valid South African ID" 
                                        });
                                      } else {
                                        setParentIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number format or checksum" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setParentIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
                                      });
                                    } else {
                                      setParentIdValidation({ isValid: null, message: null });
                                    }
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {parentIdValidation.isValid === true && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {parentIdValidation.isValid === false && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {parentIdValidation.isValid === null && field.value.length > 0 && (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {parentIdValidation.message && (
                              <div className={`text-xs mt-1 ${
                                parentIdValidation.isValid === true 
                                  ? "text-green-600" 
                                  : parentIdValidation.isValid === false 
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}>
                                {parentIdValidation.message}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={parentForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col mt-4">
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
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        type="button" 
                        onClick={() => parentForm.handleSubmit(handleDependentSubmit)()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parent
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <Users className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-md font-medium text-gray-700 mb-1">Add Your Parents</h3>
                  <p className="text-sm text-gray-500 mb-4 text-center">Would you like to add your parents as dependents on this policy?</p>
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
                      Add Parent
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
              
              {dependents.filter(d => d.relationship === "parent").length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-md font-medium">Added Parents</h3>
                    {!showDependentForm && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setDependentType("parent");
                          setShowDependentForm(true);
                        }}
                        className="h-8"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Another
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dependents.filter(d => d.relationship === "parent").map((dependent, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-primary/10 mr-3">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{dependent.name}</h4>
                            <p className="text-xs text-gray-500">
                              {dependent.dateOfBirth ? format(new Date(dependent.dateOfBirth), "PP") : "Parent"}
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
          )}
          
          {/* Step 5: Beneficiary Information */}
          {step === 5 && (
            <div>
              <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Main Policy Holder</h3>
                    <p className="text-sm text-gray-600 mt-1">{clientForm.getValues().name}</p>
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
                    <h3 className="text-md font-medium">Add Beneficiary</h3>
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
                  
                  <Form {...beneficiaryForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={beneficiaryForm.control}
                        name="name"
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
                        control={beneficiaryForm.control}
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
                                      const validation = validateAndAutoFillFromID(e.target.value, beneficiaryForm);
                                      if (validation.isValid) {
                                        setBeneficiaryIdValidation({ 
                                          isValid: true, 
                                          message: "Valid South African ID" 
                                        });
                                      } else {
                                        setBeneficiaryIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number format or checksum" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setBeneficiaryIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
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
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={beneficiaryForm.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship to Policyholder</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
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
                        name="percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allocation Percentage</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. 50" 
                                {...field} 
                                type="number"
                                min="0"
                                max="100"
                              />
                            </FormControl>
                            <FormDescription>
                              Percentage of the policy payout allocated to this beneficiary
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={beneficiaryForm.control}
                        name="percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allocation Percentage</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  className="pl-10" 
                                  placeholder="e.g. 100" 
                                  type="number"
                                  min="1"
                                  max="100"
                                  {...field} 
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</div>
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              Total allocation should equal 100% across all beneficiaries
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={beneficiaryForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input 
                                  className="pl-10" 
                                  placeholder="+27 12 345 6789" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={beneficiaryForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Residential Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input 
                                  className="pl-10" 
                                  placeholder="123 Main St, City" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        type="button" 
                        onClick={() => beneficiaryForm.handleSubmit(handleBeneficiarySubmit)()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Beneficiary
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <Heart className="h-10 w-10 text-gray-400 mb-3" />
                  <h3 className="text-md font-medium text-gray-700 mb-1">Add Beneficiaries</h3>
                  <p className="text-sm text-gray-500 mb-4 text-center">Add people who should receive the policy payout in the event of a claim</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDependentForm(true)}
                      className="border-primary text-primary hover:bg-primary/5"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Beneficiary
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
              
              {beneficiaries.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium">Added Beneficiaries</h3>
                    <div className="text-xs text-gray-500">
                      Total Allocation: <span className="font-semibold">{beneficiaries.reduce((sum, b) => sum + Number(b.percentage || 0), 0)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {beneficiaries.map((beneficiary, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-primary/10 mr-3">
                            <Heart className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{beneficiary.name}</h4>
                            <div className="flex space-x-2 text-xs text-gray-500">
                              <span>{capitalizeFirstLetter(beneficiary.relationship || "")}</span>
                              <span>•</span>
                              <span>{beneficiary.percentage}% allocation</span>
                            </div>
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
                  
                  {beneficiaries.reduce((sum, b) => sum + Number(b.percentage || 0), 0) !== 100 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-800 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                      Total allocation must equal 100%. Currently at {beneficiaries.reduce((sum, b) => sum + Number(b.percentage || 0), 0)}%.
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-8 border-t pt-6 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(4)}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (beneficiaries.length === 0) {
                      toast({
                        title: "No beneficiaries added",
                        description: "Are you sure you want to continue without adding any beneficiaries?",
                        action: (
                          <ToastAction altText="Continue" onClick={() => setStep(6)}>
                            Continue
                          </ToastAction>
                        ),
                      });
                    } else if (beneficiaries.reduce((sum, b) => sum + Number(b.percentage || 0), 0) !== 100) {
                      toast({
                        title: "Invalid allocation percentage",
                        description: "Total allocation percentage must equal 100%",
                        variant: "destructive"
                      });
                    } else {
                      setStep(6);
                    }
                  }}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 6: Banking Details */}
          {step === 6 && (
            <div>
              <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Dependents Summary</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dependents.filter(d => d.relationship === "spouse").length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        <Heart className="mr-1 h-3 w-3" />
                        {dependents.filter(d => d.relationship === "spouse").length} Spouse
                      </Badge>
                    )}
                    {dependents.filter(d => d.relationship === "child").length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <Baby className="mr-1 h-3 w-3" />
                        {dependents.filter(d => d.relationship === "child").length} Children
                      </Badge>
                    )}
                    {dependents.filter(d => d.relationship === "parent").length > 0 && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                        <Users className="mr-1 h-3 w-3" />
                        {dependents.filter(d => d.relationship === "parent").length} Parents
                      </Badge>
                    )}
                    {dependents.filter(d => d.relationship === "extendedFamily").length > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                        <Users className="mr-1 h-3 w-3" />
                        {dependents.filter(d => d.relationship === "extendedFamily").length} Extended Family
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Extended Family Members</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { 
                        setDependentType("extendedFamily");
                        setShowDependentForm(true);
                      }}
                      className="h-8"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Member
                    </Button>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-gray-50 h-40 overflow-y-auto">
                    {dependents.filter(d => d.relationship === "extendedFamily").length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <Users className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No extended family members added</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dependents.filter(d => d.relationship === "extendedFamily").map((dependent, index) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                            <div className="flex items-center">
                              <div className="p-1.5 rounded-full bg-amber-50 mr-2">
                                <Users className="h-3.5 w-3.5 text-amber-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{dependent.name}</h4>
                                <p className="text-xs text-gray-500">Extended Family</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeDependentFromList(dependents.indexOf(dependent))}
                              className="text-gray-500 hover:text-red-500 h-7 w-7 p-0"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium">Beneficiaries</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { 
                        setDependentType("beneficiary");
                        setShowDependentForm(true);
                      }}
                      className="h-8"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Beneficiary
                    </Button>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-gray-50 h-40 overflow-y-auto">
                    {dependents.filter(d => d.relationship === "beneficiary").length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <Star className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No beneficiaries added</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dependents.filter(d => d.relationship === "beneficiary").map((dependent, index) => (
                          <div key={index} className="flex justify-between items-center p-3 border rounded-md bg-white">
                            <div className="flex items-center">
                              <div className="p-1.5 rounded-full bg-primary/10 mr-2">
                                <Star className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{dependent.name}</h4>
                                <p className="text-xs text-gray-500">Beneficiary</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeDependentFromList(dependents.indexOf(dependent))}
                              className="text-gray-500 hover:text-red-500 h-7 w-7 p-0"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {showDependentForm && (
                <div className="mb-4 border p-4 rounded-md bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">{formTitle}</h3>
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
                  
                  <Form {...currentDependentForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={currentDependentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. John Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={currentDependentForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of Birth (Optional)</FormLabel>
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
                    
                    <div className="mt-4">
                      {dependentType === "beneficiary" && (
                        <div className="p-3 bg-gray-50 rounded-md border text-xs text-gray-600 mb-4">
                          <p className="font-medium text-gray-800 mb-1">Important Note</p>
                          <p>Beneficiaries will receive the policy payout in the event of the main member's death. You can add multiple beneficiaries.</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        type="button" 
                        onClick={() => currentDependentForm.handleSubmit(handleDependentSubmit)()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add {dependentType === "extendedFamily" ? "Family Member" : dependentType}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
              
              <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                <h4 className="text-sm font-medium mb-2 flex items-center text-gray-700">
                  <FileCheck className="mr-2 h-4 w-4 text-primary" />
                  <span>Next Steps: Bank Details</span>
                </h4>
                <p className="text-xs text-gray-600">
                  Once you've finished adding your extended family members and beneficiaries, the next step will be to provide your banking details for premium collection.
                </p>
              </div>
            </div>
          )}
          
          {/* Banking Form Section - Combined with Step 6 above */}
              <Form {...bankDetailForm}>
                <div className="mb-6">
                  <h3 className="text-base font-medium mb-4">Select Your Payment Method</h3>
                  
                  <FormField
                    control={bankDetailForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value} 
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2 p-4 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                              <RadioGroupItem value="bank" id="bank" />
                              <Label htmlFor="bank" className="flex items-center cursor-pointer">
                                <Landmark className="h-5 w-5 text-primary mr-2" />
                                <div>
                                  <span className="font-medium">Bank Debit Order</span>
                                  <p className="text-xs text-gray-500">Set up an automatic debit order from your bank account</p>
                                </div>
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2 p-4 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                              <RadioGroupItem value="sassa" id="sassa" />
                              <Label htmlFor="sassa" className="flex items-center cursor-pointer">
                                <BadgeCheck className="h-5 w-5 text-green-600 mr-2" />
                                <div>
                                  <span className="font-medium">SASSA Grant Deduction</span>
                                  <p className="text-xs text-gray-500">Deduct premium payments from your SASSA social grant</p>
                                </div>
                              </Label>
                            </div>
                            
                            <div className="flex items-center space-x-2 p-4 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                              <RadioGroupItem value="pay@" id="pay@" />
                              <Label htmlFor="pay@" className="flex items-center cursor-pointer">
                                <Store className="h-5 w-5 text-blue-600 mr-2" />
                                <div>
                                  <span className="font-medium">PAY@ Retail Stores</span>
                                  <p className="text-xs text-gray-500">Make payments at participating retail stores nationwide</p>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Bank Debit Order Fields */}
                {bankDetailForm.watch("paymentMethod") === "bank" && (
                  <div className="border rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium mb-4 flex items-center">
                      <Landmark className="mr-2 h-4 w-4 text-primary" />
                      <span>Bank Account Details</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={bankDetailForm.control}
                        name="accountHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Holder Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. John Doe" {...field} />
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
                              <Input placeholder="e.g. 1234567890" {...field} />
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
                            <FormLabel>Bank Name</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                const bank = bankOptions.find(b => b.name === value);
                                if (bank) {
                                  setSelectedBank(bank);
                                  bankDetailForm.setValue("branchCode", bank.code);
                                }
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your bank" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {bankOptions.map((bank) => (
                                  <SelectItem key={bank.name} value={bank.name}>
                                    {bank.name}
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
                        name="branchCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. 632005" 
                                {...field}
                                value={selectedBank ? selectedBank.code : field.value}
                                disabled={!!selectedBank}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={bankDetailForm.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="savings">Savings Account</SelectItem>
                                <SelectItem value="cheque">Cheque Account</SelectItem>
                                <SelectItem value="credit">Credit Account</SelectItem>
                                <SelectItem value="transmission">Transmission Account</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bankDetailForm.control}
                        name="debitDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit Date</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select debit date" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                  <SelectItem key={day} value={day.toString()}>
                                    {day}th of each month
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={bankDetailForm.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Use as Default Account</FormLabel>
                            <FormDescription className="text-xs">
                              This account will be used for premium collections and claim payouts
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {/* SASSA Fields */}
                {bankDetailForm.watch("paymentMethod") === "sassa" && (
                  <div className="border rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium mb-4 flex items-center">
                      <BadgeCheck className="mr-2 h-4 w-4 text-green-600" />
                      <span>SASSA Grant Details</span>
                    </h4>
                    
                    <FormField
                      control={bankDetailForm.control}
                      name="sassaNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SASSA Grant Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your SASSA grant number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">
                          Your premium will be deducted from your SASSA social grant payment on the date you receive your grant each month. This requires authorization from SASSA which will be processed after policy creation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* PAY@ Fields */}
                {bankDetailForm.watch("paymentMethod") === "pay@" && (
                  <div className="border rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium mb-4 flex items-center">
                      <Store className="mr-2 h-4 w-4 text-blue-600" />
                      <span>PAY@ Retail Payment</span>
                    </h4>
                    
                    <FormField
                      control={bankDetailForm.control}
                      name="preferredStore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Store (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your preferred store" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="shoprite">Shoprite</SelectItem>
                              <SelectItem value="checkers">Checkers</SelectItem>
                              <SelectItem value="usave">USave</SelectItem>
                              <SelectItem value="pick-n-pay">Pick n Pay</SelectItem>
                              <SelectItem value="boxer">Boxer</SelectItem>
                              <SelectItem value="pep">PEP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800">
                          <p className="mb-1">You'll receive a PAY@ reference number with your policy documents that you can use to make payments at any of these participating retailers:</p>
                          <ul className="list-disc list-inside pl-1 space-y-0.5">
                            <li>Shoprite, Checkers & USave</li>
                            <li>Pick n Pay & Boxer</li>
                            <li>PEP stores</li>
                            <li>And many other retail outlets nationwide</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="text-sm font-medium mb-1 sm:mb-2 flex items-center">
                    <FileCheck className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                    <span>Important Payment Information</span>
                  </h4>
                  <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm text-gray-600 space-y-1">
                    <li>Ensure all payment details are accurate to avoid policy lapses.</li>
                    <li>Payment methods can be updated at any time by contacting our support team.</li>
                    <li>For funeral policies, claim payments will typically be made to your specified bank account.</li>
                    <li>Policy will lapse if we're unable to collect premiums for 3 consecutive months.</li>
                  </ul>
                </div>
              </Form>
            </div>
          </CardContent>
          )}
          
          {/* Step 7: Policy Summary */}
          {step === 7 && (
            <CardContent className="p-4 sm:p-6">
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
                      <p className="text-sm text-gray-800">{clientForm.getValues().name}</p>
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
                          const { data: agents } = useQuery<any[]>({
                            queryKey: ["/api/users"],
                            enabled: !!agentId
                          });
                          
                          if (agentId && agents) {
                            const agent = agents.find(a => a.id === agentId);
                            return agent ? agent.name : "Loading...";
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
                            <div className="font-medium text-sm text-gray-700">{dependent.name}</div>
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
                            <div className="font-medium text-sm text-gray-700">{beneficiary.name}</div>
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

                {/* Payment Method Information */}
                <div className="bg-white p-4 rounded-md border border-gray-200">
                  <h3 className="text-md font-medium text-gray-800 flex items-center mb-3">
                    <Landmark className="mr-2 h-5 w-5 text-primary" />
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payment Method</p>
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
            <CardContent className="p-4 sm:p-6">
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
                        queryKey: ["/api/users"],
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
                                  {user.name}
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
                            {policyTypes && Array.isArray(policyTypes) && policyTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name} - R{type.basePremium ? type.basePremium.toFixed(2) : '0.00'}/month
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
                          const { data: agents } = useQuery<any[]>({
                            queryKey: ["/api/users"],
                            enabled: !!agentId
                          });
                          
                          if (agentId && agents) {
                            const agent = agents.find(a => a.id === agentId);
                            return agent ? agent.name : "Loading...";
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
                            const policyType = policyTypes.find((t: any) => t.id === policyTypeId);
                            return policyType ? policyType.name : "Not selected";
                          }
                          return "Not selected";
                        })()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="text-gray-600">Main Member:</span>
                      <span className="font-medium truncate max-w-[60%] text-right">{clientForm.watch('name')}</span>
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
        
        <CardFooter className="flex justify-between px-3 sm:px-6 gap-2 bg-gray-50 border-t border-gray-200">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="text-xs sm:text-sm"
                size="sm"
                aria-label="Previous step"
              >
                <ChevronLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </Button>
            )}
          </div>
          <div>
            {step === 1 && (
              <Button 
                type="button" 
                onClick={handleClientStep}
                disabled={createClient.isPending}
                className="text-xs sm:text-sm"
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
                className="text-xs sm:text-sm"
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
                className="text-xs sm:text-sm"
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
                className="text-xs sm:text-sm"
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
                className="text-xs sm:text-sm bg-primary hover:bg-primary/90"
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