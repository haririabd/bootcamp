import { type FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function ErrorBoundaryFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorId = Math.random().toString(36).substring(2, 10).toUpperCase();

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto rounded-full bg-destructive/10 p-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try reloading.
          </p>
          <p className="text-xs text-muted-foreground">
            Error ID: <code className="bg-muted px-1.5 py-0.5 rounded">{errorId}</code>
          </p>
          {import.meta.env.DEV && error?.message && (
            <pre className="mt-3 bg-foreground/5 p-3 rounded-md text-xs text-left overflow-auto max-h-[120px]">
              {error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={resetErrorBoundary}>Reload Page</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
