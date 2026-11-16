import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, ChevronDown, SlidersHorizontal, SearchX, MapPin, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CATEGORIES, NEIGHBOURHOODS, ago, useDemo } from "@/lib/demo-store";
import { Logo, SessionCard, Empty, DemoTag } from "@/components/tokea/bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover — tokea demo" },
      { name: "description", content: "See who's out nearby in Nairobi for a casual drink. Demo preview with sample sessions." },
      { property: "og:title", content: "Discover — tokea demo" },
      { property: "og:description", content: "See who's out nearby in Nairobi for a casual drink." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

type Filters = { hood: string; maxKm: number; mode: "all" | "solo" | "group"; cats: string[] };
const DEFAULT: Filters = { hood: "All", maxKm: 50, mode: "all", cats: [] };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={cn("h-10 shrink-0 rounded-full border px-4 text-sm transition-colors", active ? "border-brand bg-brand-soft text-brand" : "border-border bg-card hover:bg-accent")}>
      {children}
    </button>
  );
}

function Discover() {
  const { state, setNeighbourhood, readNotices } = useDemo();
  const navigate = useNavigate();
  const [f, setF] = useState<Filters>(DEFAULT);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const unread = state.notices.filter((n) => !n.read).length;

  const list = useMemo(() => state.sessions
    .filter((s) => s.status === "open" || (s.hostId === "me" && s.status === "paused"))
    .filter((s) => !state.blocked.includes(s.hostId))
    .filter((s) => f.hood === "All" || s.neighbourhood === f.hood)
    .filter((s) => s.hostId === "me" || s.distanceKm <= f.maxKm)
    .filter((s) => f.mode === "all" || s.mode === f.mode)
    .filter((s) => f.cats.length === 0 || f.cats.includes(s.category))
    .sort((a, b) => (a.hostId === "me" ? -1 : b.hostId === "me" ? 1 : a.distanceKm - b.distanceKm)),
  [state, f]);

  const active = f.hood !== "All" || f.maxKm !== 50 || f.mode !== "all" || f.cats.length > 0;
  const toggleCat = (c: string) => setF((p) => ({ ...p, cats: p.cats.includes(c) ? p.cats.filter((x) => x !== c) : [...p.cats, c] }));

  return (
    <div>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-1">
          <button onClick={() => setHoodOpen(true)} className="inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm hover:bg-accent">
            <MapPin className="size-4 text-muted-foreground" />{state.neighbourhood}<ChevronDown className="size-4 text-muted-foreground" />
          </button>
          <button onClick={() => setNoticeOpen(true)} aria-label={`Notifications, ${unread} unread`} className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-accent">
            <Bell className="size-5" />
            {unread > 0 && <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-brand" />}
          </button>
        </div>
      </header>

      <section className="px-5 pt-6">
        <DemoTag />
        <h1 className="wordmark mt-3 text-4xl">Who's out nearby?</h1>
        <p className="mt-2 text-muted-foreground">People around Nairobi open to a casual drink. Ask to join — meet somewhere public.</p>
      </section>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <button onClick={() => setFilterOpen(true)} className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm", active ? "border-brand text-brand" : "border-border hover:bg-accent")}>
          <SlidersHorizontal className="size-4" /> Filters
        </button>
        <Chip active={f.hood === state.neighbourhood} onClick={() => setF((p) => ({ ...p, hood: p.hood === state.neighbourhood ? "All" : state.neighbourhood }))}>In {state.neighbourhood}</Chip>
        <Chip active={f.maxKm === 3} onClick={() => setF((p) => ({ ...p, maxKm: p.maxKm === 3 ? 50 : 3 }))}>Within 3 km</Chip>
        <Chip active={f.mode === "solo"} onClick={() => setF((p) => ({ ...p, mode: p.mode === "solo" ? "all" : "solo" }))}>Solo</Chip>
        <Chip active={f.mode === "group"} onClick={() => setF((p) => ({ ...p, mode: p.mode === "group" ? "all" : "group" }))}>Groups</Chip>
        {CATEGORIES.map((c) => <Chip key={c} active={f.cats.includes(c)} onClick={() => toggleCat(c)}>{c}</Chip>)}
      </div>

      <div className="mt-4 space-y-3 px-4 pb-8">
        <div className="flex h-8 items-center justify-between px-1 text-sm text-muted-foreground">
          <span>{list.length} session{list.length === 1 ? "" : "s"} · demo distances</span>
          {active && <button onClick={() => setF(DEFAULT)} className="h-8 font-medium text-brand">Reset</button>}
        </div>
        {list.length === 0 ? (
          <Empty icon={SearchX} title="No one matches right now" body="Try widening the distance or clearing a filter. You could also host your own." action={<Button variant="outline" onClick={() => setF(DEFAULT)}>Reset filters</Button>} />
        ) : list.map((s) => <SessionCard key={s.id} session={s} />)}
        <p className="flex items-start gap-2 px-1 pt-4 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" /> Adults 18+. Locations are approximate. Always meet in a public venue and leave whenever you like.</p>
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
          <div className="space-y-6 px-4 pb-6">
            <div>
              <p className="mb-2 text-sm font-medium">Neighbourhood</p>
              <div className="flex flex-wrap gap-2">{["All", ...NEIGHBOURHOODS].map((n) => <Chip key={n} active={f.hood === n} onClick={() => setF((p) => ({ ...p, hood: n }))}>{n}</Chip>)}</div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Distance (approximate)</p>
              <div className="flex flex-wrap gap-2">{[[1, "1 km"], [3, "3 km"], [5, "5 km"], [10, "10 km"], [50, "Any"]].map(([k, l]) => <Chip key={k} active={f.maxKm === k} onClick={() => setF((p) => ({ ...p, maxKm: k as number }))}>{l}</Chip>)}</div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Who's hosting</p>
              <div className="flex gap-2">{(["all", "solo", "group"] as const).map((m) => <Chip key={m} active={f.mode === m} onClick={() => setF((p) => ({ ...p, mode: m }))}>{m === "all" ? "Anyone" : m === "solo" ? "Individuals" : "Groups"}</Chip>)}</div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Drink</p>
              <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c} active={f.cats.includes(c)} onClick={() => toggleCat(c)}>{c}</Chip>)}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setF(DEFAULT)}>Reset</Button>
              <Button variant="brand" className="flex-1" onClick={() => setFilterOpen(false)}>Show {list.length}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={hoodOpen} onOpenChange={setHoodOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader><SheetTitle>Your area</SheetTitle><p className="text-sm text-muted-foreground">Chosen manually — no GPS used.</p></SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-6">
            {NEIGHBOURHOODS.map((n) => (
              <button key={n} onClick={() => { setNeighbourhood(n); setHoodOpen(false); }} className={cn("h-12 rounded-2xl border text-sm", state.neighbourhood === n ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-accent")}>{n}</button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={noticeOpen} onOpenChange={(o) => { setNoticeOpen(o); if (!o) readNotices(); }}>
        <SheetContent side="right" className="w-full max-w-sm">
          <SheetHeader><SheetTitle>Notifications</SheetTitle><p className="text-sm text-muted-foreground">Simulated alerts — no push service.</p></SheetHeader>
          <div className="space-y-1 px-2">
            {state.notices.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nothing yet.</p>}
            {state.notices.map((n) => (
              <button key={n.id} onClick={() => { setNoticeOpen(false); readNotices(); if (n.link) navigate({ to: n.link }); }} className="flex w-full items-start gap-3 rounded-2xl p-3 text-left hover:bg-accent">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand")} />
                <span><span className="block text-sm">{n.text}</span><span className="text-xs text-muted-foreground">{ago(n.at)}</span></span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}