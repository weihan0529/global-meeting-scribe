import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import MeetingCard from "@/components/MeetingCard";

// Mock data
const recentMeetings = [
  {
    id: "1",
    title: "Weekly Team Sync",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    duration: 45,
    participants: [
      { id: "1", name: "Jane Smith", initials: "JS" },
      { id: "2", name: "Mark Johnson", initials: "MJ" },
      { id: "3", name: "Sarah Williams", initials: "SW" },
      { id: "4", name: "Tom Wilson", initials: "TW" },
    ],
    languages: ["English", "Spanish"],
  },
  {
    id: "2",
    title: "Client Presentation",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    duration: 60,
    participants: [
      { id: "1", name: "Jane Smith", initials: "JS" },
      { id: "5", name: "Alex Rodriguez", initials: "AR" },
      { id: "6", name: "Maria Garcia", initials: "MG" },
    ],
    languages: ["English", "French"],
  },
  {
    id: "3",
    title: "Product Planning",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    duration: 90,
    participants: [
      { id: "1", name: "Jane Smith", initials: "JS" },
      { id: "2", name: "Mark Johnson", initials: "MJ" },
      { id: "7", name: "David Lee", initials: "DL" },
      { id: "8", name: "Anna Chen", initials: "AC" },
    ],
    languages: ["English", "Chinese", "German"],
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartNewMeeting = () => {
    navigate("/meeting");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="flex gap-4">
                <Button 
                  className="w-full sm:w-auto btn-primary"
                  onClick={handleStartNewMeeting}
                >
                  Start New Meeting
                </Button>
                <Button 
                  onClick={() => navigate("/tasks")}
                  variant="secondary" 
                  className="w-full sm:w-auto"
                >
                  Task Manager
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-md p-4 text-center">
                  <div className="text-3xl font-bold text-primary">12</div>
                  <div className="text-sm text-muted-foreground">Meetings</div>
                </div>
                <div className="bg-muted rounded-md p-4 text-center">
                  <div className="text-3xl font-bold text-secondary">8h</div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
                <div className="bg-muted rounded-md p-4 text-center">
                  <div className="text-3xl font-bold text-accent">24</div>
                  <div className="text-sm text-muted-foreground">Tasks</div>
                </div>
                <div className="bg-muted rounded-md p-4 text-center">
                  <div className="text-3xl font-bold">4</div>
                  <div className="text-sm text-muted-foreground">Languages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Tabs defaultValue="recent">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Meetings</h2>
              <TabsList>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="recent" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    id={meeting.id}
                    title={meeting.title}
                    date={meeting.date}
                    duration={meeting.duration}
                    participants={meeting.participants}
                    languages={meeting.languages}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-0">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No upcoming meetings scheduled.</p>
                <Button className="mt-4" onClick={handleStartNewMeeting}>
                  Schedule a Meeting
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="saved" className="mt-0">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No saved meetings yet.</p>
                <Button className="mt-4" variant="outline">
                  Browse Recent Meetings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
