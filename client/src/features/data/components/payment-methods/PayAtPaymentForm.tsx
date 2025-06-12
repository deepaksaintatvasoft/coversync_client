import { Info } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/features/data/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/features/data/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface PayAtPaymentFormProps {
  form: UseFormReturn<any>;
}

export function PayAtPaymentForm({ form }: PayAtPaymentFormProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="preferredStore"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred Store for Payment</FormLabel>
            <Select 
              onValueChange={field.onChange}
              defaultValue=""
              value={field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select Store" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="shoprite">Shoprite</SelectItem>
                <SelectItem value="checkers">Checkers</SelectItem>
                <SelectItem value="picknpay">Pick n Pay</SelectItem>
                <SelectItem value="boxer">Boxer</SelectItem>
                <SelectItem value="usave">Usave</SelectItem>
                <SelectItem value="other">Other Store</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              Where you prefer to make your monthly payments
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 text-sm">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Info className="h-4 w-4 mr-2 text-blue-500" />
          Pay@ Payment Information
        </h4>
        <ul className="space-y-1 text-blue-700 text-xs sm:text-sm">
          <li>You'll receive a monthly payment notification via SMS</li>
          <li>Take the SMS to any store where Pay@ is accepted</li>
          <li>Payments must be made by the 7th of each month</li>
          <li>You'll receive a payment confirmation SMS after each payment</li>
        </ul>
      </div>
    </div>
  );
}