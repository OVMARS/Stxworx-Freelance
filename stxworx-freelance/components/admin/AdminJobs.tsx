
import React, { useEffect, useState } from 'react';
import { Project } from '../../types';
import { Clock, CheckCircle, AlertTriangle, Play, Shield, ChevronDown, ChevronUp, RefreshCw, AlertOctagon } from 'lucide-react';
import { fetchProjects, adminForceReleaseMilestone, adminRefundMilestone } from '../../services/StacksService';

const AdminJobs: React.FC = () => {
   const [projects, setProjects] = useState<Project[]>([]);
   const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
   const [processingId, setProcessingId] = useState<string | null>(null); // For loading state of actions

   useEffect(() => {
      fetchProjects().then(setProjects);
   }, []);

   const handleRefresh = async () => {
      const updated = await fetchProjects();
      setProjects(updated);
   };

   const handleAdminAction = async (projectId: string, milestoneId: number, action: 'release' | 'refund') => {
      setProcessingId(`${projectId}-${milestoneId}`);
      try {
         if (action === 'release') {
            await adminForceReleaseMilestone(projectId, milestoneId);
         } else {
            await adminRefundMilestone(projectId, milestoneId);
         }
         await handleRefresh();
      } catch (e) {
         console.error(e);
      } finally {
         setProcessingId(null);
      }
   };

   const getStatusBadge = (project: Project) => {
      if (project.status === 'disputed') return <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Disputed</span>;
      if (project.status === 'completed') return <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      if (project.isFunded) return <span className="text-blue-500 bg-blue-500/10 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Play className="w-3 h-3" /> Active</span>;
      return <span className="text-slate-500 bg-slate-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">Jobs Queue</h2>
               <p className="text-slate-400 text-sm">Monitor active escrow contracts and disputes.</p>
            </div>
            <button onClick={handleRefresh} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
               <RefreshCw className="w-4 h-4" />
            </button>
         </div>

         <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/50">
                     <th className="px-6 py-4">Project ID</th>
                     <th className="px-6 py-4">Title</th>
                     <th className="px-6 py-4">Parties</th>
                     <th className="px-6 py-4">Escrow Value</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {projects.map((project) => (
                     <React.Fragment key={project.id}>
                        <tr className={`hover:bg-slate-800/30 transition-colors ${expandedProjectId === project.id ? 'bg-slate-800/20' : ''}`}>
                           <td className="px-6 py-4 text-xs font-mono text-slate-500">#{project.id}</td>
                           <td className="px-6 py-4">
                              <span className="font-bold text-white block">{project.title}</span>
                              <span className="text-xs text-slate-500">{project.category}</span>
                           </td>
                           <td className="px-6 py-4 text-xs text-slate-400">
                              <div className="flex flex-col gap-1">
                                 <span title={project.clientAddress}>C: {project.clientAddress.slice(0, 6)}...</span>
                                 <span title={project.freelancerAddress}>F: {project.freelancerAddress.slice(0, 6)}...</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2 font-mono text-white">
                                 <Shield className="w-3 h-3 text-orange-500" />
                                 {project.totalBudget} {project.tokenType}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              {getStatusBadge(project)}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button
                                 onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
                                 className="text-slate-400 hover:text-white flex items-center gap-1 ml-auto text-xs font-bold uppercase tracking-wider"
                              >
                                 {expandedProjectId === project.id ? 'Hide Details' : 'Manage'}
                                 {expandedProjectId === project.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                           </td>
                        </tr>

                        {/* Expanded Milestone View for Admin Intervention */}
                        {expandedProjectId === project.id && (
                           <tr>
                              <td colSpan={6} className="bg-slate-900/50 p-6 border-b border-slate-800 shadow-inner">
                                 <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <AlertOctagon className="w-4 h-4 text-red-500" /> Admin Intervention Zone
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {project.milestones.map((milestone) => (
                                       <div key={milestone.id} className="bg-[#0b0f19] border border-slate-800 rounded-lg p-4 relative">
                                          <div className="flex justify-between items-start mb-2">
                                             <span className="text-xs font-bold text-white">Milestone {milestone.id}</span>
                                             <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${milestone.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                   milestone.status === 'refunded' ? 'bg-red-500/10 text-red-500' :
                                                      'bg-slate-800 text-slate-400'
                                                }`}>
                                                {milestone.status}
                                             </span>
                                          </div>
                                          <p className="text-xs text-slate-500 mb-4">{milestone.title}</p>

                                          {/* Action Buttons */}
                                          {(milestone.status === 'pending' || milestone.status === 'submitted') && (
                                             <div className="grid grid-cols-2 gap-2 mt-auto">
                                                <button
                                                   onClick={() => handleAdminAction(project.id, milestone.id, 'release')}
                                                   disabled={!!processingId}
                                                   className="px-2 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded text-[10px] font-bold uppercase transition-colors"
                                                >
                                                   {processingId === `${project.id}-${milestone.id}` ? '...' : 'Force Release'}
                                                </button>
                                                <button
                                                   onClick={() => handleAdminAction(project.id, milestone.id, 'refund')}
                                                   disabled={!!processingId}
                                                   className="px-2 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded text-[10px] font-bold uppercase transition-colors"
                                                >
                                                   {processingId === `${project.id}-${milestone.id}` ? '...' : 'Refund Client'}
                                                </button>
                                             </div>
                                          )}
                                          {milestone.status === 'locked' && (
                                             <div className="text-center py-2 text-[10px] text-slate-600 italic">
                                                Locked in escrow
                                             </div>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              </td>
                           </tr>
                        )}
                     </React.Fragment>
                  ))}

                  {projects.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No active jobs in queue.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export default AdminJobs;
