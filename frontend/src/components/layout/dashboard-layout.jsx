import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar"; 
import { Header } from "./header"; 

import { cn } from "../../lib/utils";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [collapsed, setCollapsed] = useState(false); 

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setCollapsed(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleToggleCollapse = () => {
    if (!isMobile) {
      
      setCollapsed((prev) => !prev);
    }
  };

  const handleToggleSidebarOpen = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    
    <div className="flex h-screen bg-page-bg overflow-hidden">
      
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out flex-shrink-0",
          "lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && !isMobile ? "w-20" : "w-64 md:w-72" 
        )}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)} 
          collapsed={!isMobile && collapsed} 
          onToggleCollapse={handleToggleCollapse} 
        />
      </div>

      
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {" "}
        
        <Header
          sidebarCollapsed={!isMobile && collapsed} 
          toggleSidebar={handleToggleSidebarOpen} 
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-page-bg">
          {" "}
         
          <Outlet />
        </main>
      </div>
    </div>
  );
};
