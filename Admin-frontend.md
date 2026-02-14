# Admin Frontend Architecture - STXWorx Decentralized Platform

> **Role**: Platform Governance & Dispute Resolution  
> **Current Status**: 6 Admin Panels Implemented → Production-Grade Admin Dashboard  
> **Tech Stack**: React, TypeScript, Tailwind CSS, @stacks/connect  
> **Access Control**: Wallet-based admin authentication

---

## 🎯 Admin Role in Decentralized Platform

### **Core Principle**
In a decentralized marketplace, the admin is **NOT** a central authority but a **dispute mediator** and **platform maintainer**:

1. **Cannot control user funds** (funds locked in smart contract)
2. **Cannot modify contracts** without on-chain transactions
3. **Can resolve disputes** through transparent on-chain actions
4. **Can pause platform** in emergencies (circuit breaker)
5. **All actions are auditable** on blockchain

### **Trust Model**
```
┌─────────────────────────────────────────────────────────┐
│              ADMIN TRUST HIERARCHY                      │
├─────────────────────────────────────────────────────────┤
│  1. Smart Contract (Immutable Rules)                    │
│     └─ Admin functions have strict conditions           │
│     └─ Cannot bypass escrow logic                       │
│                                                          │
│  2. Admin Wallet (Multi-Sig Recommended)                │
│     └─ Signs all admin transactions                     │
│     └─ Actions visible on blockchain                    │
│                                                          │
│  3. Admin Dashboard (UI Layer)                          │
│     └─ Displays data, constructs transactions           │
│     └─ Cannot execute without wallet signature          │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Current Admin Frontend Structure

```
/stxworx-freelance/components/
├── AdminLogin.tsx          ✅ Admin authentication (4.8KB)
├── AdminPanel.tsx          ✅ Main dashboard wrapper (8.4KB)
└── admin/
    ├── AdminUsers.tsx      ✅ User management (4.7KB)
    ├── AdminJobs.tsx       ✅ Project oversight (10.6KB)
    ├── AdminChats.tsx      ✅ Chat monitoring (7.4KB)
    ├── AdminApprovals.tsx  ✅ Approval queue (2.9KB)
    ├── AdminSupport.tsx    ✅ Support tickets (3.6KB)
    └── AdminNFT.tsx        ✅ NFT management (4.6KB)
```

### **What's Working**
- ✅ **Admin Login**: Wallet-based authentication
- ✅ **Overview Dashboard**: Platform stats (volume, active jobs, disputes, users)
- ✅ **Jobs Queue**: View all projects with milestone details
- ✅ **Admin Actions**: Force release, force refund (UI buttons)
- ✅ **User Control**: View users, roles, earnings, reports
- ✅ **Chat Monitoring**: View all chat conversations
- ✅ **Support Tickets**: View and respond to tickets
- ✅ **NFT Release**: Manage NFT drops

### **What's Missing (Critical for Production)**
- ❌ **Dispute Resolution Panel** (dedicated dispute management)
- ❌ **Dispute Evidence Viewer** (view files, chat logs, deliverables)
- ❌ **Blockchain Transaction Verification** (verify admin actions on-chain)
- ❌ **Platform Configuration** (fee rate, pause contract, treasury address)
- ❌ **Analytics Dashboard** (charts, trends, revenue tracking)
- ❌ **Audit Log** (all admin actions with timestamps)
- ❌ **User Ban/Unban Flow** (with reason and appeal process)
- ❌ **Abandoned Project Recovery** (force refund after timeout)
- ❌ **sBTC Contract Management** (set sBTC token contract)
- ❌ **Multi-Admin Management** (add/remove admin wallets)

---

## 📋 Missing Admin Pages & Features

### **Page 1: Dispute Resolution Center** (NEW - Critical)
**Route**: `/admin/disputes`  
**Purpose**: Centralized dispute management with evidence review  
**User**: Admin

```tsx
// components/admin/AdminDisputes.tsx
interface AdminDisputesProps {}

