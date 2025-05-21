import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth-context"; // Ensure path is correct
import {
  ChevronLeft, ChevronRight, LayoutDashboard, Users, UserCircle2, LogOut, X,
  CarFront, // Icon for Vehicle Entry/Exit (Attendant)
  ParkingSquare, // Icon for Parking Facilities (Admin)
  ListOrdered, // Icon for Currently Parked (Attendant) or All Entries (Admin)
  FileText, // Icon for Reports (Admin)
  Settings,
  ClipboardList, // Placeholder
} from "lucide-react";
import { Button } from "../ui/button"; // Ensure path is correct
import { Logo } from "../ui/logo";   // Ensure path is correct
import { cn } from "../../lib/utils"; // Ensure path is correct

export const Sidebar = ({ onClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // user should have { id, firstName, lastName, role, permissions: [...] }

  // Helper to check permissions
  const hasPermission = (permissionKey) => {
    // console.log("Checking permission:", permissionKey, "User permissions:", user?.permissions);
    return user?.permissions?.includes(permissionKey);
  };

  const isAdmin = user?.role === "ADMIN";
  const isAttendant = user?.role === "PARKING_ATTENDANT";

  // --- Navigation Items for Parking Attendant System ---
  const navigationItems = [
    // --- Common for All Staff ---
    // {
    //   name: "Dashboard", // General landing page after login
    //   icon: <LayoutDashboard className="h-5 w-5" />,
    //   href: "/attendant/dashboard", // A generic staff dashboard
    //   visible: true, // Visible to both admin and attendant
    // },

    // --- Parking Attendant Specific ---
    {
      name: "Vehicle Entry",
      icon: <CarFront className="h-5 w-5" />, // Or 'LogIn' with different meaning
      href: "/attendant/vehicle-entry", // Page for attendant to record entry
      visible: isAttendant && hasPermission("record_vehicle_entry"),
    },

    // {
    //   name: "Vehicle Exit",
    //   icon: <LogOut className="h-5 w-5 transform scale-x-[-1]" />, // Flipped LogOut or 'LogOut' + 'Car'
    //   href: "/attendant/vehicle-exit", // Page for attendant to record exit
    //   visible: isAttendant && hasPermission("record_vehicle_exit"),
    // },
    // {
    //   name: "Currently Parked",
    //   icon: <ListOrdered className="h-5 w-5" />,
    //   href: "/attendant/currently-parked",
    //   visible: isAttendant && hasPermission("view_current_parked_vehicles"),
    // },
    {
      name: "View Parkings", // Attendant's view of all parking facilities
      icon: <ParkingSquare className="h-5 w-5 opacity-80" />, // Can use same or slightly different icon
      href: "/attendant/view-parkings",
      visible: isAttendant && hasPermission("view_all_parkings_details"),
    },

    // --- Admin Specific ---
    // {
    //   name: "Manage Users", // Staff users (Admins, Attendants)
    //   icon: <Users className="h-5 w-5" />,
    //   href: "/admin/users",
    //   visible: isAdmin && hasPermission("manage_users"),
    // },
    {
      name: "Manage Parkings", // Parking Facilities/Zones
      icon: <ParkingSquare className="h-5 w-5" />,
      href: "/admin/parkings", // This is the route you want to access
      visible: isAdmin && hasPermission("manage_parkings"), // <<< CHECK THIS PERMISSION
    },
    // {
    //   name: "All Vehicle Entries", // Admin view of all historical/current entries
    //   icon: <ClipboardList className="h-5 w-5" />,
    //   href: "/admin/vehicle-entries",
    //   visible: isAdmin && hasPermission("view_all_vehicle_entries"),
    // },
    {
      name: "Record Exit / Parked",
      icon: <ListOrdered className="h-5 w-5" />, // Or VehicleExitIcon
      href: "/attendant/record-exit",
      visible: isAttendant && (hasPermission("view_current_parked_vehicles") || hasPermission("record_vehicle_exit")),
    },
    {
      name: "Reports",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/reports", // Main reports page, then sub-routes for specific reports
      visible: isAdmin && hasPermission("view_system_reports"),
    },
    // {
    //   name: "Audit Logs", // If you re-add logging
    //   icon: <ClipboardList className="h-5 w-5" />,
    //   href: "/admin/logs",
    //   visible: isAdmin && hasPermission("view_audit_logs"),
    // },

    // --- Common Profile ---
    {
      name: "My Profile",
      icon: <UserCircle2 className="h-5 w-5" />,
      href: "/profile",
      visible: hasPermission("manage_own_profile"), // All staff can manage their profile
    },
    // { name: "Settings", icon: <Settings className="h-5 w-5" />, href: "/staff/settings", visible: true },
  ];

  const visibleItems = navigationItems.filter((item) => item.visible);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };



  return (
    <div className="flex flex-col h-full bg-card-bg shadow-lg border-r border-theme-border-default relative">
      <div className={cn("flex items-center justify-between h-16 border-b border-theme-border-default bg-card-bg", collapsed ? "px-2" : "px-4")}>
        {!collapsed ? (
          <div className="flex items-center cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/staff/dashboard')}> {/* Dynamic dashboard link */}
            <img src="/images/logo2.png" alt="ParkWell Logo" className="h-8 w-auto mr-2" /> {/* Using img tag for logo */}
            <span className="text-xl font-bold text-text-main">ParkWell</span>
          </div>
        ) : (
          <div className="cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/staff/dashboard')}>
            <img src="/images/logo2.png" alt="ParkWell Logo" className="h-8 w-8 mx-auto" />
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden rounded-md p-0 h-8 w-8 text-text-muted hover:bg-input-bg">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <button onClick={onToggleCollapse} className="absolute -right-3 top-20 hidden lg:flex items-center justify-center h-7 w-7 rounded-full bg-card-bg shadow-md border border-theme-border-default text-text-muted hover:bg-input-bg z-10 focus:outline-none" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <nav className="flex-1 overflow-y-auto py-4 px-2.5">
        <ul className="space-y-1.5">
          {visibleItems.map((item) => {
            const baseHref = item.href.split("?")[0]; // Get path without query params
            const isActive = location.pathname === baseHref || (location.pathname.startsWith(baseHref) && baseHref !== "/");
            // Special case for dashboard to avoid matching everything
            const isDashboardActive = item.href.includes("dashboard") && location.pathname === item.href;
            const finalIsActive = item.href.includes("dashboard") ? isDashboardActive : isActive;

            return (
              <li key={item.name}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center gap-x-3 font-medium rounded-lg text-sm transition-all duration-150 ease-in-out group",
                    collapsed ? "justify-center px-2 h-10" : "justify-start px-3 h-10",
                    finalIsActive
                      ? "bg-brand-yellow/15 text-brand-yellow hover:bg-brand-yellow/25 font-semibold" // Enhanced active state
                      : "text-text-muted hover:bg-input-bg hover:text-text-main"
                  )}
                  onClick={() => { navigate(item.href); if (onClose && window.innerWidth < 1024) onClose(); }}
                  title={collapsed ? item.name : ""}
                >
                  <span className={cn("flex-shrink-0", finalIsActive ? "text-brand-yellow" : "text-text-placeholder group-hover:text-text-main")}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  {/* {finalIsActive && !collapsed && (
                    <span className="absolute right-0 w-[3px] h-2/3 top-1/2 -translate-y-1/2 bg-brand-yellow rounded-l-full"></span>
                  )}
                  {finalIsActive && collapsed && (
                    <span className="absolute left-0 w-[3px] h-2/3 top-1/2 -translate-y-1/2 bg-brand-yellow rounded-r-full"></span>
                  )} */}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn("p-3 mt-auto border-t border-theme-border-default", collapsed ? "py-4" : "")}>
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <div className="h-9 w-9 rounded-full bg-brand-yellow/20 flex items-center justify-center overflow-hidden border-2 border-card-bg shadow-sm flex-shrink-0">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName?.[0] || 'P')}${encodeURIComponent(user?.lastName?.[0] || 'W')}&background=FFC107&color=334155&font-size=0.4&bold=true`}
                  alt={user?.firstName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-2.5 overflow-hidden">
                <p className="text-sm font-medium text-text-main truncate">{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Staff Member"}</p>
                <p className="text-xs text-text-muted capitalize truncate">{user?.role?.replace("_", " ").toLowerCase() || "Role"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-text-muted hover:text-destructive hover:bg-destructive/10 rounded-md h-8 w-8 flex-shrink-0" title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="h-9 w-9 rounded-full bg-brand-yellow/20 flex items-center justify-center overflow-hidden border-2 border-card-bg shadow-sm">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.firstName?.[0] || 'P')}${encodeURIComponent(user?.lastName?.[0] || 'W')}&background=FFC107&color=334155&font-size=0.4&bold=true`}
                alt={user?.firstName || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-text-muted hover:text-destructive hover:bg-destructive/10 rounded-md h-8 w-8" title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};