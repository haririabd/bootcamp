"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddColumnFormProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export function AddColumnForm({ onAdd, disabled }: AddColumnFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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
        className="min-w-[280px] h-[52px] shrink-0 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 dark:hover:text-slate-300 transition-colors"
        onClick={() => setIsAdding(true)}
        disabled={disabled}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add column
      </button>
    );
  }

  return (
    <div className="min-w-[280px] shrink-0 rounded-xl bg-white dark:bg-slate-900 border shadow-sm p-3 space-y-2">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Column title..."
        disabled={disabled}
        className="rounded-lg"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" className="rounded-lg" onClick={handleSubmit} disabled={!title.trim() || disabled}>
          Add column
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setIsAdding(false); setTitle(""); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
