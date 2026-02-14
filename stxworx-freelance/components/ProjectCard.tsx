
import React from 'react';
import { Project, Milestone, MilestoneStatus } from '../types';
import { Calendar, User, CheckCircle2, Clock, Lock, ArrowUpRight, AlertCircle, Shield } from 'lucide-react';
import { formatUSD, tokenToUsd } from '../services/StacksService';

interface ProjectCardProps {
  project: Project;
  role: 'client' | 'freelancer';
  onAction: (projectId: string, actionType: string, payload?: any) => void;
  isProcessing?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, role, onAction, isProcessing }) => {
  const [expanded, setExpanded] = React.useState(true); // Default expanded to show the 4 stages

  const completedMilestones = project.milestones.filter(m => m.status === 'approved').length;
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
              const ms = project.milestones[idx];
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

          {role === 'client' && !project.isFunded && (
            <button
              onClick={() => onAction(project.id, 'fund')}
              disabled={isProcessing}
              className="px-5 py-2 bg-orange-600 text-white text-xs font-black uppercase tracking-wider rounded hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)]"
            >
              {isProcessing ? 'Confirming...' : 'Lock Funds (Escrow)'}
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-5 space-y-3 relative">
            {/* Connector Line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-800 -z-10"></div>

            {project.milestones.map((milestone, index) => (
              <MilestoneItem
                key={milestone.id}
                index={index}
                milestone={milestone}
                project={project}
                role={role}
                onAction={onAction}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )}
      </div>
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
}> = ({ index, milestone, project, role, onAction, isProcessing }) => {
  const [submissionLink, setSubmissionLink] = React.useState('');

  const handleFreelancerSubmit = () => {
    if (!submissionLink) return;
    onAction(project.id, 'submit_milestone', { milestoneId: milestone.id, link: submissionLink });
  };

  const getStatusColor = () => {
    if (milestone.status === 'approved') return 'bg-orange-500 border-orange-500 text-white';
    if (milestone.status === 'refunded') return 'bg-red-500 border-red-500 text-white';
    if (milestone.status === 'submitted') return 'bg-blue-600 border-blue-600 text-white';
    if (milestone.status === 'pending') return 'bg-[#0b0f19] border-orange-500/50 text-orange-500';
    return 'bg-[#0b0f19] border-slate-700 text-slate-600';
  };

  return (
    <div className={`p-4 rounded border transition-colors relative ${milestone.status === 'approved' ? 'bg-[#0b0f19] border-orange-500/20' :
        milestone.status === 'refunded' ? 'bg-[#0b0f19] border-red-500/20' :
          milestone.status === 'pending' && project.isFunded ? 'bg-[#0b0f19] border-slate-700' :
            'bg-[#0b0f19] border-slate-800 opacity-80'
      }`}>
      <div className="flex items-start gap-4">
        {/* Status Badge Indicator */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 z-10 ${getStatusColor()}`}>
          <span className="text-xs font-bold font-mono">M{index + 1}</span>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wide">
              {milestone.title}
            </h4>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${milestone.status === 'approved' ? 'text-green-500 bg-green-500/10' :
                milestone.status === 'refunded' ? 'text-red-500 bg-red-500/10' :
                  milestone.status === 'submitted' ? 'text-blue-400 bg-blue-500/10' :
                    milestone.status === 'pending' ? 'text-orange-400 bg-orange-500/10' :
                      'text-slate-500'
              }`}>
              {milestone.status}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-500 mb-3">
            {milestone.status === 'refunded' ? (
              <span>Refunded to Client: <span className="text-red-400 font-bold strike-through">{milestone.amount.toFixed(4)} {project.tokenType}</span></span>
            ) : (
              <span>Release: <span className="text-slate-300 font-bold">{milestone.amount.toFixed(4)} {project.tokenType}</span></span>
            )}

            {milestone.status === 'approved' && (
              <span className="text-orange-500/80">Fee: {(milestone.amount * 0.10).toFixed(4)} {project.tokenType}</span>
            )}
          </div>

          {/* Action Area based on Role and Status */}
          {role === 'freelancer' && milestone.status === 'pending' && project.isFunded && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Proof of Work Link (Github/Figma)"
                className="flex-1 px-3 py-2 text-xs bg-[#05080f] border border-slate-700 text-white rounded focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-slate-600 font-mono"
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
              />
              <button
                onClick={handleFreelancerSubmit}
                disabled={!submissionLink || isProcessing}
                className="px-3 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-blue-500 disabled:opacity-50"
              >
                Submit Work
              </button>
            </div>
          )}

          {role === 'client' && milestone.status === 'submitted' && (
            <div className="mt-3 bg-[#05080f] p-3 rounded border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3 font-mono">
                <span className="font-bold text-slate-300">Deliverable:</span>
                <a href="#" className="text-orange-500 hover:underline ml-2 break-all">{milestone.submissionLink || "View Work"}</a>
              </p>
              <button
                onClick={() => onAction(project.id, 'approve_milestone', { milestoneId: milestone.id })}
                disabled={isProcessing}
                className="w-full px-3 py-2 bg-green-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Verifying on Chain...' : 'Approve & Release Funds'}
              </button>
            </div>
          )}

          {milestone.status === 'refunded' && (
            <div className="mt-2 text-[10px] text-red-500 font-bold font-mono border-t border-red-900/30 pt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Admin Intervention: Funds refunded to client.
            </div>
          )}

          {!project.isFunded && milestone.status !== 'locked' && (
            <p className="text-[10px] text-red-500 font-mono mt-1">* Waiting for escrow funding</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
