import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, User, Timer, DollarSign, Plus, CalendarDays, 
  ClipboardCheck, UserPlus, Search, BellRing, BarChart,
  Upload, Download
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { TrendChart } from "@/components/trend-chart";
import { PolicyDistribution } from "@/components/policy-distribution";
import { PoliciesTable } from "@/components/policies-table";
import { UpcomingRenewals } from "@/components/upcoming-renewals";
import { Button } from "@/components/ui/button";
import { PolicyForm } from "@/components/policy-form";
import { PolicyDetailsDialog } from "@/components/policy-details-dialog";

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNewPolicyForm, setShowNewPolicyForm] = useState(false);
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const { toast } = useToast();

  // Mock data for demonstration
  const dashboardStats = {
    totalPolicies: 0,
    activeClaims: 0,
    totalClients: 0,
    monthlyPremiums: 0
  };

  const chartData = [
    { name: "Jan", premiums: 0, claims: 0 },
    { name: "Feb", premiums: 0, claims: 0 },
    { name: "Mar", premiums: 0, claims: 0 },
    { name: "Apr", premiums: 0, claims: 0 },
    { name: "May", premiums: 0, claims: 0 },
    { name: "Jun", premiums: 0, claims: 0 }
  ];

  const policyTypeData = [
    { name: "Life Insurance", value: 0, color: "#3b82f6", percentage: 0 },
    { name: "Health Insurance", value: 0, color: "#10b981", percentage: 0 },
    { name: "Auto Insurance", value: 0, color: "#f59e0b", percentage: 0 },
    { name: "Home Insurance", value: 0, color: "#ef4444", percentage: 0 }
  ];

  const handleCreatePolicy = (data: any) => {
    toast({
      title: "Policy Created",
      description: "New policy has been created successfully.",
    });
    setShowNewPolicyForm(false);
  };

  const handleViewPolicy = (policy: any) => {
    setSelectedPolicy(policy);
    setShowPolicyDetails(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        user={{ name: "Admin User", role: "Administrator" }}
        onLogout={() => console.log("Logout")}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          user={{ name: "Admin User" }}
          onMobileMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your policies.</p>
              </div>
              <Button onClick={() => setShowNewPolicyForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Policy
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Policies"
                value={dashboardStats.totalPolicies}
                icon={<FileText className="h-6 w-6" />}
                iconColor="text-blue-600"
              />
              <StatCard
                title="Active Claims"
                value={dashboardStats.activeClaims}
                icon={<ClipboardCheck className="h-6 w-6" />}
                iconColor="text-orange-600"
              />
              <StatCard
                title="Total Clients"
                value={dashboardStats.totalClients}
                icon={<User className="h-6 w-6" />}
                iconColor="text-green-600"
              />
              <StatCard
                title="Monthly Premiums"
                value={`R${dashboardStats.monthlyPremiums.toLocaleString()}`}
                icon={<DollarSign className="h-6 w-6" />}
                iconColor="text-purple-600"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <TrendChart
                title="Premium & Claims Trends"
                data={chartData}
                dataKeys={["premiums", "claims"]}
                colors={["#3b82f6", "#ef4444"]}
                stats={[
                  { label: "Total Premiums", value: "R0" },
                  { label: "Total Claims", value: "R0" }
                ]}
              />
              <PolicyDistribution
                title="Policy Distribution"
                data={policyTypeData}
              />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PoliciesTable
                title="Recent Policies"
                policies={[]}
                isLoading={false}
                onView={handleViewPolicy}
                limit={5}
                viewAllHref="/policies"
              />
              <UpcomingRenewals
                renewals={[]}
                isLoading={false}
                viewAllHref="/policies?filter=renewal"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <PolicyForm
        open={showNewPolicyForm}
        onOpenChange={setShowNewPolicyForm}
        onSubmit={handleCreatePolicy}
        isNew={true}
      />
      
      <PolicyDetailsDialog
        policy={selectedPolicy}
        open={showPolicyDetails}
        onOpenChange={setShowPolicyDetails}
      />
    </div>
  );
}