
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

const SummaryPanel = ({
  keyPoints = [],
  decisions = [],
  tasks = [],
  onAddTask,
}: SummaryPanelProps) => {
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
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} linkToTaskManager={true} />
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
