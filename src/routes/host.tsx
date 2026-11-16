import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, NEIGHBOURHOODS, useDemo, type Category, type OpenTo } from "@/lib/demo-store";
import { PageHeader } from "@/components/tokea/bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/host")({
  validateSearch: (s: Record<string, unknown>) => ({ edit: typeof s.edit === "string" ? s.edit : undefined }),
  head: () => ({ meta: [{ title: "Host a drink — tokea demo" }, { name: "description", content: "Post a casual drink session in the Tokea demo." }, { property: "og:title", content: "Host a drink — tokea demo" }, { property: "og:description", content: "Post a casual drink session." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Host,
});

const Opt = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} aria-pressed={on} className={cn("h-11 rounded-full border px-4 text-sm", on ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-accent")}>{children}</button>
);

function Host() {
  const { edit } = Route.useSearch();
  const { state, createSession, updateSession } = useDemo();
  const nav = useNavigate();
  const ex = state.sessions.find((s) => s.id === edit && s.hostId === "me");
  const [mode, setMode] = useState<"solo" | "group">(ex?.mode ?? "solo");
  const [category, setCategory] = useState<Category | "">(ex?.category ?? "");
  const [drink, setDrink] = useState(ex?.drink ?? "");
  const [vibe, setVibe] = useState(ex?.vibe ?? "");
  const [groupSize, setGroupSize] = useState(ex?.groupSize ?? 1);
  const [capacity, setCapacity] = useState(ex?.capacity ?? 2);
  const [openTo, setOpenTo] = useState<OpenTo>(ex?.openTo ?? "both");
  const [hood, setHood] = useState(ex?.neighbourhood ?? state.neighbourhood);
  const [start, setStart] = useState(ex?.start ?? "18:00");
  const [end, setEnd] = useState(ex?.end ?? "21:00");
  const [errs, setErrs] = useState<string[]>([]);

  const submit = () => {
    const e: string[] = [];
    if (!category) e.push("Choose a drink category.");
    if (vibe.trim().length < 10) e.push("Add a short vibe (at least 10 characters).");
    if (capacity < 1) e.push("Offer at least one seat.");
    if (end <= start) e.push("End time must be after start.");
    setErrs(e);
    if (e.length) return;
    const data = { mode, category: category as Category, drink: drink || undefined, vibe: vibe.trim(), groupSize: mode === "solo" ? 1 : Math.max(2, groupSize), capacity, openTo, neighbourhood: hood, start, end };
    if (ex) { updateSession(ex.id, data); toast.success("Session updated"); nav({ to: "/session/$id", params: { id: ex.id } }); }
    else { const id = createSession(data); toast.success("Published (demo) — visible in Discover"); nav({ to: "/session/$id", params: { id } }); }
  };

  return (
    <div>
      <PageHeader title={ex ? "Edit session" : "Host a drink"} back />
      <div className="space-y-6 p-5">
        <section><p className="mb-2 text-sm font-medium">Going</p><div className="flex gap-2"><Opt on={mode === "solo"} onClick={() => setMode("solo")}>Just me</Opt><Opt on={mode === "group"} onClick={() => { setMode("group"); setGroupSize(Math.max(2, groupSize)); }}>With friends</Opt></div>
          {mode === "group" && <label className="mt-3 flex items-center justify-between text-sm">Group size now<Input type="number" min={2} max={10} value={groupSize} onChange={(e) => setGroupSize(+e.target.value)} className="h-11 w-20 rounded-xl" /></label>}</section>
        <section><p className="mb-2 text-sm font-medium">Drink *</p><div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Opt key={c} on={category === c} onClick={() => setCategory(c)}>{c}</Opt>)}</div>
          <Input placeholder="Specific drink (optional)" value={drink} onChange={(e) => setDrink(e.target.value)} className="mt-3 h-11 rounded-xl" /></section>
        <section><p className="mb-2 text-sm font-medium">Vibe *</p><Textarea maxLength={160} placeholder="e.g. Low-key after-work chat, happy to meet new people." value={vibe} onChange={(e) => setVibe(e.target.value)} /></section>
        <section className="flex items-center justify-between text-sm"><span className="font-medium">Seats to offer</span><Input type="number" min={1} max={10} value={capacity} onChange={(e) => setCapacity(+e.target.value)} className="h-11 w-20 rounded-xl" /></section>
        <section><p className="mb-2 text-sm font-medium">Open to</p><div className="flex gap-2">{(["individuals", "groups", "both"] as const).map((o) => <Opt key={o} on={openTo === o} onClick={() => setOpenTo(o)}>{o[0].toUpperCase() + o.slice(1)}</Opt>)}</div></section>
        <section><p className="mb-2 text-sm font-medium">General area</p><div className="flex flex-wrap gap-2">{NEIGHBOURHOODS.map((n) => <Opt key={n} on={hood === n} onClick={() => setHood(n)}>{n}</Opt>)}</div><p className="mt-2 text-xs text-muted-foreground">No exact addresses. Agree on a public venue in chat.</p></section>
        <section className="grid grid-cols-2 gap-3 text-sm"><label>From<Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 h-11 rounded-xl" /></label><label>Until<Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 h-11 rounded-xl" /></label></section>
        {errs.length > 0 && <ul role="alert" className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">{errs.map((e) => <li key={e}>{e}</li>)}</ul>}
        <Button variant="brand" size="lg" className="w-full" onClick={submit}>{ex ? "Save changes" : "Publish session"}</Button>
      </div>
    </div>
  );
}