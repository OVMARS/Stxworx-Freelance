# Admin Edge Cases - Freelance Escrow Platform

Analysis based on `escrow-multi-token.clar` (v3.0, Clarity v2, epoch 2.5).

---

## 1. Dispute Resolution (No On-Chain Mechanism Exists)

The contract has **zero dispute resolution**. The only parties who can act are the client and freelancer themselves.

| Scenario | What Happens Today | Admin Need |
|---|---|---|
| Freelancer marks milestone complete, client disagrees on quality | Client simply never calls `release-milestone`. Funds stay locked until the 144-block emergency refund window opens. Freelancer gets nothing. | Admin needs to view disputed milestones (complete=true, released=false, with age) and mediate off-chain. Consider an admin-arbitrated release function. |
| Freelancer delivers partial work | No partial release possible. Milestone is all-or-nothing. | Admin dashboard should flag milestones stuck in `complete=true, released=false` state beyond a threshold (e.g., 72 blocks). |
| Client claims freelancer did no work but freelancer marked complete | Client waits for emergency refund timeout (144 blocks). | Admin needs ability to review and potentially override a fraudulent `complete` flag, or provide evidence review workflow. |

**Contract gap**: There is no `admin-resolve-dispute` function. The admin currently has no on-chain power to intervene in a dispute.

---

## 2. Abandoned / Stalled Projects

### 2a. Client Disappears After Funding

- Freelancer completes all milestones (`complete: true`).
- Client never calls `release-milestone-*`. No one else can release.
- Funds are permanently locked. The freelancer has **no reclaim path**.
- Emergency refund only works for the **client**, not the freelancer.

**Admin need**: A function or dashboard view to identify projects where all milestones are complete but unreleased, and a mechanism (e.g., admin-triggered release after a timeout) to pay the freelancer.

### 2b. Freelancer Disappears After Funding

- Freelancer never calls `complete-milestone`. Milestones stay `complete: false`.
- Client must wait 144 blocks, then call `emergency-refund-*` to get remaining funds back.
- This path works, but admin should still monitor for it.

**Admin need**: Dashboard view of projects with zero activity past a time threshold. Optionally, an admin-initiated refund for projects where the freelancer is confirmed inactive.

### 2c. Both Parties Disappear

- Funds are locked in the contract forever. No one calls any function.
- The admin (`contract-owner`) currently has **no function to recover these funds**.

**Admin need**: An admin sweep/recovery function for provably abandoned projects (e.g., no activity for 1000+ blocks).

---

## 3. sBTC Balance Accounting Issues

### 3a. Orphaned sBTC Deposits

The sBTC flow requires the client to transfer sBTC to the contract **before** calling `create-project-sbtc`. If:

- The client transfers sBTC but never calls `create-project-sbtc` (tx fails, user error, frontend crash).
- Those sBTC tokens sit in the contract with no project referencing them.
- There is **no admin withdrawal function** for stuck sBTC.

**Admin need**: Compare contract sBTC balance against sum of all active sBTC project amounts. Any surplus is orphaned and needs a recovery mechanism.

### 3b. sBTC Balance Check is Global, Not Per-Project

`create-project-sbtc` checks `balance-before >= total`. But `balance-before` is the **entire** contract sBTC balance, not just what this client deposited. This means:

- If orphaned sBTC exists from 3a, a new client could create a project funded by someone else's orphaned sBTC (depositing less or nothing).
- Multiple near-simultaneous sBTC project creations could have race conditions where the balance check passes for both but the contract only has enough for one.

**Admin need**: Monitor for projects where the sBTC deposit transaction doesn't match the project total. Flag discrepancies.

---

## 4. Fee-Related Edge Cases

### 4a. Fee Is Hardcoded (500 basis points / 5%)

`FEE-PERCENT` is a `define-constant`. It cannot be changed without deploying a new contract. If the platform needs to:

- Run a promotional period (0% fee)
- Adjust fees for high-value projects
- Comply with regulatory requirements

...none of this is possible on the current contract.

**Admin need**: Dashboard should display total fees collected. If a new fee rate is needed, admin needs a migration plan to a new contract version.

### 4b. Small Milestone Amounts Lose Precision

Fee calculation: `(/ (* amount FEE-PERCENT) u10000)`. For a milestone of `u19` (19 microSTX):
- `19 * 500 = 9500`
- `9500 / 10000 = 0` (integer division, fee rounds to zero)

The platform collects **no fee** on very small milestones.

**Admin need**: Dashboard should flag projects with milestone amounts below `u20` where no fee is collected.

### 4c. Treasury Address Receives Fees In Real-Time

Each `release-milestone-*` sends fees directly to the treasury address. If the treasury address is changed mid-project via `set-treasury`, different milestones on the same project may send fees to different addresses.

**Admin need**: Log all treasury address changes with timestamps. Track fee disbursement per treasury address.

---

## 5. Refund Logic Edge Cases

### 5a. Full Refund Blocked by Premature `complete-milestone`

`request-full-refund-*` requires `(not (has-activity ...))`. Activity = any milestone with `complete: true` OR `released: true`. If a freelancer marks even one milestone as complete (whether legitimately or not), the client **cannot** get a full refund. They must wait for the 144-block emergency refund timeout.

**Admin need**: Identify projects where a freelancer marked a milestone complete shortly after creation (possible griefing to block refund) and the client is requesting a refund.

### 5b. Emergency Refund Math Verification

Emergency refund returns `total - released_amounts`. The released amounts include fees already sent to the treasury. The math works correctly:

