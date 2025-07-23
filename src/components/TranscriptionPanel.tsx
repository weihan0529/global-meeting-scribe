
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditableSpeakerName from "./EditableSpeakerName";
import { Mic, Loader2 } from "lucide-react";
const recordingGif = "/recording_icon_compressed.gif";

interface Message {
  id: string;
  speaker: string;
  speakerInitials: string;
  text: string;
  color: string;
  detectedLanguage?: string;
}

interface TranscriptionPanelProps {
  messages: Message[];
  onSpeakerNameChange?: (messageId: string, newName: string) => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  speakerColors?: { [label: string]: string };
}



const TranscriptionPanel = ({
  messages = [],
  onSpeakerNameChange,
  isRecording = false,
  isProcessing = false,
  speakerColors = {},
}: TranscriptionPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);


  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSpeakerNameChange = (messageId: string, newName: string) => {
    if (onSpeakerNameChange) {
      onSpeakerNameChange(messageId, newName);
    }
  };

  return (
    <div className="flex flex-col h-full border-r">
      {/* Section title and description moved to parent */}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {isProcessing && messages.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center relative">
              <div className="mb-2 text-5xl text-blue-500">
                <Loader2 className="animate-spin" />
              </div>
              <div className="text-muted-foreground">Processing</div>
            </div>
          ) : isRecording && messages.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center relative">
              <div className="mb-2 text-5xl text-red-500">
                {/* Replace Mic icon with GIF */}
                <img src={recordingGif} alt="Recording" style={{ width: 50, height: 50 }} />
              </div>
              <div className="text-muted-foreground">Recording</div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((message, index) => {
              const color = speakerColors[message.speaker] || 'text-gray-600';

              return (
                <div key={message.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <EditableSpeakerName
                      speakerName={message.speaker}
                      speakerInitials={message.speakerInitials}
                      color={color}

                      onNameChange={(newName) => handleSpeakerNameChange(message.id, newName)}
                    />
                  </div>
                  <p className="text-sm pl-8">
                    {message.text} <span className="text-xs text-muted-foreground">({message.detectedLanguage ? message.detectedLanguage.charAt(0).toUpperCase() + message.detectedLanguage.slice(1) : 'Unknown'})</span>
                  </p>
                  {index < messages.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No Transcription available yet. Start recording when ready.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptionPanel;
