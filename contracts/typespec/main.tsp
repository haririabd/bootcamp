import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
import "@typespec/openapi3";

import "./common.tsp";
import "./models/auth.tsp";
import "./models/board.tsp";
import "./models/column.tsp";
import "./models/task.tsp";
import "./models/admin.tsp";
import "./routes/auth.tsp";
import "./routes/boards.tsp";
import "./routes/columns.tsp";
import "./routes/tasks.tsp";
import "./routes/admin.tsp";

import "./models/user.tsp";
import "./routes/users.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

@service(#{ title: "Kanban API" })
@info(#{ version: "1.1.0" })
@server("http://localhost:5010", "Development server")
@useAuth(NoAuth | ApiKeyAuth<ApiKeyLocation.cookie, "session">)
namespace KanbanApi;
