import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";

type PolicyDistributionProps = {
  title?: string;
  data: {
    name: string;
    value: number;
    color: string;
    percentage?: number;
  }[];
  className?: string;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PolicyDistribution({
  title = "Policy Distribution",
  data,
  className,
}: PolicyDistributionProps) {
  // Process data to combine duplicates
  const processedData = useMemo(() => {
    // Create a map to store combined values for each unique policy name
    const typeMap = new Map<string, {
      name: string;
      value: number;
      color: string;
    }>();
    
    // Combine values for duplicate policy types
    data.forEach(item => {
      if (!typeMap.has(item.name)) {
        typeMap.set(item.name, {
          name: item.name,
          value: item.value,
          color: item.color
        });
      } else {
        const existing = typeMap.get(item.name)!;
        existing.value += item.value;
      }
    });
    
    // Convert map back to array
    return Array.from(typeMap.values());
  }, [data]);

  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-semibold text-primary-900">{title}</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value}`, 'Policies']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-3">
          {/* Only show each policy type once in the legend */}
          {Array.from(new Set(data.map(item => item.name))).map((name, index) => {
            // Get the first item with this name for color
            const item = data.find(item => item.name === name);
            if (!item) return null;
            
            // Calculate total value for this policy type
            const totalValue = data
              .filter(d => d.name === name)
              .reduce((sum, d) => sum + d.value, 0);
              
            // Calculate percentage
            const totalAllValues = data.reduce((sum, d) => sum + d.value, 0);
            const percentage = Math.round((totalValue / totalAllValues) * 100);
            
            return (
              <div key={index} className="flex items-center gap-2">
                <span 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-sm text-gray-600">
                  {name} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
