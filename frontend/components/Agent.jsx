import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AgentTalk = () => {
  const email = useSelector((state) => state.chat.email);
  const { id } = useParams();
  const [showAlert, setShowAlert] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [agentId, setAgentId] = useState(null);
  const [token, setToken] = useState(null);
  const hasGreetingRun = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);


  const greeting = useCallback(async () => {
    if (!agentId || !token || hasGreetingRun.current) return;
    
    try {
      hasGreetingRun.current = true;
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/console/sync/${agentId}/`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "insomnia/9.3.2",
          Authorization: `JWT ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      if (responseData.ai_text) {
        generateSpeech(responseData.ai_text);
      } else {
        console.error('AI text not found in the response');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      }
    } catch (error) {
      console.error('Error sending audio to backend:', error);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      hasGreetingRun.current = false;
    }
  }, [agentId, token]);

 


  useEffect(()=>{
    const storedAgentId = localStorage.getItem("currentAgentId");
    const storedAgentName = localStorage.getItem('currentAgentName');
    const storedToken = localStorage.getItem("access");
    const storedVoiceId = localStorage.getItem('voiceID');
    
    if (storedVoiceId) {
      setSelectedVoice(storedVoiceId);
    }
    
    setAgentId(storedAgentId);
    setAgentName(storedAgentName || "unknown");
    setToken(storedToken);
  },[])

  useEffect(() => {
   
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const latestResult = event.results[event.results.length - 1];
        const latestTranscript = latestResult[0].transcript;
        setTranscript(latestTranscript);

        // Clear any existing timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Set new timeout to detect silence
        timeoutRef.current = setTimeout(async() =>  {
    
          await sendTranscriptToBackend(latestTranscript);
        }, 1000); // Wait 1 second of silence before sending
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    setIsListening(prev => !prev);
    if (!isListening) {
      recognitionRef.current.start();
      videoRef.current.play();
      setTranscript('');
    } else {
      recognitionRef.current.stop();
      videoRef.current.pause();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };


  useEffect(() => {
    if (agentId && token && !hasGreetingRun.current) {
      greeting();
    }
  }, [agentId, token, greeting]);

  const sendTranscriptToBackend = async (text) => {
    if (!text.trim() || !agentId || !token) return;
    console.log(text)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/console/talk/${agentId}/`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "insomnia/9.3.2",
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          "email": email,
          "human_text": text.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      if (responseData.ai_text) {
        await generateSpeech(responseData.ai_text);
      } else {
        throw new Error('AI text not found in the response');
      }
    } catch (error) {
      console.error('Error sending text to backend:', error);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const generateSpeech = async (text) => {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}/stream`,
        {
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': process.env.NEXT_PUBLIC_XI_API_KEY,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      await audioRef.current.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  return (
    <>
      <Head>
        <title>{agentName} - Agent Talk</title>
      </Head>
      <div className="flex flex-col items-center gap-5 justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-3xl font-bold mb-4">{agentName}</h1>
        <div className="w-96 h-96 rounded-full overflow-hidden mb-6">
          <video
            ref={videoRef}
            loop
            muted
            controlsList="nodownload"
            className="w-full h-full object-cover"
          >
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="mb-8 ">
        <button
          onClick={toggleListening}
          className={`w-full py-3 rounded-lg px-4 mb-4 ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>

        </div>
        <audio ref={audioRef} className="hidden" />
        {showAlert && (
          <div className="mt-4 p-4 bg-red-600 text-white rounded-lg">
            <h3 className="font-bold">Error</h3>
            <p>There was a problem processing your speech. Please try again.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AgentTalk;