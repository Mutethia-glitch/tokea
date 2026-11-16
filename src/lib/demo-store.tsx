import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const NEIGHBOURHOODS = ["Westlands", "Kilimani", "Kileleshwa", "Lavington", "Karen", "CBD", "Parklands", "Upper Hill"] as const;
export const CATEGORIES = ["Beer", "Wine", "Cocktails", "Coffee", "Soft drinks", "Tea"] as const;
export type Category = (typeof CATEGORIES)[number];
export type OpenTo = "individuals" | "groups" | "both";
export type SessionStatus = "open" | "paused" | "ended";
export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";
export const ME = "me";

export type Person = { id: string; name: string; neighbourhood: string; bio: string; hue: number };
export type Session = {
  id: string; hostId: string; vibe: string; category: Category; drink?: string;
  mode: "solo" | "group"; groupSize: number; capacity: number; openTo: OpenTo;
  neighbourhood: string; distanceKm: number; start: string; end: string; status: SessionStatus;
};
export type JoinRequest = { id: string; sessionId: string; userId: string; partySize: number; intro: string; status: RequestStatus; at: number };
export type Message = { id: string; sessionId: string; userId: string; text: string; at: number };
export type Notice = { id: string; text: string; at: number; read: boolean; link?: string };
export type Theme = "system" | "light" | "dark";

export type DemoState = {
  onboarded: boolean; neighbourhood: string; theme: Theme;
  profile: { name: string; bio: string };
  people: Record<string, Person>; sessions: Session[]; requests: JoinRequest[];
  messages: Message[]; notices: Notice[]; blocked: string[]; reports: number;
};

const now = () => Date.now();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export function makeSeed(): DemoState {
  const t = now();
  const people: Record<string, Person> = {
    [ME]: { id: ME, name: "Alex", neighbourhood: "Kileleshwa", bio: "", hue: 290 },
    amani: { id: "amani", name: "Amani", neighbourhood: "Westlands", bio: "Product designer. Likes slow evenings and good playlists.", hue: 30 },
    wanjiru: { id: "wanjiru", name: "Wanjiru", neighbourhood: "Kilimani", bio: "Runs a small book club. Always up for a recommendation.", hue: 160 },
    otieno: { id: "otieno", name: "Otieno", neighbourhood: "CBD", bio: "Teacher, chess on weekends.", hue: 220 },
    njeri: { id: "njeri", name: "Njeri", neighbourhood: "Karen", bio: "Garden person. Hosting with my sister.", hue: 340 },
    kiprono: { id: "kiprono", name: "Kiprono", neighbourhood: "Kileleshwa", bio: "Not drinking this month — football and mocktails.", hue: 120 },
    zawadi: { id: "zawadi", name: "Zawadi", neighbourhood: "Kileleshwa", bio: "New to Nairobi, moved from Mombasa.", hue: 10 },
    achieng: { id: "achieng", name: "Achieng", neighbourhood: "Lavington", bio: "Coming with a colleague after work.", hue: 260 },
    brian: { id: "brian", name: "Brian", neighbourhood: "Kilimani", bio: "Software dev, quiet but friendly.", hue: 190 },
  };
  const sessions: Session[] = [
    { id: "s1", hostId: "amani", vibe: "After-work drink, chatty but low-key. Happy to meet new faces.", category: "Beer", mode: "solo", groupSize: 1, capacity: 2, openTo: "both", neighbourhood: "Westlands", distanceKm: 3.4, start: "18:00", end: "21:00", status: "open" },
    { id: "s2", hostId: "wanjiru", vibe: "Book club spillover — a glass of wine and easy conversation.", category: "Wine", mode: "group", groupSize: 3, capacity: 3, openTo: "individuals", neighbourhood: "Kilimani", distanceKm: 1.6, start: "19:00", end: "22:00", status: "open" },
    { id: "s3", hostId: "otieno", vibe: "Quick coffee before heading home. Board games welcome.", category: "Coffee", mode: "solo", groupSize: 1, capacity: 1, openTo: "individuals", neighbourhood: "CBD", distanceKm: 4.8, start: "17:30", end: "19:00", status: "open" },
    { id: "s4", hostId: "njeri", vibe: "Slow cocktails at a garden venue. Two of us, room for a few more.", category: "Cocktails", mode: "group", groupSize: 2, capacity: 4, openTo: "both", neighbourhood: "Karen", distanceKm: 9.5, start: "16:00", end: "20:00", status: "open" },
    { id: "s5", hostId: "kiprono", vibe: "Not drinking alcohol tonight — mocktails and the late match.", category: "Soft drinks", mode: "solo", groupSize: 1, capacity: 3, openTo: "both", neighbourhood: "Kileleshwa", distanceKm: 0.8, start: "20:00", end: "23:00", status: "open" },
    { id: "mine", hostId: ME, vibe: "Quiet drink, new-ish to the area. Up for swapping neighbourhood tips.", category: "Beer", mode: "solo", groupSize: 1, capacity: 3, openTo: "both", neighbourhood: "Kileleshwa", distanceKm: 0, start: "18:30", end: "21:30", status: "open" },
  ];
  const requests: JoinRequest[] = [
    { id: "r1", sessionId: "s2", userId: ME, partySize: 1, intro: "Love the book club idea!", status: "accepted", at: t - 3.6e6 },
    { id: "r2", sessionId: "s3", userId: "brian", partySize: 1, intro: "", status: "accepted", at: t - 5e6 },
    { id: "r3", sessionId: "mine", userId: "zawadi", partySize: 1, intro: "Hi! Just moved here, would be great to meet people.", status: "pending", at: t - 9e5 },
    { id: "r4", sessionId: "mine", userId: "achieng", partySize: 2, intro: "Me and a colleague, we'll be done at 6.", status: "pending", at: t - 4e5 },
    { id: "r5", sessionId: "mine", userId: "brian", partySize: 1, intro: "Neighbour here 👋", status: "accepted", at: t - 2e6 },
  ];
  const messages: Message[] = [
    { id: "m1", sessionId: "s2", userId: "wanjiru", text: "Welcome! We're thinking of a café-bar on Argwings Kodhek — somewhere public and well lit.", at: t - 3e6 },
    { id: "m2", sessionId: "s2", userId: ME, text: "Sounds good. I'll be there around 7:15.", at: t - 2.8e6 },
    { id: "m3", sessionId: "s2", userId: "wanjiru", text: "Perfect, we'll grab a table near the front.", at: t - 2.7e6 },
    { id: "m4", sessionId: "mine", userId: "brian", text: "Hey! Any spot in mind? I'm flexible.", at: t - 1.8e6 },
  ];
  const notices: Notice[] = [
    { id: "n1", text: "Achieng requested to join your session (party of 2).", at: t - 4e5, read: false, link: "/requests" },
    { id: "n2", text: "Zawadi requested to join your session.", at: t - 9e5, read: false, link: "/requests" },
    { id: "n3", text: "Wanjiru accepted your request. Chat is now open.", at: t - 3.5e6, read: true, link: "/chats/s2" },
  ];
  return { onboarded: false, neighbourhood: "Kileleshwa", theme: "system", profile: { name: "Alex", bio: "Here for good conversation, no pressure." }, people, sessions, requests, messages, notices, blocked: [], reports: 0 };
}

