using TypeSpec.Http;

namespace KanbanApi;

@route("/api/columns/{columnId}/tasks")
@tag("Tasks")
namespace Tasks {
  // ─── Task Core ──────────────────────────────────────────────────

  @post
  op create(@path columnId: string, @body body: CreateTaskRequest): {
    @statusCode statusCode: 201;
    @body body: TaskItem;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @patch
  @route("/{taskId}")
  op update(
    @path columnId: string,
    @path taskId: string,
    @body body: UpdateTaskRequest,
  ): {
    @statusCode statusCode: 200;
    @body body: TaskItem;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  @delete
  @route("/{taskId}")
  op delete(@path columnId: string, @path taskId: string): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  @patch
  @route("/{taskId}/move")
  op move(
    @path columnId: string,
    @path taskId: string,
    @body body: MoveTaskRequest,
  ): {
    @statusCode statusCode: 200;
    @body body: TaskItem;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  // ─── Comments ───────────────────────────────────────────────────

  @get
  @route("/{taskId}/comments")
  op listComments(@path columnId: string, @path taskId: string): {
    @statusCode statusCode: 200;
    @body body: Comment[];
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };

  @post
  @route("/{taskId}/comments")
  op addComment(
    @path columnId: string,
    @path taskId: string,
    @body body: CreateCommentRequest,
  ): {
    @statusCode statusCode: 201;
    @body body: Comment;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  // ─── Attachments ────────────────────────────────────────────────

  // Note: File uploads normally use multipart/form-data. TypeSpec defines the response here
  // so the client generator knows what to expect back.
  @post
  @route("/{taskId}/attachments")
  op addAttachment(@path columnId: string, @path taskId: string): {
    @statusCode statusCode: 201;
    @body body: Attachment;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @delete
  @route("/{taskId}/attachments/{attachmentId}")
  op removeAttachment(
    @path columnId: string,
    @path taskId: string,
    @path attachmentId: string,
  ): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  };
}
