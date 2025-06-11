import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";
import { 
  Search, 
  Plus, 
  FileText, 
  ArrowUpRight,
  Check,
  X,
  User
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

// Type definitions
type Claim = {
  id: string;
  policyNumber: string;
  clientName: string;
  dateSubmitted: string;
  claimType: string;
  amount: number;
  status: "pending" | "in-review" | "approved" | "paid" | "rejected";
  description: string;
  assignedTo: string;
};

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string;
};

export default function Claims() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Get query client & toast for UI updates
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Mock current user ID - in a real app this would come from auth context
  const currentUserId = 1;

  // Fetch claims from the API
  const { 
    data: claims = [] as Claim[], 
    isLoading 
  } = useQuery<Claim[]>({
    queryKey: ["/api/claims", statusFilter, typeFilter, currentPage],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch users to display assigned user names
  const { data: users = [] as User[] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 300000, // 5 minutes
  });
  
  // Function to handle claim assignment
  const assignClaimToCurrentUser = async (claimId: string | number) => {
    if (!claimId) {
      toast({
        title: "Error",
        description: "Invalid claim ID. Cannot assign this claim.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Use API to assign the claim to current user
      await apiRequest('PUT', `/api/claims/${claimId}/assign`, { userId: Number(currentUserId) });
      
      toast({
        title: "Claim assigned",
        description: "The claim has been assigned to you successfully.",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
    } catch (error) {
      console.error("Error assigning claim:", error);
      toast({
        title: "Error",
        description: "Failed to assign claim. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter claims based on search term and filters
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = !searchTerm || (
      (claim.id && claim.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (claim.policyNumber && claim.policyNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (claim.clientName && claim.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (claim.description && claim.description.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesStatus = !statusFilter || (claim.status && claim.status === statusFilter);
    const matchesType = !typeFilter || (claim.claimType && claim.claimType === typeFilter);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredClaims.length / itemsPerPage);
  const paginatedClaims = filteredClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Error";
    }
  };

  // Helper function to get color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paid':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to check if a claim is assigned to the current user
  const isClaimAssignedToCurrentUser = (claim: Claim) => {
    return Number(claim.assignedTo) === Number(currentUserId);
  };
  
  // Helper function to get the assigned user's name
  const getAssignedUserName = (assignedToId: string | number) => {
    if (!assignedToId) return "Unassigned";
    
    const assignedUser = users.find((user: User) => user.id === Number(assignedToId));
    return assignedUser ? assignedUser.name : `User ID: ${assignedToId}`;
  };
  
  // Function to update claim status
  const updateClaimStatus = async (claimId: string | number, status: string) => {
    if (!claimId) {
      toast({
        title: "Error",
        description: "Invalid claim ID. Cannot update status.",
        variant: "destructive",
      });
      return;
    }
    
    const claim = claims.find(c => c.id.toString() === claimId.toString());
    if (!claim || !isClaimAssignedToCurrentUser(claim)) {
      toast({
        title: "Action required",
        description: "Please assign the claim to yourself first before changing status.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest('PUT', `/api/claims/${claimId}/status`, { status });
      
      toast({
        title: "Status updated",
        description: `Claim has been marked as ${status}.`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
    } catch (error) {
      console.error(`Error updating claim status to ${status}:`, error);
      toast({
        title: "Error",
        description: "Failed to update claim status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mock user data - in a real app this would come from auth context
  const mockUser = {
    name: "Sarah Johnson",
    role: "Super Admin",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={mockUser}
        onLogout={() => console.log("Logout clicked")}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Claims Management</h1>
            <Button onClick={() => navigate("/claims/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Claim
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search claims..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={typeFilter || "all"}
                    onValueChange={(value) => setTypeFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Claim Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Death Claim">Death Claim</SelectItem>
                      <SelectItem value="Funeral Expense">Funeral Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Policy Number</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Loading claims...
                      </TableCell>
                    </TableRow>
                  ) : paginatedClaims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        No claims found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClaims.map((claim) => (
                      <TableRow 
                        key={claim.id} 
                        className={`hover:bg-gray-50 ${isClaimAssignedToCurrentUser(claim) ? 'cursor-pointer' : ''}`} 
                        onClick={(e) => {
                          if (isClaimAssignedToCurrentUser(claim)) {
                            navigate(`/claims/${claim.id}`);
                          } else {
                            e.preventDefault();
                            toast({
                              title: "Action required",
                              description: "Please assign the claim to yourself first before viewing details.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <TableCell className="font-medium">{claim.id}</TableCell>
                        <TableCell>{claim.policyNumber}</TableCell>
                        <TableCell>{claim.clientName}</TableCell>
                        <TableCell>{formatDate(claim.dateSubmitted)}</TableCell>
                        <TableCell>{claim.claimType}</TableCell>
                        <TableCell>R {claim.amount ? claim.amount.toLocaleString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(claim.status || 'pending')} capitalize`}
                          >
                            {claim.status ? claim.status.replace("-", " ") : "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isClaimAssignedToCurrentUser(claim) ? (
                            <div className="flex items-center gap-1 text-blue-600">
                              <span>You</span>
                              <Badge variant="outline" className="ml-1 bg-blue-100 text-blue-800 border-blue-200">
                                Assigned
                              </Badge>
                            </div>
                          ) : claim.assignedTo ? (
                            <div className="flex items-center gap-1">
                              <span>{getAssignedUserName(claim.assignedTo)}</span>
                            </div>
                          ) : (
                            "Unassigned"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <span className="sr-only">Open menu</span>
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isClaimAssignedToCurrentUser(claim)) {
                                    navigate(`/claims/${claim.id}`);
                                  } else {
                                    toast({
                                      title: "Action required",
                                      description: "Please assign the claim to yourself first before viewing details.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                disabled={!claim.id || !isClaimAssignedToCurrentUser(claim)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isClaimAssignedToCurrentUser(claim)) {
                                    navigate(`/claims/${claim.id}/edit`);
                                  } else {
                                    toast({
                                      title: "Action required",
                                      description: "Please assign the claim to yourself first before editing.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                disabled={!claim.id || !isClaimAssignedToCurrentUser(claim)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Edit Claim
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assignClaimToCurrentUser(claim.id);
                                }}
                                className={`${
                                  isClaimAssignedToCurrentUser(claim)
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800'
                                } focus:bg-blue-100 focus:text-blue-800`}
                                disabled={!claim.id || isClaimAssignedToCurrentUser(claim)}
                              >
                                {isClaimAssignedToCurrentUser(claim) ? (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Assigned to you
                                  </>
                                ) : (
                                  <>
                                    <User className="mr-2 h-4 w-4" />
                                    Assign to me
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (claim.id) updateClaimStatus(claim.id, 'approved');
                                }}
                                disabled={!claim.id || !isClaimAssignedToCurrentUser(claim)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Approved
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (claim.id) updateClaimStatus(claim.id, 'rejected');
                                }}
                                disabled={!claim.id || !isClaimAssignedToCurrentUser(claim)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Mark as Rejected
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }).map((_, index) => (
                        <PaginationItem key={index}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === index + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(index + 1);
                            }}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}