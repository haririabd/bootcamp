using TypeSpec.Http;

namespace KanbanApi;

@route("/api/auth")
@tag("Auth")
namespace Auth {
  @post
  @route("/register")
  op register(@body body: RegisterRequest): {
    @statusCode statusCode: 201;
    @body body: UserResponse;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  };

  @post
  @route("/login")
  op login(@body body: LoginRequest): {
    @statusCode statusCode: 200;
    @body body: UserResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };

  @post
  @route("/logout")
  op logout(): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };

  @get
  @route("/me")
  op me(): {
    @statusCode statusCode: 200;
    @body body: UserResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };

  @patch
  @route("/me")
  op updateProfile(@body body: UpdateProfileRequest): {
    @statusCode statusCode: 200;
    @body body: UserResponse;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };
}
