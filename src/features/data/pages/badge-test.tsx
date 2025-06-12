// Let's create a custom badge component that doesn't rely on form context
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Define the Badge variants using CVA
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Create a simple Badge component without form dependencies
interface CustomBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function CustomBadge({ className, variant, ...props }: CustomBadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export default function BadgeTest() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Badge Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Default Badge</h2>
          <CustomBadge>Default</CustomBadge>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Outline Badge</h2>
          <CustomBadge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Completed
          </CustomBadge>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Secondary Badge</h2>
          <CustomBadge variant="secondary">Secondary</CustomBadge>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Destructive Badge</h2>
          <CustomBadge variant="destructive">Destructive</CustomBadge>
        </div>
      </div>
    </div>
  );
}