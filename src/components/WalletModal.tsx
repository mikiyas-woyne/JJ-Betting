import React, { useState } from 'react';
import {
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  ShieldCheck,
  Building2,
  Smartphone,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Wallet, WalletTransaction, User } from '../types';
import { AVAILABLE_PAYMENT_PROVIDERS } from '../services/paymentProvider';
import { ManualDepositFlow } from './ManualDepositFlow';

interface WalletModalProps {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  user: User;
  onClose: () => void;
  onDeposit: (amount: number, providerId: string, phoneOrAccount: string) => Promise<void>;
  onWithdraw: (amount: number, providerId: string, destinationAccount: string, holderName: string) => Promise<void>;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  wallet,
  transactions,
  user,
  onClose,
  onDeposit,
  onWithdraw
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transactions' | 'providers'>('deposit');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('telebirr');
  const [amountInput, setAmountInput] = useState<string>('500');
  const [accountInput, setAccountInput] = useState<string>('0911234567');
  const [holderNameInput, setHolderNameInput] = useState<string>(user.displayName);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedProvider = AVAILABLE_PAYMENT_PROVIDERS.find(p => p.id === selectedProviderId) || AVAILABLE_PAYMENT_PROVIDERS[0];
  const amount = parseFloat(amountInput) || 0;

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (amount <= 0) {
      setActionError('Please enter a valid deposit amount');
      return;
    }
    if (amount < selectedProvider.minDeposit) {
      setActionError(`Minimum deposit for ${selectedProvider.name} is ${selectedProvider.minDeposit} ETB`);
      return;
    }

    try {
      setIsProcessing(true);
      await onDeposit(amount, selectedProvider.id, accountInput);
      setActionSuccess(`Deposit of ${amount} ETB successfully processed and credited to your ledger.`);
      setAmountInput('500');
    } catch (err: any) {
      setActionError(err.message || 'Deposit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (amount <= 0) {
      setActionError('Please enter a valid withdrawal amount');
      return;
    }
    if (!wallet || amount > wallet.availableBalance) {
      setActionError('Insufficient available balance for this withdrawal');
      return;
    }

    try {
      setIsProcessing(true);
      await onWithdraw(amount, selectedProvider.id, accountInput, holderNameInput);
      setActionSuccess(`Withdrawal of ${amount} ETB authorized and logged in your ledger.`);
      setAmountInput('500');
    } catch (err: any) {
      setActionError(err.message || 'Withdrawal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="wallet-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-950 p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Customer Financial Ledger</h2>
              <p className="text-xs text-slate-400">National Gaming License Compliant Wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Overview Banner */}
        <div className="bg-slate-900/90 p-4 sm:p-5 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Available Balance</div>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
              {wallet ? `${wallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB` : '0.00 ETB'}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Locked / Wagered</div>
            <div className="text-base sm:text-lg font-bold text-slate-300 font-mono mt-0.5">
              {wallet ? `${wallet.lockedBalance.toFixed(2)} ETB` : '0.00 ETB'}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Total Deposited</div>
            <div className="text-base sm:text-lg font-bold text-slate-300 font-mono mt-0.5">
              {wallet ? `${wallet.totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB` : '0.00 ETB'}
            </div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
            <div className="text-[11px] text-slate-400 font-medium">Total Withdrawn</div>
            <div className="text-base sm:text-lg font-bold text-slate-300 font-mono mt-0.5">
              {wallet ? `${wallet.totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB` : '0.00 ETB'}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="bg-slate-950 px-4 sm:px-6 pt-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('deposit');
              setActionError(null);
              setActionSuccess(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'deposit'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('withdraw');
              setActionError(null);
              setActionSuccess(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'withdraw'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('transactions');
              setActionError(null);
              setActionSuccess(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'transactions'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Ledger Transactions ({transactions.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('providers');
              setActionError(null);
              setActionSuccess(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'providers'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Provider Abstraction</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {actionSuccess && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          {/* TAB 1: MANUAL DEPOSIT VERIFICATION FLOW */}
          {activeTab === 'deposit' && (
            <ManualDepositFlow
              user={user}
              wallet={wallet}
              onDepositSubmitted={() => {
                // Keep history updated
              }}
            />
          )}

          {/* TAB 2: WITHDRAW */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Available to Withdraw:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {wallet ? `${wallet.availableBalance.toFixed(2)} ETB` : '0 ETB'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Payout Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_PAYMENT_PROVIDERS.map(p => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setSelectedProviderId(p.id)}
                      className={`p-2.5 text-left rounded-xl border text-xs font-semibold cursor-pointer ${
                        selectedProviderId === p.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Withdrawal Amount (ETB)
                </label>
                <input
                  type="number"
                  min="50"
                  max={wallet ? wallet.availableBalance : 0}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="500"
                  required
                />
                <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                  <span>Regulatory Fee (0.5%): {(amount * 0.005).toFixed(2)} ETB</span>
                  <span>Net Payout: {Math.max(0, amount - amount * 0.005).toFixed(2)} ETB</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Destination Account (Bank IBAN / Telebirr Phone)
                </label>
                <input
                  type="text"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  placeholder="10002938491823"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Account Holder Full Legal Name (Must match KYC)
                </label>
                <input
                  type="text"
                  value={holderNameInput}
                  onChange={(e) => setHolderNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Withdrawal...</span>
                  </>
                ) : (
                  <span>Request Withdrawal of {amount} ETB</span>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: LEDGER TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="space-y-2.5">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Auditable Financial Ledger Entries</span>
                <span className="font-mono text-[11px] text-slate-500">Immutable Records</span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No transactions recorded yet.
                </div>
              ) : (
                transactions.map(txn => {
                  const isCredit = txn.amount > 0;
                  return (
                    <div
                      key={txn.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              txn.type === 'deposit'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : txn.type === 'withdrawal'
                                ? 'bg-amber-500/20 text-amber-400'
                                : txn.type === 'bet_payout'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {txn.type.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-white">{txn.description}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Ref: {txn.referenceId} • {new Date(txn.createdAt).toLocaleString()}
                        </div>
                        {txn.approvedBy && (
                          <div className="text-[10px] text-emerald-400/90 font-medium">
                            ✓ Verified & Approved by {txn.approvedBy} {txn.depositId ? `(Ref: ${txn.depositId})` : ''}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          Balance Snapshot: {txn.balanceBefore.toFixed(2)} → {txn.balanceAfter.toFixed(2)} ETB
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-mono font-extrabold text-sm ${
                            isCredit ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {isCredit ? `+${txn.amount.toFixed(2)}` : `${txn.amount.toFixed(2)}`} ETB
                        </div>
                        <span className="inline-block px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 uppercase font-semibold">
                          {txn.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: PROVIDER ABSTRACTION ARCHITECTURE */}
          {activeTab === 'providers' && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm">Regulatory Payment Provider Contract</h4>
                <p className="text-slate-400 leading-relaxed text-xs">
                  This sportsbook implements an isolated provider interface (<code className="text-emerald-400">IPaymentGateway</code>).
                  Production credentials, webhook secrets, and private banking tokens remain strictly server-side inside secure environment variables.
                </p>
              </div>

              <div className="space-y-2">
                {AVAILABLE_PAYMENT_PROVIDERS.map(p => (
                  <div key={p.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{p.name}</span>
                      <span className="text-[10px] text-emerald-400 uppercase font-mono">{p.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{p.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Limits: {p.minDeposit} - {p.maxDeposit} ETB • Deposit Fee: {p.depositFeePercent}% • Withdrawal Fee: {p.withdrawalFeePercent}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
