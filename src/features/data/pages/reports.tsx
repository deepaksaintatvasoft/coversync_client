import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/features/data/components/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/data/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/data/components/ui/table";
import { Button } from "@/features/data/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/data/components/ui/tabs";
import { Download, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/data/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Sample colors for chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const RADIAN = Math.PI / 180;

export default function Reports() {
  const [reportType, setReportType] = useState("policies");
  const [timeframe, setTimeframe] = useState("month");
  const [filterType, setFilterType] = useState("all");

  // Sample mock data for policies by type
  const policyData = [
    { name: 'Family Plan', value: 65 },
    { name: 'Pensioner Plan', value: 35 },
  ];

  // Sample mock data for claims by status
  const claimData = [
    { name: 'Pending', value: 15 },
    { name: 'In Review', value: 10 },
    { name: 'Approved', value: 25 },
    { name: 'Paid', value: 40 },
    { name: 'Rejected', value: 10 },
  ];

  // Sample monthly data
  const monthlyData = [
    { month: 'Jan', policies: 12, claims: 3, premiums: 25000 },
    { month: 'Feb', policies: 19, claims: 5, premiums: 31000 },
    { month: 'Mar', policies: 15, claims: 4, premiums: 28000 },
    { month: 'Apr', policies: 21, claims: 6, premiums: 35000 },
    { month: 'May', policies: 18, claims: 7, premiums: 32000 },
    { month: 'Jun', policies: 23, claims: 9, premiums: 38000 },
  ];

  // Custom label for pie charts
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent, 
    index, 
    name 
  }: { 
    cx: number; 
    cy: number; 
    midAngle: number; 
    innerRadius: number; 
    outerRadius: number; 
    percent: number; 
    index: number; 
    name: string;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Mock user for sidebar
  const mockUser = {
    name: "Sarah Johnson",
    role: "Super Admin",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={mockUser}
        onLogout={() => console.log("Logout clicked")}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Reports</h1>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Select
                    value={reportType}
                    onValueChange={setReportType}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policies">Policy Reports</SelectItem>
                      <SelectItem value="claims">Claim Reports</SelectItem>
                      <SelectItem value="financial">Financial Reports</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={timeframe}
                    onValueChange={setTimeframe}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterType}
                    onValueChange={setFilterType}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="family">Family Plan</SelectItem>
                      <SelectItem value="pensioner">Pensioner Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Type</CardTitle>
                <CardDescription>
                  {reportType === "policies" ? "Policy distribution by type" : "Claim distribution by status"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportType === "policies" ? policyData : claimData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(reportType === "policies" ? policyData : claimData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>
                  {reportType === "policies" 
                    ? "New policies issued per month" 
                    : reportType === "claims" 
                      ? "Claims processed per month"
                      : "Premium revenue per month"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {reportType === "policies" && <Bar dataKey="policies" fill="#8884d8" name="Policies" />}
                    {reportType === "claims" && <Bar dataKey="claims" fill="#82ca9d" name="Claims" />}
                    {reportType === "financial" && <Bar dataKey="premiums" fill="#ffc658" name="Premiums (ZAR)" />}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Report</CardTitle>
              <CardDescription>
                {timeframe === "month" ? "Current month" : timeframe === "week" ? "Current week" : timeframe === "quarter" ? "Current quarter" : "Current year"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>{reportType === "policies" ? "Policy Number" : reportType === "claims" ? "Claim Number" : "Transaction ID"}</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>{reportType === "policies" ? "Type" : reportType === "claims" ? "Status" : "Amount"}</TableHead>
                    <TableHead className="text-right">{reportType === "policies" ? "Premium" : reportType === "claims" ? "Amount" : "Type"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportType === "policies" ? (
                    <>
                      <TableRow>
                        <TableCell>2025-03-15</TableCell>
                        <TableCell>POL-1237</TableCell>
                        <TableCell>John Dlamini</TableCell>
                        <TableCell>Family Plan</TableCell>
                        <TableCell className="text-right">R 350.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2025-03-10</TableCell>
                        <TableCell>POL-1236</TableCell>
                        <TableCell>Sarah Ndlovu</TableCell>
                        <TableCell>Pensioner Plan</TableCell>
                        <TableCell className="text-right">R 250.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2025-03-05</TableCell>
                        <TableCell>POL-1235</TableCell>
                        <TableCell>Michael Khumalo</TableCell>
                        <TableCell>Family Plan</TableCell>
                        <TableCell className="text-right">R 350.00</TableCell>
                      </TableRow>
                    </>
                  ) : reportType === "claims" ? (
                    <>
                      <TableRow>
                        <TableCell>2025-03-18</TableCell>
                        <TableCell>CLM-042</TableCell>
                        <TableCell>Peter Zulu</TableCell>
                        <TableCell>Approved</TableCell>
                        <TableCell className="text-right">R 15,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2025-03-12</TableCell>
                        <TableCell>CLM-041</TableCell>
                        <TableCell>Thandi Mkhize</TableCell>
                        <TableCell>In Review</TableCell>
                        <TableCell className="text-right">R 20,000.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2025-03-05</TableCell>
                        <TableCell>CLM-040</TableCell>
                        <TableCell>David Nkosi</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell className="text-right">R 12,000.00</TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <>
                      <TableRow>
                        <TableCell>2025-03-20</TableCell>
                        <TableCell>TRX-198</TableCell>
                        <TableCell>Multiple</TableCell>
                        <TableCell>R 15,350.00</TableCell>
                        <TableCell className="text-right">Premium Collection</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2025-03-15</TableCell>
                        <TableCell>TRX-197</TableCell>
                        <TableCell>David Nkosi</TableCell>
                        <TableCell>R 12,000.00</TableCell>
                        <TableCell className="text-right">Claim Payout</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2025-03-10</TableCell>
                        <TableCell>TRX-196</TableCell>
                        <TableCell>Multiple</TableCell>
                        <TableCell>R 22,500.00</TableCell>
                        <TableCell className="text-right">Premium Collection</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}