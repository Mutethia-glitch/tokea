import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Compass, Inbox, MessageCircle, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemo, canChat, ME } from "@/lib/demo-store";
import { Onboarding } from "./onboarding";
import { Skeleton } from "@/components/ui/skeleton";

const tabs = [
  { to: "/", label: "Discover", icon: Compass },
  { to: "/requests", label: "Requests", icon: Inbox },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell() {
  const { state, ready } = useDemo();
  const { pathname } = useLocation();
  const pendingIncoming = state.requests.filter((r) => r.status === "pending" && state.sessions.find((s) => s.id === r.sessionId)?.hostId === ME && !state.blocked.includes(r.userId)).length;
  const chatCount = state.sessions.filter((s) => s.status !== "ended" && canChat(s, state.requests) && state.messages.some((m) => m.sessionId === s.id)).length;
  const hideNav = pathname.startsWith("/chats/") || pathname.startsWith("/host");

  return (
    <div className="min-h-screen bg-muted/40 dark:bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background sm:border-x sm:border-border">
        {!ready ? (
          <div className="space-y-4 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}</div>
        ) : !state.onboarded ? (
          <Onboarding />
        ) : (
          <>
            <main className={cn("flex-1", !hideNav && "pb-24")}><Outlet /></main>
            {!hideNav && (
              <>
                <nav aria-label="Main" className="fixed bottom-0 z-30 grid w-full max-w-md grid-cols-4 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
                  {tabs.map(({ to, label, icon: Icon }) => {
                    const active = to === "/" ? pathname === "/" || pathname.startsWith("/session") : pathname.startsWith(to);
                    const badge = to === "/requests" ? pendingIncoming : to === "/chats" ? chatCount : 0;
                    return (
                      <Link key={to} to={to} className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-brand" : "text-muted-foreground hover:text-foreground")}>
                        <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                        {label}
                        {badge > 0 && <span className="absolute top-2 left-1/2 ml-2 min-w-4 rounded-full bg-brand px-1 text-[10px] leading-4 text-brand-foreground">{badge}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}