import { UseFormReturn } from "react-hook-form";
import { BankPaymentForm } from "./BankPaymentForm";
import { SassaPaymentForm } from "./SassaPaymentForm";
import { PayAtPaymentForm } from "./PayAtPaymentForm";
import { useState, useEffect } from "react";

interface PaymentMethodFormProps {
  form: UseFormReturn<any>;
  clientName?: string;
}

export function PaymentMethodForm({ form, clientName }: PaymentMethodFormProps) {
  // Create a single state to track the payment method
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Set up the form watcher only once during mount
  useEffect(() => {
    // Get the initial value
    const initialValue = form.getValues().paymentMethod || "";
    setPaymentMethod(initialValue);
    
    // Set up subscription to watch for changes
    const subscription = form.watch((value) => {
      if (value.paymentMethod !== undefined) {
        setPaymentMethod(value.paymentMethod);
      }
    });
    
    // Clean up the subscription when component unmounts
    return () => subscription.unsubscribe();
  }, [form]);

  // Always render all forms, but only show the selected one
  // This ensures hooks are always called in the same order
  return (
    <>
      <div className={paymentMethod === "bank" ? "block" : "hidden"}>
        <BankPaymentForm form={form} clientName={clientName} />
      </div>
      
      <div className={paymentMethod === "sassa" ? "block" : "hidden"}>
        <SassaPaymentForm form={form} />
      </div>
      
      <div className={paymentMethod === "pay@" ? "block" : "hidden"}>
        <PayAtPaymentForm form={form} />
      </div>
    </>
  );
}