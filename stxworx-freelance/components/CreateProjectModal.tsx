import React, { useEffect, useState, useRef } from 'react';
import { X, Coins, Lock, ShieldCheck, ArrowDown, Paperclip, FileText, Trash2 } from 'lucide-react';
import { TokenType, Project } from '../types';
import { usdToToken, EXCHANGE_RATES } from '../services/StacksService';
import { useWallet } from './wallet/WalletProvider';
// Removed static import to prevent load-time crash if polyfills missing

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Partial<Project> & { freelancerAddress?: string; totalBudget?: number; category?: string; title?: string; description?: string } | null;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { userAddress } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    totalBudgetUSD: '', // Store USD input as string for controlled input
    tokenType: 'STX' as TokenType,
    freelancerAddress: '',
  });

  const [milestoneTitles, setMilestoneTitles] = useState<string[]>([
    'Project Kickoff & Setup',
    'Core Feature Implementation',
    'UI/UX Polish & Integration',
    'Final Testing & Deployment'
  ]);

  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exchangeRates, setExchangeRates] = useState(EXCHANGE_RATES);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack,bitcoin&vs_currencies=usd');
        const data = await response.json();
        if (data.blockstack?.usd && data.bitcoin?.usd) {
          setExchangeRates({
            STX: data.blockstack.usd,
            sBTC: data.bitcoin.usd
          });
        }
      } catch (error) {
        console.error('Failed to fetch real-time prices, using defaults', error);
      }
    };
    fetchPrices();
  }, []);

  // Derived token amount based on USD input and selected token
  const tokenAmount = formData.totalBudgetUSD
    ? Number(formData.totalBudgetUSD) / exchangeRates[formData.tokenType]
    : 0;

  // Pre-fill form when initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        totalBudgetUSD: initialData.totalBudget ? String(initialData.totalBudget) : '', // Assuming initialData.totalBudget comes in as USD from the Gig Price
        tokenType: initialData.tokenType || 'STX',
        freelancerAddress: initialData.freelancerAddress || '',
      });
      // Reset milestone titles to defaults on open
      setMilestoneTitles([
        'Project Kickoff & Setup',
        'Core Feature Implementation',
        'UI/UX Polish & Integration',
        'Final Testing & Deployment'
      ]);
      setAttachments([]);
    } else if (isOpen && !initialData) {
      // Reset if opening empty
      setFormData({
        title: '',
        description: '',
        category: '',
        totalBudgetUSD: '',
        tokenType: 'STX',
        freelancerAddress: '',
      });
      setMilestoneTitles([
        'Project Kickoff & Setup',
        'Core Feature Implementation',
        'UI/UX Polish & Integration',
        'Final Testing & Deployment'
      ]);
      setAttachments([]);
    }
  }, [isOpen, initialData]);

  // Hooks for file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Total budget calculated in TOKENS for the smart contract
    const totalTokenBudget = tokenAmount;
    const amountPerMilestone = totalTokenBudget / 4;

    // Prepare milestone objects for backend/contract
    const milestoneObjs = milestoneTitles.map((title, index) => ({
      id: index + 1,
      title: title || `Milestone ${index + 1}`, // Fallback title
      amount: Number(amountPerMilestone.toFixed(6)), // Avoid precision errors
      status: 'locked'
    }));

    // Prepare data for contract call
    const projectData = {
      freelancerAddress: formData.freelancerAddress,
      totalBudget: totalTokenBudget,
      tokenType: formData.tokenType,
      milestones: milestoneObjs
    };

    try {
      // Dynamically import contracts to avoid load issues if environment is missing polyfills
      const { createProjectContractCall, saveProjectToBackend } = await import('../lib/contracts');

      await createProjectContractCall(
        projectData,
        async (txData) => {
          console.log('Transaction sent:', txData);
          // Transaction sent successfully, now save to backend
          try {
            const backendData = {
              ...formData,
              // Ensure we pass the user's address (client) from context
              clientAddress: userAddress,
              totalBudget: totalTokenBudget,
              milestones: milestoneObjs
            };

            await saveProjectToBackend(txData.txId, backendData);

            setIsLoading(false);
            onSubmit({ ...formData, txId: txData.txId });
            onClose();
            // Ideally show success toast
          } catch (backendError) {
            console.error('Error saving to backend:', backendError);
            setIsLoading(false);
            // Show error but maybe don't close modal? Or close and warn?
            alert('Project created on-chain but failed to save to database. Please contact support with TxID: ' + txData.txId);
            onClose();
          }
        },
        () => {
          console.log('Transaction canceled');
          setIsLoading(false);
        }
      );
    } catch (error: any) {
      console.error('Error initiating contract call:', error);
      setIsLoading(false);

      // Improve error reporting for missing polyfills
      if (error.message && (error.message.includes('Buffer') || error.message.includes('global'))) {
        alert('System Error: Missing blockchain dependencies (Buffer/global). Please contact support.');
      } else {
        alert('Failed to initiate contract call: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const milestoneTokenAmount = (tokenAmount / 4).toFixed(6);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 rounded-2xl shadow-2xl shadow-black w-full max-w-2xl overflow-hidden transform transition-all border border-slate-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-black uppercase tracking-tight text-white">New Escrow Contract</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Project Title</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors placeholder-slate-700"
                    placeholder="e.g. DeFi Dashboard Frontend"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors placeholder-slate-700"
                    placeholder="e.g. Smart Contracts, Design, Writing..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Freelancer Address (STX Mainnet)</label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none font-mono text-xs placeholder-slate-700"
                    placeholder="SP3..."
                    value={formData.freelancerAddress}
                    onChange={(e) => setFormData({ ...formData, freelancerAddress: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Scope of Work</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none resize-none placeholder-slate-700 text-sm"
                    placeholder="Describe deliverables, timeline, and requirements..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Attachments</label>
                  <div className="space-y-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate text-slate-300">{file.name}</span>
                          <span className="text-slate-600">({(file.size / 1024).toFixed(0)}KB)</span>
                        </div>
                        <button type="button" onClick={() => removeAttachment(idx)} className="text-slate-500 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-slate-700 hover:border-orange-500/50 hover:bg-slate-950/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all group"
                    >
                      <Paperclip className="w-5 h-5 text-slate-500 group-hover:text-orange-500 mb-1" />
                      <span className="text-xs text-slate-500 group-hover:text-slate-400">Click to attach files</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Financials & Escrow Preview */}
              <div className="space-y-4">
                <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Budget (USD)</label>
                  <div className="flex gap-2 mb-4">
                    <span className="flex items-center justify-center px-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 font-bold">$</span>
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500 focus:outline-none placeholder-slate-700 font-mono text-lg"
                      placeholder="0.00"
                      value={formData.totalBudgetUSD}
                      onChange={(e) => setFormData({ ...formData, totalBudgetUSD: e.target.value })}
                    />
                  </div>

                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Payment Token</label>
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 mb-3">
                    {(['STX', 'sBTC'] as TokenType[]).map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setFormData({ ...formData, tokenType: token })}
                        className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-all ${formData.tokenType === token
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        {token}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500">Required Lock Amount:</span>
                    <span className="font-mono font-bold text-orange-500">{tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {formData.tokenType}</span>
                  </div>
                  <div className="text-[10px] text-right text-slate-600 mt-1">
                    1 {formData.tokenType} ≈ ${exchangeRates[formData.tokenType].toLocaleString()}
                  </div>
                </div>

                {/* Escrow Visualization with Editable Tasks */}
                <div className="bg-[#020617] rounded-xl border border-slate-800 p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-24 bg-orange-600/5 rounded-full blur-2xl group-hover:bg-orange-600/10 transition-colors pointer-events-none"></div>

                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <Lock className="w-3 h-3 text-orange-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Escrow Distribution (Fixed 4-Stage)</h4>
                  </div>

                  <div className="space-y-2 relative z-10">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="p-3 rounded bg-slate-900/50 border border-slate-800/50 hover:border-orange-500/30 transition-colors mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-slate-800 text-[9px] font-bold text-slate-500">M{index + 1}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">25% Release</span>
                          </div>
                          <span className="text-xs font-mono text-orange-500 font-bold">
                            {milestoneTokenAmount} {formData.tokenType}
                          </span>
                        </div>
                        <input
                          type="text"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none placeholder-slate-600 transition-colors"
                          placeholder={`Milestone ${index + 1} Task Description`}
                          value={milestoneTitles[index]}
                          onChange={(e) => {
                            const newTitles = [...milestoneTitles];
                            newTitles[index] = e.target.value;
                            setMilestoneTitles(newTitles);
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 relative z-10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Locked</span>
                      <span className="text-sm font-black text-white">{tokenAmount.toFixed(6)} {formData.tokenType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-4 bg-orange-600 text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all hover:scale-[1.01] gap-2"
              >
                <ShieldCheck className="w-5 h-5" /> Deploy Contract (${Number(formData.totalBudgetUSD).toLocaleString()})
              </button>
              <p className="text-center text-[10px] text-slate-500 mt-3 font-mono">
                By deploying, you agree to lock {tokenAmount.toFixed(4)} {formData.tokenType} into the smart contract.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
