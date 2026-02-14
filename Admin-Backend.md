# Admin Backend Architecture - STXWorx Decentralized Platform

> **Role**: Platform Governance & Dispute Mediation  
> **Current Status**: Basic Auth System → Production-Grade Admin Backend  
> **Tech Stack**: Node.js, TypeScript, Express, PostgreSQL, @stacks/blockchain-api-client  
> **Security Model**: Wallet-based admin authentication + Multi-sig recommended

---

## 🎯 Admin Backend Philosophy

### **Core Principle**
The admin backend serves as a **transparent governance layer** that:

1. **Monitors blockchain events** (dispute filings, force release triggers)
2. **Aggregates evidence** (chat logs, deliverables, user reports)
3. **Facilitates admin decisions** (UI for dispute resolution)
4. **Audits all admin actions** (immutable log of on-chain transactions)
5. **Cannot bypass smart contract rules** (all admin actions require on-chain TX)

### **Trust Model**
```
┌─────────────────────────────────────────────────────────┐
│           ADMIN BACKEND ARCHITECTURE                    │
├─────────────────────────────────────────────────────────┤
│  1. Smart Contract (Source of Truth)                    │
│     └─ Admin functions with strict preconditions        │
│     └─ All fund movements require on-chain TX           │
│                                                          │
│  2. Blockchain Indexer (Read-Only)                      │
│     └─ Listens to admin events                          │
│     └─ Stores dispute filings, resolutions              │
│                                                          │
│  3. Admin API (Evidence Aggregation)                    │
│     └─ Provides dispute context to admin UI             │
│     └─ Cannot execute admin actions directly            │
│                                                          │
│  4. Audit Log (Transparency)                            │
│     └─ Records all admin wallet signatures              │
│     └─ Links to blockchain TX hashes                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Current Backend Structure

```
/backend/
├── index.ts                    ✅ Express server entry point
├── routes/
│   ├── auth.routes.ts          ✅ Admin authentication
│   ├── project.routes.ts       ✅ Project CRUD
│   └── (missing admin routes)  ❌
├── middleware/
│   └── auth.middleware.ts      ✅ requireAdmin middleware
├── controllers/
│   └── auth.controller.ts      ✅ Login/register
├── services/
│   └── auth.service.ts         ✅ JWT + password hashing
├── storage.ts                  ✅ In-memory storage (dev)
└── seed.ts                     ✅ Default admin user
```

### **What's Working**
- ✅ **Admin Authentication**: Username/password login (dev mode)
- ✅ **Admin Middleware**: `requireAdmin` protects routes
- ✅ **Default Admin User**: `admin / SuperSecretAdminPassword123!`
- ✅ **JWT Tokens**: Secure session management

### **What's Missing (Critical for Production)**
- ❌ **Wallet-Based Admin Auth** (replace username/password)
- ❌ **Dispute API Endpoints** (fetch disputes, evidence)
- ❌ **Admin Action Audit Log** (track all admin TXs)
- ❌ **Blockchain Event Listener** (detect dispute filings)
- ❌ **Evidence Aggregation Service** (chat logs, deliverables)
- ❌ **Platform Analytics API** (volume, fees, dispute rate)
- ❌ **Admin Configuration API** (fee rate, pause status)
- ❌ **Multi-Admin Management** (add/remove admin wallets)
- ❌ **Rate Limiting for Admin Actions** (prevent abuse)
- ❌ **Admin Notification System** (alert on new disputes)

---

## 📊 Database Schema Extensions

### **New Tables for Admin Features**

```sql
-- ============ DISPUTES ============

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  milestone_num INTEGER NOT NULL,
  filed_by VARCHAR(50) NOT NULL, -- Stacks address
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open' | 'resolved'
  resolved_in_favor_of VARCHAR(50), -- Stacks address
  filed_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  blockchain_tx_hash VARCHAR(100), -- TX hash of resolution
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, milestone_num)
);

CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_project ON disputes(project_id);

-- ============ DISPUTE EVIDENCE ============

CREATE TABLE dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  submitted_by VARCHAR(50) NOT NULL, -- 'client' | 'freelancer'
  evidence_type VARCHAR(20) NOT NULL, -- 'description' | 'file' | 'chat_log'
  content TEXT, -- Text description or file URL
  file_url TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evidence_dispute ON dispute_evidence(dispute_id);

