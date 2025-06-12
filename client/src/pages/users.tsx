import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  UserCog,
  Check,
  X
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Mock data for users
const mockUsers = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    role: "data_capturer",
    active: true,
    lastLogin: "2023-07-20T09:45:32Z",
    createdAt: "2023-01-10T08:30:00Z"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    role: "super_admin",
    active: true,
    lastLogin: "2023-07-21T14:22:05Z",
    createdAt: "2023-01-05T10:15:00Z"
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "m.brown@example.com",
    role: "claim_handler",
    active: true,
    lastLogin: "2023-07-19T11:10:15Z",
    createdAt: "2023-02-15T09:45:00Z"
  },
  {
    id: 4,
    name: "Lisa Davis",
    email: "lisa.davis@example.com",
    role: "data_capturer",
    active: false,
    lastLogin: "2023-06-30T15:30:22Z",
    createdAt: "2023-03-20T11:20:00Z"
  },
  {
    id: 5,
    name: "Robert Wilson",
    email: "r.wilson@example.com",
    role: "claim_handler",
    active: true,
    lastLogin: "2023-07-18T08:55:12Z",
    createdAt: "2023-04-05T13:40:00Z"
  }
];

// Type definition for users
type User = {
  id: number;
  name: string;
  email: string;
  role: "data_capturer" | "claim_handler" | "super_admin";
  active: boolean;
  lastLogin: string;
  createdAt: string;
};

// Permissions schema
const permissionsSchema = z.object({
  viewDashboard: z.boolean().default(true),
  viewPolicies: z.boolean().default(true),
  createPolicy: z.boolean().default(false),
  editPolicy: z.boolean().default(false),
  deletePolicy: z.boolean().default(false),
  viewClaims: z.boolean().default(true),
  createClaim: z.boolean().default(false),
  processClaim: z.boolean().default(false),
  approveClaim: z.boolean().default(false),
  rejectClaim: z.boolean().default(false),
  viewReports: z.boolean().default(false),
  exportData: z.boolean().default(false),
  manageUsers: z.boolean().default(false),
  viewAuditLogs: z.boolean().default(false),
});

type Permissions = z.infer<typeof permissionsSchema>;

// Default permissions by role
const defaultPermissions: Record<string, Permissions> = {
  data_capturer: {
    viewDashboard: true,
    viewPolicies: true,
    createPolicy: true,
    editPolicy: true,
    deletePolicy: false,
    viewClaims: true,
    createClaim: true,
    processClaim: false,
    approveClaim: false,
    rejectClaim: false,
    viewReports: false,
    exportData: false,
    manageUsers: false,
    viewAuditLogs: false,
  },
  claim_handler: {
    viewDashboard: true,
    viewPolicies: true,
    createPolicy: false,
    editPolicy: false,
    deletePolicy: false,
    viewClaims: true,
    createClaim: true,
    processClaim: true,
    approveClaim: true,
    rejectClaim: true,
    viewReports: true,
    exportData: true,
    manageUsers: false,
    viewAuditLogs: false,
  },
  super_admin: {
    viewDashboard: true,
    viewPolicies: true,
    createPolicy: true,
    editPolicy: true,
    deletePolicy: true,
    viewClaims: true,
    createClaim: true,
    processClaim: true,
    approveClaim: true,
    rejectClaim: true,
    viewReports: true,
    exportData: true,
    manageUsers: true,
    viewAuditLogs: true,
  }
};

