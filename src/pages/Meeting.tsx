import { useState, useEffect, useRef } from "react";
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

// Reminder: Run `npm install jspdf html2canvas` in your project root before using export functionality
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


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
  } = useMeetingAssistant();

  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [meetingTitle, setMeetingTitle] = useState("Please Enter Your Meeting Title Here");
  const { toast } = useToast();
  const prevProcessingRef = useRef(isProcessing);
  useEffect(() => {
    if (prevProcessingRef.current && !isProcessing) {
      toast({
        title: "Analysis completed!",
        description: "Your meeting analysis is ready.",
      });
    }
    prevProcessingRef.current = isProcessing;
  }, [isProcessing, toast]);

  useEffect(() => {
    console.log('[Meeting] Mounted');
    return () => {
      console.log('[Meeting] Unmounted');
    };
  }, []);

  // Centralized speaker color mapping for all recordings
  const [speakerColors, setSpeakerColors] = useState<{ [label: string]: string }>({});
  useEffect(() => {
    const updated: { [label: string]: string } = {};
    recordings.forEach((rec) => {
      rec.transcripts.forEach((t) => {
        if (t.speaker_label && !updated[t.speaker_label]) {
          const colors = [
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
          updated[t.speaker_label] = colors[Object.keys(updated).length % colors.length];
        }
      });
    });
    setSpeakerColors(updated);
  }, [recordings]);

  // Instead of separate ai/user arrays, keep a single array for each insight type
  const [keyPoints, setKeyPoints] = useState<{ text: string; source: 'ai' | 'user' }[]>([]);
  const [decisions, setDecisions] = useState<{ text: string; source: 'ai' | 'user' }[]>([]);
  const [tasks, setTasks] = useState<{ id: string; text: string; assignee?: string; deadline?: Date; source: 'ai' | 'user' }[]>([]);

  // When AI generates new insights, append them with source: 'ai'
  useEffect(() => {
    // Extract AI insights from recordings
    const allInsights = recordings.flatMap(r => r.insights);
    const aiKeyPoints = allInsights.filter(insight => insight.data.insight_type === 'key_point').map(insight => ({
      text: (insight.data as any).point,
      source: 'ai' as const
    }));
    const aiDecisions = allInsights.filter(insight => insight.data.insight_type === 'decision').map(insight => ({
      text: (insight.data as any).decision,
      source: 'ai' as const
    }));
    const aiTasks = allInsights.filter(insight => insight.data.insight_type === 'action_item').map((insight, index) => ({
      id: (insight.data as any).id || `${Date.now()}-${index}`,
      text: (insight.data as any).task,
      assignee: (insight.data as any).assignee || 'Unassigned',
      deadline: (insight.data as any).due_date ? new Date((insight.data as any).due_date) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      source: 'ai' as const
    }));

    // Only add new AI items that are not already present (by text for keyPoints/decisions, by id for tasks)
    setKeyPoints(prev => {
      const aiTexts = aiKeyPoints.map(kp => kp.text);
      const prevAiTexts = prev.filter(kp => kp.source === 'ai').map(kp => kp.text);
      if (JSON.stringify(aiTexts) === JSON.stringify(prevAiTexts)) return prev;
      // Remove all previous AI items, keep user ones, then append new AI ones
      const userItems = prev.filter(kp => kp.source === 'user');
      return [...userItems, ...aiKeyPoints];
    });
    setDecisions(prev => {
      const aiTexts = aiDecisions.map(d => d.text);
      const prevAiTexts = prev.filter(d => d.source === 'ai').map(d => d.text);
      if (JSON.stringify(aiTexts) === JSON.stringify(prevAiTexts)) return prev;
      const userItems = prev.filter(d => d.source === 'user');
      return [...userItems, ...aiDecisions];
    });
    setTasks(prev => {
      const aiIds = aiTasks.map(t => t.id);
      const prevAiIds = prev.filter(t => t.source === 'ai').map(t => t.id);
      if (JSON.stringify(aiIds) === JSON.stringify(prevAiIds)) return prev;
      const userItems = prev.filter(t => t.source === 'user');
      return [...userItems, ...aiTasks];
    });
  }, [recordings]);

  // Handlers for user additions/edits
  const handleKeyPointsChange = (items: { text: string; source: 'ai' | 'user' }[]) => setKeyPoints(items);
  const handleDecisionsChange = (items: { text: string; source: 'ai' | 'user' }[]) => setDecisions(items);
  const handleTasksChange = (items: { id: string; text: string; assignee?: string; deadline?: Date; source: 'ai' | 'user' }[]) => setTasks(items);

  // Gather all speakers for summary
  const speakers = recordings.flatMap((rec, recIdx) => rec.transcripts.map((transcript, idx) => ({
    id: `${recIdx}-${idx}`,
    name: transcript.speaker_label
  }))).filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);

  const handleStartMeeting = () => {
    console.log('[UI] handleStartMeeting called');
    
    // Connect first, then send message when connection is ready
    connect();
    
    // Wait for connection to be established before sending message
    const checkConnection = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('[UI] WebSocket connected, sending start_meeting message');
        wsRef.current.send(JSON.stringify({
          type: 'start_meeting',
          title: meetingTitle,
          source_language: sourceLanguage,
          target_language: targetLanguage
        }));
      } else {
        // Retry after a short delay
        setTimeout(checkConnection, 100);
      }
    };
    
    // Start checking for connection
    setTimeout(checkConnection, 100);
    
    toast({
      title: "Starting meeting",
      description: "Connecting to audio processing service...",
    });
  };

  const handleEndMeeting = () => {
    console.log('[UI] handleEndMeeting called');
    
    // Send meeting end message to backend before disconnecting
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('[UI] Sending end_meeting message');
      
      // Send the message and wait for it to be sent before disconnecting
      try {
        wsRef.current.send(JSON.stringify({
          type: 'end_meeting'
        }));
        
        // Wait longer to ensure the message is processed
        setTimeout(() => {
          console.log('[UI] Disconnecting after end_meeting message');
          disconnect();
        }, 1000);
      } catch (error) {
        console.error('[UI] Error sending end_meeting message:', error);
        disconnect();
      }
    } else {
      console.log('[UI] WebSocket not open, disconnecting immediately');
      disconnect();
    }
    
    toast({
      title: "Meeting ended",
      description: "Meeting data has been saved. You can view it in Meeting History.",
    });
  };

  const handleAddTask = () => {
    toast({
      title: "Task management",
      description: "Tasks are now managed automatically by AI insights.",

    });
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task
      )
    );
    toast({
      title: "Action item updated successfully",
    });
  };


  const handleTargetLanguageChange = (lang: string) => {
    setTargetLanguage(lang);
    // Send per-recording translation request to backend (assume recording ID '0' for now)
    if (isConnected && window['wsRef'] && window['wsRef'].current && window['wsRef'].current.readyState === 1) {
      window['wsRef'].current.send(JSON.stringify({
        type: 'retranslate',
        recording_id: '0',
        target_language: lang
      }));
    } else {
      changeTargetLanguage(lang); // fallback to old logic
    }
    toast({
      title: "Target language changed",
      description: `Now translating to ${lang.toUpperCase()}.`,
    });
  };

  // Per-recording language change handler
  const handleRecordingLanguageChange = (recIdx: number, lang: string) => {
    // Update the correct recording's targetLanguage in state
    setRecordings(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[recIdx] = {
        ...updated[recIdx],
        targetLanguage: lang,
      };
      return updated;
    });
    // Always send a retranslate message for the correct recording
    if (isConnected && wsRef && wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({
        type: 'retranslate',
        recording_id: recIdx,
        target_language: lang
      }));
    }
    // Optionally, show a toast
    toast({
      title: "Target language changed",
      description: `Now translating Recording ${recIdx + 1} to ${lang.toUpperCase()}.`,
    });
  };

  const handleSpeakerNameChange = (messageId: string, newName: string) => {
    toast({
      title: "Speaker management",
      description: "Speaker names are now managed automatically by AI diarization.",

    });
  };

  const handleTitleChange = (newTitle: string) => {
    if (!newTitle.trim()) {
      toast({
        title: "Invalid title",
        description: "Meeting title cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    setMeetingTitle(newTitle);
    // Send title update to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_meeting_title',
        title: newTitle
      }));
    }
    toast({
      title: "Title updated",
      description: "Meeting title has been updated successfully.",
    });
  };

  const UNISONO_LOGO_BASE64 = 'data:image/png;base64,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'; // (truncated for brevity, insert full base64 string)

  const handleExportClick = async () => {
    try {
      // Create a new PDF document
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Helper to add logo to top right of current page
      const addLogoTopRight = () => {
        const logoSize = 35;
        pdf.addImage(UNISONO_LOGO_BASE64, 'PNG', pageWidth - margin - logoSize, margin, logoSize, logoSize);
      };
      addLogoTopRight();

      // Meeting title (left-aligned, bold)
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      const titleText = meetingTitle || 'Meeting Transcript';
      pdf.text(titleText, margin, yPosition + 30);
      yPosition += 50;

      // Date and Time (renamed)
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'normal');
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      pdf.text(`Generated Date: ${dateStr}`, margin, yPosition);
      yPosition += 20;
      pdf.text(`Generated Time: ${timeStr}`, margin, yPosition);
      yPosition += 20;
      pdf.text(`Total Recordings: ${recordings.length}`, margin, yPosition);
      yPosition += 20;
      pdf.text(`Total Transcripts: ${recordings.reduce((acc, r) => acc + r.transcripts.length, 0)}`, margin, yPosition);
      yPosition += 20;

      // Long horizontal line
      pdf.setDrawColor(100);
      pdf.setLineWidth(1);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 20;

      // Process each recording
      for (let recIdx = 0; recIdx < recordings.length; recIdx++) {
        const recording = recordings[recIdx];
        // Add logo to new page if needed
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
          addLogoTopRight();
        }
        // Add recording header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Recording ${recIdx + 1}`, margin, yPosition);
        yPosition += 25;
        // Add target language info
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Target Language: ${recording.targetLanguage.toUpperCase()}`, margin, yPosition);
        yPosition += 20;
        // Process transcripts
        for (let transIdx = 0; transIdx < recording.transcripts.length; transIdx++) {
          const transcript = recording.transcripts[transIdx];
          if (yPosition > pageHeight - 150) {
            pdf.addPage();
            yPosition = margin;
            addLogoTopRight();
          }
          // Speaker info
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          const speakerText = `Speaker: ${transcript.speaker_label}`;
          pdf.text(speakerText, margin, yPosition);
          yPosition += 20;
          // Original transcript
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          const originalText = `Original (${transcript.detected_language || 'Unknown'}): ${transcript.original_transcript}`;
          const originalLines = pdf.splitTextToSize(originalText, contentWidth);
          pdf.text(originalLines, margin, yPosition);
          yPosition += (originalLines.length * 15) + 10;
          // Translated transcript (if different from original)
          if (transcript.translated_transcript && transcript.translated_transcript !== transcript.original_transcript) {
            const translatedText = `Translation (${recording.targetLanguage.toUpperCase()}): ${transcript.translated_transcript}`;
            const translatedLines = pdf.splitTextToSize(translatedText, contentWidth);
            pdf.text(translatedLines, margin, yPosition);
            yPosition += (translatedLines.length * 15) + 10;
          }
          // Dotted line between transcripts (except after last transcript)
          if (transIdx < recording.transcripts.length - 1) {
            yPosition += 5;
            pdf.setLineWidth(0.5);
            pdf.setDrawColor(150);
            let x = margin;
            while (x < pageWidth - margin) {
              pdf.line(x, yPosition, x + 5, yPosition, 'S');
              x += 10;
            }
            yPosition += 15;
          }
        }
        // Horizontal line between recordings (except after last recording)
        if (recIdx < recordings.length - 1) {
          yPosition += 10;
          pdf.setDrawColor(100);
          pdf.setLineWidth(1);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 20;
        }
      }
      // Horizontal line after all recordings
      yPosition += 10;
      pdf.setDrawColor(100);
      pdf.setLineWidth(1);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 40;

      // --- Live Summary (All Insights) Section ---
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Live Summary', margin, yPosition);
      yPosition += 25;

      // Key Points
      if (keyPoints.length > 0) {
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Key Points:', margin, yPosition);
        yPosition += 18;
        pdf.setFont('helvetica', 'normal');
        keyPoints.forEach((kp, idx) => {
          const lines = pdf.splitTextToSize(`• ${kp.text}`, contentWidth);
          pdf.text(lines, margin + 10, yPosition);
          yPosition += lines.length * 15;
          if (yPosition > pageHeight - 50) { pdf.addPage(); yPosition = margin; }
        });
        yPosition += 8;
      }
      // Decisions
      if (decisions.length > 0) {
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Decisions Made:', margin, yPosition);
        yPosition += 18;
        pdf.setFont('helvetica', 'normal');
        decisions.forEach((d, idx) => {
          const lines = pdf.splitTextToSize(`• ${d.text}`, contentWidth);
          pdf.text(lines, margin + 10, yPosition);
          yPosition += lines.length * 15;
          if (yPosition > pageHeight - 50) { pdf.addPage(); yPosition = margin; }
        });
        yPosition += 8;
      }
      // Action Items
      if (tasks.length > 0) {
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Action Items:', margin, yPosition);
        yPosition += 18;
        pdf.setFont('helvetica', 'normal');
        tasks.forEach((t, idx) => {
          // Main action item text
          const lines = pdf.splitTextToSize(`• ${t.text}`, contentWidth);
          pdf.text(lines, margin + 10, yPosition);
          yPosition += lines.length * 15;

          // Assignee and due date (if present)
          let details = [];
          if (t.assignee) details.push(`Assignee: ${t.assignee}`);
          if (t.deadline) {
            const dateStr = typeof t.deadline === 'string'
              ? new Date(t.deadline).toLocaleDateString()
              : t.deadline.toLocaleDateString();
            details.push(`Due: ${dateStr}`);
          }
          if (details.length > 0) {
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'italic');
            pdf.text(details.join('   '), margin + 30, yPosition);
            yPosition += 15;
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'normal');
          }

          if (yPosition > pageHeight - 50) { pdf.addPage(); yPosition = margin; }
        });
        yPosition += 8;
      }
      // --- End Live Summary ---

      // Thank you message and logo (as before)
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const thankYou = 'Thank you for using Unisono!';
      const thankYouWidth = pdf.getTextWidth(thankYou);
      pdf.text(thankYou, (pageWidth - thankYouWidth) / 2, yPosition);
      yPosition += 30;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const feedback = 'If you have any feedback or suggestions, please email us at jordangan0710@gmail.com.';
      const feedbackWidth = pdf.getTextWidth(feedback);
      pdf.text(feedback, (pageWidth - feedbackWidth) / 2, yPosition);
      yPosition += 30;
      // Centered logo below thank you message
      const logoSizeEnd = 80;
      pdf.addImage(UNISONO_LOGO_BASE64, 'PNG', (pageWidth - logoSizeEnd) / 2, yPosition, logoSizeEnd, logoSizeEnd);
      yPosition += logoSizeEnd + 20;
      // Save the PDF
      pdf.save(`${meetingTitle || 'meeting'}_${now.toISOString().split('T')[0]}.pdf`);
      toast({
        title: 'Exported!',
        description: 'Your meeting has been exported as a PDF with all content.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // UI for recording and processing
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
                {isConnected ? `Connected at ${new Date().toLocaleTimeString()}` : 'Not connected'} · {recordings.reduce((acc, r) => acc + r.transcripts.length, 0)} transcripts · {keyPoints.length + decisions.length + tasks.length} insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {connectionStatus}
                </Badge>
                {meetingActive && (
                  <Badge variant={isRecording ? "default" : "secondary"} className="gap-1">
                    {isRecording ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    {recordingStatus}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
            <div className="flex items-center gap-2">
                {!meetingActive ? (
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
                {/* Start/End Record button always visible */}
                <Button
                  onClick={async () => {
                    console.log('[UI] Record button clicked. isRecording:', isRecording, 'meetingActive:', meetingActive, 'isProcessing:', isProcessing);
                    if (!isRecording) {
                      try {
                        await startRecording();
                        console.log('[UI] startRecording resolved');
                      } catch (error) {
                        console.error('[UI] Failed to start recording:', error);
                        toast({
                          title: "Recording failed",
                          description: "Could not start recording. Please check microphone permissions.",
                        });
                      }
                    } else {
                      stopRecording();
                      console.log('[UI] stopRecording called');
                      toast({
                        title: "Processing analysis...",
                        description: "Your audio is being analyzed. Please wait.",
                      });
                    }
                  }}
                  disabled={!meetingActive || isProcessing}
                  variant={isRecording ? "destructive" : "default"}
                >
                  {isRecording ? 'End Record' : 'Start Record'}
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleExportClick}>
                  Export
                </Button>
              </div>

            </div>
          </div>
        </div>
        
        <div id="meeting-main-container" className="flex-1 container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-12rem)] overflow-hidden">
            {/* Transcription Column */}
            <div className="h-full overflow-hidden border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold text-center">English Transcription</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recordings.length === 0 ? (
                  <div className="flex flex-col items-center" style={{ paddingTop: '48px' }}>
                    <div className="text-muted-foreground text-sm text-center">
                      No Transcription available yet. Start recording when ready.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-8 pt-8">
                    {recordings.map((rec, idx) => {
                      const messages = rec.transcripts.map((transcript, tIdx) => ({
                        id: `${idx}-${tIdx}`,
                        speaker: transcript.speaker_label,
                        speakerInitials: transcript.speaker_label.split('_')[1] || 'S',
                        text: transcript.original_transcript,
                        translatedText: transcript.translated_transcript,
                        color: speakerColors[transcript.speaker_label] || 'text-gray-600',
                        detectedLanguage: transcript.detected_language || '',
                      }));
                      return (
                        <div key={idx} className="border rounded-lg relative bg-white w-full max-w-xl mx-auto">
                          <div className="flex flex-col pt-4 pb-2">
                            <span className="font-semibold text-left pl-6">Recording {idx + 1}</span>
                            <div className="w-full flex justify-center mt-2 mb-2">
                              <div className="w-11/12 border-t border-gray-200"></div>
                            </div>
                          </div>
                          <TranscriptionPanel
                            messages={messages}
                            onSpeakerNameChange={handleSpeakerNameChange}
                            isRecording={isRecording && idx === recordings.length - 1}
                            isProcessing={isProcessing && idx === recordings.length - 1}
                            speakerColors={speakerColors}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {/* Translation Column */}
            <div className="h-full overflow-hidden border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold text-center">Translation</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recordings.length === 0 ? (
                  <div className="flex flex-col items-center" style={{ paddingTop: '48px' }}>
                    <div className="text-muted-foreground text-sm text-center">
                      No Translation available yet. Start recording when ready.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-8 pt-8">
                    {recordings.map((rec, idx) => {
                      const messages = rec.transcripts.map((transcript, tIdx) => ({
                        id: `${idx}-${tIdx}`,
                        speaker: transcript.speaker_label,
                        speakerInitials: transcript.speaker_label.split('_')[1] || 'S',
                        text: transcript.original_transcript,
                        translatedText: transcript.translated_transcript,
                        timestamp: new Date(transcript.timestamp),
                        color: speakerColors[transcript.speaker_label] || 'text-gray-600',
                      }));
                      return (
                        <div key={idx} className="border rounded-lg relative bg-white w-full max-w-xl mx-auto">
                          {/* Title and dropdown on the same row, divider below */}
                          <div className="flex flex-row items-center justify-between pt-4 pb-2 px-4">
                            <span className="font-semibold">Recording {idx + 1}</span>
                            <select
                              value={rec.targetLanguage}
                              onChange={e => handleRecordingLanguageChange(idx, e.target.value)}
                              disabled={isRecording || isProcessing}
                              className="w-32 border rounded px-2 py-1 ml-4"
                            >
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
                              <option value="fr">French</option>
                              <option value="zh">Chinese</option>
                            </select>
                          </div>
                          <div className="w-full flex justify-center mb-2">
                            <div className="w-11/12 border-t border-gray-200"></div>
                          </div>
                          <TranslationPanel
                            messages={messages}
                            targetLanguage={rec.targetLanguage}
                            onLanguageChange={lang => handleRecordingLanguageChange(idx, lang)}
                            isRecording={isRecording && idx === recordings.length - 1}
                            isProcessing={isProcessing && idx === recordings.length - 1}
                            speakerColors={speakerColors}
                            isAnyRecordingOrProcessing={isRecording || isProcessing}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {/* Live Summary Column */}
            <div className="h-full overflow-hidden flex flex-col">
              <div className="flex-1 flex flex-col justify-center items-center">
                <SummaryPanel
                  keyPoints={keyPoints}
                  decisions={decisions}
                  tasks={tasks}
                  speakers={speakers}
                  onAddTask={handleAddTask}
                  onTaskUpdate={handleTaskUpdate}
                  onKeyPointsChange={handleKeyPointsChange}
                  onDecisionsChange={handleDecisionsChange}
                  onTasksChange={handleTasksChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
