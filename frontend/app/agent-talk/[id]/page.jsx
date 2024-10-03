'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AgentTalk from '@/components/Agent';
import Sidebar from '@/components/Sidebar';
const AgentTalkPage = () => {
  const { id } = useParams();
 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // In a real application, you'd fetch the agent data based on the ID
  const agent = {
    id: parseInt(id),
    name: "Exam Preparation",
    icon: "https://img.icons8.com/nolan/64/student-male.png"
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
    <Sidebar
      isCollapsed={isSidebarCollapsed}
      toggleSidebar={toggleSidebar}
    />
    <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
    <AgentTalk agent={agent} />
    </div>
  </div>
  );
};

export default AgentTalkPage;