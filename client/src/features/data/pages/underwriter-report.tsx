import { Button } from "@/features/data/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/features/data/components/ui/card";
import { Separator } from "@/features/data/components/ui/separator";
import { CustomBadge } from "../components/custom-badge";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { NavigationMenu } from "@/features/data/components/navigation-menu";

export default function UnderwriterReport() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Example claim data - in a real application, this would come from an API
  const claimData = {
    claimNumber: "CL-7891",
    dateSubmitted: "2024-03-25",
    policyNumber: "POL-1234",
    policyHolder: "Robert Chen",
    idNumber: "7512045383089",
    deceased: {
      name: "Maria Chen",
      relationship: "Spouse",
      idNumber: "7610015423086",
      dateOfBirth: "1976-10-01",
      dateOfDeath: "2024-03-10",
      causeOfDeath: "Cardiac Arrest",
      placeOfDeath: "Johannesburg General Hospital"
    },
    policy: {
      type: "Family Plan",
      coverAmount: "R25,000",
      startDate: "2020-05-15",
      status: "Active",
      premiumAmount: "R230",
      lastPaymentDate: "2024-02-15"
    },
    documents: [
      { name: "Death Certificate", status: "Verified", uploadDate: "2024-03-20" },
      { name: "ID Document (Deceased)", status: "Verified", uploadDate: "2024-03-20" },
      { name: "ID Document (Policyholder)", status: "Verified", uploadDate: "2024-03-20" },
      { name: "Medical Report", status: "Pending Verification", uploadDate: "2024-03-21" }
    ],
    beneficiary: {
      name: "Robert Chen",
      idNumber: "7512045383089",
      relationship: "Spouse",
      contactNumber: "0821234567",
      bankName: "Standard Bank",
      accountNumber: "123456789",
      accountType: "Savings"
    },
    handler: {
      name: "Sarah Mokoena",
      branch: "Johannesburg Central",
      contactNumber: "0113456789",
      email: "sarah.mokoena@insureco.co.za"
    }
  };
  
  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      toast({
        title: "Report Generated",
        description: "Underwriter report has been generated and sent.",
        variant: "default",
      });
      setIsGenerating(false);
    }, 1500);
  };
  
  return (
    <div className="container mx-auto p-6">
      <NavigationMenu />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Underwriter Report</h1>
          <p className="text-gray-500">Comprehensive claim information for underwriter review</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/claims")}>
            Back to Claims
          </Button>
          <Button onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate PDF Report"}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claim Summary Card */}
        <Card>
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle>Claim Summary</CardTitle>
            <CardDescription>Essential claim details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Claim Number:</span>
                <span className="font-medium">{claimData.claimNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date Submitted:</span>
                <span className="font-medium">{claimData.dateSubmitted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Policy Number:</span>
                <span className="font-medium">{claimData.policyNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Policy Holder:</span>
                <span className="font-medium">{claimData.policyHolder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Claim Status:</span>
                <CustomBadge className="bg-amber-100 text-amber-800 border-amber-200">
                  Awaiting Underwriter Review
                </CustomBadge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Deceased Information Card */}
        <Card>
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle>Deceased Information</CardTitle>
            <CardDescription>Details of the deceased person</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{claimData.deceased.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Relationship to Policyholder:</span>
                <span className="font-medium">{claimData.deceased.relationship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID Number:</span>
                <span className="font-medium">{claimData.deceased.idNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date of Birth:</span>
                <span className="font-medium">{claimData.deceased.dateOfBirth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date of Death:</span>
                <span className="font-medium">{claimData.deceased.dateOfDeath}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cause of Death:</span>
                <span className="font-medium">{claimData.deceased.causeOfDeath}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Place of Death:</span>
                <span className="font-medium">{claimData.deceased.placeOfDeath}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Policy Information Card */}
        <Card>
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle>Policy Information</CardTitle>
            <CardDescription>Policy details relevant to the claim</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Policy Type:</span>
                <span className="font-medium">{claimData.policy.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cover Amount:</span>
                <span className="font-medium">{claimData.policy.coverAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Policy Start Date:</span>
                <span className="font-medium">{claimData.policy.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Policy Status:</span>
                <CustomBadge className="bg-green-100 text-green-800 border-green-200">
                  {claimData.policy.status}
                </CustomBadge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Premium Amount:</span>
                <span className="font-medium">{claimData.policy.premiumAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Payment Date:</span>
                <span className="font-medium">{claimData.policy.lastPaymentDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Documents Card */}
        <Card>
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle>Supporting Documents</CardTitle>
            <CardDescription>Verification status of submitted documents</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="divide-y">
              {claimData.documents.map((doc, index) => (
                <div key={index} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-500">Uploaded: {doc.uploadDate}</p>
                  </div>
                  <CustomBadge
                    className={
                      doc.status === "Verified" 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }
                  >
                    {doc.status}
                  </CustomBadge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Beneficiary Information Card */}
        <Card>
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle>Beneficiary Information</CardTitle>
            <CardDescription>Payment details for claim settlement</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{claimData.beneficiary.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID Number:</span>
                <span className="font-medium">{claimData.beneficiary.idNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Relationship:</span>
                <span className="font-medium">{claimData.beneficiary.relationship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contact Number:</span>
                <span className="font-medium">{claimData.beneficiary.contactNumber}</span>
              </div>
              <Separator className="my-2" />
              <h3 className="font-semibold text-gray-700">Banking Details</h3>
              <div className="flex justify-between">
                <span className="text-gray-500">Bank Name:</span>
                <span className="font-medium">{claimData.beneficiary.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Number:</span>
                <span className="font-medium">{claimData.beneficiary.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Type:</span>
                <span className="font-medium">{claimData.beneficiary.accountType}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Claim Handler Information Card */}
        <Card>
          <CardHeader className="bg-gray-50 rounded-t-lg">
            <CardTitle>Claim Handler Information</CardTitle>
            <CardDescription>Contact details of the claim handler</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{claimData.handler.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Branch:</span>
                <span className="font-medium">{claimData.handler.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contact Number:</span>
                <span className="font-medium">{claimData.handler.contactNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{claimData.handler.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader className="bg-gray-50 rounded-t-lg">
          <CardTitle>Underwriter Assessment</CardTitle>
          <CardDescription>Recommendations and notes for the underwriter</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Claim Verification Checklist</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Policy Validity</p>
                    <p className="text-sm text-gray-600">Policy was active at time of death</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Waiting Period</p>
                    <p className="text-sm text-gray-600">Waiting period of 6 months was fully served</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Premiums</p>
                    <p className="text-sm text-gray-600">All premium payments are up to date</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Medical Documentation</p>
                    <p className="text-sm text-gray-600">Medical report requires verification</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Assessment Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  This claim meets all primary verification requirements for the Family Plan policy.
                  The deceased was the spouse of the policyholder, properly listed as a dependent on
                  the policy. All supporting documents have been verified except for the medical report,
                  which is currently under review.
                </p>
                <p className="text-gray-700 mt-3">
                  The policy has been active for over 3 years with consistent premium payments.
                  The cause of death (Cardiac Arrest) is not subject to any exclusions under the policy terms.
                  Recommend approval pending final verification of the medical report.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 rounded-b-lg flex justify-between">
          <div className="text-sm text-gray-500">
            Generated on: {new Date().toLocaleDateString('en-ZA')}
          </div>
          <div className="text-sm font-medium">
            Ref: UW-2024-{claimData.claimNumber}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}