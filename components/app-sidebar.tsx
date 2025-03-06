"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import {
  Brain,
  Home,
  Plus,
  Search,
  Settings,
  HelpCircle,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Workflow as WorkflowType } from "@/lib/models/workflow";
import { useSession } from "next-auth/react";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only fetch workflows if the user is authenticated
    if (status === "authenticated") {
      fetchWorkflows();
    }
  }, [status]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("/api/workflows");

      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }

      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error("Error fetching workflows for sidebar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <Brain className="h-6 w-6 text-primary animate-pulse" />
          <span className="text-lg font-semibold">AI Orchestrator</span>
        </div>
        <form>
          <SidebarGroup className="py-0">
            <SidebarGroupContent className="relative">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <SidebarInput
                id="search"
                placeholder="Search workflows..."
                className="pl-8"
              />
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
            </SidebarGroupContent>
          </SidebarGroup>
        </form>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="Home"
                >
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <Workflow className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/help"}
                  tooltip="Help"
                >
                  <Link href="/help">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/user-settings"}
                  tooltip="Settings"
                >
                  <Link href="/user-settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Workflows</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 mr-2"
              asChild
            >
              <Link href="/dashboard">
                <Plus className="h-4 w-4" />
                <span className="sr-only">New Workflow</span>
              </Link>
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : workflows.length === 0 ? (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  No workflows yet
                </div>
              ) : (
                workflows.map((workflow) => (
                  <SidebarMenuItem key={workflow._id as string}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/workflow/${workflow._id}`}
                      tooltip={workflow.description || workflow.name}
                    >
                      <Link href={`/workflow/${workflow._id}`}>
                        <span>{workflow.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <UserNav />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
