# Backend Architecture - STXWorx Decentralized Application

> **Architecture Pattern**: Clean Architecture + Event-Driven Design  
> **Decentralization Model**: Hybrid (Smart Contract + Off-Chain Indexer)  
> **Current Status**: Basic Express Server → Production-Grade Decentralized Backend  
> **Tech Stack**: Node.js, Express, TypeScript, Drizzle ORM, SQLite

---

## 🎯 Decentralization Philosophy

### **Core Principle**
STXWorx is a **decentralized application** where:
1. **Smart contracts are the source of truth** for all financial transactions
2. **Backend serves as an indexer and cache layer** for performance
3. **Users maintain full custody** of funds until milestone completion
4. **No central authority** can freeze or control user funds

### **Trust Model**
```
┌─────────────────────────────────────────────────────────┐
│                  TRUST HIERARCHY                        │
├─────────────────────────────────────────────────────────┤
│  1. Smart Contract (Stacks Blockchain)                  │
│     └─ Source of truth for escrow, payments, disputes   │
│                                                          │
│  2. Backend (Off-Chain Indexer)                         │
│     └─ Read-only cache for UI performance               │
│     └─ Proposal system (pre-contract state)             │
│                                                          │
│  3. Frontend (User Interface)                           │
│     └─ Displays data, signs transactions                │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Current Backend Structure (As-Is)

```
/backend/
├── index.ts              (76 lines - Express server entry)
├── db.ts                 (Database connection)
├── drizzle.config.ts     (ORM configuration)
├── storage.ts            (19KB - Data layer)
├── routes.ts             (API route definitions)
├── project-routes.ts     (Project CRUD endpoints)
├── milestone-routes.ts   (Milestone management)
├── vite.ts               (Dev server integration)
├── controllers/          (Business logic)
├── middleware/           (Auth, validation)
├── routes/               (Route handlers)
└── services/             (External integrations)
```

### **What's Working**
- ✅ Express server with TypeScript
- ✅ Project CRUD operations
- ✅ Milestone tracking
- ✅ Basic API endpoints
- ✅ Database persistence (SQLite)

### **What's Missing (Critical for Decentralization)**
- ❌ **Blockchain event indexer** (listen to smart contract events)
- ❌ **Proposal system** (pre-contract state management)
- ❌ **Wallet-based authentication** (no JWT, no sessions)
- ❌ **Smart contract state synchronization**
- ❌ **Dispute tracking** (on-chain → off-chain sync)
- ❌ **Real-time notifications** (WebSocket)
- ❌ **IPFS integration** (decentralized file storage)

---

## 🎯 Target Architecture (Production-Grade Decentralized)

### **System Overview**
```
┌──────────────────────────────────────────────────────────────┐
│                    USER (Wallet Holder)                      │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ├─────────────────┬──────────────────┐
                 ▼                 ▼                  ▼
         ┌───────────────┐  ┌────────────┐   ┌──────────────┐
         │   Frontend    │  │  Backend   │   │   Stacks     │
         │   (React)     │  │  (Express) │   │  Blockchain  │
         └───────┬───────┘  └─────┬──────┘   └──────┬───────┘
                 │                │                  │
                 │  1. Sign TX    │                  │
                 │───────────────────────────────────>│
                 │                │                  │
                 │                │  2. Index Event  │
                 │                │<─────────────────│
                 │                │                  │
                 │  3. Query Data │                  │
                 │<───────────────│                  │
                 │                │                  │
                 │  4. Display    │                  │
                 │<───────────────│                  │
                 │                │                  │
```

### **Data Flow Principles**
1. **Write Path**: Frontend → Smart Contract → Blockchain
2. **Read Path**: Frontend → Backend (cached) → Display
3. **Sync Path**: Blockchain Events → Backend Indexer → Database Update

---

## 📋 Architecture Layers

### **Layer 1: Smart Contract Interface**
```typescript
// Purpose: Read blockchain state, listen to events
// Location: /backend/services/blockchain/

interface BlockchainService {
  // Read contract state
  getProjectOnChain(projectId: number): Promise<OnChainProject>;
  getMilestoneOnChain(projectId: number, milestoneNum: number): Promise<OnChainMilestone>;
  
