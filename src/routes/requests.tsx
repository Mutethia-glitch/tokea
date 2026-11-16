import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import { toast } from "sonner";
import { useDemo, seatsLeft, ME } from "@/lib/demo-store";
import { Avatar, PageHeader, Empty } from "@/components/tokea/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Requests — tokea demo" }] }),
  component: Requests,
});

function Requests() {
  const { state, accept, decline, cancelRequest, simulateIncoming } = useDemo();
  const [tab, setTab] = useState<"incoming" | "sent">("incoming");
  const sessionFor = (sessionId: string) => state.sessions.find(s => s.id === sessionId);
  const incoming = state.requests.filter(r => sessionFor(r.sessionId)?.hostId === ME && r.userId !== ME && !state.blocked.includes(r.userId)).sort((a,b) => b.at - a.at);
  const sent = state.requests.filter(r => r.userId === ME).sort((a,b) => b.at - a.at);
  const records = tab === "incoming" ? incoming : sent;
  return (
    <div>
      <PageHeader title="Requests" />
      <div className="space-y-5 p-5">
        <p className="text-sm text-muted-foreground">Manage who can join your sessions. Only accepted members can chat.</p>
        <div role="tablist" aria-label="Request type" className="flex rounded-full border border-border bg-card p-1">
          {(["incoming", "sent"] as const).map(t => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cn("h-10 flex-1 rounded-full text-sm transition-colors", tab === t ? "bg-brand-soft font-medium text-brand" : "text-muted-foreground hover:bg-accent")}>
              {t === "incoming" ? `Incoming (${incoming.filter(r => r.status === "pending").length})` : `Sent (${sent.length})`}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {records.length === 0 ? (
            <Empty icon={Inbox} title="No requests yet" body={tab === "incoming" ? "When someone asks to join your session, their request will appear here." : "Your sent requests will appear here."} />
          ) : records.map(r => {
            const s = sessionFor(r.sessionId);
            if (!s) return null;
            const incomingRecord = tab === "incoming";
            const personId = incomingRecord ? r.userId : s.hostId;
            const person = state.people[personId];
            const statusClass = r.status === "accepted" ? "bg-brand-soft text-brand" : r.status === "pending" ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground";
            return (
              <article key={r.id} className="rounded-3xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <Avatar person={person} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{person?.name}{incomingRecord ? " wants to join" : ""}</p>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize", statusClass)}>{r.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.category} · {s.neighbourhood} · {r.partySize} {r.partySize === 1 ? "person" : "people"}</p>
                  </div>
                </div>
                {r.intro && <p className="mt-3 text-sm leading-relaxed">“{r.intro}”</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {incomingRecord && r.status === "pending" ? (
                    <>
                      <Button variant="brand" onClick={() => { const error = accept(r.id); if (error) toast.error(error); else toast.success("Request accepted — demo"); }}>Accept</Button>
                      <Button variant="outline" onClick={() => { decline(r.id); toast("Request declined — demo"); }}>Decline</Button>
                    </>
                  ) : !incomingRecord && r.status === "pending" ? (
                    <Button variant="outline" onClick={() => { cancelRequest(r.id); toast("Request cancelled — demo"); }}>Cancel request</Button>
                  ) : !incomingRecord && r.status === "accepted" ? (
                    <Button variant="brand" asChild><Link to="/chats/$id" params={{ id: s.id }}>Open chat</Link></Button>
                  ) : (
                    <Button variant="outline" asChild><Link to="/session/$id" params={{ id: s.id }}>View session</Link></Button>
                  )}
                </div>
                {incomingRecord && r.status === "pending" && r.partySize > seatsLeft(s, state.requests) && (
                  <p className="mt-2 text-xs text-warning">Not enough space for this request ({seatsLeft(s, state.requests)} remaining).</p>
                )}
              </article>
            );
          })}
        </div>
        <Button variant="outline" className="w-full" onClick={() => { simulateIncoming(); toast("Sample request generated, if a demo user is available"); }}><Plus className="size-4" /> Simulate a new request</Button>
        <p className="text-center text-xs text-muted-foreground">This is demo data. No real invitations are sent.</p>
      </div>
    </div>
  );
}
