import { useState, useRef, useCallback, useEffect } from 'react';
import { Transcript, Insight } from '../types';

interface UseMeetingAssistantReturn {
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  meetingActive: boolean;
  recordings: {
    transcripts: Transcript[];
    insights: Insight[];
    targetLanguage: string;
  }[];
  connect: () => void;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  setIsProcessing: (value: boolean) => void;
  changeTargetLanguage: (lang: string) => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  recordingStatus: 'stopped' | 'starting' | 'recording' | 'stopping';
  resetMeeting: () => void;
  setRecordings: React.Dispatch<React.SetStateAction<Array<{
    transcripts: Transcript[];
    insights: Insight[];
    targetLanguage: string;
  }>>>;
  wsRef: React.MutableRefObject<WebSocket | null>;
}

export const useMeetingAssistant = (): UseMeetingAssistantReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [meetingActive, setMeetingActive] = useState(false);
  const [recordings, setRecordings] = useState<Array<{
    transcripts: Transcript[];
    insights: Insight[];
    targetLanguage: string;
  }>>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [recordingStatus, setRecordingStatus] = useState<'stopped' | 'starting' | 'recording' | 'stopping'>('stopped');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset meeting state
  const resetMeeting = useCallback(() => {
    setIsConnected(false);
    setIsRecording(false);
    setIsProcessing(false);
    setMeetingActive(false);
    setRecordings([]);
    setConnectionStatus('disconnected');
    setRecordingStatus('stopped');
  }, []);

  // WebSocket connection management
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already open, skipping connect');
      return;
    }
    setConnectionStatus('connecting');
    try {
      console.log('[WebSocket] Connecting to ws://localhost:8000/ws/meeting/');
      const ws = new WebSocket('ws://localhost:8000/ws/meeting/');
      ws.onopen = () => {
        console.log('[WebSocket] Connection opened');
        setIsConnected(true);
        setMeetingActive(true);
        setConnectionStatus('connected');
      };
      ws.onmessage = (event) => {
        console.log('[WebSocket] Message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'preliminary_transcript' && data.data) {
            const transcript = {
              ...data.data,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            };
            setRecordings(prev => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                transcripts: [...updated[updated.length - 1].transcripts, transcript],
              };
              return updated;
            });
          } else if (data.type === 'enriched_transcripts' && Array.isArray(data.data?.enriched_transcripts)) {
            setRecordings(prev => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              // Use recording_id if present, otherwise default to last
              const recIdx = typeof data.recording_id === 'number' && data.recording_id >= 0 && data.recording_id < updated.length
                ? data.recording_id
                : updated.length - 1;
              updated[recIdx] = {
                ...updated[recIdx],
                transcripts: data.data.enriched_transcripts,
                insights: Array.isArray(data.insights)
                  ? [...updated[recIdx].insights, ...data.insights]
                  : updated[recIdx].insights,
              };
              return updated;
            });
            setIsProcessing(false);
            setRecordingStatus('stopped');
          } else if (data.type === 'insight') {
            setRecordings(prev => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                insights: [...updated[updated.length - 1].insights, data.insight],
              };
              return updated;
            });
          } else if (data.type === 'processing_started') {
            setIsProcessing(true);
            setRecordingStatus('stopped');
          } else if (data.error) {
            setIsProcessing(false);
            setRecordingStatus('stopped');
            console.warn('[WebSocket] Error message received:', data.error);
          }
        } catch (error) {
          setIsProcessing(false);
          setRecordingStatus('stopped');
          console.error('[WebSocket] Error parsing message:', error, event.data);
        }
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
      };
      ws.onclose = (event) => {
        console.warn('[WebSocket] Connection closed', event);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setMeetingActive(false);
        if (isRecording) {
          stopRecording();
        }
      };
      ws.onerror = (error) => {
        console.error('[WebSocket] Error occurred', error);
        setConnectionStatus('error');
        setIsConnected(false);
        setMeetingActive(false);
      };
      wsRef.current = ws;
    } catch (error) {
      setConnectionStatus('error');
      console.error('[WebSocket] Exception during connect:', error);
    }
  }, [isRecording]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnect called. isRecording:', isRecording);
    console.trace('[WebSocket] Disconnect stack trace');
    if (isRecording) {
      stopRecording();
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      console.log('[WebSocket] Closed and cleared wsRef');
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setMeetingActive(false);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    console.log('[Recording] startRecording called. isRecording:', isRecording, 'wsRef:', wsRef.current);
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[Recording] Cannot start: WebSocket not open');
      return;
    }
    if (isRecording) {
      console.warn('[Recording] Already recording');
      return;
    }
    setRecordingStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      console.log('[Recording] Microphone stream obtained', stream);
      streamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 16000, latencyHint: 'interactive' });
      audioContextRef.current = audioContext;
      await audioContext.audioWorklet.addModule('/audio-processor.js');
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
        channelCountMode: 'explicit',
        channelInterpretation: 'discrete'
      });
      audioBufferRef.current = [];
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio_data') {
          const audioChunk = event.data.data;
          audioBufferRef.current.push(audioChunk);
        }
      };
      audioWorkletNodeRef.current = workletNode;
      source.connect(workletNode);
      setIsRecording(true);
      setRecordingStatus('recording');
      // Add a new recording entry
      setRecordings(prev => ([
        ...prev,
        { transcripts: [], insights: [], targetLanguage: 'en' }
      ]));
      console.log('[Recording] Recording started');
    } catch (error) {
      setRecordingStatus('stopped');
      console.error('[Recording] Failed to start recording:', error);
      throw error;
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    console.log('[Recording] stopRecording called. isRecording:', isRecording);
    if (!isRecording) {
      console.warn('[Recording] Not recording, nothing to stop');
      return;
    }
    setRecordingStatus('stopping');
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
      console.log('[Recording] AudioWorkletNode disconnected');
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
      console.log('[Recording] AudioContext closed');
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      console.log('[Recording] MediaStream tracks stopped');
    }
    setIsRecording(false);
    setRecordingStatus('stopped');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && audioBufferRef.current.length > 0) {
      setIsProcessing(true);
      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
      }, 60000);
      const totalLength = audioBufferRef.current.reduce((sum, arr) => sum + arr.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const arr of audioBufferRef.current) {
        merged.set(arr, offset);
        offset += arr.length;
      }
      try {
        wsRef.current.send(merged.buffer);
        console.log('[Recording] Audio buffer sent to backend. Length:', merged.length);
      } catch (error) {
        setIsProcessing(false);
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
          processingTimeoutRef.current = null;
        }
        console.error('[Recording] Failed to send audio buffer:', error);
      }
      audioBufferRef.current = [];
    } else {
      console.warn('[Recording] No audio buffer to send or WebSocket not open');
    }
  }, [isRecording]);

  const changeTargetLanguage = useCallback((languageName: string) => {
    setRecordings(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        targetLanguage: languageName,
      };
      return updated;
    });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ target_language: languageName }));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // Only run on mount/unmount

  return {
    isConnected,
    isRecording,
    isProcessing,
    meetingActive,
    recordings,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    setIsProcessing,
    changeTargetLanguage,
    connectionStatus,
    recordingStatus,
    resetMeeting,
    setRecordings,
    wsRef,
  };
}; 