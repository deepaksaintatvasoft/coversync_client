import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/services/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/features/data/components/ui/card';
import { Button } from '@/features/data/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/features/data/components/ui/select';
import { Input } from '@/features/data/components/ui/input';
import { Loader2, Mail } from 'lucide-react';

export default function TestUnderwriterEmail() {
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Fetch all claims
  const { data: claims, isLoading } = useQuery({
    queryKey: ['/api/claims'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/claims');
      return response.json();
    },
  });

  const sendToUnderwriter = async () => {
    if (!selectedClaimId) {
      toast({
        title: 'Error',
        description: 'Please select a claim to send',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await apiRequest('POST', '/api/email/send-claim-to-underwriter', {
        claimId: selectedClaimId,
        recipientEmail: recipientEmail || undefined, // Send undefined to use the default from settings
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Claim sent to underwriter successfully',
          variant: 'default',
        });
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while sending the email',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test Underwriter Email</CardTitle>
          <CardDescription>
            Select a claim and send it to an underwriter for review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Claim</label>
            <Select value={selectedClaimId?.toString()} onValueChange={(value) => setSelectedClaimId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a claim to send" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="p-2 text-center">Loading claims...</div>
                ) : (
                  claims?.map((claim: any) => (
                    <SelectItem key={claim.id} value={claim.id.toString()}>
                      {claim.claimNumber} - {claim.client?.name || 'Unknown Client'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Recipient Email (Optional - will use the default underwriter email from settings if left blank)
            </label>
            <Input
              type="email"
              placeholder="Enter recipient email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <Button 
            onClick={sendToUnderwriter} 
            disabled={isSending || !selectedClaimId}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send to Underwriter
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}