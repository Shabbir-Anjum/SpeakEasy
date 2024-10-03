'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Card = ({ children, className }) => (
  <div className={`bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-md ${className}`}>
    {children}
  </button>
);

const Dashboard = () => {
  const agents = [
    { id: 1, name: "Exam Preparation", conversations: 1, minutesSpoken: 1.4, icon: "https://img.icons8.com/nolan/64/student-male.png" },
    { id: 2, name: "Talk and Human", conversations: 2, minutesSpoken: 3.1, icon: "https://img.icons8.com/nolan/64/communication.png" },
    { id: 3, name: "Language Tutor", conversations: 5, minutesSpoken: 10.5, icon: "https://img.icons8.com/nolan/64/translation.png" },
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white animate-fadeIn">
      <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 animate-slideDown">
        My Agents
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {agents.map((agent) => (
          <Card key={agent.id} className="bg-gradient-to-br from-gray-700 to-gray-900 border-none animate-slideUp">
            <div className="flex items-center mb-4">
              <Image src={agent.icon} alt={agent.name} width={48} height={48} className="mr-4" />
              <h2 className="text-xl font-semibold">{agent.name}</h2>
            </div>
            <p className="text-lg mb-2">{agent.conversations} conversations</p>
            <p className="text-sm text-gray-400 mb-4">{agent.minutesSpoken} minutes spoken</p>
            <Link href={`/agent-talk/${agent.id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                View Agent
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;