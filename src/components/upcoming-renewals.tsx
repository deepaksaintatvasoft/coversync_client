import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { type PolicyWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type UpcomingRenewalsProps = {
  renewals?: PolicyWithDetails[];
  isLoading?: boolean;
  onRenew?: (policy: PolicyWithDetails) => void;
  viewAllHref?: string;
  className?: string;
};

export function UpcomingRenewals({
  renewals = [],
  isLoading = false,
  onRenew,
  viewAllHref,
  className,
}: UpcomingRenewalsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 2,
      currencyDisplay: 'symbol',
    }).format(amount);
  };
  
  const getDaysLeft = (date: Date | string) => {
    const daysLeft = formatDistanceToNow(new Date(date), { addSuffix: false });
    return daysLeft.includes("about") ? daysLeft.replace("about ", "") : daysLeft;
  };
  
  const getStatusVariant = (daysLeft: string) => {
    if (daysLeft.includes("day")) {
      const days = parseInt(daysLeft.split(" ")[0]);
      if (days <= 3) return "danger";
      if (days <= 7) return "warning";
    }
    return "warning";
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-semibold text-primary-900">Upcoming Renewals</CardTitle>
          {viewAllHref && (
            <Button variant="link" className="text-secondary hover:text-secondary-dark text-sm font-medium" asChild>
              <a href={viewAllHref}>View All</a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  
                  <div className="flex items-center mt-3">
                    <Skeleton className="h-6 w-6 rounded-full mr-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              ))
          ) : renewals.length > 0 ? (
            renewals.map((policy) => {
              const daysLeft = getDaysLeft(policy.renewalDate || policy.endDate);
              const statusVariant = getStatusVariant(daysLeft);
              
              return (
                <div 
                  key={policy.id} 
                  className="border border-gray-100 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-medium text-primary-900">{policy.policyNumber}</span>
                      <div className="text-xs text-gray-500 mb-2">{policy.policyType.name}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${statusVariant} bg-opacity-10 text-${statusVariant}`}>
                      {daysLeft} left
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-1">
                    <UserAvatar
                      src={policy.client.avatarUrl}
                      name={policy.client.name}
                      size="sm"
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">{policy.client.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-600">
                      {formatCurrency(policy.premium)}/{policy.frequency}
                    </span>
                    {onRenew && (
                      <Button
                        size="sm"
                        onClick={() => onRenew(policy)}
                        className="text-xs h-7 px-3 py-1"
                      >
                        Renew
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              No upcoming renewals
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
