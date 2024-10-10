import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';

const AgentTalk = () => {
  const { id } = useParams();
  const [isTalking, setIsTalking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);
  const videoRef = useRef(null);

  const agent = {
    id: parseInt(id),
    name: "Exam Preparation Assistant",
    icon: "🎓"
  };

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

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          sendAudioToBackend(latestTranscript);
        }, 1000);
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
      if (transcript.trim()) {
        sendAudioToBackend(transcript);
      }
      videoRef.current.pause();
    }
  };

  const sendAudioToBackend = async (text) => {
    if (!text.trim()) return;
    console.log('Sending to backend:', text);
    try {
      const response = await fetch('http://localhost:8000/api/process-speech/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    } catch (error) {
      console.error('Error sending audio to backend:', error);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  return (
    <>
      <Head>
        <title>{agent.name} - Agent Talk</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-3xl font-bold mb-4">{agent.name}</h1>
        <div className="w-48 h-48 rounded-full overflow-hidden mb-6">
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
        <div className="w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Latest Transcript</h2>
          <p className="p-4 bg-gray-800 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
            {transcript || "Start talking to see your transcript here..."}
          </p>
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