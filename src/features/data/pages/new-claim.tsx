import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/features/data/components/sidebar";
import TopBar from "@/features/data/components/topbar";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Search, 
  Check, 
  UserX, 
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { validateSouthAfricanID, getDateOfBirthFromIDNumber, getGenderFromIDNumber } from "@/services/utils";

import { Button } from "@/features/data/components/ui/button";
import { Input } from "@/features/data/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/features/data/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/features/data/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/features/data/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/data/components/ui/table";
import { Textarea } from "@/features/data/components/ui/textarea";
import { Badge } from "@/features/data/components/ui/badge";
import { Checkbox } from "@/features/data/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/data/components/ui/popover";
import { Calendar } from "@/features/data/components/ui/calendar";

// Define type interface for policies to use in selection
interface Policy {
  id: number;
  policyNumber: string;
  clientName: string;
  clientId: number;
  startDate: string;
  status: string;
  premium: number;
  policyTypeId: number;
  policyType?: {
    name: string;
  };
}

// Define type interface for dependents (including main member)
interface PolicyMember {
  id: number;
  firstName: string;
  surname: string;
  idNumber: string;
  relationship: string;
  dateOfBirth: string;
  isMainMember?: boolean;
}

// Create validation schema
const claimSchema = z.object({
  policyId: z.string().min(1, "Please select a policy"),
  deceasedId: z.string().min(1, "Please select the deceased member"),
  claimType: z.string().min(1, "Please select a claim type"),
  dateOfDeath: z.date({
    required_error: "Date of death is required",
  }),
  causeOfDeath: z.string().min(1, "Cause of death is required"),
  placeOfDeath: z.string().min(1, "Place of death is required"),
  claimantName: z.string().min(1, "Claimant name is required"),
  claimantContact: z.string().min(1, "Claimant contact is required"),
  claimantIdNumber: z.string().min(1, "Claimant ID number is required"),
  claimantEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  relationshipToMember: z.string().min(1, "Relationship to deceased is required"),
  funeralHome: z.string().optional(),
  funeralDate: z.date().optional(),
  additionalInfo: z.string().optional(),
});

type ClaimFormValues = z.infer<typeof claimSchema>;

