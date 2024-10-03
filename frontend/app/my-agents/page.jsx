'use client';

import React from 'react';
import Dashboard from '@/components/My-agents';
import Sidebar from '@/components/Sidebar';

const DashboardPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Dashboard />
      </div>
    </div>
  );
};

export default DashboardPage;