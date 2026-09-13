import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import { User } from '../types';

interface ResponsibleGamblingModalProps {
  user: User;
  onClose: () => void;
  onUpdateLimits: (data: { dailyDepositLimit?: number; singleBetLimit?: number; selfExclusionDays?: number }) => Promise<void>;
}

export const ResponsibleGamblingModal: React.FC<ResponsibleGamblingModalProps> = ({
  user,
  onClose,
  onUpdateLimits
}) => {
  const [dailyLimit, setDailyLimit] = useState<string>(user.dailyDepositLimit.toString());
  const [singleBetLimit, setSingleBetLimit] = useState<string>(user.singleBetLimit.toString());
  const [selfExclusionDays, setSelfExclusionDays] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      await onUpdateLimits({
        dailyDepositLimit: parseFloat(dailyLimit) || undefined,
        singleBetLimit: parseFloat(singleBetLimit) || undefined,
        selfExclusionDays: selfExclusionDays > 0 ? selfExclusionDays : undefined
      });
      setSuccessMessage('Responsible gambling parameters updated and enforced on your account.');
    } catch (err: any) {
      alert(err.message || 'Failed to update limits');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="responsible-gambling-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Responsible Play Controls</h3>
              <p className="text-xs text-slate-400">National Regulatory Player Protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {successMessage && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-slate-400 space-y-1">
            <div className="font-bold text-slate-200">Regulatory Advisory</div>
            <p className="leading-relaxed">
              Sports betting should be an entertaining pastime. As a licensed operator, we enforce strict client-set financial ceilings and timeout provisions.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Maximum Daily Deposit Ceiling (ETB)
            </label>
            <input
              type="number"
              min="100"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Limits the maximum combined deposits you may make within 24 hours.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Maximum Single Bet Limit (ETB)
            </label>
            <input
              type="number"
              min="50"
              value={singleBetLimit}
              onChange={(e) => setSingleBetLimit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Server-side rejection will block any single wager exceeding this amount.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="block font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Take-A-Break / Self-Exclusion</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'None', days: 0 },
                { label: '24 Hours', days: 1 },
                { label: '7 Days', days: 7 },
                { label: '30 Days', days: 30 }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.days}
                  onClick={() => setSelfExclusionDays(opt.days)}
                  className={`py-2 px-1 rounded-xl text-center font-bold border transition-colors cursor-pointer text-xs ${
                    selfExclusionDays === opt.days
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {selfExclusionDays > 0 && (
              <p className="text-amber-300 text-[11px] mt-1.5">
                ⚠️ Wagering will be completely locked server-side for {selfExclusionDays} day(s).
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md"
          >
            {isSaving ? 'Updating Regulatory Parameters...' : 'Save Responsible Play Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};