  // Event indexing
  startEventIndexer(): void;
  processContractEvent(event: ContractEvent): Promise<void>;
  
  // Verification
  verifyTransactionOnChain(txId: string): Promise<boolean>;
}
```

**Key Functions**:
- Poll Stacks API for contract events every 10 seconds
- Index `project-created`, `milestone-completed`, `milestone-released`, `dispute-filed` events
- Sync on-chain state to local database
- Verify transaction confirmations

---

### **Layer 2: Application Core (Domain Logic)**

#### **2.1 Proposal System** (Pre-Contract State)
```
Flow: Client posts job → Freelancers submit proposals → Client selects → Contract created

Database Schema:
┌─────────────────────────────────────────────────────────┐
│ proposals                                               │
├─────────────────────────────────────────────────────────┤
│ id                 INTEGER PRIMARY KEY                  │
│ project_id         INTEGER (FK → projects)              │
│ freelancer_address TEXT                                 │
│ cover_letter       TEXT                                 │
│ proposed_budget    REAL                                 │
│ proposed_duration  INTEGER (days)                       │
│ portfolio_links    TEXT (JSON array)                    │
│ status             TEXT (pending/accepted/rejected)     │
│ created_at         DATETIME                             │
│ updated_at         DATETIME                             │
└─────────────────────────────────────────────────────────┘
```

**Business Rules**:
- One proposal per freelancer per project
- Proposals can only be submitted to `status='open'` projects
- Accepting a proposal auto-rejects all others
- Accepted proposal triggers project status → `'pending'` (awaiting funding)

---

#### **2.2 Project Lifecycle Management**
```
Project States:
┌────────┐    ┌─────────┐    ┌────────┐    ┌───────────┐    ┌───────────┐
│  open  │ → │ pending │ → │ active │ → │ completed │ → │ reviewed  │
└────────┘    └─────────┘    └────────┘    └───────────┘    └───────────┘
     │             │              │              │                │
     │             │              │              ▼                │
     │             │              │         ┌──────────┐          │
     │             │              └────────>│ disputed │          │
     │             │                        └──────────┘          │
     │             │                             │                │
     │             │                             ▼                │
     │             │                        ┌──────────┐          │
     │             └───────────────────────>│ refunded │<─────────┘
     │                                      └──────────┘
     │
     └─────────────────────────────────────> (deleted/cancelled)

State Transitions:
- open → pending: Client accepts proposal
- pending → active: Client funds escrow (on-chain)
- active → completed: All milestones released
- active → disputed: Either party files dispute
- disputed → active: Admin resolves dispute
- pending/active → refunded: Client requests refund (conditions apply)
```

---

#### **2.3 Milestone Synchronization**
```
On-Chain State (Source of Truth):
┌──────────────────────────────────────────────────────┐
│ Smart Contract: escrow-multi-token.clar              │
├──────────────────────────────────────────────────────┤
│ - milestone.complete (bool)                          │
│ - milestone.released (bool)                          │
│ - milestone.amount (uint)                            │
│ - milestone.completed-at (block-height)              │
└──────────────────────────────────────────────────────┘
                    ↓
            Event Emitted: "milestone-completed"
                    ↓
Off-Chain State (Cache):
┌──────────────────────────────────────────────────────┐
│ Database: milestones table                           │
├──────────────────────────────────────────────────────┤
│ - status (locked/submitted/approved/disputed)        │
│ - submission_link (URL to deliverable)               │
│ - submission_date (DATETIME)                         │
│ - tx_hash (blockchain transaction ID)                │
└──────────────────────────────────────────────────────┘
```

**Sync Strategy**:
1. Backend polls Stacks API every 10 seconds
2. Detects new events (e.g., `milestone-completed`)
3. Updates local database with event data
4. Sends real-time notification to frontend (WebSocket)

---

### **Layer 3: API Endpoints**

#### **3.1 Proposal Endpoints** (NEW)
```typescript
// POST /api/projects/:projectId/proposals
// Submit a proposal (pre-contract)
interface SubmitProposalRequest {
  freelancerAddress: string;
  coverLetter: string;
  proposedBudget: number;
  proposedDuration: number;
  portfolioLinks?: string[];
}

