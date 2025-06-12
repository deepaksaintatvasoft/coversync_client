import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Plus, 
  Search, 
  UserCheck,
  UserX,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowLeft,
  DollarSign
} from "lucide-react";

import TopBar from "@/features/data/components/topbar";
import Sidebar from "@/features/data/components/sidebar";
import { Button } from "@/features/data/components/ui/button";
import AgentPerformance from "@/features/data/components/agent-performance";
import { Input } from "@/features/data/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/features/data/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/data/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/data/components/ui/dropdown-menu";
import { Badge } from "@/features/data/components/ui/badge";
import { Skeleton } from "@/features/data/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/data/components/ui/tabs";
import { format } from "date-fns";

type Agent = {
  id: number;
  firstName: string;
  surname: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  commissionRate: number;
  totalPolicies: number;
  totalCommission: number;
  startDate: string;
};

export default function AgentsPage() {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ["/api/agents"],
  });
  
  useEffect(() => {
    if (agentsData && Array.isArray(agentsData)) {
      const agents = agentsData.map(agent => ({
        id: agent.id,
        firstName: agent.firstName || '',
        surname: agent.surname || '',
        email: agent.email || '',
        phone: agent.phone || '',
        status: agent.status as "active" | "inactive",
        commissionRate: agent.commissionRate || 0,
        totalPolicies: agent.totalPolicies || 0,
        totalCommission: agent.totalCommission || 0,
        startDate: agent.hireDate || '',
      }));
      
      let filtered = [...agents];
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          agent => 
            `${agent.firstName} ${agent.surname}`.toLowerCase().includes(query) ||
            agent.email.toLowerCase().includes(query) ||
            (agent.phone && agent.phone.toLowerCase().includes(query))
        );
      }
      
      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter(agent => agent.status === statusFilter);
      }
      
      setFilteredAgents(filtered);
    }
  }, [agentsData, searchQuery, statusFilter]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        user={{
          name: "Admin User",
          role: "Administrator",
        }}
        onLogout={() => {
          // Handle logout
        }}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar 
          user={{
            name: "Admin User",
          }}
          onMobileMenuClick={() => {
            // Handle mobile menu
          }}
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
                <p className="text-gray-500">Manage agents and commission structures</p>
              </div>
              
              <Button 
                onClick={() => {
                  // Handle add agent
                }} 
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Agent
              </Button>
            </div>
            
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search agents..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" />
                    <span>Status: {statusFilter === "all" ? "All" : statusFilter === "active" ? "Active" : "Inactive"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("all")}
                    className={statusFilter === "all" ? "bg-muted" : ""}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("active")}
                    className={statusFilter === "active" ? "bg-muted" : ""}
                  >
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setStatusFilter("inactive")}
                    className={statusFilter === "inactive" ? "bg-muted" : ""}
                  >
                    Inactive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Tabs defaultValue="list" className="w-full">
              <TabsList>
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>
                            <div className="flex items-center">
                              Policies
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center">
                              Commission
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center">
                              Rate
                              <ArrowUpDown className="ml-1 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-9 w-9 rounded-full" />
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                            </TableRow>
                          ))
                        ) : filteredAgents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              {searchQuery ? (
                                <div>
                                  <UserX className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                                  <p>No agents found matching your search</p>
                                </div>
                              ) : (
                                <div>
                                  <UserCheck className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                                  <p>No agents available</p>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAgents.map((agent) => (
                            <TableRow key={agent.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                                    {agent.firstName?.charAt(0) || '?'}{agent.surname?.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <div className="font-medium">{agent.firstName || 'Unknown'} {agent.surname || ''}</div>
                                    <div className="text-sm text-gray-500">{agent.email || 'No email'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={agent.status === "active" ? "default" : "secondary"} 
                                  className={`capitalize ${agent.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                                >
                                  {agent.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{agent.totalPolicies || 0}</TableCell>
                              <TableCell>R {(agent.totalCommission || 0).toFixed(2)}</TableCell>
                              <TableCell>{(agent.commissionRate || 0)}%</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        // Handle edit
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        // Handle view policies
                                      }}
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      View Policies
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        // Handle toggle status
                                      }}
                                      className="text-amber-600"
                                    >
                                      {agent.status === "active" ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        // Handle delete
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="performance" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Agent Performance</CardTitle>
                      <CardDescription>Track agent productivity and commission earnings</CardDescription>
                    </div>
                    {selectedAgentId && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setSelectedAgentId(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to All Agents
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {selectedAgentId ? (
                      // Show individual agent performance when an agent is selected
                      <AgentPerformance agentId={selectedAgentId} />
                    ) : (
                      // Show agent selector grid when no agent is selected
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {filteredAgents.map((agent) => (
                            <Card 
                              key={agent.id} 
                              className="cursor-pointer hover:border-primary transition-colors"
                              onClick={() => setSelectedAgentId(agent.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-medium">
                                    {agent.firstName?.charAt(0) || '?'}{agent.surname?.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <div className="font-medium">{agent.firstName || 'Unknown'} {agent.surname || ''}</div>
                                    <div className="text-sm text-gray-500">
                                      <Badge 
                                        variant={agent.status === "active" ? "default" : "secondary"} 
                                        className={`capitalize ${agent.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""} mt-1`}
                                      >
                                        {agent.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-1.5">
                                    <UserCheck className="h-4 w-4 text-gray-500" />
                                    <span>{agent.totalPolicies || 0} Policies</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <DollarSign className="h-4 w-4 text-gray-500" />
                                    <span>R {(agent.totalCommission || 0).toFixed(0)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}