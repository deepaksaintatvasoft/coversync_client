import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/features/data/components/ui/badge";
import { NavigationMenu } from "@/features/data/components/navigation-menu";
import { 
  ArrowLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  Check, 
  X,
  Printer,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  AlertTriangle,
  UserCheck,
  User,
  DollarSign,
  Upload,
  File,
  FileText,
  ClipboardCheck,
  ReceiptText,
  Clock,
  Send,
  Image,
  Paperclip,
  Trash2,
  MailCheck,
  Info,
  Plus,
  BarChart
} from "lucide-react";

import { Button } from "@/features/data/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/data/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/features/data/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/data/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/data/components/ui/table";
import { Separator } from "@/features/data/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Mock claim data - in a real application, you would fetch this from the API
const mockClaim = {
  id: "21982281",
  policy: {
    number: "A28475015",
    category: "Group Membership",
  },
  source: {
    name: "Cigna Health",
    type: "Mail"
  },
  claimsHandler: "Nick Burch",
  status: "active",
  provider: {
    name: "George Medical Hospital",
    network: "First Health"
  },
  receivedDate: "2020-06-19",
  payer: {
    name: "Blue Cross Blue Shield",
    group: "56",
    address: "1310 G Street, NW Washington, DC 20005",
    phone: "(888) 630 2547"
  },
  incident: "Slipped from stairs and had knee injury",
  serviceCodes: [
    { date: "2020-08-09", code: "0250", details: "Pharmacy - General", unit: 1, amount: 62, total: 62 },
    { date: "2020-08-09", code: "0450", details: "Emergency Room", unit: 1, amount: 197.4, total: 197.4 },
    { date: "2020-08-09", code: "0541", details: "Bone Strength and Fracture Risk Assessment", unit: 1, amount: 282, total: 282 },
    { date: "2020-08-09", code: "76000", details: "Other Diagnostic Radiology", unit: 3, amount: 123.33, total: 370 },
    { date: "2020-08-09", code: "0278", details: "Implant", unit: 1, amount: 9000, total: 9000 }
  ],
  totalAmount: 11688,
  medicalExpenses: {
    enteredDate: "2023-06-15",
    enteredBy: "John Smith",
    providerNotes: "The provider has shared the original copy of bill.",
    validationStatus: {
      verification: true,
      billing: true
    }
  },
  codes: {
    enteredDate: "2023-06-15",
    enteredBy: "Anthony Smith",
    notes: "Procedure code billed on the claim is not valid",
    documents: [
      { name: "Change Sheet", path: "/documents/change-sheet.pdf" }
    ]
  },
  attentionItems: 2
};

// Tabs type
type TabValue = "claim-info" | "payment" | "diagnosis" | "documents";

