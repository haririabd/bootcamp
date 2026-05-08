"use client";

import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SortableTaskCard } from "./task-card";
import { AddCardForm } from "./add-card-form";
import type { components } from "@repo/api-types";

type TaskItem = components["schemas"]["TaskItem"];
type Column = components["schemas"]["Column"];

interface MobileColumnTabsProps {
  columns: Column[];
  onAddTask: (columnId: string, title: string) => void;
  onEditTask: (task: TaskItem) => void;
  onViewTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onMoveTaskToColumn: (task: TaskItem, targetColumnId: string) => void;
  isCreatingTask?: boolean;
}

export function MobileColumnTabs({
  columns,
  onAddTask,
  onEditTask,
  onViewTask,
  onDeleteTask,
  onMoveTaskToColumn,
  isCreatingTask,
}: MobileColumnTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeColumn = columns[activeIndex];

  if (!activeColumn) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto">
        {columns.map((col, idx) => (
          <Button
            key={col.id}
            variant={idx === activeIndex ? "default" : "ghost"}
            size="sm"
            className="shrink-0 h-8 text-xs"
            onClick={() => setActiveIndex(idx)}
          >
            {col.title}
            <Badge
              variant="secondary"
              className="ml-1.5 h-4 min-w-[1rem] px-1 text-[10px]"
            >
              {col.tasks.length}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {activeIndex + 1} / {columns.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={activeIndex === columns.length - 1}
          onClick={() => setActiveIndex((i) => Math.min(columns.length - 1, i + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <MobileColumnContent
        column={activeColumn}
        allColumns={columns}
        onAddTask={(title) => onAddTask(activeColumn.id, title)}
        onEditTask={onEditTask}
        onViewTask={onViewTask}
        onDeleteTask={onDeleteTask}
        onMoveTaskToColumn={onMoveTaskToColumn}
        isCreatingTask={isCreatingTask}
      />
    </div>
  );
}

function MobileColumnContent({
  column,
  allColumns,
  onAddTask,
  onEditTask,
  onViewTask,
  onDeleteTask,
  onMoveTaskToColumn,
  isCreatingTask,
}: {
  column: Column;
  allColumns: Column[];
  onAddTask: (title: string) => void;
  onEditTask: (task: TaskItem) => void;
  onViewTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onMoveTaskToColumn: (task: TaskItem, targetColumnId: string) => void;
  isCreatingTask?: boolean;
}) {
  const taskIds = column.tasks.map((t) => t.id);
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: "Column", column },
  });

  return (
    <div ref={setNodeRef} className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-3">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 py-2 min-h-[100px]">
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
      </ScrollArea>
      <div className="px-3 py-2 border-t">
        <AddCardForm onAdd={onAddTask} disabled={isCreatingTask} />
      </div>
    </div>
  );
}
