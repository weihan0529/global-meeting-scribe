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
        <h1 className="text-3xl font-bold mb-8">Welcome to Unisono</h1>
        
        {/* Ready to Start and Supported Languages Section */}
        <div className="my-12 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <div
              className="flex items-center justify-between rounded-2xl shadow-md px-10 py-8 mb-10 md:mb-0"
              style={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                color: 'white',
                minHeight: 120,
                maxWidth: 900,
                margin: '0 auto',
              }}
            >
              <div>
                <h2 className="text-2xl font-bold mb-2">Ready to start?</h2>
                <p className="text-base opacity-90">Launch a new meeting and let Unisono handle the rest.</p>
              </div>
              <button
                className="bg-white text-blue-600 font-semibold rounded-lg px-6 py-3 text-base shadow hover:bg-blue-50 transition"
                onClick={handleStartNewMeeting}
                style={{ minWidth: 180 }}
              >
                Start New Meeting
              </button>
            </div>
          </div>
          <div>
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-4">Supported Languages</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex items-center space-x-3">
                    <img src="https://flagcdn.com/w40/gb.png" alt="UK Flag" className="w-8 h-auto rounded-full" />
                    <span className="font-medium">English</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img src="https://flagcdn.com/w40/fr.png" alt="France Flag" className="w-8 h-auto rounded-full" />
                    <span className="font-medium">French</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img src="https://flagcdn.com/w40/es.png" alt="Spain Flag" className="w-8 h-auto rounded-full" />
                    <span className="font-medium">Spanish</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img src="https://flagcdn.com/w40/cn.png" alt="China Flag" className="w-8 h-auto rounded-full" />
                    <span className="font-medium">Chinese</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* How to Use Section */}
        <div className="my-12">
          <Card className="max-w-7xl mx-auto">
            <CardContent className="flex flex-col items-stretch p-12 min-h-[350px]">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-left">How to Use?</h2>
              </div>
              <div className="flex-1 flex justify-center items-center">
                <img
                  src="/Concept Explaination.png"
                  alt="How to Use Unisono"
                  style={{ maxWidth: '150%', height: 'auto', minWidth: 400, minHeight: 180 }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
