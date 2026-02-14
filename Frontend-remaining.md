# Frontend Architecture - STXWorx Decentralized Application

> **Architecture Pattern**: Component-Based + Blockchain-First Design  
> **Decentralization Model**: Client-Side Transaction Signing  
> **Current Status**: Functional MVP → Production-Grade DApp Frontend  
> **Tech Stack**: React, TypeScript, Vite, Tailwind CSS, @stacks/connect

---

## 🎯 Decentralization Philosophy

### **Core Principle**
The frontend is a **pure client-side application** where:
1. **Users control their private keys** (via Stacks wallet)
2. **All state-changing operations require user signatures**
3. **Backend is optional** (can work with blockchain alone)
4. **No central server can block user actions**

### **Trust Model**
```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND TRUST LAYERS                      │
├─────────────────────────────────────────────────────────┤
│  1. User's Wallet (Hiro, Xverse, Leather)              │
│     └─ User controls private keys                       │
│     └─ Signs all transactions locally                   │
│                                                          │
│  2. Smart Contract (Immutable Code)                     │
│     └─ Enforces business rules                          │
│     └─ Cannot be modified by anyone                     │
│                                                          │
│  3. Frontend UI (Open Source)                           │
│     └─ Displays data, constructs transactions           │
│     └─ User can verify code or self-host                │
│                                                          │
│  4. Backend API (Optional Cache)                        │
│     └─ Improves UX with fast reads                      │
│     └─ Cannot modify blockchain state                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Current Frontend Structure (As-Is)

```
/stxworx-freelance/
├── components/
│   ├── AdminLogin.tsx          ✅ Admin authentication
│   ├── AdminPanel.tsx          ✅ Admin dashboard wrapper
│   ├── ChatWidget.tsx          ✅ P2P messaging (22KB)
│   ├── CreateGigModal.tsx      ✅ Freelancer creates gig
│   ├── CreateProjectModal.tsx  ✅ Client creates project (19KB)
│   ├── EditProfile.tsx         ✅ User profile editing
│   ├── FreelancerProfile.tsx   ✅ Freelancer profile view
│   ├── GigCard.tsx             ✅ Gig display card
│   ├── GigDetails.tsx          ✅ Detailed gig view
│   ├── Leaderboard.tsx         ✅ Freelancer rankings
│   ├── Navbar.tsx              ✅ Navigation bar
│   ├── ProjectCard.tsx         ✅ Project display card
│   ├── admin/
│   │   ├── AdminApprovals.tsx  ✅ Approval queue
│   │   ├── AdminChats.tsx      ✅ Chat monitoring
│   │   ├── AdminJobs.tsx       ✅ Project oversight
│   │   ├── AdminNFT.tsx        ✅ NFT management
│   │   ├── AdminSupport.tsx    ✅ Support tickets
│   │   └── AdminUsers.tsx      ✅ User management
│   └── wallet/
│       ├── WalletButton.tsx    ✅ Wallet connection
│       └── WalletProvider.tsx  ✅ Wallet context
├── services/
│   ├── StacksService.ts        ✅ API & blockchain calls (355 lines)
│   └── mockStacksService.ts    ✅ Mock data for development
├── hooks/
│   └── useWallet.ts            ✅ Wallet state management
├── types/
│   └── index.ts                ✅ TypeScript definitions
├── lib/
│   └── contracts.ts            ✅ Smart contract interactions
├── App.tsx                     ✅ Main orchestrator (943 lines)
└── index.tsx                   ✅ Entry point
```

### **What's Working**
- ✅ Wallet connection (Stacks wallets)
- ✅ Project creation with milestone breakdown
- ✅ Project funding (escrow smart contract)
- ✅ Milestone submission & approval flow
- ✅ Gig browsing (freelancer services)
- ✅ Leaderboard & profiles
- ✅ Admin dashboard (6 sub-panels)
- ✅ Chat widget UI

### **What's Missing (Critical for Marketplace)**
- ❌ **Browse Jobs** page (freelancers can't see client projects)
- ❌ **Job Details** page (view full project description)
- ❌ **Submit Proposal** flow (freelancers apply to jobs)
- ❌ **Proposal Review** page (client compares proposals)
- ❌ **My Proposals** page (freelancer tracks applications)
- ❌ **Hiring Flow** (client selects freelancer → triggers funding)
- ❌ **Notifications** system (real-time updates)
- ❌ **Search & Filters** (find jobs by category, budget, token)
- ❌ **Review/Rating** system (post-project feedback)
- ❌ **Dispute UI** (file and track disputes)

---

## 🎯 Target Frontend Architecture

### **Page Structure & Navigation**
```
┌─────────────────────────────────────────────────────────┐
│                    NAVBAR                               │
│  [Logo] [Find Work] [My Projects] [My Proposals]       │
│         [Gigs] [Leaderboard] [🔔] [Wallet]             │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   CLIENT     │  │  FREELANCER  │  │    SHARED    │
│    FLOWS     │  │    FLOWS     │  │    PAGES     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        │                │                │
   ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
   │         │      │         │      │         │
   ▼         ▼      ▼         ▼      ▼         ▼
 Post    Review   Browse   Submit  Profile  Leaderboard
 Job     Proposals Jobs    Proposal
   │         │      │         │
   │         │      │         │
   ▼         ▼      ▼         ▼
 Fund    Accept   View    Track
