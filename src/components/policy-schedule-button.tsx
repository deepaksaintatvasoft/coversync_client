import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Printer, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PolicyScheduleButtonProps {
  policyId: number;
  policyNumber: string;
}

export function PolicyScheduleButton({ policyId, policyNumber }: PolicyScheduleButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePreview = () => {
    // Open the preview in a new tab
    window.open(`/api/policies/${policyId}/schedule/preview`, "_blank");
    setOpen(false);
  };

  const handlePrintVersion = () => {
    try {
      // Open the preview in a new tab with print styling
      const printWindow = window.open(`/api/policies/${policyId}/schedule/preview`, "_blank");
      
      // Add script to auto-trigger print dialog when content loads
      if (printWindow) {
        printWindow.onload = function() {
          printWindow.print();
        };
      }
      
      toast({
        title: "Print Version Opened",
        description: `Policy schedule for ${policyNumber} is ready to print. Use your browser's print function to save as PDF.`,
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: "Operation failed",
        description: "There was an error opening the print version. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Policy Schedule</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Policy Schedule</DialogTitle>
          <DialogDescription>
            View or print the policy schedule for policy {policyNumber}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={handlePreview}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </Button>
          <Button
            onClick={handlePrintVersion}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Printer className="h-4 w-4" />
            <span>{loading ? "Opening..." : "Print Version"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}