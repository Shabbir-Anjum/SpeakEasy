"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import axios from "axios";

const CreateAgentPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [voices, setVoices] = useState([]);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const [agentData, setAgentData] = useState({
    name: "",
    language: "",
    voice: "",
    avatar: null,
    greeting: "",
    prompt: "",
    llm: "gpt-4o",
    customKnowledge: "",
    files: [],
  });
  const XI_API_KEY = process.env.NEXT_PUBLIC_XI_API_KEY;

  useEffect(() => {
    fetchVoices();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAgentData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAgentData((prevData) => ({ ...prevData, files: [...e.target.files] }));
  };

  const handleAvatarChange = (e) => {
    setAgentData((prevData) => ({ ...prevData, avatar: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a new FormData object
    const formData = new FormData();

    // Append form data
    formData.append("agent.identity.agent_name", agentData.name);
    formData.append("agent.identity.language", agentData.language);
    formData.append("agent.identity.voice", agentData.voice);
    formData.append("agent.behaviour.agent_greeting", agentData.greeting);
    formData.append("agent.behaviour.agent_prompt", agentData.prompt);
    formData.append("agent.knowledge.agent_llm", agentData.llm);
    formData.append("agent.knowledge.custom_knowledge", agentData.customKnowledge);

    // Append the avatar file if it exists
    if (agentData.avatar) {
      formData.append("avatar", agentData.avatar, agentData.avatar.name);
    }

    // Append knowledge files
    agentData.files.forEach((file, index) => {
      formData.append(`file${index}`, file, file.name);
    });

    try {
      const token = localStorage.getItem("access");

      if (!token) {
        alert("Not logged in");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER}/api/console/create`,
        {
          method: "POST",
          headers: {
            "User-Agent": "insomnia/9.3.2",
            Authorization: `JWT ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Agent created successfully:', result);
        router.push('/my-agents');
      } else {
        const errorData = await response.json();
        console.error("Failed to create agent:", errorData);
        // Handle error (e.g., show an error message to the user)
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const nextStep = (e) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const prevStep = (e) => {
    e.preventDefault();
    setStep(step - 1);
  };

  const fetchVoices = async () => {
    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'Accept': 'application/json',
          'xi-api-key': XI_API_KEY
        }
      });
      setVoices(response.data.voices);
      if (response.data.voices.length > 0) {
        setAgentData(prevData => ({ ...prevData, voice: response.data.voices[0].voice_id }));
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="min-h-screen p-8">
          <h1 className="text-5xl font-bold mb-12 text-center text-white">Create Your Custom Agent</h1>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl p-8 mb-8">
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-3xl font-semibold mb-6 text-white">Step 1: Identity</h2>
                  <div>
                    <label className="block mb-2 text-white">Agent Name</label>
                    <input
                      type="text"
                      name="name"
                      value={agentData.name}
                      onChange={handleInputChange}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white placeholder-gray-300"
                      placeholder="Enter agent name"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-white">Language</label>
                    <select
                      name="language"
                      value={agentData.language}
                      onChange={handleInputChange}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white"
                    >
                      <option value="" className="bg-gray-800">Select a language</option>
                      <option value="english" className="bg-gray-800">English</option>
                      <option value="spanish" className="bg-gray-800">Spanish</option>
                      <option value="french" className="bg-gray-800">French</option>
                      <option value="german" className="bg-gray-800">German</option>
                      <option value="hindi" className="bg-gray-800">Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-white">Voice</label>
                    <select
                      name="voice"
                      value={agentData.voice}
                      onChange={handleInputChange}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white"
                    >
                      {voices.map((voice) => (
                        <option key={voice.voice_id} value={voice.voice_id} className="bg-gray-800">
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-white">Avatar</label>
                    <input
                      type="file"
                      name="avatar"
                      onChange={handleAvatarChange}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-3xl font-semibold mb-6 text-white">
                    Step 2: Behavior
                  </h2>
                  <div>
                    <label className="block mb-2 text-white">
                      Agent Greeting (max 250 characters)
                    </label>
                    <textarea
                      name="greeting"
                      value={agentData.greeting}
                      onChange={handleInputChange}
                      maxLength={250}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white h-24"
                      placeholder="Enter agent greeting"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-white">
                      Agent Prompt
                    </label>
                    <textarea
                      name="prompt"
                      value={agentData.prompt}
                      onChange={handleInputChange}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white h-32"
                      placeholder="Enter agent prompt"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h2 className="text-3xl font-semibold mb-6 text-white">
                    Step 3: Knowledge
                  </h2>
                  <div>
                    <label className="block mb-2 text-white">Agent LLM</label>
                    <select
                      name="llm"
                      value={agentData.llm}
                      onChange={handleInputChange}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white"
                    >
                      <option value="gtp-4o-mini" className=" bg-gray-800">
                        GPT-4o-Mini
                      </option>
                      <option value="gtp-4o" className=" bg-gray-800">
                        GPT-4o
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-white">
                      Custom Knowledge (max 30000 characters)
                    </label>
                    <textarea
                      name="customKnowledge"
                      value={agentData.customKnowledge}
                      onChange={handleInputChange}
                      maxLength={30000}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white h-32"
                      placeholder="Enter custom knowledge"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-white">
                      Upload Knowledge Files
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full bg-white bg-opacity-20 rounded-md p-3 text-white"
                    />
                    <p className="text-sm text-gray-300 mt-1">
                      Supported file types: PDF, TXT, EPUB, and more.
                      <Link
                        href="/supported-files"
                        className="text-blue-300 hover:underline"
                      >
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
                    className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                  >
                    Previous
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
                  >
                    Create Agent
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentPage;
