
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  speaker: string;
  text: string;
  translatedText: string;
  timestamp: Date;
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
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div key={message.id} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">{message.speaker}</span>
                </div>
                <p className="text-sm pl-2 border-l-2 border-secondary">
                  {message.translatedText}
                </p>
                {index < messages.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No translation available yet.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranslationPanel;
