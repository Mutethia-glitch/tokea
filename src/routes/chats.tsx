import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { MessageCircle, ChevronRight, ShieldCheck } from "lucide-react";
import { useDemo, canChat, ago, ME } from "@/lib/demo-store";
import { Avatar, PageHeader, Empty } from "@/components/tokea/bits";

export const Route = createFileRoute("/chats")({
  head: () => ({ meta: [{ title: "Chats — tokea demo" }] }),
  component: Chats,
});

function Chats() {
  const { pathname } = useLocation();
  const { state } = useDemo();
  const sessions = state.sessions.filter(s => s.status !== "ended" && !state.blocked.includes(s.hostId) && canChat(s, state.requests));
  const ordered = [...sessions].sort((a,b) => {
    const latest = (id: string) => Math.max(0, ...state.messages.filter(m => m.sessionId === id).map(m => m.at));
    return latest(b.id)-latest(a.id);
  });
  // The detail route is nested under /chats; render only the detail screen there.
  if (pathname.startsWith("/chats/")) return <Outlet />;

  return (
    <div>
      <PageHeader title="Chats" />
      <div className="space-y-5 p-5">
        <p className="text-sm text-muted-foreground">Private conversations with sessions you've joined or hosted.</p>
        <div className="space-y-3">
          {ordered.length === 0 ? <Empty icon={MessageCircle} title="No chats yet" body="Once a host accepts you, that session's private chat appears here." /> : ordered.map(s => {
            const host = state.people[s.hostId];
            const ms = state.messages.filter(m => m.sessionId === s.id && !state.blocked.includes(m.userId));
            const last = ms[ms.length - 1];
            return (
              <Link key={s.id} to="/chats/$id" params={{ id: s.id }} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-5 transition-colors hover:border-brand/40">
                <Avatar person={host} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{s.hostId === ME ? "Your session" : `${host.name}${s.mode === "group" ? " & friends" : ""}`}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{last ? ago(last.at) : "New"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.category} · {s.neighbourhood}</p>
                  <p className="mt-2 truncate text-sm text-muted-foreground">{last ? `${last.userId === ME ? "You: " : ""}${last.text}` : "Start planning your meetup"}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
        <p className="flex items-start gap-2 rounded-2xl bg-muted p-4 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-brand" /> Only hosts and accepted guests can access a session chat.</p>
      </div>
    </div>
  );
}
