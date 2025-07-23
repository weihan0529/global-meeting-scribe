
import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Transcript } from "@/types";
import { Mic, Loader2 } from "lucide-react";
const recordingGif = "/recording_icon_compressed.gif";


interface Message {
  id: string;
  speaker: string;
  speakerInitials: string;
  text: string;
  translatedText: string;
  timestamp: Date;
  color: string;

}

interface TranslationPanelProps {
  messages: Message[];
  targetLanguage: string;
  onLanguageChange: (language: string) => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  speakerColors?: { [label: string]: string };
  // New prop for global lock state
  isAnyRecordingOrProcessing?: boolean;
}

const TranslationPanel = ({
  messages = [],
  targetLanguage = "en",
  onLanguageChange,
  isRecording = false,
  isProcessing = false,
  speakerColors = {},
  isAnyRecordingOrProcessing = false,
}: TranslationPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLanguageChange = (value: string) => {
    onLanguageChange(value);
  };

  // Determine if dropdown should be disabled
  const isDropdownDisabled = isAnyRecordingOrProcessing || isRecording || isProcessing;

  return (
    <div className="flex flex-col h-full border-r">
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
          ) : messages.length === 0 ? null : (
            messages.map((message, idx) => {
              // Assign badge color based on speaker index (cycle through 4 colors)
              const badgeColors = [
                'bg-blue-600',
                'bg-emerald-500', // mint green
                'bg-purple-600',
                'bg-gray-500',
              ];
              // Find a stable index for the speaker label
              const speakerLabels = Array.from(new Set(messages.map(m => m.speaker)));
              const speakerIdx = speakerLabels.indexOf(message.speaker) % badgeColors.length;
              const badgeColor = badgeColors[speakerIdx];
              return (
                <Card key={message.id} className={`border-l-4`} style={{ borderLeftColor: `var(--${badgeColor})`, borderLeftWidth: '4px', background: 'white' }}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-xs ${badgeColor} text-white rounded px-2 py-1 font-semibold`}>
                            {message.speaker}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {message.text}
                          </p>
                          {message.translatedText && message.translatedText !== message.text && (
                            <p className="text-sm font-medium">
                              {message.translatedText}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranslationPanel;
