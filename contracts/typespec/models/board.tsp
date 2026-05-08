namespace KanbanApi;

model BoardMember {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

model AddBoardMemberRequest {
  userId: string;
  role?: string = "editor";
}

model Board {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model CreateBoardRequest {
  title: string;
  description?: string;
}

model UpdateBoardRequest {
  title?: string;
  description?: string;
}

model BoardDetail {
  ...Board;
  columns: Column[];
  members: BoardMember[];
}