const AdminDisputes: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');

  useEffect(() => {
    fetchDisputes(filter).then(setDisputes);
  }, [filter]);

  const handleResolve = async (disputeId: string, releaseToFreelancer: bool) => {
    const dispute = disputes.find(d => d.id === disputeId);
    
    // Call smart contract function
    if (dispute.project.tokenType === 'STX') {
      await adminResolveDisputeSTX(
        dispute.projectId,
        dispute.milestoneNum,
        releaseToFreelancer
      );
    } else {
      await adminResolveDisputeSBTC(
        dispute.projectId,
        dispute.milestoneNum,
        releaseToFreelancer
      );
    }
    
    toast.success('Dispute resolved on-chain');
    await fetchDisputes(filter).then(setDisputes);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Dispute List (Left Sidebar) */}
      <div className="col-span-1 space-y-3">
        <div className="flex gap-2 mb-4">
          <TabButton active={filter === 'open'} onClick={() => setFilter('open')}>
            Open ({disputes.filter(d => d.status === 'open').length})
          </TabButton>
          <TabButton active={filter === 'resolved'} onClick={() => setFilter('resolved')}>
            Resolved
          </TabButton>
        </div>

        {disputes.map(dispute => (
          <DisputeCard
            key={dispute.id}
            dispute={dispute}
            isSelected={selectedDispute?.id === dispute.id}
            onClick={() => setSelectedDispute(dispute)}
          />
        ))}
      </div>

      {/* Dispute Details (Main Area) */}
      <div className="col-span-2">
        {selectedDispute ? (
          <DisputeDetailsPanel
            dispute={selectedDispute}
            onResolve={handleResolve}
          />
        ) : (
          <EmptyState message="Select a dispute to review" />
        )}
      </div>
    </div>
  );
};
```

**Components Needed**:
- `DisputeCard.tsx` - Dispute summary card
- `DisputeDetailsPanel.tsx` - Full dispute view with evidence
- `EvidenceViewer.tsx` - Display images, files, chat logs
- `ResolutionConfirmModal.tsx` - Confirm resolution decision

---

### **Page 2: Dispute Details Panel** (NEW - Critical)
**Component**: `DisputeDetailsPanel.tsx`  
**Purpose**: Review evidence and make resolution decision

```tsx
// components/admin/DisputeDetailsPanel.tsx
interface DisputeDetailsPanelProps {
  dispute: Dispute;
  onResolve: (disputeId: string, releaseToFreelancer: boolean) => void;
}

