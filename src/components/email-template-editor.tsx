import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Plus, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EmailTemplateEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'policy',
  });
  
  // Get email templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/email/templates'],
    refetchOnWindowFocus: false,
  });
  
  // Get selected template details
  const { data: templateDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/api/email/templates', selectedTemplate],
    enabled: selectedTemplate !== null,
    refetchOnWindowFocus: false,
  });
  
  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (template: any) => {
      return apiRequest('POST', '/api/email/templates', template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/templates'] });
      setIsCreating(false);
      setNewTemplate({
        name: '',
        subject: '',
        body: '',
        type: 'policy',
      });
      toast({
        title: 'Template Created',
        description: 'Email template has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, template }: { id: number, template: any }) => {
      return apiRequest('PUT', `/api/email/templates/${id}`, template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email/templates', selectedTemplate] });
      toast({
        title: 'Template Updated',
        description: 'Email template has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/email/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/templates'] });
      setSelectedTemplate(null);
      toast({
        title: 'Template Deleted',
        description: 'Email template has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplateMutation.mutate(newTemplate);
  };
  
  const handleUpdateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const updatedTemplate = {
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      body: formData.get('body') as string,
      type: formData.get('type') as string,
    };
    
    updateTemplateMutation.mutate({
      id: selectedTemplate,
      template: updatedTemplate,
    });
  };
  
  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(Number(id));
  };
  
  const handleDeleteTemplate = () => {
    if (selectedTemplate) {
      deleteTemplateMutation.mutate(selectedTemplate);
    }
  };
  
  const templateTypeOptions = [
    { value: 'policy', label: 'Policy' },
    { value: 'claim', label: 'Claim' },
    { value: 'payment', label: 'Payment' },
    { value: 'notification', label: 'Notification' },
    { value: 'other', label: 'Other' },
  ];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Email Template</DialogTitle>
              <DialogDescription>
                Create a new template for system emails.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTemplate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Template Name</Label>
                  <Input
                    id="new-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="e.g., Policy Approval"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-type">Template Type</Label>
                  <Select 
                    value={newTemplate.type} 
                    onValueChange={(value) => setNewTemplate({...newTemplate, type: value})}
                    required
                  >
                    <SelectTrigger id="new-type">
                      <SelectValue placeholder="Select template type" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-subject">Email Subject</Label>
                  <Input
                    id="new-subject"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                    placeholder="e.g., Your policy has been approved"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-body">Email Body</Label>
                  <Textarea
                    id="new-body"
                    value={newTemplate.body}
                    onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})}
                    placeholder="Enter the email content..."
                    rows={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    You can use placeholders like {'{client_name}'}, {'{policy_number}'}, etc.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Template
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Select a template to edit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates && templates.length > 0 ? (
              <div className="space-y-2">
                {templates.map((template: any) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-muted ${
                      selectedTemplate === template.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">{template.type}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No templates found. Create one to get started.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          {selectedTemplate && templateDetails ? (
            <>
              <CardHeader>
                <CardTitle>Edit Template</CardTitle>
                <CardDescription>
                  Modify the selected email template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="updateTemplateForm" onSubmit={handleUpdateTemplate}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={templateDetails.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Template Type</Label>
                      <Select 
                        defaultValue={templateDetails.type} 
                        name="type"
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                        <SelectContent>
                          {templateTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Email Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        defaultValue={templateDetails.subject}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Email Body</Label>
                      <Textarea
                        id="body"
                        name="body"
                        defaultValue={templateDetails.body}
                        rows={12}
                        required
                      />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Available placeholders:</p>
                        <ul className="list-disc list-inside pl-2">
                          <li>{'{client_name}'} - Client's full name</li>
                          <li>{'{policy_number}'} - Policy reference number</li>
                          <li>{'{policy_type}'} - Type of policy</li>
                          <li>{'{premium_amount}'} - Premium amount</li>
                          <li>{'{effective_date}'} - Policy effective date</li>
                          <li>{'{agent_name}'} - Agent's name</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteTemplate}
                  disabled={deleteTemplateMutation.isPending}
                >
                  {deleteTemplateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  type="submit"
                  form="updateTemplateForm"
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </CardFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-center p-6">
              <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
              <p className="text-muted-foreground mb-6">
                Select a template from the list or create a new one to start editing.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Template
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;