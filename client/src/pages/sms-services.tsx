import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  CreditCard, 
  Settings, 
  ListChecks, 
  BarChart, 
  Clock, 
  Send,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Edit,
  Save,
  Copy
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose
} from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import DashboardLayout from "@/components/dashboard-layout";

// Schema for SMS Template
const smsTemplateSchema = z.object({
  name: z.string().min(1, { message: "Template name is required" }),
  type: z.string().min(1, { message: "Template type is required" }),
  content: z.string().min(1, { message: "Message content is required" }).max(160, { message: "SMS content cannot exceed 160 characters" }),
  isActive: z.boolean().default(true),
});

// Schema for SMS Credit Purchase
const creditPurchaseSchema = z.object({
  amount: z.string().min(1, { message: "Amount in ZAR is required" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
});

// List of template types
const templateTypes = [
  { value: "policy_payment", label: "Policy Payment Confirmation" },
  { value: "claim_captured", label: "Claim Captured" },
  { value: "claim_approved", label: "Claim Approved" },
  { value: "claim_rejected", label: "Claim Rejected" },
  { value: "birthday", label: "Birthday Wishes" },
  { value: "renewal", label: "Policy Renewal Reminder" },
  { value: "welcome", label: "Welcome Message" }
];

// SMS services page
export default function SmsServices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");
  
  // Templates Tab
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">SMS Services</h1>
          <div className="flex items-center gap-4">
            <CreditBalanceCard />
          </div>
        </div>
        
        <Tabs defaultValue="templates" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-6">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>SMS Credits</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              <span>Message Logs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates">
            <TemplatesTab />
          </TabsContent>
          
          <TabsContent value="credits">
            <CreditsTab />
          </TabsContent>
          
          <TabsContent value="logs">
            <LogsTab />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Credit Balance Card Component
function CreditBalanceCard() {
  // Simulate fetching credit balance
  const { data: credits = { balance: 250 } } = useQuery({ 
    queryKey: ["/api/sms/credits/balance"],
    enabled: false
  });
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-md border shadow-sm">
      <div className="text-sm text-gray-500">SMS Credits:</div>
      <div className="font-bold text-primary-700">{credits.balance}</div>
    </div>
  );
}

// Templates Tab Component
function TemplatesTab() {
  const [templates, setTemplates] = useState([
    { 
      id: 1, 
      name: "Policy Payment", 
      type: "policy_payment", 
      content: "Thank you for your payment of R{amount} for policy #{policyNumber}. Payment received on {date}. CoverSync",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: "Claim Notification", 
      type: "claim_captured", 
      content: "Your claim #{claimId} has been received. We'll process it within 48 hours. CoverSync",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 3, 
      name: "Birthday Wishes", 
      type: "birthday", 
      content: "Happy Birthday {name}! Wishing you a wonderful day filled with joy and happiness. CoverSync",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  
  const form = useForm<z.infer<typeof smsTemplateSchema>>({
    resolver: zodResolver(smsTemplateSchema),
    defaultValues: {
      name: "",
      type: "",
      content: "",
      isActive: true
    }
  });
  
  const { toast } = useToast();
  
  const handleSaveTemplate = (values: z.infer<typeof smsTemplateSchema>) => {
    if (editingTemplate !== null) {
      // Update existing template
      setTemplates(templates.map(t => 
        t.id === editingTemplate ? { ...t, ...values, updatedAt: new Date().toISOString() } : t
      ));
      toast({
        title: "Template updated",
        description: "SMS template has been updated successfully",
        variant: "default",
      });
      setEditingTemplate(null);
    } else {
      // Add new template
      setTemplates([
        ...templates,
        {
          id: templates.length + 1,
          ...values,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
      toast({
        title: "Template added",
        description: "New SMS template has been added successfully",
        variant: "default",
      });
    }
    
    form.reset({
      name: "",
      type: "",
      content: "",
      isActive: true
    });
    
    setIsAddDialogOpen(false);
  };
  
  const handleEditTemplate = (id: number) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      form.reset({
        name: template.name,
        type: template.type,
        content: template.content,
        isActive: template.isActive
      });
      setEditingTemplate(id);
      setIsAddDialogOpen(true);
    }
  };
  
  const handleDeleteTemplate = (id: number) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast({
      title: "Template deleted",
      description: "SMS template has been deleted successfully",
      variant: "default",
    });
  };
  
  const handleToggleActive = (id: number) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive, updatedAt: new Date().toISOString() } : t
    ));
  };
  
  const handleTestSend = (id: number) => {
    toast({
      title: "Test SMS",
      description: "Test SMS has been sent to your phone number",
      variant: "default",
    });
  };
  
  const countChars = (content: string) => {
    return content.length;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">SMS Templates</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Template</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit SMS Template" : "Add New SMS Template"}</DialogTitle>
              <DialogDescription>
                Create a template for automated SMS messages. Templates can include placeholders like {"{name}"}, {"{amount}"}, etc.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveTemplate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Payment Confirmation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templateTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMS Content</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Textarea 
                            placeholder="Enter your SMS message content..." 
                            {...field} 
                            className="resize-none"
                            rows={3}
                          />
                          <div className="text-xs text-gray-500 flex justify-between">
                            <span>
                              Placeholders: {"{name}"}, {"{amount}"}, {"{date}"}, {"{policyNumber}"}
                            </span>
                            <span className={countChars(field.value) > 160 ? "text-red-500" : ""}>
                              {countChars(field.value)}/160 characters
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Template</FormLabel>
                        <FormDescription className="text-xs text-gray-500">
                          Activate or deactivate this template
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
                      form.reset();
                      setIsAddDialogOpen(false);
                      setEditingTemplate(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTemplate ? "Update Template" : "Add Template"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableCaption>A list of your SMS templates</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    {templateTypes.find(t => t.value === template.type)?.label || template.type}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={template.content}>
                    {template.content}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={template.isActive ? "success" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(template.id)}
                        title={template.isActive ? "Disable Template" : "Enable Template"}
                      >
                        {template.isActive ? 
                          <X className="h-4 w-4 text-gray-500" /> : 
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTemplate(template.id)}
                        title="Edit Template"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTestSend(template.id)}
                        title="Send Test SMS"
                      >
                        <Send className="h-4 w-4 text-primary-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Credits Tab Component
function CreditsTab() {
  const { toast } = useToast();
  
  // Transactions history (mock data)
  const transactions = [
    { id: 1, date: '2025-03-27T15:30:00', type: 'purchase', amount: 500, credits: 500, balance: 500 },
    { id: 2, date: '2025-03-27T16:45:00', type: 'usage', amount: -250, credits: -250, balance: 250 },
  ];
  
  // Credit pricing tiers
  const creditPricingTiers = [
    { credits: 100, price: 99, pricePerCredit: 0.99 },
    { credits: 500, price: 450, pricePerCredit: 0.90 },
    { credits: 1000, price: 850, pricePerCredit: 0.85 },
    { credits: 5000, price: 4000, pricePerCredit: 0.80 },
  ];
  
  // Purchase credits form
  const form = useForm<z.infer<typeof creditPurchaseSchema>>({
    resolver: zodResolver(creditPurchaseSchema),
    defaultValues: {
      amount: ""
    }
  });
  
  const onSubmit = (values: z.infer<typeof creditPurchaseSchema>) => {
    toast({
      title: "Credits purchased",
      description: `You have successfully purchased SMS credits for R${values.amount}`,
      variant: "default",
    });
    form.reset();
  };
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Purchase SMS Credits</CardTitle>
            <CardDescription>
              Buy SMS credits to send messages to your clients. The more credits you buy, the better the rate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Credit Pricing</h3>
                <div className="space-y-3">
                  {creditPricingTiers.map((tier) => (
                    <div key={tier.credits} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{tier.credits} credits</div>
                        <div className="text-sm text-gray-500">R{tier.pricePerCredit} per credit</div>
                      </div>
                      <div className="font-bold text-primary-700">R{tier.price}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Buy Credits</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (ZAR)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                              <Input className="pl-8" placeholder="0.00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">Purchase Credits</Button>
                  </form>
                </Form>
                <div className="mt-4 text-sm text-gray-500">
                  * Payment will be processed securely via Stripe
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Credit Balance</CardTitle>
            <CardDescription>
              Your current SMS credit balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-700">250</div>
                <div className="text-sm text-gray-500 mt-2">available credits</div>
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Credits used this month:</span>
                <span className="font-medium">250</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Messages sent this month:</span>
                <span className="font-medium">72</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Recent credit purchases and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transaction Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'purchase' ? 'success' : 'secondary'}>
                      {transaction.type === 'purchase' ? 'Purchase' : 'Usage'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.amount > 0 ? `R${transaction.amount}` : ''}
                  </TableCell>
                  <TableCell className={`text-right ${transaction.credits < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {transaction.credits > 0 ? `+${transaction.credits}` : transaction.credits}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {transaction.balance}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Logs Tab Component
function LogsTab() {
  // Mock SMS logs data
  const logs = [
    { 
      id: 1, 
      recipient: '+27731234567', 
      template: 'Policy Payment', 
      content: 'Thank you for your payment of R500 for policy #POL12345. Payment received on 2025-03-27. CoverSync', 
      status: 'delivered',
      sentAt: '2025-03-27T12:30:45',
      deliveredAt: '2025-03-27T12:31:00',
    },
    { 
      id: 2, 
      recipient: '+27821234567', 
      template: 'Claim Notification', 
      content: 'Your claim #CL789 has been received. We\'ll process it within 48 hours. CoverSync', 
      status: 'delivered',
      sentAt: '2025-03-27T10:15:30',
      deliveredAt: '2025-03-27T10:15:45',
    },
    { 
      id: 3, 
      recipient: '+27621234567', 
      template: 'Birthday Wishes', 
      content: 'Happy Birthday John! Wishing you a wonderful day filled with joy and happiness. CoverSync', 
      status: 'failed',
      sentAt: '2025-03-27T08:45:15',
      deliveredAt: null,
      error: 'Invalid recipient number'
    }
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>SMS Message Logs</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                Export CSV
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Filter
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            History of all SMS messages sent through the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="font-medium">{log.recipient}</TableCell>
                  <TableCell>{log.template}</TableCell>
                  <TableCell className="max-w-xs truncate" title={log.content}>
                    {log.content}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={log.status === 'delivered' ? 'success' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="font-medium">Message Details</h4>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Sent at:</span>
                                <span>{new Date(log.sentAt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Delivered at:</span>
                                <span>{log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Status:</span>
                                <span>{log.status}</span>
                              </div>
                              {log.error && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Error:</span>
                                  <span className="text-red-500">{log.error}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button variant="ghost" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  const [settings, setSettings] = useState({
    senderName: "CoverSync",
    sendWelcomeMessage: true,
    sendBirthdayMessages: true,
    sendPaymentConfirmations: true,
    sendClaimNotifications: true,
    smsFooter: "CoverSync",
    autoBuyCredits: false,
    minCreditThreshold: 50,
    autoRechargAmount: 200
  });
  
  const { toast } = useToast();
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your SMS settings have been updated successfully",
      variant: "default",
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SMS Settings</CardTitle>
          <CardDescription>
            Configure your SMS messaging preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input 
                  id="senderName" 
                  value={settings.senderName}
                  onChange={(e) => setSettings({...settings, senderName: e.target.value})}
                />
                <p className="text-xs text-gray-500">
                  This name will appear as the sender of SMS messages
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smsFooter">SMS Footer</Label>
                <Input 
                  id="smsFooter" 
                  value={settings.smsFooter}
                  onChange={(e) => setSettings({...settings, smsFooter: e.target.value})}
                />
                <p className="text-xs text-gray-500">
                  This text will be appended to the end of each SMS
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Automatic SMS Messages</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Welcome Messages</Label>
                  <p className="text-xs text-gray-500">
                    Send a welcome message when a new client is registered
                  </p>
                </div>
                <Switch 
                  checked={settings.sendWelcomeMessage}
                  onCheckedChange={(checked) => setSettings({...settings, sendWelcomeMessage: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Birthday Messages</Label>
                  <p className="text-xs text-gray-500">
                    Send birthday wishes to clients on their birthday
                  </p>
                </div>
                <Switch 
                  checked={settings.sendBirthdayMessages}
                  onCheckedChange={(checked) => setSettings({...settings, sendBirthdayMessages: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Payment Confirmations</Label>
                  <p className="text-xs text-gray-500">
                    Send confirmation messages when payments are received
                  </p>
                </div>
                <Switch 
                  checked={settings.sendPaymentConfirmations}
                  onCheckedChange={(checked) => setSettings({...settings, sendPaymentConfirmations: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Claim Notifications</Label>
                  <p className="text-xs text-gray-500">
                    Send notifications for claim status changes
                  </p>
                </div>
                <Switch 
                  checked={settings.sendClaimNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, sendClaimNotifications: checked})}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-4">Automatic Credit Purchase</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <Label>Auto-buy Credits</Label>
                <p className="text-xs text-gray-500">
                  Automatically purchase new credits when your balance is low
                </p>
              </div>
              <Switch 
                checked={settings.autoBuyCredits}
                onCheckedChange={(checked) => setSettings({...settings, autoBuyCredits: checked})}
              />
            </div>
            
            {settings.autoBuyCredits && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 pt-2 border-l-2 border-primary-100">
                <div className="space-y-2">
                  <Label htmlFor="minCreditThreshold">Minimum Credit Threshold</Label>
                  <Input 
                    id="minCreditThreshold" 
                    type="number"
                    value={settings.minCreditThreshold}
                    onChange={(e) => setSettings({...settings, minCreditThreshold: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500">
                    Purchase new credits when balance falls below this threshold
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="autoRechargAmount">Auto-recharge Amount (ZAR)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                    <Input 
                      id="autoRechargAmount"
                      type="number"
                      className="pl-8"
                      value={settings.autoRechargAmount}
                      onChange={(e) => setSettings({...settings, autoRechargAmount: parseInt(e.target.value)})}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Amount to spend when auto-purchasing credits
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}