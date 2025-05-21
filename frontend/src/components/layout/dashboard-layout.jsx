import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar"; // Assuming path
import { Header } from "./header"; // Assuming path
// import { Menu } from "lucide-react"; // Not directly used here anymore
// import { Button } from "../ui/button"; // Not directly used here anymore
import { cn } from "../../lib/utils";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [collapsed, setCollapsed] = useState(false); // Sidebar collapsed state for desktop

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Auto-close on mobile, and ensure it's not collapsed
        setCollapsed(false);
      } else {
        setSidebarOpen(true); // Default to open on desktop
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleToggleCollapse = () => {
    if (!isMobile) {
      // Collapse only on desktop
      setCollapsed((prev) => !prev);
    }
  };

  const handleToggleSidebarOpen = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    // Main background for the entire layout container
    <div className="flex h-screen bg-page-bg overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out flex-shrink-0",
          "lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && !isMobile ? "w-20" : "w-64 md:w-72" // Adjust collapsed/expanded width
        )}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)} // For mobile X button
          collapsed={!isMobile && collapsed} // Sidebar is only visually collapsed on desktop
          onToggleCollapse={handleToggleCollapse} // For desktop collapse button
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {" "}
        {/* Ensure content can scroll if needed */}
        <Header
          sidebarCollapsed={!isMobile && collapsed} // Pass desktop collapsed state
          toggleSidebar={handleToggleSidebarOpen} 
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-page-bg">
          {" "}
          {/* Page background for content area */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
