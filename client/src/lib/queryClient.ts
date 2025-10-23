import { QueryClient, QueryFunction } from "@tanstack/react-query";

export function getCurrentUserId(): string {
  const storedUserId = localStorage.getItem("currentUserId");
  const defaultUserId = "QHu1kUFKhu8baYbodQZ5Q";

  // Migrate old PostgreSQL UUID to new SQLite ID
  if (storedUserId === "c2fdd40b-dadf-4fbb-848a-74283d14802e") {
    localStorage.setItem("currentUserId", defaultUserId);
    return defaultUserId;
  }

  if (storedUserId) {
    return storedUserId;
  }

  localStorage.setItem("currentUserId", defaultUserId);
  return defaultUserId;
}

export function setCurrentUserId(userId: string) {
  localStorage.setItem("currentUserId", userId);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const headers: Record<string, string> = {
    "X-User-Id": getCurrentUserId(),
  };

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);

  // For DELETE requests, return null (no content expected)
  if (method === 'DELETE' && res.status === 204) {
    return null as T;
  }

  // For all other requests, parse and return JSON
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
