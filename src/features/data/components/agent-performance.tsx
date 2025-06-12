import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent 
} from "@/features/data/components/ui/card";
import { Progress } from "@/features/data/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/features/data/components/ui/tabs";
import { useLocation } from "wouter";
import { 
  Calendar, 
  ChevronUp, 
  ChevronDown, 
  TrendingUp,
  Award, 
  Users, 
  BadgeCheck, 
  BarChart3,
  Percent,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the shapes of our data
interface AgentPerformanceData {
  id: number;
  agentId: number;
  year: number;
  month: number;
  policiesSold: number;
  renewalsRetained: number;
  totalPremium: number;
  totalCommission: number;
  renewalRate: number;
  targets: {
    salesTarget: number;
    premiumTarget: number;
    commissionTarget: number;
    renewalRateTarget: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AgentData {
  id?: number;
  firstName?: string;
  surname?: string;
  email?: string;
  phone?: string;
  status?: string;
  commissionRate?: number;
  totalPolicies?: number;
  totalCommission?: number;
  startDate?: string;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

interface AgentPerformanceProps {
  agentId?: number;
}

export function AgentPerformance({ agentId: propAgentId }: AgentPerformanceProps = {}) {
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Use provided agentId prop if available, otherwise extract from location
  // Use fallback of 0 if both are undefined or NaN
  const agentId = (propAgentId !== undefined && !isNaN(propAgentId)) ? 
    propAgentId : 
    parseInt(location.split('/').pop() || '0') || 0;
  
  // Get current date for default filters
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Query params for filtering
  const [filter, setFilter] = useState<{
    year: number;
    month?: number | null;
  }>({
    year: currentYear,
    month: null,
  });
  
  // Fetch agent's performance data
  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["/api/agents", agentId, "performance", filter],
    enabled: !!agentId && agentId > 0,
  });
  
  // Fetch agent data for the name
  const { data: agentData = {} } = useQuery({
    queryKey: ["/api/agents", agentId],
    enabled: !!agentId && agentId > 0,
  });
  
  // Transform performance data for charts
  const [chartsData, setChartsData] = useState<any[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState({
    policiesSold: 0,
    commissionEarned: 0,
    renewalRate: 0,
  });
  
  // Calculate yearly totals and prepare chart data
  useEffect(() => {
    if (performanceData && Array.isArray(performanceData) && performanceData.length > 0) {
      // Sort by month for charts
      const sortedData = [...performanceData].sort((a, b) => (a.month || 0) - (b.month || 0));
      
      // Format data for charts
      const formattedData = sortedData.map(record => ({
        name: monthNames[(record.month || 1) - 1],
        month: record.month || 0,
        policiesSold: record.policiesSold || 0,
        salesTarget: record.targets?.salesTarget || 0,
        commission: record.totalCommission || 0,
        commissionTarget: record.targets?.commissionTarget || 0,
        renewalRate: record.renewalRate || 0,
        renewalTarget: record.targets?.renewalRateTarget || 0,
        premium: record.totalPremium || 0,
        premiumTarget: record.targets?.premiumTarget || 0,
      }));
      
      setChartsData(formattedData);
      
      // Calculate yearly totals
      const totals = performanceData.reduce((acc, curr) => {
        return {
          policiesSold: acc.policiesSold + (curr.policiesSold || 0),
          commissionEarned: acc.commissionEarned + (curr.totalCommission || 0),
          renewalRate: acc.renewalRate + (curr.renewalRate || 0),
        };
      }, { policiesSold: 0, commissionEarned: 0, renewalRate: 0 });
      
      // Calculate average renewal rate
      totals.renewalRate = totals.renewalRate / performanceData.length || 0;
      
      setYearlyTotals(totals);
    } else {
      // Set empty charts data and zero totals if no performance data
      setChartsData([]);
      setYearlyTotals({ policiesSold: 0, commissionEarned: 0, renewalRate: 0 });
    }
  }, [performanceData]);
  
  // Get the most recent performance record for KPIs with default values
  const latestRecord = performanceData && Array.isArray(performanceData) && performanceData.length > 0
    ? {
        ...performanceData.sort((a, b) => {
          const dateA = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          const dateB = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          return dateA - dateB;
        })[0],
        // Provide defaults for all values to avoid undefined errors
        policiesSold: performanceData[0].policiesSold || 0,
        totalCommission: performanceData[0].totalCommission || 0,
        totalPremium: performanceData[0].totalPremium || 0,
        renewalRate: performanceData[0].renewalRate || 0,
        targets: {
          salesTarget: performanceData[0].targets?.salesTarget || 0,
          commissionTarget: performanceData[0].targets?.commissionTarget || 0,
          premiumTarget: performanceData[0].targets?.premiumTarget || 0,
          renewalRateTarget: performanceData[0].targets?.renewalRateTarget || 0
        }
      }
    : null;
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate performance percentages against targets
  const calculatePerformance = (actual: number, target: number) => {
    if (!target) return 0;
    const percentage = (actual / target) * 100;
    return Math.min(percentage, 100); // Cap at 100% for progress bars
  };
  
  // Status indicators for metrics
  const getStatusIndicator = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    
    if (percentage >= 100) {
      return <ChevronUp className="text-green-500 ml-1 h-5 w-5" />;
    } else if (percentage >= 80) {
      return <TrendingUp className="text-amber-500 ml-1 h-5 w-5" />;
    } else {
      return <ChevronDown className="text-red-500 ml-1 h-5 w-5" />;
    }
  };
  
  // Skeleton loader for KPI cards
  const SkeletonKpiCard = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="bg-gray-200 h-10 w-10 rounded-full" />
          <div className="bg-gray-200 h-6 w-16 rounded" />
        </div>
        <div className="mt-4">
          <div className="bg-gray-200 h-7 w-24 rounded mb-1" />
          <div className="bg-gray-200 h-4 w-32 rounded" />
        </div>
        <div className="mt-4">
          <div className="bg-gray-200 h-2 w-full rounded" />
        </div>
      </CardContent>
    </Card>
  );
  
  // If no agent is selected, show instruction message
  if (!agentId || agentId === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Users className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No Agent Selected</h3>
        <p className="text-gray-500 mt-2">
          Please select an agent from the list to view their performance data.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Agent Performance Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {agentData?.firstName && agentData?.surname 
              ? `${agentData.firstName} ${agentData.surname}'s Performance` 
              : 'Agent Performance'}
          </h2>
          <p className="text-gray-500">
            <Calendar className="h-4 w-4 inline mr-1" />
            {filter.month ? `${monthNames[filter.month - 1]} ${filter.year}` : `${filter.year} Overview`}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <select
            className="px-3 py-1 border rounded-md text-sm"
            value={filter.year}
            onChange={(e) => setFilter({...filter, year: parseInt(e.target.value)})}
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
          
          <select 
            className="px-3 py-1 border rounded-md text-sm"
            value={filter.month || ''}
            onChange={(e) => setFilter({
              ...filter, 
              month: e.target.value ? parseInt(e.target.value) : null
            })}
          >
            <option value="">All Months</option>
            {monthNames.map((month, idx) => (
              <option key={idx} value={idx + 1}>{month}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingPerformance ? (
          <>
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
          </>
        ) : latestRecord ? (
          <>
            {/* Policies Sold KPI */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {latestRecord.policiesSold} / {latestRecord.targets?.salesTarget || 0}
                    </span>
                    {getStatusIndicator(
                      latestRecord.policiesSold, 
                      latestRecord.targets?.salesTarget || 0
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold">{latestRecord.policiesSold}</h3>
                  <p className="text-sm text-gray-600">Policies Sold</p>
                </div>
                <div className="mt-4">
                  <Progress 
                    value={calculatePerformance(
                      latestRecord.policiesSold, 
                      latestRecord.targets?.salesTarget || 0
                    )} 
                    className="h-1.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePerformance(
                      latestRecord.policiesSold, 
                      latestRecord.targets?.salesTarget || 0
                    ).toFixed(0)}% of monthly target
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Commission KPI */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {formatCurrency(latestRecord.totalCommission).replace('R', '')} / 
                      {formatCurrency(latestRecord.targets?.commissionTarget || 0).replace('R', '')}
                    </span>
                    {getStatusIndicator(
                      latestRecord.totalCommission, 
                      latestRecord.targets?.commissionTarget || 0
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold">{formatCurrency(latestRecord.totalCommission)}</h3>
                  <p className="text-sm text-gray-600">Commission Earned</p>
                </div>
                <div className="mt-4">
                  <Progress 
                    value={calculatePerformance(
                      latestRecord.totalCommission, 
                      latestRecord.targets?.commissionTarget || 0
                    )} 
                    className="h-1.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePerformance(
                      latestRecord.totalCommission, 
                      latestRecord.targets?.commissionTarget || 0
                    ).toFixed(0)}% of monthly target
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Premium KPI */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {formatCurrency(latestRecord.totalPremium).replace('R', '')} / 
                      {formatCurrency(latestRecord.targets?.premiumTarget || 0).replace('R', '')}
                    </span>
                    {getStatusIndicator(
                      latestRecord.totalPremium, 
                      latestRecord.targets?.premiumTarget || 0
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold">{formatCurrency(latestRecord.totalPremium)}</h3>
                  <p className="text-sm text-gray-600">Premium Value</p>
                </div>
                <div className="mt-4">
                  <Progress 
                    value={calculatePerformance(
                      latestRecord.totalPremium, 
                      latestRecord.targets?.premiumTarget || 0
                    )} 
                    className="h-1.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePerformance(
                      latestRecord.totalPremium, 
                      latestRecord.targets?.premiumTarget || 0
                    ).toFixed(0)}% of monthly target
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Renewal Rate KPI */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">
                      {latestRecord.renewalRate.toFixed(1)}% / 
                      {latestRecord.targets?.renewalRateTarget?.toFixed(1) || 0}%
                    </span>
                    {getStatusIndicator(
                      latestRecord.renewalRate, 
                      latestRecord.targets?.renewalRateTarget || 0
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-bold">{latestRecord.renewalRate.toFixed(1)}%</h3>
                  <p className="text-sm text-gray-600">Renewal Rate</p>
                </div>
                <div className="mt-4">
                  <Progress 
                    value={calculatePerformance(
                      latestRecord.renewalRate, 
                      latestRecord.targets?.renewalRateTarget || 0
                    )} 
                    className="h-1.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePerformance(
                      latestRecord.renewalRate, 
                      latestRecord.targets?.renewalRateTarget || 0
                    ).toFixed(0)}% of monthly target
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="col-span-4 p-6 text-center">
            <Award className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-700">No Performance Data</h3>
            <p className="text-gray-500 mt-1 max-w-md mx-auto">
              There is no performance data available for this agent in the selected time period.
            </p>
          </div>
        )}
      </div>
      
      {/* Charts and Analysis */}
      {chartsData.length > 0 && (
        <Tabs 
          value={selectedTab} 
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Performance</TabsTrigger>
            <TabsTrigger value="commissions">Commission Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Policies vs Target Chart */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Policies Sold vs Target</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="policiesSold" name="Policies Sold" fill="#3b82f6" />
                        <Bar dataKey="salesTarget" name="Target" fill="#93c5fd" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Commission vs Target Chart */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Commission vs Target</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="commission" 
                          name="Commission" 
                          stroke="#10b981" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="commissionTarget" 
                          name="Target" 
                          stroke="#6ee7b7" 
                          strokeDasharray="5 5" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="sales" className="pt-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Sales Over Time */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Sales Performance Over Time</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="policiesSold" 
                          name="Policies Sold" 
                          stroke="#3b82f6" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="premium" 
                          name="Premium Value (R)" 
                          stroke="#8b5cf6" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Renewal Rate Chart */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Renewal Rate (%)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="renewalRate" 
                          name="Renewal Rate" 
                          stroke="#f59e0b" 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="renewalTarget" 
                          name="Target" 
                          stroke="#fcd34d" 
                          strokeDasharray="5 5" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="commissions" className="pt-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Commission Comparison */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Commission vs Premium</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="commission" name="Commission" fill="#10b981" />
                        <Bar dataKey="premium" name="Premium" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Year Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                      <BadgeCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {yearlyTotals.policiesSold}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Policies Sold This Year
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {formatCurrency(yearlyTotals.commissionEarned)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Total Commission
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                      <Percent className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {yearlyTotals.renewalRate.toFixed(1)}%
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Average Renewal Rate
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default AgentPerformance;