-- ============ ADMIN AUDIT LOG ============

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_address VARCHAR(50) NOT NULL, -- Admin wallet address
  action VARCHAR(50) NOT NULL, -- 'resolve_dispute' | 'force_release' | 'set_fee_rate' | 'pause_contract'
  target_type VARCHAR(20), -- 'project' | 'milestone' | 'config'
  target_id VARCHAR(100), -- Project ID, milestone ID, or config key
  details JSONB, -- Additional action details
  blockchain_tx_hash VARCHAR(100) NOT NULL, -- On-chain TX hash
  tx_status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'confirmed' | 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_address);
CREATE INDEX idx_audit_action ON admin_audit_log(action);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);

-- ============ ADMIN WALLETS ============

CREATE TABLE admin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(50) UNIQUE NOT NULL,
  added_by VARCHAR(50), -- Admin who added this wallet
  added_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{"can_resolve_disputes": true, "can_configure": true}'::jsonb
);

CREATE INDEX idx_admin_wallets_active ON admin_wallets(is_active);

-- ============ PLATFORM CONFIGURATION ============

CREATE TABLE platform_config (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by VARCHAR(50), -- Admin wallet address
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed default config
INSERT INTO platform_config (key, value) VALUES
  ('fee_rate', '1000'), -- 10% in basis points
  ('is_paused', 'false'),
  ('treasury_address', 'SP...'),
  ('sbtc_contract_address', 'SP...');

-- ============ PLATFORM ANALYTICS (Materialized View) ============

CREATE MATERIALIZED VIEW platform_analytics AS
SELECT
  COUNT(DISTINCT p.id) AS total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) AS active_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) AS completed_projects,
  SUM(p.total_budget) AS total_volume,
  SUM(p.total_budget * 0.1) AS total_fees, -- Assuming 10% fee
  COUNT(DISTINCT d.id) AS total_disputes,
  COUNT(DISTINCT CASE WHEN d.status = 'open' THEN d.id END) AS open_disputes,
  (COUNT(DISTINCT d.id)::FLOAT / NULLIF(COUNT(DISTINCT p.id), 0) * 100) AS dispute_rate
FROM projects p
LEFT JOIN disputes d ON d.project_id = p.id;

CREATE UNIQUE INDEX ON platform_analytics ((1)); -- Required for concurrent refresh
```

---

## 🔌 API Endpoints

### **Admin Dispute Management**

```typescript
// ============ GET /api/admin/disputes ============
// Fetch all disputes with filters

router.get('/api/admin/disputes', requireAdmin, async (req, res) => {
  const { status, projectId } = req.query;
  
  const disputes = await db.query(`
    SELECT 
      d.*,
      p.title AS project_title,
      p.client_address,
      p.freelancer_address,
      p.total_budget,
      p.token_type,
      m.amount AS milestone_amount,
      m.title AS milestone_title
    FROM disputes d
    JOIN projects p ON d.project_id = p.id
    JOIN milestones m ON m.project_id = d.project_id AND m.milestone_num = d.milestone_num
    WHERE 
      ($1::TEXT IS NULL OR d.status = $1)
      AND ($2::INTEGER IS NULL OR d.project_id = $2)
    ORDER BY d.filed_at DESC
  `, [status || null, projectId || null]);
  
  res.json(disputes.rows);
});

// ============ GET /api/admin/disputes/:id ============
// Fetch single dispute with all evidence

router.get('/api/admin/disputes/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  const dispute = await db.query(`
    SELECT 
      d.*,
      p.title AS project_title,
      p.description AS project_description,
      p.client_address,
      p.freelancer_address,
      p.total_budget,
      p.token_type,
      m.amount AS milestone_amount,
      m.title AS milestone_title,
      m.submission_link AS milestone_deliverable
    FROM disputes d
    JOIN projects p ON d.project_id = p.id
    JOIN milestones m ON m.project_id = d.project_id AND m.milestone_num = d.milestone_num
    WHERE d.id = $1
  `, [id]);
  
  if (dispute.rows.length === 0) {
    return res.status(404).json({ message: 'Dispute not found' });
  }
  
  // Fetch evidence
  const evidence = await db.query(`
    SELECT * FROM dispute_evidence
    WHERE dispute_id = $1
    ORDER BY submitted_at ASC
  `, [id]);
  
  // Fetch chat history
  const chatHistory = await db.query(`
    SELECT * FROM chat_messages
    WHERE project_id = $1
    ORDER BY created_at ASC
  `, [dispute.rows[0].project_id]);
  
  res.json({
    ...dispute.rows[0],
    evidence: evidence.rows,
    chatHistory: chatHistory.rows
  });
});

// ============ POST /api/admin/disputes/:id/evidence ============
// Add evidence to dispute (submitted by client or freelancer)

router.post('/api/admin/disputes/:id/evidence', async (req, res) => {
  const { id } = req.params;
  const { submittedBy, evidenceType, content, fileUrl } = req.body;
  
  await db.query(`
    INSERT INTO dispute_evidence (dispute_id, submitted_by, evidence_type, content, file_url)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, submittedBy, evidenceType, content, fileUrl]);
  
  res.json({ success: true });
});
```

---

### **Admin Audit Log**

```typescript
// ============ POST /api/admin/audit-log ============
// Record admin action (called after wallet signs TX)

