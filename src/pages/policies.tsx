import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, FileSignature } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { PoliciesTable } from "@/components/policies-table";
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
import { Input } from "@/components/ui/input";

export default function Policies() {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPolicyFormOpen, setIsPolicyFormOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPolicyDetailsOpen, setIsPolicyDetailsOpen] = useState(false);
  const [policyDetailsId, setPolicyDetailsId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [policyTypeFilter, setPolicyTypeFilter] = useState("all");
  
  // Fetch policies
  const { data: policies, isLoading } = useQuery({
    queryKey: ["/api/policies"],
  });
  
  // Fetch policy types for filter
  const { data: policyTypes } = useQuery({
    queryKey: ["/api/policy-types"],
  });
  
  // Create policy mutation
  const createPolicy = useMutation({
    mutationFn: async (newPolicy: any) => {
      const res = await apiRequest("POST", "/api/policies", newPolicy);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
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
  
  // Filter and search policies
  const filteredPolicies = policies
    ? policies.filter((policy: PolicyWithDetails) => {
        // Filter by search query
        const matchesSearch =
          !searchQuery ||
          policy.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          policy.client.name.toLowerCase().includes(searchQuery.toLowerCase());
          
        // Filter by status
        const matchesStatus = statusFilter === "all" || policy.status === statusFilter;
        
        // Filter by policy type
        const matchesPolicyType = 
          policyTypeFilter === "all" || 
          policy.policyTypeId.toString() === policyTypeFilter;
          
        return matchesSearch && matchesStatus && matchesPolicyType;
      })
    : [];
  
  // Fetch policy details when viewing a policy
  const { data: policyDetails } = useQuery({
    queryKey: [`/api/policies/${policyDetailsId}/details`],
    enabled: policyDetailsId !== null,
  });
  
  // Handle viewing policy details
  const handleViewPolicy = (policy: PolicyWithDetails) => {
    setPolicyDetailsId(policy.id);
    setIsPolicyDetailsOpen(true);
  };
  
  // Handle editing a policy
  const handleEditPolicy = (policy: PolicyWithDetails) => {
    setSelectedPolicy(policy);
    setIsPolicyFormOpen(true);
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-primary-900">Policies</h1>
              <p className="text-gray-500">Manage and track all your insurance policies</p>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href="/policy-signup">
                  <FileSignature className="mr-2 h-4 w-4" />
                  <span>New Policy Application</span>
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by policy number or client name..."
                  className="w-full pl-10 pr-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Status:</span>
                  <Select defaultValue={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Type:</span>
                  <Select defaultValue={policyTypeFilter} onValueChange={setPolicyTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All policy types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All policy types</SelectItem>
                      {policyTypes && policyTypes.length > 0 ? 
                        policyTypes.map((type: any) => type && (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))
                      : <SelectItem value="none">No policy types available</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Policies table */}
          <PoliciesTable
            title={`All Policies (${filteredPolicies.length})`}
            policies={filteredPolicies}
            isLoading={isLoading}
            onView={handleViewPolicy}
            onDelete={handleDeletePolicy}
            showPagination
          />
        </div>
      </main>
      
      {/* Policy Form Modal */}
      <PolicyForm
        open={isPolicyFormOpen}
        onOpenChange={setIsPolicyFormOpen}
        onSubmit={handlePolicyFormSubmit}
        defaultValues={selectedPolicy || undefined}
        isNew={!selectedPolicy}
      />
      
      {/* Policy Details Dialog */}
      <PolicyDetailsDialog
        policy={policyDetails || null}
        open={isPolicyDetailsOpen}
        onOpenChange={(open) => {
          setIsPolicyDetailsOpen(open);
          if (!open) {
            setPolicyDetailsId(null);
          }
        }}
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
    </div>
  );
}
