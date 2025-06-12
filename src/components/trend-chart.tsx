import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Period = "1M" | "3M" | "6M" | "1Y";

type TrendChartProps = {
  title: string;
  data: {
    name: string;
    [key: string]: string | number;
  }[];
  dataKeys: string[];
  colors?: string[];
  period?: Period;
  stats?: {
    label: string;
    value: string | number;
  }[];
  className?: string;
  variant?: "line" | "area" | "bar";
};

export function TrendChart({
  title,
  data,
  dataKeys,
  colors = ["#3b82f6", "#6366f1", "#22c55e"],
  period: initialPeriod = "1M",
  stats,
  className,
  variant = "line"
}: TrendChartProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  
  const renderChart = () => {
    switch (variant) {
      case "area":
        return (
          <AreaChart data={data}>
            <defs>
              {dataKeys.map((key, index) => (
                <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            {dataKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fillOpacity={1}
                fill={`url(#color-${key})`}
              />
            ))}
          </AreaChart>
        );
        
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            ))}
          </BarChart>
        );
        
      case "line":
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="font-semibold text-primary-900">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {(["1M", "3M", "6M", "1Y"] as Period[]).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => setPeriod(p)}
                className={cn(
                  "text-xs px-3 py-1 rounded-full h-auto",
                  period === p
                    ? "bg-primary-50 text-primary-900"
                    : "text-gray-500"
                )}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-lg font-semibold text-primary-900">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
