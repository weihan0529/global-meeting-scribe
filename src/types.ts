// Transcript interface for processed audio data
export interface Transcript {
  id: string; // Unique client-side ID for matching/enrichment
  speaker_label: string;
  original_transcript: string;
  translated_transcript: string;
  timestamp: string;
  detected_language?: string;
}

// Insight types based on Gemini API backend response structure
export interface KeyPoint {
  type: "insight";
  data: {
    insight_type: "key_point";
    point: string;
  };
}

export interface Decision {
  type: "insight";
  data: {
    insight_type: "decision";
    decision: string;
  };
}

export interface ActionItem {
  type: "insight";
  data: {
    insight_type: "action_item";
    task: string;
    assignee?: string;
    due_date?: string;
  };
}

// Union type for all insight types
export type Insight = KeyPoint | Decision | ActionItem;

// WebSocket message types
export interface WebSocketMessage {
  type: "transcript" | "insight" | "error" | "status";
  data?: any;
  error?: string;
  status?: string;
  target_language?: string;
}

// Audio processing status
export interface AudioStatus {
  isRecording: boolean;
  isConnected: boolean;
  error?: string;
}

// Language settings
export interface LanguageSettings {
  sourceLanguage: string;
  targetLanguage: string;
} 