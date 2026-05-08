namespace KanbanApi;

/** Standard error response returned on failures */
model ErrorResponse {
  message: string;
  errors?: Record<string[]>;
}

/** Generic paginated response wrapper */
model PaginatedResponse<T> {
  items: T[];

  /** Total number of records matching the query */
  totalCount: int32;

  /** Current page number (1-based) */
  page: int32;

  /** Number of items per page */
  pageSize: int32;

  /** Total number of pages */
  totalPages: int32;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}
