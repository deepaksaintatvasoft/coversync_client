import { Info } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface BankPaymentFormProps {
  form: UseFormReturn<any>;
  clientName?: string;
}

export function BankPaymentForm({ form, clientName }: BankPaymentFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Name</FormLabel>
              <Select 
                onValueChange={field.onChange}
                defaultValue=""
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Bank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="absa">ABSA</SelectItem>
                  <SelectItem value="fnb">First National Bank</SelectItem>
                  <SelectItem value="standardbank">Standard Bank</SelectItem>
                  <SelectItem value="nedbank">Nedbank</SelectItem>
                  <SelectItem value="capitec">Capitec</SelectItem>
                  <SelectItem value="africanbank">African Bank</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select 
                onValueChange={field.onChange}
                defaultValue=""
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Account Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="cheque">Cheque / Current</SelectItem>
                  <SelectItem value="transmission">Transmission</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="branchCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 250655" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="accountHolderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Holder Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. John Doe" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="debitDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Debit Order Date</FormLabel>
              <Select 
                onValueChange={field.onChange}
                defaultValue=""
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Debit Date" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1st of the month</SelectItem>
                  <SelectItem value="15">15th of the month</SelectItem>
                  <SelectItem value="25">25th of the month</SelectItem>
                  <SelectItem value="30">Last day of the month</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="p-3 sm:p-4 bg-blue-50 rounded-md border border-blue-200 text-sm">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Info className="h-4 w-4 mr-2 text-blue-500" />
          Bank Account Information
        </h4>
        <ul className="space-y-1 text-blue-700 text-xs sm:text-sm">
          <li>Your first debit order will be processed on the selected date of the next month</li>
          <li>The account holder name should match the ID holder or provide authorization</li>
          <li>If you're unsure about your branch code, please contact your bank</li>
        </ul>
      </div>
    </div>
  );
}