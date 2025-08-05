import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Check, Calendar as CalendarIcon, Pencil, Plus } from "lucide-react";
import TaskItem from "./TaskItem";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface KeyPoint { text: string; source: 'ai' | 'user'; }
interface Decision { text: string; source: 'ai' | 'user'; }
interface Task {
  id: string;
  text: string;
  assignee?: string;
  deadline?: Date;
  source: 'ai' | 'user';
}

interface SummaryPanelProps {
  keyPoints: KeyPoint[];
  decisions: Decision[];
  tasks: Task[];
  onAddTask: () => void;
  speakers?: { id: string; name: string }[];
  onTaskUpdate?: (task: Task) => void;
  onKeyPointsChange?: (points: KeyPoint[]) => void;
  onDecisionsChange?: (decisions: Decision[]) => void;
  onTasksChange?: (tasks: Task[]) => void;
  readOnly?: boolean;
}

const SummaryPanel = ({
  keyPoints = [],
  decisions = [],
  tasks = [],
  onAddTask,
  speakers = [],
  onTaskUpdate,
  onKeyPointsChange,
  onDecisionsChange,
  onTasksChange,
  readOnly = false,
}: SummaryPanelProps) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingKeyPointIdx, setEditingKeyPointIdx] = useState<number | null>(null);
  const [editingDecisionIdx, setEditingDecisionIdx] = useState<number | null>(null);
  const [addType, setAddType] = useState<null | "keyPoint" | "decision" | "task">(null);
  const [addValue, setAddValue] = useState("");
  const { toast } = useToast();

  // Add handlers
  const handleAdd = () => {
    if (!addValue.trim()) return;
    if (addType === "keyPoint" && onKeyPointsChange) {
      onKeyPointsChange([
        ...keyPoints,
        { text: addValue, source: 'user' }
      ]);
    } else if (addType === "decision" && onDecisionsChange) {
      onDecisionsChange([
        ...decisions,
        { text: addValue, source: 'user' }
      ]);
    } else if (addType === "task" && onTasksChange) {
      onTasksChange([
        ...tasks,
        { id: (Date.now() + Math.random()).toString(), text: addValue, source: 'user' }
      ]);
    }
    setAddType(null);
    setAddValue("");
  };

  // Edit handlers
  const handleEditKeyPoint = (idx: number) => setEditingKeyPointIdx(idx);
  const handleEditDecision = (idx: number) => setEditingDecisionIdx(idx);
  const handleSaveKeyPoint = (idx: number, value: string) => {
    if (onKeyPointsChange) {
      const updated = [...keyPoints];
      updated[idx] = { ...updated[idx], text: value };
      onKeyPointsChange(updated);
    }
    setEditingKeyPointIdx(null);
  };
  const handleSaveDecision = (idx: number, value: string) => {
    if (onDecisionsChange) {
      const updated = [...decisions];
      updated[idx] = { ...updated[idx], text: value };
      onDecisionsChange(updated);
    }
    setEditingDecisionIdx(null);
  };

  const handleSaveTask = () => {
    if (editingTask && onTaskUpdate) {
      onTaskUpdate(editingTask);
      setEditingTask(null);
      toast({ title: "Action item updated successfully" });
    }
  };

  return (
    <div className="flex flex-col h-full min-w-[350px] max-w-[420px] w-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Live Summary</h2>
          {!readOnly && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="text-grey-400 bg-white hover:bg-blue-700 hover:text-white border-grey-600 text-sm py-1 px-2 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-black bg-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white" onClick={() => setAddType("keyPoint")}>Add Key Point</DropdownMenuItem>
                <DropdownMenuItem className="text-black bg-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white" onClick={() => setAddType("decision")}>Add Decision</DropdownMenuItem>
                <DropdownMenuItem className="text-black bg-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white" onClick={() => setAddType("task")}>Add Action Item</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
        </div>
        {addType && !readOnly && (
              <div className="absolute z-50 mt-10 right-4 w-80 bg-white border rounded shadow-lg p-4 flex flex-col gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder={addType === "keyPoint" ? "Enter key point" : addType === "decision" ? "Enter decision" : "Enter action item"}
                  value={addValue}
                  onChange={e => setAddValue(e.target.value)}
                  autoFocus
                />
                {addType === "task" && (
                  <>
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Assignee (optional)"
                      value={editingTask?.assignee || ''}
                      onChange={e => setEditingTask({ ...(editingTask || { id: (Date.now() + Math.random()).toString(), text: addValue, source: 'user' }), assignee: e.target.value })}
                    />
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-sm"
                      value={(() => {
                        if (!editingTask?.deadline) return '';
                        const dateObj = typeof editingTask.deadline === 'string' ? new Date(editingTask.deadline) : editingTask.deadline;
                        return !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : '';
                      })()}
                      onChange={e => setEditingTask({ ...(editingTask || { id: (Date.now() + Math.random()).toString(), text: addValue, source: 'user' }), deadline: e.target.value ? new Date(e.target.value) : undefined })}
                    />
                  </>
                )}
                <Button size="sm" onClick={() => {
                  if (!addValue.trim()) return;
                  if (addType === "keyPoint" && onKeyPointsChange) {
                    onKeyPointsChange([
                      ...keyPoints,
                      { text: addValue, source: 'user' }
                    ]);
                  } else if (addType === "decision" && onDecisionsChange) {
                    onDecisionsChange([
                      ...decisions,
                      { text: addValue, source: 'user' }
                    ]);
                  } else if (addType === "task" && onTasksChange) {
                    onTasksChange([
                      ...tasks,
                      {
                        id: (Date.now() + Math.random()).toString(),
                        text: addValue,
                        assignee: editingTask?.assignee,
                        deadline: editingTask?.deadline,
                        source: 'user'
                      }
                    ]);
                  }
                  setAddType(null);
                  setAddValue("");
                  setEditingTask(null);
                }}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddType(null); setAddValue(""); setEditingTask(null); }}>Cancel</Button>
              </div>
            )}
      </div>
      <ScrollArea className="flex-1 p-6" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {keyPoints.length === 0 && decisions.length === 0 && tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            The AI will generate a summary as the meeting progresses.
          </div>
        ) : (
          <div className="space-y-10">
            {keyPoints.length > 0 && (
              <div className="pb-6">
                <h3 className="text-md font-semibold mb-4">Key Points</h3>
                <ul className="list-disc list-inside space-y-3 text-sm pl-6">
                  {keyPoints.map((point, index) => (
                    <li key={index} className="text-muted-foreground" style={{ wordBreak: 'break-word' }}>
                      {editingKeyPointIdx === index && !readOnly ? (
                        <>
                          <input
                            className="border rounded px-2 py-1 text-sm mr-2"
                            value={point.text}
                            onChange={e => {
                              const updated = [...keyPoints];
                              updated[index] = { ...updated[index], text: e.target.value };
                              if (onKeyPointsChange) onKeyPointsChange(updated);
                            }}
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleSaveKeyPoint(index, point.text)}><Check className="w-4 h-4" /></Button>
                        </>
                      ) : (
                        <>
                          <span className="break-words whitespace-pre-line align-middle">{point.text}</span>
                          {!readOnly && (
                          <Button size="icon" variant="ghost" onClick={() => handleEditKeyPoint(index)} className="align-middle ml-2"><Pencil className="w-4 h-4" /></Button>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {decisions.length > 0 && (
              <div className="pb-6">
                <h3 className="text-md font-semibold mb-4 text-secondary">Decisions</h3>
                <ul className="list-disc list-inside space-y-3 text-sm pl-6">
                  {decisions.map((decision, index) => (
                    <li key={index} className="text-secondary" style={{ wordBreak: 'break-word' }}>
                      {editingDecisionIdx === index && !readOnly ? (
                        <>
                          <input
                            className="border rounded px-2 py-1 text-sm mr-2"
                            value={decision.text}
                            onChange={e => {
                              const updated = [...decisions];
                              updated[index] = { ...updated[index], text: e.target.value };
                              if (onDecisionsChange) onDecisionsChange(updated);
                            }}
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleSaveDecision(index, decision.text)}><Check className="w-4 h-4" /></Button>
                        </>
                      ) : (
                        <>
                          <span className="break-words whitespace-pre-line align-middle">{decision.text}</span>
                          {!readOnly && (
                          <Button size="icon" variant="ghost" onClick={() => handleEditDecision(index)} className="align-middle ml-2"><Pencil className="w-4 h-4" /></Button>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tasks.length > 0 && (
              <div className="pb-6">
                <h3 className="text-md font-semibold mb-4 text-destructive">Action Items</h3>
                <ul className="space-y-3 text-sm">
                  {tasks.map((task, index) => (
                    <li key={task.id} className="block" style={{ wordBreak: 'break-word' }}>
                      <div className="bg-red-50 border border-red-200 rounded p-3 flex flex-col gap-2">
                        {editingTask && editingTask.id === task.id && !readOnly ? (
                          <div className="flex flex-col gap-2">
                            <input
                              className="border rounded px-2 py-1 text-sm"
                              value={editingTask.text}
                              onChange={e => setEditingTask({ ...editingTask, text: e.target.value })}
                              autoFocus
                            />
                            <input
                              className="border rounded px-2 py-1 text-sm"
                              placeholder="Assignee (optional)"
                              value={editingTask.assignee || ''}
                              onChange={e => setEditingTask({ ...editingTask, assignee: e.target.value })}
                            />
                            <input
                              type="date"
                              className="border rounded px-2 py-1 text-sm"
                              value={(() => {
                                if (!editingTask?.deadline) return '';
                                const dateObj = typeof editingTask.deadline === 'string' ? new Date(editingTask.deadline) : editingTask.deadline;
                                return !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : '';
                              })()}
                              onChange={e => setEditingTask({ ...editingTask, deadline: e.target.value ? new Date(e.target.value) : undefined })}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button size="icon" variant="ghost" onClick={handleSaveTask}><Check className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingTask(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 w-full">
                            <span className="break-words whitespace-pre-line flex-1">{task.text}</span>
                            {!readOnly && (
                            <Button size="icon" variant="ghost" onClick={() => setEditingTask(task)}><Pencil className="w-4 h-4" /></Button>
                            )}
                          </div>
                        )}
                        {/* Show assignee and due date if present and not editing */}
                        {(!editingTask || editingTask.id !== task.id) && (
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            {task.assignee && <span>Assignee: {task.assignee}</span>}
                            {task.deadline && (() => {
                              const dateObj = typeof task.deadline === 'string' ? new Date(task.deadline) : task.deadline;
                              return !isNaN(dateObj.getTime()) ? <span>Due: {format(dateObj, 'MMM d, yyyy')}</span> : null;
                            })()}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default SummaryPanel;