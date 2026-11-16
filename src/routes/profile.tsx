import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserRound, ChevronRight } from "lucide-react";
import { useDemo, ME, type Theme } from "@/lib/demo-store";
import { Avatar, PageHeader, SessionCard, Empty } from "@/components/tokea/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — tokea demo" }] }),
  component: Profile,
});

function Profile() {
  const { state, setProfile, setTheme, unblock, reset } = useDemo();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [bio, setBio] = useState(state.profile.bio);
  const [sheet, setSheet] = useState<"privacy" | "terms" | "blocked" | null>(null);
  const mySessions = state.sessions.filter((s) => s.hostId === ME);
  return (
    <div>
      <PageHeader title="Profile" />
      <div className="space-y-6 p-5">
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <Avatar person={state.people[ME]} size={64} />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">{state.profile.name}</h2>
              <p className="text-sm text-muted-foreground">{state.neighbourhood} · Demo profile</p>
              <p className="text-xs text-muted-foreground">Identity and age not verified</p>
            </div>
          </div>
          <p className="mt-4 text-sm">{state.profile.bio || "No bio yet."}</p>
          <Button variant="outline" className="mt-4" onClick={() => { setName(state.profile.name); setBio(state.profile.bio); setEditOpen(true); }}>Edit profile</Button>
        </section>
        <section>
          <h3 className="mb-3 text-sm font-medium">My sessions ({mySessions.length})</h3>
          <div className="space-y-3">
            {mySessions.length ? mySessions.map((s) => <SessionCard key={s.id} session={s} />) :
              <Empty icon={UserRound} title="No hosted sessions" body="Host a drink when you feel like meeting people." action={<Button variant="outline" asChild><Link to="/host" search={{ edit: undefined }}>Host a drink</Link></Button>} />}
          </div>
        </section>
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium">Appearance</h3>
          <div className="flex flex-wrap gap-2">
            {(["system", "light", "dark"] as Theme[]).map((t) => <button key={t} onClick={() => setTheme(t)} className={cn("h-11 rounded-full border px-4 text-sm capitalize", state.theme === t ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-accent")}>{t}</button>)}
          </div>
          <p className="text-xs text-muted-foreground">Follows your device unless changed here.</p>
        </section>
        <section className="rounded-3xl border border-border bg-card p-5">
          <h3 className="mb-2 text-sm font-medium">Privacy & safety</h3>
          {([["Privacy policy", "privacy"], ["Terms & community guidelines", "terms"], [`Blocked users (${state.blocked.length})`, "blocked"]] as const).map(([label, value]) =>
            <button key={value} onClick={() => setSheet(value)} className="flex h-14 w-full items-center justify-between border-b border-border text-left text-sm last:border-0">{label}<ChevronRight className="size-4 text-muted-foreground" /></button>)}
        </section>
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium">Prototype controls</h3>
          <p className="text-sm text-muted-foreground">All activity is simulated and saved on this device only.</p>
          <Button variant="outline" className="w-full" onClick={() => { if (confirm("Reset all demo data?")) { reset(); toast("Demo reset"); } }}>Reset demonstration</Button>
          <Button variant="ghost" className="w-full" onClick={() => { reset(); toast("Demo signed out"); }}>Log out of demo</Button>
        </section>
      </div>
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader><SheetTitle>Edit profile</SheetTitle></SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <label className="block text-sm font-medium">First name<Input className="mt-2 h-11 rounded-xl" value={name} maxLength={35} onChange={(e) => setName(e.target.value)} /></label>
            <label className="block text-sm font-medium">Short bio<Textarea className="mt-2" maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
            <Button variant="brand" className="w-full" onClick={() => { if (!name.trim()) { toast.error("Add a first name"); return; } setProfile({ name: name.trim(), bio: bio.trim() }); setEditOpen(false); toast.success("Profile saved (demo)"); }}>Save changes</Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={sheet !== null} onOpenChange={(v) => { if (!v) setSheet(null); }}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader><SheetTitle>{sheet === "privacy" ? "Privacy Policy" : sheet === "terms" ? "Terms & Community Guidelines" : "Blocked users"}</SheetTitle></SheetHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4 pb-6 text-sm">
            {sheet === "blocked" ? state.blocked.length ? state.blocked.map((id) =>
              <div className="flex items-center gap-3" key={id}><Avatar person={state.people[id]} /><span className="flex-1">{state.people[id]?.name}</span><Button variant="outline" onClick={() => { unblock(id); toast("Unblocked"); }}>Unblock</Button></div>) :
              <p className="text-muted-foreground">No blocked users.</p> :
              <><p className="text-xs text-muted-foreground">Effective: November 16, 2026 · Preliminary policy draft</p>
                {sheet === "privacy" ? <>
                  <p>Tokea helps adults connect through nearby social sessions. The planned production service may process account, profile, approximate location, session, messaging and device data to provide the experience.</p>
                  <p>Exact personal coordinates and residential addresses must not be shown in public discovery. Authorized session participants access private chats after host approval. Personal information must be protected and users should have lawful rights to access, correct and delete their information.</p>
                  <p>This prototype uses sample data in local browser storage only; it does not collect your GPS location, send SMS or transmit chat messages.</p>
                </> : <>
                  <p>Tokea is intended for adults aged 18 and above, subject to applicable Kenyan law. Phone OTP or a self-declaration is not proof of age.</p>
                  <p>Respect consent and personal boundaries. No harassment, discrimination, scams, impersonation, underage activity or unsafe drinking challenges.</p>
                  <p>Meet in public places, protect other people's privacy, and never drink and drive. Users are responsible for their own decisions. Nothing limits liability that cannot legally be excluded.</p>
                </>}
                <p className="text-xs text-muted-foreground">This draft requires a legal and data-protection review before release.</p></>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
