
import { useState, useRef, useEffect } from "react";

interface EditableTitleProps {
  title: string;
  className?: string;
  onTitleChange: (newTitle: string) => void;
}

const EditableTitle = ({ title, className = "", onTitleChange }: EditableTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      onTitleChange(currentTitle);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setCurrentTitle(title);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onTitleChange(currentTitle);
  };

  return isEditing ? (
    <input
      ref={inputRef}
      type="text"
      value={currentTitle}
      onChange={(e) => setCurrentTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`bg-transparent border-b border-primary p-0 m-0 ${className}`}
    />
  ) : (
    <h1
      className={`cursor-pointer hover:text-primary ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {currentTitle}
    </h1>
  );
};

export default EditableTitle;
