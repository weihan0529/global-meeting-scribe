
import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Check, CalendarIcon, ArrowUp, ArrowDown } from "lucide-react";
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

interface SortConfig {
  key: keyof Task | null;
  direction: 'ascending' | 'descending';
}

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Task | null>(null);
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

  const handleSort = (key: keyof Task) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === bValue) return 0;
    
    // Handle different types of values
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortConfig.direction === 'ascending'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    
    // String comparison
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortConfig.direction === 'ascending' ? comparison : -comparison;
  });

  const getSortIcon = (key: keyof Task) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? 
      <ArrowUp className="h-3 w-3 inline ml-1" /> : 
      <ArrowDown className="h-3 w-3 inline ml-1" />;
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

  const handleAddNewTask = () => {
    const newTaskTemplate: Task = {
      id: `new-${Date.now()}`,
      text: "",
      assignee: "",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
      priority: "medium",
      status: "pending",
      meetingId: "manual",
      meetingTitle: "Manually Added Task",
    };
    
    setNewTask(newTaskTemplate);
  };

  const handleSaveNewTask = () => {
    if (newTask && newTask.text.trim() !== "") {
      setTasks([...tasks, { ...newTask, id: `${tasks.length + 1}` }]);
      setNewTask(null);
      
      toast({
        title: "Task created",
        description: "New task has been added successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Please provide a task description.",
        variant: "destructive",
      });
    }
  };

  const handleCancelNewTask = () => {
    setNewTask(null);
  };

  const handleSaveEditingTask = () => {
    if (editingTask) {
      setTasks(tasks.map(task => task.id === editingTask.id ? editingTask : task));
      setEditingTask(null);
      
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
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
            <Button size="sm" onClick={handleAddNewTask}>
              Add New Task
            </Button>
          </div>
        </div>

        {newTask && (
          <div className="mb-4 p-4 border rounded-md shadow-sm">
            <h2 className="text-lg font-medium mb-4">Add New Task</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm mb-1 block">Task Description</label>
                <Input
                  value={newTask.text}
                  onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                  placeholder="Enter task description"
                />
              </div>
              
              <div>
                <label className="text-sm mb-1 block">Assignee</label>
                <Input
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  placeholder="Who should complete this task?"
                />
              </div>
              
              <div>
                <label className="text-sm mb-1 block">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(newTask.deadline, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newTask.deadline}
                      onSelect={(date) => date && setNewTask({ ...newTask, deadline: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm mb-1 block">Priority</label>
                <Select 
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value as "high" | "medium" | "low" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelNewTask}>Cancel</Button>
              <Button onClick={handleSaveNewTask}>Save Task</Button>
            </div>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px] cursor-pointer" onClick={() => handleSort('text')}>
                  Task {getSortIcon('text')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('assignee')}>
                  Assignee {getSortIcon('assignee')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('deadline')}>
                  Due Date {getSortIcon('deadline')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                  Priority {getSortIcon('priority')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                  Status {getSortIcon('status')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('meetingTitle')}>
                  Meeting {getSortIcon('meetingTitle')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => (
                <TableRow key={task.id}>
                  {editingTask && editingTask.id === task.id ? (
                    <TableCell colSpan={6}>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm mb-1 block">Task Description</label>
                          <Input
                            value={editingTask.text}
                            onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
                            placeholder="Enter task description"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm mb-1 block">Assignee</label>
                          <Input
                            value={editingTask.assignee}
                            onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                            placeholder="Who should complete this task?"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm mb-1 block">Due Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {format(editingTask.deadline, "PPP")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={editingTask.deadline}
                                onSelect={(date) => date && setEditingTask({ ...editingTask, deadline: date })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="flex items-end space-x-4">
                          <Button onClick={handleSaveEditingTask}>
                            <Check className="mr-1 h-4 w-4" /> Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditingTask(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  ) : (
                    <>
                      <TableCell className="font-medium">
                        <div className="flex justify-between items-center">
                          <span>{task.text}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                            onClick={() => setEditingTask({...task})}
                          >
                            <Pen className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
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
                    </>
                  )}
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
