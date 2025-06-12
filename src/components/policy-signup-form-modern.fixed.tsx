import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { insertPolicySchema, insertClientSchema, insertDependentSchema, insertBankDetailSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { validateSouthAfricanID, getDateOfBirthFromIDNumber, getGenderFromIDNumber } from "@/lib/utils";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
  Users,
  X,
  XCircle
} from "lucide-react";

const RequiredAsterisk = () => <span className="text-red-500 ml-1">*</span>;

const emptyClient = {
  name: "",
  email: "",
  phone: "",
  address: "",
  idNumber: "",
  dateOfBirth: null
};

const emptyDependent = {
  name: "",
  idNumber: "",
  dateOfBirth: null,
  relationshipToClient: "",
};

const emptyBankDetail = {
  bankName: "",
  accountNumber: "",
  accountType: "",
  branchCode: "",
  accountHolder: "",
  debitDay: "1",
  collectionFrequency: "Monthly",
  isDefault: true
};

// Define the policyType for validation
const policyTypes = ["Family Plan", "Pensioner Plan"];
const coverLevels = [5000, 10000, 15000, 20000, 25000, 30000];
const paymentMethods = ["Debit Order", "SASSA", "PAY@", "EFT"];

// The main form component
export function PolicySignupForm() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Form state management
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState(null);
  const [spouseDependentId, setSpouseDependentId] = useState(null);
  const [bankDetailId, setBankDetailId] = useState(null);
  const [policyCreated, setPolicyCreated] = useState(false);
  const [showPolicySuccessMessage, setShowPolicySuccessMessage] = useState(false);
  
  // Dependent form visibility state
  const [showDependentForm, setShowDependentForm] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showExtendedFamilyForm, setShowExtendedFamilyForm] = useState(false);
  const [showBeneficiaryForm, setShowBeneficiaryForm] = useState(false);
  
  // Form state for validation indicators
  const [mainIdValidation, setMainIdValidation] = useState({ isValid: null, message: null });
  const [dependentIdValidation, setDependentIdValidation] = useState({ isValid: null, message: null });
  
  // Dependent data collections
  const [childrenData, setChildrenData] = useState([]);
  const [extendedFamilyData, setExtendedFamilyData] = useState([]);
  const [beneficiariesData, setBeneficiariesData] = useState([]);
  
  // Extend schema for main form validation
  const clientSchema = insertClientSchema.extend({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
    address: z.string().min(5, { message: "Address must be at least 5 characters" }),
    idNumber: z.string().length(13, { message: "ID number must be exactly 13 digits" })
      .refine(
        (value) => validateSouthAfricanID(value),
        { message: "Invalid South African ID number" }
      ),
  });
  
  // Define form for client data
  const clientForm = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyClient,
  });
  
  // Form for policy data
  const policySchema = insertPolicySchema.extend({
    policyType: z.enum(["Family Plan", "Pensioner Plan"], {
      required_error: "You must select a policy type",
    }),
    coverAmount: z.coerce.number({
      required_error: "You must select a cover amount",
    }).min(5000, { message: "Minimum cover amount is R5,000" }),
    paymentMethod: z.enum(["Debit Order", "SASSA", "PAY@", "EFT"], {
      required_error: "You must select a payment method",
    }),
    premiumAmount: z.coerce.number().optional(),
    startDate: z.date({ required_error: "Start date is required" }),
    policyNumber: z.string().min(3, { message: "Policy number must be at least 3 characters" }),
    agentId: z.number().nullable().optional()
  });
  
  const policyForm = useForm({
    resolver: zodResolver(policySchema),
    defaultValues: {
      policyType: "Family Plan",
      coverAmount: 5000,
      paymentMethod: "Debit Order",
      premiumAmount: 0,
      startDate: new Date(),
      policyNumber: `POL-${Math.floor(1000 + Math.random() * 9000)}`,
      agentId: null
    },
  });
  
  // Form for dependent data (spouse, children, extended family)
  const dependentSchema = insertDependentSchema.extend({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    idNumber: z.string().length(13, { message: "ID number must be exactly 13 digits" })
      .refine(
        (value) => validateSouthAfricanID(value),
        { message: "Invalid South African ID number" }
      ),
    relationshipToClient: z.string().min(1, { message: "Relationship is required" }),
  });
  
  const spouseForm = useForm({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      ...emptyDependent,
      relationshipToClient: "Spouse"
    },
  });
  
  const childForm = useForm({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      ...emptyDependent,
      relationshipToClient: "Child"
    },
  });
  
  const extendedFamilyForm = useForm({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      ...emptyDependent,
      relationshipToClient: "Parent"
    },
  });
  
  const beneficiaryForm = useForm({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      ...emptyDependent,
      relationshipToClient: "Beneficiary"
    },
  });
  
  // Form for bank details
  const bankDetailSchema = insertBankDetailSchema.extend({
    bankName: z.string().min(2, { message: "Bank name must be at least 2 characters" }),
    accountNumber: z.string().min(5, { message: "Account number must be at least 5 characters" }),
    accountType: z.string().min(2, { message: "Account type is required" }),
    branchCode: z.string().min(4, { message: "Branch code must be at least 4 characters" }),
    accountHolder: z.string().min(2, { message: "Account holder name must be at least 2 characters" }),
    debitDay: z.string().min(1, { message: "Debit day is required" }),
    collectionFrequency: z.string().min(1, { message: "Collection frequency is required" }),
  });
  
  const bankDetailForm = useForm({
    resolver: zodResolver(bankDetailSchema),
    defaultValues: emptyBankDetail,
  });
  
  // Effect to calculate premium based on policy type and cover amount
  useEffect(() => {
    const policyType = policyForm.watch("policyType");
    const coverAmount = policyForm.watch("coverAmount");
    
    if (policyType && coverAmount) {
      let rate = policyType === "Family Plan" ? 0.015 : 0.025;
      const premium = (coverAmount * rate).toFixed(2);
      policyForm.setValue("premiumAmount", parseFloat(premium));
    }
  }, [policyForm.watch("policyType"), policyForm.watch("coverAmount")]);
  
  // Helper function for field requirement check
  const isFieldRequired = (fieldName) => {
    return fieldName in clientSchema.shape && !("optional" in clientSchema.shape[fieldName]._def);
  };
  
  // Handler to check ID number and auto-fill date of birth
  const validateAndAutoFillFromID = (idNumber, form) => {
    const isValid = validateSouthAfricanID(idNumber);
    
    if (isValid) {
      const dob = getDateOfBirthFromIDNumber(idNumber);
      const gender = getGenderFromIDNumber(idNumber);
      
      if (dob) {
        form.setValue("dateOfBirth", dob);
      }
    }
    
    return { isValid };
  };
  
  // Create client mutation
  const createClient = useMutation({
    mutationFn: async (data) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: (response) => {
      const clientData = response.data;
      setClientId(clientData.id);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setStep(2);
    },
    onError: (error) => {
      console.error("Error creating client:", error);
    }
  });
  
  // Create dependent mutation
  const createDependent = useMutation({
    mutationFn: async (data) => {
      return apiRequest("POST", "/api/dependents", {
        ...data,
        clientId,
      });
    },
    onSuccess: (response, variables) => {
      const dependentData = response.data;
      
      // Handle different dependent types
      if (variables.relationshipToClient === "Spouse") {
        setSpouseDependentId(dependentData.id);
        spouseForm.reset(emptyDependent);
        setShowDependentForm(false);
      } else if (variables.relationshipToClient === "Child") {
        setChildrenData([...childrenData, dependentData]);
        childForm.reset({...emptyDependent, relationshipToClient: "Child"});
        setShowChildForm(false);
      } else if (variables.relationshipToClient === "Beneficiary") {
        setBeneficiariesData([...beneficiariesData, dependentData]);
        beneficiaryForm.reset({...emptyDependent, relationshipToClient: "Beneficiary"});
        setShowBeneficiaryForm(false);
      } else {
        setExtendedFamilyData([...extendedFamilyData, dependentData]);
        extendedFamilyForm.reset({...emptyDependent, relationshipToClient: "Parent"});
        setShowExtendedFamilyForm(false);
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/dependents`] });
    },
    onError: (error) => {
      console.error("Error creating dependent:", error);
    }
  });
  
  // Remove dependent from list 
  const removeDependent = (id, type) => {
    if (type === "child") {
      setChildrenData(childrenData.filter(child => child.id !== id));
    } else if (type === "extended") {
      setExtendedFamilyData(extendedFamilyData.filter(member => member.id !== id));
    } else if (type === "beneficiary") {
      setBeneficiariesData(beneficiariesData.filter(beneficiary => beneficiary.id !== id));
    }
  };
  
  // Create bank detail mutation
  const createBankDetail = useMutation({
    mutationFn: async (data) => {
      return apiRequest("POST", "/api/bank-details", {
        ...data,
        clientId,
      });
    },
    onSuccess: (response) => {
      const bankDetailData = response.data;
      setBankDetailId(bankDetailData.id);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/bank-details`] });
      setStep(7);
    },
    onError: (error) => {
      console.error("Error creating bank detail:", error);
    }
  });
  
  // Create policy with dependents mutation
  const createPolicyWithDependents = useMutation({
    mutationFn: async (data) => {
      // First create the policy
      const policyResponse = await apiRequest("POST", "/api/policies", {
        ...data,
        clientId,
      });
      
      const policyId = policyResponse.data.id;
      
      // Now add the spouse as a policy dependent if exists
      if (spouseDependentId) {
        await apiRequest("POST", "/api/policy-dependents", {
          policyId,
          dependentId: spouseDependentId,
          coveragePercentage: 100,
        });
      }
      
      // Add children
      for (const child of childrenData) {
        await apiRequest("POST", "/api/policy-dependents", {
          policyId,
          dependentId: child.id,
          coveragePercentage: 75,
        });
      }
      
      // Add extended family members
      for (const member of extendedFamilyData) {
        await apiRequest("POST", "/api/policy-dependents", {
          policyId,
          dependentId: member.id,
          coveragePercentage: 50,
        });
      }
      
      return policyResponse;
    },
    onSuccess: (response) => {
      const policyData = response.data;
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      setPolicyCreated(true);
      setShowPolicySuccessMessage(true);
      setTimeout(() => {
        navigate("/policies");
      }, 3000);
    },
    onError: (error) => {
      console.error("Error creating policy:", error);
    }
  });
  
  // Step handlers
  const handleClientStep = () => {
    clientForm.handleSubmit((data) => {
      createClient.mutate(data);
    })();
  };
  
  const handleDependentsStep = () => {
    if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
    else if (step === 5) setStep(6);
  };
  
  const handleAddSpouse = () => {
    spouseForm.handleSubmit((data) => {
      createDependent.mutate(data);
    })();
  };
  
  const handleAddChild = () => {
    childForm.handleSubmit((data) => {
      createDependent.mutate(data);
    })();
  };
  
  const handleAddExtendedFamily = () => {
    extendedFamilyForm.handleSubmit((data) => {
      createDependent.mutate(data);
    })();
  };
  
  const handleAddBeneficiary = () => {
    beneficiaryForm.handleSubmit((data) => {
      createDependent.mutate(data);
    })();
  };
  
  const handleBankDetailsStep = () => {
    bankDetailForm.handleSubmit((data) => {
      createBankDetail.mutate(data);
    })();
  };
  
  const handlePolicyDetailsStep = () => {
    policyForm.handleSubmit((data) => {
      createPolicyWithDependents.mutate(data);
    })();
  };
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Card className="shadow-md border-gray-200 bg-white">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">
                Policy Signup
              </CardTitle>
              <CardDescription className="text-gray-500 mt-1">
                {step === 1 && "Enter main member information"}
                {step === 2 && "Enter children information"}
                {step === 3 && "Enter spouse information"}
                {step === 4 && "Enter extended family information"}
                {step === 5 && "Enter beneficiary information"}
                {step === 6 && "Enter payment details"}
                {step === 7 && "Review policy summary"}
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
          <CardContent className="p-4 sm:p-6">
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
              
              {showChildForm ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">Add Child</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowChildForm(false)}
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
                              <Input placeholder="e.g. John Doe Jr." {...field} />
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
                            <FormLabel>Child's ID Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="13-digit ID Number" 
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.length === 13) {
                                      const validation = validateAndAutoFillFromID(e.target.value, childForm);
                                      
                                      // Check if age is less than 21 for children
                                      let isValidAge = true;
                                      if (validation.isValid && childForm.getValues().dateOfBirth) {
                                        const dob = childForm.getValues().dateOfBirth;
                                        const today = new Date();
                                        const age = today.getFullYear() - dob.getFullYear();
                                        if (age >= 21) {
                                          isValidAge = false;
                                        }
                                      }
                                      
                                      if (validation.isValid && isValidAge) {
                                        setDependentIdValidation({ 
                                          isValid: true, 
                                          message: "Valid ID for child" 
                                        });
                                      } else if (!validation.isValid) {
                                        setDependentIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number" 
                                        });
                                      } else if (!isValidAge) {
                                        setDependentIdValidation({ 
                                          isValid: false, 
                                          message: "Person is older than 21 years" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setDependentIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
                                      });
                                    } else {
                                      setDependentIdValidation({ isValid: null, message: null });
                                    }
                                  }}
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {dependentIdValidation.isValid === true && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {dependentIdValidation.isValid === false && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {dependentIdValidation.isValid === null && field.value.length > 0 && (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {dependentIdValidation.message && (
                              <div className={`text-xs mt-1 ${
                                dependentIdValidation.isValid === true 
                                  ? "text-green-600" 
                                  : dependentIdValidation.isValid === false 
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}>
                                {dependentIdValidation.message}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        type="button" 
                        onClick={handleAddChild}
                        className="w-full"
                        disabled={createDependent.isPending}
                      >
                        {createDependent.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <User className="mr-2 h-4 w-4" />
                            Add Child to Policy
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium">Children</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setShowChildForm(true);
                        setDependentIdValidation({ isValid: null, message: null });
                      }}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span>Add Child</span>
                    </Button>
                  </div>
                  
                  {childrenData.length > 0 ? (
                    <div className="space-y-2">
                      {childrenData.map((child, index) => (
                        <div key={child.id || index} className="flex items-center justify-between border p-3 rounded-md">
                          <div>
                            <p className="font-medium text-sm">{child.name}</p>
                            <p className="text-xs text-gray-500">ID: {child.idNumber}</p>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeDependent(child.id, "child")}
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No children added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Click the button above to add children to this policy</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-3 sm:p-4 bg-amber-50 rounded-md border border-amber-200 mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center text-amber-800">
                  <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Important Notes</span>
                </h4>
                <ul className="list-disc pl-5 text-xs text-amber-700">
                  <li>Children under 21 years are covered at a reduced premium</li>
                  <li>Full-time students up to 25 years can be included with proof of enrollment</li>
                  <li>Proper identification is required for all children</li>
                  <li>You can proceed without adding children and add them later</li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
          
        {/* Step 3: Spouse Information */}
        {step === 3 && (
          <CardContent className="p-4 sm:p-6">
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
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.length === 13) {
                                      const validation = validateAndAutoFillFromID(e.target.value, spouseForm);
                                      if (validation.isValid) {
                                        setDependentIdValidation({ 
                                          isValid: true, 
                                          message: "Valid South African ID" 
                                        });
                                      } else {
                                        setDependentIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number format or checksum" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setDependentIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
                                      });
                                    } else {
                                      setDependentIdValidation({ isValid: null, message: null });
                                    }
                                  }}
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {dependentIdValidation.isValid === true && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {dependentIdValidation.isValid === false && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {dependentIdValidation.isValid === null && field.value.length > 0 && (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {dependentIdValidation.message && (
                              <div className={`text-xs mt-1 ${
                                dependentIdValidation.isValid === true 
                                  ? "text-green-600" 
                                  : dependentIdValidation.isValid === false 
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}>
                                {dependentIdValidation.message}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        type="button" 
                        onClick={handleAddSpouse}
                        className="w-full"
                        disabled={createDependent.isPending}
                      >
                        {createDependent.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <User className="mr-2 h-4 w-4" />
                            Add Spouse to Policy
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium">Spouse Information</h3>
                    {!spouseDependentId && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setShowDependentForm(true);
                          setDependentIdValidation({ isValid: null, message: null });
                        }}
                        className="h-8"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        <span>Add Spouse</span>
                      </Button>
                    )}
                  </div>
                  
                  {spouseDependentId ? (
                    <div className="border p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{spouseForm.getValues().name}</p>
                          <p className="text-xs text-gray-500">ID: {spouseForm.getValues().idNumber}</p>
                        </div>
                        <Badge className="bg-blue-50 border-blue-200 text-blue-700">Spouse</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No spouse added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Click the button above to add a spouse to this policy</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center text-blue-800">
                  <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                  <span>Important Information</span>
                </h4>
                <ul className="list-disc pl-5 text-xs text-blue-700">
                  <li>Spouse is covered at 100% of the main member's benefit amount</li>
                  <li>Legal marriage certificate or proof of customary union may be required at claim stage</li>
                  <li>Only one spouse can be added per policy</li>
                  <li>You can proceed without adding a spouse and add them later</li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
          
        {/* Step 4: Extended Family */}
        {step === 4 && (
          <CardContent className="p-4 sm:p-6">
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
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="mr-1 h-3 w-3" />
                    Information Saved
                  </Badge>
                </div>
              </div>
              
              {showExtendedFamilyForm ? (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">Add Extended Family Member</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowExtendedFamilyForm(false)}
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
                        control={extendedFamilyForm.control}
                        name="relationshipToClient"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Sibling">Sibling</SelectItem>
                                <SelectItem value="Parent-in-law">Parent-in-law</SelectItem>
                                <SelectItem value="Grandparent">Grandparent</SelectItem>
                                <SelectItem value="Uncle/Aunt">Uncle/Aunt</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
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
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.length === 13) {
                                      const validation = validateAndAutoFillFromID(e.target.value, extendedFamilyForm);
                                      if (validation.isValid) {
                                        setDependentIdValidation({ 
                                          isValid: true, 
                                          message: "Valid South African ID" 
                                        });
                                      } else {
                                        setDependentIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number format or checksum" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setDependentIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
                                      });
                                    } else {
                                      setDependentIdValidation({ isValid: null, message: null });
                                    }
                                  }}
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {dependentIdValidation.isValid === true && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {dependentIdValidation.isValid === false && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {dependentIdValidation.isValid === null && field.value.length > 0 && (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {dependentIdValidation.message && (
                              <div className={`text-xs mt-1 ${
                                dependentIdValidation.isValid === true 
                                  ? "text-green-600" 
                                  : dependentIdValidation.isValid === false 
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}>
                                {dependentIdValidation.message}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        type="button" 
                        onClick={handleAddExtendedFamily}
                        className="w-full"
                        disabled={createDependent.isPending}
                      >
                        {createDependent.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <User className="mr-2 h-4 w-4" />
                            Add Family Member
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium">Extended Family Members</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setShowExtendedFamilyForm(true);
                        setDependentIdValidation({ isValid: null, message: null });
                      }}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span>Add Family Member</span>
                    </Button>
                  </div>
                  
                  {extendedFamilyData.length > 0 ? (
                    <div className="space-y-2">
                      {extendedFamilyData.map((member, index) => (
                        <div key={member.id || index} className="flex items-center justify-between border p-3 rounded-md">
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-gray-500">
                              {member.relationshipToClient} • ID: {member.idNumber}
                            </p>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeDependent(member.id, "extended")}
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No extended family members added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Click the button above to add extended family members</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-3 sm:p-4 bg-purple-50 rounded-md border border-purple-200 mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center text-purple-800">
                  <AlertCircle className="mr-2 h-4 w-4 text-purple-500" />
                  <span>Extended Family Coverage Information</span>
                </h4>
                <ul className="list-disc pl-5 text-xs text-purple-700">
                  <li>Extended family members are covered at 50% of the main member's benefit amount</li>
                  <li>Maximum age limits may apply depending on the relationship</li>
                  <li>You may add up to 8 extended family members to your policy</li>
                  <li>Waiting periods of 6-12 months apply for extended family members</li>
                  <li>You can proceed without adding extended family and add them later</li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
          
        {/* Step 5: Beneficiary */}
        {step === 5 && (
          <CardContent className="p-4 sm:p-6">
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
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="mr-1 h-3 w-3" />
                    Information Saved
                  </Badge>
                </div>
              </div>
              
              {showBeneficiaryForm ? (
                <div className="mb-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={beneficiaryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Jane Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={beneficiaryForm.control}
                        name="relationshipToClient"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Spouse">Spouse</SelectItem>
                                <SelectItem value="Child">Child</SelectItem>
                                <SelectItem value="Parent">Parent</SelectItem>
                                <SelectItem value="Sibling">Sibling</SelectItem>
                                <SelectItem value="Friend">Friend</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
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
                                  {...field} 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.length === 13) {
                                      const validation = validateAndAutoFillFromID(e.target.value, beneficiaryForm);
                                      if (validation.isValid) {
                                        setDependentIdValidation({ 
                                          isValid: true, 
                                          message: "Valid South African ID" 
                                        });
                                      } else {
                                        setDependentIdValidation({ 
                                          isValid: false, 
                                          message: "Invalid ID number format or checksum" 
                                        });
                                      }
                                    } else if (e.target.value.length > 0) {
                                      setDependentIdValidation({ 
                                        isValid: null, 
                                        message: "Enter full 13-digit ID number" 
                                      });
                                    } else {
                                      setDependentIdValidation({ isValid: null, message: null });
                                    }
                                  }}
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {dependentIdValidation.isValid === true && (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {dependentIdValidation.isValid === false && (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {dependentIdValidation.isValid === null && field.value.length > 0 && (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            {dependentIdValidation.message && (
                              <div className={`text-xs mt-1 ${
                                dependentIdValidation.isValid === true 
                                  ? "text-green-600" 
                                  : dependentIdValidation.isValid === false 
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}>
                                {dependentIdValidation.message}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        type="button" 
                        onClick={handleAddBeneficiary}
                        className="w-full"
                        disabled={createDependent.isPending}
                      >
                        {createDependent.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <User className="mr-2 h-4 w-4" />
                            Add Beneficiary
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-medium">Beneficiaries</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setShowBeneficiaryForm(true);
                        setDependentIdValidation({ isValid: null, message: null });
                      }}
                      className="h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span>Add Beneficiary</span>
                    </Button>
                  </div>
                  
                  {beneficiariesData.length > 0 ? (
                    <div className="space-y-2">
                      {beneficiariesData.map((beneficiary, index) => (
                        <div key={beneficiary.id || index} className="flex items-center justify-between border p-3 rounded-md">
                          <div>
                            <p className="font-medium text-sm">{beneficiary.name}</p>
                            <p className="text-xs text-gray-500">
                              {beneficiary.relationshipToClient} • ID: {beneficiary.idNumber}
                            </p>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeDependent(beneficiary.id, "beneficiary")}
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No beneficiaries added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Click the button above to add beneficiaries to this policy</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-3 sm:p-4 bg-indigo-50 rounded-md border border-indigo-200 mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center text-indigo-800">
                  <AlertCircle className="mr-2 h-4 w-4 text-indigo-500" />
                  <span>Beneficiary Information</span>
                </h4>
                <ul className="list-disc pl-5 text-xs text-indigo-700">
                  <li>Beneficiaries will receive the policy payout in the event of the main member's death</li>
                  <li>You must add at least one beneficiary to your policy before completing the application</li>
                  <li>Multiple beneficiaries will share the payout equally unless otherwise specified</li>
                  <li>Beneficiaries can be updated at any time during the policy term</li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
          
        {/* Step 6: Payment Details */}
        {step === 6 && (
          <CardContent className="p-4 sm:p-6">
            <div>
              <Form {...bankDetailForm}>
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-3">Payment Method</h3>
                  
                  <FormField
                    control={policyForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Select Payment Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2 rounded-md border p-2">
                              <RadioGroupItem value="Debit Order" id="debit" />
                              <Label htmlFor="debit" className="flex-1 cursor-pointer">Debit Order</Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-2">
                              <RadioGroupItem value="SASSA" id="sassa" />
                              <Label htmlFor="sassa" className="flex-1 cursor-pointer">SASSA</Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-2">
                              <RadioGroupItem value="PAY@" id="payat" />
                              <Label htmlFor="payat" className="flex-1 cursor-pointer">PAY@</Label>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-2">
                              <RadioGroupItem value="EFT" id="eft" />
                              <Label htmlFor="eft" className="flex-1 cursor-pointer">Electronic Funds Transfer (EFT)</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {policyForm.watch("paymentMethod") === "Debit Order" && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-md font-medium mb-3">Bank Account Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={bankDetailForm.control}
                        name="accountHolder"
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
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ABSA">ABSA</SelectItem>
                                <SelectItem value="Capitec">Capitec</SelectItem>
                                <SelectItem value="FNB">FNB</SelectItem>
                                <SelectItem value="Nedbank">Nedbank</SelectItem>
                                <SelectItem value="Standard Bank">Standard Bank</SelectItem>
                                <SelectItem value="African Bank">African Bank</SelectItem>
                                <SelectItem value="Bidvest Bank">Bidvest Bank</SelectItem>
                                <SelectItem value="Discovery Bank">Discovery Bank</SelectItem>
                                <SelectItem value="TymeBank">TymeBank</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={bankDetailForm.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 12345678" {...field} />
                            </FormControl>
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Current">Current/Cheque</SelectItem>
                                <SelectItem value="Savings">Savings</SelectItem>
                                <SelectItem value="Transmission">Transmission</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={bankDetailForm.control}
                        name="branchCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Code</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 632005" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bankDetailForm.control}
                        name="debitDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit Day</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select debit day" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1st of the month</SelectItem>
                                <SelectItem value="15">15th of the month</SelectItem>
                                <SelectItem value="25">25th of the month</SelectItem>
                                <SelectItem value="31">Last day of the month</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={bankDetailForm.control}
                      name="collectionFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collection Frequency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select collection frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Quarterly">Quarterly</SelectItem>
                              <SelectItem value="Biannually">Bi-annually</SelectItem>
                              <SelectItem value="Annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {policyForm.watch("paymentMethod") === "SASSA" && (
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 mt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center text-blue-800">
                      <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                      <span>SASSA Grant Payment Information</span>
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-blue-700">
                      <li>Premiums will be deducted directly from your SASSA grant payment</li>
                      <li>You must provide your SASSA grant number during the verification process</li>
                      <li>Deductions occur on your grant payment date each month</li>
                      <li>A verification document will be sent to you for signature</li>
                    </ul>
                  </div>
                )}
                
                {policyForm.watch("paymentMethod") === "PAY@" && (
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 mt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center text-blue-800">
                      <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                      <span>PAY@ Payment Information</span>
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-blue-700">
                      <li>You can make monthly premium payments at any PAY@ outlet</li>
                      <li>PAY@ outlets include major retailers like Pick n Pay, Shoprite, and Boxer</li>
                      <li>You will receive a unique payment reference number to use each month</li>
                      <li>Payments must be made before the 7th of each month to maintain coverage</li>
                    </ul>
                  </div>
                )}
                
                {policyForm.watch("paymentMethod") === "EFT" && (
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 mt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center text-blue-800">
                      <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                      <span>EFT Payment Information</span>
                    </h4>
                    <ul className="list-disc pl-5 text-xs text-blue-700">
                      <li>Make manual EFT payments to our company account</li>
                      <li>Use your policy number as the payment reference</li>
                      <li>Payments must be made before the 3rd of each month</li>
                      <li>Banking details will be provided in your policy document</li>
                    </ul>
                  </div>
                )}
                
                <div className="p-3 sm:p-4 bg-gray-50 rounded-md border border-gray-200 mt-6">
                  <h4 className="text-sm font-medium mb-2 flex items-center text-gray-700">
                    <FileCheck className="mr-2 h-4 w-4 text-primary" />
                    <span>Terms and Conditions</span>
                  </h4>
                  <div className="flex items-start space-x-2 mb-2">
                    <Checkbox id="terms" className="mt-1" required />
                    <Label 
                      htmlFor="terms" 
                      className="text-xs leading-tight text-gray-600 cursor-pointer"
                    >
                      I authorize the company to deduct the premium amount from my account/grant on the 
                      selected date each month. I understand that if the payment date falls on a weekend 
                      or public holiday, the deduction may occur on the next business day.
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox id="consent" className="mt-1" required />
                    <Label 
                      htmlFor="consent" 
                      className="text-xs leading-tight text-gray-600 cursor-pointer"
                    >
                      I confirm that I am the account holder and have the authority to authorize debit orders 
                      from this account. I understand that missed payments may result in my policy lapsing.
                    </Label>
                  </div>
                </div>
              </Form>
            </div>
          </CardContent>
        )}
          
        {/* Step 7: Policy Summary */}
        {step === 7 && (
          <CardContent className="p-4 sm:p-6">
            <div>
              <h3 className="text-md font-medium mb-4">Policy Summary</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-100">
                    <h4 className="font-medium text-sm">Policy Holder Details</h4>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="text-sm">{clientForm.getValues().name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ID Number</p>
                      <p className="text-sm">{clientForm.getValues().idNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm">{clientForm.getValues().email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm">{clientForm.getValues().phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500">Residential Address</p>
                      <p className="text-sm">{clientForm.getValues().address}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-100">
                    <h4 className="font-medium text-sm">Dependents</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {spouseDependentId && (
                      <div className="p-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium">{spouseForm.getValues().name}</p>
                            <p className="text-xs text-gray-500 mt-1">ID: {spouseForm.getValues().idNumber}</p>
                          </div>
                          <Badge className="bg-blue-50 border-blue-200 text-blue-700">
                            Spouse (100% Cover)
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {childrenData.length > 0 && childrenData.map((child, index) => (
                      <div className="p-4" key={child.id || index}>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium">{child.name}</p>
                            <p className="text-xs text-gray-500 mt-1">ID: {child.idNumber}</p>
                          </div>
                          <Badge className="bg-green-50 border-green-200 text-green-700">
                            Child (75% Cover)
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {extendedFamilyData.length > 0 && extendedFamilyData.map((member, index) => (
                      <div className="p-4" key={member.id || index}>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <span>ID: {member.idNumber}</span>
                              <span className="mx-1">•</span>
                              <span>{member.relationshipToClient}</span>
                            </div>
                          </div>
                          <Badge className="bg-purple-50 border-purple-200 text-purple-700">
                            Extended (50% Cover)
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {!spouseDependentId && childrenData.length === 0 && extendedFamilyData.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">No dependents added to policy</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-100">
                    <h4 className="font-medium text-sm">Beneficiaries</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {beneficiariesData.length > 0 ? (
                      beneficiariesData.map((beneficiary, index) => (
                        <div className="p-4" key={beneficiary.id || index}>
                          <div className="flex justify-between">
                            <div>
                              <p className="text-sm font-medium">{beneficiary.name}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <span>ID: {beneficiary.idNumber}</span>
                                <span className="mx-1">•</span>
                                <span>{beneficiary.relationshipToClient}</span>
                              </div>
                            </div>
                            <Badge className="bg-indigo-50 border-indigo-200 text-indigo-700">
                              Beneficiary
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500">No beneficiaries added to policy</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-100">
                    <h4 className="font-medium text-sm">Payment Details</h4>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="text-sm">{policyForm.getValues().paymentMethod}</p>
                    </div>
                    
                    {policyForm.getValues().paymentMethod === "Debit Order" && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">Account Holder</p>
                          <p className="text-sm">{bankDetailForm.getValues().accountHolder}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bank Name</p>
                          <p className="text-sm">{bankDetailForm.getValues().bankName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Account Type</p>
                          <p className="text-sm">{bankDetailForm.getValues().accountType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Account Number</p>
                          <p className="text-sm">
                            {bankDetailForm.getValues().accountNumber.replace(/\d(?=\d{4})/g, "*")}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Debit Day</p>
                          <p className="text-sm">
                            {(() => {
                              const day = bankDetailForm.getValues().debitDay;
                              return day === "31" 
                                ? "Last day of month" 
                                : `${day}${
                                    day === "1" ? "st" : day === "2" ? "nd" : day === "3" ? "rd" : "th"
                                  } of month`;
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Collection Frequency</p>
                          <p className="text-sm">{bankDetailForm.getValues().collectionFrequency}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-3">Next Steps</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Select your policy type and coverage amount on the next screen</li>
                  <li>Review your premium based on your coverage selection</li>
                  <li>Once you complete your application, a policy document will be emailed to you</li>
                  <li>Policy will lapse if we're unable to collect premiums for 3 consecutive months.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
          
        {/* Step 8: Policy Type and Coverage */}
        {step === 8 && (
          <CardContent className="p-4 sm:p-6">
            <div>
              <Form {...policyForm}>
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">Policy Type</h3>
                  
                  <FormField
                    control={policyForm.control}
                    name="policyType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-3"
                          >
                            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
                              <RadioGroupItem value="Family Plan" id="family" />
                              <div className="grid flex-1" onClick={() => field.onChange("Family Plan")}>
                                <Label htmlFor="family" className="font-medium cursor-pointer">Family Plan</Label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Comprehensive funeral cover for you and your family members, with extended family options.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50">
                              <RadioGroupItem value="Pensioner Plan" id="pensioner" />
                              <div className="grid flex-1" onClick={() => field.onChange("Pensioner Plan")}>
                                <Label htmlFor="pensioner" className="font-medium cursor-pointer">Pensioner Plan</Label>
                                <p className="text-xs text-gray-500 mt-1">
                                  Specialized funeral cover for pensioners with reduced waiting periods and age-appropriate benefits.
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">Coverage Amount</h3>
                  
                  <FormField
                    control={policyForm.control}
                    name="coverAmount"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value.toString()}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3"
                          >
                            {coverLevels.map((amount) => (
                              <div 
                                key={amount} 
                                className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-gray-50"
                              >
                                <RadioGroupItem value={amount.toString()} id={`amount-${amount}`} />
                                <div 
                                  className="grid flex-1" 
                                  onClick={() => field.onChange(amount)}
                                >
                                  <Label htmlFor={`amount-${amount}`} className="font-medium cursor-pointer">
                                    R{amount.toLocaleString()}
                                  </Label>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">Policy Start Date</h3>
                  
                  <FormField
                    control={policyForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Policy Start Date</FormLabel>
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
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 1))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="text-xs">
                          Your policy can start up to 1 month from today
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="border rounded-md overflow-hidden bg-gray-50 mt-6">
                  <div className="p-4 bg-primary/10 border-b">
                    <h3 className="font-medium text-primary">Premium Summary</h3>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Base Premium:</span>
                      <span className="text-sm font-medium">
                        R{policyForm.watch('premiumAmount').toFixed(2)}
                      </span>
                    </div>
                    
                    {spouseDependentId && (
                      <div className="flex justify-between py-1">
                        <span className="text-sm">Spouse (100% cover):</span>
                        <span className="text-sm font-medium">
                          R{(policyForm.watch('premiumAmount') * 0.8).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {childrenData.length > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-sm">Children ({childrenData.length}x):</span>
                        <span className="text-sm font-medium">
                          R{(childrenData.length * policyForm.watch('premiumAmount') * 0.3).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {extendedFamilyData.length > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-sm">Extended Family ({extendedFamilyData.length}x):</span>
                        <span className="text-sm font-medium">
                          R{(extendedFamilyData.length * policyForm.watch('premiumAmount') * 0.5).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t mt-2 pt-2 flex justify-between">
                      <span className="font-medium">Total Monthly Premium:</span>
                      <span className="font-bold text-primary">
                        R{(
                          policyForm.watch('premiumAmount') + 
                          (spouseDependentId ? policyForm.watch('premiumAmount') * 0.8 : 0) +
                          (childrenData.length * policyForm.watch('premiumAmount') * 0.3) +
                          (extendedFamilyData.length * policyForm.watch('premiumAmount') * 0.5)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {showPolicySuccessMessage && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md animate-pulse">
                    <div className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-green-800">Policy Created Successfully!</h3>
                        <p className="text-sm text-green-700 mt-1">
                          Your policy has been created with policy number {policyForm.getValues().policyNumber}.
                          A confirmation email with your policy document will be sent to your email address.
                          You will be redirected to the policies page in a few seconds.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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