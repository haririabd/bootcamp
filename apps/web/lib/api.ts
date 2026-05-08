import { createClient } from "@hey-api/client-fetch";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

export const client = createClient({
  baseUrl,
  // @ts-ignore
  fetch: (request, init) => {
    const headers = new Headers(init?.headers || (request instanceof Request ? request.headers : undefined));
    headers.set("X-Requested-With", "XMLHttpRequest");

    return fetch(request, {
      ...init,
      credentials: "include",
      headers,
    });
  },
});
