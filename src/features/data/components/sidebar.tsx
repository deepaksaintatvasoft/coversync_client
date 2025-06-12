import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  LayoutDashboard, 
  FileText, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings, 
  UserCog, 
  History, 
  LogOut,
  UserCheck,
  Mail,
  MessageSquare,
  CreditCard,
  Filter,
  Code
} from "lucide-react";
import { UserAvatar } from "@/features/data/components/ui/user-avatar";
import { cn } from "@/utils";
import LogoImage from "@assets/image_1743085029401.png";

type SidebarProps = {
  user?: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
};

const Sidebar = ({ user = { name: "Admin User", role: "Administrator" }, onLogout }: SidebarProps) => {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  const mainMenuItems = [
    { path: "/", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
    { path: "/policies", icon: <FileText className="w-5 h-5" />, label: "Policies" },
    { path: "/claims", icon: <DollarSign className="w-5 h-5" />, label: "Claims" },
    { path: "/agents", icon: <UserCheck className="w-5 h-5" />, label: "Agents" },
    { path: "/policy-retention", icon: <Filter className="w-5 h-5" />, label: "Policy Retention" },
    { path: "/reports", icon: <BarChart3 className="w-5 h-5" />, label: "Reports" }
  ];
  
  const adminMenuItems = [
    { path: "/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
    { path: "/email-settings", icon: <Mail className="w-5 h-5" />, label: "Email Services" },
    { path: "/sms-services", icon: <MessageSquare className="w-5 h-5" />, label: "SMS Services" },
    { path: "/api-gateway", icon: <Code className="w-5 h-5" />, label: "API Gateway" },
    { path: "/users", icon: <UserCog className="w-5 h-5" />, label: "User Management" },
    { path: "/audit", icon: <History className="w-5 h-5" />, label: "Audit Log" }
  ];
  
  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-200 h-full transition-all duration-300 flex-shrink-0 shadow-md z-20 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LogoImage} alt="CoverSync Logo" className="h-9 w-9" />
          {!collapsed && <h1 className="text-xl font-black bg-gradient-to-r from-blue-900 via-blue-700 to-blue-400 bg-clip-text text-transparent font-['Montserrat',_sans-serif] tracking-wider uppercase">CoverSync</h1>}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="text-gray-500 hover:text-primary-900"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>
      
      <nav className="p-4 flex-grow">
        <ul className="space-y-1">
          {!collapsed && (
            <li className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">
              Main
            </li>
          )}
          
          {mainMenuItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md",
                  location === item.path
                    ? "bg-primary-50 text-primary-900 font-medium"
                    : "text-gray-600 hover:bg-primary-50 hover:text-primary-900"
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
          
          {!collapsed && (
            <li className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-6 pb-2">
              Administration
            </li>
          )}
          
          {adminMenuItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md",
                  location === item.path
                    ? "bg-primary-50 text-primary-900 font-medium"
                    : "text-gray-600 hover:bg-primary-50 hover:text-primary-900"
                )}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <UserAvatar
            src={user.avatarUrl}
            name={user.name}
            size={collapsed ? "sm" : "md"}
          />
          
          {!collapsed && (
            <div className="flex-grow min-w-0">
              <p className="text-sm font-medium text-primary-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.role}</p>
            </div>
          )}
          
          <button 
            onClick={onLogout} 
            className="text-gray-500 hover:text-primary-900"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export { Sidebar };
export default Sidebar;
