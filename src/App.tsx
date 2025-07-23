
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Meeting from "./pages/Meeting";
import MeetingHistory from "./pages/MeetingHistory";
import MeetingDetail from "./pages/MeetingDetail";
import Summary from "./pages/Summary";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    console.log('[App] Mounted');
    return () => {
      console.log('[App] Unmounted');
    };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meeting" element={<Meeting />} />
          <Route path="/meeting-history" element={<MeetingHistory />} />
          <Route path="/meeting-detail/:meetingId" element={<MeetingDetail />} />
          <Route path="/summary/:id" element={<Summary />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;