// Form schema for editing user
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["data_capturer", "claim_handler", "super_admin"], {
    required_error: "Please select a role.",
  }),
  active: z.boolean().default(true),
  permissions: permissionsSchema
});

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  // Fetch users - in real app would use a react-query call to backend
  // const { data: users = [], isLoading } = useQuery({
  //   queryKey: ["/api/users", roleFilter, statusFilter],
  // });
  
  // Using mock data for now
  const users = mockUsers;
  const isLoading = false;

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = statusFilter === null || user.active === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // Helper function to get role badge style
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'claim_handler':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'data_capturer':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to display formatted role names
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'claim_handler':
        return 'Claim Handler';
      case 'data_capturer':
        return 'Data Capturer';
      default:
        return role;
    }
  };

  // Helper function to get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="h-4 w-4" />;
      case 'claim_handler':
        return <Shield className="h-4 w-4" />;
      case 'data_capturer':
        return <UserCog className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Form setup for editing permissions
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: selectedUser?.name || "",
      email: selectedUser?.email || "",
      role: selectedUser?.role || "data_capturer",
      active: selectedUser?.active || true,
      permissions: defaultPermissions[selectedUser?.role || "data_capturer"]
    },
  });

  // Handle opening the permissions dialog
  const handleOpenPermissionsDialog = (user: User) => {
    setSelectedUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      permissions: defaultPermissions[user.role]
    });
    setIsPermissionsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof userFormSchema>) => {
    console.log("Updated user:", data);
    // In a real app, this would be an API call to update the user
    setIsPermissionsDialogOpen(false);
  };

  // Handle role change
  const handleRoleChange = (role: "data_capturer" | "claim_handler" | "super_admin") => {
    form.setValue("role", role);
    form.setValue("permissions", defaultPermissions[role]);
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
            <h1 className="text-2xl font-bold">User Management</h1>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Select
                    value={roleFilter || "all"}
                    onValueChange={(value) => setRoleFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="data_capturer">Data Capturer</SelectItem>
                      <SelectItem value="claim_handler">Claim Handler</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter === null ? "all" : statusFilter ? "active" : "inactive"}
                    onValueChange={(value) => {
                      if (value === "all") setStatusFilter(null);
                      else if (value === "active") setStatusFilter(true);
                      else setStatusFilter(false);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No users found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getRoleBadgeStyle(user.role)} flex items-center gap-1 w-fit`}
                          >
                            {getRoleIcon(user.role)}
                            {getRoleDisplay(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.active ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => console.log("Edit user", user.id)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleOpenPermissionsDialog(user)}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.active ? (
                                <DropdownMenuItem 
                                  onClick={() => console.log("Deactivate user", user.id)}
                                  className="text-red-600"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Deactivate User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => console.log("Activate user", user.id)}
                                  className="text-green-600"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Permissions Dialog */}
          <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage User Permissions</DialogTitle>
                <DialogDescription>
                  Update role and permissions for {selectedUser?.name}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-gray-50" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-gray-50" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={(value: "data_capturer" | "claim_handler" | "super_admin") => 
                              handleRoleChange(value)
                            }
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="data_capturer">Data Capturer</SelectItem>
                              <SelectItem value="claim_handler">Claim Handler</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Changing role will reset permissions to default for that role
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-end space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Active Account</FormLabel>
                            <FormDescription>
                              Inactive users cannot log in to the system
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Permissions</h3>
                    <div className="border rounded-md p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="permissions.viewDashboard"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>View Dashboard</FormLabel>
                                <FormDescription>
                                  Access to view the dashboard
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.viewPolicies"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>View Policies</FormLabel>
                                <FormDescription>
                                  Access to view policy listings
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.createPolicy"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Create Policies</FormLabel>
                                <FormDescription>
                                  Ability to create new policies
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.editPolicy"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Edit Policies</FormLabel>
                                <FormDescription>
                                  Ability to edit existing policies
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.deletePolicy"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Delete Policies</FormLabel>
                                <FormDescription>
                                  Ability to delete policies
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.viewClaims"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>View Claims</FormLabel>
                                <FormDescription>
                                  Access to view claims listings
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.createClaim"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Create Claims</FormLabel>
                                <FormDescription>
                                  Ability to create new claims
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.processClaim"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Process Claims</FormLabel>
                                <FormDescription>
                                  Ability to process claims
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.approveClaim"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Approve Claims</FormLabel>
                                <FormDescription>
                                  Ability to approve claims
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.rejectClaim"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Reject Claims</FormLabel>
                                <FormDescription>
                                  Ability to reject claims
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.viewReports"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>View Reports</FormLabel>
                                <FormDescription>
                                  Access to view reports
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.exportData"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Export Data</FormLabel>
                                <FormDescription>
                                  Ability to export data from the system
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.manageUsers"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Manage Users</FormLabel>
                                <FormDescription>
                                  Access to manage users and permissions
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="permissions.viewAuditLogs"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>View Audit Logs</FormLabel>
                                <FormDescription>
                                  Access to view system audit logs
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}