export function seatsLeft(s: Session, requests: JoinRequest[]) {
  const taken = requests.filter((r) => r.sessionId === s.id && r.status === "accepted").reduce((a, r) => a + r.partySize, 0);
  return Math.max(0, s.capacity - taken);
}

export function canChat(s: Session, requests: JoinRequest[], userId = ME) {
  if (s.hostId === userId) return true;
  return requests.some((r) => r.sessionId === s.id && r.userId === userId && r.status === "accepted");
}

/** Pure rule: returns an error message or null. */
export function joinError(state: Pick<DemoState, "sessions" | "requests" | "blocked">, sessionId: string, partySize: number, userId = ME): string | null {
  const s = state.sessions.find((x) => x.id === sessionId);
  if (!s) return "Session not found.";
  if (s.hostId === userId) return "You can't request to join your own session.";
  if (state.blocked.includes(s.hostId)) return "You've blocked this host.";
  if (s.status !== "open") return "This session isn't accepting requests.";
  if (state.requests.some((r) => r.sessionId === sessionId && r.userId === userId && (r.status === "pending" || r.status === "accepted")))
    return "You already have a request for this session.";
  const left = seatsLeft(s, state.requests);
  if (partySize < 1 || partySize > left) return left === 0 ? "This session is full." : `Only ${left} seat${left === 1 ? "" : "s"} left.`;
  if (s.openTo === "individuals" && partySize > 1) return "This host is only open to individuals.";
  if (s.openTo === "groups" && partySize < 2) return "This host is looking for groups.";
  return null;
}

export function acceptError(state: Pick<DemoState, "sessions" | "requests" | "blocked">, requestId: string): string | null {
  const r = state.requests.find((x) => x.id === requestId);
  if (!r || r.status !== "pending") return "Request is no longer pending.";
  const s = state.sessions.find((x) => x.id === r.sessionId);
  if (!s) return "Session not found.";
  if (s.hostId !== ME) return "Only the session host can accept requests.";
  if (s.status !== "open") return "This session is no longer accepting requests.";
  if (state.blocked.includes(r.userId)) return "This person is blocked.";
  const left = seatsLeft(s, state.requests);
  if (r.partySize < 1 || r.partySize > left) return `Not enough seats — ${left} left, request is for ${r.partySize}.`;
  return null;
}

