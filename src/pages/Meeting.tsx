
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import TranscriptionPanel from "@/components/TranscriptionPanel";
import TranslationPanel from "@/components/TranslationPanel";
import SummaryPanel from "@/components/SummaryPanel";

// Sample data for the demo
const sampleMessages = [
  {
    id: "1",
    speaker: "Jane Smith",
    speakerInitials: "JS",
    text: "Welcome everyone to our product planning meeting. Today we'll discuss the roadmap for Q2.",
    translatedText: "Bienvenidos a todos a nuestra reunión de planificación de productos. Hoy discutiremos la hoja de ruta para el segundo trimestre.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    color: "bg-blue-500",
  },
  {
    id: "2",
    speaker: "Mark Johnson",
    speakerInitials: "MJ",
    text: "Thanks Jane. I've prepared some slides about the new features we're planning to launch.",
    translatedText: "Gracias Jane. He preparado algunas diapositivas sobre las nuevas funciones que planeamos lanzar.",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    color: "bg-emerald-500",
  },
  {
    id: "3",
    speaker: "Sarah Williams",
    speakerInitials: "SW",
    text: "That sounds great. I'm particularly interested in the mobile app enhancements.",
    translatedText: "Eso suena genial. Estoy particularmente interesada en las mejoras de la aplicación móvil.",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    color: "bg-amber-500",
  },
  {
    id: "4",
    speaker: "Mark Johnson",
    speakerInitials: "MJ",
    text: "Yes, we're planning to add offline mode and dark theme support based on user feedback.",
    translatedText: "Sí, estamos planeando añadir modo sin conexión y soporte para tema oscuro según los comentarios de los usuarios.",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    color: "bg-emerald-500",
  },
  {
    id: "5",
    speaker: "Jane Smith",
    speakerInitials: "JS",
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
    assignee: "Mark Johnson",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
  },
  {
    id: "2",
    text: "Schedule user testing sessions for dark theme",
    assignee: "Sarah Williams",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
  },
];

const Meeting = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [messages, setMessages] = useState(sampleMessages);
  const [keyPoints, setKeyPoints] = useState(sampleKeyPoints);
  const [decisions, setDecisions] = useState(sampleDecisions);
  const [tasks, setTasks] = useState(sampleTasks);
  const { toast } = useToast();

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording paused" : "Recording resumed",
      description: isRecording 
        ? "Transcription and translation paused." 
        : "Now capturing and translating speech.",
    });
  };

  const handleAddTask = () => {
    const newTaskId = (tasks.length + 1).toString();
    const newTask = {
      id: newTaskId,
      text: "New task - click to edit",
      assignee: "Unassigned",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
    };
    
    setTasks([...tasks, newTask]);
    toast({
      title: "Task added",
      description: "New task has been added to action items.",
    });
  };

  const handleSourceLanguageChange = (lang: string) => {
    setSourceLanguage(lang);
    toast({
      title: "Source language changed",
      description: `Now transcribing in ${lang.toUpperCase()}.`,
    });
  };

  const handleTargetLanguageChange = (lang: string) => {
    setTargetLanguage(lang);
    toast({
      title: "Target language changed",
      description: `Now translating to ${lang.toUpperCase()}.`,
    });
  };

  const handleEndMeeting = () => {
    // In a real app, this would save the meeting data and navigate to the summary page
    toast({
      title: "Meeting ended",
      description: "Redirecting to meeting summary...",
    });
    
    // Simulate navigating to summary page after a brief delay
    setTimeout(() => {
      window.location.href = "/summary/new";
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 flex flex-col">
        <div className="border-b bg-muted/30 p-4">
          <div className="container max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="font-bold text-xl">Product Planning Meeting</h1>
              <p className="text-sm text-muted-foreground">
                Started at {new Date().toLocaleTimeString()} · {messages.length} messages
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={toggleRecording}
                className="gap-2"
              >
                {isRecording ? "Pause" : "Resume"}
              </Button>
              <Button variant="outline" className="gap-2">
                Share
              </Button>
              <Button 
                variant="secondary"
                onClick={handleEndMeeting}
              >
                End Meeting
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-12rem)] overflow-hidden">
            <div className="h-full overflow-hidden">
              <TranscriptionPanel 
                messages={messages} 
                onLanguageChange={handleSourceLanguageChange} 
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
                onAddTask={handleAddTask}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