const DisputeDetailsPanel: React.FC<DisputeDetailsPanelProps> = ({
  dispute,
  onResolve
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [decision, setDecision] = useState<'freelancer' | 'client' | null>(null);

  return (
    <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
      {/* Dispute Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Dispute #{dispute.id}
            </h2>
            <p className="text-slate-400">
              Project: {dispute.project.title} • Milestone {dispute.milestoneNum}
            </p>
          </div>
          <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-sm font-bold">
            {dispute.status}
          </span>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-xs text-slate-500 mb-2">CLIENT</p>
            <p className="font-mono text-sm text-white">{dispute.project.clientAddress}</p>
            <p className="text-xs text-slate-400 mt-1">
              {dispute.project.clientJobsPosted} jobs posted
            </p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-xs text-slate-500 mb-2">FREELANCER</p>
            <p className="font-mono text-sm text-white">{dispute.project.freelancerAddress}</p>
            <p className="text-xs text-slate-400 mt-1">
              {dispute.freelancerJobsCompleted} jobs completed
            </p>
          </div>
        </div>
      </div>

      {/* Dispute Reason */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-3">Dispute Filed By</h3>
        <p className="text-slate-300">
          {dispute.filedBy === dispute.project.clientAddress ? 'Client' : 'Freelancer'}
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Filed on: {formatDate(dispute.filedAt)}
        </p>
      </div>

      {/* Evidence Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-3">Evidence</h3>
        
        {/* Client Evidence */}
        <div className="mb-4">
          <p className="text-sm font-bold text-slate-400 mb-2">Client's Claim:</p>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-slate-300">{dispute.clientEvidence.description}</p>
            {dispute.clientEvidence.files.length > 0 && (
              <div className="mt-3 flex gap-2">
                {dispute.clientEvidence.files.map((file, idx) => (
                  <EvidenceFile key={idx} file={file} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Freelancer Evidence */}
        <div className="mb-4">
          <p className="text-sm font-bold text-slate-400 mb-2">Freelancer's Defense:</p>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-slate-300">{dispute.freelancerEvidence.description}</p>
            {dispute.freelancerEvidence.files.length > 0 && (
              <div className="mt-3 flex gap-2">
                {dispute.freelancerEvidence.files.map((file, idx) => (
                  <EvidenceFile key={idx} file={file} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Milestone Deliverable */}
        <div className="mb-4">
          <p className="text-sm font-bold text-slate-400 mb-2">Milestone Deliverable:</p>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <a 
              href={dispute.milestone.submissionLink} 
              target="_blank"
              className="text-orange-500 hover:underline"
            >
              {dispute.milestone.submissionLink}
            </a>
          </div>
        </div>

        {/* Chat History */}
        <div>
          <p className="text-sm font-bold text-slate-400 mb-2">Chat History:</p>
          <ChatHistoryViewer 
            projectId={dispute.projectId}
            clientAddress={dispute.project.clientAddress}
            freelancerAddress={dispute.project.freelancerAddress}
          />
        </div>
      </div>

      {/* Resolution Actions */}
      <div className="border-t border-slate-800 pt-6">
        <h3 className="text-lg font-bold text-white mb-4">Resolution Decision</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setDecision('freelancer');
              setShowConfirmModal(true);
            }}
            className="px-6 py-4 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded-lg font-bold transition-colors"
          >
            Release to Freelancer
          </button>
          <button
            onClick={() => {
              setDecision('client');
              setShowConfirmModal(true);
            }}
            className="px-6 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded-lg font-bold transition-colors"
          >
            Refund to Client
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ResolutionConfirmModal
          dispute={dispute}
          decision={decision!}
          onConfirm={() => {
            onResolve(dispute.id, decision === 'freelancer');
            setShowConfirmModal(false);
          }}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};
```

---

### **Page 3: Platform Configuration** (NEW - Critical)
**Route**: `/admin/settings`  
**Purpose**: Configure platform parameters (fee rate, pause, treasury)  
**User**: Admin

```tsx
// components/admin/AdminSettings.tsx
const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState({
    feeRate: 1000, // 10% (basis points)
    treasury: 'SP...',
    isPaused: false,
    sbtcContract: 'SP...',
  });

  const handleUpdateFeeRate = async (newRate: number) => {
    // Call smart contract: set-fee-rate
    await setFeeRate(newRate);
    toast.success('Fee rate updated on-chain');
  };

  const handlePauseContract = async (paused: boolean) => {
    // Call smart contract: set-paused
    await setPaused(paused);
    toast.success(paused ? 'Contract paused' : 'Contract resumed');
  };

  const handleUpdateTreasury = async (newTreasury: string) => {
    // Call smart contract: set-treasury
    await setTreasury(newTreasury);
    toast.success('Treasury address updated');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Platform Configuration</h2>

      {/* Fee Rate */}
      <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4">Platform Fee Rate</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={config.feeRate}
            onChange={(e) => setConfig({...config, feeRate: Number(e.target.value)})}
            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-32"
            min={0}
            max={1000}
          />
          <span className="text-slate-400">basis points (max 1000 = 10%)</span>
          <button
            onClick={() => handleUpdateFeeRate(config.feeRate)}
            className="ml-auto btn-primary"
          >
            Update Fee Rate
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Current: {config.feeRate / 100}% • Max: 10%
        </p>
      </div>

      {/* Emergency Pause */}
      <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4">Emergency Circuit Breaker</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300">
              Pause all new project creation and milestone actions
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Admin actions (dispute resolution) remain functional
            </p>
          </div>
          <button
            onClick={() => handlePauseContract(!config.isPaused)}
            className={`px-6 py-3 rounded-lg font-bold ${
              config.isPaused
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {config.isPaused ? 'Resume Contract' : 'Pause Contract'}
          </button>
        </div>
      </div>

      {/* Treasury Address */}
      <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4">Treasury Address</h3>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={config.treasury}
            onChange={(e) => setConfig({...config, treasury: e.target.value})}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 font-mono text-sm"
            placeholder="SP..."
          />
          <button
            onClick={() => handleUpdateTreasury(config.treasury)}
            className="btn-primary"
          >
            Update Treasury
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Platform fees are sent to this address
        </p>
      </div>

      {/* sBTC Contract */}
      <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-4">sBTC Token Contract</h3>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={config.sbtcContract}
            onChange={(e) => setConfig({...config, sbtcContract: e.target.value})}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 font-mono text-sm"
            placeholder="SP..."
          />
          <button
            onClick={() => setSBTCContract(config.sbtcContract)}
            className="btn-primary"
          >
            Set sBTC Contract
          </button>
        </div>
        <p className="text-xs text-red-400 mt-2">
          ⚠️ Can only be changed when no active sBTC escrows exist
        </p>
      </div>
    </div>
  );
};
```

---

### **Page 4: Analytics Dashboard** (NEW - Medium Priority)
**Route**: `/admin/analytics`  
**Purpose**: Platform metrics, charts, revenue tracking

```tsx
// components/admin/AdminAnalytics.tsx
const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalFees: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalUsers: 0,
    disputeRate: 0,
  });

  const [chartData, setChartData] = useState({
    volumeByDay: [],
    projectsByCategory: [],
    tokenDistribution: [],
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          label="Total Volume"
          value={formatUSD(stats.totalVolume)}
          change="+12.5%"
          trend="up"
        />
        <StatCard
          label="Platform Fees"
          value={formatUSD(stats.totalFees)}
          change="+8.3%"
          trend="up"
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
        />
        <StatCard
          label="Dispute Rate"
          value={`${stats.disputeRate}%`}
          change="-2.1%"
          trend="down"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard title="Volume Over Time">
          <LineChart data={chartData.volumeByDay} />
        </ChartCard>
        <ChartCard title="Projects by Category">
          <PieChart data={chartData.projectsByCategory} />
        </ChartCard>
      </div>

      {/* Token Distribution */}
      <ChartCard title="STX vs sBTC Usage">
        <BarChart data={chartData.tokenDistribution} />
      </ChartCard>
    </div>
  );
};
```

---

### **Page 5: Audit Log** (NEW - Medium Priority)
**Route**: `/admin/audit-log`  
**Purpose**: Track all admin actions with blockchain verification

```tsx
// components/admin/AdminAuditLog.tsx
const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchAdminAuditLogs().then(setLogs);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Audit Log</h2>

      <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs font-bold uppercase text-slate-500 border-b border-slate-800">
              <th className="px-6 py-4 text-left">Timestamp</th>
              <th className="px-6 py-4 text-left">Action</th>
              <th className="px-6 py-4 text-left">Admin</th>
              <th className="px-6 py-4 text-left">Target</th>
              <th className="px-6 py-4 text-left">TX Hash</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-800/30">
                <td className="px-6 py-4 text-sm text-slate-400">
                  {formatDateTime(log.timestamp)}
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-white">{log.action}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                  {log.adminAddress.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">
                  {log.target}
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`https://explorer.stacks.co/txid/${log.txHash}`}
                    target="_blank"
                    className="font-mono text-xs text-orange-500 hover:underline"
                  >
                    {log.txHash.slice(0, 8)}...
                  </a>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    log.status === 'confirmed'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## 🔄 Admin Workflow Flows

### **Flow 1: Resolve Dispute**
```
1. Admin Dashboard (/admin)
   ↓ [See "3 Open Disputes" alert]
   ↓ [Click "View Disputes"]
   ↓
2. Dispute Resolution Center (/admin/disputes)
   ↓ [View list of open disputes]
   ↓ [Click dispute #123]
   ↓
3. Dispute Details Panel
   ↓ [Read client's claim: "Work incomplete"]
   ↓ [Read freelancer's defense: "All features delivered"]
   ↓ [View milestone deliverable link]
   ↓ [Check chat history]
   ↓ [Review evidence files]
   ↓ [Make decision: Release to Freelancer]
   ↓ [Click "Release to Freelancer"]
   ↓
4. Confirmation Modal
   ↓ "This will transfer funds on-chain. Continue?"
   ↓ [Click "Confirm"]
   ↓
5. Wallet Popup (Hiro/Xverse)
   ↓ [Admin signs transaction]
   ↓ [admin-resolve-dispute-stx(123, 2, true)]
   ↓
6. Smart Contract: escrow-multi-token.clar
   ↓ [Transfer milestone funds to freelancer]
   ↓ [Mark dispute.status = 'resolved']
   ↓ [Emit "dispute-resolved" event]
   ↓
7. Backend Indexer
   ↓ [Detect event]
   ↓ [Update database]
   ↓ [Send notifications to both parties]
   ↓
8. Audit Log
   ↓ [Record admin action with TX hash]
```

---

### **Flow 2: Force Release Milestone (Abandoned Client)**
```
1. Admin Jobs Queue (/admin/jobs)
   ↓ [See project with milestone "submitted" for 30+ days]
   ↓ [Client not responding]
   ↓ [Click "Manage" on project]
   ↓
2. Expanded Milestone View
   ↓ [See Milestone 2: "Submitted" status]
   ↓ [Check: Completed 30 days ago (> 24hr timeout)]
   ↓ [Click "Force Release"]
   ↓
3. Wallet Popup
   ↓ [Admin signs transaction]
   ↓ [admin-force-release-stx(456, 2)]
   ↓
4. Smart Contract
   ↓ [Verify: milestone.complete = true]
   ↓ [Verify: 30 days > FORCE-RELEASE-TIMEOUT]
   ↓ [Transfer funds to freelancer]
   ↓ [Mark milestone.released = true]
   ↓ [Emit "force-released" event]
   ↓
5. Notification to Freelancer
   ↓ "Admin released payment for Milestone 2"
```

---

### **Flow 3: Pause Platform (Emergency)**
```
1. Admin Settings (/admin/settings)
   ↓ [Detect security vulnerability]
   ↓ [Click "Pause Contract"]
   ↓
2. Confirmation Dialog
   ↓ "This will halt all new projects and milestone actions"
   ↓ [Click "Confirm Emergency Pause"]
   ↓
3. Wallet Popup
   ↓ [Admin signs transaction]
   ↓ [set-paused(true)]
   ↓
4. Smart Contract
   ↓ [Set contract-paused = true]
   ↓ [Emit "contract-paused-updated" event]
   ↓
5. Platform-Wide Effect
   ↓ [All create-project calls fail]
   ↓ [All complete-milestone calls fail]
   ↓ [Admin functions still work]
   ↓
6. Notification Banner
   ↓ "Platform paused for maintenance"
```

---

## 🧩 New Components Needed

### **High Priority**
1. **AdminDisputes.tsx** - Dispute resolution center
2. **DisputeDetailsPanel.tsx** - Full dispute view
3. **EvidenceViewer.tsx** - Display evidence files
4. **ResolutionConfirmModal.tsx** - Confirm resolution
5. **AdminSettings.tsx** - Platform configuration
6. **ChatHistoryViewer.tsx** - View project chat logs

### **Medium Priority**
7. **AdminAnalytics.tsx** - Analytics dashboard
8. **AdminAuditLog.tsx** - Audit trail
9. **StatCard.tsx** - KPI card component
10. **ChartCard.tsx** - Chart wrapper
11. **LineChart.tsx** - Time series chart
12. **PieChart.tsx** - Category distribution

### **Low Priority**
13. **AdminMultiSig.tsx** - Multi-admin management
14. **AdminNotifications.tsx** - Admin-specific alerts
15. **AdminReports.tsx** - Generate reports

---

## 🔧 Service Layer Updates

### **New Functions in StacksService.ts**
```typescript
// ============ ADMIN: DISPUTES ============

export const fetchDisputes = async (filter: 'open' | 'resolved' | 'all'): Promise<Dispute[]> => {
  const res = await fetch(`http://localhost:5001/api/admin/disputes?filter=${filter}`);
  return res.json();
};

export const adminResolveDisputeSTX = async (
  projectId: number,
  milestoneNum: number,
  releaseToFreelancer: boolean
): Promise<boolean> => {
  // Call smart contract via @stacks/connect
  const functionArgs = [
    uintCV(projectId),
    uintCV(milestoneNum),
    boolCV(releaseToFreelancer)
  ];
  
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'escrow-multi-token',
    functionName: 'admin-resolve-dispute-stx',
    functionArgs,
  });
  
  return true;
};

export const adminResolveDisputeSBTC = async (
  projectId: number,
  milestoneNum: number,
  releaseToFreelancer: boolean
): Promise<boolean> => {
  // Similar to STX but with sBTC token parameter
  const functionArgs = [
    uintCV(projectId),
    uintCV(milestoneNum),
    boolCV(releaseToFreelancer),
    contractPrincipalCV(SBTC_CONTRACT_ADDRESS, 'sbtc-token')
  ];
  
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'escrow-multi-token',
    functionName: 'admin-resolve-dispute-sbtc',
    functionArgs,
  });
  
  return true;
};

// ============ ADMIN: CONFIGURATION ============

export const setFeeRate = async (newRate: number): Promise<boolean> => {
  const functionArgs = [uintCV(newRate)];
  
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'escrow-multi-token',
    functionName: 'set-fee-rate',
    functionArgs,
  });
  
  return true;
};

export const setPaused = async (paused: boolean): Promise<boolean> => {
  const functionArgs = [boolCV(paused)];
  
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'escrow-multi-token',
    functionName: 'set-paused',
    functionArgs,
  });
  
  return true;
};

export const setTreasury = async (newTreasury: string): Promise<boolean> => {
  const functionArgs = [principalCV(newTreasury)];
  
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'escrow-multi-token',
    functionName: 'set-treasury',
    functionArgs,
  });
  
  return true;
};

