import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { seatsLeft, useDemo, canChat } from "@/lib/demo-store";
import { Avatar, PageHeader, SessionMeta, StatusPill } from "@/components/tokea/bits";

export const Route = createFileRoute("/session/$id")({
  head: () => ({ meta: [{ title: "Session — tokea demo" }, { name: "description", content: "Session details in the Tokea demo." }, { property: "og:title", content: "Session — tokea demo" }, { property: "og:description", content: "Session details in the Tokea demo." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { state, requestJoin, cancelRequest, updateSession } = useDemo();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(1);
  const [intro, setIntro] = useState("");
  const s = state.sessions.find((x) => x.id === id);
  if (!s) return <div className="p-6">Session not found. <Link to="/" className="text-brand">Back</Link></div>;
  const host = state.people[s.hostId];
  const mine = s.hostId === "me";
  const left = seatsLeft(s, state.requests);
  const myReq = state.requests.find((r) => r.sessionId === id && r.userId === "me" && (r.status === "pending" || r.status === "accepted"));
  const accepted = state.requests.filter((r) => r.sessionId === id && r.status === "accepted");

  return (
    <div>
      <PageHeader title={mine ? "Your session" : `${host?.name ?? "Someone"}'s session`} back />
      <div className="space-y-6 p-5">
        <div className="flex items-center gap-3"><Avatar person={host} size={56} /><div className="flex-1"><p className="font-medium">{host?.name ?? "Someone"}{s.mode === "group" && " & friends"}</p><p className="text-sm text-muted-foreground">{host?.bio || "No bio yet."}</p></div><StatusPill session={s} /></div>
        <p className="text-lg leading-relaxed">{s.vibe}</p>
        <div className="rounded-3xl border border-border p-4 space-y-3"><p className="text-sm">{s.category}{s.drink ? ` · ${s.drink}` : ""} · Open to {s.openTo === "both" ? "individuals & groups" : s.openTo}</p><SessionMeta session={s} /><p className="text-xs text-muted-foreground">Approximate area only. Exact venue is agreed in chat after approval.</p></div>
        <div><p className="mb-2 text-sm font-medium">Going ({s.groupSize + accepted.reduce((a, r) => a + r.partySize, 0)})</p><div className="flex -space-x-2"><Avatar person={host} size={36} />{accepted.map((r) => <Avatar key={r.id} person={state.people[r.userId]} size={36} />)}</div></div>
        <p className="flex gap-2 rounded-2xl bg-muted p-4 text-sm"><ShieldCheck className="size-4 shrink-0 text-brand" />Meet in a busy public venue, tell a friend where you'll be, and never feel pressured to drink.</p>
        {mine ? (
          <div className="grid gap-2">
            <Button variant="brand" onClick={() => nav({ to: "/requests" })}>Review requests</Button>
            <Button variant="outline" onClick={() => nav({ to: "/host", search: { edit: s.id } })}>Edit</Button>
            {s.status !== "ended" && <Button variant="outline" onClick={() => { updateSession(s.id, { status: s.status === "paused" ? "open" : "paused" }); toast(s.status === "paused" ? "Session resumed" : "Session paused"); }}>{s.status === "paused" ? "Resume" : "Pause"}</Button>}
            {s.status !== "ended" && <Button variant="ghost" className="text-destructive" onClick={() => { updateSession(s.id, { status: "ended" }); toast("Session ended"); }}>End early</Button>}
          </div>
        ) : myReq?.status === "pending" ? (
          <div className="grid gap-2"><p className="text-center text-sm text-muted-foreground">Request pending — waiting for {host.name}.</p><Button variant="outline" onClick={() => { cancelRequest(myReq.id); toast("Request cancelled"); }}>Cancel request</Button></div>
        ) : myReq?.status === "accepted" ? (
          <Button variant="brand" onClick={() => nav({ to: "/chats/$id", params: { id: s.id } })}>Open chat</Button>
        ) : (
          <Button variant="brand" size="lg" disabled={s.status !== "open" || left === 0} onClick={() => { setSize(1); setOpen(true); }}>{left === 0 ? "Full" : "Request to join"}</Button>
        )}
        {!mine && canChat(s, state.requests) === false && <p className="text-center text-xs text-muted-foreground">Chat unlocks only after the host accepts.</p>}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader><SheetTitle>Request to join</SheetTitle></SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            <div className="flex items-center justify-between"><span className="text-sm">Party size ({left} left)</span><div className="flex items-center gap-3"><Button size="icon" variant="outline" aria-label="Fewer" onClick={() => setSize(Math.max(1, size - 1))}><Minus /></Button><span className="w-6 text-center">{size}</span><Button size="icon" variant="outline" aria-label="More" onClick={() => setSize(Math.min(left, size + 1))}><Plus /></Button></div></div>
            <Textarea placeholder="Optional short intro" value={intro} maxLength={200} onChange={(e) => setIntro(e.target.value)} />
            <Button variant="brand" className="w-full" onClick={() => { const e = requestJoin(s.id, size, intro); if (e) toast.error(e); else { toast.success("Request sent — pending"); setOpen(false); } }}>Send request</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}