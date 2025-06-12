import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/features/data/components/sidebar";
import { 
  Search, 
  Calendar, 
  Filter, 
  History, 
  User, 
  Eye, 
  FileText, 
  Trash, 
  Edit, 
  Plus, 
  Shield, 
  Key, 
  Lock, 
  ArrowRight
} from "lucide-react";

import { Button } from "@/features/data/components/ui/button";
import { Input } from "@/features/data/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/features/data/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/data/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/data/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/data/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/features/data/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/features/data/components/ui/pagination";
import { Badge } from "@/features/data/components/ui/badge";
import { Separator } from "@/features/data/components/ui/separator";
import { Calendar as CalendarComponent } from "@/features/data/components/ui/calendar";
import { format } from "date-fns";

// Mock data for audit logs
const mockAuditLogs = [
  {
    id: 1,
    userId: 2,
    userName: "Sarah Johnson",
    userRole: "super_admin",
    action: "login",
    entityType: "user",
    entityId: "2",
    details: { message: "User logged in successfully" },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    timestamp: "2023-07-21T14:22:05Z"
  },
  {
    id: 2,
    userId: 3,
    userName: "Michael Brown",
    userRole: "claim_handler",
    action: "create",
    entityType: "claim",
    entityId: "CL-7891",
    details: { 
      policyNumber: "POL-1234", 
      clientName: "John Smith", 
      claimType: "Death Claim", 
      amount: 25000 
    },
    ipAddress: "192.168.1.2",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    timestamp: "2023-07-20T10:15:32Z"
  },
  {
    id: 3,
    userId: 1,
    userName: "John Smith",
    userRole: "data_capturer",
    action: "update",
    entityType: "policy",
    entityId: "POL-5432",
    details: { 
      premium: { old: 650, new: 750 },
      status: { old: "pending", new: "active" } 
    },
    ipAddress: "192.168.1.3",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    timestamp: "2023-07-19T16:45:11Z"
  },
  {
    id: 4,
    userId: 2,
    userName: "Sarah Johnson",
    userRole: "super_admin",
    action: "update",
    entityType: "user",
    entityId: "3",
    details: { 
      role: { old: "data_capturer", new: "claim_handler" },
      permissions: { added: ["processClaim", "approveClaim"], removed: [] }
    },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    timestamp: "2023-07-19T11:32:40Z"
  },
  {
    id: 5,
    userId: 3,
    userName: "Michael Brown",
    userRole: "claim_handler",
    action: "update",
    entityType: "claim",
    entityId: "CL-5623",
    details: { 
      status: { old: "pending", new: "in-review" },
      assignedTo: { old: null, new: "Michael Brown" }
    },
    ipAddress: "192.168.1.2",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    timestamp: "2023-07-18T09:22:15Z"
  },
  {
    id: 6,
    userId: 1,
    userName: "John Smith",
    userRole: "data_capturer",
    action: "create",
    entityType: "policy",
    entityId: "POL-8765",
    details: { 
      clientName: "Mary Johnson",
      premium: 850,
      policyType: "Family Plan",
      coverageAmount: 50000
    },
    ipAddress: "192.168.1.3",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    timestamp: "2023-07-17T14:05:22Z"
  },
  {
    id: 7,
    userId: 2,
    userName: "Sarah Johnson",
    userRole: "super_admin",
    action: "delete",
    entityType: "policy",
    entityId: "POL-2345",
    details: { 
      reason: "Policy cancelled at client request",
      refundAmount: 350
    },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    timestamp: "2023-07-16T10:12:33Z"
  },
  {
    id: 8,
    userId: 3,
    userName: "Michael Brown",
    userRole: "claim_handler",
    action: "update",
    entityType: "claim",
    entityId: "CL-3456",
    details: { 
      status: { old: "in-review", new: "approved" },
      approvedAmount: 10000,
      notes: "All documentation verified, claim approved for payment"
    },
    ipAddress: "192.168.1.2",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    timestamp: "2023-07-15T16:30:05Z"
  },
  {
    id: 9,
    userId: 4,
    userName: "Lisa Davis",
    userRole: "data_capturer",
    action: "login_failed",
    entityType: "user",
    entityId: "4",
    details: { 
      reason: "Incorrect password",
      attempts: 2
    },
    ipAddress: "192.168.1.4",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    timestamp: "2023-07-15T09:45:18Z"
  },
  {
    id: 10,
    userId: 2,
    userName: "Sarah Johnson",
    userRole: "super_admin",
    action: "create",
    entityType: "user",
    entityId: "5",
    details: { 
      name: "Robert Wilson",
      email: "r.wilson@example.com",
      role: "claim_handler"
    },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    timestamp: "2023-07-14T11:20:42Z"
  }
];

