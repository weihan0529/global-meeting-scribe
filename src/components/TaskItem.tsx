
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pen } from "lucide-react";

interface Task {
  id: string;
  text: string;
  assignee?: string;
  deadline?: Date;
}

interface TaskItemProps {
  task: Task;
  linkToTaskManager?: boolean;
  onEdit?: () => void;
}

const TaskItem = ({ task, linkToTaskManager = false, onEdit }: TaskItemProps) => {
  return (
    <Card className="border-l-4 border-l-accent bg-accent/5">
      <CardContent className="p-3">
        <div className="flex justify-between">
            <p className="text-sm">{task.text}</p>
          
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onEdit}
            >
              <Pen className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          {task.assignee && (
            <div className="text-xs text-muted-foreground">
              Assigned to: <span className="font-medium">{task.assignee}</span>
            </div>
          )}
          {task.deadline && (
            <div className="text-xs text-muted-foreground">
              Due: {format(task.deadline, "MMM d")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskItem;
