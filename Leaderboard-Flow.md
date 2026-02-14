# 🏆 LEADERBOARD & REWARDS FLOW

The Leaderboard is the heartbeat of STXWorx, ranking freelancers based on verified performance and automating rewards through the reputation system.

---

## **1. THE DATA INGESTION (On-Chain Trigger)**

```
1. MILESTONE COMPLETED
   ↓ Client releases payment: release-milestone-stx / sbtc
   ↓ On-Chain Event: Contract emits "milestone-released"
   ↓
2. BACKEND INDEXING
   ↓ Backend listener detects the payment event
   ↓ Updates Freelancer's "Total Earnings" in DB
   ↓ Updates "Jobs Completed" count
   ↓ records "Time to Complete" (Start Date → Release Date)
```

---

## **2. THE SCORING LOGIC (Performance Calculation)**

Your rank is calculated using a **Weighted Score**:

*   **Verified Volume (50%)**: Total STX/sBTC earned and released.
*   **Reliability (30%)**: Completion Rate (Total Projects vs. Disputed/Cancelled).
*   **Efficiency (10%)**: Average speed of milestone delivery.
*   **Quality (10%)**: Average ratings/reviews (if implemented).

---

## **3. THE LEADERBOARD CYCLE (Ranking)**

```
1. DAILY REFRESH
   ↓ Backend runs a "Ranking Batch Job" every 24 hours
   ↓ Scores are recalculated for all active freelancers
   ↓ Snapshot taken: "Top 100 Performers"
   ↓
2. LEADERBOARD UI
   ↓ Users view "Browse Gigs" → "Leaderboard"
   ↓ Ranking icons displayed: 🏆 (Rank 1), 🥈 (Rank 2), 🥉 (Rank 3)
   ↓ Filters: "This Month", "All Time", "By Specialty"
```

---

## **4. THE REWARD FLOW (Incentivization)**

### **A. Reputation Badges (On-Chain)**
```
IF (Freelancer Profile Score > Threshold for Gold)
   ↓ Notify Admin on Dashboard: "User X qualifies for Gold Badge"
   ↓ Admin triggers NFT Flow: admin-upgrade-grade
   ↓ User receives Gold Soulbound NFT
```

### **B. Platform Visibility**
```
IF (Freelancer is in Top 10)
   ↓ Profile boosted in Job Proposal Review queue
   ↓ "Top Performer" badge displayed on job applications
   ↓ Higher probability of being "Invited" to premium projects
```

### **C. Reward Distribution (Future)**
*   **Fee Discounts**: Top performers pay 5% fee instead of 10%.
*   **Revenue Share**: Top performers receive a small portion of platform fees in STX.
*   **Priority Support**: Direct access to admin mediation.

---

## **5. DISPUTE IMPACT (Penalty Flow)**

```
1. DISPUTE FILED
   ↓ Project status: "Disputed"
   ↓ Freelancer score receives a temporary "Freeze"
   ↓
2. DISPUTE RESOLVED
   ↓ IF (Lost Dispute): Significant score penalty + potential "Reported" status
   ↓ IF (Won Dispute): Score restored; no penalty
```

---

## **🛡️ Integrity Measures (Anti-Gaming)**

1. **Volume Cap**: Multiple small projects from the same "Client" address have diminishing returns on score.
2. **Wash Trading Check**: Abnormal funding cycles between linked wallets are flagged for Admin review.
3. **Admin Audit**: Admin can manually ban or shadow-ban "fake" profiles from the leaderboard.
