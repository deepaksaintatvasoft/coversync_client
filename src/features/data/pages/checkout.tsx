// Use checkout.tsx for one-time payments.
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/services/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/features/data/components/sidebar";
import TopBar from "@/features/data/components/topbar";
import { Shield } from "lucide-react";
import { Button } from "@/features/data/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/data/components/ui/card";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" className="w-full" disabled={!stripe || isLoading}>
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    setIsLoading(true);
    
    apiRequest("POST", "/api/create-payment-intent", { 
      amount: 289.99 // Replace with actual amount from your application
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching payment intent:', err);
        setIsLoading(false);
      });
  }, []);

  // Mock user data - in a real app this would come from auth context
  const mockUser = {
    name: "Sarah Johnson",
    role: "Policy Administrator",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  };

  if (!clientSecret && isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={mockUser}
        onLogout={() => console.log("Logout clicked")}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          user={mockUser}
          onMobileMenuClick={() => {}}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-gray-800">Secure Payment</h1>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Payment</CardTitle>
                <CardDescription>
                  Secure payment processing by Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientSecret ? (
                  // Make SURE to wrap the form in <Elements> which provides the stripe context.
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm />
                  </Elements>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-red-500">
                      Unable to initialize payment. Please try again later or contact support.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};