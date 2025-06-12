import { useState } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";
import { PolicySignupForm } from "@/features/data/components/policy-signup-form-fixed";
import { Button } from "@/features/data/components/ui/button";
import Sidebar from "@/features/data/components/sidebar";
import TopBar from "@/features/data/components/topbar";
import { useToast } from "@/hooks/use-toast";

export default function PolicySignupFixedPage() {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mock user data - in a real app this would come from authentication
  const user = {
    name: "Sarah Johnson",
    role: "Policy Administrator",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        onLogout={() => toast({ title: "Logging out...", description: "This would log you out in a real app" })}
      />
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top bar */}
        <TopBar
          user={user}
          onMobileMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="p-4 md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
              <Link href="/policies">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Policies
              </Link>
            </Button>
            
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-primary mr-2" />
              <h1 className="text-xl font-semibold text-gray-800">New Policy Application</h1>
            </div>
          </div>
          
          <PolicySignupForm />
        </div>
      </main>
    </div>
  );
}