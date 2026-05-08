using TypeSpec.Http;
namespace KanbanApi;

@route("/api/users")
@tag("Users")
namespace Users {
  @get
  @route("/search")
  op search(@query q: string): {
    @statusCode statusCode: 200;
    @body body: UserSearchItem[];
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };
}
