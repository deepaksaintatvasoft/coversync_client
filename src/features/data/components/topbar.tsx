import { useState } from "react";
import { Menu, Search, Bell, Settings, HelpCircle } from "lucide-react";
import { UserAvatar } from "@/features/data/components/ui/user-avatar";
import { Input } from "@/features/data/components/ui/input";

type TopBarProps = {
  user: {
    name: string;
    avatarUrl?: string;
  };
  onMobileMenuClick: () => void;
  onSearch?: (query: string) => void;
};

const TopBar = ({ user = { name: "Admin User" }, onMobileMenuClick = () => {}, onSearch }: TopBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 w-full">
        <button 
          onClick={onMobileMenuClick}
          className="lg:hidden text-gray-500 hover:text-primary-900"
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search policies, clients, claims..."
            className="w-full pl-10 pr-4 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-3">
          <button className="relative p-2 text-gray-500 hover:text-primary-900 hover:bg-gray-100 rounded-full">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 bg-danger h-2 w-2 rounded-full"></span>
          </button>
          
          <button className="p-2 text-gray-500 hover:text-primary-900 hover:bg-gray-100 rounded-full">
            <Settings className="h-5 w-5" />
          </button>
          
          <button className="p-2 text-gray-500 hover:text-primary-900 hover:bg-gray-100 rounded-full">
            <HelpCircle className="h-5 w-5" />
          </button>
          
          <div className="hidden md:block h-6 w-px bg-gray-200 mx-2"></div>
          
          <div className="hidden md:flex items-center gap-3">
            <UserAvatar
              src={user.avatarUrl}
              name={user.name}
              size="md"
            />
            <div>
              <p className="text-sm font-medium text-primary-900">{user.name}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { TopBar };
export default TopBar;
