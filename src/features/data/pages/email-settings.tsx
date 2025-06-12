import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/features/data/components/ui/card';
import { Button } from '@/features/data/components/ui/button';
import { Input } from '@/features/data/components/ui/input';
import { Label } from '@/features/data/components/ui/label';
import { Textarea } from '@/features/data/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import { Loader2, CheckCircle, XCircle, AtSign, Send } from 'lucide-react';
import { Switch } from '@/features/data/components/ui/switch';
import DashboardLayout from '@/features/data/components/dashboard-layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/features/data/components/ui/tabs';
import EmailTemplateEditor from '@/features/data/components/email-template-editor';
import EmailLogsList from '@/features/data/components/email-logs-list';
import EmailSignatureEditor from '@/features/data/components/email-signature-editor';

const EmailSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testEmail, setTestEmail] = useState<string>('');
  
  // Get email settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/email/settings'],
    select: (data) => data || {
      underwriterEmails: '',
      brokerEmails: '',
      managerEmails: '',
      notifyOnNewPolicy: false,
      notifyOnClaim: false,
      emailSignature: '',
      replyToEmail: ''
    }
  });
  
  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      return apiRequest('POST', '/api/email/settings', updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Email settings have been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const testConnectionMutation = useMutation({
    mutationFn: async (recipientEmail?: string) => {
      return apiRequest('POST', '/api/email/test-connection', { recipientEmail });
    },
    onMutate: () => {
      setTestStatus('loading');
    },
    onSuccess: () => {
      setTestStatus('success');
      toast({
        title: 'Connection Successful',
        description: testEmail 
          ? `Test email was sent successfully to ${testEmail}.` 
          : 'Test email was sent successfully to the default address.',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      setTestStatus('error');
      toast({
        title: 'Connection Failed',
        description: `Could not connect to email server: ${error.message}`,
        variant: 'destructive',
        duration: 5000,
      });
    },
  });
  
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const updatedSettings = {
      underwriterEmails: formData.get('underwriterEmails'),
      brokerEmails: formData.get('brokerEmails'),
      managerEmails: formData.get('managerEmails'),
      notifyOnNewPolicy: formData.get('notifyOnNewPolicy') === 'on',
      notifyOnClaim: formData.get('notifyOnClaim') === 'on',
      emailSignature: formData.get('emailSignature'),
      replyToEmail: formData.get('replyToEmail'),
    };
    
    updateSettingsMutation.mutate(updatedSettings);
  };
  
  const handleTestConnection = () => {
    testConnectionMutation.mutate(testEmail || undefined);
  };
  
  if (isLoadingSettings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Email Services</h1>
        
        <Tabs defaultValue="settings">
          <TabsList className="mb-6">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="signature">Signature</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="logs">Email Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>
                    Configure notification recipients and settings for the system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="settingsForm" onSubmit={handleSettingsSubmit}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="underwriterEmails">Underwriter Emails</Label>
                          <Input 
                            id="underwriterEmails" 
                            name="underwriterEmails" 
                            placeholder="email@example.com, another@example.com" 
                            defaultValue={settings?.underwriterEmails || ''}
                          />
                          <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brokerEmails">Broker Emails</Label>
                          <Input 
                            id="brokerEmails" 
                            name="brokerEmails" 
                            placeholder="email@example.com, another@example.com" 
                            defaultValue={settings?.brokerEmails || ''}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="managerEmails">Manager Emails</Label>
                          <Input 
                            id="managerEmails" 
                            name="managerEmails" 
                            placeholder="email@example.com, another@example.com" 
                            defaultValue={settings?.managerEmails || ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="replyToEmail">Reply-To Email</Label>
                          <Input 
                            id="replyToEmail" 
                            name="replyToEmail" 
                            placeholder="replies@example.com" 
                            defaultValue={settings?.replyToEmail || ''}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="emailSignature">Email Signature</Label>
                        <Textarea 
                          id="emailSignature" 
                          name="emailSignature" 
                          placeholder="Your signature that will appear on all emails" 
                          rows={4}
                          defaultValue={settings?.emailSignature || ''}
                        />
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        <h3 className="text-lg font-medium">Notification Preferences</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="notifyOnNewPolicy" className="text-base">New Policy Notifications</Label>
                            <p className="text-sm text-muted-foreground">Notify underwriters when a new policy is created</p>
                          </div>
                          <Switch 
                            id="notifyOnNewPolicy" 
                            name="notifyOnNewPolicy" 
                            defaultChecked={settings?.notifyOnNewPolicy || false}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="notifyOnClaim" className="text-base">Claim Notifications</Label>
                            <p className="text-sm text-muted-foreground">Notify managers when a new claim is submitted</p>
                          </div>
                          <Switch 
                            id="notifyOnClaim" 
                            name="notifyOnClaim" 
                            defaultChecked={settings?.notifyOnClaim || false}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={testConnectionMutation.isPending}
                  >
                    {testStatus === 'loading' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {testStatus === 'success' && (
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    )}
                    {testStatus === 'error' && (
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    )}
                    Test Connection
                  </Button>
                  <Button 
                    type="submit" 
                    form="settingsForm"
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Settings
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Email Server Status</CardTitle>
                  <CardDescription>
                    Current email service configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">SMTP Server</h3>
                      <p className="text-base">smtpout.secureserver.net</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Port</h3>
                      <p className="text-base">465 (SSL)</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">From Email</h3>
                      <p className="text-base">info@coversync.co.za</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Connection Status</h3>
                      <div className="flex items-center mt-1">
                        {testStatus === 'idle' && (
                          <p className="text-base text-muted-foreground">Not tested</p>
                        )}
                        {testStatus === 'loading' && (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin text-amber-500" />
                            <p className="text-base text-amber-500">Testing...</p>
                          </>
                        )}
                        {testStatus === 'success' && (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                            <p className="text-base text-green-500">Connected</p>
                          </>
                        )}
                        {testStatus === 'error' && (
                          <>
                            <XCircle className="h-5 w-5 mr-2 text-red-500" />
                            <p className="text-base text-red-500">Failed</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Label htmlFor="testEmail">Send Test Email To</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input 
                          id="testEmail" 
                          placeholder="your@email.com" 
                          value={testEmail} 
                          onChange={(e) => setTestEmail(e.target.value)}
                        />
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={handleTestConnection}
                          disabled={testConnectionMutation.isPending}
                          className="whitespace-nowrap"
                        >
                          {testStatus === 'loading' && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Test
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Enter an email address to receive a test message with your signature.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="signature">
            <EmailSignatureEditor 
              initialSignature={settings?.emailSignature || ''}
              onSave={(signatureHtml) => {
                // Update the signature when saved
                const updatedSettings = {
                  ...settings,
                  emailSignature: signatureHtml
                };
                updateSettingsMutation.mutate(updatedSettings);
              }}
            />
          </TabsContent>
          
          <TabsContent value="templates">
            <EmailTemplateEditor />
          </TabsContent>
          
          <TabsContent value="logs">
            <EmailLogsList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmailSettings;