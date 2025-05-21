import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import TaskItem from "@/components/TaskItem";
import EditableTitle from "@/components/EditableTitle";

// Sample data with additional tasks
const meetingData = {
  id: "new",
  title: "Product Planning Meeting",
  date: new Date(),
  duration: 45,
  participants: [
    { id: "1", name: "Jane Smith", initials: "JS" },
    { id: "2", name: "Mark Johnson", initials: "MJ" },
    { id: "3", name: "Sarah Williams", initials: "SW" },
  ],
  languages: ["English", "Spanish"],
  keyPoints: [
    "Discussed product roadmap for Q2",
    "New mobile app features: offline mode and dark theme",
    "Need to prioritize features based on user feedback",
    "Target release date for offline mode is end of Q2",
    "Dark theme will be released in Q3",
  ],
  decisions: [
    "Offline mode will be prioritized for Q2 release",
    "Dark theme development starts in parallel but launches in Q3",
    "User testing sessions will be scheduled for both features",
  ],
  tasks: [
    {
      id: "1",
      text: "Prepare offline mode technical specifications",
      assignee: "Mark Johnson",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: "2",
      text: "Schedule user testing sessions for dark theme",
      assignee: "Sarah Williams",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    },
    {
      id: "3",
      text: "Update project timeline in JIRA",
      assignee: "Jane Smith",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
    },
    {
      id: "4",
      text: "Prepare design mockups for dark theme",
      assignee: "Alex Chen",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: "5",
      text: "Document API requirements for offline synchronization",
      assignee: "Mark Johnson",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
    },
  ],
  transcript: [
    {
      speaker: "Jane Smith",
      text: "Welcome everyone to our product planning meeting. Today we'll discuss the roadmap for Q2.",
      timestamp: "10:00:05",
    },
    {
      speaker: "Mark Johnson",
      text: "Thanks Jane. I've prepared some slides about the new features we're planning to launch.",
      timestamp: "10:00:15",
    },
    {
      speaker: "Sarah Williams",
      text: "That sounds great. I'm particularly interested in the mobile app enhancements.",
      timestamp: "10:00:30",
    },
    // Additional transcript entries would go here
  ],
};

const Summary = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [title, setTitle] = useState(meetingData.title);
  const { toast } = useToast();

  const handleExport = (format: string) => {
    toast({
      title: `Exporting as ${format}`,
      description: "Your meeting summary will be downloaded shortly.",
    });
  };

  const handleShare = (platform: string) => {
    toast({
      title: `Sharing to ${platform}`,
      description: `Meeting summary will be shared to ${platform}.`,
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    toast({
      title: "Title updated",
      description: "Meeting title has been updated successfully.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/dashboard" className="text-sm text-primary hover:text-primary-dark">
                Dashboard
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm">Meeting Summary</span>
            </div>
            <EditableTitle
              title={title}
              className="text-3xl font-bold"
              onTitleChange={handleTitleChange}
            />
            <div className="text-sm text-muted-foreground mt-1">
              {meetingData.date.toLocaleString()} · {meetingData.duration} minutes
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => handleExport("PDF")}
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => handleShare("Slack")}
            >
              Share to Slack
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={() => handleShare("Teams")}
            >
              Share to Teams
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transcript">Full Transcript</TabsTrigger>
            <TabsTrigger value="tasks">Action Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-bold mb-3">Key Points</h3>
                  <ul className="space-y-2">
                    {meetingData.keyPoints.map((point, index) => (
                      <li key={index} className="flex gap-2">
                        <div className="min-w-4 mt-1">•</div>
                        <div>{point}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-bold mb-3 text-secondary">Decisions Made</h3>
                  <ul className="space-y-2">
                    {meetingData.decisions.map((decision, index) => (
                      <li key={index} className="flex gap-2">
                        <div className="min-w-4 mt-1 text-secondary">•</div>
                        <div className="text-secondary">{decision}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-accent">Action Items</h3>
                  <Link to="/tasks">
                    <Button variant="outline" size="sm">View All Tasks</Button>
                  </Link>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto pr-2">
                  {meetingData.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} linkToTaskManager={true} />
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-3">Participants</h3>
                <div className="flex flex-wrap gap-2">
                  {meetingData.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center bg-muted rounded-full pl-1 pr-3 py-1"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-2">
                        <span className="text-xs text-white font-medium">
                          {participant.initials}
                        </span>
                      </div>
                      <span className="text-sm">{participant.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transcript">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-bold">Full Transcript</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      Original
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Translated
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {meetingData.transcript.map((entry, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{entry.speaker}</span>
                        <span className="text-xs text-muted-foreground">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p className="text-sm">{entry.text}</p>
                    </div>
                  ))}
                  
                  <div className="py-8 text-center text-muted-foreground">
                    <p>Full transcript available for download</p>
                    <Button variant="outline" className="mt-2" onClick={() => handleExport("Transcript")}>
                      Download Complete Transcript
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-accent">Action Items</h3>
                  <div>
                    <Button variant="outline" size="sm">
                      Export to Task Manager
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {meetingData.tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{task.text}</p>
                            <div className="flex flex-wrap gap-4 mt-2">
                              <span className="text-sm">
                                Assigned to: <span className="font-medium">{task.assignee}</span>
                              </span>
                              <span className="text-sm">
                                Due: <span className="font-medium">{task.deadline.toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Mark Complete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Summary;