// GET /api/projects/:projectId/proposals
// Get all proposals for a project (client view)
// Query: ?status=pending

// GET /api/freelancers/:address/proposals
// Get all proposals by a freelancer

// PUT /api/proposals/:proposalId/accept
// Client accepts proposal
// Side effects:
//   - Update proposal.status = 'accepted'
//   - Update project.freelancer_address
//   - Update project.status = 'pending'
//   - Reject all other proposals
//   - Send notification to freelancer

// PUT /api/proposals/:proposalId/reject
// Client rejects proposal

// DELETE /api/proposals/:proposalId
// Freelancer withdraws proposal
```

---

#### **3.2 Blockchain Sync Endpoints** (NEW)
```typescript
// GET /api/blockchain/project/:id
// Get on-chain project state
// Returns: Smart contract data + verification status

// GET /api/blockchain/events
// Get recent blockchain events
// Query: ?since=blockHeight&type=milestone-released

// POST /api/blockchain/verify-tx
// Verify a transaction was confirmed
interface VerifyTransactionRequest {
  txId: string;
  expectedEvent: string;
}

// GET /api/blockchain/sync-status
// Get indexer sync status
// Returns: { lastIndexedBlock: number, currentBlock: number, lag: number }
```

---

#### **3.3 Notification Endpoints** (NEW)
```typescript
// GET /api/notifications
// Get user notifications
// Query: ?unread=true&limit=20

// PUT /api/notifications/:id/read
// Mark notification as read

// WebSocket: ws://localhost:5001/notifications
// Real-time notification stream
interface NotificationEvent {
  type: 'proposal_received' | 'proposal_accepted' | 'milestone_submitted' | 'payment_released';
  projectId: number;
  message: string;
  link: string;
  timestamp: number;
}
```

---

### **Layer 4: Authentication (Wallet-Based)**

#### **4.1 Challenge-Response Flow**
```
1. Frontend: Request challenge
   POST /api/auth/challenge
   Body: { address: "SP3DX394..." }
   
2. Backend: Generate random nonce
   Response: { challenge: "sign-this-nonce-abc123", expiresAt: 1234567890 }
   
3. Frontend: Sign challenge with wallet
   const signature = await wallet.signMessage(challenge);
   
4. Frontend: Submit signature
   POST /api/auth/verify
   Body: { address: "SP3DX394...", signature: "0x...", challenge: "sign-this-nonce-abc123" }
   
5. Backend: Verify signature on-chain
   - Recover address from signature
   - Match with claimed address
   - Generate JWT token
   
6. Backend: Return JWT
   Response: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", user: {...} }
   
7. Frontend: Store JWT in memory (NOT localStorage)
   - Include in Authorization header for all requests
```

**Security Considerations**:
- Challenges expire after 5 minutes
- One-time use (prevent replay attacks)
- JWT expires after 24 hours
- No password storage (wallet = identity)

---

## 🔄 Critical Data Flows

### **Flow 1: Create Project & Accept Proposal**
```
Step 1: Client Posts Job (Off-Chain)
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /api/projects
       │ { title, description, budget, milestones }
       ▼
┌─────────────┐
│   Backend   │ → INSERT INTO projects (status='open')
└─────────────┘

Step 2: Freelancer Submits Proposal (Off-Chain)
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /api/projects/1/proposals
       │ { coverLetter, proposedBudget }
       ▼
┌─────────────┐
│   Backend   │ → INSERT INTO proposals (status='pending')
└─────────────┘ → Send notification to client

Step 3: Client Accepts Proposal (Off-Chain)
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ PUT /api/proposals/5/accept
       ▼
┌─────────────┐
│   Backend   │ → UPDATE proposals SET status='accepted'
└─────────────┘ → UPDATE projects SET freelancer_address='SP...', status='pending'
                → Reject other proposals
                → Send notification to freelancer

Step 4: Client Funds Escrow (On-Chain)
┌─────────────┐
│  Frontend   │ → Wallet signs transaction
└──────┬──────┘
       │ create-project-stx(freelancer, m1, m2, m3, m4)
       ▼
┌─────────────────┐
│ Smart Contract  │ → Lock funds in escrow
└────────┬────────┘ → Emit "project-created" event
         │
         ▼