/** Pure demo rule. Production authorization must be enforced server-side. */
export function messageError(state: Pick<DemoState, "sessions" | "requests" | "blocked">, sessionId: string, userId = ME): string | null {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session || session.status === "ended") return "Session chat is unavailable.";
  if (state.blocked.includes(session.hostId) || state.blocked.includes(userId)) return "This chat is blocked.";
  if (!canChat(session, state.requests, userId)) return "Chat is only available to accepted participants.";
  return null;
}

type Ctx = ReturnType<typeof useProvideStore>;
const StoreCtx = createContext<Ctx | null>(null);
const KEY = "tokea-demo-v1";

function useProvideStore() {
  const [state, setState] = useState<DemoState>(() => makeSeed());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setState(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, ready]);

  useEffect(() => {
    const apply = () => {
      const dark = state.theme === "dark" || (state.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [state.theme]);

  const notify = (s: DemoState, text: string, link?: string): Notice[] => [{ id: uid("n"), text, at: now(), read: false, link }, ...s.notices];

  const actions = {
    onboard: (name: string, neighbourhood: string) => setState((s) => ({ ...s, onboarded: true, neighbourhood, profile: { ...s.profile, name: name || "Alex" }, people: { ...s.people, [ME]: { ...s.people[ME], name: name || "Alex", neighbourhood } }, sessions: s.sessions.map((x) => (x.id === "mine" ? { ...x, neighbourhood } : x)) })),
    setNeighbourhood: (n: string) => setState((s) => ({ ...s, neighbourhood: n })),
    setTheme: (theme: Theme) => setState((s) => ({ ...s, theme })),
    setProfile: (p: { name: string; bio: string }) => setState((s) => ({ ...s, profile: p, people: { ...s.people, [ME]: { ...s.people[ME], name: p.name } } })),
    requestJoin: (sessionId: string, partySize: number, intro: string): string | null => {
      const err = joinError(state, sessionId, partySize);
      if (err) return err;
      setState((s) => ({ ...s, requests: [...s.requests, { id: uid("r"), sessionId, userId: ME, partySize, intro, status: "pending", at: now() }] }));
      return null;
    },
    cancelRequest: (id: string) => setState((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)) })),
    accept: (id: string): string | null => {
      const err = acceptError(state, id);
      if (err) return err;
      setState((s) => {
        const r = s.requests.find((x) => x.id === id)!;
        const isMine = r.userId === ME;
        const host = s.people[s.sessions.find((x) => x.id === r.sessionId)!.hostId];
        return {
          ...s,
          requests: s.requests.map((x) => (x.id === id ? { ...x, status: "accepted" } : x)),
          notices: isMine ? notify(s, `${host.name} accepted your request (demo simulation). Chat is open.`, `/chats/${r.sessionId}`) : s.notices,
        };
      });
      return null;
    },
    decline: (id: string) => setState((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, status: "declined" } : r)) })),
    simulateIncoming: () => setState((s) => {
      const mine = s.sessions.find((x) => x.hostId === ME && x.status === "open");
      if (!mine) return s;
      const pool = ["amani", "otieno", "njeri", "kiprono"].filter((p) => !s.blocked.includes(p) && !s.requests.some((r) => r.sessionId === mine.id && r.userId === p && r.status !== "cancelled"));
      const who = pool[0];
      if (!who) return s;
      return { ...s, requests: [...s.requests, { id: uid("r"), sessionId: mine.id, userId: who, partySize: 1, intro: "Saw your post — mind if I join?", status: "pending", at: now() }], notices: notify(s, `${s.people[who].name} requested to join your session (demo).`, "/requests") };
    }),
    createSession: (data: Omit<Session, "id" | "hostId" | "status" | "distanceKm">) => {
      const id = uid("s");
      setState((s) => ({ ...s, sessions: [{ ...data, id, hostId: ME, status: "open", distanceKm: 0 }, ...s.sessions] }));
      return id;
    },
    updateSession: (id: string, data: Partial<Session>) => setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...data } : x)) })),
    sendMessage: (sessionId: string, text: string) => setState((s) => {
      const safeText = text.trim().slice(0, 500);
      if (!safeText || messageError(s, sessionId)) return s;
      return { ...s, messages: [...s.messages, { id: uid("m"), sessionId, userId: ME, text: safeText, at: now() }] };
    }),
    block: (userId: string) => setState((s) => ({ ...s, blocked: [...new Set([...s.blocked, userId])], requests: s.requests.map((r) => (r.userId === userId && r.status === "pending" ? { ...r, status: "declined" } : r)) })),
    unblock: (userId: string) => setState((s) => ({ ...s, blocked: s.blocked.filter((b) => b !== userId) })),
    report: () => setState((s) => ({ ...s, reports: s.reports + 1 })),
    readNotices: () => setState((s) => ({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) })),
    reset: () => { localStorage.removeItem(KEY); setState(makeSeed()); },
  };
  return { state, ready, ...actions };
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const store = useProvideStore();
  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}
export function useDemo() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useDemo outside provider");
  return c;
}

export function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}
export function ago(at: number) {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}