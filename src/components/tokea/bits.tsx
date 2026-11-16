import { Link } from "@tanstack/react-router";
import { ChevronLeft, MapPin, Clock, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtTime, seatsLeft, useDemo, type Person, type Session } from "@/lib/demo-store";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-foreground", className)}>
      <svg viewBox="0 0 24 24" className="size-5 text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <path d="M5 4h7l-1 8a2.5 2.5 0 0 1-5 0L5 4Z" />
        <path d="M12 7h7l-1 8a2.5 2.5 0 0 1-5 0" />
        <path d="M8.5 14.5V20M15.5 17.5V20" />
      </svg>
      <span className="wordmark text-2xl">tokea</span>
    </span>
  );
}

export function Avatar({ person, size = 40, className }: { person?: Person | undefined; size?: number; className?: string }) {
  const initials = person?.name.slice(0, 1) ?? "?";
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border border-border font-medium text-foreground", className)}
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: `oklch(0.9 0.05 ${person?.hue ?? 0} / 0.55)` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return <span className={cn("rounded-full border border-dashed border-brand/50 px-2 py-0.5 text-[11px] font-medium text-brand", className)}>Demo preview</span>;
}

export function StatusPill({ session }: { session: Session }) {
  const { state } = useDemo();
  const left = seatsLeft(session, state.requests);
  const [label, cls] =
    session.status === "ended" ? ["Ended", "bg-muted text-muted-foreground"]
    : session.status === "paused" ? ["Paused", "bg-warning-soft text-warning"]
    : left === 0 ? ["Full", "bg-muted text-muted-foreground"]
    : ["Open", "bg-success-soft text-success"];
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", cls)}>{label}</span>;
}

export function MyRequestPill({ sessionId }: { sessionId: string }) {
  const { state } = useDemo();
  const r = state.requests.find((x) => x.sessionId === sessionId && x.userId === "me" && (x.status === "pending" || x.status === "accepted"));
  if (!r) return null;
  return r.status === "pending"
    ? <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">Pending</span>
    : <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">You're in</span>;
}

export function SessionMeta({ session, compact }: { session: Session; compact?: boolean }) {
  const { state } = useDemo();
  const left = seatsLeft(session, state.requests);
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground", compact && "text-xs")}>
      <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{session.neighbourhood}{session.hostId !== "me" && <> · ~{session.distanceKm} km</>}</span>
      <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" />{fmtTime(session.start)}–{fmtTime(session.end)}</span>
      <span className="inline-flex items-center gap-1.5">{session.mode === "group" ? <Users className="size-3.5" /> : <User className="size-3.5" />}{session.mode === "group" ? `Group of ${session.groupSize}` : "Solo"} · {left} seat{left === 1 ? "" : "s"} left</span>
    </div>
  );
}

export function SessionCard({ session }: { session: Session }) {
  const { state } = useDemo();
  const host = state.people[session.hostId];
  const mine = session.hostId === "me";
  return (
    <Link
      to="/session/$id"
      params={{ id: session.id }}
      className="block rounded-3xl border border-border bg-card p-5 transition-colors hover:border-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <Avatar person={host} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{mine ? "Your session" : session.mode === "group" ? `${host?.name ?? "Someone"} & friends` : (host?.name ?? "Someone")}</p>
            <div className="flex gap-1.5"><MyRequestPill sessionId={session.id} /><StatusPill session={session} /></div>
          </div>
          <p className="text-sm text-muted-foreground">{session.category}{session.drink ? ` · ${session.drink}` : ""}</p>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed">{session.vibe}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <SessionMeta session={session} compact />
        <span className="shrink-0 text-sm font-medium text-brand">{mine ? "Manage" : "Details"}</span>
      </div>
    </Link>
  );
}

export function PageHeader({ title, back, right }: { title: string; back?: boolean; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur">
      {back && (
        <button onClick={() => history.back()} aria-label="Back" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-accent">
          <ChevronLeft className="size-5" />
        </button>
      )}
      <h1 className={cn("flex-1 truncate text-lg font-semibold", !back && "px-2")}>{title}</h1>
      {right}
    </header>
  );
}

export function Empty({ icon: Icon, title, body, action }: { icon: React.ElementType; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-12 text-center">
      <Icon className="size-6 text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}