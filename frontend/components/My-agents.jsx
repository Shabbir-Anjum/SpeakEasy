import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const token = localStorage.getItem("access");
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/console/list`, {
          method: "GET",
          headers: {
            "User-Agent": "insomnia/9.3.2",
            Authorization: `JWT ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }
        const data = await response.json();
        setAgents(data);
        setIsLoading(false);
      } catch (error) {
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const handleViewAgent = (agent) => {
    localStorage.setItem('currentAgentName', agent.agent_name);
    localStorage.setItem('currentAgentId', agent.id);
    router.push(`/agent-talk/${agent.id}`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white animate-fadeIn">
      <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 animate-slideDown">
        My Agents
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {agents.map((agent) => (
          <Card key={agent.id} className="bg-gradient-to-br from-gray-700 to-gray-900 border-none animate-slideUp">
            <div className="flex items-center mb-4">
              <img 
                src={"https://img.icons8.com/nolan/64/user-default.png"}
                alt={agent.agent_name}
                width={48}
                height={48}
                className="mr-4 rounded-full"
              />
              <h2 className="text-xl font-semibold">{agent.agent_name}</h2>
            </div>
            <p className="text-sm text-gray-400 mb-2">Language: {agent.language}</p>
            <p className="text-sm text-gray-400 mb-2">Voice: {agent.voice}</p>
            <p className="text-sm text-gray-400 mb-4">LLM: {agent.agent_llm}</p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              onClick={() => handleViewAgent(agent)}
            >
              View Agent
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;