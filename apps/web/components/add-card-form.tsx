"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AddCardFormProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export function AddCardForm({ onAdd, disabled }: AddCardFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
    setIsAdding(false); // <-- Added this line to close the form after submitting
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setTitle("");
    }
  };

  if (!isAdding) {
    return (
      <button
        className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-3 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 dark:hover:text-slate-300 transition-colors mt-2"
        onClick={() => setIsAdding(true)}
        disabled={disabled}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add a card
      </button>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      <Textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title for this card..."
        className="min-h-[60px] resize-none text-sm rounded-xl"
        disabled={disabled}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" className="rounded-lg" onClick={handleSubmit} disabled={!title.trim() || disabled}>
          {disabled ? "Adding..." : "Add card"}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setIsAdding(false); setTitle(""); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
