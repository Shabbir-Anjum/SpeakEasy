'use client'

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';

const VoiceTranscription = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const chunks = useRef([]);
  
  // Constants from AgentTalk for silence detection
  const SILENCE_THRESHOLD = -50;
  const SILENCE_DURATION = 1500;
  const silenceTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    setIsRecording(false);
    chunks.current = [];
  };

  const loadLameJs = async () => {
    if (window.lamejs) return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const convertToMp3 = async (audioBlob) => {
    // Convert to AudioBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get audio data
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Create WAV file
    const wavFile = new Float32Array(channelData);
    
    // Convert to 16-bit PCM
    const samples = new Int16Array(wavFile.length);
    for (let i = 0; i < wavFile.length; i++) {
      const s = Math.max(-1, Math.min(1, wavFile[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Create MP3 encoder
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
    const mp3Data = [];

    const sampleBlockSize = 1152;
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    // Convert to Blob
    const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
    return mp3Blob;
  };

  const initializeAudioContext = async (stream) => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    
    analyserRef.current.fftSize = 2048;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const checkVolume = () => {
      if (!isRecording) return;

      analyserRef.current.getFloatTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = 20 * Math.log10(rms);
      setVolume(Math.max(0, (db + 100) / 50));

      // Silence detection logic from AgentTalk
      if (db < SILENCE_THRESHOLD) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            stopRecording();
          }, SILENCE_DURATION);
        }
      } else {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }

      if (isRecording) {
        requestAnimationFrame(checkVolume);
      }
    };

    requestAnimationFrame(checkVolume);
  };

  const startRecording = async () => {
    try {
      await loadLameJs(); // Load lamejs before starting recording
      cleanup();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunks.current, { type: 'audio/webm' });
        try {
          const mp3Blob = await convertToMp3(audioBlob);
          await transcribeAudio(mp3Blob);
        } catch (err) {
          setError('Error converting audio: ' + err.message);
        }
        chunks.current = [];
      };

      await initializeAudioContext(stream);
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Error accessing microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (mp3Blob) => {
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', mp3Blob, 'recording.mp3');
      formData.append('model_id', 'openai/whisper-large-v3');

      const response = await fetch('https://dream-gateway.livepeer.cloud/audio-to-text', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ',
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTranscription(data.text || 'No transcription available');
    } catch (err) {
      setError('Error transcribing audio: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Voice Transcription</h2>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`p-8 rounded-full ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
            >
              {isRecording ? (
                <Square className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
            {isRecording && (
              <div className="absolute -right-12 top-1/2 -translate-y-1/2">
                <Volume2 
                  className="h-8 w-8 text-gray-400"
                  style={{
                    transform: `scale(${1 + volume * 0.5})`,
                    opacity: 0.5 + volume * 0.5
                  }}
                />
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            {isRecording 
              ? 'Recording... (Will stop automatically after silence)' 
              : isLoading 
                ? 'Converting and transcribing...'
                : 'Click to start recording'}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {transcription && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
              {transcription}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceTranscription;