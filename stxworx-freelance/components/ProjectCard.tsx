
import React from 'react';
import { Project, Milestone, MilestoneStatus } from '../types';
import { Calendar, User, CheckCircle2, Clock, Lock, ArrowUpRight, AlertCircle, Shield, AlertTriangle, Star } from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';
import { useAppStore } from '../stores/useAppStore';
import type { BackendMilestoneSubmission } from '../lib/api';
import DisputeModal from './DisputeModal';
import ReviewModal from './ReviewModal';

interface ProjectCardProps {
  project: Project;
  role: 'client' | 'freelancer';
  onAction: (projectId: string, actionType: string, payload?: any) => void;
  isProcessing?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, role, onAction, isProcessing }) => {
  const [expanded, setExpanded] = React.useState(true);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const { milestoneSubmissions, fetchMilestoneSubmissions, projectDisputes, fetchProjectDisputes } = useAppStore();

  // Fetch milestone submissions for active projects + poll every 30s
  React.useEffect(() => {
    const numId = Number(project.id);
    if (!project.isFunded || !numId) return;

    // Initial fetch
    fetchMilestoneSubmissions(numId);
    fetchProjectDisputes(numId);

    // Poll every 30 seconds so the client sees updates when freelancer submits
    const interval = setInterval(() => {
      fetchMilestoneSubmissions(numId);
      fetchProjectDisputes(numId);
    }, 30_000);

    return () => clearInterval(interval);
  }, [project.id, project.isFunded]);

  const submissions = milestoneSubmissions[Number(project.id)] || [];
  const disputes = projectDisputes[Number(project.id)] || [];
  const isCompleted = project.status === 'completed';

  // Enrich milestone statuses from backend submissions
  const enrichedMilestones = React.useMemo(() => {
    return project.milestones.map((m) => {
      const msubs = submissions.filter(s => s.milestoneNum === m.id);
      if (msubs.length === 0) return m;
      // Find latest submission
      const latest = msubs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
      let status = m.status;
      if (latest.status === 'approved') status = 'approved';
      else if (latest.status === 'submitted') status = 'submitted';
      else if (latest.status === 'rejected') status = 'pending'; // rejected = can resubmit
      return { ...m, status, submissionLink: latest.deliverableUrl, submissionNote: latest.description };
    });
  }, [project.milestones, submissions]);

  const completedMilestones = enrichedMilestones.filter(m => m.status === 'approved').length;
  const progress = (completedMilestones / 4) * 100;

  const usdValue = tokenToUsd(project.totalBudget, project.tokenType);

  return (
    <div className="bg-[#0b0f19] rounded-xl shadow-lg border border-slate-800 overflow-hidden hover:border-orange-500/50 transition-all duration-300 relative group">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-orange-600/10 transition-all"></div>

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {project.category}
              </span>
              {!project.isFunded && (
                <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-red-950/30 text-red-500 border border-red-900/50">
                  Awaiting Escrow
                </span>
              )}
              {project.isFunded && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-orange-950/30 text-orange-500 border border-orange-900/50">
                  <Shield className="w-3 h-3" /> Escrow Locked
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight font-display">{project.title}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">
              {formatUSD(usdValue)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1 font-mono">
              Locked: {project.totalBudget.toLocaleString()} <span className="text-orange-500">{project.tokenType}</span>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-6 leading-relaxed border-l-2 border-slate-800 pl-4">
          {project.description}
        </p>

        <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-orange-500" />
            <span className="truncate max-w-[150px]">{role === 'client' ? `Freelancer: ${project.freelancerAddress}` : `Client: ${project.clientAddress}`}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-orange-500" />
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* 4-Stage Visualizer */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-2">
            <span>Escrow Progress</span>
            <span className="text-orange-500">{Math.round(progress)}% Released</span>
          </div>
          <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
            {[0, 1, 2, 3].map((idx) => {
              const ms = enrichedMilestones[idx];
              const isRefunded = ms?.status === 'refunded';
              const isApproved = ms?.status === 'approved';
              return (
                <div key={idx} className={`rounded-sm transition-all duration-500 ${isApproved ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' :
                    isRefunded ? 'bg-red-500' :
                      'bg-slate-800'
                  }`} />
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-[#05080f] border-t border-slate-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Hide 4-Stage Escrow' : 'View Escrow Details'}
            <ArrowUpRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-45' : ''}`} />
          </button>

          {/* Review button — available on completed projects */}
          {isCompleted && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-orange-950/40 text-orange-400 text-xs font-bold uppercase tracking-wider rounded hover:bg-orange-600 hover:text-white border border-orange-900/30 transition-all flex items-center gap-1"
            >
              <Star className="w-3 h-3" /> Leave Review
            </button>
          )}

        </div>

        {expanded && (
          <div className="mt-5 space-y-3 relative">
            {/* Connector Line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-800 -z-10"></div>

            {enrichedMilestones.map((milestone, index) => (
              <MilestoneItem
                key={milestone.id}
                index={index}
                milestone={milestone}
                project={project}
                role={role}
                onAction={onAction}
                isProcessing={isProcessing}
                submissions={submissions.filter(s => s.milestoneNum === index + 1)}
                disputes={disputes.filter(d => d.milestoneNum === index + 1)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          projectId={Number(project.id)}
          projectTitle={project.title}
          revieweeId={role === 'client' ? (project.freelancerId || 0) : (project.clientId || 0)}
          revieweeName={role === 'client' ? project.freelancerAddress : project.clientAddress}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
};

// Sub-component for individual milestones
const MilestoneItem: React.FC<{
  index: number;
  milestone: Milestone;
  project: Project;
  role: 'client' | 'freelancer';
  onAction: (projectId: string, actionType: string, payload?: any) => void;
  isProcessing?: boolean;
  submissions: BackendMilestoneSubmission[];
  disputes: import('../lib/api').BackendDispute[];
}> = ({ index, milestone, project, role, onAction, isProcessing, submissions, disputes }) => {
  const [submissionLink, setSubmissionLink] = React.useState('');
  const [txPending, setTxPending] = React.useState(false);
  const [showMilestoneDispute, setShowMilestoneDispute] = React.useState(false);

  // Get the latest submission for this milestone
  const latestSubmission = submissions.length > 0
    ? submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0]
    : null;

  // Check if THIS specific milestone has an open dispute
  const hasDisputeOnThisMilestone = disputes.some(d => d.status === 'open');

  // Check if the milestone was already completed on-chain (any previous submission exists)
  const wasAlreadyCompletedOnChain = submissions.length > 0;

  const milestoneNum = milestone.id; // 1-based, matches contract
  const onChainProjectId = project.onChainId; // null until escrow funded

  // Status convenience flags
  const isApproved = milestone.status === 'approved';
  const isRefunded = milestone.status === 'refunded';
  const isSubmitted = milestone.status === 'submitted';
  const isPending = milestone.status === 'pending';
  const isDisputed = hasDisputeOnThisMilestone;
  const isFunded = project.isFunded;

  // Can file dispute: milestone is active, funded, and no existing open dispute
  const canFileDispute = isFunded && !isApproved && !isRefunded && !isDisputed && (isPending || isSubmitted);

  // ── ON-CHAIN: Freelancer Complete Milestone ──
  const handleCompleteMilestone = async () => {
    if (!submissionLink) return;
    if (!onChainProjectId) {
      alert('Escrow not yet deployed on-chain. Cannot submit milestone.');
      return;
    }
    if (isDisputed) {
      alert('This milestone has an active dispute. You cannot submit work until it is resolved.');
      return;
    }
    setTxPending(true);

    // Helper: save the submission to the backend (called after contract TX or skip)
    const normalizedLink = submissionLink.match(/^https?:\/\//) ? submissionLink : `https://${submissionLink}`;
    const saveToBackend = (txId: string) => {
      onAction(project.id, 'submit_milestone', {
        milestoneId: milestone.id,
        link: normalizedLink,
        completionTxId: txId,
      });
    };

    try {
      if (wasAlreadyCompletedOnChain) {
        // Milestone already marked complete on-chain (e.g. after a rejection, or previous
        // contract sign that didn't persist to backend). Skip contract call.
        const prevTxId = submissions.find(s => s.completionTxId)?.completionTxId || 'resubmission';
        saveToBackend(prevTxId);
        setTxPending(false);
      } else {
        // First-time completion: call the smart contract
        const { completeMilestoneContractCall } = await import('../lib/contracts');
        await completeMilestoneContractCall(
          onChainProjectId,
          milestoneNum,
          (txData) => {
            console.log('complete-milestone TX sent:', txData.txId);
            saveToBackend(txData.txId);
            setTxPending(false);
          },
          () => {
            console.log('complete-milestone TX cancelled');
            setTxPending(false);
          }
        );
      }
    } catch (err: any) {
      console.error('complete-milestone failed:', err);
      // If the contract rejects with ERR-ALREADY-COMPLETE (u116), the milestone
      // was already completed on-chain in a previous session but the backend save
      // failed. Recover gracefully by saving to backend now.
      const errMsg = String(err?.message || '');
      if (errMsg.includes('u116') || errMsg.includes('ALREADY-COMPLETE') || errMsg.includes('already complete')) {
        console.warn('Milestone already complete on-chain — saving to backend as recovery.');
        saveToBackend('recovery-already-complete');
        setTxPending(false);
      } else {
        alert(`Milestone submission failed: ${err.message || 'Transaction was rejected by the contract. Please try again.'}`);
        setTxPending(false);
      }
    }
  };

  // ── ON-CHAIN: Client Release Milestone Funds ──
  const handleReleaseMilestone = async () => {
    if (!latestSubmission) return;
    if (!onChainProjectId) {
      alert('Escrow not yet deployed on-chain. Cannot release funds.');
      return;
    }
    setTxPending(true);
    try {
      const { releaseMilestoneContractCall } = await import('../lib/contracts');
      await releaseMilestoneContractCall(
        onChainProjectId,
        milestoneNum,
        project.tokenType as 'STX' | 'sBTC',
        (txData) => {
          console.log('release-milestone TX sent:', txData.txId);
          onAction(project.id, 'approve_milestone', {
            submissionId: latestSubmission.id,
            milestoneId: milestone.id,
            releaseTxId: txData.txId,
          });
          setTxPending(false);
        },
        () => {
          console.log('release-milestone TX cancelled');
          setTxPending(false);
        }
      );
    } catch (err: any) {
      console.error('release-milestone failed:', err);
      alert(`Release failed: ${err.message || 'Transaction was rejected. Please try again.'}`);
      setTxPending(false);
    }
  };

  const getStatusColor = () => {
    if (isApproved) return 'bg-green-500 border-green-500 text-white';
    if (isRefunded) return 'bg-red-500 border-red-500 text-white';
    if (isDisputed) return 'bg-red-500 border-red-500 text-white';
    if (isSubmitted) return 'bg-blue-600 border-blue-600 text-white';
    if (isPending && isFunded) return 'bg-[#0b0f19] border-orange-500/50 text-orange-500';
    return 'bg-[#0b0f19] border-slate-700 text-slate-600';
  };

  return (
    <div className={`p-4 rounded-lg border transition-all relative ${
      isApproved ? 'bg-green-950/10 border-green-500/30' :
      isRefunded ? 'bg-[#0b0f19] border-red-500/20' :
      isDisputed ? 'bg-red-950/10 border-red-500/30' :
      isPending && isFunded ? 'bg-[#0b0f19] border-slate-700' :
      'bg-[#0b0f19] border-slate-800 opacity-80'
    }`}>
      <div className="flex items-start gap-4">
        {/* Status Badge — Checkmark for completed milestones */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 z-10 ${getStatusColor()}`}>
          {isApproved ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <span className="text-xs font-bold font-mono">M{index + 1}</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wide">
                {milestone.title}
              </h4>
              {/* ✅ Prominent checkmark badge for completed milestones */}
              {isApproved && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Completed</span>
                </span>
              )}
            </div>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
              isApproved ? 'text-green-500 bg-green-500/10' :
              isRefunded ? 'text-red-500 bg-red-500/10' :
              isDisputed ? 'text-red-400 bg-red-500/10' :
              isSubmitted ? 'text-blue-400 bg-blue-500/10' :
              isPending ? 'text-orange-400 bg-orange-500/10' :
              'text-slate-500'
            }`}>
              {isDisputed ? 'disputed' : milestone.status}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-500 mb-3">
            {isRefunded ? (
              <span>Refunded to Client: <span className="text-red-400 font-bold">{milestone.amount.toFixed(4)} {project.tokenType}</span></span>
            ) : (
              <span>Release: <span className="text-slate-300 font-bold">{milestone.amount.toFixed(4)} {project.tokenType}</span></span>
            )}

            {isApproved && (
              <span className="text-green-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Released on-chain
              </span>
            )}
          </div>

          {/* ══════════════ ON-CHAIN ACTION BUTTONS ══════════════ */}

          {/* ── FREELANCER: Dispute active warning ── */}
          {role === 'freelancer' && isPending && isFunded && isDisputed && (
            <div className="mt-2 text-[10px] text-red-500 font-bold font-mono border-t border-red-900/30 pt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Dispute active on this milestone — submission blocked until resolved.
            </div>
          )}

          {/* ── FREELANCER: Complete Milestone + File Dispute (pending + funded) ── */}
          {role === 'freelancer' && isPending && isFunded && !isDisputed && (
            <div className="mt-3">
              {wasAlreadyCompletedOnChain && (
                <p className="text-[10px] text-yellow-500 font-mono mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Previous submission was rejected — resubmit your updated deliverable below.
                </p>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Proof of Work Link (Github/Figma)"
                  className="flex-1 px-3 py-2 text-xs bg-[#05080f] border border-slate-700 text-white rounded focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-slate-600 font-mono"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {/* 🔗 ON-CHAIN: Complete Milestone */}
                <button
                  onClick={handleCompleteMilestone}
                  disabled={!submissionLink || isProcessing || txPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Shield className="w-3 h-3" />
                  {txPending ? 'Signing TX...' : wasAlreadyCompletedOnChain ? 'Resubmit Work' : 'Complete Milestone'}
                </button>
                {/* 🔗 ON-CHAIN: File Dispute */}
                {canFileDispute && (
                  <button
                    onClick={() => setShowMilestoneDispute(true)}
                    disabled={txPending}
                    className="px-3 py-2 bg-red-950/40 text-red-400 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-600 hover:text-white border border-red-900/30 transition-all flex items-center gap-1.5"
                  >
                    <Shield className="w-3 h-3" /> File Dispute
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── FREELANCER: Submitted — waiting for client, can dispute ── */}
          {role === 'freelancer' && isSubmitted && !isDisputed && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-blue-400 font-bold font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" /> Awaiting client review...
              </span>
              {canFileDispute && (
                <button
                  onClick={() => setShowMilestoneDispute(true)}
                  className="px-3 py-2 bg-red-950/40 text-red-400 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-600 hover:text-white border border-red-900/30 transition-all flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3" /> File Dispute
                </button>
              )}
            </div>
          )}

          {/* ── CLIENT: Release + Reject + File Dispute (submitted) ── */}
          {role === 'client' && isSubmitted && latestSubmission && (
            <div className="mt-3 bg-[#05080f] p-3 rounded border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2 font-mono">
                <span className="font-bold text-slate-300">Deliverable:</span>
                <a href={latestSubmission.deliverableUrl} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline ml-2 break-all">
                  {latestSubmission.deliverableUrl}
                </a>
              </p>
              {latestSubmission.description && (
                <p className="text-xs text-slate-500 mb-3 font-mono">
                  <span className="font-bold text-slate-400">Note:</span> {latestSubmission.description}
                </p>
              )}
              <div className="flex gap-2">
                {/* 🔗 ON-CHAIN: Release Funds */}
                <button
                  onClick={handleReleaseMilestone}
                  disabled={isProcessing || txPending}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Shield className="w-3 h-3" />
                  {txPending ? 'Signing TX...' : isProcessing ? 'Verifying...' : 'Release'}
                </button>
                {/* OFF-CHAIN: Reject */}
                <button
                  onClick={() => onAction(project.id, 'reject_milestone', { submissionId: latestSubmission.id, milestoneId: milestone.id })}
                  disabled={isProcessing || txPending}
                  className="px-3 py-2 bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider rounded hover:bg-slate-700 disabled:opacity-50 transition-all"
                >
                  Reject
                </button>
                {/* 🔗 ON-CHAIN: File Dispute */}
                {canFileDispute && (
                  <button
                    onClick={() => setShowMilestoneDispute(true)}
                    disabled={txPending}
                    className="px-3 py-2 bg-red-950/40 text-red-400 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-600 hover:text-white border border-red-900/30 transition-all flex items-center gap-1.5"
                  >
                    <Shield className="w-3 h-3" /> File Dispute
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── CLIENT: Pending + funded — awaiting freelancer, can dispute ── */}
          {role === 'client' && isPending && isFunded && !isDisputed && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-orange-400 font-bold font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" /> Awaiting freelancer submission...
              </span>
              {canFileDispute && (
                <button
                  onClick={() => setShowMilestoneDispute(true)}
                  className="px-3 py-2 bg-red-950/40 text-red-400 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-600 hover:text-white border border-red-900/30 transition-all flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3" /> File Dispute
                </button>
              )}
            </div>
          )}

          {/* ── Dispute active banner (non-pending states) ── */}
          {isDisputed && !isPending && (
            <div className="mt-2 text-[10px] text-red-400 font-bold font-mono border-t border-red-900/30 pt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Dispute active — awaiting admin resolution.
            </div>
          )}

          {/* ── CLIENT: Dispute on pending milestone ── */}
          {role === 'client' && isPending && isFunded && isDisputed && (
            <div className="mt-2 text-[10px] text-red-400 font-bold font-mono border-t border-red-900/30 pt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Dispute filed — awaiting admin resolution.
            </div>
          )}

          {/* ✅ On-chain finalized banner for completed milestones */}
          {isApproved && (
            <div className="mt-2 text-[10px] text-green-400 font-bold font-mono border-t border-green-900/30 pt-2 flex items-center gap-1">
              <Shield className="w-3 h-3" /> On-chain transaction finalized — funds released immutably.
            </div>
          )}

          {/* ── Refunded banner ── */}
          {isRefunded && (
            <div className="mt-2 text-[10px] text-red-500 font-bold font-mono border-t border-red-900/30 pt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Admin Intervention: Funds refunded to client.
            </div>
          )}

          {/* ── Not funded warning ── */}
          {!isFunded && milestone.status !== 'locked' && (
            <p className="text-[10px] text-red-500 font-mono mt-1">* Waiting for escrow funding</p>
          )}
        </div>
      </div>

      {/* Per-milestone Dispute Modal (on-chain) */}
      {showMilestoneDispute && (
        <DisputeModal
          projectId={Number(project.id)}
          projectTitle={project.title}
          milestoneCount={project.milestones.length}
          onChainId={project.onChainId}
          fixedMilestoneNum={milestoneNum}
          onClose={() => setShowMilestoneDispute(false)}
        />
      )}
    </div>
  );
};

export default ProjectCard;