export const setSBTCContract = async (contractAddress: string): Promise<boolean> => {
  const functionArgs = [principalCV(contractAddress)];
  
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: 'escrow-multi-token',
    functionName: 'set-sbtc-contract',
    functionArgs,
  });
  
  return true;
};

// ============ ADMIN: AUDIT LOG ============

export const fetchAdminAuditLogs = async (): Promise<AuditLog[]> => {
  const res = await fetch('http://localhost:5001/api/admin/audit-log');
  return res.json();
};
```

---

## 🚀 Implementation Roadmap

### **Sprint 1: Dispute Resolution** (Week 1)
- [ ] Create `AdminDisputes.tsx` page
- [ ] Create `DisputeDetailsPanel.tsx` component
- [ ] Create `EvidenceViewer.tsx` component
- [ ] Create `ResolutionConfirmModal.tsx`
- [ ] Add smart contract integration for dispute resolution
- [ ] Update routing to include `/admin/disputes`

### **Sprint 2: Platform Configuration** (Week 2)
- [ ] Create `AdminSettings.tsx` page
- [ ] Implement fee rate adjustment UI
- [ ] Implement pause/resume contract UI
- [ ] Implement treasury address update UI
- [ ] Add smart contract integration for config changes
- [ ] Add confirmation modals for critical actions

### **Sprint 3: Analytics & Audit** (Week 3)
- [ ] Create `AdminAnalytics.tsx` page
- [ ] Create `AdminAuditLog.tsx` page
- [ ] Implement chart components (Line, Pie, Bar)
- [ ] Fetch analytics data from backend
- [ ] Display audit trail with blockchain verification

### **Sprint 4: Polish & Security** (Week 4)
- [ ] Add multi-admin wallet support
- [ ] Implement admin role verification
- [ ] Add rate limiting for admin actions
- [ ] Add 2FA for critical admin functions
- [ ] Security audit of admin panel

---

**Last Updated**: 2026-02-14  
**Status**: Planning Phase  
**Priority**: High - Dispute resolution is critical for platform trust
