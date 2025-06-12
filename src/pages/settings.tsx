import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Globe, 
  Mail, 
  User, 
  Shield, 
  Database, 
  Brush, 
  Palette, 
  Moon, 
  Sun, 
  Check,
  Save,
  FileText,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schema
const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyRegistration: z.string().min(1, "Registration number is required"),
  vatNumber: z.string().optional(),
  emailAddress: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  theme: z.enum(["light", "dark", "system"]),
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  notifications: z.object({
    emailAlerts: z.boolean(),
    newClaims: z.boolean(),
    claimUpdates: z.boolean(),
    systemAnnouncements: z.boolean(),
    marketingEmails: z.boolean(),
  }),
});

const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  requirePasswordChange: z.boolean(),
  passwordExpiry: z.string(),
  sessionTimeout: z.string(),
  allowedIpAddresses: z.string().optional(),
  apiKeyEnabled: z.boolean(),
});

const documentSettingsSchema = z.object({
  defaultFormat: z.string(),
  documentRetention: z.string(),
  autoSave: z.boolean(),
  companyLogoOnDocs: z.boolean(),
  watermark: z.boolean(),
  autoGenerateNumbers: z.boolean(),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>;
type DocumentSettingsValues = z.infer<typeof documentSettingsSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  
  // Mock user data for sidebar
  const mockUser = {
    name: "Sarah Johnson",
    role: "Super Admin",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  };

  // General Settings Form
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "CoverSync Insurance",
      companyRegistration: "2018/123456/07",
      vatNumber: "4530123456",
      emailAddress: "admin@coversync.co.za",
      phoneNumber: "011 123 4567",
      address: "123 Main Street, Johannesburg, 2000",
      theme: "light",
      language: "en-ZA",
      timezone: "Africa/Johannesburg",
      dateFormat: "DD/MM/YYYY",
      notifications: {
        emailAlerts: true,
        newClaims: true,
        claimUpdates: true,
        systemAnnouncements: true,
        marketingEmails: false,
      },
    },
  });

  // Security Settings Form
  const securityForm = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      twoFactorEnabled: true,
      requirePasswordChange: true,
      passwordExpiry: "90",
      sessionTimeout: "30",
      allowedIpAddresses: "",
      apiKeyEnabled: false,
    }
  });

  // Document Settings Form
  const documentForm = useForm<DocumentSettingsValues>({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues: {
      defaultFormat: "pdf",
      documentRetention: "7",
      autoSave: true,
      companyLogoOnDocs: true,
      watermark: false,
      autoGenerateNumbers: true,
    }
  });

  // Submit handlers
  const onSubmitGeneral = (values: GeneralSettingsValues) => {
    console.log(values);
    // In a real app, this would be an API call
    toast({
      title: "Settings updated",
      description: "Your general settings have been saved successfully.",
    });
  };

  const onSubmitSecurity = (values: SecuritySettingsValues) => {
    console.log(values);
    // In a real app, this would be an API call
    toast({
      title: "Security settings updated",
      description: "Your security settings have been saved successfully.",
    });
  };

  const onSubmitDocument = (values: DocumentSettingsValues) => {
    console.log(values);
    // In a real app, this would be an API call
    toast({
      title: "Document settings updated",
      description: "Your document settings have been saved successfully.",
    });
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
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure application settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 rounded-none border-b p-0">
                  <TabsTrigger
                    value="general"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none py-3 font-medium"
                  >
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none py-3 font-medium"
                  >
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none py-3 font-medium"
                  >
                    Documents
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                  <div className="p-6">
                    <Form {...generalForm}>
                      <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={generalForm.control}
                              name="companyName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={generalForm.control}
                              name="companyRegistration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Registration Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={generalForm.control}
                              name="vatNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>VAT Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={generalForm.control}
                              name="emailAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={generalForm.control}
                              name="phoneNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={generalForm.control}
                              name="address"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={generalForm.control}
                              name="theme"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormLabel>Theme</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex flex-col space-y-1"
                                    >
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value="light" />
                                        </FormControl>
                                        <FormLabel className="font-normal flex items-center">
                                          <Sun className="mr-2 h-4 w-4" />
                                          Light
                                        </FormLabel>
                                      </FormItem>
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value="dark" />
                                        </FormControl>
                                        <FormLabel className="font-normal flex items-center">
                                          <Moon className="mr-2 h-4 w-4" />
                                          Dark
                                        </FormLabel>
                                      </FormItem>
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value="system" />
                                        </FormControl>
                                        <FormLabel className="font-normal flex items-center">
                                          <Palette className="mr-2 h-4 w-4" />
                                          System
                                        </FormLabel>
                                      </FormItem>
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={generalForm.control}
                              name="language"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Language</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select language" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="en-ZA">English (South Africa)</SelectItem>
                                      <SelectItem value="af-ZA">Afrikaans</SelectItem>
                                      <SelectItem value="zu-ZA">isiZulu</SelectItem>
                                      <SelectItem value="xh-ZA">isiXhosa</SelectItem>
                                      <SelectItem value="st-ZA">Sesotho</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={generalForm.control}
                              name="timezone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Time Zone</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select timezone" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                                      <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                                      <SelectItem value="America/New_York">America/New York</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={generalForm.control}
                              name="dateFormat"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date Format</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select date format" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                      <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                          <div className="space-y-4">
                            <FormField
                              control={generalForm.control}
                              name="notifications.emailAlerts"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Email Notifications</FormLabel>
                                    <FormDescription>
                                      Receive email notifications
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
                            <FormField
                              control={generalForm.control}
                              name="notifications.newClaims"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>New Claims</FormLabel>
                                    <FormDescription>
                                      Get notified when new claims are submitted
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
                            <FormField
                              control={generalForm.control}
                              name="notifications.claimUpdates"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Claim Updates</FormLabel>
                                    <FormDescription>
                                      Get notified when claims are updated
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
                            <FormField
                              control={generalForm.control}
                              name="notifications.systemAnnouncements"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>System Announcements</FormLabel>
                                    <FormDescription>
                                      Receive system announcements and updates
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
                            <FormField
                              control={generalForm.control}
                              name="notifications.marketingEmails"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Marketing Emails</FormLabel>
                                    <FormDescription>
                                      Receive marketing emails and newsletters
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
                          </div>
                        </div>

                        <Button type="submit" className="w-full">Save General Settings</Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
                
                <TabsContent value="security">
                  <div className="p-6">
                    <Form {...securityForm}>
                      <form onSubmit={securityForm.handleSubmit(onSubmitSecurity)} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Authentication</h3>
                          <div className="space-y-4">
                            <FormField
                              control={securityForm.control}
                              name="twoFactorEnabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Two-Factor Authentication</FormLabel>
                                    <FormDescription>
                                      Require two-factor authentication for all users
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
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Password Policy</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={securityForm.control}
                              name="requirePasswordChange"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Force Password Change</FormLabel>
                                    <FormDescription>
                                      Require new users to change their password on first login
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
                            <FormField
                              control={securityForm.control}
                              name="passwordExpiry"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password Expiry (days)</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select password expiry" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="30">30 days</SelectItem>
                                      <SelectItem value="60">60 days</SelectItem>
                                      <SelectItem value="90">90 days</SelectItem>
                                      <SelectItem value="180">180 days</SelectItem>
                                      <SelectItem value="0">Never</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    How often users must change their password
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Session Management</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={securityForm.control}
                              name="sessionTimeout"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Session Timeout (minutes)</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select session timeout" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="15">15 minutes</SelectItem>
                                      <SelectItem value="30">30 minutes</SelectItem>
                                      <SelectItem value="60">60 minutes</SelectItem>
                                      <SelectItem value="120">2 hours</SelectItem>
                                      <SelectItem value="240">4 hours</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    How long before an inactive session is automatically logged out
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={securityForm.control}
                              name="allowedIpAddresses"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Allowed IP Addresses</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g. 192.168.1.1, 10.0.0.1" />
                                  </FormControl>
                                  <FormDescription>
                                    Restrict login to specific IP addresses (comma separated, leave blank for no restriction)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">API Access</h3>
                          <div className="space-y-4">
                            <FormField
                              control={securityForm.control}
                              name="apiKeyEnabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Enable API Access</FormLabel>
                                    <FormDescription>
                                      Allow API access to the system
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
                          </div>
                        </div>

                        <Button type="submit" className="w-full">Save Security Settings</Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
                
                <TabsContent value="documents">
                  <div className="p-6">
                    <Form {...documentForm}>
                      <form onSubmit={documentForm.handleSubmit(onSubmitDocument)} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Document Management</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={documentForm.control}
                              name="defaultFormat"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default Document Format</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select document format" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pdf">PDF</SelectItem>
                                      <SelectItem value="docx">Microsoft Word (DOCX)</SelectItem>
                                      <SelectItem value="xlsx">Microsoft Excel (XLSX)</SelectItem>
                                      <SelectItem value="csv">CSV</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={documentForm.control}
                              name="documentRetention"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Document Retention Period (years)</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select retention period" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="1">1 year</SelectItem>
                                      <SelectItem value="3">3 years</SelectItem>
                                      <SelectItem value="5">5 years</SelectItem>
                                      <SelectItem value="7">7 years</SelectItem>
                                      <SelectItem value="10">10 years</SelectItem>
                                      <SelectItem value="0">Indefinite</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    How long to keep documents before archiving
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Document Generation</h3>
                          <div className="space-y-4">
                            <FormField
                              control={documentForm.control}
                              name="autoSave"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Auto-Save Documents</FormLabel>
                                    <FormDescription>
                                      Automatically save document drafts while editing
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
                            <FormField
                              control={documentForm.control}
                              name="companyLogoOnDocs"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Include Company Logo</FormLabel>
                                    <FormDescription>
                                      Add company logo to all generated documents
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
                            <FormField
                              control={documentForm.control}
                              name="watermark"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Add Watermark</FormLabel>
                                    <FormDescription>
                                      Add watermark to all generated documents
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
                            <FormField
                              control={documentForm.control}
                              name="autoGenerateNumbers"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Auto-Generate Document Numbers</FormLabel>
                                    <FormDescription>
                                      Automatically generate reference numbers for new documents
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
                          </div>
                        </div>

                        <Button type="submit" className="w-full">Save Document Settings</Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}