┌─────────────┐
│  Indexer    │ → Detect event
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │ → UPDATE projects SET status='active', tx_id='0x...'
└─────────────┘ → Send notification to freelancer
```

---

### **Flow 2: Milestone Completion & Payment**
```
Step 1: Freelancer Submits Milestone (On-Chain)
┌─────────────┐
│  Frontend   │ → Wallet signs transaction
└──────┬──────┘
       │ complete-milestone(project-id, milestone-num)
       ▼
┌─────────────────┐
│ Smart Contract  │ → Mark milestone.complete = true
└────────┬────────┘ → Emit "milestone-completed" event
         │
         ▼
┌─────────────┐
│  Indexer    │ → Detect event
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │ → UPDATE milestones SET status='submitted'
└─────────────┘ → Send notification to client

Step 2: Client Approves Milestone (On-Chain)
┌─────────────┐
│  Frontend   │ → Wallet signs transaction
└──────┬──────┘
       │ release-milestone-stx(project-id, milestone-num)
       ▼
┌─────────────────┐
│ Smart Contract  │ → Transfer funds to freelancer
└────────┬────────┘ → Mark milestone.released = true
         │           → Emit "milestone-released" event
         ▼
┌─────────────┐
│  Indexer    │ → Detect event
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │ → UPDATE milestones SET status='approved', tx_hash='0x...'
└─────────────┘ → Send notification to freelancer
```

---

### **Flow 3: Dispute Resolution**
```
Step 1: Either Party Files Dispute (On-Chain)
┌─────────────┐
│  Frontend   │ → Wallet signs transaction
└──────┬──────┘
       │ file-dispute(project-id, milestone-num)
       ▼
┌─────────────────┐
│ Smart Contract  │ → Create dispute record
└────────┬────────┘ → Emit "dispute-filed" event
         │
         ▼
┌─────────────┐
│  Indexer    │ → Detect event
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │ → INSERT INTO disputes (status='open')
└─────────────┘ → Send notification to admin

Step 2: Admin Reviews Evidence (Off-Chain)
┌─────────────┐
│ Admin Panel │ → View dispute details
└──────┬──────┘ → Review evidence from both parties
       │
       ▼
┌─────────────┐
│   Backend   │ → GET /api/admin/disputes/:id
└─────────────┘ → Return dispute data + evidence

Step 3: Admin Resolves Dispute (On-Chain)
┌─────────────┐
│ Admin Panel │ → Wallet signs transaction
└──────┬──────┘
       │ admin-resolve-dispute-stx(project-id, milestone-num, release-to-freelancer)
       ▼
┌─────────────────┐
│ Smart Contract  │ → Transfer funds to winner
└────────┬────────┘ → Mark dispute.status = 'resolved'
         │           → Emit "dispute-resolved" event
         ▼
┌─────────────┐
│  Indexer    │ → Detect event
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │ → UPDATE disputes SET status='resolved', resolved_in_favor_of='SP...'
└─────────────┘ → Send notifications to both parties
```

---

## 🛡️ Security & Decentralization Best Practices

### **1. Principle of Least Trust**
```
❌ DON'T: Store user funds in backend database
✅ DO: Store only metadata; funds locked in smart contract

❌ DON'T: Allow backend to modify on-chain state
✅ DO: Backend reads events; users sign transactions

❌ DON'T: Centralized admin with god mode
✅ DO: Admin actions require on-chain transactions (transparent)
```

### **2. Data Integrity**
```typescript
// Always verify critical data against blockchain
async function verifyProjectFunding(projectId: number): Promise<boolean> {
  const dbProject = await db.getProject(projectId);
  const onChainProject = await blockchain.getProjectOnChain(projectId);
  
  // Compare on-chain vs off-chain
  if (dbProject.status === 'active' && !onChainProject.funded) {
    // Desync detected! Trigger re-sync
    await resyncProject(projectId);
    return false;
  }
  
  return true;
}
```

### **3. Event Sourcing**
```
All state changes originate from blockchain events:
┌──────────────────────────────────────────────────┐
│ Event Log (Immutable Audit Trail)               │
├──────────────────────────────────────────────────┤
│ 1. project-created    (block 12345)              │
│ 2. milestone-completed (block 12400)             │
│ 3. milestone-released  (block 12450)             │
│ 4. dispute-filed       (block 12500)             │
│ 5. dispute-resolved    (block 12600)             │
└──────────────────────────────────────────────────┘
         ↓
