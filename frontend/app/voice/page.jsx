'use client'

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TextToSpeech = () => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);

  const XI_API_KEY = process.env.NEXT_PUBLIC_XI_API_KEY;

  useEffect(() => {
    fetchVoices();
    initializeSpeechRecognition();
  }, []);

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
        setSelectedVoice(response.data.voices[0].voice_id);
        console.log(response.data.voices[3].voice_id)
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      setError('Failed to fetch voices. Please try again.');
    }
  };

  const initializeSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setText(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError('Speech recognition error. Please try again.');
        setIsListening(false);
      };
    } else {
      setError('Speech recognition is not supported in this browser.');
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const handleVoiceChange = (e) => {
    setSelectedVoice(e.target.value);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setError('');
    }
  };
console.log(selectedVoice,'voiceid')
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      setError('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-4">Text-to-Speech</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="voice" className="block text-sm font-medium text-gray-700">
            Select Voice
          </label>
          <select
            id="voice"
            value={selectedVoice}
            onChange={handleVoiceChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            {voices.map((voice) => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="text" className="block text-sm font-medium text-gray-700">
            Enter Text or Speak
          </label>
          <div className="flex items-center">
            <textarea
              id="text"
              value={text}
              onChange={handleTextChange}
              rows="4"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter the text you want to convert to speech"
            ></textarea>
            <button
              type="button"
              onClick={toggleListening}
              className={`ml-2 p-2 rounded-full ${isListening ? 'bg-red-500' : 'bg-blue-500'} text-white`}
            >
              {isListening ? '🛑' : '🎤'}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Speech'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default TextToSpeech;