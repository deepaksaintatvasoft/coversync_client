import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Mail, Phone, MapPin, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Sidebar } from "@/features/data/components/sidebar";
import { TopBar } from "@/features/data/components/topbar";
import { Button } from "@/features/data/components/ui/button";
import { apiRequest } from "@/services/queryClient";
import { UserAvatar } from "@/features/data/components/ui/user-avatar";
import { type Client, type InsertClient } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/data/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/features/data/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/data/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/data/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/data/components/ui/form";
import { Input } from "@/features/data/components/ui/input";
import { Textarea } from "@/features/data/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/features/data/components/ui/skeleton";
import { validateSouthAfricanID, getDateOfBirthFromIDNumber, getGenderFromIDNumber } from "@/services/utils";

// Create a form schema with validation rules
const clientFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().optional(),
  idNumber: z.string().optional()
    .refine(val => !val || validateSouthAfricanID(val), {
      message: "Invalid South African ID number"
    }),
  dateOfBirth: z.date().optional(),
  gender: z.string().optional(),
});

// Convert form data to API format
const convertFormToApiData = (data: ClientFormValues): Partial<InsertClient> => {
  const apiData: Partial<InsertClient> = {
    ...data,
    // Convert Date to ISO string for API
    dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : undefined,
  };
  return apiData;
};

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function Clients() {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Create client mutation
  const createClient = useMutation({
    mutationFn: async (newClient: InsertClient) => {
      const res = await apiRequest("POST", "/api/clients", newClient);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create client: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update client mutation
  const updateClient = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertClient> }) => {
      const res = await apiRequest("PUT", `/api/clients/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update client: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete client mutation
  const deleteClient = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete client: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter clients by search query
  const filteredClients = clients
    ? clients.filter((client: Client) => {
        return (
          !searchQuery ||
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (client.phone && client.phone.includes(searchQuery))
        );
      })
    : [];
  
  // Handle editing a client
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsClientFormOpen(true);
  };
  
  // Handle deleting a client
  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle confirming the deletion
  const confirmDelete = () => {
    if (selectedClient) {
      deleteClient.mutate(selectedClient.id);
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
    }
  };
  
  // Client form component
  const ClientForm = () => {
    const [isPending, setIsPending] = useState(false);
    
    const form = useForm<ClientFormValues>({
      resolver: zodResolver(clientFormSchema),
      defaultValues: {
        name: selectedClient?.name || "",
        email: selectedClient?.email || "",
        phone: selectedClient?.phone || "",
        address: selectedClient?.address || "",
        avatarUrl: selectedClient?.avatarUrl || "",
        idNumber: selectedClient?.idNumber || "",
        gender: selectedClient?.gender || "",
        dateOfBirth: selectedClient?.dateOfBirth ? new Date(selectedClient.dateOfBirth) : undefined,
      },
    });
    
    const onSubmit = async (data: ClientFormValues) => {
      try {
        setIsPending(true);
        
        if (selectedClient) {
          await updateClient.mutateAsync({ id: selectedClient.id, data });
        } else {
          await createClient.mutateAsync(data);
        }
        
        setIsPending(false);
        setIsClientFormOpen(false);
      } catch (error) {
        setIsPending(false);
        // Error handling is in the mutation callbacks
      }
    };
    
    const title = selectedClient ? "Edit Client" : "New Client";
    const description = selectedClient
      ? "Update client information"
      : "Create a new client record";
    
    return (
      <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Main St, Anytown, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Number (South African)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="South African ID number" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          const idNumber = e.target.value;
                          
                          // Auto-fill date of birth and gender if valid ID number
                          if (idNumber && idNumber.length === 13 && validateSouthAfricanID(idNumber)) {
                            const dateOfBirth = getDateOfBirthFromIDNumber(idNumber);
                            const gender = getGenderFromIDNumber(idNumber);
                            
                            if (dateOfBirth) {
                              form.setValue("dateOfBirth", dateOfBirth);
                            }
                            
                            if (gender) {
                              form.setValue("gender", gender);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      field.value.length !== 13 ? (
                        <p className="text-xs text-amber-600 mt-1">
                          South African ID must be 13 digits
                        </p>
                      ) : (
                        <p className={validateSouthAfricanID(field.value) 
                          ? "text-xs text-green-600 mt-1" 
                          : "text-xs text-red-600 mt-1"
                        }>
                          {validateSouthAfricanID(field.value) 
                            ? "✓ Valid South African ID" 
                            : "✗ Invalid South African ID"}
                        </p>
                      )
                    )}
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsClientFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Client"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
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
              <h1 className="text-2xl font-semibold text-primary-900">Clients</h1>
              <p className="text-gray-500">Manage your client information</p>
            </div>
            
            <Button
              onClick={() => {
                setSelectedClient(null);
                setIsClientFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New Client</span>
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search clients by name, email or phone..."
              className="pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Clients grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array(8)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-0">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex justify-between w-full">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                      </div>
                    </CardFooter>
                  </Card>
                ))
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client: Client) => (
                <Card key={client.id} className="overflow-hidden">
                  <CardHeader className="pb-0">
                    <div className="flex items-center gap-4">
                      <UserAvatar src={client.avatarUrl} name={client.name} size="lg" />
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <CardDescription>Client ID: {client.id}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <span className="text-gray-700">{client.address}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="flex justify-between w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClient(client)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Plus className="h-4 w-4 mr-2" />
                            New Policy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-danger" 
                            onClick={() => handleDeleteClient(client)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No clients found. Try adjusting your search or create a new client.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Client Form */}
      <ClientForm />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedClient?.name}'s client record and cannot be undone. 
              All policies associated with this client may also be affected.
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