Backend can rebuild entire state from events
```

---

## 📊 Performance Optimization

### **1. Caching Strategy**
```typescript
// Cache blockchain data with TTL
const cache = new Map<string, { data: any, expiresAt: number }>();

async function getProjectWithCache(projectId: number) {
  const cacheKey = `project:${projectId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  
  const data = await blockchain.getProjectOnChain(projectId);
  cache.set(cacheKey, { data, expiresAt: Date.now() + 60000 }); // 1 min TTL
  
  return data;
}
```

### **2. Batch Event Processing**
```typescript
// Process events in batches to reduce database writes
async function processEventBatch(events: ContractEvent[]) {
  const updates = events.map(event => ({
    type: event.type,
    projectId: event.projectId,
    data: event.data
  }));
  
  await db.transaction(async (tx) => {
    for (const update of updates) {
      await tx.updateFromEvent(update);
    }
  });
}
```

---

## 🚧 Implementation Roadmap

### **Phase 1: Blockchain Event Indexer** (Week 1)
**Goal**: Sync on-chain state to local database

**Tasks**:
1. Create `BlockchainService` class
2. Implement event polling (every 10 seconds)
3. Parse contract events (project-created, milestone-completed, etc.)
4. Update database from events
5. Add sync status endpoint

**Verification**:
- Create project on-chain → Verify backend detects event within 10s
- Complete milestone on-chain → Verify database updates
- Check `/api/blockchain/sync-status` shows correct lag

---

### **Phase 2: Proposal System** (Week 2)
**Goal**: Enable freelancers to apply to jobs

**Tasks**:
1. Create `proposals` table schema
2. Implement proposal submission endpoint
3. Implement proposal review endpoints (accept/reject)
4. Add proposal listing endpoints
5. Integrate with project lifecycle

**Verification**:
- Freelancer submits proposal → Appears in client's proposal list
- Client accepts proposal → Other proposals auto-rejected
- Project status updates to 'pending'

---

### **Phase 3: Wallet-Based Authentication** (Week 3)
**Goal**: Secure API with wallet signatures

**Tasks**:
1. Implement challenge-response flow
2. Add signature verification
3. Generate JWT tokens
4. Create auth middleware
5. Protect sensitive endpoints

**Verification**:
- User signs challenge → Receives JWT
- JWT required for protected endpoints
- Invalid JWT returns 401

---

### **Phase 4: Real-Time Notifications** (Week 4)
**Goal**: Push updates to users instantly

**Tasks**:
1. Set up WebSocket server
2. Create notification service
3. Emit events on state changes
4. Add notification persistence
5. Implement notification preferences

**Verification**:
- Milestone approved → Freelancer receives instant notification
- Proposal accepted → Notification appears in UI
- WebSocket connection survives page refresh

---

## 📝 Key Architectural Decisions

### **Decision 1: Hybrid Architecture**
**Rationale**: Pure on-chain storage is expensive; hybrid approach balances cost and decentralization.

**Trade-offs**:
- ✅ Fast reads (from database)
- ✅ Low transaction costs
- ⚠️ Requires trust in indexer (but verifiable against blockchain)

---

### **Decision 2: Proposal System Off-Chain**
**Rationale**: Proposals are pre-contract state; no need for on-chain storage.

**Trade-offs**:
- ✅ Free to submit proposals
- ✅ Fast iteration (no blockchain confirmation wait)
- ⚠️ Backend can censor proposals (mitigated by open-source + self-hosting)

---

### **Decision 3: Event Sourcing**
**Rationale**: Blockchain events provide immutable audit trail.

**Trade-offs**:
- ✅ Can rebuild state from scratch
- ✅ Easy to debug (replay events)
- ⚠️ Requires robust event processing (handle missed events)

---

**Last Updated**: 2026-02-14  
**Status**: Planning Phase  
**Priority**: Critical - Blockchain indexer is foundation for decentralization
