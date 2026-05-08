using TypeSpec.Http;

namespace KanbanApi;

@route("/api/admin")
@tag("Admin")
namespace Admin {
  @get
  @route("/users")
  op listUsers(
    @query page?: int32 = 1,
    @query pageSize?: int32 = 20,
    @query search?: string,
  ): {
    @statusCode statusCode: 200;
    @body body: PaginatedResponse<AdminUserListItem>;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };

  @patch
  @route("/users/{userId}/role")
  op updateUserRole(@path userId: string, @body body: UpdateUserRoleRequest): {
    @statusCode statusCode: 200;
    @body body: AdminUserListItem;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  @patch
  @route("/users/{userId}/status")
  op updateUserStatus(
    @path userId: string,
    @body body: UpdateUserStatusRequest,
  ): {
    @statusCode statusCode: 200;
    @body body: AdminUserListItem;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  @get
  @route("/stats")
  op getStats(): {
    @statusCode statusCode: 200;
    @body body: AdminStatsResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };
}
