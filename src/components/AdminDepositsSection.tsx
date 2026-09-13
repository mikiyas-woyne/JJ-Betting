import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Building2,
  Smartphone,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Loader2,
  FileText,
  DollarSign,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { DepositRecord, Wallet, WalletTransaction } from '../types';
import { api } from '../services/api';

interface AdminDepositsSectionProps {
  onDepositApproved?: (wallet: Wallet, transaction: WalletTransaction) => void;
}

export const AdminDepositsSection: React.FC<AdminDepositsSectionProps> = ({
  onDepositApproved
}) => {
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [summary, setSummary] = useState<{
    pendingDeposits: number;
    approvedToday: number;
    rejectedToday: number;
    totalApprovedAmount: number;
  }>({
    pendingDeposits: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalApprovedAmount: 0
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Screenshot viewer modal state
  const [previewDeposit, setPreviewDeposit] = useState<DepositRecord | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Reject confirmation modal state
  const [rejectingDeposit, setRejectingDeposit] = useState<DepositRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Transfer not found on bank/telebirr statement');
  const [customReason, setCustomReason] = useState<string>('');

  const loadDepositsData = async () => {
    try {
      setIsLoading(true);
      const [depList, summaryData] = await Promise.all([
        api.getAdminDeposits(statusFilter, searchQuery),
        api.getAdminDepositSummary()
      ]);
      setDeposits(depList);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load admin deposits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepositsData();
  }, [statusFilter]);

  // Handle Search on Submit or debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDepositsData();
  };

  // Handle Deposit Approval
  const handleApprove = async (deposit: DepositRecord) => {
    if (deposit.status !== 'PENDING') {
      setFeedbackMessage({ type: 'error', text: `Deposit ${deposit.depositId} is already ${deposit.status}` });
      return;
    }

    try {
      setIsActionLoading(deposit.depositId);
      setFeedbackMessage(null);
      const res = await api.approveDeposit(deposit.depositId);
      
      setFeedbackMessage({
        type: 'success',
        text: `Deposit ${deposit.depositId} (+${deposit.amount.toFixed(2)} ETB) verified and credited to ${deposit.username}.`
      });

      if (onDepositApproved) {
        onDepositApproved(res.wallet, res.transaction);
      }

      // If modal is open for this deposit, update it or close
      if (previewDeposit?.depositId === deposit.depositId) {
        setPreviewDeposit(res.deposit);
      }

      // Refresh list and metrics
      await loadDepositsData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Approval failed' });
    } finally {
      setIsActionLoading(null);
    }
  };

  // Handle Deposit Rejection
  const handleConfirmReject = async () => {
    if (!rejectingDeposit) return;
    const finalReason = customReason.trim() ? customReason.trim() : rejectReason;

    try {
      setIsActionLoading(rejectingDeposit.depositId);
      setFeedbackMessage(null);
      const res = await api.rejectDeposit(rejectingDeposit.depositId, finalReason);
      
      setFeedbackMessage({
        type: 'success',
        text: `Deposit ${rejectingDeposit.depositId} marked as REJECTED.`
      });

      if (previewDeposit?.depositId === rejectingDeposit.depositId) {
        setPreviewDeposit(res.deposit);
      }

      setRejectingDeposit(null);
      setCustomReason('');
      await loadDepositsData();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setIsActionLoading(null);
    }
  };

  const openScreenshotModal = (deposit: DepositRecord) => {
    setPreviewDeposit(deposit);
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Pending Deposits */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Pending Deposits</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1">
            {summary.pendingDeposits}
          </div>
          <div className="text-[11px] text-amber-300/80">Requires admin verification</div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-amber-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 2: Approved Today */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Approved Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
            {summary.approvedToday}
          </div>
          <div className="text-[11px] text-emerald-300/80">Credited to player wallets</div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 3: Rejected Today */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Rejected Today</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400 mt-1">
            {summary.rejectedToday}
          </div>
          <div className="text-[11px] text-rose-300/80">Fraud or unverified slips</div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-rose-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 4: Total Approved Amount */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Total Approved</span>
            <DollarSign className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            {summary.totalApprovedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400">ETB</span>
          </div>
          <div className="text-[11px] text-slate-400">Total verified inflows</div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-slate-800/40 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. FILTERS & SEARCH CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Deposits' },
            { id: 'PENDING', label: `Pending (${summary.pendingDeposits})` },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search username or DEP ID..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </form>

          <button
            onClick={loadDepositsData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. DEPOSITS LIST / TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
            <div>Loading deposit records for review...</div>
          </div>
        ) : deposits.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-1">
            <div className="font-semibold text-slate-400">No deposit records found</div>
            <div className="text-[11px]">
              {statusFilter !== 'all'
                ? `No deposits with status "${statusFilter}".`
                : 'No deposits match your search criteria.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {deposits.map((dep) => {
                  const isPending = dep.status === 'PENDING';
                  const isApproved = dep.status === 'APPROVED';
                  const isRejected = dep.status === 'REJECTED';
                  const isActioning = isActionLoading === dep.depositId;

                  return (
                    <tr
                      key={dep.depositId}
                      className="hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Player */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                            <UserIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{dep.username}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {dep.depositId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-sm text-emerald-400">
                          {dep.amount.toFixed(2)} <span className="text-[10px] text-slate-400">{dep.currency}</span>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {dep.paymentMethod === 'bank_of_abyssinia' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-semibold">
                              <Building2 className="w-3 h-3" /> BoA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-semibold">
                              <Smartphone className="w-3 h-3" /> Telebirr
                            </span>
                          )}
                        </div>
                        {dep.note && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5" title={dep.note}>
                            {dep.note}
                          </div>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        <div>{new Date(dep.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(dep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Screenshot Thumbnail */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => openScreenshotModal(dep)}
                          className="group relative inline-block rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer"
                          title="Click to view full screenshot"
                        >
                          <img
                            src={dep.screenshotUrl}
                            alt="Receipt"
                            className="w-12 h-10 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                            <Eye className="w-3.5 h-3.5 text-white drop-shadow-md" />
                          </div>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[10px] uppercase">
                            <Clock className="w-3 h-3 animate-pulse" /> Pending
                          </span>
                        )}
                        {isApproved && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                              <Check className="w-3 h-3" /> Approved
                            </span>
                            {dep.reviewedBy && (
                              <div className="text-[9px] text-slate-500">by {dep.reviewedBy}</div>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold text-[10px] uppercase">
                              <X className="w-3 h-3" /> Rejected
                            </span>
                            {dep.rejectionReason && (
                              <div className="text-[9px] text-rose-300/80 truncate max-w-[120px]" title={dep.rejectionReason}>
                                {dep.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openScreenshotModal(dep)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="View Screenshot"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={isActioning}
                              onClick={() => handleApprove(dep)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Verify & Credit Wallet"
                            >
                              {isActioning ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              disabled={isActioning}
                              onClick={() => {
                                setRejectingDeposit(dep);
                                setCustomReason('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Reject Deposit"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500">
                            {dep.reviewedAt ? new Date(dep.reviewedAt).toLocaleDateString() : 'Reviewed'}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. SECURE SCREENSHOT PREVIEW MODAL WITH ZOOM */}
      {previewDeposit && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Payment Screenshot Verification</span>
                  <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {previewDeposit.depositId}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Player: <strong className="text-white">{previewDeposit.username}</strong></span>
                  <span>•</span>
                  <span>Amount: <strong className="text-emerald-400 font-mono">{previewDeposit.amount.toFixed(2)} ETB</strong></span>
                  <span>•</span>
                  <span>Method: <strong className="text-white">{previewDeposit.paymentMethodName || previewDeposit.paymentMethod}</strong></span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setPreviewDeposit(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Zoom Toolbar */}
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center gap-1 cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ({Math.round(zoomLevel * 100)}%)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Submitted: {new Date(previewDeposit.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 bg-slate-950 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
              <div
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-w-full flex items-center justify-center"
              >
                <img
                  src={previewDeposit.screenshotUrl}
                  alt="Full Payment Verification Screenshot"
                  className="max-h-[60vh] object-contain rounded-lg shadow-xl"
                />
              </div>
            </div>

            {/* Modal Footer with Quick Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                Status: <strong className={`uppercase ${
                  previewDeposit.status === 'APPROVED' ? 'text-emerald-400' :
                  previewDeposit.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                }`}>{previewDeposit.status}</strong>
                {previewDeposit.adminNote && <span> • {previewDeposit.adminNote}</span>}
              </div>

              {previewDeposit.status === 'PENDING' ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingDeposit(previewDeposit);
                      setCustomReason('');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Deposit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(previewDeposit)}
                    className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Credit {previewDeposit.amount.toFixed(2)} ETB</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  Reviewed by {previewDeposit.reviewedBy || 'Admin'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. REJECTION CONFIRMATION MODAL */}
      {rejectingDeposit && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Reject Deposit Request</span>
              </div>
              <button
                onClick={() => setRejectingDeposit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>
                Are you sure you want to reject this deposit of{' '}
                <strong className="text-white font-mono">{rejectingDeposit.amount.toFixed(2)} ETB</strong> from{' '}
                <strong className="text-white">{rejectingDeposit.username}</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                The player's wallet will <strong>NOT</strong> be credited. An immutable rejection log will be created.
              </p>
            </div>

            {/* Common Preset Rejection Reasons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300">Select Rejection Reason:</label>
              {[
                'Transfer not found on bank/telebirr statement',
                'Incorrect transfer amount on receipt',
                'Blurry or unreadable screenshot image',
                'Duplicate or recycled payment receipt',
                'Payment reversed or cancelled by sender'
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRejectReason(r);
                    setCustomReason('');
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    rejectReason === r && !customReason
                      ? 'bg-rose-500/15 border border-rose-500/40 text-white font-semibold'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{r}</span>
                  {rejectReason === r && !customReason && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </button>
              ))}
            </div>

            {/* Custom note */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Or Custom Reason / Note:
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Optional custom clarification..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingDeposit(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
