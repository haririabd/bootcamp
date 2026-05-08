import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ReactNode } from "react";

interface MobileCardProps {
  children: ReactNode;
  actions?: ReactNode;
}

export function MobileCard({ children, actions }: MobileCardProps) {
  return (
    <Card className="relative rounded-xl border-slate-200 dark:border-slate-800 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">{children}</div>
          {actions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mt-1 -mr-1 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {actions}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MobileCardField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{label}:</span>
      <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{children}</span>
    </div>
  );
}
