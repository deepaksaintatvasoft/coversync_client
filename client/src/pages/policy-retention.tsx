import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Download, 
  Mail, 
  MessageSquare, 
  Filter, 
  ArrowDown, 
  ArrowUp 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/status-badge";

interface Policy {
  id: number;
  policyNumber: string;
  clientId: number;
  status: string;
  premium: number;
  frequency: string;
  captureDate: string;
  inceptionDate: string | null;
  renewalDate: string | null;
  bankDetailId: number | null;
  notes: string | null;
  client: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  policyType: {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
  };
}

const PolicyRetention: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inactive");
  const [sortField, setSortField] = useState<string>("captureDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  
  // Fetch inactive policies
  const { 
    data: inactivePolicies, 
    isLoading: isLoadingInactive,
    isError: isErrorInactive,
    error: errorInactive
  } = useQuery({ 
    queryKey: ['/api/policies/inactive'],
    enabled: activeTab === "inactive" 
  });
  
  // Fetch policies with failed payments
  const { 
    data: failedPaymentPolicies, 
    isLoading: isLoadingFailed,
    isError: isErrorFailed,
    error: errorFailed
  } = useQuery({ 
    queryKey: ['/api/policies/failed-payments'],
    enabled: activeTab === "failed-payments" 
  });
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const sortPolicies = (policies: Policy[]) => {
    if (!policies) return [];
    
    return [...policies].sort((a, b) => {
      let aValue: any = a[sortField as keyof Policy];
      let bValue: any = b[sortField as keyof Policy];
      
      // Handle nested properties
      if (sortField.includes('.')) {
        const [parent, child] = sortField.split('.');
        aValue = a[parent as keyof Policy]?.[child];
        bValue = b[parent as keyof Policy]?.[child];
      }
      
      // Handle null values
      if (aValue === null) return sortDirection === "asc" ? -1 : 1;
      if (bValue === null) return sortDirection === "asc" ? 1 : -1;
      
      // Handle dates
      if (sortField.includes('Date')) {
        const dateA = aValue ? new Date(aValue).getTime() : 0;
        const dateB = bValue ? new Date(bValue).getTime() : 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
      
      // Handle strings
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Handle numbers
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });
  };
  
  const openEmailDialog = (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowEmailDialog(true);
  };
  
  const sendEmail = () => {
    toast({
      title: "Email Sent",
      description: `Retention email sent to ${selectedPolicy?.client.name}`,
    });
    setShowEmailDialog(false);
  };
  
  const sendSMS = (policy: Policy) => {
    toast({
      title: "SMS Sent",
      description: `Retention SMS sent to ${policy.client.name}`,
    });
  };
  
  const downloadReport = () => {
    toast({
      title: "Report Downloaded",
      description: "Policy retention report has been downloaded",
    });
  };
  
  const renderSortIcon = (field: string) => {
    if (sortField === field) {
      return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    }
    return null;
  };
  
  const renderPoliciesTable = (policies: Policy[] | unknown, isLoading: boolean, isError: boolean, error: any) => {
    // Safe type conversion
    const safePolicies = Array.isArray(policies) ? policies : [];
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium">Error Loading Policies</h3>
          <p className="text-sm text-gray-500 mt-2">
            {error?.message || "Failed to load policies. Please try again."}
          </p>
        </div>
      );
    }
    
    if (!safePolicies || safePolicies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Filter className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No Policies Found</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            There are no policies in this category. They will appear here when their status changes.
          </p>
        </div>
      );
    }
    
    const sortedPolicies = sortPolicies(safePolicies);
    
    // Mobile and desktop layouts
    return (
      <div>
        {/* Desktop view (hidden on small screens) */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">
                  <div 
                    className="flex items-center cursor-pointer" 
                    onClick={() => handleSort("policyNumber")}
                  >
                    Policy Number {renderSortIcon("policyNumber")}
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer" 
                    onClick={() => handleSort("client.name")}
                  >
                    Client {renderSortIcon("client.name")}
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer" 
                    onClick={() => handleSort("policyType.name")}
                  >
                    Policy Type {renderSortIcon("policyType.name")}
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer" 
                    onClick={() => handleSort("premium")}
                  >
                    Premium {renderSortIcon("premium")}
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer" 
                    onClick={() => handleSort("status")}
                  >
                    Status {renderSortIcon("status")}
                  </div>
                </TableHead>
                <TableHead>
                  <div 
                    className="flex items-center cursor-pointer" 
                    onClick={() => handleSort("captureDate")}
                  >
                    Date {renderSortIcon("captureDate")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{policy.client.name}</div>
                    <div className="text-sm text-gray-500">{policy.client.phone || policy.client.email}</div>
                  </TableCell>
                  <TableCell>{policy.policyType.name}</TableCell>
                  <TableCell>{formatCurrency(policy.premium)} ({policy.frequency})</TableCell>
                  <TableCell>
                    <StatusBadge status={policy.status} />
                  </TableCell>
                  <TableCell>{formatDate(policy.captureDate)}</TableCell>
                  <TableCell className="flex justify-end items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => openEmailDialog(policy)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => sendSMS(policy)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      SMS
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile view (visible only on small screens) */}
        <div className="md:hidden space-y-4">
          {sortedPolicies.map((policy) => (
            <Card key={policy.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">{policy.policyNumber}</div>
                  <div className="text-sm font-medium">{policy.client.name}</div>
                </div>
                <StatusBadge status={policy.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div className="text-gray-500">Policy Type:</div>
                <div>{policy.policyType.name}</div>
                
                <div className="text-gray-500">Premium:</div>
                <div>{formatCurrency(policy.premium)} ({policy.frequency})</div>
                
                <div className="text-gray-500">Date:</div>
                <div>{formatDate(policy.captureDate)}</div>
                
                <div className="text-gray-500">Contact:</div>
                <div className="truncate">{policy.client.phone || policy.client.email}</div>
              </div>
              
              <div className="mt-4 flex space-x-2 justify-end">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => openEmailDialog(policy)}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => sendSMS(policy)}
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  SMS
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <TopBar user={{name: "Admin"}} onMobileMenuClick={() => {}} />
        <div className="container mx-auto py-4 md:py-8 px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-900">Policy Retention</h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base">
                Manage inactive policies and failed payments to improve retention
              </p>
            </div>
            <Button variant="outline" onClick={downloadReport} className="w-full md:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        
        <Card className="mb-8">
          <CardHeader className="px-4 md:px-6">
            <CardTitle>Retention Dashboard</CardTitle>
            <CardDescription>
              View and manage policies that require attention to improve customer retention.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 md:px-6 overflow-x-auto">
            <Tabs 
              defaultValue="inactive" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="inactive">Inactive Policies</TabsTrigger>
                <TabsTrigger value="failed-payments">Failed Payments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inactive">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Inactive Policies
                        {!isLoadingInactive && inactivePolicies && Array.isArray(inactivePolicies) && (
                          <Badge variant="outline" className="ml-2">
                            {inactivePolicies.length}
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Policies with status expired, cancelled, or inactive
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto -mx-2 px-2">
                    {renderPoliciesTable(inactivePolicies, isLoadingInactive, isErrorInactive, errorInactive)}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="failed-payments">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Failed Payments
                        {!isLoadingFailed && failedPaymentPolicies && Array.isArray(failedPaymentPolicies) && (
                          <Badge variant="outline" className="ml-2">
                            {failedPaymentPolicies.length}
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Policies with payment failures that need follow up
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto -mx-2 px-2">
                    {renderPoliciesTable(failedPaymentPolicies, isLoadingFailed, isErrorFailed, errorFailed)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Retention Email</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Sending to:</h3>
              <p className="text-base break-words">{selectedPolicy?.client.name} &lt;{selectedPolicy?.client.email}&gt;</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Policy Details:</h3>
              <p className="text-base">{selectedPolicy?.policyNumber} - {selectedPolicy?.policyType.name}</p>
              <p className="text-sm text-gray-500">Status: {selectedPolicy?.status}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500">Message Preview:</h3>
              <div className="mt-2 p-3 border rounded-md bg-gray-50 text-sm md:text-base">
                <p>Dear {selectedPolicy?.client.name},</p>
                <p className="mt-2">
                  We noticed that your policy {selectedPolicy?.policyNumber} is currently {selectedPolicy?.status}.
                  We value you as our customer and would like to discuss options to reinstate your coverage.
                </p>
                <p className="mt-2">
                  Please contact our customer service team at your earliest convenience to discuss your options.
                </p>
                <p className="mt-2">Thank you for choosing CoverSync.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)} className="w-full md:w-auto order-1 md:order-none">
                Cancel
              </Button>
              <Button onClick={sendEmail} className="w-full md:w-auto">
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default PolicyRetention;