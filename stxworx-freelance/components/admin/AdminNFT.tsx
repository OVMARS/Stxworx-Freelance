
import React, { useEffect, useState } from 'react';
import { Hexagon, Plus, Upload } from 'lucide-react';
import { fetchNFTDrops } from '../../services/StacksService';
import { NFTDrop } from '../../types';

const AdminNFT: React.FC = () => {
   const [drops, setDrops] = useState<NFTDrop[]>([]);

   useEffect(() => {
      fetchNFTDrops().then(setDrops);
   }, []);

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">NFT Release Control</h2>
               <p className="text-slate-400 text-sm">Mint badges and manage community drops.</p>
            </div>
            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2">
               <Plus className="w-4 h-4" /> New Drop
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mint Form */}
            <div className="lg:col-span-1 bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Hexagon className="w-5 h-5 text-orange-500" /> Quick Mint
               </h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Asset Name</label>
                     <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none" placeholder="e.g. Verified Pro Badge" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Supply Cap</label>
                     <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none" placeholder="1000" />
                  </div>
                  <div className="border border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-orange-500 hover:bg-slate-900/50 transition-all">
                     <Upload className="w-6 h-6 mb-2" />
                     <span className="text-xs">Upload Image (SVG/PNG)</span>
                  </div>
                  <button className="w-full py-3 bg-slate-800 hover:bg-white hover:text-black text-white font-bold uppercase rounded-lg transition-colors">
                     Deploy Contract
                  </button>
               </div>
            </div>

            {/* Active Drops List */}
            <div className="lg:col-span-2 space-y-4">
               <h3 className="text-lg font-bold text-white mb-2">Active Drops</h3>
               {drops.map((drop) => (
                  <div key={drop.id} className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4 flex items-center gap-4 hover:border-orange-500/30 transition-all group">
                     <div className="w-16 h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 group-hover:border-orange-500 transition-colors">
                        <img src={drop.image} alt={drop.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-white">{drop.name}</h4>
                        <div className="flex items-center gap-2 text-xs mt-1">
                           <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${drop.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-slate-700 text-slate-400'
                              }`}>
                              {drop.status}
                           </span>
                           <span className="text-slate-500">{drop.type}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-lg font-black text-white">{drop.minted} / {drop.supply}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Minted</div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};

export default AdminNFT;