router.post('/api/admin/audit-log', requireAdmin, async (req, res) => {
  const { action, targetType, targetId, details, txHash } = req.body;
  const adminAddress = req.user.walletAddress; // From JWT
  
  await db.query(`
    INSERT INTO admin_audit_log (admin_address, action, target_type, target_id, details, blockchain_tx_hash)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [adminAddress, action, targetType, targetId, details, txHash]);
  
  res.json({ success: true });
});

// ============ GET /api/admin/audit-log ============
// Fetch audit log with filters

router.get('/api/admin/audit-log', requireAdmin, async (req, res) => {
  const { adminAddress, action, startDate, endDate } = req.query;
  
  const logs = await db.query(`
    SELECT * FROM admin_audit_log
    WHERE 
      ($1::TEXT IS NULL OR admin_address = $1)
      AND ($2::TEXT IS NULL OR action = $2)
      AND ($3::TIMESTAMP IS NULL OR created_at >= $3)
      AND ($4::TIMESTAMP IS NULL OR created_at <= $4)
    ORDER BY created_at DESC
    LIMIT 100
  `, [adminAddress || null, action || null, startDate || null, endDate || null]);
  
  res.json(logs.rows);
});

// ============ GET /api/admin/audit-log/:txHash/verify ============
// Verify admin action on blockchain

router.get('/api/admin/audit-log/:txHash/verify', requireAdmin, async (req, res) => {
  const { txHash } = req.params;
  
  // Fetch TX from Stacks blockchain
  const txData = await stacksApi.getTransactionById(txHash);
  
  if (!txData) {
    return res.status(404).json({ verified: false, message: 'TX not found' });
  }
  
  // Verify TX is confirmed
  const verified = txData.tx_status === 'success';
  
  // Update audit log status
  await db.query(`
    UPDATE admin_audit_log
    SET tx_status = $1
    WHERE blockchain_tx_hash = $2
  `, [verified ? 'confirmed' : 'failed', txHash]);
  
  res.json({ verified, txData });
});
```

---

### **Platform Configuration**

```typescript
// ============ GET /api/admin/config ============
// Fetch platform configuration

router.get('/api/admin/config', requireAdmin, async (req, res) => {
  const config = await db.query(`SELECT * FROM platform_config`);
  
  const configObj = config.rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  
  res.json(configObj);
});

// ============ PUT /api/admin/config/:key ============
// Update platform configuration (requires on-chain TX)

router.put('/api/admin/config/:key', requireAdmin, async (req, res) => {
  const { key } = req.params;
  const { value, txHash } = req.body;
  const adminAddress = req.user.walletAddress;
  
  // Validate key
  const allowedKeys = ['fee_rate', 'is_paused', 'treasury_address', 'sbtc_contract_address'];
  if (!allowedKeys.includes(key)) {
    return res.status(400).json({ message: 'Invalid config key' });
  }
  
  // Update config
  await db.query(`
    UPDATE platform_config
    SET value = $1, updated_by = $2, updated_at = NOW()
    WHERE key = $3
  `, [value, adminAddress, key]);
  
  // Log action
  await db.query(`
    INSERT INTO admin_audit_log (admin_address, action, target_type, target_id, blockchain_tx_hash)
    VALUES ($1, $2, $3, $4, $5)
  `, [adminAddress, `set_${key}`, 'config', key, txHash]);
  
  res.json({ success: true });
});
```

---

### **Platform Analytics**

```typescript
// ============ GET /api/admin/analytics ============
// Fetch platform analytics

router.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  // Refresh materialized view
  await db.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY platform_analytics`);
  
  const analytics = await db.query(`SELECT * FROM platform_analytics`);
  
  // Fetch volume by day (last 30 days)
  const volumeByDay = await db.query(`
    SELECT 
      DATE(created_at) AS date,
      SUM(total_budget) AS volume,
      COUNT(*) AS project_count
    FROM projects
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  
  // Fetch projects by category
  const projectsByCategory = await db.query(`
    SELECT 
      category,
      COUNT(*) AS count
    FROM projects
    GROUP BY category
    ORDER BY count DESC
  `);
  
  // Fetch token distribution
  const tokenDistribution = await db.query(`
    SELECT 
      token_type,
      COUNT(*) AS count,
      SUM(total_budget) AS volume
    FROM projects
    GROUP BY token_type
  `);
  
  res.json({
    ...analytics.rows[0],
    volumeByDay: volumeByDay.rows,
    projectsByCategory: projectsByCategory.rows,
    tokenDistribution: tokenDistribution.rows
  });
});
```

---

## 🔔 Blockchain Event Listener

### **Dispute Filing Detection**

```typescript
// services/blockchain-listener.service.ts

import { StacksApiClient } from '@stacks/blockchain-api-client';

const stacksApi = new StacksApiClient();
const CONTRACT_ADDRESS = 'SP...';
const CONTRACT_NAME = 'escrow-multi-token';

export class BlockchainListenerService {
  private lastProcessedBlock: number = 0;

  async start() {
    console.log('🔊 Starting blockchain event listener...');
    
    // Poll every 10 seconds
    setInterval(() => this.pollEvents(), 10000);
  }

  async pollEvents() {
    try {
      const currentBlock = await stacksApi.getBlockHeight();
      
      if (currentBlock <= this.lastProcessedBlock) {
        return; // No new blocks
      }
      
      // Fetch contract events since last processed block
      const events = await stacksApi.getContractEvents({
        contractId: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
        offset: 0,
        limit: 50
      });
      
      for (const event of events) {
        if (event.block_height <= this.lastProcessedBlock) {
          continue; // Already processed
        }
        
        await this.handleEvent(event);
      }
      
      this.lastProcessedBlock = currentBlock;
    } catch (error) {
      console.error('Error polling blockchain events:', error);
    }
  }

  async handleEvent(event: any) {
    const eventType = event.event_type;
    const eventData = event.contract_log?.value;
    
    switch (eventType) {
      case 'dispute-filed':
        await this.handleDisputeFiled(eventData);
        break;
      case 'dispute-resolved':
        await this.handleDisputeResolved(eventData);
        break;
      case 'force-released':
        await this.handleForceReleased(eventData);
        break;
      case 'force-refund':
        await this.handleForceRefund(eventData);
        break;
      case 'contract-paused-updated':
        await this.handleContractPaused(eventData);
        break;
      case 'fee-rate-updated':
        await this.handleFeeRateUpdated(eventData);
        break;
    }
  }

  async handleDisputeFiled(data: any) {
    const { projectId, milestoneNum, filedBy } = data;
    
    // Insert dispute into database
    await db.query(`
      INSERT INTO disputes (project_id, milestone_num, filed_by, status, filed_at)
      VALUES ($1, $2, $3, 'open', NOW())
      ON CONFLICT (project_id, milestone_num) DO NOTHING
    `, [projectId, milestoneNum, filedBy]);
    
    // Send notification to admin
    await this.notifyAdmin('new_dispute', { projectId, milestoneNum });
    
    console.log(`🚨 Dispute filed: Project ${projectId}, Milestone ${milestoneNum}`);
  }

  async handleDisputeResolved(data: any) {
    const { projectId, milestoneNum, resolvedInFavorOf, txHash } = data;
    
    // Update dispute status
    await db.query(`
      UPDATE disputes
      SET status = 'resolved', resolved_in_favor_of = $1, resolved_at = NOW(), blockchain_tx_hash = $2
      WHERE project_id = $3 AND milestone_num = $4
    `, [resolvedInFavorOf, txHash, projectId, milestoneNum]);
    
    console.log(`✅ Dispute resolved: Project ${projectId}, Milestone ${milestoneNum}`);
  }

  async handleForceReleased(data: any) {
    const { projectId, milestoneNum, amount, txHash } = data;
    
    // Log admin action
    await db.query(`
      INSERT INTO admin_audit_log (admin_address, action, target_type, target_id, blockchain_tx_hash, tx_status)
      VALUES ('SYSTEM', 'force_release', 'milestone', $1, $2, 'confirmed')
    `, [`${projectId}-${milestoneNum}`, txHash]);
    
    console.log(`⚡ Force released: Project ${projectId}, Milestone ${milestoneNum}, Amount ${amount}`);
  }

  async notifyAdmin(type: string, data: any) {
    // Send WebSocket notification to admin dashboard
    // Or send email/SMS to admin
    console.log(`📧 Admin notification: ${type}`, data);
  }
}
```

---

## 🔐 Wallet-Based Admin Authentication

### **Replace Username/Password with Wallet Challenge**

```typescript
// routes/admin-auth.routes.ts

import { verifyMessageSignature } from '@stacks/encryption';

// ============ POST /api/admin/auth/challenge ============
// Generate challenge for admin wallet

router.post('/api/admin/auth/challenge', async (req, res) => {
  const { walletAddress } = req.body;
  
  // Check if wallet is authorized admin
  const admin = await db.query(`
    SELECT * FROM admin_wallets
    WHERE wallet_address = $1 AND is_active = true
  `, [walletAddress]);
  
  if (admin.rows.length === 0) {
    return res.status(403).json({ message: 'Wallet not authorized' });
  }
  
  // Generate random challenge
  const challenge = crypto.randomBytes(32).toString('hex');
  
  // Store challenge temporarily (expires in 5 minutes)
  await redis.setex(`admin_challenge:${walletAddress}`, 300, challenge);
  
  res.json({ challenge });
});

// ============ POST /api/admin/auth/verify ============
// Verify signed challenge and issue JWT

router.post('/api/admin/auth/verify', async (req, res) => {
  const { walletAddress, signature, publicKey } = req.body;
  
  // Retrieve challenge
  const challenge = await redis.get(`admin_challenge:${walletAddress}`);
  
  if (!challenge) {
    return res.status(400).json({ message: 'Challenge expired or not found' });
  }
  
  // Verify signature
  const isValid = verifyMessageSignature({
    message: challenge,
    signature,
    publicKey
  });
  
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid signature' });
  }
  
  // Fetch admin permissions
  const admin = await db.query(`
    SELECT * FROM admin_wallets
    WHERE wallet_address = $1 AND is_active = true
  `, [walletAddress]);
  
  // Generate JWT
  const token = jwt.sign(
    { 
      walletAddress, 
      role: 'admin',
      permissions: admin.rows[0].permissions
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
  
  // Delete used challenge
  await redis.del(`admin_challenge:${walletAddress}`);
  
  res.json({ token, admin: admin.rows[0] });
});
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Dispute Management Backend** (Week 1)
- [ ] Create `disputes` table
- [ ] Create `dispute_evidence` table
- [ ] Implement `/api/admin/disputes` endpoints
- [ ] Implement blockchain event listener for dispute filings
- [ ] Add dispute notification system

### **Phase 2: Admin Audit & Configuration** (Week 2)
- [ ] Create `admin_audit_log` table
- [ ] Create `platform_config` table
- [ ] Implement `/api/admin/audit-log` endpoints
- [ ] Implement `/api/admin/config` endpoints
- [ ] Add blockchain TX verification

### **Phase 3: Wallet-Based Auth & Multi-Admin** (Week 3)
- [ ] Create `admin_wallets` table
- [ ] Implement wallet challenge-response auth
- [ ] Replace username/password with wallet auth
- [ ] Add multi-admin management endpoints
- [ ] Implement permission system

### **Phase 4: Analytics & Monitoring** (Week 4)
- [ ] Create `platform_analytics` materialized view
- [ ] Implement `/api/admin/analytics` endpoints
- [ ] Add real-time dashboard metrics
- [ ] Implement admin notification system (WebSocket)
- [ ] Add rate limiting for admin actions

---

## 🔒 Security Best Practices

### **1. Multi-Sig Admin Wallet**
```
Recommended: Use 2-of-3 or 3-of-5 multi-sig wallet for admin actions
- Prevents single point of failure
- Requires multiple admins to approve critical actions
```

### **2. Rate Limiting**
```typescript
// Limit admin actions to prevent abuse
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 admin actions per 15 min
  message: 'Too many admin actions, please try again later'
});

router.use('/api/admin', adminRateLimiter);
```

### **3. Audit All Actions**
```typescript
// Every admin action MUST be logged
async function logAdminAction(adminAddress: string, action: string, details: any, txHash: string) {
  await db.query(`
    INSERT INTO admin_audit_log (admin_address, action, details, blockchain_tx_hash)
    VALUES ($1, $2, $3, $4)
  `, [adminAddress, action, details, txHash]);
}
```

### **4. Verify On-Chain**
```typescript
// Always verify admin actions against blockchain
async function verifyAdminAction(txHash: string): Promise<boolean> {
  const tx = await stacksApi.getTransactionById(txHash);
  return tx.tx_status === 'success';
}
```

---

**Last Updated**: 2026-02-14  
**Status**: Planning Phase  
**Priority**: Critical - Dispute resolution backend is foundational for admin panel