export default function NewClaim() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [policyMembers, setPolicyMembers] = useState<PolicyMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [idValidation, setIdValidation] = useState<{
    isValid: boolean | null;
    message: string | null;
  }>({ isValid: null, message: null });

  // Set up form with validation
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      policyId: "",
      deceasedId: "",
      claimType: "Death Claim",
      dateOfDeath: undefined,
      causeOfDeath: "",
      placeOfDeath: "",
      claimantName: "",
      claimantContact: "",
      claimantIdNumber: "",
      claimantEmail: "",
      relationshipToMember: "",
      funeralHome: "",
      funeralDate: undefined,
      additionalInfo: "",
    },
  });

  // Fetch policies from API
  const { 
    data: policies = [], 
    isLoading: isLoadingPolicies 
  } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  // Fetch policy members when a policy is selected
  useEffect(() => {
    const fetchPolicyMembers = async (policyId: number) => {
      try {
        setIsLoadingMembers(true);
        // Fetch policy details with client info
        const policyResponse = await apiRequest('GET', `/api/policies/${policyId}`);
        const policyData = await policyResponse.json();
        
        // Fetch policy dependents
        const dependentsResponse = await apiRequest('GET', `/api/policies/${policyId}/dependents`);
        const dependentsData = await dependentsResponse.json();
        
        // Fetch client details (main member)
        const clientResponse = await apiRequest('GET', `/api/clients/${policyData.clientId}`);
        const clientData = await clientResponse.json();
        
        // Create a complete list of all members covered by the policy
        const allMembers: PolicyMember[] = [
          {
            id: clientData.id,
            firstName: clientData.firstName,
            surname: clientData.surname,
            idNumber: clientData.idNumber,
            dateOfBirth: clientData.dateOfBirth,
            relationship: "Main Member",
            isMainMember: true
          },
          ...dependentsData.map((dependent: any) => ({
            id: dependent.id,
            firstName: dependent.firstName,
            surname: dependent.surname,
            idNumber: dependent.idNumber,
            dateOfBirth: dependent.dateOfBirth,
            relationship: dependent.relationship,
            isMainMember: false
          }))
        ];
        
        setPolicyMembers(allMembers);
      } catch (error) {
        console.error("Error fetching policy members:", error);
        toast({
          title: "Error",
          description: "Failed to load policy members. Please try again.",
          variant: "destructive",
        });
        setPolicyMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (selectedPolicy?.id) {
      fetchPolicyMembers(selectedPolicy.id);
    } else {
      setPolicyMembers([]);
    }
  }, [selectedPolicy, toast]);

  // Handle policy selection
  const handlePolicySelect = (policy: Policy) => {
    setSelectedPolicy(policy);
    form.setValue("policyId", policy.id.toString());
    form.setValue("deceasedId", ""); // Reset deceased selection
    setStep(2); // Move to step 2
  };

  // Handle deceased member selection
  const handleDeceasedSelect = (member: PolicyMember) => {
    form.setValue("deceasedId", member.id.toString());
    // Pre-fill claimant details with main member information if a dependent is deceased
    if (!member.isMainMember && policyMembers.length > 0) {
      const mainMember = policyMembers.find(m => m.isMainMember);
      if (mainMember) {
        form.setValue("claimantName", `${mainMember.firstName} ${mainMember.surname}`);
        form.setValue("claimantIdNumber", mainMember.idNumber);
        form.setValue("relationshipToMember", "Policy Owner");
      }
    }
    setStep(3); // Move to step 3
  };

  // Filter policies based on search term
  const filteredPolicies = policies.filter(policy => {
    if (!searchTerm) return true;
    
    return (
      (policy.policyNumber && policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (policy.clientName && policy.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Create claim mutation
  const createClaim = useMutation({
    mutationFn: async (data: ClaimFormValues) => {
      // Format dates for API
      const formattedData = {
        ...data,
        dateOfDeath: format(data.dateOfDeath, "yyyy-MM-dd"),
        funeralDate: data.funeralDate ? format(data.funeralDate, "yyyy-MM-dd") : null,
        clientId: selectedPolicy?.clientId || 0, 
        policyId: parseInt(data.policyId),
        deceasedId: parseInt(data.deceasedId),
        claimNumber: `CLM-${Math.floor(1000 + Math.random() * 9000)}`, // Generate claim number
        dateOfClaim: format(new Date(), "yyyy-MM-dd"),
        status: "pending",
      };
      
      console.log("Submitting claim data:", formattedData);
      
      const response = await apiRequest("POST", "/api/claims", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Claim created",
        description: "The claim has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      navigate("/claims");
    },
    onError: (error) => {
      console.error("Error creating claim:", error);
      toast({
        title: "Error",
        description: "Failed to create claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<ClaimFormValues> = (data) => {
    createClaim.mutate(data);
  };

  // Get the name of the selected policy member
  const getSelectedMemberName = () => {
    const memberId = form.watch("deceasedId");
    if (!memberId) return "Not selected";
    
    const member = policyMembers.find(m => m.id.toString() === memberId);
    return member ? `${member.firstName} ${member.surname}` : "Unknown";
  };

  // Mock user data for sidebar
  const mockUser = {
    name: "Sarah Johnson",
    role: "Claims Administrator",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={mockUser}
        onLogout={() => console.log("Logout clicked")}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          user={mockUser}
          onMobileMenuClick={() => console.log("Mobile menu clicked")}
        />
        
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="container mx-auto max-w-4xl">
            {/* Header */}
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/claims")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Claims
              </Button>
              <div>
                <h1 className="text-2xl font-bold">New Claim</h1>
                <p className="text-gray-500">Create a new death claim for a policy</p>
              </div>
            </div>
            
            {/* Progress steps */}
            <div className="mb-6">
              <div className="flex items-center w-full">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                  1
                </div>
                <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                  2
                </div>
                <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                  3
                </div>
              </div>
              <div className="flex justify-between mt-2 px-1">
                <div className="text-xs font-medium text-center w-10">Select Policy</div>
                <div className="text-xs font-medium text-center w-10">Select Deceased</div>
                <div className="text-xs font-medium text-center w-10">Claim Details</div>
              </div>
            </div>
            
            {/* Step 1: Select Policy */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Policy</CardTitle>
                  <CardDescription>Choose the policy for which you want to create a claim</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by policy number or client name..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {isLoadingPolicies ? (
                    <div className="text-center py-8">Loading policies...</div>
                  ) : filteredPolicies.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-2">
                        <Info className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700">No policies found</h3>
                      <p className="text-gray-500 mt-1">Try adjusting your search or check if the policy exists</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Policy Number</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Premium</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPolicies.map((policy) => (
                            <TableRow 
                              key={policy.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handlePolicySelect(policy)}
                            >
                              <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                              <TableCell>{policy.clientName}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={policy.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}
                                >
                                  {policy.status}
                                </Badge>
                              </TableCell>
                              <TableCell>R {policy.premium?.toFixed(2)}</TableCell>
                              <TableCell>{policy.policyType?.name || "Standard"}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost">
                                  Select
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between bg-gray-50 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/claims")}
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Step 2: Select Deceased Member */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Deceased Member</CardTitle>
                  <CardDescription>Choose the covered member who has passed away</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMembers ? (
                    <div className="text-center py-8">Loading policy members...</div>
                  ) : policyMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-2">
                        <AlertCircle className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700">No members found</h3>
                      <p className="text-gray-500 mt-1">This policy doesn't have any members. Please select a different policy.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-700">Selected Policy</h3>
                            <p className="text-sm text-gray-600 mt-1">{selectedPolicy?.policyNumber}</p>
                            <p className="text-sm text-gray-600">{selectedPolicy?.clientName}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setStep(1)}
                            className="text-xs"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                      
                      <div className="overflow-hidden border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member Name</TableHead>
                              <TableHead>Relationship</TableHead>
                              <TableHead>ID Number</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {policyMembers.map((member) => (
                              <TableRow 
                                key={member.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleDeceasedSelect(member)}
                              >
                                <TableCell className="font-medium">
                                  {member.firstName} {member.surname}
                                  {member.isMainMember && (
                                    <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-100">
                                      Main Member
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{member.relationship}</TableCell>
                                <TableCell>{member.idNumber}</TableCell>
                                <TableCell>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="flex items-center gap-1"
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Select
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between bg-gray-50 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Step 3: Claim Details */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Claim Details</CardTitle>
                  <CardDescription>Enter the details for the death claim</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-700">Selected Policy & Member</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Policy: {selectedPolicy?.policyNumber} - {selectedPolicy?.clientName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Deceased Member: {getSelectedMemberName()}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setStep(2)}
                            className="text-xs"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="claimType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Claim Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select claim type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Death Claim">Death Claim</SelectItem>
                                  <SelectItem value="Funeral Expense">Funeral Expense</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dateOfDeath"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Death</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full pl-3 text-left font-normal"
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
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
                          name="causeOfDeath"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cause of Death</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Natural causes, accident, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="placeOfDeath"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Place of Death</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Hospital, home, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-md font-medium mb-4">Claimant Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="claimantName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Claimant Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Full name of person claiming" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="claimantIdNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Claimant ID Number</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      placeholder="13-digit South African ID number" 
                                      {...field} 
                                      onChange={(e) => {
                                        field.onChange(e);
                                        const idNumber = e.target.value;
                                        
                                        if (idNumber.length === 13) {
                                          const isValid = validateSouthAfricanID(idNumber);
                                          setIdValidation({
                                            isValid,
                                            message: isValid ? "Valid South African ID number" : "Invalid ID number format or checksum"
                                          });
                                        } else if (idNumber.length > 0) {
                                          setIdValidation({
                                            isValid: null,
                                            message: "Enter full 13-digit ID number"
                                          });
                                        } else {
                                          setIdValidation({ isValid: null, message: null });
                                        }
                                      }}
                                    />
                                    {field.value && field.value.length > 0 && (
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {idValidation.isValid === true && (
                                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        )}
                                        {idValidation.isValid === false && (
                                          <XCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        {idValidation.isValid === null && field.value.length > 0 && (
                                          <AlertCircle className="h-5 w-5 text-amber-500" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </FormControl>
                                {idValidation.message && (
                                  <div className={`text-xs mt-1 ${
                                    idValidation.isValid === true 
                                      ? "text-green-600" 
                                      : idValidation.isValid === false 
                                        ? "text-red-600"
                                        : "text-amber-600"
                                  }`}>
                                    {idValidation.message}
                                  </div>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="claimantContact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Claimant Contact Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 0123456789" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="claimantEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Claimant Email (Optional)</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="e.g. name@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="relationshipToMember"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship to Deceased</FormLabel>
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
                                    <SelectItem value="Spouse">Spouse</SelectItem>
                                    <SelectItem value="Child">Child</SelectItem>
                                    <SelectItem value="Parent">Parent</SelectItem>
                                    <SelectItem value="Sibling">Sibling</SelectItem>
                                    <SelectItem value="Extended Family">Extended Family</SelectItem>
                                    <SelectItem value="Policy Owner">Policy Owner</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h3 className="text-md font-medium mb-4">Funeral Information (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="funeralHome"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Funeral Home</FormLabel>
                                <FormControl>
                                  <Input placeholder="Name of funeral home" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="funeralDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Funeral Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className="w-full pl-3 text-left font-normal"
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value || undefined}
                                      onSelect={field.onChange}
                                      disabled={(date) => 
                                        date < new Date("2000-01-01")
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
                      </div>
                      
                      <div>
                        <FormField
                          control={form.control}
                          name="additionalInfo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Information (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any additional details about the claim" 
                                  className="resize-none min-h-24" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                          <div className="flex items-start">
                            <div className="mr-3 mt-0.5">
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
                              <p className="text-sm text-yellow-700 mt-1">
                                By submitting this claim, you confirm that all information provided is accurate 
                                and that the relevant supporting documents will be uploaded after claim creation.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-between bg-gray-50 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={createClaim.isPending}
                  >
                    {createClaim.isPending ? "Creating Claim..." : "Submit Claim"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}