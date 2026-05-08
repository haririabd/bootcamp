namespace KanbanApi;

model RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

model LoginRequest {
  email: string;
  password: string;
}

model UserResponse {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  createdAt: utcDateTime;
}

model UpdateProfileRequest {
  displayName?: string;
  currentPassword?: string;
  newPassword?: string;
  avatarUrl?: string;
}
