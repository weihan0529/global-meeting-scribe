
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface Task {
  id: string;
  text: string;
  assignee?: string;
  deadline?: Date;
}

interface TaskItemProps {
  task: Task;
  linkToTaskManager?: boolean;
}

const TaskItem = ({ task, linkToTaskManager = false }: TaskItemProps) => {
  return (
    <Card className="border-l-4 border-l-accent bg-accent/5">
      <CardContent className="p-3">
        {linkToTaskManager ? (
          <Link to="/tasks" className="text-sm hover:underline">{task.text}</Link>
        ) : (
          <p className="text-sm">{task.text}</p>
        )}
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
