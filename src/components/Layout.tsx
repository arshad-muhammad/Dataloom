import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" data-background="true">
        <AppSidebar />
        <main className="flex-1 bg-background" data-background="true">
          <div className="border-b bg-card px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <h1 className="text-xl font-semibold text-foreground">DataLoom</h1>
              </div>
            </div>
          </div>
          <div className="p-6 bg-background" data-background="true">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
