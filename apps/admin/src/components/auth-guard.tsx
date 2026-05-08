import { type ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authMe, authLogout } from "@repo/api-types";
import { client } from "../lib/api";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["me"],
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
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isError) navigate("/login");
  }, [isError, navigate]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated
  if (!user) return null;

  // Not admin — show access denied
  if (user.role !== "admin") {
    const handleSignOut = async () => {
      await authLogout({ client });
      queryClient.clear();
      navigate("/login");
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto rounded-full bg-destructive/10 p-3 mb-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are logged in as <strong>{user.email}</strong> with role{" "}
              <strong>{user.role}</strong>. Admin access is required.
            </p>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
