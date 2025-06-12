import { useState } from "react";
import { format } from "date-fns";
import { 
  Eye, 
  Pencil, 
  Trash2, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  FileText,
  Printer
} from "lucide-react";
import { UserAvatar } from "@/features/data/components/ui/user-avatar";
import { BadgeStatus } from "@/features/data/components/ui/badge-status";
import { Button } from "@/features/data/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/features/data/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/features/data/components/ui/dropdown-menu";
import { type PolicyWithDetails } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/data/components/ui/table";
import { Skeleton } from "@/features/data/components/ui/skeleton";
import { PolicyScheduleButton } from "@/features/data/components/policy-schedule-button";


export type PoliciesTableProps = {
  title: string;
  policies?: PolicyWithDetails[];
  isLoading?: boolean;
  onView?: (policy: PolicyWithDetails) => void;
  onEdit?: (policy: PolicyWithDetails) => void;
  onDelete?: (policy: PolicyWithDetails) => void;
  viewAllHref?: string;
  limit?: number;
  showPagination?: boolean;
  className?: string;
};

export function PoliciesTable({
  title,
  policies = [],
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  viewAllHref,
  limit,
  showPagination = false,
  className,
}: PoliciesTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = limit || 10;
  
  const displayedPolicies = limit
    ? policies.slice(0, limit)
    : policies.slice((page - 1) * pageSize, page * pageSize);
    
  const totalPages = Math.ceil(policies.length / pageSize);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 2,
      currencyDisplay: 'symbol',
    }).format(amount);
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-semibold text-primary-900">{title}</CardTitle>
          {viewAllHref && (
            <Button variant="link" className="text-secondary hover:text-secondary-dark text-sm font-medium" asChild>
              <a href={viewAllHref}>View All</a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Policy</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(limit || 4)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : displayedPolicies.length > 0 ? (
                displayedPolicies.map((policy) => (
                  <TableRow key={policy.id} className="hover:bg-gray-50">
                    <TableCell>
                      <span className="text-sm font-medium text-primary-900">
                        {policy.policyNumber}
                      </span>
                      <div className="text-xs text-gray-500">
                        Created: {format(new Date(policy.createdAt), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <UserAvatar
                          src={policy?.client?.avatarUrl || undefined}
                          name={policy?.client?.name || undefined}
                          size="sm"
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">{policy?.client?.name || undefined}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{policy?.policyType?.name || undefined}</span>
                    </TableCell>
                    <TableCell>
                      <BadgeStatus
                        variant={policy.status as any}
                        label={policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(policy.premium)}/{policy.frequency}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(policy)}
                            className="h-8 w-8 text-gray-500 hover:text-primary-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(policy)}
                            className="h-8 w-8 text-gray-500 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <PolicyScheduleButton
                          policyId={policy.id}
                          policyNumber={policy.policyNumber}
                        />
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-primary-900"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(`/api/policies/${policy.id}/schedule/preview`, "_blank")}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Preview Policy Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                const printWindow = window.open(`/api/policies/${policy.id}/schedule/preview`, "_blank");
                                if (printWindow) {
                                  printWindow.onload = function() {
                                    printWindow.print();
                                  };
                                }
                              }}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print Policy Schedule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No policies found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
