'use client'
import React, { useState, useRef, useEffect } from 'react';

const SpeechRecognitionApp = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
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
        timeoutRef.current = setTimeout(() => {
          sendTranscriptToBackend(latestTranscript);
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
      setTranscript('');
    } else {
      recognitionRef.current.stop();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (transcript.trim()) {
        sendTranscriptToBackend(transcript);
      }
    }
  };

  const sendTranscriptToBackend = async (text) => {
    if (!text.trim()) return;
    
    console.log('Sending transcript to backend:', text);
    
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
      
      console.log('Successfully sent transcript to backend');
    } catch (error) {
      console.error('Error sending transcript to backend:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          Speech Recognition Demo
        </h1>
        
        <button
          onClick={toggleListening}
          className={`w-full py-3 rounded-lg mb-4 ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>

        <div className="bg-gray-700 rounded-lg p-4">
          <h2 className="text-white font-semibold mb-2">Transcript:</h2>
          <p className="text-gray-200 min-h-[100px] whitespace-pre-wrap">
            {transcript || "Start speaking to see transcript..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpeechRecognitionApp;