import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, MessageSquare, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
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
  const handleViewAgent = (agent) => {
    localStorage.setItem('currentAgentName', agent.agent_name);
    localStorage.setItem('currentAgentId', agent.id);
    localStorage.setItem('voiceID',agent.voice.voice_id)
    router.push(`/assistants/${agent.id}`);
  };

  const handleDeleteAgent = async (agentId) => {
    setDeleteLoading(agentId);
    try {
      const token = localStorage.getItem("access");
      await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/console/manage/${agentId}/`, {
        method: "DELETE",
        headers: {
          "User-Agent": "insomnia/9.3.2",
          Authorization: `JWT ${token}`,
        },
      });
      setAgents(agents.filter(agent => agent.id !== agentId));
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
    setDeleteLoading(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-white text-lg">Loading your agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 max-w-md">
          <p className="text-red-500 text-center">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Assistants
          </h1>
          <span className="px-4 py-2 bg-gray-800 rounded-full text-gray-400 text-sm">
            {agents.length} {agents.length === 1 ? 'Agent' : 'Agents'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
            >
              {/* Full-width image container */}
              <div className="w-full h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent z-10" />
                <img
                  src={agent.avatar || "https://img.icons8.com/nolan/64/user-default.png"}
                  alt={agent.agent_name}
                  className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* Content section */}
              <div className="relative p-6">
                <div className="flex flex-col space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">{agent.agent_name}</h2>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Language</span>
                      <span className="text-white">{agent.language}</span>
                    </div>
                 
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Voice</span>
                      <span className="text-white">{agent.voice.voice_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Model</span>
                      <span className="text-white">{agent.agent_llm}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => handleViewAgent(agent)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id)}
                      disabled={deleteLoading === agent.id}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading === agent.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 text-center">
              <p className="text-lg mb-2">No agents found</p>
              <p className="text-sm">Create your first agent to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;