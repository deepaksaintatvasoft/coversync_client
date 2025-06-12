import React, { useState } from 'react';
import { Button } from '@/features/data/components/ui/button';
import { Input } from '@/features/data/components/ui/input';
import { Label } from '@/features/data/components/ui/label';
import { Textarea } from '@/features/data/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/features/data/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/features/data/components/ui/tabs';
import { EmailSignatureTemplate, generateSignatureHtml } from './email-signature-template';

interface EmailSignatureEditorProps {
  initialSignature?: string;
  onSave?: (signatureHtml: string) => void;
}

const EmailSignatureEditor: React.FC<EmailSignatureEditorProps> = ({
  initialSignature = '',
  onSave
}) => {
  const [tab, setTab] = useState<string>('visual');
  const [signatureData, setSignatureData] = useState({
    name: "CoverSync Team",
    title: "Funeral Policy Specialists",
    phone: "+27 (0) 21 555 1234",
    email: "info@coversync.co.za"
  });
  const [customHtml, setCustomHtml] = useState(initialSignature || generateSignatureHtml(signatureData));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSignatureData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    const signatureHtml = tab === 'visual' 
      ? generateSignatureHtml(signatureData)
      : customHtml;
    
    if (onSave) {
      onSave(signatureHtml);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Signature</CardTitle>
        <CardDescription>
          Create a professional signature for all outgoing emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visual" value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="visual">Visual Editor</TabsTrigger>
            <TabsTrigger value="html">HTML Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visual" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={signatureData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="title">Title/Position</Label>
                <Input
                  id="title"
                  name="title"
                  value={signatureData.title}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={signatureData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  value={signatureData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="html">
            <div className="space-y-4">
              <Label htmlFor="customHtml">HTML Code</Label>
              <Textarea
                id="customHtml"
                className="font-mono h-[300px]"
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Edit the HTML directly for advanced customization.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Preview:</h3>
              {tab === 'visual' ? (
                <EmailSignatureTemplate {...signatureData} />
              ) : (
                <div 
                  className="border rounded-md p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: customHtml }} 
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave}>
            Save Signature
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailSignatureEditor;