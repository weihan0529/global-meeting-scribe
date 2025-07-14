
import { useEffect, useRef, useState } from "react";
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

interface Message {
  id: string;
  speaker: string;
  speakerInitials: string;
  text: string;
  timestamp: Date;
  color: string;
}

interface TranscriptionPanelProps {
  messages: Message[];
  onSpeakerNameChange?: (messageId: string, newName: string) => void;
}

const getRandomColor = () => {
  // Pick a random Tailwind color class or generate a hex color
  const tailwindColors = [
    'text-blue-600',
    'text-emerald-600',
    'text-amber-600',
    'text-fuchsia-600',
    'text-indigo-600',
    'text-rose-600',
    'text-purple-600',
    'text-cyan-600',
    'text-pink-600',
    'text-lime-600',
    'text-orange-600',
    'text-teal-600',
    'text-violet-600',
    'text-yellow-600',
];
  return tailwindColors[Math.floor(Math.random() * tailwindColors.length)];
};

const TranscriptionPanel = ({
  messages = [],
  onSpeakerNameChange,
}: TranscriptionPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistent color mapping for speaker labels
  const [speakerColors, setSpeakerColors] = useState<{ [label: string]: string }>({});

  // Assign a color to each new speaker label as it appears
  useEffect(() => {
    setSpeakerColors((prev) => {
      const updated = { ...prev };
      messages.forEach((msg) => {
        if (msg.speaker && !updated[msg.speaker]) {
          updated[msg.speaker] = getRandomColor();
        }
      });
      return updated;
    });
  }, [messages]);

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
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Transcription</h2>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message, index) => {
              const hours = message.timestamp.getHours();
              const minutes = message.timestamp.getMinutes();
              const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
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
                    <span className="text-xs text-muted-foreground">
                      {formattedTime}
                    </span>
                  </div>
                  <p className="text-sm pl-8">
                    {message.text} <span className="text-xs text-muted-foreground">(English)</span>
                  </p>
                  {index < messages.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transcription available yet. Start speaking when ready.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptionPanel;