Project Proposal Details Proposals
```

---

## 📋 Missing Pages & Components

### **Page 1: Browse Jobs** (NEW - Critical)
**Route**: `/jobs` or `/find-work`  
**Purpose**: Freelancers discover client-posted projects  
**User**: Freelancers

```tsx
// components/BrowseJobs.tsx
interface BrowseJobsProps {}

const BrowseJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Project[]>([]);
  const [filters, setFilters] = useState({
    category: 'all',
    budgetMin: 0,
    budgetMax: 10000,
    tokenType: 'all', // 'STX' | 'sBTC' | 'all'
    searchQuery: ''
  });

  // Fetch open projects from backend (status='open')
  useEffect(() => {
    fetchOpenProjects(filters).then(setJobs);
  }, [filters]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Find Work</h1>
        <p className="text-slate-400">Browse available projects and submit proposals</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex gap-4">
        <SearchBar 
          value={filters.searchQuery} 
          onChange={(q) => setFilters({...filters, searchQuery: q})}
          placeholder="Search projects..."
        />
        <FilterDropdown
          label="Category"
          options={['All', 'Development', 'Design', 'Marketing']}
          value={filters.category}
          onChange={(c) => setFilters({...filters, category: c})}
        />
        <FilterDropdown
          label="Token"
          options={['All', 'STX', 'sBTC']}
          value={filters.tokenType}
          onChange={(t) => setFilters({...filters, tokenType: t})}
        />
      </div>

      {/* Job Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <JobCard 
            key={job.id} 
            job={job}
            onClick={() => navigate(`/jobs/${job.id}`)}
          />
        ))}
      </div>

      {/* Empty State */}
      {jobs.length === 0 && (
        <EmptyState 
          icon={<Briefcase />}
          message="No jobs match your filters"
          action={() => setFilters(defaultFilters)}
          actionLabel="Clear Filters"
        />
      )}
    </div>
  );
};
```

**New Components Needed**:
- `JobCard.tsx` - Displays job summary (title, budget, milestones, token type)
- `SearchBar.tsx` - Debounced search input
- `FilterDropdown.tsx` - Reusable filter component
- `EmptyState.tsx` - Generic empty state component

---

### **Page 2: Job Details** (NEW - Critical)
**Route**: `/jobs/:id`  
**Purpose**: View full project description and submit proposal  
**User**: Freelancers

```tsx
// components/JobDetails.tsx
interface JobDetailsProps {
  jobId: string;
}

