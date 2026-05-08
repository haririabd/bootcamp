"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Pencil, Trash2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { components } from "@repo/api-types";

type TaskItem = components["schemas"]["TaskItem"];
type Column = components["schemas"]["Column"];

interface TaskCardProps {
  task: TaskItem;
  columns?: Column[];
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onView?: (task: TaskItem) => void;
  onMoveToColumn?: (task: TaskItem, targetColumnId: string) => void;
  isOverlay?: boolean;
}

const PriorityBadge = ({ priority }: { priority?: string }) => {
  const normalizedPriority = priority?.toLowerCase() || "medium";
  const styles: Record<string, string> = {
    low: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    medium: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    high: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${styles[normalizedPriority] || styles.medium}`}>
      {normalizedPriority}
    </span>
  );
};

export function TaskCard({ task, columns, onEdit, onDelete, onView, onMoveToColumn, isOverlay }: TaskCardProps) {
  return (
    <div
      onClick={() => onView?.(task)}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 transition-shadow group w-full overflow-hidden ${
        isOverlay
          ? "shadow-xl ring-2 ring-slate-300 dark:ring-slate-600 rotate-2 cursor-grabbing"
          : "shadow-sm hover:shadow-md cursor-pointer active:cursor-grabbing"
      }`}
    >
      <div className="flex justify-between items-start mb-3 w-full">
        <PriorityBadge priority={task.priority} />

        {!isOverlay && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()} // Prevent card click from triggering
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              {columns && onMoveToColumn && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRight className="mr-2 h-3.5 w-3.5" /> Move to
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {columns
                      .filter((col) => col.id !== task.columnId)
                      .map((col) => (
                        <DropdownMenuItem key={col.id} onClick={() => onMoveToColumn(task, col.id)}>
                          {col.title}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-2 whitespace-pre-wrap line-clamp-3 break-all">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-slate-500 dark:text-slate-400 text-xs whitespace-pre-wrap line-clamp-3 mb-4 leading-relaxed font-normal break-all">
          {task.description}
        </p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SortableTaskCard(props: TaskCardProps) {
  const { task } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "Task", task },
    animateLayoutChanges: ({ isSorting, wasDragging }) => !(isSorting || wasDragging),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 150ms ease",
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layoutId={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isDragging ? { y: -2 } : undefined}
      className="mb-3 w-full"
    >
      <TaskCard {...props} />
    </motion.div>
  );
}
