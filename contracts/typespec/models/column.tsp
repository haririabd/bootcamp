namespace KanbanApi;

model Column {
  id: string;
  title: string;
  position: int32;
  boardId: string;
  tasks: TaskItem[];
}

model CreateColumnRequest {
  title: string;
}

model UpdateColumnRequest {
  title?: string;
  position?: int32;
}