// Type definition for audit logs
type AuditLog = {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
};

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch audit logs - in real app would use a react-query call to backend
  // const { data: auditLogs = [], isLoading } = useQuery({
  //   queryKey: ["/api/audit-logs", userFilter, actionFilter, entityTypeFilter, startDate, endDate, currentPage],
  // });
  
  // Using mock data for now
  const auditLogs = mockAuditLogs;
  const isLoading = false;

  // Get unique users from logs for filter
  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.userId))).map(userId => {
    const user = auditLogs.find(log => log.userId === userId);
    return {
      id: userId,
      name: user?.userName || ""
    };
  });

  // Get unique actions from logs for filter
  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));

  // Get unique entity types from logs for filter
  const uniqueEntityTypes = Array.from(new Set(auditLogs.map(log => log.entityType)));

  // Filter logs based on filters
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = !userFilter || log.userId === userFilter;
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesEntityType = !entityTypeFilter || log.entityType === entityTypeFilter;
    
    const logDate = new Date(log.timestamp);
    const matchesStartDate = !startDate || logDate >= startDate;
    const matchesEndDate = !endDate || logDate <= new Date(endDate.setHours(23, 59, 59, 999));
    
    return matchesSearch && matchesUser && matchesAction && matchesEntityType && 
           matchesStartDate && matchesEndDate;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }).format(date);
  };

  // Helper function to get action badge style
  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'login':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'login_failed':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus className="h-4 w-4" />;
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        return <Trash className="h-4 w-4" />;
      case 'login':
        return <Key className="h-4 w-4" />;
      case 'login_failed':
        return <Lock className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  // Helper function to get entity type icon
  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'policy':
        return <FileText className="h-4 w-4" />;
      case 'claim':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Helper function to format action for display
  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Helper function to format entity type for display
  const formatEntityType = (entityType: string) => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  // Function to handle viewing details
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsDialogOpen(true);
  };

  // Function to reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setUserFilter(null);
    setActionFilter(null);
    setEntityTypeFilter(null);
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  // Mock user data for sidebar
  const mockCurrentUser = {
    name: "Sarah Johnson",
    role: "Super Admin",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={mockCurrentUser}
        onLogout={() => console.log("Logout clicked")}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select
                  value={userFilter?.toString() || "all"}
                  onValueChange={(value) => setUserFilter(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={actionFilter || "all"}
                  onValueChange={(value) => setActionFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {formatAction(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={entityTypeFilter || "all"}
                  onValueChange={(value) => setEntityTypeFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entity Types</SelectItem>
                    {uniqueEntityTypes.map((entityType) => (
                      <SelectItem key={entityType} value={entityType}>
                        {formatEntityType(entityType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={startDate || undefined}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={endDate || undefined}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading audit logs...
                      </TableCell>
                    </TableRow>
                  ) : paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No audit logs found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.userName}</span>
                            <span className="text-xs text-gray-500">{log.userRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getActionBadgeStyle(log.action)} flex items-center gap-1 w-fit`}
                          >
                            {getActionIcon(log.action)}
                            {formatAction(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          {getEntityTypeIcon(log.entityType)}
                          {formatEntityType(log.entityType)}
                        </TableCell>
                        <TableCell>{log.entityId}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                            className="h-8 px-2"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
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

          {/* Details Dialog */}
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Audit Log Details</DialogTitle>
                <DialogDescription>
                  Full details of the audit log entry
                </DialogDescription>
              </DialogHeader>
              
              {selectedLog && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                      <p className="text-base">{formatDate(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">User</h3>
                      <p className="text-base font-medium">{selectedLog.userName}</p>
                      <p className="text-xs text-gray-500">{selectedLog.userRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Action</h3>
                      <Badge 
                        variant="outline" 
                        className={`${getActionBadgeStyle(selectedLog.action)} mt-1 flex items-center gap-1 w-fit`}
                      >
                        {getActionIcon(selectedLog.action)}
                        {formatAction(selectedLog.action)}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Entity Type</h3>
                      <p className="text-base flex items-center gap-1 mt-1">
                        {getEntityTypeIcon(selectedLog.entityType)}
                        {formatEntityType(selectedLog.entityType)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Entity ID</h3>
                      <p className="text-base mt-1">{selectedLog.entityId}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Details</h3>
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60">
                          {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">IP Address</h3>
                      <p className="text-base">{selectedLog.ipAddress}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">User Agent</h3>
                      <p className="text-xs overflow-hidden text-ellipsis">{selectedLog.userAgent}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}