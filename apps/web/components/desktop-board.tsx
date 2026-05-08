"use client";

import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { ColumnContainer } from "./column-container";
import { AddColumnForm } from "./add-column-form";
import { useBoardScroll } from "../hooks/use-board-scroll";
import type { components } from "@repo/api-types";

type Column = components["schemas"]["Column"];
type TaskItem = components["schemas"]["TaskItem"];

interface DesktopBoardProps {
  columns: Column[];
  onAddColumn: (title: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddTask: (columnId: string, title: string) => void;
  onEditTask: (task: TaskItem) => void;
  onViewTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onMoveTaskToColumn: (task: TaskItem, targetColumnId: string) => void;
  isCreatingTask?: boolean;
  isCreatingColumn?: boolean;
}

export function DesktopBoard({
  columns,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onAddTask,
  onEditTask,
  onViewTask,
  onDeleteTask,
  onMoveTaskToColumn,
  isCreatingTask,
  isCreatingColumn,
}: DesktopBoardProps) {
  const { scrollRef, shadows } = useBoardScroll<HTMLDivElement>();

  return (
    <div className="flex-1 relative overflow-hidden min-h-0">
      <div
        className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
          shadows.left ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
          shadows.right ? "opacity-100" : "opacity-0"
        }`}
      />

      <div ref={scrollRef} className="h-full overflow-x-auto overflow-y-hidden px-6 py-4">
        <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 items-start h-full">
            {columns.map((col) => (
              <ColumnContainer
                key={col.id}
                column={col}
                allColumns={columns}
                onAddTask={(title) => onAddTask(col.id, title)}
                onEditTask={onEditTask}
                onViewTask={onViewTask}
                onDeleteTask={onDeleteTask}
                onMoveTaskToColumn={onMoveTaskToColumn}
                onRenameColumn={(title) => onRenameColumn(col.id, title)}
                onDeleteColumn={() => onDeleteColumn(col.id)}
                isCreatingTask={isCreatingTask}
              />
            ))}

            <AddColumnForm onAdd={onAddColumn} disabled={isCreatingColumn} />
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
