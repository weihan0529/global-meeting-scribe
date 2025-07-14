
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Check, Calendar as CalendarIcon } from "lucide-react";
import TaskItem from "./TaskItem";

interface Task {
  id: string;
  text: string;
  assignee?: string;
  deadline?: Date;
}

interface SummaryPanelProps {
  keyPoints: string[];
  decisions: string[];
  tasks: Task[];
  onAddTask: () => void;
  speakers?: { id: string; name: string }[];
  onTaskUpdate?: (task: Task) => void;
}

const SummaryPanel = ({
  keyPoints = [],
  decisions = [],
  tasks = [],
  onAddTask,
  speakers = [],
  onTaskUpdate,
}: SummaryPanelProps) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleSaveTask = () => {
    if (editingTask && onTaskUpdate) {
      onTaskUpdate(editingTask);
      setEditingTask(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Live Summary</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-sm py-1 px-2"
              onClick={onAddTask}
            >
              + Add Task
            </Button>
            {tasks.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-sm py-1 px-2"
                asChild
              >
                <Link to="/tasks">View All Tasks</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {keyPoints.length === 0 && decisions.length === 0 && tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            The AI will generate a summary as the meeting progresses.
          </div>
        ) : (
          <div className="space-y-6">
            {keyPoints.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2">Key Points</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {keyPoints.map((point, index) => (
                    <li key={index} className="text-muted-foreground">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {decisions.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2 text-secondary">
                  Decisions
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {decisions.map((decision, index) => (
                    <li key={index} className="text-secondary">
                      {decision}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tasks.length > 0 && (
              <div>
                <h3 className="text-md font-semibold mb-2 text-accent">
                  Action Items
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {tasks.map((task) => (
                    <div key={task.id}>
                      {editingTask && editingTask.id === task.id ? (
                        <div className="bg-accent/5 border rounded-md p-3 space-y-3">
                          <Input
                            value={editingTask.text}
                            onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
                            placeholder="Task description"
                            className="text-sm mb-2"
                          />
                          
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="text-xs mb-1 block text-muted-foreground">Assignee</label>
                              <select 
                                className="w-full p-2 text-sm border rounded-md bg-background"
                                value={editingTask.assignee || ""}
                                onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                              >
                                <option value="">Unassigned</option>
                                {speakers.map((speaker) => (
                                  <option key={speaker.id} value={speaker.name}>
                                    {speaker.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-xs mb-1 block text-muted-foreground">Due Date</label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-left font-normal text-sm"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editingTask.deadline ? format(editingTask.deadline, "PPP") : "Select a date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={editingTask.deadline}
                                    onSelect={(date) => setEditingTask({ ...editingTask, deadline: date || undefined })}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={handleSaveTask}
                            >
                              <Check className="h-4 w-4 mr-1" /> Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <TaskItem 
                          task={task} 
                          linkToTaskManager={false} 
                          onEdit={() => setEditingTask({...task})}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default SummaryPanel;
