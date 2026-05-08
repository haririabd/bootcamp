import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { authLogin, authMe } from "@repo/api-types";
import { toast } from "sonner";
import { client } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if already authenticated
  const { data: user, isLoading: checkingAuth } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data, error } = await authMe({ client });
      if (error) throw new Error("Not authenticated");
      return data;
    },
    retry: false,
  });

  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await authLogin({ client, body: { email, password } });
      if (error) {
        setError("Invalid email or password.");
        toast.error("Invalid credentials.");
      } else if (data && data.role !== "admin") {
        setError("Access denied. Admin privileges required.");
        toast.error("Not an admin account.");
      } else {
        toast.success("Signed in!");
        navigate("/");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50 dark:bg-background selection:bg-slate-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[400px] rounded-2xl shadow-lg border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2 pt-8">
          <CardTitle className="text-2xl font-bold tracking-tight">Lazuar Admin</CardTitle>
          <CardDescription className="text-slate-500">
            Sign in to the Lazuar admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="rounded-xl"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl mt-2 h-10" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-slate-400 text-center">
        Admin accounts are managed by system administrators.
      </p>
    </div>
  );
}
