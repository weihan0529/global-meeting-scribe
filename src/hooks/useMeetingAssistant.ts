import { useState, useRef, useCallback, useEffect } from 'react';
import { Transcript, Insight } from '../types';

interface UseMeetingAssistantReturn {
  // State
  isConnected: boolean;
  isRecording: boolean;
  transcripts: Transcript[];
  insights: Insight[];
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  
  // Status
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  recordingStatus: 'stopped' | 'starting' | 'recording' | 'stopping';
}

export const useMeetingAssistant = (): UseMeetingAssistantReturn & { changeTargetLanguage: (lang: string) => void } => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [recordingStatus, setRecordingStatus] = useState<'stopped' | 'starting' | 'recording' | 'stopping'>('stopped');

  // Refs for persistent instances
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // WebSocket connection management
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionStatus('connecting');
    
    try {
      // Connect to Django Channels WebSocket
      const ws = new WebSocket('ws://localhost:8000/ws/meeting/');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Automatically start recording after successful connection
        startRecording().catch(error => {
          console.error('Failed to start recording after connection:', error);
        });
      };

      ws.onmessage = (event) => {
        // 1. Log the raw data
        console.log('[FRONTEND<-BACKEND] Raw message received:', event.data);
        
        try {
          const data = JSON.parse(event.data);
          // 2. Log the parsed object
          console.log('[FRONTEND] Parsed data object:', data);

          // --- Robust message handling for transcript enrichment ---
          if (data.type === 'preliminary_transcript' && data.data) {
            // Assign a unique client-side ID
            const transcript = {
              ...data.data,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            };
            setTranscripts(prev => [...prev, transcript]);
          } else if (data.type === 'enriched_transcripts' && Array.isArray(data.data?.enriched_transcripts)) {
            // Replace the entire transcript list with the enriched transcripts from the backend
            setTranscripts(data.data.enriched_transcripts);
            // Optionally handle insights
            if (Array.isArray(data.insights)) {
              setInsights(prev => [...prev, ...data.insights]);
            }
          } else if (data.type === 'insight') {
            setInsights(prev => [...prev, data.insight]);
          } else if (data.error) {
            console.error('Backend error:', data.error);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Stop recording when connection is lost
        if (isRecording) {
          stopRecording();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [isRecording]);

  // Audio recording management
  const startRecording = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot start recording: not connected to WebSocket');
      return;
    }

    if (isRecording) {
      console.warn('Already recording');
      return;
    }

    setRecordingStatus('starting');

    try {
      // Request microphone access with specific audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      streamRef.current = stream;

      // Create AudioContext for high-performance audio processing
      const audioContext = new AudioContext({
        sampleRate: 16000,
        latencyHint: 'interactive'
      });
      
      audioContextRef.current = audioContext;

      // Load the AudioWorklet processor
      await audioContext.audioWorklet.addModule('/audio-processor.js');

      // Create audio source from the stream
      const source = audioContext.createMediaStreamSource(stream);

      // Create AudioWorklet node
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0, // We don't need output, just processing
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'discrete'
      });

      // Handle audio data from the worklet
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio_data' && wsRef.current?.readyState === WebSocket.OPEN) {
          // Send Float32Array data directly as binary
          const audioBuffer = event.data.data;
          wsRef.current.send(audioBuffer.buffer);
        }
      };

      audioWorkletNodeRef.current = workletNode;

      // Connect the audio graph
      source.connect(workletNode);
      // workletNode.connect(audioContext.destination); // Removed: cannot connect node with 0 outputs

      console.log('Recording started with AudioWorklet');
      setIsRecording(true);
      setRecordingStatus('recording');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingStatus('stopped');
      throw error;
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (!isRecording) {
      return;
    }

    setRecordingStatus('stopping');
    
    // Disconnect and cleanup AudioWorklet
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    
    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    console.log('Recording stopped');
    setIsRecording(false);
    setRecordingStatus('stopped');
  }, [isRecording]);

  // New: Send language change to backend
  const changeTargetLanguage = useCallback((languageName: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ target_language: languageName }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    isConnected,
    isRecording,
    transcripts,
    insights,
    
    // Actions
    connect,
    disconnect,
    startRecording,
    stopRecording,
    
    // Status
    connectionStatus,
    recordingStatus,
    // New action
    changeTargetLanguage,
  };
}; 