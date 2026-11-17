import { useState } from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NEIGHBOURHOODS, useDemo } from "@/lib/demo-store";
import { Logo, DemoTag } from "./bits";
import { cn } from "@/lib/utils";

export function Onboarding() {
  const { onboard } = useDemo();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("Alex");
  const [hood, setHood] = useState("Kileleshwa");
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState("");

  const phoneOk = /^(7|1)\d{8}$/.test(phone.replace(/\s/g, ""));

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      <div className="flex items-center justify-between"><Logo /><DemoTag /></div>

      {step === 0 && (
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="wordmark text-5xl">Find your people.<br /><span className="text-brand">Share a drink.</span></h1>
          <p className="mt-4 text-muted-foreground">See who's out for a casual drink nearby, ask to join, and meet somewhere public.</p>
          <div className="mt-8 rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="font-medium">For adults 18+ only</p>
          </div>
          <div className="mt-8 space-y-3">
            <Button variant="brand" size="lg" className="w-full" onClick={() => setStep(1)}>Get started <ArrowRight /></Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>Skip sign-in — Enter demo</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-1 flex-col pt-12">
          <h2 className="text-2xl font-semibold">Your phone number</h2>
          <p className="mt-1 text-sm text-muted-foreground">Demo only — no SMS is sent. Any code works.</p>
          <Label htmlFor="phone" className="mt-8">Kenya mobile number</Label>
          <div className="mt-2 flex gap-2">
            <span className="inline-flex h-11 items-center rounded-xl border border-input px-3 text-sm text-muted-foreground">🇰🇪 +254</span>
            <Input id="phone" inputMode="tel" placeholder="712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" />
          </div>
          {phone && !phoneOk && <p className="mt-2 text-sm text-destructive">Enter 9 digits starting with 7 or 1.</p>}
          {phoneOk && (
            <>
              <Label htmlFor="otp" className="mt-6">6-digit code (demo)</Label>
              <Input id="otp" inputMode="numeric" maxLength={6} placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="mt-2 h-11 rounded-xl tracking-[0.4em]" />
            </>
          )}
          <div className="mt-auto space-y-3 pt-8">
            <Button variant="brand" size="lg" className="w-full" disabled={!phoneOk || otp.length !== 6} onClick={() => setStep(2)}>Continue</Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep(0)}>Back</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-1 flex-col pt-10">
          <h2 className="text-2xl font-semibold">A little about you</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick a general area. We never ask for GPS or your address.</p>
          <Label htmlFor="name" className="mt-6">First name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 rounded-xl" />
          <p className="mt-6 text-sm font-medium">Neighbourhood</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {NEIGHBOURHOODS.map((n) => (
              <button key={n} onClick={() => setHood(n)} className={cn("h-11 rounded-full border px-4 text-sm", hood === n ? "border-brand bg-brand-soft text-brand" : "border-border hover:bg-accent")}>{n}</button>
            ))}
          </div>
          <div className="mt-6 space-y-3 rounded-2xl border border-border p-4 text-sm">
            <label className="flex min-h-11 items-start gap-3"><Checkbox checked={adult} onCheckedChange={(v) => setAdult(!!v)} className="mt-0.5" /> I confirm I'm 18 or older. (Self-declared — not age verification.)</label>
            <label className="flex min-h-11 items-start gap-3"><Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" /> I agree to the community guidelines: meet in public, respect consent, no sales or pressure to drink.</label>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" /> Legal terms pending final Kenya review.</p>
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <div className="mt-auto pt-8">
            <Button variant="brand" size="lg" className="w-full" onClick={() => {
              if (!name.trim()) return setErr("Add a first name.");
              if (!adult || !terms) return setErr("Please confirm both to continue.");
              onboard(name.trim(), hood);
            }}>Enter demo</Button>
          </div>
        </div>
      )}
    </div>
  );
}