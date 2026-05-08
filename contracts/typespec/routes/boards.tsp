using TypeSpec.Http;

namespace KanbanApi;

@route("/api/boards")
@tag("Boards")
namespace Boards {
  @get
  op list(@query page?: int32 = 1, @query pageSize?: int32 = 20): {
    @statusCode statusCode: 200;
    @body body: PaginatedResponse<Board>;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };

  @post
  op create(@body body: CreateBoardRequest): {
    @statusCode statusCode: 201;
    @body body: Board;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @get
  @route("/{boardId}")
  op get(@path boardId: string): {
    @statusCode statusCode: 200;
    @body body: BoardDetail;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  @patch
  @route("/{boardId}")
  op update(@path boardId: string, @body body: UpdateBoardRequest): {
    @statusCode statusCode: 200;
    @body body: Board;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  @delete
  @route("/{boardId}")
  op delete(@path boardId: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  // --- Board Members (Collaboration) ---

  @post
  @route("/{boardId}/members")
  op addMember(@path boardId: string, @body body: AddBoardMemberRequest):
    | {
        @statusCode statusCode: 200;
        @body body: BoardMember;
      }
    | {
        @statusCode statusCode: 400;
        @body body: ErrorResponse;
      }
    | {
        @statusCode statusCode: 403;
        @body body: ErrorResponse;
      }
    | {
        @statusCode statusCode: 404;
        @body body: ErrorResponse;
      };

  @delete
  @route("/{boardId}/members/{userId}")
  op removeMember(@path boardId: string, @path userId: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 403;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };
}
