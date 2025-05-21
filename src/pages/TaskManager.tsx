
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  text: string;
  assignee: string;
  deadline: Date;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed";
  meetingId?: string;
  meetingTitle?: string;
}

// Sample data
const sampleTasks: Task[] = [
  {
    id: "1",
    text: "Prepare offline mode technical specifications",
    assignee: "Mark Johnson",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    priority: "high",
    status: "pending",
    meetingId: "new",
    meetingTitle: "Product Planning Meeting",
  },
  {
    id: "2",
    text: "Schedule user testing sessions for dark theme",
    assignee: "Sarah Williams",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
    priority: "medium",
    status: "pending",
    meetingId: "new",
    meetingTitle: "Product Planning Meeting",
  },
  {
    id: "3",
    text: "Update project timeline in JIRA",
    assignee: "Jane Smith",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1), // 1 day from now
    priority: "medium",
    status: "in-progress",
    meetingId: "new",
    meetingTitle: "Product Planning Meeting",
  },
  {
    id: "4",
    text: "Research competitive products for market analysis",
    assignee: "Mark Johnson",
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
    priority: "low",
    status: "in-progress",
    meetingId: "123",
    meetingTitle: "Market Research Meeting",
  },
];

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const { toast } = useToast();

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus as "pending" | "in-progress" | "completed" }
          : task
      )
    );

    toast({
      title: "Status updated",
      description: "Task status has been updated.",
    });
  };

  const handlePriorityChange = (taskId: string, newPriority: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, priority: newPriority as "high" | "medium" | "low" }
          : task
      )
    );

    toast({
      title: "Priority updated",
      description: "Task priority has been updated.",
    });
  };

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "low":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "pending":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
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
              <span className="text-sm">Task Manager</span>
            </div>
            <h1 className="text-3xl font-bold">Task Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all action items from your meetings
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export Tasks
            </Button>
            <Button size="sm">
              Add New Task
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meeting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.text}</TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>{task.deadline.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => handlePriorityChange(task.id, value)}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Select priority">
                          <Badge className={`${getPriorityColor(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">
                          <Badge className={getPriorityColor("high")}>High</Badge>
                        </SelectItem>
                        <SelectItem value="medium">
                          <Badge className={getPriorityColor("medium")}>Medium</Badge>
                        </SelectItem>
                        <SelectItem value="low">
                          <Badge className={getPriorityColor("low")}>Low</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Select status">
                          <Badge className={`${getStatusColor(task.status)}`}>
                            {task.status
                              .split("-")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <Badge className={getStatusColor("pending")}>Pending</Badge>
                        </SelectItem>
                        <SelectItem value="in-progress">
                          <Badge className={getStatusColor("in-progress")}>In Progress</Badge>
                        </SelectItem>
                        <SelectItem value="completed">
                          <Badge className={getStatusColor("completed")}>Completed</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Link 
                      to={`/summary/${task.meetingId}`}
                      className="text-primary hover:underline"
                    >
                      {task.meetingTitle}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default TaskManager;
