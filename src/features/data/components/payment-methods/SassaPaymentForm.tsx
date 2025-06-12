import { Info } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/features/data/components/ui/form";
import { Input } from "@/features/data/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface SassaPaymentFormProps {
  form: UseFormReturn<any>;
}

export function SassaPaymentForm({ form }: SassaPaymentFormProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="sassaNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SASSA Grant Number</FormLabel>
            <FormControl>
              <Input placeholder="Enter your 12-digit SASSA number" {...field} />
            </FormControl>
            <FormDescription className="text-xs">
              Your 12-digit SASSA grant reference number
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 text-sm">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Info className="h-4 w-4 mr-2 text-blue-500" />
          SASSA Payment Information
        </h4>
        <ul className="space-y-1 text-blue-700 text-xs sm:text-sm">
          <li>Premiums will be deducted directly from your SASSA grant payment</li>
          <li>The deduction will occur on your regular grant payment date</li>
          <li>Please ensure you maintain an active SASSA grant status</li>
        </ul>
      </div>
    </div>
  );
}