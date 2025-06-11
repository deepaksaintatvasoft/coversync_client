import { format } from "date-fns";
import { 
  CalendarIcon, 
  Clock, 
  CreditCard, 
  FileText, 
  User, 
  Users, 
  ShieldCheck, 
  Building, 
  Phone,
  Mail,
  Home,
  Calendar,
  Gift,
  Briefcase,
  BadgeCheck,
  X
} from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { BadgeStatus } from "@/components/ui/badge-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { type PolicyWithDetails } from "@shared/schema";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type PolicyDetailsDialogProps = {
  policy?: PolicyWithDetails | null;
  policyId?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PolicyDetailsDialog({
  policy: policyProp,
  policyId,
  open,
  onOpenChange,
}: PolicyDetailsDialogProps) {
  // Fetch policy details if policyId is provided but policy is not
  const { data: fetchedPolicy, isLoading } = useQuery<PolicyWithDetails>({
    queryKey: [`/api/policies/${policyId}/details`],
    enabled: !!policyId && !policyProp && open,
  });
  
  // Use the provided policy or the fetched one
  const policy = policyProp || fetchedPolicy;
  
  const { toast } = useToast();
  
  if ((!policy && !isLoading) || (isLoading && !open)) {
    return null;
  }
  
  if (isLoading && !policy) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] md:max-h-[90vh] flex flex-col w-[95vw] md:w-auto pt-8">
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            <span className="ml-3">Loading policy details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!policy) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 2,
      currencyDisplay: 'symbol',
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), "dd MMM yyyy");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl min-h-[90vh] md:min-h-0 max-h-[90vh] md:max-h-[90vh] flex flex-col w-[95vw] md:w-auto pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Policy Details: {policy.policyNumber}
          </DialogTitle>
          <DialogDescription>
            Complete information about this policy and its coverage details
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 min-h-0 pb-6">
          <TabsList className="mb-4 flex w-full overflow-x-auto space-x-1 px-1">
            <TabsTrigger value="overview" className="text-sm md:text-base">Overview</TabsTrigger>
            <TabsTrigger value="client" className="text-sm md:text-base">Client</TabsTrigger>
            <TabsTrigger value="dependents" className="text-sm md:text-base">Dependents</TabsTrigger>
            <TabsTrigger value="payment" className="text-sm md:text-base">Payment</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-1 md:pr-4 pb-6 h-[75vh] md:h-auto">
            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                      Policy Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Policy Number</p>
                          <p className="font-semibold">{policy.policyNumber}</p>
                        </div>
                        <BadgeStatus
                          variant={policy.status as any}
                          label={policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Policy Type</p>
                        <p className="font-semibold">{policy.policyType?.name || "Unknown"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Captured Date</p>
                          <p className="flex items-center">
                            <CalendarIcon className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {formatDate(policy.captureDate)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Inception Date</p>
                          <p className="flex items-center">
                            <CalendarIcon className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {policy.renewalDate && formatDate(policy.renewalDate)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Premium Amount</p>
                        <p className="font-semibold text-primary-900 flex items-center">
                          <CreditCard className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          {formatCurrency(policy.premium)}/{policy.frequency}
                        </p>
                      </div>

                      {policy.notes && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Notes</p>
                          <p className="text-sm text-gray-700">{policy.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      Main Member
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      <UserAvatar
                        src={policy.client?.avatarUrl || undefined}
                        name={policy.client?.name}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold text-lg">{policy.client?.name}</p>
                        <p className="text-sm text-gray-500">
                          {policy.client?.idNumber ? `ID: ${policy.client.idNumber}` : "No ID provided"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start">
                        <Mail className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-500">Email</p>
                          <p>{policy.client?.email || "Not provided"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Phone className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-500">Phone</p>
                          <p>{policy.client?.phone || "Not provided"}</p>
                        </div>
                      </div>
                      
                      {policy.client?.dateOfBirth && (
                        <div className="flex items-start">
                          <Gift className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-500">Date of Birth</p>
                            <p>{formatDate(policy.client.dateOfBirth)}</p>
                          </div>
                        </div>
                      )}
                      
                      {policy.client?.occupation && (
                        <div className="flex items-start">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-500">Occupation</p>
                            <p>{policy.client.occupation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                      Notes & Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {policy.notes ? (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm whitespace-pre-line">{policy.notes}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No notes or comments have been added to this policy.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                      Policy Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Coverage Amount</p>
                        <p className="font-semibold text-primary-900">
                          {policy.policyType?.coverageAmount 
                            ? formatCurrency(policy.policyType.coverageAmount) 
                            : "Varies by dependent"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Policy Type</p>
                        <div className="font-semibold">
                          <Badge 
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {policy.policyType?.name || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="client" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <UserAvatar
                          src={policy.client?.avatarUrl || undefined}
                          name={policy.client?.name}
                          size="lg"
                        />
                        <div>
                          <h3 className="font-semibold text-xl">{policy.client?.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <BadgeCheck className="h-4 w-4 mr-1 text-primary" />
                            {policy.client?.idNumber ? 
                              `ID Number: ${policy.client.idNumber}` : 
                              "No ID Number provided"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-500">Email Address</p>
                          <p className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {policy.client?.email || "Not provided"}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-medium text-gray-500">Phone Number</p>
                          <p className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {policy.client?.phone || "Not provided"}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-medium text-gray-500">Date of Birth</p>
                          <p className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {policy.client?.dateOfBirth ? 
                              formatDate(policy.client.dateOfBirth) : 
                              "Not provided"}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-medium text-gray-500">Gender</p>
                          <p className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {policy.client?.gender || "Not specified"}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-medium text-gray-500">Occupation</p>
                          <p className="flex items-center">
                            <Briefcase className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {policy.client?.occupation || "Not provided"}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="font-medium text-gray-500">Employer</p>
                          <p className="flex items-center">
                            <Building className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {policy.client?.employerName || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-4" />
                      
                      <div className="space-y-1">
                        <p className="font-medium text-gray-500">Address</p>
                        <p className="flex items-start">
                          <Home className="h-3.5 w-3.5 mr-1 text-gray-500 mt-1" />
                          <span className="whitespace-pre-line">
                            {policy.client?.address || "No address provided"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dependents" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    Dependents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {policy.dependents && policy.dependents.length > 0 ? (
                    <div className="space-y-6">
                      {policy.dependents.map((dependent, index) => (
                        <div 
                          key={dependent.id}
                          className={`p-4 rounded-lg border ${index !== (policy.dependents?.length || 0) - 1 ? 'mb-4' : ''}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                name={dependent.name}
                                size="sm"
                              />
                              <div>
                                <p className="font-semibold">{dependent.name}</p>
                                <p className="text-sm text-gray-500">
                                  {dependent.relationship?.charAt(0).toUpperCase() + dependent.relationship?.slice(1)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-500">Coverage</p>
                                <p className="font-semibold text-primary-900">
                                  100%
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-500">ID Number</p>
                              <p>{dependent.idNumber || "Not provided"}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-500">Date of Birth</p>
                              <p>{dependent.dateOfBirth ? formatDate(dependent.dateOfBirth) : "Not provided"}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium text-gray-500">Gender</p>
                              <p>{dependent.gender || "Not specified"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium mb-1">No dependents</h3>
                      <p className="text-sm">This policy doesn't have any dependents added</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Premium Amount</p>
                          <p className="font-semibold text-lg text-primary-900">
                            {formatCurrency(policy.premium)}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Payment Frequency</p>
                          <p className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {policy.frequency ? 
                              policy.frequency.charAt(0).toUpperCase() + policy.frequency.slice(1) : 
                              "Not specified"
                            }
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Payment Method</p>
                          <p className="flex items-center">
                            <CreditCard className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            Debit Order
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Next Payment Due</p>
                          <p className="flex items-center">
                            <CalendarIcon className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {formatDate(new Date(new Date().setMonth(new Date().getMonth() + 1)))}
                          </p>
                        </div>
                      </div>
                      
                      {policy.bankDetail && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Bank Details</h4>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Account Holder</p>
                            <p>{policy.bankDetail.accountHolderName || "Not provided"}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Bank Name</p>
                            <p>{policy.bankDetail.bankName || "Not provided"}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Account Number</p>
                            <p>
                              {policy.bankDetail.accountNumber ? 
                                policy.bankDetail.accountNumber.replace(/\d(?=\d{4})/g, "*") : 
                                "Not provided"
                              }
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Account Type</p>
                            <p>{policy.bankDetail.accountType || "Not provided"}</p>
                          </div>
                          
                          {policy.bankDetail.branchCode && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500">Branch Code</p>
                              <p>{policy.bankDetail.branchCode}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm font-medium text-gray-500 mb-2">Payment Notes</p>
                      <p className="text-sm whitespace-pre-line">Monthly premium payment via debit order on the 1st of each month.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>Created on {formatDate(policy.createdAt)}</span>
            </div>
          </div>
          
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}