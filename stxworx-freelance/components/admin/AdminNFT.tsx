
import React, { useEffect, useState } from 'react';
import { Hexagon, Plus, CheckCircle, RefreshCw, Award, Shield, ArrowUp, XCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import {
   adminMintGradeContractCall,
   adminUpgradeGradeContractCall,
   adminRevokeGradeContractCall,
   mintVerifiedContractCall,
   revokeVerifiedContractCall,
} from '../../lib/contracts';
import { GRADE_BRONZE, GRADE_SILVER, GRADE_GOLD, GRADE_PLATINUM, BADGE_IPFS_CIDS, VERIFIED_IPFS_CID } from '../../lib/constants';

type MintAction = 'mint-grade' | 'upgrade-grade' | 'revoke-grade' | 'mint-verified' | 'revoke-verified';

const GRADE_OPTIONS = [
   { value: GRADE_BRONZE, label: 'Bronze', color: 'text-amber-600' },
   { value: GRADE_SILVER, label: 'Silver', color: 'text-slate-300' },
   { value: GRADE_GOLD, label: 'Gold', color: 'text-yellow-400' },
   { value: GRADE_PLATINUM, label: 'Platinum', color: 'text-cyan-300' },
];

const gradeLabel = (grade: number) => GRADE_OPTIONS.find((g) => g.value === grade)?.label || `Grade ${grade}`;

const AdminNFT: React.FC = () => {
   const { adminNFTs, fetchAdminNFTs, adminCreateNFT, adminConfirmMint } = useAppStore();

   // On-chain mint form state
   const [mintAction, setMintAction] = useState<MintAction>('mint-grade');
   const [recipientAddress, setRecipientAddress] = useState('');
   const [grade, setGrade] = useState(GRADE_BRONZE);
   const [ipfsCid, setIpfsCid] = useState('');
   const [minting, setMinting] = useState(false);
   const [mintStatus, setMintStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

   // Legacy form state (backend NFT record)
   const [recipientId, setRecipientId] = useState('');
   const [nftType, setNftType] = useState('badge');
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');
   const [metadataUrl, setMetadataUrl] = useState('');
   const [creating, setCreating] = useState(false);
   const [confirmingId, setConfirmingId] = useState<number | null>(null);
   const [mintTxId, setMintTxId] = useState('');

   useEffect(() => {
      fetchAdminNFTs();
   }, []);

   // Auto-fill IPFS CID based on action & grade
   useEffect(() => {
      if (mintAction === 'mint-grade' || mintAction === 'upgrade-grade') {
         setIpfsCid(BADGE_IPFS_CIDS[grade] || '');
      } else if (mintAction === 'mint-verified') {
         setIpfsCid(VERIFIED_IPFS_CID);
      } else {
         setIpfsCid('');
      }
   }, [mintAction, grade]);

   // Does this action need a grade selector?
   const needsGrade = mintAction === 'mint-grade' || mintAction === 'upgrade-grade';
   // Does this action need an IPFS CID?
   const needsIpfsCid = mintAction === 'mint-grade' || mintAction === 'upgrade-grade' || mintAction === 'mint-verified';
   // Is this a revoke action?
   const isRevoke = mintAction === 'revoke-grade' || mintAction === 'revoke-verified';

   const handleOnChainMint = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!recipientAddress.trim()) return;
      if (needsIpfsCid && !ipfsCid.trim()) return;

      setMinting(true);
      setMintStatus(null);

      const onFinish = async (txData: any) => {
         const txId = txData?.txId || txData?.stacksTransaction?.txid?.() || '';
         setMintStatus({ type: 'success', message: `Transaction submitted: ${txId}` });
         setMinting(false);

         // Auto-save to backend as an NFT record
         try {
            const actionLabel = mintAction.replace(/-/g, ' ');
            await adminCreateNFT({
               recipientId: 0,
               nftType: mintAction.includes('verified') ? 'verification' : 'badge',
               name: `${actionLabel} – ${gradeLabel(grade)}`,
               description: `On-chain ${actionLabel} for ${recipientAddress}`,
               metadataUrl: ipfsCid ? `ipfs://${ipfsCid}` : undefined,
            });
            // Confirm the mint with the TX ID
            const nfts = useAppStore.getState().adminNFTs;
            if (nfts.length > 0 && txId) {
               await adminConfirmMint(nfts[0].id, txId);
            }
         } catch {
            // Backend save is best-effort
         }

         // Reset form
         setRecipientAddress('');
         setIpfsCid('');
      };

      const onCancel = () => {
         setMintStatus({ type: 'error', message: 'Transaction cancelled by user.' });
         setMinting(false);
      };

      try {
         switch (mintAction) {
            case 'mint-grade':
               await adminMintGradeContractCall(recipientAddress, grade, ipfsCid, onFinish, onCancel);
               break;
            case 'upgrade-grade':
               await adminUpgradeGradeContractCall(recipientAddress, grade, ipfsCid, onFinish, onCancel);
               break;
            case 'revoke-grade':
               await adminRevokeGradeContractCall(recipientAddress, onFinish, onCancel);
               break;
            case 'mint-verified':
               await mintVerifiedContractCall(recipientAddress, ipfsCid, onFinish, onCancel);
               break;
            case 'revoke-verified':
               await revokeVerifiedContractCall(recipientAddress, onFinish, onCancel);
               break;
         }
      } catch (err: any) {
         setMintStatus({ type: 'error', message: err.message || 'Contract call failed.' });
         setMinting(false);
      }
   };

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setCreating(true);
      try {
         await adminCreateNFT({
            recipientId: Number(recipientId),
            nftType,
            name,
            description: description || undefined,
            metadataUrl: metadataUrl || undefined,
         });
         setRecipientId('');
         setName('');
         setDescription('');
         setMetadataUrl('');
      } catch (e) {
         console.error('Failed to create NFT:', e);
      } finally {
         setCreating(false);
      }
   };

   const handleConfirmMint = async (nftId: number) => {
      if (!mintTxId.trim()) return;
      setConfirmingId(nftId);
      try {
         await adminConfirmMint(nftId, mintTxId.trim());
         setMintTxId('');
         setConfirmingId(null);
      } catch (e) {
         console.error('Failed to confirm mint:', e);
         setConfirmingId(null);
      }
   };

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">NFT Release Control</h2>
               <p className="text-slate-400 text-sm">Mint reputation badges and manage NFT records on-chain.</p>
            </div>
            <button onClick={() => fetchAdminNFTs()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
               <RefreshCw className="w-4 h-4" />
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── On-Chain Mint Form ── */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Hexagon className="w-5 h-5 text-orange-500" /> On-Chain NFT Mint
                  </h3>
                  <form onSubmit={handleOnChainMint} className="space-y-4">
                     {/* Action selector */}
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Action</label>
                        <select
                           value={mintAction}
                           onChange={(e) => setMintAction(e.target.value as MintAction)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                        >
                           <option value="mint-grade">Mint Grade Badge</option>
                           <option value="upgrade-grade">Upgrade Grade Badge</option>
                           <option value="revoke-grade">Revoke Grade Badge</option>
                           <option value="mint-verified">Mint Verified Badge</option>
                           <option value="revoke-verified">Revoke Verified Badge</option>
                        </select>
                     </div>

                     {/* Recipient STX address */}
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Recipient STX Address</label>
                        <input
                           type="text"
                           value={recipientAddress}
                           onChange={(e) => setRecipientAddress(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm font-mono focus:border-orange-500 focus:outline-none"
                           placeholder="ST..."
                           required
                        />
                     </div>

                     {/* Grade tier */}
                     {needsGrade && (
                        <div>
                           <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Grade Tier</label>
                           <div className="grid grid-cols-2 gap-2">
                              {GRADE_OPTIONS.map((g) => (
                                 <button
                                    key={g.value}
                                    type="button"
                                    onClick={() => setGrade(g.value)}
                                    className={`px-3 py-2 rounded-lg border text-sm font-bold transition-all ${
                                       grade === g.value
                                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'
                                    }`}
                                 >
                                    <span className={g.color}>{g.label}</span>
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* IPFS CID (auto-filled from badge-metadata) */}
                     {needsIpfsCid && (
                        <div>
                           <label className="block text-xs font-bold uppercase text-slate-500 mb-2">IPFS CID (auto-filled)</label>
                           <input
                              type="text"
                              value={ipfsCid}
                              onChange={(e) => setIpfsCid(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm font-mono focus:border-orange-500 focus:outline-none"
                              placeholder="QmXoypiz..."
                              required
                           />
                           <p className="text-[10px] text-slate-600 mt-1">Auto-filled from badge metadata. You can override if needed.</p>
                        </div>
                     )}

                     {/* Status message */}
                     {mintStatus && (
                        <div className={`p-3 rounded-lg text-xs font-mono break-all ${
                           mintStatus.type === 'success'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                           {mintStatus.message}
                        </div>
                     )}

                     <button
                        type="submit"
                        disabled={minting}
                        className={`w-full py-3 font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                           isRevoke
                              ? 'bg-red-600 hover:bg-red-500 text-white'
                              : 'bg-orange-600 hover:bg-orange-500 text-white'
                        }`}
                     >
                        {isRevoke ? <XCircle className="w-4 h-4" /> : mintAction === 'upgrade-grade' ? <ArrowUp className="w-4 h-4" /> : mintAction === 'mint-verified' ? <Shield className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {minting ? 'Awaiting Wallet...' : isRevoke ? 'Revoke On-Chain' : 'Mint On-Chain'}
                     </button>
                  </form>
               </div>

               {/* ── Backend NFT Record Form (collapsed) ── */}
               <details className="bg-[#0b0f19] rounded-xl border border-slate-800">
                  <summary className="p-4 cursor-pointer text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                     <Award className="w-4 h-4 text-slate-500" /> Create Backend NFT Record
                  </summary>
                  <div className="px-6 pb-6">
                     <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Recipient User ID</label>
                           <input
                              type="number"
                              value={recipientId}
                              onChange={(e) => setRecipientId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                              placeholder="e.g. 1"
                              required
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold uppercase text-slate-500 mb-2">NFT Type</label>
                           <select
                              value={nftType}
                              onChange={(e) => setNftType(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                           >
                              <option value="badge">Badge</option>
                              <option value="achievement">Achievement</option>
                              <option value="certification">Certification</option>
                              <option value="reward">Reward</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Name</label>
                           <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                              placeholder="e.g. Verified Pro Badge"
                              required
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Description</label>
                           <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none resize-none h-16"
                              placeholder="Optional description"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Metadata URL</label>
                           <input
                              type="url"
                              value={metadataUrl}
                              onChange={(e) => setMetadataUrl(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                              placeholder="https://..."
                           />
                        </div>
                        <button
                           type="submit"
                           disabled={creating}
                           className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           <Plus className="w-4 h-4" /> {creating ? 'Creating...' : 'Create Record'}
                        </button>
                     </form>
                  </div>
               </details>
            </div>

            {/* ── NFT List ── */}
            <div className="lg:col-span-2 space-y-4">
               <h3 className="text-lg font-bold text-white mb-2">Issued NFTs ({adminNFTs.length})</h3>
               {adminNFTs.length === 0 && (
                  <div className="bg-[#0b0f19] rounded-xl border border-slate-800 p-8 text-center text-slate-500">
                     No NFTs issued yet.
                  </div>
               )}
               {adminNFTs.map((nft) => (
                  <div key={nft.id} className="bg-[#0b0f19] rounded-xl border border-slate-800 p-4 flex items-start gap-4 hover:border-orange-500/30 transition-all group">
                     <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 group-hover:border-orange-500 transition-colors shrink-0">
                        <Award className="w-6 h-6 text-orange-500" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white">{nft.name}</h4>
                        <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                           <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${nft.minted ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {nft.minted ? 'Minted' : 'Pending Mint'}
                           </span>
                           <span className="text-slate-500">{nft.nftType}</span>
                           <span className="text-slate-600">• User #{nft.recipientId}</span>
                        </div>
                        {nft.description && <p className="text-xs text-slate-500 mt-1 truncate">{nft.description}</p>}
                        {nft.mintTxId && <p className="text-[10px] text-slate-600 font-mono mt-1 truncate">TX: {nft.mintTxId}</p>}
                     </div>
                     <div className="text-right shrink-0">
                        {!nft.minted && (
                           <div className="flex items-center gap-2">
                              <input
                                 type="text"
                                 placeholder="Mint TX ID"
                                 value={confirmingId === nft.id ? mintTxId : ''}
                                 onFocus={() => setConfirmingId(nft.id)}
                                 onChange={(e) => setMintTxId(e.target.value)}
                                 className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-white w-32 focus:border-orange-500 focus:outline-none"
                              />
                              <button
                                 onClick={() => handleConfirmMint(nft.id)}
                                 disabled={confirmingId !== nft.id || !mintTxId.trim()}
                                 className="px-2 py-1 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-30"
                              >
                                 <CheckCircle className="w-3 h-3" />
                              </button>
                           </div>
                        )}
                        {nft.minted && (
                           <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</span>
                        )}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};

export default AdminNFT;
