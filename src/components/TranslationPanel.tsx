
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
}

const TranslationPanel = ({
  messages = [],
  targetLanguage = "es",
  onLanguageChange,
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

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold mb-3">Translation</h2>
        <Select value={targetLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Target Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>

          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {message.speakerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {message.speaker}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {message.text}
                      </p>
                      <p className="text-sm font-medium">
                  {message.translatedText}
                </p>
                    </div>
              </div>
            </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranslationPanel;
