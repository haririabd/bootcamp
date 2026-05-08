using TypeSpec.Http;

namespace KanbanApi;

@route("/api/boards/{boardId}/columns")
@tag("Columns")
namespace Columns {
  @post
  op create(@path boardId: string, @body body: CreateColumnRequest): {
    @statusCode statusCode: 201;
    @body body: Column;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @patch
  @route("/{columnId}")
  op update(
    @path boardId: string,
    @path columnId: string,
    @body body: UpdateColumnRequest,
  ): {
    @statusCode statusCode: 200;
    @body body: Column;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  @delete
  @route("/{columnId}")
  op delete(@path boardId: string, @path columnId: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };
}
