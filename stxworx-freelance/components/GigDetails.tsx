
import React, { useState, useEffect } from 'react';
import { Gig, TokenType } from '../types';
import { ArrowLeft, Star, Clock, CheckCircle2, ShieldCheck, Zap, User, MessageSquare, Mail } from 'lucide-react';
import { formatUSD, usdToToken, EXCHANGE_RATES } from '../services/StacksService';

interface GigDetailsProps {
   gig: Gig;
   onBack: () => void;
   onHire: (gig: Gig) => void;
   onViewProfile: (address: string, name: string) => void;
   onContact: (address: string, name: string) => void;
}

const GigDetails: React.FC<GigDetailsProps> = ({ gig, onBack, onHire, onViewProfile, onContact }) => {
   const [selectedToken, setSelectedToken] = useState<TokenType>('STX');
   const tokenAmount = usdToToken(gig.price, selectedToken);

   return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <button
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors text-sm font-bold uppercase tracking-wider group"
         >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Browse
         </button>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Main Content */}
            <div className="lg:col-span-2 space-y-8">

               {/* Header Image */}
               <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-800 shadow-2xl group">
                  <img src={gig.imageUrl} alt={gig.title} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4">
                     <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider text-white border border-white/10">
                        {gig.category}
                     </span>
                  </div>
               </div>

               {/* Title & Stats */}
               <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">{gig.title}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                     <div
                        className="flex items-center gap-2 cursor-pointer hover:text-orange-500 transition-colors"
                        onClick={() => onViewProfile(gig.freelancerAddress, gig.freelancerName)}
                     >
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                           <User className="w-4 h-4 text-orange-500" />
                        </div>
                        <span className="font-bold underline decoration-slate-600 underline-offset-4">{gig.freelancerName}</span>
                     </div>
                     <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-4 h-4 fill-amber-500" />
                        {gig.rating} <span className="text-slate-500 font-medium">({gig.reviews} Reviews)</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {gig.deliveryTime || 7} Days Delivery
                     </div>
                     <div className="flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-green-500" /> Escrow Protected
                     </div>
                  </div>
               </div>

               {/* Description */}
               <div className="bg-[#0b0f19] p-8 rounded-2xl border border-slate-800">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">About This Gig</h3>
                  <div className="prose prose-invert prose-slate max-w-none">
                     <p className="text-slate-400 leading-relaxed mb-6">
                        {gig.fullDescription || gig.description || "I will provide high-quality services tailored to your specific needs on the Stacks blockchain. My process involves detailed planning, execution, and revisions to ensure your complete satisfaction."}
                     </p>

                     <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-4">What you get:</h4>
                     <ul className="space-y-3 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                           <li key={i} className="flex items-start gap-3 text-slate-400">
                              <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                              <span>Professional quality deliverable with full source code ownership.</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>

               {/* Tags */}
               <div>
                  <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Skills & Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                     {gig.tags.map((tag, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
                           #{tag}
                        </span>
                     ))}
                  </div>
               </div>
            </div>

            {/* Right Column: Pricing Sidebar */}
            <div className="lg:col-span-1">
               <div className="sticky top-24 space-y-6">

                  <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-[40px] pointer-events-none"></div>

                     <div className="flex justify-between items-center mb-6 relative z-10">
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Fixed Price</span>
                        <span className="text-3xl font-black text-white">{formatUSD(gig.price)}</span>
                     </div>

                     <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Complete project delivery including all source files and commercial rights. Escrow secured.
                     </p>

                     <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between text-sm">
                           <span className="flex items-center gap-2 text-slate-300"><Clock className="w-4 h-4 text-slate-500" /> Delivery Time</span>
                           <span className="font-bold text-white">{gig.deliveryTime || 7} Days</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="flex items-center gap-2 text-slate-300"><MessageSquare className="w-4 h-4 text-slate-500" /> Revisions</span>
                           <span className="font-bold text-white">Unlimited</span>
                        </div>
                     </div>

                     {/* Payment Token Selector in Sidebar */}
                     <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Estimated Token Cost</div>
                        <div className="flex justify-between items-center">
                           <span className="text-orange-500 font-mono font-bold">{tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedToken}</span>
                           <div className="flex gap-1">
                              {(['STX', 'sBTC'] as TokenType[]).map(t => (
                                 <button
                                    key={t}
                                    onClick={() => setSelectedToken(t)}
                                    className={`px-2 py-1 text-[10px] font-bold rounded border ${selectedToken === t ? 'bg-slate-700 border-slate-600 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                 >
                                    {t}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="text-[9px] text-slate-600 mt-1">1 {selectedToken} ≈ ${EXCHANGE_RATES[selectedToken].toLocaleString()}</div>
                     </div>

                     <div className="space-y-3">
                        <button
                           onClick={() => onHire(gig)}
                           className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider text-sm rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                        >
                           <Zap className="w-5 h-5" /> Hire & Fund Escrow
                        </button>

                        <button
                           onClick={() => onContact(gig.freelancerAddress, gig.freelancerName)}
                           className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-wider text-sm rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                           <Mail className="w-5 h-5" /> Contact Freelancer
                        </button>
                     </div>

                     <div className="mt-4 text-center">
                        <span className="text-[10px] text-slate-500 font-mono">100% Secure Contract • Money Back Guarantee</span>
                     </div>
                  </div>

                  {/* Freelancer Mini Profile */}
                  <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                           <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                           <h4 className="font-bold text-white">{gig.freelancerName}</h4>
                           <span className="text-xs text-slate-500">{gig.freelancerAddress.slice(0, 6)}...{gig.freelancerAddress.slice(-4)}</span>
                        </div>
                     </div>
                     <button
                        onClick={() => onViewProfile(gig.freelancerAddress, gig.freelancerName)}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider rounded border border-slate-800 transition-colors"
                     >
                        View Full Profile
                     </button>
                  </div>

               </div>
            </div>
         </div>
      </div>
   );
};

export default GigDetails;
