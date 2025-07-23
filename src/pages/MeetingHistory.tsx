import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, FileText, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface Meeting {
  _id: string;
  title: string;
  created_at: string;
  ended_at?: string;
  source_language: string;
  target_language: string;
  status: string;
}

const MeetingHistory = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/assistant/api/meetings/');
      const data = await response.json();
      
      if (data.success) {
        setMeetings(data.meetings);
      } else {
        toast({
          title: "Error",
          description: "Failed to load meeting history",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const getLanguageLabel = (code: string) => {
    const languageMap: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'zh': 'Chinese'
    };
    return languageMap[code] || code;
  };

  const handleViewMeeting = (meetingId: string) => {
    navigate(`/meeting-detail/${meetingId}`);
  };

  const handleStartNewMeeting = () => {
    navigate("/meeting");
  };

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${meetingTitle}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`http://localhost:8000/assistant/api/meetings/${meetingId}/delete/`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Success",
            description: "Meeting deleted successfully",
          });
          // Refresh the meetings list
          fetchMeetings();
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to delete meeting",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error deleting meeting:', error);
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading meeting history...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meeting History</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your past meetings
            </p>
          </div>
          <Button onClick={handleStartNewMeeting} className="bg-blue-600 hover:bg-blue-700">
            Start New Meeting
          </Button>
        </div>

        {meetings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first meeting to see it here
              </p>
              <Button onClick={handleStartNewMeeting}>
                Start Your First Meeting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {meetings.map((meeting) => (
              <Card key={meeting._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{meeting.title}</CardTitle>
                                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(meeting.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {getLanguageLabel(meeting.source_language)} → {getLanguageLabel(meeting.target_language)}
                          </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={meeting.status === 'active' ? 'default' : 'secondary'}>
                        {meeting.status === 'active' ? 'Active' : 'Completed'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMeeting(meeting._id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMeeting(meeting._id, meeting.title)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MeetingHistory; 