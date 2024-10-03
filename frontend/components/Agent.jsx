'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const AgentTalk = ({ agent }) => {
  const [isTalking, setIsTalking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    let animationInterval;
    if (isTalking) {
      animationInterval = setInterval(() => {
        setAnimationFrame((prev) => (prev + 1) % 3);
      }, 200);
    }
    return () => clearInterval(animationInterval);
  }, [isTalking]);

  const startConversation = () => {
    setIsTalking(true);
    setConversation([...conversation, { text: "Hello! How can I assist you today?", isAgent: true }]);
  };

  const endConversation = () => {
    setIsTalking(false);
    setConversation([...conversation, { text: "Thank you for the conversation. Goodbye!", isAgent: true }]);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Image src={agent.icon} alt={agent.name} width={64} height={64} className="mr-4" />
            <h1 className="text-3xl font-bold">{agent.name}</h1>
          </div>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div className={`absolute inset-0 bg-blue-500 rounded-full ${isTalking ? 'animate-pulse' : ''}`}></div>
            <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
              {isTalking && (
                <>
                  <div className={`h-4 w-1 bg-blue-500 mx-0.5 ${animationFrame === 0 ? 'animate-bounce' : ''}`}></div>
                  <div className={`h-4 w-1 bg-blue-500 mx-0.5 ${animationFrame === 1 ? 'animate-bounce' : ''}`}></div>
                  <div className={`h-4 w-1 bg-blue-500 mx-0.5 ${animationFrame === 2 ? 'animate-bounce' : ''}`}></div>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={startConversation}
              className="px-6 py-2 bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              disabled={isTalking}
            >
              Start Conversation
            </button>
            <button
              onClick={endConversation}
              className="px-6 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              disabled={!isTalking}
            >
              End Conversation
            </button>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
            {conversation.map((message, index) => (
              <div key={index} className={`mb-2 ${message.isAgent ? 'text-blue-400' : 'text-green-400'}`}>
                <span className="font-bold">{message.isAgent ? 'Agent: ' : 'You: '}</span>
                {message.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTalk;