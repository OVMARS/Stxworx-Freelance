
import React, { useEffect, useState } from 'react';
import { AdminUser } from '../../types';
import { MoreHorizontal, Shield, Ban, CheckCircle } from 'lucide-react';
import { fetchAdminUsers } from '../../services/StacksService';

const AdminUsers: React.FC = () => {
   const [users, setUsers] = useState<AdminUser[]>([]);

   useEffect(() => {
      fetchAdminUsers().then(setUsers);
   }, []);

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">User Control</h2>
               <p className="text-slate-400 text-sm">Manage client and freelancer accounts.</p>
            </div>
            <div className="flex gap-2">
               <input
                  type="text"
                  placeholder="Search users..."
                  className="bg-[#0b0f19] border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
               />
               <button className="px-4 py-2 bg-slate-800 text-white text-sm font-bold uppercase rounded-lg hover:bg-slate-700">Filter</button>
            </div>
         </div>

         <div className="bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 bg-slate-900/50">
                     <th className="px-6 py-4">User</th>
                     <th className="px-6 py-4">Role</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Earnings</th>
                     <th className="px-6 py-4">Reports</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                  {users.map((user) => (
                     <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                              <span className="font-bold text-white">{user.name}</span>
                              <span className="text-xs text-slate-500 font-mono">{user.address}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'Freelancer' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                              }`}>
                              {user.role}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`flex items-center gap-1.5 text-xs font-bold ${user.status === 'Active' ? 'text-green-500' :
                              user.status === 'Banned' ? 'text-red-500' : 'text-amber-500'
                              }`}>
                              {user.status === 'Active' && <CheckCircle className="w-3 h-3" />}
                              {user.status === 'Banned' && <Ban className="w-3 h-3" />}
                              {user.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-300">
                           ${user.earnings.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                           {user.reports > 0 ? (
                              <span className="text-red-500 font-bold flex items-center gap-1">
                                 {user.reports} Reports
                              </span>
                           ) : (
                              <span className="text-slate-600">-</span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors">
                              <MoreHorizontal className="w-5 h-5" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
};

export default AdminUsers;
