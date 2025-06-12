import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Key,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Trash2,
  User,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// Partner Form Schema
const partnerFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional(),
  notes: z.string().optional(),
  status: z.string().default("active"),
  ipWhitelist: z.string().optional(),
  apiLimits: z.string().optional(),
});

// API Key Form Schema
const apiKeyFormSchema = z.object({
  keyName: z.string().min(2, "Key name is required"),
  partnerId: z.number({ required_error: "Partner is required" }),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional(),
  ipRestrictions: z.string().optional(),
  allowedEndpoints: z.string().optional(),
});

const regenerateKeyFormSchema = z.object({
  keyId: z.number({ required_error: "Key ID is required" }),
  confirmRegenerate: z.boolean().refine((val) => val === true, {
    message: "You must confirm regeneration",
  }),
});

type Partner = {
  id: number;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  websiteUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  ipWhitelist: string | null;
  apiLimits: string | null;
};

type ApiKey = {
  id: number;
  keyName: string;
  keyValue: string;
  partnerId: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  expiresAt: string | null;
  lastUsed: string | null;
  usageCount: number;
  allowedEndpoints: any;
  ipRestrictions: any;
};

type ApiLog = {
  id: number;
  apiKeyId: number;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  requestBody: any;
  responseStatus: number | null;
  errorDetails: string | null;
};

