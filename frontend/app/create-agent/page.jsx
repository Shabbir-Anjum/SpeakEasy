'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
const CreateAgentPage = () => {
    
  const [step, setStep] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const [agentData, setAgentData] = useState({
    name: '',
    language: '',
    voice: '',
    avatar: null,
    greeting: '',
    prompt: '',
    llm: 'gpt4-mini',
    customKnowledge: '',
    files: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAgentData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAgentData(prevData => ({ ...prevData, files: [...e.target.files] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log(agentData);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
    <Sidebar
      isCollapsed={isSidebarCollapsed}
      toggleSidebar={toggleSidebar}
    />
    <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
        Create Your Custom Agent
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-4">Step 1: Identity</h2>
            <div>
              <label className="block mb-2">Agent Name</label>
              <input
                type="text"
                name="name"
                value={agentData.name}
                onChange={handleInputChange}
                className="w-full bg-gray-700 rounded-md p-2 text-white"
              />
            </div>
            <div>
              <label className="block mb-2">Language</label>
              <select
                name="language"
                value={agentData.language}
                onChange={handleInputChange}
                className="w-full bg-gray-700 rounded-md p-2 text-white"
              >
                <option value="">Select a language</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Voice</label>
              <select
                name="voice"
                value={agentData.voice}
                onChange={handleInputChange}
                className="w-full bg-gray-700 rounded-md p-2 text-white"
              >
                <option value="">Select a voice</option>
                <option value="male1">Male 1</option>
                <option value="female1">Female 1</option>
                <option value="neutral1">Neutral 1</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Avatar</label>
              <input
                type="file"
                name="avatar"
                onChange={(e) => setAgentData(prevData => ({ ...prevData, avatar: e.target.files[0] }))}
                className="w-full bg-gray-700 rounded-md p-2 text-white"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-4">Step 2: Behavior</h2>
            <div>
              <label className="block mb-2">Agent Greeting (max 250 characters)</label>
              <textarea
                name="greeting"
                value={agentData.greeting}
                onChange={handleInputChange}
                maxLength={250}
                className="w-full bg-gray-700 rounded-md p-2 text-white h-24"
              />
            </div>
            <div>
              <label className="block mb-2">Agent Prompt</label>
              <textarea
                name="prompt"
                value={agentData.prompt}
                onChange={handleInputChange}
                className="w-full bg-gray-700 rounded-md p-2 text-white h-32"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-4">Step 3: Knowledge</h2>
            <div>
              <label className="block mb-2">Agent LLM</label>
              <select
                name="llm"
                value={agentData.llm}
                onChange={handleInputChange}
                className="w-full bg-gray-700 rounded-md p-2 text-white"
              >
                <option value="gpt4-mini">GPT-4 Mini</option>
                <option value="gpt4-full">GPT-4 Full</option>
                <option value="gpt3">GPT-3</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Custom Knowledge (max 30000 characters)</label>
              <textarea
                name="customKnowledge"
                value={agentData.customKnowledge}
                onChange={handleInputChange}
                maxLength={30000}
                className="w-full bg-gray-700 rounded-md p-2 text-white h-32"
              />
            </div>
            <div>
              <label className="block mb-2">Upload Knowledge Files</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full bg-gray-700 rounded-md p-2 text-white"
              />
              <p className="text-sm text-gray-400 mt-1">
                Supported file types: PDF, TXT, EPUB, and more. 
                <Link href="/supported-files" className="text-blue-400 hover:underline">
                  See full list
                </Link>
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
            >
              Previous
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-500 transition-colors"
            >
              Create Agent
            </button>
          )}
        </div>
      </form>
    </div>
    </div>
  </div>
    
  );
};

export default CreateAgentPage;