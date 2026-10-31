import test from "node:test";
import assert from "node:assert/strict";
import { subjectClaimsStore } from "./subject-claims";

test("subjectClaimsStore: initial demo claims loaded", () => {
  const claims = subjectClaimsStore.getClaims();
  assert.ok(claims.length > 0);
});

test("subjectClaimsStore: prevent duplicate claim if already assigned to another staff", async () => {
  // Demo claim has BT205 in B1 for midsem assigned to Prof. Priya Verma (staff@smart.edu)
  const res = await subjectClaimsStore.requestClaim({
    staffId: "other-staff-999",
    staffEmail: "other@smart.edu",
    staffName: "Prof. Other",
    examType: "midsem",
    section: "B1",
    subject: "BT205",
  });

  assert.equal(res.success, false);
  assert.match(res.error || "", /already assigned/i);
});

test("subjectClaimsStore: staff can request unassigned subject and admin can approve", async () => {
  // Request BT203 in B2 for midsem
  const reqRes = await subjectClaimsStore.requestClaim({
    staffId: "faculty-101",
    staffEmail: "faculty101@smart.edu",
    staffName: "Prof. Faculty",
    examType: "midsem",
    section: "B2",
    subject: "BT203",
  });

  assert.equal(reqRes.success, true);
  assert.ok(reqRes.claim);
  assert.equal(reqRes.claim?.status, "pending");

  // Admin approves claim
  const ok = await subjectClaimsStore.approveClaim(reqRes.claim!.id, "admin@smart.edu");
  assert.equal(ok, true);

  // Now user is authorized
  const isAuth = subjectClaimsStore.isSubjectApprovedForUser(
    "faculty101@smart.edu",
    "midsem",
    "B2",
    "BT203"
  );
  assert.equal(isAuth, true);
});

test("subjectClaimsStore: approve all pending claims", async () => {
  // Add a pending claim
  await subjectClaimsStore.requestClaim({
    staffId: "faculty-102",
    staffEmail: "faculty102@smart.edu",
    staffName: "Prof. Second",
    examType: "put",
    section: "B3",
    subject: "BT204",
  });

  const count = await subjectClaimsStore.approveAllPendingClaims("admin@smart.edu");
  assert.ok(count >= 1);

  const pendingAfter = subjectClaimsStore.getPendingClaims();
  assert.equal(pendingAfter.length, 0);
});
