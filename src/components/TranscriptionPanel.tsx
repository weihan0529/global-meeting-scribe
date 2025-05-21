
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
  onLanguageChange: (language: string) => void;
  onSpeakerNameChange?: (messageId: string, newName: string) => void;
}

const speakerColors = [
  "text-blue-600",
  "text-emerald-600",
  "text-amber-600",
  "text-fuchsia-600",
  "text-indigo-600",
];

const TranscriptionPanel = ({
  messages = [],
  onLanguageChange,
  onSpeakerNameChange,
}: TranscriptionPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sourceLanguage, setSourceLanguage] = useState("en");

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLanguageChange = (value: string) => {
    setSourceLanguage(value);
    onLanguageChange(value);
  };

  const handleSpeakerNameChange = (messageId: string, newName: string) => {
    if (onSpeakerNameChange) {
      onSpeakerNameChange(messageId, newName);
    }
  };

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold mb-3">Transcription</h2>
        <div className="flex justify-between">
          <Select value={sourceLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message, index) => {
              const hours = message.timestamp.getHours();
              const minutes = message.timestamp.getMinutes();
              const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

              return (
                <div key={message.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <EditableSpeakerName
                      speakerName={message.speaker}
                      speakerInitials={message.speakerInitials}
                      color={message.color}
                      onNameChange={(newName) => handleSpeakerNameChange(message.id, newName)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {formattedTime}
                    </span>
                  </div>
                  <p className="text-sm pl-8">{message.text}</p>
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
