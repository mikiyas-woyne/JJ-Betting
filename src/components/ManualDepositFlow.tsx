import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Smartphone,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Image as ImageIcon,
  RotateCcw,
  Loader2,
  FileText,
  ShieldCheck,
  Eye,
  X
} from 'lucide-react';
import { DepositRecord, ManualPaymentDestination, User, Wallet } from '../types';
import { api } from '../services/api';

interface ManualDepositFlowProps {
  user: User;
  wallet: Wallet | null;
  onDepositSubmitted?: () => void;
}

export const ManualDepositFlow: React.FC<ManualDepositFlowProps> = ({
  user,
  wallet,
  onDepositSubmitted
}) => {
  const [destinations, setDestinations] = useState<ManualPaymentDestination[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'bank_of_abyssinia' | 'telebirr'>('bank_of_abyssinia');
  const [amount, setAmount] = useState<string>('500');
  const [note, setNote] = useState<string>('');
  
  // Screenshot upload state
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedDeposit, setSubmittedDeposit] = useState<DepositRecord | null>(null);
  
  // Player's deposits state
  const [myDeposits, setMyDeposits] = useState<DepositRecord[]>([]);
  const [isLoadingDeposits, setIsLoadingDeposits] = useState<boolean>(true);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Copy feedback state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load payment destinations and user deposits
  const loadData = async () => {
    try {
      setIsLoadingDeposits(true);
      const [destList, depList] = await Promise.all([
        api.getDepositDestinations(),
        api.getMyDeposits()
      ]);
      setDestinations(destList);
      setMyDeposits(depList);
    } catch (err) {
      console.error('Failed to load deposit destinations:', err);
    } finally {
      setIsLoadingDeposits(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentDestination = destinations.find(d => d.id === selectedMethod) || {
    id: selectedMethod,
    name: selectedMethod === 'bank_of_abyssinia' ? 'Bank of Abyssinia' : 'Telebirr',
    accountName: 'Mikiyas Woyne Gebresenbet',
    accountNumber: selectedMethod === 'bank_of_abyssinia' ? '155832444' : undefined,
    phoneNumber: selectedMethod === 'telebirr' ? '0938014055' : undefined,
    instructions: ''
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    // Validate format: JPG, JPEG, PNG, WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFileError('Invalid file type. Only JPG, JPEG, PNG, and WebP images are accepted.');
      return;
    }

    // Validate size: max 5 MB (5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(`File size ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds maximum allowed limit of 5 MB.`);
      return;
    }

    setScreenshotFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScreenshotPreview(reader.result);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileError(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Submit Deposit Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid deposit amount greater than 0 ETB.');
      return;
    }

    if (!screenshotPreview) {
      setSubmitError('Please upload a screenshot of your payment receipt.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.submitManualDeposit({
        paymentMethod: selectedMethod,
        amount: parsedAmount,
        screenshotUrl: screenshotPreview,
        note: note.trim() ? note.trim() : undefined
      });

      setSubmittedDeposit(res.deposit);
      // Reload user deposits
      const updatedList = await api.getMyDeposits();
      setMyDeposits(updatedList);
      if (onDepositSubmitted) onDepositSubmitted();
    } catch (err: any) {
      setSubmitError(err.message || 'Deposit submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedDeposit(null);
    setScreenshotPreview(null);
    setScreenshotFileName('');
    setAmount('500');
    setNote('');
    setSubmitError(null);
    setFileError(null);
  };

  // Calculate pending deposits
  const pendingDeposits = myDeposits.filter(d => d.status === 'PENDING');
  const pendingTotal = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* PENDING DEPOSIT BANNER (As specified in prompt) */}
      {pendingDeposits.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-amber-300 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="font-bold text-sm text-white">Pending Deposit</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider">
              {pendingDeposits.length} Under Review
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              ETB {pendingTotal.toFixed(2)}
            </div>
          </div>
          <div className="text-xs text-amber-200/90 font-medium flex items-center gap-1.5">
            <span>Waiting for admin verification.</span>
            <span className="text-amber-400/70 text-[11px] font-normal">
              (Pending amounts are not included in your Available Balance until approved)
            </span>
          </div>
        </div>
      )}

      {/* CONFIRMATION CARD AFTER SUCCESSFUL SUBMISSION */}
      {submittedDeposit ? (
        <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Clock className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">Deposit Request Submitted</h3>
            <p className="text-xs text-emerald-400 font-semibold">
              Your deposit is waiting for admin verification.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left space-y-2.5 max-w-md mx-auto text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Deposit Reference</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {submittedDeposit.depositId}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Payment Destination</span>
              <span className="font-bold text-slate-200">
                {submittedDeposit.paymentMethodName || submittedDeposit.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Submitted Amount</span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {submittedDeposit.amount.toFixed(2)} ETB
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Verification Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Clock className="w-3 h-3" /> PENDING
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            An authorized admin will review your uploaded screenshot against official statements. 
            Once approved, your wallet balance will be credited instantly and you will receive an in-app notification.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={handleResetForm}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Submit Another Deposit
            </button>
          </div>
        </div>
      ) : (
        /* MAIN 5-STEP PLAYER DEPOSIT FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: SELECT PAYMENT METHOD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                  1
                </span>
                Select Payment Method
              </label>
              <span className="text-[11px] text-slate-400">Instant Manual Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Bank of Abyssinia */}
              <div
                onClick={() => setSelectedMethod('bank_of_abyssinia')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  selectedMethod === 'bank_of_abyssinia'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-white">Bank of Abyssinia</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Acc: 155832444</div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedMethod === 'bank_of_abyssinia'
                    ? 'border-amber-400 bg-amber-400'
                    : 'border-slate-700'
                }`}>
                  {selectedMethod === 'bank_of_abyssinia' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  )}
                </div>
              </div>

              {/* Option B: Telebirr */}
              <div
                onClick={() => setSelectedMethod('telebirr')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  selectedMethod === 'telebirr'
                    ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-md shadow-cyan-500/5'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-white">Telebirr</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Phone: 0938014055</div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedMethod === 'telebirr'
                    ? 'border-cyan-400 bg-cyan-400'
                    : 'border-slate-700'
                }`}>
                  {selectedMethod === 'telebirr' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: CLEAR PAYMENT INSTRUCTIONS */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                2
              </span>
              Payment Instructions for {currentDestination.name}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Account Name */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Account Name</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="font-bold text-white text-sm">{currentDestination.accountName}</div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentDestination.accountName, 'accountName')}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Copy Account Name"
                  >
                    {copiedField === 'accountName' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Account Number or Phone Number */}
              {selectedMethod === 'bank_of_abyssinia' ? (
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] text-slate-400">Bank Account Number</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="font-mono font-black text-amber-400 text-base">
                      {currentDestination.accountNumber || '155832444'}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentDestination.accountNumber || '155832444', 'accountNumber')}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedField === 'accountNumber' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] text-slate-400">Telebirr Phone Number</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="font-mono font-black text-cyan-400 text-base">
                      {currentDestination.phoneNumber || '0938014055'}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentDestination.phoneNumber || '0938014055', 'phoneNumber')}
                      className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Copy Phone Number"
                    >
                      {copiedField === 'phoneNumber' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
              <span className="font-semibold text-slate-300">Important:</span> Send the funds using your official banking app or Telebirr. Keep the transaction receipt on your screen to take a screenshot.
            </div>
          </div>

          {/* STEP 3: DEPOSIT AMOUNT & OPTIONAL NOTE */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                3
              </span>
              Enter Deposit Amount
            </label>

            <div>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max={user.dailyDepositLimit || 50000}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-xl font-mono font-black text-white focus:outline-none focus:border-emerald-500"
                  placeholder="500"
                  required
                />
                <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">ETB</span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {[100, 250, 500, 1000, 2500, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      amount === val.toString()
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Optional Note / Sender Reference
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
                placeholder="e.g., Transfer from 0938014055 or BoA transaction ID"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* STEP 4: UPLOAD PAYMENT SCREENSHOT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center">
                  4
                </span>
                Upload Payment Screenshot
              </label>
              <span className="text-[11px] text-slate-400">Max 5 MB (JPG, PNG, WebP)</span>
            </div>

            {fileError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {screenshotPreview ? (
              /* Image Preview Card */
              <div className="bg-slate-950 border border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white truncate max-w-[200px]">
                      {screenshotFileName || 'Payment_Screenshot.jpg'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotPreview(null);
                      setScreenshotFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replace Screenshot</span>
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden max-h-64 bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <img
                    src={screenshotPreview}
                    alt="Payment Screenshot Preview"
                    className="max-h-64 object-contain w-full"
                  />
                </div>
              </div>
            ) : (
              /* Drag & Drop Upload Zone */
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2.5 group"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 group-hover:bg-emerald-500/10 border border-slate-700 group-hover:border-emerald-500/30 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">
                    Click to browse or drag & drop screenshot
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Supports JPG, JPEG, PNG, or WebP up to 5 MB
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error message */}
          {submitError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* STEP 5: SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting || !screenshotPreview}
            className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isSubmitting || !screenshotPreview
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-98'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting for Admin Verification...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Submit Deposit ({amount || 0} ETB)</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* DEPOSIT HISTORY SECTION */}
      <div className="border-t border-slate-800 pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>My Deposit Requests ({myDeposits.length})</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {isLoadingDeposits ? (
          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading deposit records...</span>
          </div>
        ) : myDeposits.length === 0 ? (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center text-xs text-slate-500">
            No deposits submitted yet. Follow the steps above to make your first deposit.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {myDeposits.map((dep) => (
              <div
                key={dep.depositId}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">
                      +{dep.amount.toFixed(2)} {dep.currency}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        dep.status === 'APPROVED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : dep.status === 'REJECTED'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {dep.status === 'PENDING' ? 'Waiting Verification' : dep.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{dep.paymentMethodName || dep.paymentMethod}</span>
                    <span>•</span>
                    <span>{new Date(dep.createdAt).toLocaleString()}</span>
                  </div>
                  {dep.adminNote && (
                    <div className="text-[10px] text-slate-400 italic mt-0.5">
                      Note: {dep.adminNote}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptUrl(dep.screenshotUrl)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-emerald-400" />
                    <span>View Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white">Payment Receipt Screenshot</span>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedReceiptUrl}
                alt="Receipt Full View"
                className="max-h-[70vh] object-contain w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
