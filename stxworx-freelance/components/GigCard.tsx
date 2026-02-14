
import React from 'react';
import { Gig } from '../types';
import { Star, Zap, User, ShieldCheck } from 'lucide-react';
import { formatUSD } from '../services/StacksService';

interface GigCardProps {
  gig: Gig;
  onHire: (gig: Gig) => void;
  onViewProfile?: (address: string, name: string) => void;
  onViewDetails?: (gig: Gig) => void;
}

const GigCard: React.FC<GigCardProps> = ({ gig, onHire, onViewProfile, onViewDetails }) => {
  return (
    <div
      onClick={() => onViewDetails && onViewDetails(gig)}
      className="group relative bg-[#0b0f19] rounded-xl overflow-hidden border border-slate-800 hover:border-orange-500/50 transition-all duration-300 flex flex-col h-full hover:shadow-[0_0_25px_rgba(249,115,22,0.15)] hover:-translate-y-1 cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] to-transparent opacity-80 z-10"></div>
        <img
          src={gig.imageUrl}
          alt={gig.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 items-end">
          <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-white/10">
            {gig.category}
          </span>
          {gig.isVerified && (
            <span className="px-2 py-1 bg-blue-600/90 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-white border border-blue-400/30 flex items-center gap-1 shadow-lg">
              <ShieldCheck className="w-3 h-3" /> Verified Pro
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div
            className="flex items-center gap-2 cursor-pointer group/user"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewProfile) onViewProfile(gig.freelancerAddress, gig.freelancerName);
            }}
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover/user:border-orange-500 transition-colors">
                <User className="w-3 h-3 text-orange-500" />
              </div>
              {gig.isVerified && <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-[#0b0f19]"><ShieldCheck className="w-2 h-2 text-white" /></div>}
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover/user:text-white transition-colors underline-offset-2 group-hover/user:underline">{gig.freelancerName}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
            <Star className="w-3 h-3 fill-amber-500" />
            <span>{gig.rating}</span>
            <span className="text-slate-600 font-medium">({gig.reviews})</span>
          </div>
        </div>

        <h3 className="text-white font-bold text-lg mb-2 leading-tight group-hover:text-orange-500 transition-colors line-clamp-2">
          {gig.title}
        </h3>

        <p className="text-slate-500 text-xs mb-4 line-clamp-2">
          {gig.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {gig.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-800 pt-4">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Starting at</span>
            <div className="text-xl font-black text-white">{formatUSD(gig.price)}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHire(gig);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 group/btn"
          >
            Hire Now <Zap className="w-3 h-3 group-hover/btn:fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GigCard;
