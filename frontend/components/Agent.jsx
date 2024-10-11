import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import axios from 'axios';

const AgentTalk = () => {
  const { id } = useParams();
  const [isTalking, setIsTalking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Xb7hH8MSUJpSbSDYk0k2');
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);
  const videoRef = useRef(null);
  const agentId = localStorage.getItem("currentAgentId");
  const storedAgentName = localStorage.getItem('currentAgentName');
  const storedVoiceId = localStorage.getItem('selectedVoiceId');
  const XI_API_KEY = process.env.NEXT_PUBLIC_XI_API_KEY;

  useEffect(() => {
    sendAudioToBackend('hello')

    setAgentName(storedAgentName || "unknown");
    setSelectedVoice(storedVoiceId || "Xb7hH8MSUJpSbSDYk0k2");

    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const latestResult = event.results[event.results.length - 1];
        const latestTranscript = latestResult[0].transcript;
        setTranscript(latestTranscript);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (latestResult.isFinal) {
          sendAudioToBackend(latestTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        if (isTalking) {
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
  }, [isTalking]);

  const toggleTalking = () => {
    setIsTalking(prevState => !prevState);
    if (!isTalking) {
      recognitionRef.current.start();
      setTranscript('');
      videoRef.current.play();
    } else {
      recognitionRef.current.stop();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      videoRef.current.pause();
    }
  };

  const sendAudioToBackend = async (text) => {
    if (!text.trim()) return;
    console.log('Sending to backend:', text);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/api/console/sync/${agentId}/`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "insomnia/9.3.2"
        },
        body: JSON.stringify({ "human_text": text }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      console.log(responseData.ai_text);
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
            'xi-api-key': XI_API_KEY,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
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
            className="w-full h-full object-cover"
          >
            <source src="/video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="mb-8">
          <button
            onClick={toggleTalking}
            className={`px-6 py-3 rounded-full ${
              isTalking ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-300`}
          >
            {isTalking ? 'Stop Talking' : 'Start Talking'}
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