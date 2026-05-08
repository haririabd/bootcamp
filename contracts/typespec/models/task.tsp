namespace KanbanApi;

// ─── Task Models ──────────────────────────────────────────────────

model TaskItem {
  id: string;
  title: string;
  description?: string;
  position: int32;
  columnId: string;
  assigneeId?: string;
  priority: string;
  tags: string[];
  dueDate?: utcDateTime;
  commentsCount: int32;
  attachmentsCount: int32;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model CreateTaskRequest {
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: string;
  tags?: string[];
  dueDate?: utcDateTime;
}

model UpdateTaskRequest {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: string;
  tags?: string[];
  dueDate?: utcDateTime;
}

model MoveTaskRequest {
  targetColumnId: string;
  position: int32;
}

// ─── Comment Models ───────────────────────────────────────────────

model Comment {
  id: string;
  taskId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
  text: string;
  createdAt: utcDateTime;
}

model CreateCommentRequest {
  text: string;
}

// ─── Attachment Models ────────────────────────────────────────────

model Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  uploadedByUserId: string;
  createdAt: utcDateTime;
}