const JobDetails: React.FC<JobDetailsProps> = ({ jobId }) => {
  const [job, setJob] = useState<Project | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const { userAddress } = useWallet();

  useEffect(() => {
    fetchProjectById(jobId).then(setJob);
  }, [jobId]);

  if (!job) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-3 gap-8">
        {/* Main Content (Left 2/3) */}
        <div className="col-span-2">
          <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
          
          {/* Client Info */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar address={job.clientAddress} />
            <div>
              <p className="font-semibold">{job.clientName}</p>
              <p className="text-sm text-slate-400">
                {job.clientRating} ⭐ • {job.clientJobsPosted} jobs posted
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Project Description</h2>
            <p className="text-slate-300 whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* Milestones Breakdown */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Milestones</h2>
            {job.milestones.map((milestone, idx) => (
              <MilestoneCard 
                key={idx}
                number={idx + 1}
                description={milestone.description}
                amount={milestone.amount}
                tokenType={job.tokenType}
              />
            ))}
          </div>

          {/* Skills Required */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar (Right 1/3) */}
        <div className="col-span-1">
          <div className="glass-panel p-6 sticky top-4">
            {/* Budget */}
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-1">Total Budget</p>
              <p className="text-3xl font-bold text-orange-500">
                {job.totalBudget} {job.tokenType}
              </p>
              <p className="text-sm text-slate-400">
                ≈ {formatUSD(tokenToUsd(job.totalBudget, job.tokenType))}
              </p>
            </div>

            {/* Project Stats */}
            <div className="mb-6 space-y-3">
              <Stat label="Proposals" value={job.proposalCount} />
              <Stat label="Duration" value={`${job.estimatedDuration} days`} />
              <Stat label="Posted" value={formatRelativeTime(job.createdAt)} />
            </div>

            {/* Apply Button */}
            <button
              onClick={() => setIsProposalModalOpen(true)}
              className="w-full btn-primary"
              disabled={!userAddress || job.clientAddress === userAddress}
            >
              Submit Proposal
            </button>
          </div>
        </div>
      </div>

      {/* Submit Proposal Modal */}
      <SubmitProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        project={job}
      />
    </div>
  );
};
```

**New Components Needed**:
- `MilestoneCard.tsx` - Display milestone details
- `Avatar.tsx` - User avatar with Stacks address
- `Badge.tsx` - Skill/tag badge
- `Stat.tsx` - Key-value stat display

---

### **Page 3: Submit Proposal Modal** (NEW - Critical)
**Component**: `SubmitProposalModal.tsx`  
**Triggered from**: Job Details page  
**User**: Freelancers

```tsx
// components/SubmitProposalModal.tsx
interface SubmitProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const SubmitProposalModal: React.FC<SubmitProposalModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const { userAddress } = useWallet();
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedBudget: project.totalBudget,
    proposedDuration: project.estimatedDuration || 14,
    portfolioLinks: ['']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitProposal({
        projectId: project.id,
        freelancerAddress: userAddress!,
        ...formData
      });
      toast.success('Proposal submitted successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Submit Proposal</h2>
        <p className="text-slate-400 mb-6">
          Applying for: <span className="text-white font-semibold">{project.title}</span>
        </p>

        {/* Cover Letter */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Cover Letter <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.coverLetter}
            onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
            placeholder="Explain why you're the best fit for this project..."
            className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg p-3"
            minLength={50}
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            {formData.coverLetter.length}/2000 characters (min 50)
          </p>
        </div>

        {/* Proposed Budget */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Proposed Budget ({project.tokenType})
            </label>
            <input
              type="number"
              value={formData.proposedBudget}
              onChange={(e) => setFormData({...formData, proposedBudget: Number(e.target.value)})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
              min={0}
            />
            <p className="text-xs text-slate-400 mt-1">
              Client budget: {project.totalBudget} {project.tokenType}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Estimated Duration (days)
            </label>
            <input
              type="number"
              value={formData.proposedDuration}
              onChange={(e) => setFormData({...formData, proposedDuration: Number(e.target.value)})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
              min={1}
            />
          </div>
        </div>

        {/* Portfolio Links */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Portfolio Links (Optional)
          </label>
          {formData.portfolioLinks.map((link, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="url"
                value={link}
                onChange={(e) => {
                  const newLinks = [...formData.portfolioLinks];
                  newLinks[idx] = e.target.value;
                  setFormData({...formData, portfolioLinks: newLinks});
                }}
                placeholder="https://github.com/yourproject"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3"
              />
              {idx > 0 && (
                <button
                  onClick={() => {
                    const newLinks = formData.portfolioLinks.filter((_, i) => i !== idx);
                    setFormData({...formData, portfolioLinks: newLinks});
                  }}
                  className="btn-secondary"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setFormData({...formData, portfolioLinks: [...formData.portfolioLinks, '']})}
            className="btn-secondary mt-2"
          >
            + Add Link
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || formData.coverLetter.length < 50}
            className="flex-1 btn-primary"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit Proposal'}
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

---

### **Page 4: Proposal Review** (NEW - Critical)
**Route**: `/projects/:id/proposals`  
**Purpose**: Client views and compares proposals  
**User**: Clients

```tsx
// components/ProposalReview.tsx
interface ProposalReviewProps {
  projectId: string;
}

const ProposalReview: React.FC<ProposalReviewProps> = ({ projectId }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const { userAddress } = useWallet();

  useEffect(() => {
    fetchProposalsForProject(projectId).then(setProposals);
  }, [projectId]);

  const handleAccept = async (proposalId: string) => {
    if (!confirm('This will reject all other proposals. Continue?')) return;
    
    await acceptProposal(proposalId);
    toast.success('Proposal accepted! Please fund the project to begin work.');
    navigate(`/projects/${projectId}/fund`);
  };

  const handleReject = async (proposalId: string) => {
    await rejectProposal(proposalId);
    setProposals(proposals.filter(p => p.id !== proposalId));
    toast.success('Proposal rejected');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Review Proposals</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Proposal List (Left Sidebar) */}
        <div className="col-span-1 space-y-3">
          <p className="text-slate-400 mb-4">{proposals.length} proposals received</p>
          {proposals.map(proposal => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              isSelected={selectedProposal?.id === proposal.id}
              onClick={() => setSelectedProposal(proposal)}
            />
          ))}
        </div>

        {/* Proposal Details (Main Area) */}
        <div className="col-span-2">
          {selectedProposal ? (
            <ProposalDetails
              proposal={selectedProposal}
              onAccept={() => handleAccept(selectedProposal.id)}
              onReject={() => handleReject(selectedProposal.id)}
            />
          ) : (
            <EmptyState 
              icon={<FileText />}
              message="Select a proposal to view details"
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

**New Components Needed**:
- `ProposalCard.tsx` - Proposal summary in list
- `ProposalDetails.tsx` - Full proposal view with freelancer profile

---

### **Page 5: My Proposals** (NEW - Critical)
**Route**: `/my-proposals`  
**Purpose**: Freelancers track their submitted proposals  
**User**: Freelancers

```tsx
// components/MyProposals.tsx
const MyProposals: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const { userAddress } = useWallet();
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  useEffect(() => {
    if (userAddress) {
      fetchProposalsByFreelancer(userAddress).then(setProposals);
    }
  }, [userAddress]);

  const groupedProposals = {
    pending: proposals.filter(p => p.status === 'pending'),
    accepted: proposals.filter(p => p.status === 'accepted'),
    rejected: proposals.filter(p => p.status === 'rejected'),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Proposals</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-700">
        <TabButton
          active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
          count={groupedProposals.pending.length}
        >
          Pending
        </TabButton>
        <TabButton
          active={activeTab === 'accepted'}
          onClick={() => setActiveTab('accepted')}
          count={groupedProposals.accepted.length}
        >
          Accepted
        </TabButton>
        <TabButton
          active={activeTab === 'rejected'}
          onClick={() => setActiveTab('rejected')}
          count={groupedProposals.rejected.length}
        >
          Rejected
        </TabButton>
      </div>

      {/* Proposal List */}
      <div className="space-y-4">
        {groupedProposals[activeTab].map(proposal => (
          <ProposalStatusCard
            key={proposal.id}
            proposal={proposal}
            onWithdraw={() => withdrawProposal(proposal.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {groupedProposals[activeTab].length === 0 && (
        <EmptyState
          icon={<FileText />}
          message={`No ${activeTab} proposals`}
          action={() => navigate('/jobs')}
          actionLabel="Browse Jobs"
        />
      )}
    </div>
  );
};
```

**New Components Needed**:
- `TabButton.tsx` - Tab navigation with count badge
- `ProposalStatusCard.tsx` - Proposal card with status indicator

---

### **Page 6: Notifications Center** (NEW - Medium Priority)
**Route**: `/notifications`  
**Purpose**: View all notifications  
**User**: All users

```tsx
// components/NotificationCenter.tsx
const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications(filter).then(setNotifications);
  }, [filter]);

  const markAsRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = async () => {
    await markAllNotificationsRead();
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <button onClick={markAllAsRead} className="btn-secondary">
          Mark all as read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={filter === 'unread' ? 'btn-primary' : 'btn-secondary'}
        >
          Unread
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {notifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onRead={() => markAsRead(notification.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

**New Components Needed**:
- `NotificationCard.tsx` - Individual notification item
- `NotificationBell.tsx` - Navbar notification icon with badge

---

## 🔄 Page Interaction Flows

### **Flow 1: Freelancer Applies to Job**
```
1. Browse Jobs Page (/jobs)
   ↓ [Search "React Developer"]
   ↓ [Filter: Budget $500-$2000, Token: STX]
   ↓
2. Job Listings (Filtered)
   ↓ [Click "Build DeFi Dashboard"]
   ↓
3. Job Details Page (/jobs/123)
   ↓ [Read description, milestones, client profile]
   ↓ [Click "Submit Proposal"]
   ↓
4. Submit Proposal Modal
   ↓ [Write cover letter]
   ↓ [Set proposed budget: 1500 STX]
   ↓ [Add portfolio links]
   ↓ [Click "Submit Proposal"]
   ↓
5. Backend: POST /api/projects/123/proposals
   ↓ [Save to database]
   ↓ [Send notification to client]
   ↓
6. Success Toast: "Proposal submitted!"
   ↓ [Redirect to /my-proposals]
   ↓
7. My Proposals Page
   ↓ [Proposal appears in "Pending" tab]
```

---

### **Flow 2: Client Hires Freelancer**
```
1. My Projects Page (/my-projects)
   ↓ [See "5 new proposals" badge on project card]
   ↓ [Click "Review Proposals"]
   ↓
2. Proposal Review Page (/projects/123/proposals)
   ↓ [View list of 5 proposals]
   ↓ [Click proposal from "Alice"]
   ↓
3. Proposal Details (Right Panel)
   ↓ [Read cover letter]
   ↓ [View Alice's profile: 4.8★, 12 jobs completed]
   ↓ [Compare budget: Alice proposed 1500 STX vs budget 2000 STX]
   ↓ [Click "Accept Proposal"]
   ↓
4. Confirmation Dialog
   ↓ "This will reject all other proposals. Continue?"
   ↓ [Click "Confirm"]
   ↓
5. Backend: PUT /api/proposals/456/accept
   ↓ [Update proposal.status = 'accepted']
   ↓ [Update project.freelancer_address = Alice's address]
   ↓ [Update project.status = 'pending']
   ↓ [Reject other 4 proposals]
   ↓ [Send notification to Alice]
   ↓
6. Redirect to Fund Project Page (/projects/123/fund)
   ↓ [Display: "Ready to fund escrow"]
   ↓ [Click "Lock Funds in Escrow"]
   ↓
7. Wallet Popup (Hiro/Xverse)
   ↓ [User signs transaction]
   ↓ [create-project-stx(Alice, 400, 400, 400, 300)]
   ↓
8. Smart Contract: escrow-multi-token.clar
   ↓ [Lock 1500 STX in escrow]
   ↓ [Deduct 150 STX platform fee (10%)]
   ↓ [Emit "project-created" event]
   ↓
9. Backend Indexer (10s poll)
   ↓ [Detect "project-created" event]
   ↓ [Update project.status = 'active']
   ↓ [Store tx_hash]
   ↓ [Send notification to Alice]
   ↓
10. Alice's Notification
    ↓ "Your proposal was accepted! Work can begin."
    ↓ [Click notification → Navigate to /projects/123]
```

---

### **Flow 3: Milestone Completion & Payment**
```
1. Active Project Page (/projects/123)
   ↓ [Freelancer: Alice completes Milestone 1]
   ↓ [Click "Submit Milestone 1"]
   ↓
2. Submit Milestone Modal
   ↓ [Paste deliverable link: https://github.com/alice/project]
   ↓ [Add notes: "Implemented all features"]
   ↓ [Click "Submit to Client"]
   ↓
3. Wallet Popup
   ↓ [Sign transaction: complete-milestone(123, 1)]
   ↓
4. Smart Contract
   ↓ [Mark milestone.complete = true]
   ↓ [Set milestone.completed-at = current block]
   ↓ [Emit "milestone-completed" event]
   ↓
5. Backend Indexer
   ↓ [Detect event]
   ↓ [Update milestone.status = 'submitted']
   ↓ [Send notification to client]
   ↓
6. Client's Notification
   ↓ "Milestone 1 submitted for review"
   ↓ [Click → Navigate to /projects/123]
   ↓
7. Client Reviews Deliverable
   ↓ [Check GitHub repo]
   ↓ [Test features]
   ↓ [Click "Approve & Release Payment"]
   ↓
8. Wallet Popup
   ↓ [Sign transaction: release-milestone-stx(123, 1)]
   ↓
9. Smart Contract
   ↓ [Transfer 400 STX to Alice]
   ↓ [Mark milestone.released = true]
   ↓ [Emit "milestone-released" event]
   ↓
10. Backend Indexer
    ↓ [Detect event]
    ↓ [Update milestone.status = 'approved']
    ↓ [Store tx_hash]
    ↓ [Send notification to Alice]
    ↓
11. Alice's Notification
    ↓ "Payment released! 400 STX received"
    ↓ [Balance updates in wallet]
```

---

## 🧩 Component Architecture

### **Component Hierarchy**
```
App.tsx (Root)
├── Navbar
│   ├── Logo
│   ├── Navigation Links
│   ├── NotificationBell (NEW)
│   ├── WalletButton
│   └── UserMenu
│
├── Routes
│   ├── Home (Landing Page)
│   │   ├── Hero Section
│   │   ├── Features Grid
│   │   └── CTA Section
│   │
│   ├── Browse Jobs (NEW) ← Freelancers
│   │   ├── SearchBar (NEW)
│   │   ├── FilterPanel (NEW)
│   │   └── JobCard[] (NEW)
│   │
│   ├── Job Details (NEW)
│   │   ├── JobHeader
│   │   ├── ClientInfo
│   │   ├── MilestoneList (NEW)
│   │   ├── SkillTags
│   │   └── SubmitProposalModal (NEW)
│   │
│   ├── My Projects (Existing)
│   │   ├── ProjectCard[]
│   │   └── CreateProjectModal
│   │
│   ├── Proposal Review (NEW) ← Clients
│   │   ├── ProposalCard[] (NEW)
│   │   └── ProposalDetails (NEW)
│   │
│   ├── My Proposals (NEW) ← Freelancers
│   │   ├── TabNavigation (NEW)
│   │   └── ProposalStatusCard[] (NEW)
│   │
│   ├── Browse Gigs (Existing)
│   │   └── GigCard[]
│   │
│   ├── Notifications (NEW)
│   │   └── NotificationCard[] (NEW)
│   │
│   ├── Leaderboard (Existing)
│   │   └── FreelancerRankCard[]
│   │
│   ├── Profile (Existing)
│   │   └── EditProfile
│   │
│   └── Admin Panel (Existing)
│       ├── AdminJobs
│       ├── AdminUsers
│       ├── AdminSupport
│       ├── AdminApprovals
│       ├── AdminChats
│       └── AdminNFT
│
├── ChatWidget (Global)
└── Modals
    ├── CreateProjectModal (Existing)
    ├── CreateGigModal (Existing)
    ├── SubmitProposalModal (NEW)
    ├── SubmitMilestoneModal (Existing)
    └── SubmitReviewModal (NEW - Future)
```

---

## 📊 State Management Strategy

### **Current Approach**: Local State in App.tsx
```tsx
// App.tsx manages most global state
const [projects, setProjects] = useState<Project[]>([]);
const [gigs, setGigs] = useState<Gig[]>([]);
const [wallet, setWallet] = useState<WalletState>({...});
```

### **Recommended**: Context API for Shared State
```tsx
// contexts/AppContext.tsx
interface AppContextType {
  // Wallet
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  
  // Projects
  projects: Project[];
  refreshProjects: () => Promise<void>;
  
  // Proposals
  proposals: Proposal[];
  refreshProposals: () => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
}

export const AppProvider: React.FC = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5001/notifications');
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev]);
    };
    return () => ws.close();
  }, []);

  const value = {
    projects,
    proposals,
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length,
    refreshProjects: async () => {
      const data = await fetchProjects();
      setProjects(data);
    },
    // ... other methods
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
```

---

## 🔧 Service Layer Updates

### **New Functions in StacksService.ts**
```typescript
// ============ PROPOSALS ============

export const fetchOpenProjects = async (filters?: ProjectFilters): Promise<Project[]> => {
  const params = new URLSearchParams({
    status: 'open',
    ...filters
  });
  const res = await fetch(`http://localhost:5001/api/projects?${params}`);
  return res.json();
};

export const submitProposal = async (proposal: ProposalData): Promise<boolean> => {
  const res = await fetch('http://localhost:5001/api/proposals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposal)
  });
  return res.ok;
};

export const fetchProposalsForProject = async (projectId: string): Promise<Proposal[]> => {
  const res = await fetch(`http://localhost:5001/api/projects/${projectId}/proposals`);
  return res.json();
};

export const fetchProposalsByFreelancer = async (address: string): Promise<Proposal[]> => {
  const res = await fetch(`http://localhost:5001/api/freelancers/${address}/proposals`);
  return res.json();
};

export const acceptProposal = async (proposalId: string): Promise<boolean> => {
  const res = await fetch(`http://localhost:5001/api/proposals/${proposalId}/accept`, {
    method: 'PUT'
  });
  return res.ok;
};

export const rejectProposal = async (proposalId: string): Promise<boolean> => {
  const res = await fetch(`http://localhost:5001/api/proposals/${proposalId}/reject`, {
    method: 'PUT'
  });
  return res.ok;
};

export const withdrawProposal = async (proposalId: string): Promise<boolean> => {
  const res = await fetch(`http://localhost:5001/api/proposals/${proposalId}`, {
    method: 'DELETE'
  });
  return res.ok;
};

// ============ NOTIFICATIONS ============

export const fetchNotifications = async (filter: 'all' | 'unread'): Promise<Notification[]> => {
  const res = await fetch(`http://localhost:5001/api/notifications?filter=${filter}`);
  return res.json();
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await fetch('http://localhost:5001/api/notifications/unread-count');
  const { count } = await res.json();
  return count;
};

export const markNotificationRead = async (id: string): Promise<boolean> => {
  const res = await fetch(`http://localhost:5001/api/notifications/${id}/read`, {
    method: 'PUT'
  });
  return res.ok;
};

export const markAllNotificationsRead = async (): Promise<boolean> => {
  const res = await fetch('http://localhost:5001/api/notifications/read-all', {
    method: 'PUT'
  });
  return res.ok;
};

// ============ BLOCKCHAIN VERIFICATION ============

export const verifyTransactionOnChain = async (txId: string): Promise<boolean> => {
  const res = await fetch(`http://localhost:5001/api/blockchain/verify-tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txId })
  });
  const { verified } = await res.json();
  return verified;
};
```

---

## 🚀 Implementation Roadmap

### **Sprint 1: Job Browsing & Proposal Submission** (Week 1)
**Goal**: Freelancers can discover and apply to jobs

**Tasks**:
- [ ] Create `BrowseJobs.tsx` page
- [ ] Create `JobCard.tsx` component
- [ ] Create `JobDetails.tsx` page
- [ ] Create `SubmitProposalModal.tsx`
- [ ] Create `SearchBar.tsx` with debounce
- [ ] Create `FilterPanel.tsx`
- [ ] Add service functions for proposals
- [ ] Update routing in `App.tsx`
- [ ] Add "Find Work" link to Navbar

**Verification**:
- Freelancer can browse open projects
- Search and filters work correctly
- Can view job details
- Can submit proposal
- Proposal appears in backend database

---

### **Sprint 2: Proposal Review & Hiring** (Week 2)
**Goal**: Clients can review proposals and hire freelancers

**Tasks**:
- [ ] Create `ProposalReview.tsx` page
- [ ] Create `ProposalCard.tsx` component
- [ ] Create `ProposalDetails.tsx` component
- [ ] Create `MyProposals.tsx` page
- [ ] Create `ProposalStatusCard.tsx`
- [ ] Implement accept/reject logic
- [ ] Update project status flow (open → pending → active)
- [ ] Add "Review Proposals" button to ProjectCard
- [ ] Add proposal count badge to ProjectCard

**Verification**:
- Client can view all proposals for their project
- Can compare proposals side-by-side
- Accepting proposal rejects others
- Project status updates correctly
- Freelancer sees accepted proposal in "My Proposals"

---

### **Sprint 3: Notifications & Real-Time Updates** (Week 3)
**Goal**: Users receive instant updates

**Tasks**:
- [ ] Create `NotificationCenter.tsx` page
- [ ] Create `NotificationBell.tsx` component
- [ ] Create `NotificationCard.tsx` component
- [ ] Set up WebSocket connection
- [ ] Add notification service functions
- [ ] Implement notification persistence
- [ ] Add notification triggers (proposal submitted, accepted, etc.)
- [ ] Add unread count badge to bell icon
- [ ] Add notification sound (optional)

**Verification**:
- Notification bell shows unread count
- Clicking bell opens dropdown with recent notifications
- WebSocket delivers real-time updates
- Notifications persist across page refresh
- Can mark as read/unread

---

### **Sprint 4: Polish & Optimization** (Week 4)
**Goal**: Production-ready UX

**Tasks**:
- [ ] Add loading skeletons for all pages
- [ ] Implement error boundaries
- [ ] Add empty states for all lists
- [ ] Optimize images (lazy loading)
- [ ] Add code splitting (React.lazy)
- [ ] Implement responsive design (mobile-first)
- [ ] Add keyboard shortcuts
- [ ] Add accessibility (ARIA labels)
- [ ] Add analytics tracking
- [ ] Performance audit (Lighthouse)

**Verification**:
- Lighthouse score > 90
- Works on mobile devices
- Graceful error handling
- Fast page transitions
- Accessible to screen readers

---

## 📱 Responsive Design Strategy

### **Breakpoints**
```css
/* Mobile First */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### **Mobile Optimizations**
1. **Navigation**: Hamburger menu on mobile
2. **Filters**: Collapsible filter drawer
3. **Cards**: Stack vertically on mobile
4. **Modals**: Full-screen on mobile
5. **Tables**: Card view instead of table

---

## 🎯 Key Architectural Decisions

### **Decision 1: Proposal System Off-Chain**
**Rationale**: Proposals are pre-contract state; storing on-chain is expensive and unnecessary.

**Trade-offs**:
- ✅ Free to submit proposals (no gas fees)
- ✅ Fast iteration (no blockchain confirmation)
- ⚠️ Requires backend trust (mitigated by open-source code)

---

### **Decision 2: Hybrid Read Strategy**
**Rationale**: Read from backend for speed, verify critical data on-chain.

**Implementation**:
```tsx
// Fast read from backend
const project = await fetchProject(id);

// Verify critical data on-chain
if (project.status === 'active') {
  const onChainVerified = await verifyProjectFunding(id);
  if (!onChainVerified) {
    showError('Data mismatch detected. Please refresh.');
  }
}
```

---

### **Decision 3: WebSocket for Notifications**
**Rationale**: Real-time updates improve UX without polling.

**Trade-offs**:
- ✅ Instant notifications
- ✅ Lower server load (vs polling)
- ⚠️ Requires persistent connection

---

**Last Updated**: 2026-02-14  
**Status**: Planning Phase  
**Priority**: Critical - Proposal system blocks core marketplace functionality
