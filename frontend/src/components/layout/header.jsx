import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  UserCircle2,
  Menu,
} from "lucide-react"; // UserCircle2 for consistency
import { useAuth } from "../../context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export const Header = ({ sidebarCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    // Header background: card-bg (white), with a subtle bottom border and shadow
    <header className="bg-card-bg border-b border-theme-border-default sticky top-0 z-30 shadow-sm">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left Side: Hamburger (mobile) & Greeting */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden text-text-muted hover:text-text-main hover:bg-input-bg rounded-md" // Themed
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-xl font-semibold text-text-main leading-tight">
              Hello, {user?.name?.split(" ")[0] || "User"}!{" "}
              {/* Just first name for greeting */}
            </h1>
            <p className="text-text-muted text-sm mt-0.5">{getGreeting()}</p>
          </div>
        </div>

        {/* Right Side: Notifications & User Menu */}
        <div className="flex items-center gap-3 md:gap-4">

          {/* <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full h-9 w-9 bg-input-bg text-text-muted hover:bg-theme-border-default hover:text-text-main" // Themed
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />

              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-card-bg" />
            </Button>
          </div> */}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-input-bg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus-brand">
                <div className="w-8 h-8 rounded-full bg-brand-yellow/20 flex items-center justify-center overflow-hidden border border-theme-border-default/50 shadow-sm flex-shrink-0">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || "U"
                    )}&background=FFD024&color=1E2433&font-size=0.45&bold=true`}
                    alt={user?.name || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm text-left hidden sm:block">
                  <div className="font-medium text-text-main truncate max-w-[120px]">
                    {user?.name || "User Name"}
                  </div>
                  <div className="text-xs text-text-muted capitalize">
                    {user?.role?.toLowerCase() || "Role"}
                  </div>
                </div>
                <ChevronDown
                  size={18}
                  className="text-text-placeholder hidden sm:block ml-1"
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 mt-2 p-1 bg-card-bg rounded-lg border border-theme-border-default shadow-lg"
            >
              <div className="px-2 py-2 mb-1 border-b border-theme-border-default sm:hidden">
                {" "}
                {/* Mobile user info */}
                <p className="font-medium text-sm text-text-main truncate">
                  {user?.name || "User Name"}
                </p>
                <p className="text-xs text-text-muted capitalize">
                  {user?.role?.toLowerCase() || "Role"}
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="flex items-center py-2 px-2.5 text-sm text-text-main cursor-pointer rounded-md hover:bg-input-bg focus:bg-input-bg"
              >
                <UserCircle2 className="mr-2.5 h-4 w-4 text-text-muted" />{" "}
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                disabled // Example: disabled settings
                className="flex items-center py-2 px-2.5 text-sm text-text-main cursor-pointer rounded-md hover:bg-input-bg focus:bg-input-bg opacity-50 cursor-not-allowed"
              >
                <Settings className="mr-2.5 h-4 w-4 text-text-muted" />{" "}
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-theme-border-default" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center py-2 px-2.5 text-sm text-destructive cursor-pointer rounded-md hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2.5 h-4 w-4" /> <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
