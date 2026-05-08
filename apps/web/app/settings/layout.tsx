import { ReactNode } from "react";
import { Sidebar } from "../../components/sidebar";
import { TopNav } from "../../components/top-nav";
import { AuthGuard } from "../../components/auth-guard";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-slate-50 dark:bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 overflow-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
