import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)("PostgreSQL invitation + notifications transaction", () => {
  it("serializes concurrent approvals, prevents overbooking, persists inbox and device push jobs", async () => {
    const { pool } = await import("./db.js");
    const { decideJoinRequest } = await import("./decisions.js");
    const { getInbox, markInboxRead } = await import("./inbox.js");
    const { getDiscoverSessions } = await import("./sessions.js");

    const host = randomUUID(), guestA = randomUUID(), guestB = randomUUID();
    const session = randomUUID(), rA = randomUUID(), rB = randomUUID();
    const deviceA = randomUUID(), deviceB = randomUUID();
    const tx = await pool.connect();
    try {
      await tx.query("BEGIN");
      for (const [id,name] of [[host,"Host"],[guestA,"Guest A"],[guestB,"Guest B"]]) {
        await tx.query("INSERT INTO users(id,display_name,age_verified_at) VALUES($1,$2,NOW())", [id,name]);
      }
      await tx.query(
        `INSERT INTO sessions(id,host_user_id,title,category,neighbourhood,guest_capacity,starts_at,ends_at)
         VALUES($1,$2,'A relaxed drink','Muratina','Kileleshwa',1,NOW()+INTERVAL '2 hours',NOW()+INTERVAL '4 hours')`,
        [session,host],
      );
      await tx.query(
        `INSERT INTO join_requests(id,session_id,applicant_user_id,party_size)
         VALUES($1,$2,$3,1),($4,$2,$5,1)`,
        [rA,session,guestA,rB,guestB],
      );
      await tx.query(
        `INSERT INTO push_devices(id,user_id,expo_push_token,platform)
         VALUES($1,$2,$3,'android'),($4,$5,$6,'ios')`,
        [deviceA,guestA,`ExpoPushToken[integration_${guestA.replaceAll("-","")}]`,deviceB,guestB,`ExpoPushToken[integration_${guestB.replaceAll("-","")}]`],
      );
      await tx.query("COMMIT");
    } catch (error) {
      await tx.query("ROLLBACK");
      throw error;
    } finally { tx.release(); }

    const outcomes = await Promise.allSettled([
      decideJoinRequest(host,session,rA,"accepted"),
      decideJoinRequest(host,session,rB,"accepted"),
    ]);
    expect(outcomes.filter(o => o.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter(o => o.status === "rejected")).toHaveLength(1);
    const statuses = await pool.query<{id:string;status:string}>(
      "SELECT id,status FROM join_requests WHERE session_id=$1", [session],
    );
    expect(statuses.rows.filter(r => r.status === "accepted")).toHaveLength(1);

    const acceptedRow = statuses.rows.find(r => r.status === "accepted")!;
    const pendingRow = statuses.rows.find(r => r.status === "pending")!;
    const acceptedUser = acceptedRow.id === rA ? guestA : guestB;
    const declinedUser = pendingRow.id === rA ? guestA : guestB;
    const successAgain = await decideJoinRequest(host,session,acceptedRow.id,"accepted");
    expect(successAgain.alreadyProcessed).toBe(true);
    const declined = await decideJoinRequest(host,session,pendingRow.id,"declined");
    expect(declined.decision).toBe("declined");

    const acceptedInbox = await getInbox(acceptedUser);
    const declinedInbox = await getInbox(declinedUser);
    expect(acceptedInbox).toHaveLength(1);
    expect(acceptedInbox[0]?.kind).toBe("request_accepted");
    expect(declinedInbox[0]?.kind).toBe("request_declined");
    expect((await getInbox(host)).length).toBe(0);

    const delivery = await pool.query<{kind:string;recipient_user_id:string;status:string}>(
      `SELECT n.kind, n.recipient_user_id,d.status
       FROM push_deliveries d JOIN notifications n ON n.id=d.notification_id
       WHERE n.related_request_id IN ($1,$2)`,[rA,rB],
    );
    expect(delivery.rows).toHaveLength(2);
    expect(delivery.rows.every(r => r.status === "pending")).toBe(true);
    expect(delivery.rows.map(r => r.kind).sort()).toEqual(["request_accepted","request_declined"]);

    await markInboxRead(acceptedUser,acceptedInbox[0]!.id);
    expect((await getInbox(acceptedUser))[0]?.readAt).not.toBeNull();
    // M5 Discover: a full session remains visible to its host and approved guests,
    // but not to unapproved applicants. Blocking removes it from discovery.
    expect((await getDiscoverSessions(host)).some((s) => s.id === session)).toBe(true);
    expect((await getDiscoverSessions(acceptedUser)).some((s) => s.id === session)).toBe(true);
    expect((await getDiscoverSessions(declinedUser)).some((s) => s.id === session)).toBe(false);
    await pool.query("INSERT INTO user_blocks(blocker_user_id, blocked_user_id) VALUES($1,$2)", [acceptedUser,host]);
    expect((await getDiscoverSessions(acceptedUser)).some((s) => s.id === session)).toBe(false);
    await pool.end();
  }, 30_000);
});

afterAll(async () => {
  // Integration suite owns the pool only when DATABASE_URL is configured;
  // it is closed in the test after assertions.
});
