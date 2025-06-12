import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, User, Timer, DollarSign, Plus, CalendarDays, 
  ClipboardCheck, UserPlus, Search, BellRing, BarChart,
  Upload, Download
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { TrendChart } from "@/components/trend-chart";
import { PolicyDistribution } from "@/components/policy-distribution";
import { PoliciesTable } from "@/components/policies-table";
import { UpcomingRenewals } from "@/components/upcoming-renewals";
import { Button } from "@/components/ui/button";
import { PolicyForm } from "@/components/policy-form";
import { PolicyDetailsDialog } from "@/components/policy-details-dialog";
import { apiRequest } from "@/lib/queryClient";
import { type PolicyWithDetails } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [period, setPeriod] = useState("this-month");
  const [isPolicyFormOpen, setIsPolicyFormOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPolicyDetailsOpen, setIsPolicyDetailsOpen] = useState(false);
  const [policyDetailsId, setPolicyDetailsId] = useState<number | null>(null);
  
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<{
    totalPolicies: number;
    activePolicies: number;
    pendingRenewals: number;
    totalRevenue: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });
  
  // Mock total claims count - in a real app this would come from an API
  const totalClaims = 12;
  
  // Fetch recent policies
  const { data: recentPolicies, isLoading: isLoadingPolicies } = useQuery<PolicyWithDetails[]>({
    queryKey: ["/api/policies/recent"],
  });
  
  // Fetch upcoming renewals
  const { data: upcomingRenewals, isLoading: isLoadingRenewals } = useQuery<PolicyWithDetails[]>({
    queryKey: ["/api/policies/renewals"],
  });
  
  // Fetch policy types for distribution chart
  const { data: policyTypes, isLoading: isLoadingPolicyTypes } = useQuery<any[]>({
    queryKey: ["/api/policy-types"],
  });
  
  // Create policy mutation
  const createPolicy = useMutation({
    mutationFn: async (newPolicy: any) => {
      const res = await apiRequest("POST", "/api/policies", newPolicy);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies/renewals"] });
      toast({
        title: "Success",
        description: "Policy created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create policy: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update policy mutation
  const updatePolicy = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/policies/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies/renewals"] });
      toast({
        title: "Success",
        description: "Policy updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update policy: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete policy mutation
  const deletePolicy = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/policies/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/policies/renewals"] });
      toast({
        title: "Success",
        description: "Policy deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete policy: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle editing a policy
  const handleEditPolicy = (policy: PolicyWithDetails) => {
    setSelectedPolicy(policy);
    setIsPolicyFormOpen(true);
  };
  
  // Handle viewing policy details
  const handleViewPolicy = (policy: PolicyWithDetails) => {
    setPolicyDetailsId(policy.id);
    setIsPolicyDetailsOpen(true);
  };

  // Handle deleting a policy
  const handleDeletePolicy = (policy: PolicyWithDetails) => {
    setSelectedPolicy(policy);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle confirming the deletion
  const confirmDelete = () => {
    if (selectedPolicy) {
      deletePolicy.mutate(selectedPolicy.id);
      setIsDeleteDialogOpen(false);
      setSelectedPolicy(null);
    }
  };
  
  // Handle policy form submission
  const handlePolicyFormSubmit = (data: any) => {
    if (selectedPolicy) {
      updatePolicy.mutate({ id: selectedPolicy.id, data });
    } else {
      createPolicy.mutate(data);
    }
  };
  
  // Chart data for policy growth trend
  const trendChartData = [
    { name: "Jan", policies: 980, newPolicies: 32 },
    { name: "Feb", policies: 1010, newPolicies: 40 },
    { name: "Mar", policies: 1040, newPolicies: 45 },
    { name: "Apr", policies: 1080, newPolicies: 48 },
    { name: "May", policies: 1115, newPolicies: 52 },
    { name: "Jun", policies: 1180, newPolicies: 65 },
    { name: "Jul", policies: 1215, newPolicies: 45 },
    { name: "Aug", policies: 1245, newPolicies: 38 },
    { name: "Sep", policies: 1258, newPolicies: 42 },
  ];
  
  // Distribution data
  const getPolicyDistributionData = () => {
    if (!policyTypes || !recentPolicies) return [];
    
    // Create a map to collect policy types, ensuring each type only appears once
    const uniquePolicyTypes = new Map();
    
    // Add all policy types to the map using the id as the key
    policyTypes.forEach((type: any) => {
      if (type && type.id && (type.name === 'Family Plan' || type.name === 'Pensioner Plan')) {
        uniquePolicyTypes.set(type.id, type);
      }
    });
    
    const policyTypeCounts: Record<number, number> = {};
    
    // Count policies by type
    recentPolicies.forEach((policy: PolicyWithDetails) => {
      policyTypeCounts[policy.policyTypeId] = (policyTypeCounts[policy.policyTypeId] || 0) + 1;
    });
    
    // Only include the two valid policy types: Family Plan and Pensioner Plan
    return Array.from(uniquePolicyTypes.values())
      .map((type: any) => ({
        name: type.name,
        value: policyTypeCounts[type.id] || 0,
        color: type.color || "#3b82f6",
      }));
  };
  
  const distributionData = getPolicyDistributionData();
  
  // Format currency in South African Rand (ZAR)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 2,
      currencyDisplay: 'symbol',
    }).format(amount);
  };
  
  return (
    <div className="flex h-screen overflow-hidden" id="app-container">
      {/* Sidebar */}
      <Sidebar
        user={{
          name: "Sarah Johnson",
          role: "Policy Administrator",
          avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
        }}
        onLogout={() => toast({ title: "Logging out...", description: "This would log you out in a real app" })}
      />
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top bar */}
        <TopBar
          user={{
            name: "Sarah Johnson",
            avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          }}
          onMobileMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="p-6">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-primary-900">Dashboard</h1>
            <p className="text-gray-500">Welcome back, here's what's happening with your policies today.</p>
          </div>
          
          {/* Quick actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full">
              <Button 
                className="bg-secondary hover:bg-secondary-600 text-[10px] xs:text-xs sm:text-sm h-9 px-2 sm:px-4 flex"
                onClick={() => {
                  setSelectedPolicy(null);
                  setIsPolicyFormOpen(true);
                }}
              >
                <Plus className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate">New Policy</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-[10px] xs:text-xs sm:text-sm h-9 px-2 sm:px-4 flex"
                onClick={() => toast({ title: "Action", description: "Create New Claim action would be implemented here" })}
              >
                <ClipboardCheck className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate">New Claim</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-[10px] xs:text-xs sm:text-sm h-9 px-2 sm:px-4 flex"
                onClick={() => toast({ title: "Action", description: "Add Client action would be implemented here" })}
              >
                <UserPlus className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate">Add Client</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-[10px] xs:text-xs sm:text-sm h-9 px-2 sm:px-4 flex"
                onClick={() => toast({ title: "Action", description: "View Calendar action would be implemented here" })}
              >
                <CalendarDays className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate">View Calendar</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-[10px] xs:text-xs sm:text-sm h-9 px-2 sm:px-4 flex col-span-2 sm:col-span-1"
                onClick={() => toast({ title: "Action", description: "Generate Report action would be implemented here" })}
              >
                <BarChart className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate">Generate Report</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 w-full md:w-auto">
              <span className="text-xs sm:text-sm text-gray-500">Period:</span>
              <Select defaultValue={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month" className="text-xs sm:text-sm">This Month</SelectItem>
                  <SelectItem value="last-month" className="text-xs sm:text-sm">Last Month</SelectItem>
                  <SelectItem value="last-quarter" className="text-xs sm:text-sm">Last Quarter</SelectItem>
                  <SelectItem value="this-year" className="text-xs sm:text-sm">This Year</SelectItem>
                  <SelectItem value="custom" className="text-xs sm:text-sm">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Stats overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Policies"
              value={isLoadingStats ? "Loading..." : stats?.totalPolicies || 0}
              change={{ value: 12.5, trend: "up", text: "from last month" }}
              icon={<FileText className="h-5 w-5" />}
              iconColor="text-secondary"
            />
            
            <StatCard
              title="Active Policies"
              value={isLoadingStats ? "Loading..." : stats?.activePolicies || 0}
              change={{ value: 5.3, trend: "up", text: "from last month" }}
              icon={<User className="h-5 w-5" />}
              iconColor="text-accent"
            />
            
            <StatCard
              title="Total Claims"
              value={totalClaims}
              change={{ value: 14.3, trend: "up", text: "from last month" }}
              icon={<ClipboardCheck className="h-5 w-5" />}
              iconColor="text-amber-500"
            />
            
            <StatCard
              title="Total Revenue"
              value={isLoadingStats ? "Loading..." : formatCurrency(stats?.totalRevenue || 0)}
              change={{ value: 2.4, trend: "down", text: "from last month" }}
              icon={<DollarSign className="h-5 w-5" />}
              iconColor="text-secondary"
            />
          </div>
          
          {/* Charts and policy breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Policy trend chart */}
            <TrendChart
              title="Policy Growth Trend"
              data={trendChartData}
              dataKeys={["policies", "newPolicies"]}
              variant="area"
              stats={[
                { label: "Total Policies", value: isLoadingStats ? "Loading..." : stats?.totalPolicies || 0 },
                { label: "New Policies (MTD)", value: "+42" },
                { label: "Retention Rate", value: "94.2%" },
              ]}
              className="lg:col-span-2"
            />
            
            {/* Policy type distribution */}
            <PolicyDistribution
              title="Policy Distribution"
              data={isLoadingPolicyTypes ? [] : distributionData}
            />
          </div>
          
          {/* Recent policies and upcoming renewals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent policies table */}
            <PoliciesTable
              title="Recent Policies"
              policies={recentPolicies}
              isLoading={isLoadingPolicies}
              onView={handleViewPolicy}
              onDelete={handleDeletePolicy}
              viewAllHref="/policies"
              limit={4}
              className="lg:col-span-2"
            />
            
            {/* Upcoming renewals */}
            <UpcomingRenewals
              renewals={upcomingRenewals}
              isLoading={isLoadingRenewals}
              onRenew={handleViewPolicy}
              viewAllHref="/policies?filter=upcoming"
            />
          </div>
        </div>
      </main>
      
      {/* Policy Form Modal */}
      <PolicyForm
        open={isPolicyFormOpen}
        onOpenChange={setIsPolicyFormOpen}
        onSubmit={handlePolicyFormSubmit}
        defaultValues={selectedPolicy ? {
          policyNumber: selectedPolicy.policyNumber,
          clientId: selectedPolicy.clientId,
          policyTypeId: selectedPolicy.policyTypeId,
          premium: selectedPolicy.premium,
          startDate: new Date(selectedPolicy.captureDate),
          endDate: new Date(selectedPolicy.captureDate),
          status: selectedPolicy.status,
          frequency: selectedPolicy.frequency,
          renewalDate: selectedPolicy.renewalDate ? new Date(selectedPolicy.renewalDate) : null,
          notes: selectedPolicy.notes,
        } : undefined}
        isNew={!selectedPolicy}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete policy {selectedPolicy?.policyNumber}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-danger hover:bg-danger-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Policy Details Dialog */}
      <PolicyDetailsDialog
        open={isPolicyDetailsOpen}
        onOpenChange={setIsPolicyDetailsOpen}
        policyId={policyDetailsId}
      />
    </div>
  );
}