- If 2 of 4 milestones are released (each 250 STX), the contract sent `237 + 13` per milestone = 500 total out.
- Emergency refund: `1000 - 500 = 500`. Contract has exactly 500. Correct.

**Admin need**: No action needed, but the dashboard should clearly show: total funded, total released, total fees collected, and refundable remainder per project.

### 5c. Refund Sets `refunded: true` Globally

Once a project is refunded (full or emergency), `refunded: true` is set. This **permanently blocks** all future milestone releases on that project, even if some milestones were already marked complete but not yet released.

**Admin need**: Dashboard must warn before emergency refund if there are completed-but-unreleased milestones, as those freelancer earnings will be forfeited.

---

## 6. No Contract Pause / Emergency Stop

There is no `paused` flag or circuit breaker. If a vulnerability is discovered:

- Projects can still be created, milestones completed, funds released.
- The admin cannot freeze the contract.
- The only action is to warn users off-chain and hope they stop interacting.

**Admin need**: A pause mechanism that halts all public functions except read-only queries. Critical for incident response.

---

## 7. Project Data Gaps (No On-Chain Metadata)

The contract stores: client, freelancer, amounts, milestone status, token type, created-at. It does **not** store:

- Project title or description
- Deliverable requirements per milestone
- Agreed terms or deadlines
- Communication history

**Admin need**: The dashboard must correlate on-chain project IDs with off-chain metadata (stored in a database). Admin needs a way to attach notes, evidence, and dispute records to each project ID.

---

## 8. No Milestone Ordering Enforcement

Nothing in the contract requires milestones to be completed in sequence. A freelancer can call `complete-milestone` for milestone 4 before milestone 1. A client can release milestone 3 before milestone 1.

**Admin need**: Dashboard should show milestone completion/release order with timestamps. Flag out-of-sequence activity as potentially unusual.

---

## 9. Wallet Compromise Scenarios

### 9a. Client Wallet Compromised

An attacker with the client's keys can:
- Release all completed milestones (sends funds to the legitimate freelancer -- not directly harmful to project funds, but uncontrolled)
- Request full/emergency refund (sends funds to the client address, which the attacker now controls)

### 9b. Freelancer Wallet Compromised

An attacker with the freelancer's keys can:
- Mark all milestones as complete (griefing: blocks full refund path for client)
- Cannot release funds (only client can release)
- If client later releases, funds go to the freelancer address the attacker controls

### 9c. Contract Owner Wallet Compromised

An attacker can:
- Change the treasury to their address via `set-treasury` (steal all future fees)
- Transfer ownership to themselves via `transfer-ownership` (permanent takeover)
- Both are **irreversible single-step operations** with no time-lock or multi-sig.

**Admin need**: Dashboard must prominently monitor for any ownership/treasury change events. Consider multi-sig or time-locked admin operations in a contract upgrade.

---

## 10. Multi-Project Balance Pool Risk

The contract holds funds for **all** projects in a single balance. There is no per-project balance segregation. If there were ever a logic bug or exploit allowing over-withdrawal from one project, it could drain funds belonging to other projects.

**Admin need**: Dashboard should continuously reconcile:
- `contract STX balance >= sum of (total - released) for all non-refunded STX projects`
- Same for sBTC.
- Any discrepancy is a critical alert.

---

## 11. Zero-Amount Milestone Gaps

If a project is created with `m1=100, m2=0, m3=200, m4=0`:
- Only milestones 1 and 3 exist in the `milestones` map.
- `num-milestones = 2`, but the active milestones are numbered 1 and 3 (not 1 and 2).
- Calling `get-milestone(project-id, u2)` returns `none`.

**Admin need**: Dashboard must handle sparse milestone numbering. Display milestones by their actual map keys, not by assuming sequential 1 through N.

---

## Summary: Admin Capabilities

### Currently Exists in Contract
- [x] Change treasury address (`set-treasury`)
- [x] Transfer contract ownership (`transfer-ownership`)
- [x] Read project/milestone data (`get-project`, `get-milestone`)
- [x] Check STX balance (`get-contract-balance-stx`)
- [x] Check sBTC balance (`get-balance-sbtc`)
- [x] Check refundable amount (`get-refundable`)

### Missing from Contract (Needed for Production)
- [ ] **Dispute resolution** -- admin-arbitrated release or refund
- [ ] **Admin-triggered release** -- for when client disappears but milestones are complete
- [ ] **Admin-triggered refund** -- for when both parties abandon a project
- [ ] **Contract pause / emergency stop** -- circuit breaker for incidents
- [ ] **Recovery of orphaned sBTC** -- withdraw sBTC not tied to any project
- [ ] **Fee rate adjustment** -- requires `define-data-var` instead of `define-constant`

### Dashboard Must Provide (Off-Chain)
- [ ] Project lifecycle view (created, active, stalled, disputed, completed, refunded)
- [ ] Dispute detection (complete but unreleased milestones past age threshold)
- [ ] Abandoned project detection (no activity past block threshold)
- [ ] Balance reconciliation (contract balance vs. sum of project obligations)
- [ ] Fee tracking (total collected, per project, per treasury address)
- [ ] Treasury/ownership change audit log
- [ ] Off-chain metadata attachment (project details, dispute evidence, admin notes)
- [ ] sBTC deposit verification (cross-reference transfer tx with project creation)
- [ ] Alerts for anomalies (out-of-sequence milestones, rapid refund requests, ownership changes, balance discrepancies)
