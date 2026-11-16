import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { MoreHorizontal, ShieldCheck, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useDemo, canChat, ME } from "@/lib/demo-store";
import { Avatar, PageHeader, Empty } from "@/components/tokea/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chats/$id")({
  head: () => ({ meta: [{ title: "Session chat — tokea demo" }] }),
  component: Chat,
});

function Chat() {
  const { id } = Route.useParams();
  const { state, sendMessage, block, report } = useDemo();
  const [text, setText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const s = state.sessions.find((s) => s.id === id);
  const allowed = !!s && s.status !== "ended" && !state.blocked.includes(s.hostId) && canChat(s, state.requests);
  const messages = state.messages.filter((m) => m.sessionId === id && !state.blocked.includes(m.userId)).sort((a, b) => a.at - b.at);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);
  if (!s || !allowed) return <><PageHeader title="Chat unavailable" back /><div className="p-5"><Empty icon={MessageCircle} title="Chat locked" body="Private messaging is only available to the host and accepted participants of an active session." action={<Button variant="outline" asChild><Link to="/chats">Back to chats</Link></Button>} /></div></>;
  const host = state.people[s.hostId];
  const ids = [...new Set([s.hostId, ...state.requests.filter((r) => r.sessionId === id && r.status === "accepted").map((r) => r.userId)])].filter((userId) => !state.blocked.includes(userId));
  function submit(e: FormEvent) { e.preventDefault(); if (!text.trim()) return; sendMessage(id, text.trim().slice(0, 500)); setText(""); }
  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader back title={s.hostId === ME ? "Your session" : `${host?.name ?? "Someone"}'s session`} right={<button className="inline-flex size-11 items-center justify-center rounded-full hover:bg-accent" onClick={() => setShowOptions(true)} aria-label="Session options"><MoreHorizontal className="size-5" /></button>} />
      <div className="flex-1 space-y-5 p-5 pb-6">
        <p className="text-sm text-muted-foreground">{s.category} · {s.neighbourhood} · {ids.length} participants · demo chat</p>
        <p className="flex gap-2 rounded-2xl bg-muted p-4 text-sm"><ShieldCheck className="size-4 shrink-0 text-brand" /> Agree on a safe public meeting place. No real messages are delivered in this prototype.</p>
        <div className="space-y-3">
          {messages.map((m) => <div key={m.id} className={cn("max-w-[86%] rounded-2xl border border-border bg-card px-4 py-3 text-sm", m.userId === ME && "ml-auto border-brand/10 bg-brand-soft")}>
            <p className="mb-1 text-xs text-muted-foreground">{m.userId === ME ? "You" : state.people[m.userId]?.name}</p>
            <p className="whitespace-pre-wrap break-words">{m.text}</p>
            <p className="mt-1 text-right text-xs text-muted-foreground">{new Date(m.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
          </div>)}
          {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">Say hello to the group.</p>}
          <div ref={bottom} />
        </div>
      </div>
      <form className="sticky bottom-0 flex gap-2 border-t border-border bg-background p-3" onSubmit={submit}>
        <Input aria-label="Message" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} className="h-11 rounded-xl" placeholder="Write a message…" />
        <Button variant="brand" size="icon" type="submit" aria-label="Send message" disabled={!text.trim()}><Send className="size-4" /></Button>
      </form>
      <Sheet open={showOptions} onOpenChange={setShowOptions}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader><SheetTitle>Session options</SheetTitle></SheetHeader>
          <div className="space-y-3 px-4 pb-6">
            <p className="text-sm font-medium">Participants</p>
            {ids.map((personId) => <div key={personId} className="flex items-center gap-3 py-2">
              <Avatar person={state.people[personId]} size={36} />
              <span className="flex-1 text-sm">{state.people[personId]?.name}{personId === ME ? " (you)" : ""}</span>
              {personId !== ME && <Button variant="outline" size="sm" onClick={() => { if (confirm("Block this person in the demo?")) { block(personId); toast("Blocked (demo)"); setShowOptions(false); } }}>Block</Button>}
            </div>)}
            <Button variant="outline" className="w-full" onClick={() => { report(); toast("Report noted locally — demo only"); setShowOptions(false); }}>Report this session</Button>
            <Button variant="outline" className="w-full" asChild><Link to="/session/$id" params={{ id }}>View session details</Link></Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