const ApiPartnersList = () => {
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch partners
  const {
    data: partners = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/api-partners"],
    refetchOnWindowFocus: false,
  });

  // Partner form
  const partnerForm = useForm<z.infer<typeof partnerFormSchema>>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      name: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      websiteUrl: "",
      notes: "",
      status: "active",
      ipWhitelist: "",
      apiLimits: "",
    },
  });

  // Create partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: (data: z.infer<typeof partnerFormSchema>) =>
      apiRequest("POST", "/api/api-partners", data),
    onSuccess: () => {
      toast({
        title: "Partner created",
        description: "The API partner has been created successfully.",
      });
      partnerForm.reset();
      setIsPartnerDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/api-partners"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create partner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update partner mutation
  const updatePartnerMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof partnerFormSchema>;
    }) => apiRequest("PATCH", `/api/api-partners/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Partner updated",
        description: "The API partner has been updated successfully.",
      });
      partnerForm.reset();
      setIsPartnerDialogOpen(false);
      setEditingPartnerId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/api-partners"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update partner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete partner mutation
  const deletePartnerMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/api-partners/${id}`),
    onSuccess: () => {
      toast({
        title: "Partner deleted",
        description: "The API partner has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/api-partners"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete partner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle partner form submission
  const onPartnerFormSubmit = (data: z.infer<typeof partnerFormSchema>) => {
    if (editingPartnerId) {
      updatePartnerMutation.mutate({ id: editingPartnerId, data });
    } else {
      createPartnerMutation.mutate(data);
    }
  };

  // Handle edit partner
  const handleEditPartner = (partner: Partner) => {
    setEditingPartnerId(partner.id);
    partnerForm.reset({
      name: partner.name,
      contactName: partner.contactName,
      contactEmail: partner.contactEmail,
      contactPhone: partner.contactPhone || "",
      websiteUrl: partner.websiteUrl || "",
      notes: partner.notes || "",
      status: partner.active ? "active" : "inactive",
      ipWhitelist: partner.ipWhitelist || "",
      apiLimits: partner.apiLimits || "",
    });
    setIsPartnerDialogOpen(true);
  };

  // Handle new partner
  const handleNewPartner = () => {
    setEditingPartnerId(null);
    partnerForm.reset({
      name: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      websiteUrl: "",
      notes: "",
      status: "active",
      ipWhitelist: "",
      apiLimits: "",
    });
    setIsPartnerDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <p className="text-lg font-medium">Failed to load partners</p>
        <p className="text-muted-foreground">
          There was an error loading the API partners. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">API Partners</h2>
        <Button onClick={handleNewPartner}>
          <Plus className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      </div>

      {partners.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No API Partners Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first API partner to start generating API keys for integration.
            </p>
            <Button onClick={handleNewPartner}>
              <Plus className="mr-2 h-4 w-4" /> Add Your First Partner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner: Partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="font-medium">{partner.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {partner.websiteUrl}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{partner.contactName}</div>
                    <div className="text-sm text-muted-foreground">
                      {partner.contactEmail}
                    </div>
                    {partner.contactPhone && (
                      <div className="text-sm text-muted-foreground">
                        {partner.contactPhone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={partner.active ? "default" : "secondary"}
                    >
                      {partner.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {partner.createdAt
                      ? format(new Date(partner.createdAt), "dd MMM yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleEditPartner(partner)}
                        >
                          Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this partner? This will also delete all associated API keys.")) {
                              deletePartnerMutation.mutate(partner.id);
                            }
                          }}
                          className="text-destructive"
                        >
                          Delete partner
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Partner Dialog */}
      <Dialog
        open={isPartnerDialogOpen}
        onOpenChange={setIsPartnerDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPartnerId ? "Edit API Partner" : "Add API Partner"}
            </DialogTitle>
            <DialogDescription>
              {editingPartnerId
                ? "Update the details for this API partner."
                : "Add a new partner that will use your API."}
            </DialogDescription>
          </DialogHeader>
          <Form {...partnerForm}>
            <form
              onSubmit={partnerForm.handleSubmit(onPartnerFormSubmit)}
              className="space-y-4"
            >
              <FormField
                control={partnerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter partner name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={partnerForm.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact person" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partnerForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={partnerForm.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Contact email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partnerForm.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partnerForm.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partnerForm.control}
                name="ipWhitelist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Whitelist (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1.2.3.4,5.6.7.8" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of allowed IP addresses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partnerForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional information about this partner"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPartnerDialogOpen(false);
                    partnerForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPartnerId ? "Update Partner" : "Add Partner"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ApiKeysList = () => {
  const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [regenerateKeyDialogOpen, setRegenerateKeyDialogOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch partners for dropdown
  const { data: partners = [] } = useQuery({
    queryKey: ["/api/api-partners"],
    refetchOnWindowFocus: false,
  });

  // Key form setup
  const keyForm = useForm<z.infer<typeof apiKeyFormSchema>>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      keyName: "",
      description: "",
      isActive: true,
      expiresAt: "",
      ipRestrictions: "",
      allowedEndpoints: "",
    },
  });

  // Regenerate key form
  const regenerateKeyForm = useForm<z.infer<typeof regenerateKeyFormSchema>>({
    resolver: zodResolver(regenerateKeyFormSchema),
    defaultValues: {
      confirmRegenerate: false,
    },
  });

  // Fetch API keys for selected partner
  const {
    data: apiKeys = [],
    isLoading: keysLoading,
    error: keysError,
    refetch: refetchKeys,
  } = useQuery({
    queryKey: ["/api/api-keys", selectedPartnerId],
    queryFn: async () => {
      if (!selectedPartnerId) return [];
      const response = await apiRequest(
        "GET",
        `/api/api-keys?partnerId=${selectedPartnerId}`
      );
      return await response.json();
    },
    enabled: !!selectedPartnerId,
    refetchOnWindowFocus: false,
  });

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: (data: z.infer<typeof apiKeyFormSchema>) =>
      apiRequest("POST", "/api/api-keys", data),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "API Key created",
        description: "The API key has been created successfully.",
      });
      keyForm.reset();
      setIsKeyDialogOpen(false);
      if (selectedPartnerId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/api-keys", selectedPartnerId] 
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/api-keys/${id}`),
    onSuccess: () => {
      toast({
        title: "API Key deleted",
        description: "The API key has been deleted successfully.",
      });
      if (selectedPartnerId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/api-keys", selectedPartnerId] 
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update API key mutation (for activate/deactivate)
  const updateKeyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/api-keys/${id}`, data),
    onSuccess: () => {
      toast({
        title: "API Key updated",
        description: "The API key has been updated successfully.",
      });
      if (selectedPartnerId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/api-keys", selectedPartnerId] 
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle API key form submission
  const onKeyFormSubmit = (data: z.infer<typeof apiKeyFormSchema>) => {
    createKeyMutation.mutate(data);
  };

  // Handle new API key
  const handleNewKey = () => {
    keyForm.reset({
      keyName: "",
      partnerId: selectedPartnerId || undefined,
      description: "",
      isActive: true,
      expiresAt: "",
      ipRestrictions: "",
      allowedEndpoints: "",
    });
    setIsKeyDialogOpen(true);
  };

  // Handle copy key to clipboard
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
    
    // Reset copied state after 3 seconds
    setTimeout(() => {
      setCopiedKey(null);
    }, 3000);
  };

  // Handle regenerate key dialog
  const handleRegenerateKeyClick = (keyId: number) => {
    setSelectedKeyId(keyId);
    regenerateKeyForm.reset({
      keyId: keyId,
      confirmRegenerate: false,
    });
    setRegenerateKeyDialogOpen(true);
  };

  if (!selectedPartnerId && partners.length > 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">API Keys</h2>
        <Card>
          <CardHeader>
            <CardTitle>Select a Partner</CardTitle>
            <CardDescription>
              Choose an API partner to manage their API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partner: Partner) => (
                <Card
                  key={partner.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    partner.active ? "" : "opacity-60"
                  }`}
                  onClick={() => setSelectedPartnerId(partner.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      {partner.name}
                    </CardTitle>
                    <Badge
                      variant={partner.active ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {partner.active ? "Active" : "Inactive"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {partner.contactEmail}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPartner = partners.find(
    (p: Partner) => p.id === selectedPartnerId
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2"
              onClick={() => setSelectedPartnerId(null)}
            >
              ←
            </Button>
            API Keys for {selectedPartner?.name}
          </h2>
          <p className="text-muted-foreground">
            {selectedPartner?.active
              ? "Manage API keys for this partner"
              : "This partner is inactive. Keys won't work until partner is activated."}
          </p>
        </div>
        <Button onClick={handleNewKey}>
          <Key className="mr-2 h-4 w-4" /> Generate New API Key
        </Button>
      </div>

      {keysLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : keysError ? (
        <div className="p-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">Failed to load API keys</p>
          <p className="text-muted-foreground">
            There was an error loading the API keys. Please try again.
          </p>
        </div>
      ) : apiKeys.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-6 text-center">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No API Keys Yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate an API key for this partner to allow API access.
            </p>
            <Button onClick={handleNewKey}>
              <Key className="mr-2 h-4 w-4" /> Generate First API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key: ApiKey) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="font-medium">{key.keyName}</div>
                    {key.description && (
                      <div className="text-sm text-muted-foreground">
                        {key.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 font-mono text-sm">
                      <div className="truncate max-w-[140px]">
                        {key.keyValue.substring(0, 8)}...
                        {key.keyValue.substring(key.keyValue.length - 4)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(key.keyValue)}
                      >
                        {copiedKey === key.keyValue ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Switch
                        checked={key.isActive}
                        onCheckedChange={(checked) => {
                          updateKeyMutation.mutate({
                            id: key.id,
                            data: { isActive: checked },
                          });
                        }}
                      />
                      <span className="ml-2">
                        {key.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{key.usageCount} requests</div>
                    <div className="text-sm text-muted-foreground">
                      Last used:{" "}
                      {key.lastUsed
                        ? format(new Date(key.lastUsed), "dd MMM yyyy")
                        : "Never"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.createdAt &&
                      format(new Date(key.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleCopyKey(key.keyValue)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy key
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRegenerateKeyClick(key.id)}
                        >
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Regenerate key
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this API key? This action cannot be undone."
                              )
                            ) {
                              deleteKeyMutation.mutate(key.id);
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete key
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* API Key Creation Dialog */}
      <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for {selectedPartner?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...keyForm}>
            <form
              onSubmit={keyForm.handleSubmit(onKeyFormSubmit)}
              className="space-y-4"
            >
              <FormField
                control={keyForm.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner</FormLabel>
                    <FormControl>
                      <Input
                        value={selectedPartner?.name}
                        disabled
                      />
                    </FormControl>
                    <input
                      type="hidden"
                      {...field}
                      value={selectedPartnerId || undefined}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={keyForm.control}
                name="keyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Production API Key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={keyForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="What is this key used for?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={keyForm.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave blank for a non-expiring key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={keyForm.control}
                name="ipRestrictions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Restrictions (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1.2.3.4,5.6.7.8"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of allowed IP addresses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={keyForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Set whether this key is active immediately
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsKeyDialogOpen(false);
                    keyForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Generate API Key</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Regenerate Key Dialog */}
      <Dialog
        open={regenerateKeyDialogOpen}
        onOpenChange={setRegenerateKeyDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Regenerate API Key</DialogTitle>
            <DialogDescription>
              This will invalidate the existing key and generate a new one. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Form {...regenerateKeyForm}>
            <form
              onSubmit={regenerateKeyForm.handleSubmit(() => {
                // TODO: Implement key regeneration when this feature is needed
                // For now just close the dialog and show a message
                toast({
                  title: "Feature Coming Soon",
                  description: "Key regeneration will be available in a future update.",
                });
                setRegenerateKeyDialogOpen(false);
              })}
              className="space-y-4"
            >
              <FormField
                control={regenerateKeyForm.control}
                name="confirmRegenerate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I understand this will invalidate the existing key
                      </FormLabel>
                      <FormDescription>
                        Applications using the current key will stop working until updated with the new key
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <input
                type="hidden"
                {...regenerateKeyForm.register("keyId")}
                value={selectedKeyId || undefined}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRegenerateKeyDialogOpen(false);
                    regenerateKeyForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive">
                  Regenerate Key
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ApiLogsDisplay = () => {
  // TODO: Implement API logs display when needed
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">API Logs</h2>
      <Card>
        <CardHeader>
          <CardTitle>Feature Coming Soon</CardTitle>
          <CardDescription>
            API usage logs will be available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            API logs will provide detailed information about API requests, including:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Request timestamps and durations</li>
            <li>Request and response details</li>
            <li>Error information</li>
            <li>IP address and user agent data</li>
            <li>Performance metrics</li>
          </ul>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Check back soon for this feature.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

const ApiPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Conditionally render sidebar based on sidebarVisible state */}
      {sidebarVisible && (
        <div className="h-full">
          <Sidebar />
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        <div className="p-4 flex items-center border-b border-gray-200">
          <Button
            variant="ghost"
            className="mr-2"
            onClick={toggleSidebar}
            size="sm"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">API Gateway</h1>
        </div>
        
        <div className="container mx-auto py-6 px-4">
          <Tabs defaultValue="partners" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="partners">Partners</TabsTrigger>
              <TabsTrigger value="keys">API Keys</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="partners" className="space-y-4">
              <ApiPartnersList />
            </TabsContent>
            <TabsContent value="keys" className="space-y-4">
              <ApiKeysList />
            </TabsContent>
            <TabsContent value="logs" className="space-y-4">
              <ApiLogsDisplay />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ApiPage;