"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  useBoard,
  useMoveTask,
  useCreateTask,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
  useUpdateTask,
  useDeleteTask,
} from "../hooks/use-kanban";
import { useBoardSync } from "../hooks/use-board-sync";
import { useIsMobile } from "@/hooks/use-mobile";
import type { components } from "@repo/api-types";

// Sub-components
import { DesktopBoard } from "./desktop-board";
import { MobileColumnTabs } from "./mobile-column-tabs";
import { TaskDetailDialog } from "./task-detail-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { BoardSkeleton } from "./loading-skeletons";
import { TaskCard } from "./task-card";
import { ColumnContainer } from "./column-container";

type TaskItem = components["schemas"]["TaskItem"];
type Column = components["schemas"]["Column"];

interface KanbanBoardProps {
  boardId: string;
  searchQuery?: string;
  priorityFilter?: string | null;
}

// PHASE 4 FIX: Smooth drop animation to prevent layout flashes
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

export function KanbanBoard({ boardId, searchQuery, priorityFilter }: KanbanBoardProps) {
  const { data: board, isLoading, isError, refetch } = useBoard(boardId);
  const moveTask = useMoveTask(boardId);
  const createTask = useCreateTask(boardId);
  const createColumn = useCreateColumn(boardId);
  const updateColumn = useUpdateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const isMobile = useIsMobile();

  // Activate Real-Time SignalR Sync
  useBoardSync(boardId);

  // --- UI States ---
  const [localColumns, setLocalColumns] = useState<Column[]>([]);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [deleteTaskData, setDeleteTaskData] = useState<{ columnId: string; taskId: string } | null>(null);

  useEffect(() => {
    if (board?.columns) {
      setLocalColumns(board.columns);
    }
  }, [board?.columns]);

  const filteredColumns = localColumns.map(col => ({
    ...col,
    tasks: col.tasks.filter(t => {
      const matchesSearch = !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const normalizedPriority = t.priority?.toLowerCase() || "medium";
      const matchesPriority = !priorityFilter || normalizedPriority === priorityFilter;

      return matchesSearch && matchesPriority;
    })
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleEditTask = useCallback((task: TaskItem) => {
    setEditingTask(task);
    setTaskDetailOpen(true);
  }, []);

  const handleViewTask = useCallback((task: TaskItem) => {
    setViewingTask(task);
  }, []);

  const handleDeleteTask = useCallback((task: TaskItem) => {
    setDeleteTaskData({ columnId: task.columnId, taskId: task.id });
  }, []);

  const handleMoveToColumn = useCallback(
    (task: TaskItem, targetColumnId: string) => {
      moveTask.mutate({
        columnId: task.columnId,
        taskId: task.id,
        targetColumnId,
        position: 0,
      });
    },
    [moveTask]
  );

  if (isLoading) return <BoardSkeleton />;
  if (isError || !board) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="mx-auto max-w-sm rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">Failed to load board</h2>
          <Button onClick={() => refetch()} className="mt-4" size="sm">Retry</Button>
        </div>
      </div>
    );
  }

  const onDragStart = (event: DragStartEvent) => {
    // PHASE 4 FIX: Lock body scroll to prevent window scrollbars
    document.body.classList.add("is-dragging");

    const { active } = event;
    const { type, task, column } = active.data.current ?? {};

    if (type === "Task") setActiveTask(task);
    if (type === "Column") setActiveColumn(column);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    setLocalColumns((columns) => {
      const activeCol = columns.find((c) => c.tasks.some((t) => t.id === activeId));
      const overCol = isOverColumn
        ? columns.find((c) => c.id === overId)
        : columns.find((c) => c.tasks.some((t) => t.id === overId));

      if (!activeCol || !overCol || activeCol.id === overCol.id) return columns;

      const activeTaskIndex = activeCol.tasks.findIndex((t) => t.id === activeId);
      const overTaskIndex = isOverColumn
        ? overCol.tasks.length
        : overCol.tasks.findIndex((t) => t.id === overId);

      const newColumns = [...columns];
      const activeColIdx = newColumns.findIndex((c) => c.id === activeCol.id);
      const overColIdx = newColumns.findIndex((c) => c.id === overCol.id);

      const taskToMove = { ...activeCol.tasks[activeTaskIndex], columnId: overCol.id };

      newColumns[activeColIdx] = {
        ...activeCol,
        tasks: activeCol.tasks.filter((t) => t.id !== activeId),
      };

      const newOverTasks = [...overCol.tasks];
      const insertAt = overTaskIndex >= 0 ? overTaskIndex : newOverTasks.length;
      newOverTasks.splice(insertAt, 0, taskToMove);

      newColumns[overColIdx] = { ...overCol, tasks: newOverTasks };
      return newColumns;
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    // PHASE 4 FIX: Remove body scroll lock
    document.body.classList.remove("is-dragging");

    const { active, over } = event;
    const originalTask = activeTask;

    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const type = active.data.current?.type;

    if (type === "Column" && activeId !== overId) {
      const activeColIndex = localColumns.findIndex((c) => c.id === activeId);
      const overColIndex = localColumns.findIndex((c) => c.id === overId);

      if (activeColIndex !== -1 && overColIndex !== -1) {
        setLocalColumns((columns) => arrayMove(columns, activeColIndex, overColIndex));
        updateColumn.mutate({
          columnId: activeId as string,
          position: overColIndex,
        });
      }
      return;
    }

    if (type === "Task" && originalTask) {
      const currentUICol = localColumns.find((c) => c.tasks.some((t) => t.id === activeId));
      if (!currentUICol) return;

      const currentUITaskIndex = currentUICol.tasks.findIndex((t) => t.id === activeId);
      let finalColId = currentUICol.id;
      let finalIndex = currentUITaskIndex;

      const overUICol = over.data.current?.type === "Column"
        ? localColumns.find((c) => c.id === overId)
        : localColumns.find((c) => c.tasks.some((t) => t.id === overId));

      if (overUICol && currentUICol.id === overUICol.id) {
        const overUITaskIndex = over.data.current?.type === "Column"
          ? overUICol.tasks.length
          : overUICol.tasks.findIndex((t) => t.id === overId);

        if (currentUITaskIndex !== overUITaskIndex && overUITaskIndex !== -1) {
          finalIndex = overUITaskIndex;
          setLocalColumns((columns) =>
            columns.map((c) =>
              c.id === currentUICol.id
                ? { ...c, tasks: arrayMove(c.tasks, currentUITaskIndex, overUITaskIndex) }
                : c
            )
          );
        }
      }

      if (
        originalTask.columnId !== finalColId ||
        originalTask.position !== finalIndex
      ) {
        moveTask.mutate({
          columnId: originalTask.columnId,
          taskId: activeId as string,
          targetColumnId: finalColId,
          position: finalIndex,
        });
      }
    }
  };

  const onDragCancel = () => {
    // Phase 4 Fix: Ensure lock is removed if drag is cancelled
    document.body.classList.remove("is-dragging");
    setActiveTask(null);
    setActiveColumn(null);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Board Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        // PHASE 4 FIX: Explicitly configure autoScroll to be highly responsive for scrollable containers
        autoScroll={{
          threshold: { x: 0.1, y: 0.1 }, // Starts scrolling when dragging in the top/bottom 10% of the column
          acceleration: 10,
        }}
      >
        {isMobile ? (
          <div className="flex-1 overflow-hidden pt-2">
            <MobileColumnTabs
              columns={filteredColumns}
              onAddTask={(columnId, title) => createTask.mutate({ columnId, title })}
              onEditTask={handleEditTask}
              onViewTask={handleViewTask}
              onDeleteTask={handleDeleteTask}
              onMoveTaskToColumn={handleMoveToColumn}
              isCreatingTask={createTask.isPending}
            />
          </div>
        ) : (
          <DesktopBoard
            columns={filteredColumns}
            onAddColumn={(title) => createColumn.mutate({ title })}
            onRenameColumn={(columnId, title) => updateColumn.mutate({ columnId, title })}
            onDeleteColumn={(columnId) => setDeleteColumnId(columnId)}
            onAddTask={(columnId, title) => createTask.mutate({ columnId, title })}
            onEditTask={handleEditTask}
            onViewTask={handleViewTask}
            onDeleteTask={handleDeleteTask}
            onMoveTaskToColumn={handleMoveToColumn}
            isCreatingTask={createTask.isPending}
            isCreatingColumn={createColumn.isPending}
          />
        )}

        {/* PHASE 4 FIX: Added dropAnimation configuration */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeColumn ? (
            <ColumnContainer
              column={activeColumn}
              allColumns={localColumns}
              onAddTask={() => {}}
              onEditTask={() => {}}
              onViewTask={() => {}}
              onDeleteTask={() => {}}
              onMoveTaskToColumn={() => {}}
              onRenameColumn={() => {}}
              onDeleteColumn={() => {}}
              isOverlay
            />
          ) : activeTask ? (
            <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* View Task Dialog (Read Only) */}
      <Dialog open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pr-8">
            <DialogTitle className="whitespace-pre-wrap break-words text-xl leading-normal max-h-[30vh] overflow-y-auto pr-2">
              {viewingTask?.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Task details for {viewingTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-h-[40vh] overflow-y-auto pr-2">
              {viewingTask?.description || "No description provided."}
            </p>
            {viewingTask?.tags && viewingTask.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
                {viewingTask.tags.map((tag) => (
                  <span key={tag} className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog (Edit) */}
      <TaskDetailDialog
        task={editingTask}
        open={taskDetailOpen}
        onOpenChange={(open) => {
          setTaskDetailOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSave={(data) => {
          if (editingTask) {
            updateTask.mutate(
              { columnId: editingTask.columnId, taskId: editingTask.id, ...data },
              { onSuccess: () => setTaskDetailOpen(false) }
            );
          }
        }}
        onDelete={() => {
          if (editingTask) {
            deleteTask.mutate(
              { columnId: editingTask.columnId, taskId: editingTask.id },
              { onSuccess: () => setTaskDetailOpen(false) }
            );
          }
        }}
        saving={updateTask.isPending}
      />

      {/* Modals */}
      <ConfirmDialog
        open={!!deleteColumnId}
        onOpenChange={(open) => !open && setDeleteColumnId(null)}
        title="Delete Column"
        description="This will permanently delete this column and all tasks within it. This action cannot be undone."
        confirmLabel="Delete Column"
        variant="destructive"
        onConfirm={() => {
          if (deleteColumnId) {
            deleteColumn.mutate({ columnId: deleteColumnId });
            setDeleteColumnId(null);
          }
        }}
        loading={deleteColumn.isPending}
      />

      <ConfirmDialog
        open={!!deleteTaskData}
        onOpenChange={(open) => !open && setDeleteTaskData(null)}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTaskData) {
            deleteTask.mutate(deleteTaskData);
            setDeleteTaskData(null);
          }
        }}
        loading={deleteTask.isPending}
      />
    </div>
  );
}
