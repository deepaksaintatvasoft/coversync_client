import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils";

const badgeStatusVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        active: "bg-green-50 text-green-700 ring-green-600/20",
        pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        processing: "bg-blue-50 text-blue-700 ring-blue-600/10",
        expired: "bg-orange-50 text-orange-700 ring-orange-600/20",
        cancelled: "bg-red-50 text-red-700 ring-red-600/10",
        inactive: "bg-gray-50 text-gray-600 ring-gray-500/10",
        approved: "bg-green-50 text-green-700 ring-green-600/20",
        rejected: "bg-red-50 text-red-700 ring-red-600/10",
        paid: "bg-green-50 text-green-700 ring-green-600/20",
        unpaid: "bg-red-50 text-red-700 ring-red-600/10",
        late: "bg-orange-50 text-orange-700 ring-orange-600/20",
        default: "bg-gray-50 text-gray-600 ring-gray-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeStatusProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeStatusVariants> {
  label: string;
}

export function BadgeStatus({
  className,
  variant,
  label,
  ...props
}: BadgeStatusProps) {
  return (
    <div className={cn(badgeStatusVariants({ variant }), className)} {...props}>
      {label}
    </div>
  );
}