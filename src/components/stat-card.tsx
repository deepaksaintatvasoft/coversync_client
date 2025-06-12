import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
    text?: string;
  };
  icon: React.ReactNode;
  iconColor?: string;
  className?: string;
};

export function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  iconColor = "text-secondary", 
  className 
}: StatCardProps) {
  return (
    <Card className={cn("p-6 hover:shadow-lg transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
          
          {change && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-medium flex items-center",
                change.trend === "up" ? "text-success" : 
                change.trend === "down" ? "text-danger" : 
                "text-gray-500"
              )}>
                {change.trend === "up" && <ArrowUpIcon className="mr-1 h-3 w-3" />}
                {change.trend === "down" && <ArrowDownIcon className="mr-1 h-3 w-3" />}
                {change.value}%
              </span>
              {change.text && <span className="text-xs text-gray-500 ml-1">{change.text}</span>}
            </div>
          )}
        </div>
        
        <div className={cn("bg-primary-50 h-12 w-12 rounded-full flex items-center justify-center", iconColor)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
