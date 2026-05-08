import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authMe, authLogin, authRegister, authLogout, authUpdateProfile, usersSearch } from "@repo/api-types";
import { client } from "../lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Fetches the current authenticated user.
 * Returns user data if logged in, undefined/error if not.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data, error } = await authMe({ client });
      if (error) {
        const err = new Error("Not authenticated");
        (err as any).status = 401;
        throw err;
      }
      return data;
    },
    retry: false,
    // Don't refetch constantly — only when window regains focus or manually invalidated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Login mutation.
 * On success: caches user data and redirects to home.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data, error } = await authLogin({
        client,
        body: credentials,
      });
      if (error) {
        const err = new Error("Login failed");
        (err as any).status = (error as any)?.status || 401;
        (err as any).detail = error;
        throw err;
      }
      return data;
    },
    onSuccess: (user) => {
      // Store the user in the auth query cache
      queryClient.setQueryData(["auth", "me"], user);
      // Navigate to the main page
      router.push("/");
    },
  });
}

/**
 * Register mutation.
 * On success: redirects to login page (user needs to log in after registering).
 */
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      displayName: string;
    }) => {
      const { data: user, error } = await authRegister({
        client,
        body: data,
      });
      if (error) {
        const err = new Error("Registration failed");
        (err as any).status = (error as any)?.status || 400;
        (err as any).detail = error;
        throw err;
      }
      return user;
    },
    onSuccess: () => {
      // Redirect to login after successful registration
      router.push("/login");
    },
  });
}

/**
 * Logout mutation.
 * On success: clears all caches and redirects to login.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authLogout({ client });
      if (error) {
        const err = new Error("Logout failed");
        (err as any).detail = error;
        throw err;
      }
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to login
      router.push("/login");
    },
  });
}

/**
 * User search for assigning tasks.
 */
export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await usersSearch({ client, query: { q: query } });
      if (error) throw error;
      return data ?? [];
    },
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}

/**
 * Update user profile mutation.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { displayName?: string; currentPassword?: string; newPassword?: string; avatarUrl?: string }) => {
      const { data, error } = await authUpdateProfile({ client, body });
      if (error) {
        const err = new Error("Profile update failed");
        (err as any).status = (error as any)?.status;
        (err as any).detail = error;
        throw err;
      }
      return data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["auth", "me"], updatedUser);
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      const msg = error?.detail?.message || "Failed to update profile";
      toast.error(msg);
    }
  });
}
