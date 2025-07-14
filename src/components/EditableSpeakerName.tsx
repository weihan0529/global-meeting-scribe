
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Pen } from "lucide-react";

interface EditableSpeakerNameProps {
  speakerName: string;
  speakerInitials: string;
  color?: string;
  onNameChange: (newName: string) => void;
}

const EditableSpeakerName = ({
  speakerName,
  speakerInitials,
  color = "bg-gray-400",
  onNameChange,
}: EditableSpeakerNameProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(speakerName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    if (editedName.trim() !== "") {
      onNameChange(editedName.trim());
    } else {
      setEditedName(speakerName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveClick();
    } else if (e.key === "Escape") {
      setEditedName(speakerName);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${color}`}>
        <span className="text-xs text-white font-medium">{speakerInitials}</span>
      </div>

      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm border rounded px-2 py-1 w-36"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={handleSaveClick}
          >
            <Check className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1 group">
          <span className="font-medium">{speakerName}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleEditClick}
          >
            <Pen className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditableSpeakerName;
