"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Pencil, Trash2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// PHASE 3 FIX: Removed ScrollArea import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableTaskCard } from "./task-card";
import { AddCardForm } from "./add-card-form";
import type { components } from "@repo/api-types";

type TaskItem = components["schemas"]["TaskItem"];
type Column = components["schemas"]["Column"];

interface ColumnContainerProps {
  column: Column;
  allColumns: Column[];
  onAddTask: (title: string) => void;
  onEditTask: (task: TaskItem) => void;
  onViewTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onMoveTaskToColumn: (task: TaskItem, targetColumnId: string) => void;
  onRenameColumn: (title: string) => void;
  onDeleteColumn: () => void;
  isCreatingTask?: boolean;
  isOverlay?: boolean;
}

export function ColumnContainer({
  column,
  allColumns,
  onAddTask,
  onEditTask,
  onViewTask,
  onDeleteTask,
  onMoveTaskToColumn,
  onRenameColumn,
  onDeleteColumn,
  isCreatingTask,
  isOverlay,
}: ColumnContainerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const taskIds = column.tasks.map((t) => t.id);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== column.title) {
      onRenameColumn(trimmed);
    } else {
      setEditTitle(column.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") {
      setEditTitle(column.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col w-[300px] shrink-0 max-h-full bg-muted/40 dark:bg-muted/20 rounded-lg border ${
        isOverlay ? "shadow-2xl ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-background/50 rounded-t-lg shrink-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm font-semibold"
          />
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 -ml-1 rounded"
            >
              <GripHorizontal className="h-4 w-4" />
            </div>
            <h3
              className="text-sm font-semibold truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditing(true)}
              title="Click to rename"
            >
              {column.title}
            </h3>
            <Badge variant="secondary" className="text-xs shrink-0 tabular-nums">
              {column.tasks.length}
            </Badge>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteColumn}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* PHASE 3 FIX: Replaced <ScrollArea> with a native scrollable div.
          min-h-0 prevents flexbox blowout, overflow-y-auto handles scrolling. */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {/* Moved the p-2 padding up to the wrapper and kept min-h-[60px] to allow dragging into empty columns */}
          <div className="flex flex-col gap-2 min-h-[60px] transition-all duration-150">
            {column.tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                columns={allColumns}
                onEdit={onEditTask}
                onView={onViewTask}
                onDelete={onDeleteTask}
                onMoveToColumn={onMoveTaskToColumn}
              />
            ))}
          </div>
        </SortableContext>
      </div>

      <div className="px-2 pb-2 pt-1 border-t shrink-0 mt-auto">
        <AddCardForm onAdd={onAddTask} disabled={isCreatingTask} />
      </div>
    </div>
  );
}
