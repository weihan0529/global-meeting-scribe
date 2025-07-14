
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMeetingAssistant } from "@/hooks/useMeetingAssistant";
import Header from "@/components/Header";
import EditableTitle from "@/components/EditableTitle";
import TranscriptionPanel from "@/components/TranscriptionPanel";
import TranslationPanel from "@/components/TranslationPanel";
import SummaryPanel from "@/components/SummaryPanel";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Mic, MicOff, Wifi, WifiOff } from "lucide-react";

// Sample data for the demo
const sampleMessages = [
  {
    id: "1",
    speaker: "Speaker 1",
    speakerInitials: "S1",
    text: "Welcome everyone to our product planning meeting. Today we'll discuss the roadmap for Q2.",
    translatedText: "Bienvenidos a todos a nuestra reunión de planificación de productos. Hoy discutiremos la hoja de ruta para el segundo trimestre.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    color: "bg-blue-500",
  },
  {
    id: "2",
    speaker: "Speaker 2",
    speakerInitials: "S2",
    text: "Thanks Jane. I've prepared some slides about the new features we're planning to launch.",
    translatedText: "Gracias Jane. He preparado algunas diapositivas sobre las nuevas funciones que planeamos lanzar.",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    color: "bg-emerald-500",
  },
  {
    id: "3",
    speaker: "Speaker 3",
    speakerInitials: "S3",
    text: "That sounds great. I'm particularly interested in the mobile app enhancements.",
    translatedText: "Eso suena genial. Estoy particularmente interesada en las mejoras de la aplicación móvil.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    color: "bg-amber-500",
  },
  {
    id: "4",
    speaker: "Speaker 2",
    speakerInitials: "S2",
    text: "Yes, we're planning to add offline mode and dark theme support based on user feedback.",
    translatedText: "Sí, estamos planeando añadir modo sin conexión y soporte para tema oscuro según los comentarios de los usuarios.",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    color: "bg-emerald-500",
  },
  {
    id: "5",
    speaker: "Speaker 1",
    speakerInitials: "S1",
    text: "Perfect. We should also discuss the timeline for these features. I think we need to prioritize the offline mode.",
    translatedText: "Perfecto. También deberíamos discutir el cronograma para estas funciones. Creo que debemos priorizar el modo sin conexión.",
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
    color: "bg-blue-500",
  },
];

const sampleKeyPoints = [
  "Discussing product roadmap for Q2",
  "New mobile app features: offline mode and dark theme",
  "Need to prioritize features based on user feedback",
];

const sampleDecisions = [
  "Offline mode will be prioritized for Q2 release",
];

const sampleTasks = [
  {
    id: "1",
    text: "Prepare offline mode technical specifications",
    assignee: "Speaker 1",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
  },
  {
    id: "2",
    text: "Schedule user testing sessions for dark theme",
    assignee: "Speaker 2",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
  },
];

const Meeting = () => {
  // Use the meeting assistant hook
  const {
    isConnected,
    isRecording,
    transcripts,
    insights,
    connect,
    disconnect,
    connectionStatus,
    recordingStatus,
    changeTargetLanguage // <-- add this
  } = useMeetingAssistant();

  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [meetingTitle, setMeetingTitle] = useState("Product Planning Meeting");
  const { toast } = useToast();

  // Transform transcripts into the format expected by components
  const messages = transcripts.map((transcript, index) => ({
    id: index.toString(),
    speaker: transcript.speaker_label,
    speakerInitials: transcript.speaker_label.split('_')[1] || 'S',
    text: transcript.original_transcript,
    translatedText: transcript.translated_transcript,
    timestamp: new Date(transcript.timestamp),
    color: `bg-${['blue', 'emerald', 'amber', 'rose', 'purple'][index % 5]}-500`,
  }));

  // Transform insights into the format expected by components
  const keyPoints = insights
    .filter(insight => insight.data.insight_type === 'key_point')
    .map(insight => (insight.data as any).point);

  const decisions = insights
    .filter(insight => insight.data.insight_type === 'decision')
    .map(insight => (insight.data as any).decision);

  const tasks = insights
    .filter(insight => insight.data.insight_type === 'action_item')
    .map((insight, index) => ({
      id: index.toString(),
      text: (insight.data as any).task,
      assignee: (insight.data as any).assignee || 'Unassigned',
      deadline: (insight.data as any).due_date ? new Date((insight.data as any).due_date) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    }));

  // Transform messages into speakers list
  const speakers = messages.reduce((acc: { id: string, name: string }[], message) => {
    const existingSpeaker = acc.find(s => s.name === message.speaker);
    if (!existingSpeaker) {
      acc.push({ id: message.id, name: message.speaker });
    }
    return acc;
  }, []);

  const handleStartMeeting = () => {
    connect();
    toast({
      title: "Starting meeting",
      description: "Connecting to audio processing service...",
    });
  };

  const handleEndMeeting = () => {
    disconnect();
    toast({
      title: "Meeting ended",
      description: "Disconnected from audio processing service.",
    });
  };

  const handleAddTask = () => {
    toast({
      title: "Task management",
      description: "Tasks are now managed automatically by AI insights.",
    });
  };

  const handleTaskUpdate = (updatedTask: any) => {
    toast({
      title: "Task management",
      description: "Tasks are now managed automatically by AI insights.",
    });
  };


  const handleTargetLanguageChange = (lang: string) => {
    setTargetLanguage(lang);
    changeTargetLanguage(lang); // <-- send to backend
    toast({
      title: "Target language changed",
      description: `Now translating to ${lang.toUpperCase()}.`,
    });
  };



  const handleSpeakerNameChange = (messageId: string, newName: string) => {
    toast({
      title: "Speaker management",
      description: "Speaker names are now managed automatically by AI diarization.",
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setMeetingTitle(newTitle);
    toast({
      title: "Title updated",
      description: "Meeting title has been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-muted/30 p-4">
          <div className="container max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
            <div>
              <EditableTitle 
                title={meetingTitle} 
                className="font-bold text-xl" 
                onTitleChange={handleTitleChange}
              />
              <p className="text-sm text-muted-foreground">
                {isConnected ? `Connected at ${new Date().toLocaleTimeString()}` : 'Not connected'} · {transcripts.length} transcripts · {insights.length} insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {connectionStatus}
                </Badge>
                {isConnected && (
                  <Badge variant={isRecording ? "default" : "secondary"} className="gap-1">
                    {isRecording ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    {recordingStatus}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
            <div className="flex items-center gap-2">
                {!isConnected ? (
              <Button
                    onClick={handleStartMeeting}
                className="gap-2"
                    disabled={connectionStatus === 'connecting'}
              >
                    {connectionStatus === 'connecting' ? 'Connecting...' : 'Start Meeting'}
              </Button>
                ) : (
              <Button 
                variant="secondary"
                onClick={handleEndMeeting}
              >
                End Meeting
              </Button>
                )}
                <Button variant="outline" className="gap-2">
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-12rem)] overflow-hidden">
            <div className="h-full overflow-hidden">
              <TranscriptionPanel 
                messages={messages} 
                onSpeakerNameChange={handleSpeakerNameChange}
              />
            </div>
            <div className="h-full overflow-hidden">
              <TranslationPanel 
                messages={messages}
                targetLanguage={targetLanguage}
                onLanguageChange={handleTargetLanguageChange}
              />
            </div>
            <div className="h-full overflow-hidden">
              <SummaryPanel 
                keyPoints={keyPoints}
                decisions={decisions}
                tasks={tasks}
                speakers={speakers}
                onAddTask={handleAddTask}
                onTaskUpdate={handleTaskUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
