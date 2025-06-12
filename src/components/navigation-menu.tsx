import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  User, 
  FileText, 
  File, 
  Plus, 
  BarChart 
} from "lucide-react";

export function NavigationMenu() {
  const [location, navigate] = useLocation();

  // Active navigation item styles
  const getNavItemStyles = (isActive: boolean) => {
    return `whitespace-nowrap relative ${
      isActive 
        ? "text-primary font-medium after:absolute after:bottom-[-8px] after:left-2 after:right-2 after:h-[2px] after:bg-primary after:rounded-full" 
        : "text-gray-600 hover:text-primary/80"
    }`;
  };

  return (
    <div className="bg-white border-b mb-6 -mx-6 px-6 py-2 shadow-sm">
      <div className="flex items-center space-x-4 overflow-x-auto pb-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className={getNavItemStyles(location === "/")}
          onClick={() => navigate("/")}
        >
          <User className={`h-4 w-4 mr-2 ${location === "/" ? "text-primary" : ""}`} />
          Dashboard
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={getNavItemStyles(location.includes("/claims"))}
          onClick={() => navigate("/claims")}
        >
          <FileText className={`h-4 w-4 mr-2 ${location.includes("/claims") ? "text-primary" : ""}`} />
          Claims
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={getNavItemStyles(location === "/policies")}
          onClick={() => navigate("/policies")}
        >
          <File className={`h-4 w-4 mr-2 ${location === "/policies" ? "text-primary" : ""}`} />
          Policies
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={getNavItemStyles(location === "/policy-signup")}
          onClick={() => navigate("/policy-signup")}
        >
          <Plus className={`h-4 w-4 mr-2 ${location === "/policy-signup" ? "text-primary" : ""}`} />
          New Policy
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={getNavItemStyles(location === "/underwriter-report")}
          onClick={() => navigate("/underwriter-report")}
        >
          <BarChart className={`h-4 w-4 mr-2 ${location === "/underwriter-report" ? "text-primary" : ""}`} />
          Reports
        </Button>
      </div>
    </div>
  );
}