export default function ClaimDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabValue>("claim-info");
  const [resolved, setResolved] = useState(false);
  const [assigningHandler, setAssigningHandler] = useState(false);
  const [claimHandler, setClaimHandler] = useState<string | null>(null);
  const [isCurrentUserHandler, setIsCurrentUserHandler] = useState(false);
  const [deathInfoCaptured, setDeathInfoCaptured] = useState(false);
  const [isSendingToUnderwriter, setIsSendingToUnderwriter] = useState(false);
  const [sentToUnderwriter, setSentToUnderwriter] = useState(false);

  // Mock death info
  const [claimDeathInfo, setClaimDeathInfo] = useState({
    deceased: {
      name: "Robert Smith",
      idNumber: "5506055184085",
      relationship: "Father",
      dateOfDeath: "2023-10-10",
      causeOfDeath: "Natural causes - Heart failure",
      placeOfDeath: "Mediclinic Hospital, Cape Town"
    },
    funeral: {
      funeralHome: "Green Fields Funeral Services",
      funeralDate: "2023-10-15",
      burialLocation: "Sunset Memorial Park"
    },
    informant: {
      name: "John Smith",
      relationship: "Son",
      contactNumber: "082 123 4567",
      email: "john.smith@example.com"
    }
  });
  
  // Document handling state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<string>("death_certificate");
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadDate: Date;
    documentType: string;
    status: "uploaded" | "processing" | "verified" | "rejected";
  }>>([
    {
      id: "1",
      name: "death_certificate.pdf",
      type: "application/pdf",
      size: 1458000,
      uploadDate: new Date("2023-10-15"),
      documentType: "death_certificate",
      status: "verified"
    },
    {
      id: "2",
      name: "id_document.pdf",
      type: "application/pdf",
      size: 985000,
      uploadDate: new Date("2023-10-15"),
      documentType: "id_document",
      status: "verified"
    }
  ]);

  // In real app, you would fetch the claim data
  // const { data: claim, isLoading } = useQuery({
  //   queryKey: ['/api/claims', id],
  // });
  
  // Using mock data for now
  const claim = { ...mockClaim };
  const isLoading = false;
  
  // Mock funeral policy details for demonstration
  const funeralPolicyDetails = {
    policyType: "Family Plan",
    policyNumber: "A28475015",
    coverageAmount: "R 25,000.00",
    premium: "R 350.00",
    frequency: "Monthly",
    captureDate: "2022-03-15",
    inceptionDate: "2022-04-01",
    status: "Active",
    members: [
      { 
        type: "Main Member", 
        name: "John Smith", 
        idNumber: "7801015184081",
        dateOfBirth: "1978-01-01",
        coverageAmount: "R 25,000.00"
      },
      { 
        type: "Spouse", 
        name: "Mary Smith", 
        idNumber: "8002025184083",
        dateOfBirth: "1980-02-02",
        coverageAmount: "R 25,000.00"
      },
      { 
        type: "Child", 
        name: "James Smith", 
        idNumber: "1304035184084",
        dateOfBirth: "2013-04-03",
        coverageAmount: "R 15,000.00"
      },
      { 
        type: "Extended Family", 
        name: "Robert Smith", 
        idNumber: "5506055184085",
        dateOfBirth: "1955-06-05",
        relationship: "Father",
        coverageAmount: "R 20,000.00"
      }
    ],
    beneficiaries: [
      {
        name: "Sarah Johnson",
        idNumber: "8510105184086",
        relationship: "Sister",
        percentage: "100%",
        contactNumber: "082 555 1234"
      }
    ]
  };
  
  // Simulate the current user (in a real app, this would come from authentication)
  const currentUser = {
    id: 123,
    name: "Sarah Johnson",
    role: "Data Capturer",
    avatar: "https://i.pravatar.cc/150?img=25"
  };
  
  // Function to assign the current user as a claims handler
  const assignSelfAsHandler = () => {
    setAssigningHandler(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      setClaimHandler(currentUser.name);
      setIsCurrentUserHandler(true);
      setAssigningHandler(false);
      
      // This would be a toast notification in a real app
      console.log("You are now assigned as the claims handler");
    }, 800);
  };
  
  // Document handling functions
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value);
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Simulate file upload - in a real app this would be an API call
    // For demo purposes, we'll just add it to our local state
    const newDocument = {
      id: `${Date.now()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date(),
      documentType: documentType,
      status: "uploaded" as const
    };
    
    setUploadedDocuments([...uploadedDocuments, newDocument]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDeleteDocument = (documentId: string) => {
    setUploadedDocuments(uploadedDocuments.filter(doc => doc.id !== documentId));
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Function to check if all required documentation is present
  const checkDocumentationComplete = (): boolean => {
    // Check if death certificate is present and verified
    const hasDeathCertificate = uploadedDocuments.some(doc => 
      doc.documentType === "death_certificate" && doc.status === "verified"
    );
    
    // Check if ID document is present and verified
    const hasIdDocument = uploadedDocuments.some(doc => 
      doc.documentType === "id_document" && doc.status === "verified"
    );
    
    // Check if bank statement is present
    const hasBankStatement = uploadedDocuments.some(doc => 
      doc.documentType === "bank_statement"
    );
    
    // Return true only if all required documents are present
    return hasDeathCertificate && hasIdDocument && hasBankStatement;
  };
  
  // Function to check if claim is ready to be sent to underwriter
  const isClaimReadyForUnderwriter = (): boolean => {
    // Must have all required documents
    const documentsComplete = checkDocumentationComplete();
    
    // Must have death information captured
    const deathInfoComplete = deathInfoCaptured;
    
    // Must be assigned to a claims handler
    const hasClaimsHandler = !!claimHandler || !!claim.claimsHandler;
    
    return documentsComplete && deathInfoComplete && hasClaimsHandler && isCurrentUserHandler;
  };
  
  // Function to send claim to underwriter
  // State for underwriter preview dialog
  const [showUnderwriterPreview, setShowUnderwriterPreview] = useState(false);
  const [underwriterData, setUnderwriterData] = useState<any>(null);
  
  const sendToUnderwriter = () => {
    // Check if claim is ready for underwriter
    if (!isClaimReadyForUnderwriter()) {
      toast({
        title: "Cannot send to underwriter",
        description: "Please ensure all documentation is complete and death information is captured.",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data package for underwriter
    const underwriterPackage = {
      claimId: claim.id,
      claimReference: "CL-" + claim.id,
      policyDetails: {
        policyNumber: funeralPolicyDetails.policyNumber,
        policyType: funeralPolicyDetails.policyType,
        coverageAmount: funeralPolicyDetails.coverageAmount,
        premium: funeralPolicyDetails.premium,
        frequency: funeralPolicyDetails.frequency,
        captureDate: funeralPolicyDetails.captureDate,
        inceptionDate: funeralPolicyDetails.inceptionDate,
        status: funeralPolicyDetails.status
      },
      clientDetails: {
        name: funeralPolicyDetails.members[0].name,
        idNumber: funeralPolicyDetails.members[0].idNumber,
        relationship: "Main Member",
        coverageAmount: funeralPolicyDetails.members[0].coverageAmount
      },
      claimDetails: {
        dateReported: new Date().toISOString().split('T')[0],
        handler: claimHandler || claim.claimsHandler,
        status: "Under Review",
        deathInformation: claimDeathInfo
      },
      documents: uploadedDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.documentType,
        status: doc.status,
        uploadDate: doc.uploadDate
      })),
      beneficiaryDetails: funeralPolicyDetails.beneficiaries[0],
      paymentDetails: {
        method: "Electronic Transfer",
        status: "Pending",
        amountRequested: funeralPolicyDetails.members.find(m => 
          m.idNumber === claimDeathInfo.deceased.idNumber)?.coverageAmount || "Unknown",
        bankDetails: {
          accountHolder: funeralPolicyDetails.beneficiaries[0].name,
          accountNumber: "****1234", // In real app, this would come from stored bank details
          bankName: "Standard Bank",
          accountType: "Savings"
        }
      },
      underwritingNotes: "Please review this claim for final approval.",
      timestamp: new Date().toISOString()
    };
    
    // Set the preview data and show dialog
    setUnderwriterData(underwriterPackage);
    setShowUnderwriterPreview(true);
  };
  
  // Function to confirm sending to underwriter after preview
  const confirmSendToUnderwriter = () => {
    setShowUnderwriterPreview(false);
    setIsSendingToUnderwriter(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      setSentToUnderwriter(true);
      setIsSendingToUnderwriter(false);
      
      toast({
        title: "Claim sent to underwriter",
        description: "The claim has been sent for underwriting review.",
        variant: "default",
      });
      
      console.log("Claim successfully sent to underwriter for processing", underwriterData);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/claims")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Claims
          </Button>
        </div>
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-36 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/claims")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Claims
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Claim Not Found</h2>
          <p className="text-gray-500">The claim you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  // The Underwriter Preview Dialog
  const UnderwriterPreviewDialog = () => {
    if (!underwriterData) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <ClipboardCheck className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Underwriter Preview</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowUnderwriterPreview(false)}
              className="rounded-full h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-6">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-700 text-sm">
                This is a preview of the data that will be sent to the underwriter for claim processing. 
                Please review the information carefully before submitting.
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <ReceiptText className="h-5 w-5 mr-2 text-blue-600" />
                  Claim Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Claim ID</p>
                    <p className="font-medium">{underwriterData.claimId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Claim Reference</p>
                    <p className="font-medium">{underwriterData.claimReference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date Reported</p>
                    <p className="font-medium">{underwriterData.claimDetails.dateReported}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Claims Handler</p>
                    <p className="font-medium">{underwriterData.claimDetails.handler}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Policy Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Policy Number</p>
                    <p className="font-medium">{underwriterData.policyDetails.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Policy Type</p>
                    <p className="font-medium">{underwriterData.policyDetails.policyType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Coverage Amount</p>
                    <p className="font-medium">{underwriterData.policyDetails.coverageAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Premium</p>
                    <p className="font-medium">{underwriterData.policyDetails.premium}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Premium Frequency</p>
                    <p className="font-medium">{underwriterData.policyDetails.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Policy Status</p>
                    <p className="font-medium">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                        {underwriterData.policyDetails.status}
                      </div>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inception Date</p>
                    <p className="font-medium">{underwriterData.policyDetails.inceptionDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Capture Date</p>
                    <p className="font-medium">{underwriterData.policyDetails.captureDate}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Client Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{underwriterData.clientDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p className="font-medium">{underwriterData.clientDetails.idNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium">{underwriterData.clientDetails.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Coverage Amount</p>
                    <p className="font-medium">{underwriterData.clientDetails.coverageAmount}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Death Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Deceased Name</p>
                    <p className="font-medium">{underwriterData.claimDetails.deathInformation.deceased.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Deceased ID Number</p>
                    <p className="font-medium">{underwriterData.claimDetails.deathInformation.deceased.idNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium">{underwriterData.claimDetails.deathInformation.deceased.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Death</p>
                    <p className="font-medium">{underwriterData.claimDetails.deathInformation.deceased.dateOfDeath}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Cause of Death</p>
                    <p className="font-medium">{underwriterData.claimDetails.deathInformation.deceased.causeOfDeath}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Place of Death</p>
                    <p className="font-medium">{underwriterData.claimDetails.deathInformation.deceased.placeOfDeath}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Funeral Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Funeral Home</p>
                      <p className="font-medium">{underwriterData.claimDetails.deathInformation.funeral.funeralHome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Funeral Date</p>
                      <p className="font-medium">{underwriterData.claimDetails.deathInformation.funeral.funeralDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Burial Location</p>
                      <p className="font-medium">{underwriterData.claimDetails.deathInformation.funeral.burialLocation}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <File className="h-5 w-5 mr-2 text-blue-600" />
                  Documents Submitted
                </h3>
                <div className="space-y-2">
                  {underwriterData.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 border rounded-md">
                      <div className="flex items-center">
                        {doc.type === 'death_certificate' && <FileText className="h-4 w-4 mr-2" />}
                        {doc.type === 'id_document' && <User className="h-4 w-4 mr-2" />}
                        {doc.type === 'bank_statement' && <DollarSign className="h-4 w-4 mr-2" />}
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.uploadDate).toLocaleDateString()} • 
                            {doc.status === 'verified' ? 
                              <span className="text-green-600 ml-1">Verified</span> : 
                              <span className="text-amber-600 ml-1">{doc.status}</span>
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Beneficiary Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{underwriterData.beneficiaryDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p className="font-medium">{underwriterData.beneficiaryDetails.idNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Relationship</p>
                    <p className="font-medium">{underwriterData.beneficiaryDetails.relationship}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{underwriterData.beneficiaryDetails.contactNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Percentage</p>
                    <p className="font-medium">{underwriterData.beneficiaryDetails.percentage}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                  Payment Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Payment Details</p>
                    <p className="font-medium">{underwriterData.paymentDetails.method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-100 text-amber-800 border-amber-200">
                        {underwriterData.paymentDetails.status}
                      </div>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount Requested</p>
                    <p className="font-medium">{underwriterData.paymentDetails.amountRequested}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Bank Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Account Holder</p>
                      <p className="font-medium">{underwriterData.paymentDetails.bankDetails.accountHolder}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium">{underwriterData.paymentDetails.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium">{underwriterData.paymentDetails.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Type</p>
                      <p className="font-medium">{underwriterData.paymentDetails.bankDetails.accountType}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Additional Information
                </h3>
                <div>
                  <p className="text-sm text-gray-500">Underwriting Notes</p>
                  <p className="font-medium">{underwriterData.underwritingNotes}</p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Submission Timestamp</p>
                  <p className="font-medium">{new Date(underwriterData.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sticky bottom-0 bg-white p-4 border-t flex items-center justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowUnderwriterPreview(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSendToUnderwriter}
              disabled={isSendingToUnderwriter}
            >
              {isSendingToUnderwriter ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Underwriter
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Import our shared navigation menu component

  return (
    <div className="container mx-auto p-6">
      {showUnderwriterPreview && <UnderwriterPreviewDialog />}
      
      <NavigationMenu />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span onClick={() => navigate("/claims")} className="hover:underline cursor-pointer">Claims</span>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-700">{claim.id}</span>
          
          {claim.attentionItems > 0 && (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ml-2 bg-amber-100 text-amber-800 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {claim.attentionItems} items need your attention
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={sendToUnderwriter}
            className="mr-2"
            disabled={!isCurrentUserHandler || sentToUnderwriter || !deathInfoCaptured || !checkDocumentationComplete()}
          >
            {isSendingToUnderwriter ? (
              "Sending..."
            ) : sentToUnderwriter ? (
              <>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Sent to Underwriter
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Send to Underwriter
              </>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                Action
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setResolved(true)}>
                <Check className="mr-2 h-4 w-4" />
                Validate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                Move to Provider Review
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Set Follow-Up
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Check className="mr-2 h-4 w-4" />
                Hold Claim
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <X className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-5 border-b">
                <div className="p-4 border-r">
                  <div className="text-sm text-gray-500">Policy</div>
                  <div className="font-medium">{claim.policy.number}</div>
                </div>
                <div className="p-4 border-r">
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-medium">{claim.policy.category}</div>
                </div>
                <div className="p-4 border-r">
                  <div className="text-sm text-gray-500">Source</div>
                  <div className="font-medium">{claim.source.name}</div>
                </div>
                <div className="p-4 border-r">
                  <div className="text-sm text-gray-500">Source Type</div>
                  <div className="font-medium">{claim.source.type}</div>
                </div>
                <div className="p-4">
                  <div className="text-sm text-gray-500">Claims Handler</div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">
                      {claimHandler || claim.claimsHandler}
                      {isCurrentUserHandler && (
                        <span className="ml-2 text-xs text-blue-600">(You)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full">
                <TabsList className="bg-white border-b h-12 rounded-none w-full justify-start p-0 px-4">
                  <TabsTrigger value="claim-info" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none py-3">Claim Info</TabsTrigger>
                  <TabsTrigger value="payment" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none py-3">Payment</TabsTrigger>
                  <TabsTrigger value="diagnosis" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none py-3">Diagnosis & Procedure</TabsTrigger>
                  <TabsTrigger value="documents" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none py-3">Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="claim-info" className="py-0">
                  <div className="p-6">
                    
                    <h3 className="text-lg font-semibold mt-6 mb-4">Funeral Policy Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Policy Type</div>
                        <div className="font-medium">{funeralPolicyDetails.policyType}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Policy Number</div>
                        <div className="font-medium">{funeralPolicyDetails.policyNumber}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Coverage Amount</div>
                        <div className="font-medium">R{funeralPolicyDetails.coverageAmount}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Premium</div>
                        <div className="font-medium">R {funeralPolicyDetails.premium} ({funeralPolicyDetails.frequency})</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Capture Date</div>
                        <div className="font-medium">{new Date(funeralPolicyDetails.captureDate).toLocaleDateString()}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Inception Date</div>
                        <div className="font-medium">{new Date(funeralPolicyDetails.inceptionDate).toLocaleDateString()}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="font-medium">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                            {funeralPolicyDetails.status}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-4">Policy Members</h3>
                    
                    <div className="bg-white rounded mb-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member Type</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>ID Number</TableHead>
                            <TableHead>Date of Birth</TableHead>
                            <TableHead>Relationship</TableHead>
                            <TableHead className="text-right">Coverage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {funeralPolicyDetails.members.map((member, index) => (
                            <TableRow key={index}>
                              <TableCell>{member.type}</TableCell>
                              <TableCell>{member.name}</TableCell>
                              <TableCell>{member.idNumber}</TableCell>
                              <TableCell>{new Date(member.dateOfBirth).toLocaleDateString()}</TableCell>
                              <TableCell>{member.relationship || "N/A"}</TableCell>
                              <TableCell className="text-right">R{member.coverageAmount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-4">Beneficiaries</h3>
                    
                    <div className="bg-white rounded mb-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>ID Number</TableHead>
                            <TableHead>Relationship</TableHead>
                            <TableHead>Contact Number</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {funeralPolicyDetails.beneficiaries.map((beneficiary, index) => (
                            <TableRow key={index}>
                              <TableCell>{beneficiary.name}</TableCell>
                              <TableCell>{beneficiary.idNumber}</TableCell>
                              <TableCell>{beneficiary.relationship}</TableCell>
                              <TableCell>{beneficiary.contactNumber}</TableCell>
                              <TableCell className="text-right">{beneficiary.percentage}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-4">Primary Insurance</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Payer Name</div>
                        <div className="font-medium">{claim.payer.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Group</div>
                        <div className="font-medium">{claim.payer.group}</div>
                      </div>
                      <div></div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Address</div>
                        <div className="font-medium">{claim.payer.address}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{claim.payer.phone}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">Insurance Card</div>
                        <Button variant="outline" size="sm">Upload Image</Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-right mt-4">
                      Last updated 3 mins ago
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="payment">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                    
                    <div className="bg-white rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>{new Date('2023-08-15').toLocaleDateString()}</TableCell>
                            <TableCell>TX-57812345</TableCell>
                            <TableCell>Payment</TableCell>
                            <TableCell>Advance payment for hospital admission</TableCell>
                            <TableCell className="text-right">R 5,000.00</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Completed
                              </Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>{new Date('2023-08-20').toLocaleDateString()}</TableCell>
                            <TableCell>TX-57823456</TableCell>
                            <TableCell>Payment</TableCell>
                            <TableCell>Balance payment for hospital services</TableCell>
                            <TableCell className="text-right">R 3,200.00</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Completed
                              </Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>{new Date('2023-08-25').toLocaleDateString()}</TableCell>
                            <TableCell>TX-57834567</TableCell>
                            <TableCell>Refund</TableCell>
                            <TableCell>Medication charges adjustment</TableCell>
                            <TableCell className="text-right">R 450.00</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                Processing
                              </Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>{new Date('2023-09-01').toLocaleDateString()}</TableCell>
                            <TableCell>TX-57845678</TableCell>
                            <TableCell>Payment</TableCell>
                            <TableCell>Final settlement for all services</TableCell>
                            <TableCell className="text-right">R 3,850.00</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                Pending
                              </Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={4} className="font-semibold">Total Disbursed</TableCell>
                            <TableCell className="text-right font-semibold">R 8,200.00</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={4} className="font-semibold">Total Pending</TableCell>
                            <TableCell className="text-right font-semibold">R 3,400.00</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <DollarSign className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-semibold">Bank Transfer</div>
                                  <div className="text-sm text-gray-500">Standard Bank Account</div>
                                </div>
                              </div>
                              <div className="mt-3 text-sm">
                                <div className="flex justify-between py-1">
                                  <span className="text-gray-500">Account Holder:</span>
                                  <span className="font-medium">John Smith</span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-gray-500">Account Number:</span>
                                  <span className="font-medium">****5678</span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-gray-500">Bank:</span>
                                  <span className="font-medium">Standard Bank</span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-gray-500">Branch Code:</span>
                                  <span className="font-medium">051001</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-right mt-4">
                      Last updated 3 mins ago
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="diagnosis">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Death Information</h3>
                      {!deathInfoCaptured && (
                        <Button 
                          size="sm"
                          onClick={() => setDeathInfoCaptured(true)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Confirm Death Information
                        </Button>
                      )}
                      {deathInfoCaptured && (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Death Information Confirmed
                        </div>
                      )}
                    </div>
                    
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-base">Deceased Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Name</div>
                            <div className="font-medium">{claimDeathInfo.deceased.name}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">ID Number</div>
                            <div className="font-medium">{claimDeathInfo.deceased.idNumber}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Relationship to Main Member</div>
                            <div className="font-medium">{claimDeathInfo.deceased.relationship}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Date of Death</div>
                            <div className="font-medium">{new Date(claimDeathInfo.deceased.dateOfDeath).toLocaleDateString()}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Place of Death</div>
                            <div className="font-medium">{claimDeathInfo.deceased.placeOfDeath}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Cause of Death</div>
                            <div className="font-medium">{claimDeathInfo.deceased.causeOfDeath}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Death Certificate Number</div>
                            <div className="font-medium">DC2023104569</div>
                          </div>
                        </div>
                        
                        {!deathInfoCaptured && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-start">
                              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                              <div>
                                <p className="text-sm text-blue-700 font-medium">Important</p>
                                <p className="text-sm text-blue-600 mt-1">
                                  Please verify the death information above before confirming. This information will be sent 
                                  to the underwriters for final claim processing.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {deathInfoCaptured && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-start">
                              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                              <div>
                                <p className="text-sm text-green-700 font-medium">Confirmed</p>
                                <p className="text-sm text-green-600 mt-1">
                                  Death information has been verified and is ready for the underwriting process.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-base">Funeral Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Funeral Home</div>
                            <div className="font-medium">{claimDeathInfo.funeral.funeralHome}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Funeral Date</div>
                            <div className="font-medium">{new Date(claimDeathInfo.funeral.funeralDate).toLocaleDateString()}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Burial Location</div>
                            <div className="font-medium">{claimDeathInfo.funeral.burialLocation}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Informant Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Name</div>
                            <div className="font-medium">{claimDeathInfo.informant.name}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Relationship</div>
                            <div className="font-medium">{claimDeathInfo.informant.relationship}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Contact Number</div>
                            <div className="font-medium">{claimDeathInfo.informant.contactNumber}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Email</div>
                            <div className="font-medium">{claimDeathInfo.informant.email}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="mt-6">
                      <p className="text-sm text-gray-500">
                        The death information must be confirmed before the claim can be sent to underwriting.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="documents">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Documents</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <select 
                            className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600" 
                            value={documentType}
                            onChange={handleDocumentTypeChange}
                          >
                            <option value="death_certificate">Death Certificate</option>
                            <option value="id_document">ID Document</option>
                            <option value="bank_statement">Bank Statement</option>
                            <option value="beneficiary_id">Beneficiary ID</option>
                            <option value="bank_details">Bank Details</option>
                            <option value="policy_document">Policy Document</option>
                            <option value="medical_report">Medical Report</option>
                            <option value="sworn_affidavit">Sworn Affidavit</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <Button onClick={triggerFileInput} className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Document
                        </Button>
                        <input 
                          type="file" 
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {uploadedDocuments.map((doc) => {
                        const isImage = doc.type.startsWith('image/');
                        const isPdf = doc.type === 'application/pdf';
                        const isDoc = doc.type.includes('word') || doc.type.includes('msword');
                        
                        return (
                          <Card key={doc.id} className="overflow-hidden">
                            <div className="h-36 bg-gray-50 flex items-center justify-center border-b">
                              {isImage ? (
                                <Image className="h-12 w-12 text-gray-400" />
                              ) : isPdf ? (
                                <FileText className="h-12 w-12 text-red-400" />
                              ) : isDoc ? (
                                <File className="h-12 w-12 text-blue-400" />
                              ) : (
                                <Paperclip className="h-12 w-12 text-gray-400" />
                              )}
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-sm mb-1 truncate" title={doc.name}>{doc.name}</h4>
                                  <p className="text-xs text-gray-500 mb-2">{formatFileSize(doc.size)}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-gray-500 hover:text-red-500"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border 
                                    ${doc.status === 'uploaded' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''} 
                                    ${doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''} 
                                    ${doc.status === 'verified' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                                    ${doc.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                                  `}
                                >
                                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(doc.uploadDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    
                    {uploadedDocuments.length === 0 && (
                      <div className="text-center py-12 border border-dashed rounded-lg">
                        <Paperclip className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
                        <p className="text-gray-500 mb-4">Upload documents to complete the claim</p>
                        <Button onClick={triggerFileInput}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <h3 className="text-md font-semibold mb-4">Required Documents</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded p-4">
                          <div className="flex items-center mb-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">Death Certificate</div>
                              <div className="text-xs text-gray-500">Original or certified copy</div>
                            </div>
                          </div>
                        </div>
                        <div className="border rounded p-4">
                          <div className="flex items-center mb-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                              <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">ID Document</div>
                              <div className="text-xs text-gray-500">Copy of the deceased's ID</div>
                            </div>
                          </div>
                        </div>
                        <div className="border rounded p-4">
                          <div className="flex items-center mb-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              <X className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium">Beneficiary ID</div>
                              <div className="text-xs text-gray-500">Copy of beneficiary's ID document</div>
                            </div>
                          </div>
                        </div>
                        <div className="border rounded p-4">
                          <div className="flex items-center mb-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              <X className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium">Beneficiary ID</div>
                              <div className="text-xs text-gray-500">Copy of beneficiary's ID document</div>
                            </div>
                          </div>
                        </div>
                        <div className="border rounded p-4">
                          <div className="flex items-center mb-3">
                            <div className={`h-8 w-8 rounded-full ${uploadedDocuments.some(doc => doc.documentType === 'bank_statement') ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center mr-3`}>
                              {uploadedDocuments.some(doc => doc.documentType === 'bank_statement') ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">Bank Statement</div>
                              <div className="text-xs text-gray-500">Recent bank statement for payment processing</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Status</div>
                  <div className="font-semibold text-blue-600">Notes</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col gap-2">
                  <div className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium w-fit ${claim.status === "active" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-gray-100 text-gray-800 border border-gray-200"}`}>
                    Active
                  </div>
                  <div className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium w-fit ${claim.status === "resolved" || resolved ? "bg-green-100 text-green-800 border border-green-200" : "bg-gray-100 text-gray-800 border border-gray-200"}`}>
                    Resolved
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Send to Underwriter Card */}
            <Card className={sentToUnderwriter ? 'border-green-500' : ''}>
              <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Send to Underwriter</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {sentToUnderwriter ? (
                  <div className="text-center py-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-2">
                      <MailCheck className="h-6 w-6" />
                    </div>
                    <div className="font-medium text-green-600 mb-1">Sent to Underwriter</div>
                    <div className="text-sm text-gray-500">Claim has been submitted for underwriting review</div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm mb-4">
                      Before sending the claim to underwriters, ensure:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li className={checkDocumentationComplete() ? "text-green-600" : "text-gray-600"}>
                          {checkDocumentationComplete() ? "✓ " : ""}
                          All required documentation is uploaded
                        </li>
                        <li className={deathInfoCaptured ? "text-green-600" : "text-gray-600"}>
                          {deathInfoCaptured ? "✓ " : ""}
                          Death information has been captured
                        </li>
                        <li className={isCurrentUserHandler ? "text-green-600" : "text-gray-600"}>
                          {isCurrentUserHandler ? "✓ " : ""}
                          You are assigned as claims handler
                        </li>
                      </ul>
                    </div>
                    <Button 
                      onClick={sendToUnderwriter} 
                      className="w-full"
                      disabled={!isClaimReadyForUnderwriter() || isSendingToUnderwriter}
                    >
                      {isSendingToUnderwriter ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send to Underwriter
                        </>
                      )}
                    </Button>
                    {!isClaimReadyForUnderwriter() && (
                      <div className="text-xs text-amber-600 mt-2">
                        Please complete all required steps before sending to underwriter
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Claims Handler Card */}
            <Card>
              <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Claims Handler</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  {isCurrentUserHandler ? (
                    <>
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{currentUser.name} <span className="text-xs text-blue-600">(You)</span></div>
                        <div className="text-sm text-gray-500">{currentUser.role}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-semibold">{claimHandler || claim.claimsHandler}</div>
                        <div className="text-sm text-gray-500">Claim Handler</div>
                      </div>
                    </>
                  )}
                </div>
                
                {!isCurrentUserHandler && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={assignSelfAsHandler}
                    disabled={assigningHandler}
                  >
                    {assigningHandler ? (
                      <>
                        <span className="mr-1">Assigning...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        <span>Assign myself as handler</span>
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
            
            {/* Medical Expenses Card */}
            <Card>
              <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Medical Expenses</div>
                  <div className="flex">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="text-xs text-gray-500">
                  Entered On {new Date(claim.medicalExpenses.enteredDate).toLocaleDateString()} by {claim.medicalExpenses.enteredBy}
                </div>
                <p className="text-sm">
                  {claim.medicalExpenses.providerNotes}
                </p>
                <div className="flex gap-2">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${claim.medicalExpenses.validationStatus.verification ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}`}>
                    Verification
                  </div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${claim.medicalExpenses.validationStatus.billing ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}`}>
                    Billing
                  </div>
                  <div className="ml-auto">@2</div>
                </div>
              </CardContent>
            </Card>
            
            {/* Codes Card */}
            <Card>
              <CardHeader className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Codes</div>
                  <div className="flex">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="text-xs text-gray-500">
                  Entered On {new Date(claim.codes.enteredDate).toLocaleDateString()} by {claim.codes.enteredBy}
                </div>
                <p className="text-sm">
                  {claim.codes.notes}
                </p>
                <div className="flex gap-2 text-xs">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                    Documents
                  </div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                    Change Sheet
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}