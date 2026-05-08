namespace KanbanApi;

model AdminUserListItem {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: utcDateTime;
}

model UpdateUserRoleRequest {
  role: string;
}

model UpdateUserStatusRequest {
  isActive: boolean;
}

model AdminStatsResponse {
  totalUsers: int32;
  activeUsers: int32;
  adminCount: int32;
  totalBoards: int32;
  recentUsers: AdminUserListItem[];
}
