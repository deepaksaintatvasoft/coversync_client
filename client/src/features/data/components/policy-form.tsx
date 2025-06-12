import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { insertPolicySchema } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/features/data/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/data/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/data/components/ui/form";
import { Input } from "@/features/data/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/data/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/data/components/ui/popover";
import { Calendar } from "@/features/data/components/ui/calendar";
import { cn } from "@/utils";

// Extend the insertPolicySchema for the form
const formSchema = insertPolicySchema.extend({
  startDate: z.date(),
  endDate: z.date(),
  // Make renewalDate optional and allow null
  renewalDate: z.date().optional().nullable(),
  premium: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().positive()
  ),
});

type PolicyFormValues = z.infer<typeof formSchema>;

type PolicyFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PolicyFormValues) => void;
  defaultValues?: Partial<PolicyFormValues>;
  isNew?: boolean;
};

export function PolicyForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isNew = true,
}: PolicyFormProps) {
  const [isPending, setIsPending] = useState(false);
  
  // Process the renewalDate to handle null values
  const processRenewalDate = () => {
    if (!defaultValues?.renewalDate) return undefined;
    if (defaultValues.renewalDate === null) return null;
    return new Date(defaultValues.renewalDate);
  };
  
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      policyNumber: defaultValues?.policyNumber || "",
      clientId: defaultValues?.clientId,
      policyTypeId: defaultValues?.policyTypeId,
      status: defaultValues?.status || "active",
      premium: defaultValues?.premium || 170,
      frequency: defaultValues?.frequency || "monthly",
      startDate: defaultValues?.startDate ? new Date(defaultValues.startDate) : new Date(),
      endDate: defaultValues?.endDate 
        ? new Date(defaultValues.endDate) 
        : (() => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            return date;
          })(),
      renewalDate: processRenewalDate(),
    },
  });
  
  // Fetch clients and policy types
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });
  
  const { data: policyTypes = [], isLoading: isLoadingPolicyTypes } = useQuery<any[]>({
    queryKey: ["/api/policy-types"],
  });
  
  const handleSubmit = async (data: PolicyFormValues) => {
    try {
      setIsPending(true);
      await onSubmit(data);
      setIsPending(false);
      onOpenChange(false);
    } catch (error) {
      setIsPending(false);
      console.error("Error submitting form:", error);
    }
  };
  
  const title = isNew ? "New Policy" : "Edit Policy";
  const description = isNew 
    ? "Create a new policy for a client." 
    : "Edit the policy details.";
  const submitLabel = isNew ? "Create Policy" : "Save Changes";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. POL-1234"
                        {...field}
                        disabled={!isNew} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      disabled={isLoadingClients}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.filter(client => client && client.id && client.name).map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
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
                name="policyTypeId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Funeral Cover Plan</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-3">
                        {policyTypes?.filter(type => type && type.id && type.name).map((type: any) => (
                          <label
                            key={type.id}
                            className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-colors ${
                              field.value === type.id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="radio"
                              className="h-5 w-5 text-primary"
                              checked={field.value === type.id}
                              onChange={() => field.onChange(type.id)}
                              disabled={isLoadingPolicyTypes}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{type.name}</span>
                              <span className="text-sm text-gray-500">
                                {type.description || "No description available"}
                              </span>
                              <span className="text-sm font-medium text-primary-700">
                                Up to R{(type.coverageAmount || 0).toLocaleString()} coverage
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="premium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Amount (ZAR)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        placeholder="e.g. 1500.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="renewalDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Renewal Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value instanceof Date ? field.value : undefined}
                          onSelect={(date) => field.onChange(date || null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
