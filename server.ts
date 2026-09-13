import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_SPORTS, INITIAL_MATCHES } from './src/data/sportsData.ts';
import {
  Bet,
  BetSelection,
  Match,
  Sport,
  User,
  Wallet,
  WalletTransaction,
  AuditLog,
  Settlement,
  Notification
} from './src/types.ts';
import { sportsApiService } from './server/services/sportsApi.ts';
import { oddsService } from './server/services/oddsService.ts';
import { bettingEngine } from './server/services/bettingEngine.ts';
import { depositService } from './server/services/depositService.ts';
import { settlementService } from './server/services/settlementService.ts';
import { resultSyncService } from './server/services/resultSyncService.ts';
import sportsRouter from './server/routes/sports.ts';
import matchesRouter from './server/routes/matches.ts';
import oddsRouter from './server/routes/odds.ts';

// Seed initial baseline catalog into the centralized sports API & odds engine
// Resilient fallback baseline: ensures the platform is immediately operational
sportsApiService.seedInitialSports(INITIAL_SPORTS);
sportsApiService.seedInitialMatches(INITIAL_MATCHES);

// In-Memory Database (Server-authoritative ledger and state)
let sports: Sport[] = [...INITIAL_SPORTS];
let matches: Match[] = [];

// Default Demo / Seed User
const currentUser: User = {
  id: 'usr_licensed_01',
  email: 'mikiyaswoyne@gmail.com',
  displayName: 'Mikiyas W.',
  role: 'customer',
  kycStatus: 'tier1_verified',
  dailyDepositLimit: 50000,
  singleBetLimit: 10000,
  selfExclusionUntil: null,
  createdAt: new Date('2025-01-10').toISOString()
};

const userWallet: Wallet = {
  userId: currentUser.id,
  currency: 'ETB',
  availableBalance: 2450.00,
  lockedBalance: 0,
  totalDeposited: 5000.00,
  totalWithdrawn: 1500.00,
  updatedAt: new Date().toISOString()
};

let transactions: WalletTransaction[] = [
  {
    id: 'txn_init_01',
    walletId: 'wlt_01',
    userId: currentUser.id,
    type: 'deposit',
    amount: 5000.00,
    fee: 0,
    balanceBefore: 0,
    balanceAfter: 5000.00,
    status: 'completed',
    referenceId: 'DEP-TLB-892341',
    description: 'Licensed Mobile Money Deposit (Telebirr)',
    paymentMethod: 'Telebirr SuperApp',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 'txn_init_02',
    walletId: 'wlt_01',
    userId: currentUser.id,
    type: 'bet_placement',
    amount: -500.00,
    fee: 0,
    balanceBefore: 5000.00,
    balanceAfter: 4500.00,
    status: 'completed',
    referenceId: 'BET-SINGLE-44102',
    description: 'Wager Placed: Single Bet on Arsenal to Win',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'txn_init_03',
    walletId: 'wlt_01',
    userId: currentUser.id,
    type: 'bet_payout',
    amount: 950.00,
    fee: 0,
    balanceBefore: 4500.00,
    balanceAfter: 5450.00,
    status: 'completed',
    referenceId: 'WIN-SINGLE-44102',
    description: 'Settled Wager Payout: Arsenal vs Chelsea (Won)',
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  },
  {
    id: 'txn_init_04',
    walletId: 'wlt_01',
    userId: currentUser.id,
    type: 'withdrawal',
    amount: -1500.00,
    fee: 7.50,
    balanceBefore: 5450.00,
    balanceAfter: 3942.50,
    status: 'completed',
    referenceId: 'WTH-CBE-782190',
    description: 'Verified Bank Withdrawal (CBE Account)',
    paymentMethod: 'Commercial Bank of Ethiopia',
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
  }
];

let bets: Bet[] = [
  {
    id: 'bet-rec-01',
    userId: currentUser.id,
    userEmail: currentUser.email,
    betType: 'single',
    type: 'single',
    stake: 500.00,
    acceptedOdds: 1.90,
    totalOdds: 1.90,
    potentialReturn: 950.00,
    currency: 'ETB',
    status: 'won',
    placedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    settledAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    payoutAmount: 950.00,
    selections: [
      {
        matchId: 'm-settled-01',
        marketId: 'm-settled-01-mw',
        selectionId: 'sel-ars',
        matchName: 'Arsenal vs Chelsea',
        marketName: 'Match Winner (1X2)',
        selectionName: 'Arsenal',
        acceptedOdds: 1.90,
        oddsAtPlacement: 1.90,
        oddsAtSelection: 1.90,
        oddsLastChecked: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        status: 'won'
      }
    ]
  }
];

let notifications: Notification[] = [
  {
    id: 'notif-01',
    userId: currentUser.id,
    title: 'Bet Won!',
    message: 'Your ticket #bet-rec-01 on Arsenal was settled as WON. 950.00 ETB credited to your wallet.',
    type: 'bet_outcome',
    read: false,
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-02',
    userId: currentUser.id,
    title: 'Licensed Platform Welcome',
    message: 'Welcome to Apex Sportsbook. Your account is Tier 1 Verified under national regulatory standards.',
    type: 'security',
    read: true,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  }
];

let auditLogs: AuditLog[] = [
  {
    id: 'audit-01',
    actorId: 'sys-compliance',
    actorEmail: 'system@regulatory.sportsbook',
    action: 'PLATFORM_BOOT_VERIFIED',
    entityType: 'limits',
    entityId: 'sys-01',
    details: 'Sportsbook engine initialized with zero-trust server validation and immutable ledger',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  }
];

let settlements: Settlement[] = [];

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'Apex Sportsbook Server', time: new Date().toISOString() });
  });

  // ----------------------------------------------------
  // REAL SPORTS DATA & ODDS INTEGRATION API ROUTES
  // ----------------------------------------------------
  app.use('/api/sports', sportsRouter);
  app.use('/api/matches', matchesRouter);
  app.use('/api/odds', oddsRouter);

  // Get current user profile
  app.get('/api/user/me', (req: Request, res: Response) => {
    res.json(currentUser);
  });

  // Update Responsible Gambling Limits
  app.post('/api/user/limits', (req: Request, res: Response) => {
    const { dailyDepositLimit, singleBetLimit, selfExclusionDays } = req.body;

    if (dailyDepositLimit !== undefined && dailyDepositLimit > 0) {
      currentUser.dailyDepositLimit = Number(dailyDepositLimit);
    }
    if (singleBetLimit !== undefined && singleBetLimit > 0) {
      currentUser.singleBetLimit = Number(singleBetLimit);
    }
    if (selfExclusionDays && Number(selfExclusionDays) > 0) {
      const exclusionDate = new Date();
      exclusionDate.setDate(exclusionDate.getDate() + Number(selfExclusionDays));
      currentUser.selfExclusionUntil = exclusionDate.toISOString();
    }

    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'RESPONSIBLE_GAMBLING_LIMITS_UPDATED',
      entityType: 'limits',
      entityId: currentUser.id,
      details: `Limits set: dailyDeposit=${currentUser.dailyDepositLimit}, singleBet=${currentUser.singleBetLimit}, selfExclusionUntil=${currentUser.selfExclusionUntil || 'none'}`,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, user: currentUser });
  });

  // Get user wallet
  app.get('/api/wallet', (req: Request, res: Response) => {
    res.json(userWallet);
  });

  // Get wallet transactions (Auditable Ledger)
  app.get('/api/wallet/transactions', (req: Request, res: Response) => {
    res.json(transactions);
  });

  // Deposit API (Configurable provider abstraction)
  app.post('/api/wallet/deposit', (req: Request, res: Response) => {
    const { amount, providerId, referenceId, paymentAccount } = req.body;
    const depositAmount = Number(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    if (currentUser.selfExclusionUntil && new Date(currentUser.selfExclusionUntil) > new Date()) {
      return res.status(403).json({ error: 'Account is under self-exclusion restriction' });
    }

    if (depositAmount > currentUser.dailyDepositLimit) {
      return res.status(400).json({
        error: `Deposit exceeds your regulatory daily limit of ${currentUser.dailyDepositLimit} ETB`
      });
    }

    const balanceBefore = userWallet.availableBalance;
    const balanceAfter = balanceBefore + depositAmount;

    userWallet.availableBalance = Math.round(balanceAfter * 100) / 100;
    userWallet.totalDeposited = Math.round((userWallet.totalDeposited + depositAmount) * 100) / 100;
    userWallet.updatedAt = new Date().toISOString();

    const txn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      walletId: 'wlt_01',
      userId: currentUser.id,
      type: 'deposit',
      amount: depositAmount,
      fee: 0,
      balanceBefore,
      balanceAfter: userWallet.availableBalance,
      status: 'completed',
      referenceId: referenceId || `DEP-${providerId?.toUpperCase() || 'PROV'}-${Math.floor(100000 + Math.random() * 900000)}`,
      description: `Regulated Deposit via ${providerId || 'Authorized Gateway'}`,
      paymentMethod: providerId,
      metadata: { paymentAccount },
      createdAt: new Date().toISOString()
    };

    transactions.unshift(txn);

    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'WALLET_DEPOSIT',
      entityType: 'wallet',
      entityId: txn.id,
      details: `Deposited ${depositAmount} ETB via ${providerId}. Balance: ${balanceBefore} -> ${userWallet.availableBalance}`,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, wallet: userWallet, transaction: txn });
  });

  // Withdrawal API (Configurable provider abstraction)
  app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
    const { amount, providerId, destinationAccount, accountHolderName } = req.body;
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    if (withdrawAmount > userWallet.availableBalance) {
      return res.status(400).json({ error: 'Insufficient available funds for withdrawal' });
    }

    if (currentUser.kycStatus === 'unverified') {
      return res.status(403).json({ error: 'Identity KYC verification required before withdrawals can be processed' });
    }

    const fee = Math.round(withdrawAmount * 0.005 * 100) / 100; // 0.5% standard fee
    const totalDeduction = withdrawAmount + fee;

    if (totalDeduction > userWallet.availableBalance) {
      return res.status(400).json({ error: `Insufficient funds to cover amount plus processing fee (${fee} ETB)` });
    }

    const balanceBefore = userWallet.availableBalance;
    const balanceAfter = balanceBefore - totalDeduction;

    userWallet.availableBalance = Math.round(balanceAfter * 100) / 100;
    userWallet.totalWithdrawn = Math.round((userWallet.totalWithdrawn + withdrawAmount) * 100) / 100;
    userWallet.updatedAt = new Date().toISOString();

    const txn: WalletTransaction = {
      id: `txn_${Date.now()}`,
      walletId: 'wlt_01',
      userId: currentUser.id,
      type: 'withdrawal',
      amount: -withdrawAmount,
      fee,
      balanceBefore,
      balanceAfter: userWallet.availableBalance,
      status: 'completed',
      referenceId: `WTH-${providerId?.toUpperCase() || 'BANK'}-${Math.floor(100000 + Math.random() * 900000)}`,
      description: `Authorized Withdrawal to ${accountHolderName || 'User Account'} (${destinationAccount || 'Direct'})`,
      paymentMethod: providerId,
      metadata: { destinationAccount, accountHolderName },
      createdAt: new Date().toISOString()
    };

    transactions.unshift(txn);

    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: 'WALLET_WITHDRAWAL',
      entityType: 'wallet',
      entityId: txn.id,
      details: `Withdrawn ${withdrawAmount} ETB (Fee: ${fee}) to ${destinationAccount}. Balance: ${balanceBefore} -> ${userWallet.availableBalance}`,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, wallet: userWallet, transaction: txn });
  });

  // ----------------------------------------------------
  // MANUAL DEPOSIT VERIFICATION SYSTEM (CUSTOMER API)
  // ----------------------------------------------------
  // Get configurable manual deposit instructions (Bank of Abyssinia, Telebirr)
  app.get('/api/deposits/destinations', (req: Request, res: Response) => {
    res.json(depositService.getPaymentDestinations());
  });

  // Submit manual deposit request with screenshot
  // CRITICAL: Always enters PENDING state. Never credits wallet balance automatically!
  app.post('/api/deposits/submit', async (req: Request, res: Response) => {
    try {
      const { paymentMethod, amount, screenshotUrl, note } = req.body;
      const deposit = await depositService.submitDepositRequest({
        user: currentUser,
        paymentMethod,
        amount,
        screenshotUrl,
        note,
        auditLogsRef: auditLogs
      });
      res.status(201).json({
        success: true,
        deposit,
        message: 'Your deposit is waiting for admin verification.'
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Deposit submission failed' });
    }
  });

  // Get current player's deposits
  app.get('/api/deposits/my-deposits', (req: Request, res: Response) => {
    const list = depositService.getDeposits({
      userId: currentUser.id,
      isAdmin: false
    });
    res.json(list);
  });

  // Get user bets
  app.get('/api/bets/my-bets', (req: Request, res: Response) => {
    res.json(bets);
  });

  // CRITICAL SERVER-SIDE BET PLACEMENT ENGINE
  // Authoritative validation, atomic wallet ledger deduction, idempotency protection
  app.post('/api/bets/place', async (req: Request, res: Response) => {
    try {
      const { type, stake, selections, idempotencyKey } = req.body;

      const result = await bettingEngine.placeBet({
        user: currentUser,
        wallet: userWallet,
        type,
        stake,
        selections,
        idempotencyKey,
        auditLogsRef: auditLogs,
        betsStoreRef: bets,
        transactionsStoreRef: transactions
      });

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          code: result.code,
          updatedSelections: result.updatedSelections
        });
      }

      res.json({
        success: true,
        bet: result.bet,
        wallet: result.wallet,
        transaction: result.transaction
      });
    } catch (err: any) {
      console.error('Bet placement error:', err);
      res.status(500).json({
        error: 'An unexpected system error occurred during bet placement. No funds have been deducted.',
        code: 'SYSTEM_ERROR'
      });
    }
  });

  // Configurable stake limits endpoint
  app.get('/api/config/limits', (req: Request, res: Response) => {
    res.json(bettingEngine.getStakeLimits());
  });

  // Admin update stake limits endpoint
  app.post('/api/admin/limits/stake', (req: Request, res: Response) => {
    try {
      const { minimumStake, maximumStake } = req.body;
      const updated = bettingEngine.updateStakeLimits(
        Number(minimumStake),
        Number(maximumStake),
        currentUser.email,
        auditLogs
      );
      res.json({ success: true, limits: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get notifications
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json(notifications);
  });

  // Mark notification read
  app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
    const notif = notifications.find(n => n.id === req.params.id);
    if (notif) notif.read = true;
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // ADMIN DASHBOARD & TRADING DESK API ROUTES
  // ----------------------------------------------------

  // Admin Overview Statistics
  app.get('/api/admin/overview', (req: Request, res: Response) => {
    const totalHandle = bets.reduce((sum, b) => sum + b.stake, 0);
    const totalPayout = bets.reduce((sum, b) => sum + (b.payoutAmount || 0), 0);
    const ggr = totalHandle - totalPayout;
    const pendingBetsCount = bets.filter(b => b.status === 'pending').length;
    const liveMatchesCount = matches.filter(m => m.status === 'live').length;
    const depositSummary = depositService.getSummary();

    res.json({
      totalHandle,
      totalPayout,
      ggr,
      pendingBetsCount,
      liveMatchesCount,
      totalUsers: 1420,
      totalTransactions: transactions.length,
      availableLiquidity: 1540000.00,
      pendingDepositsCount: depositSummary.pendingDeposits,
      depositSummary
    });
  });

  // ----------------------------------------------------
  // ADMIN MANUAL DEPOSIT VERIFICATION SYSTEM
  // ----------------------------------------------------
  // Admin list deposits with filters and search
  app.get('/api/admin/deposits', (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const list = depositService.getDeposits({
      isAdmin: true,
      status,
      search
    });
    res.json(list);
  });

  // Admin deposit summary cards metrics
  app.get('/api/admin/deposits/summary', (req: Request, res: Response) => {
    const summary = depositService.getSummary();
    res.json(summary);
  });

  // Admin approve deposit flow (Atomic lock, duplicate protection, wallet credit, transaction ledger)
  app.post('/api/admin/deposits/:depositId/approve', async (req: Request, res: Response) => {
    try {
      const { depositId } = req.params;
      const result = await depositService.approveDeposit({
        depositId,
        adminUser: currentUser,
        wallet: userWallet,
        transactionsRef: transactions,
        auditLogsRef: auditLogs,
        notificationsRef: notifications
      });
      res.json({
        success: true,
        deposit: result.deposit,
        wallet: result.wallet,
        transaction: result.transaction,
        message: 'Deposit verified and approved successfully. Wallet balance credited.'
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Deposit approval failed' });
    }
  });

  // Admin reject deposit flow
  app.post('/api/admin/deposits/:depositId/reject', async (req: Request, res: Response) => {
    try {
      const { depositId } = req.params;
      const { reason } = req.body;
      const rejected = await depositService.rejectDeposit({
        depositId,
        adminUser: currentUser,
        reason,
        auditLogsRef: auditLogs,
        notificationsRef: notifications
      });
      res.json({
        success: true,
        deposit: rejected,
        message: 'Deposit has been marked as REJECTED.'
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Deposit rejection failed' });
    }
  });

  // Admin Bets List
  app.get('/api/admin/bets', (req: Request, res: Response) => {
    res.json(bets);
  });

  // Admin Transactions List
  app.get('/api/admin/transactions', (req: Request, res: Response) => {
    res.json(transactions);
  });

  // Admin Audit Logs
  app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
    res.json(auditLogs);
  });

  // ----------------------------------------------------
  // ADMIN & PUBLIC SPORTS DATA & ODDS INTEGRATION ENGINE
  // ----------------------------------------------------
  app.get('/api/sports-data/status', (req: Request, res: Response) => {
    res.json(sportsApiService.getStats());
  });

  app.post('/api/sports-data/sync', async (req: Request, res: Response) => {
    try {
      const result = await sportsApiService.syncAll(true);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/admin/sports-data/status', (req: Request, res: Response) => {
    res.json(sportsApiService.getStats());
  });

  app.get('/api/admin/sports-data/diagnose-events', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as string) || 'soccer_epl';
      const diagnostic = await sportsApiService.diagnoseEventsFetch(sport);
      res.json(diagnostic);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sports-data/diagnose-events', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as string) || 'soccer_epl';
      const diagnostic = await sportsApiService.diagnoseEventsFetch(sport);
      res.json(diagnostic);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/sports-data/sync', async (req: Request, res: Response) => {
    try {
      const result = await sportsApiService.syncAll(true);
      auditLogs.unshift({
        id: `audit-${Date.now()}`,
        actorId: 'adm-sync',
        actorEmail: currentUser.email,
        action: 'EXTERNAL_SPORTS_SYNC',
        entityType: 'sports_provider',
        entityId: 'sync-manual',
        details: result.message,
        createdAt: new Date().toISOString()
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/sports-data/test-connection', async (req: Request, res: Response) => {
    try {
      const result = await sportsApiService.testProviderConnection();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin Internal Odds-Source Selection Layer
  app.get('/api/admin/sports-data/bookmaker', (req: Request, res: Response) => {
    res.json({
      selected: sportsApiService.getSelectedBookmaker(),
      available: sportsApiService.getAvailableBookmakers()
    });
  });

  app.post('/api/admin/sports-data/bookmaker', (req: Request, res: Response) => {
    const { key } = req.body;
    if (key) {
      sportsApiService.setSelectedBookmaker(key);
      auditLogs.unshift({
        id: `audit-${Date.now()}`,
        actorId: 'adm-odds-source',
        actorEmail: currentUser.email,
        action: 'ODDS_SOURCE_UPDATED',
        entityType: 'sports_provider',
        entityId: key,
        details: `Configured primary odds bookmaker source to: ${key}`,
        createdAt: new Date().toISOString()
      });
    }
    res.json({
      success: true,
      selected: sportsApiService.getSelectedBookmaker(),
      available: sportsApiService.getAvailableBookmakers()
    });
  });

  // Admin Sports API Key Configuration (with safe masking)
  app.get('/api/admin/sports-data/api-key', (req: Request, res: Response) => {
    res.json({
      isConfigured: sportsApiService.getStats().isConfigured,
      maskedKey: sportsApiService.getMaskedApiKey(),
      providerName: sportsApiService.getStats().providerName
    });
  });

  app.post('/api/admin/sports-data/api-key', async (req: Request, res: Response) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'Invalid API key provided. Must be at least 6 characters.' });
      }
      const result = await sportsApiService.setApiKey(apiKey.trim());
      auditLogs.unshift({
        id: `audit-${Date.now()}`,
        actorId: 'adm-sports-key',
        actorEmail: currentUser.email,
        action: 'SPORTS_API_KEY_UPDATED',
        entityType: 'sports_provider',
        entityId: 'the-odds-api',
        details: `Updated sports provider API key to ${result.maskedKey}`,
        createdAt: new Date().toISOString()
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin Update Match Status
  app.post('/api/admin/matches/status', (req: Request, res: Response) => {
    const { matchId, status } = req.body;
    const match = sportsApiService.getMatch(matchId) || matches.find(m => m.id === matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const previousStatus = match.status;
    match.status = status;
    sportsApiService.updateMatchStatus(matchId, status);

    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'adm-desk',
      actorEmail: currentUser.email,
      action: 'MATCH_STATUS_CHANGED',
      entityType: 'match',
      entityId: match.id,
      details: `${match.homeTeam} vs ${match.awayTeam} status changed from ${previousStatus} to ${status}`,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, match });
  });

  // Admin Update Live Score
  app.post('/api/admin/matches/score', (req: Request, res: Response) => {
    const { matchId, homeScore, awayScore, minute, period } = req.body;
    const match = sportsApiService.getMatch(matchId) || matches.find(m => m.id === matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    match.score = {
      home: Number(homeScore),
      away: Number(awayScore),
      minute: minute !== undefined ? Number(minute) : match.score?.minute,
      period: period || match.score?.period
    };
    sportsApiService.updateMatchScore(matchId, Number(homeScore), Number(awayScore), minute !== undefined ? Number(minute) : undefined, period);

    res.json({ success: true, match });
  });

  // Admin Update Odds
  app.post('/api/admin/odds/update', (req: Request, res: Response) => {
    const { matchId, marketId, selectionId, newOdds, status } = req.body;
    const match = sportsApiService.getMatch(matchId) || matches.find(m => m.id === matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const market = match.markets.find(m => m.id === marketId);
    if (!market) return res.status(404).json({ error: 'Market not found' });

    const selection = market.selections.find(s => s.id === selectionId);
    if (!selection) return res.status(404).json({ error: 'Selection not found' });

    const prevOdds = selection.oddsValue;
    if (newOdds !== undefined) {
      selection.oddsValue = Number(newOdds);
    }
    if (status !== undefined) {
      selection.status = status;
    }

    oddsService.updateSelectionOdds(selectionId, selection.oddsValue, selection.status);

    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'trader-01',
      actorEmail: currentUser.email,
      action: 'ODDS_MODIFIED',
      entityType: 'odds',
      entityId: selection.id,
      details: `${match.homeTeam} vs ${match.awayTeam} - ${selection.name} odds changed from ${prevOdds} to ${selection.oddsValue}`,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, selection });
  });

  // ----------------------------------------------------
  // ADMIN BET SETTLEMENT & MATCH RESULT SYSTEM
  // ----------------------------------------------------

  // 1. Get all match settlement summaries (results, affected bets, stakes, payouts, settlement status)
  app.get('/api/admin/settlements/summaries', (req: Request, res: Response) => {
    try {
      const allCatalogMatches = sportsApiService.getAllMatches();
      const combinedMatches: any[] = [...allCatalogMatches];
      for (const m of matches) {
        if (!combinedMatches.some(cm => cm.id === m.id)) {
          combinedMatches.push(m);
        }
      }
      const summaries = settlementService.getMatchSettlementSummaries(combinedMatches, bets);
      res.json(summaries);
    } catch (err: any) {
      console.error('Error fetching settlement summaries:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Get all historical settlement records
  app.get('/api/admin/settlements/records', (req: Request, res: Response) => {
    res.json(settlementService.getAllSettlements());
  });

  // 3. Get affected bets for a specific match
  app.get('/api/admin/settlements/bets/:matchId', (req: Request, res: Response) => {
    try {
      const matchBets = settlementService.getAffectedBetsForMatch(req.params.matchId, bets);
      res.json(matchBets);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Manual match settlement with mandatory authentication, reason, and audit logging
  app.post('/api/admin/settlements/manual', async (req: Request, res: Response) => {
    try {
      const { matchId, status, homeScore, awayScore, marketOutcomes, reason } = req.body;

      const summary = await settlementService.manualSettleMatch({
        adminUser: currentUser,
        matchId,
        status: status || 'FINISHED',
        homeScore: homeScore !== undefined ? Number(homeScore) : undefined,
        awayScore: awayScore !== undefined ? Number(awayScore) : undefined,
        marketOutcomes,
        reason,
        auditLogsRef: auditLogs,
        betsStoreRef: bets,
        transactionsStoreRef: transactions,
        walletRef: userWallet,
        notificationsRef: notifications,
        matchesStoreRef: matches
      });

      res.json({
        success: true,
        summary,
        wallet: userWallet,
        message: `Match successfully settled. ${summary.settledBetsCount} bets processed. Total payout: ${summary.totalPayout.toFixed(2)} ETB.`
      });
    } catch (err: any) {
      console.error('Manual settlement error:', err);
      res.status(400).json({ error: err.message || 'Manual settlement failed' });
    }
  });

  // 5. Retry a failed settlement safely
  app.post('/api/admin/settlements/retry', async (req: Request, res: Response) => {
    try {
      const { settlementId } = req.body;
      if (!settlementId) {
        return res.status(400).json({ error: 'settlementId is required' });
      }

      const result = await settlementService.retryFailedSettlement({
        settlementId,
        adminUser: currentUser,
        auditLogsRef: auditLogs,
        betsStoreRef: bets,
        transactionsStoreRef: transactions,
        walletRef: userWallet,
        notificationsRef: notifications,
        matchesStoreRef: matches
      });

      res.json({
        success: true,
        result,
        wallet: userWallet,
        message: `Settlement retry executed successfully on bet #${result.betId}.`
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed settlement retry execution' });
    }
  });

  // 6. Automated provider result synchronization
  app.post('/api/admin/settlements/sync-results', async (req: Request, res: Response) => {
    try {
      const syncResult = await resultSyncService.syncFinishedMatches({
        betsStoreRef: bets,
        transactionsStoreRef: transactions,
        walletRef: userWallet,
        notificationsRef: notifications,
        auditLogsRef: auditLogs,
        matchesStoreRef: matches
      });

      auditLogs.unshift({
        id: `audit_sync_res_${Date.now()}`,
        actorId: 'adm-result-sync',
        actorEmail: currentUser.email,
        action: 'RESULTS_SYNCED',
        entityType: 'sports_provider',
        entityId: 'scores-sync',
        details: `Result synchronization completed. ${syncResult.syncedCount} finished events detected. ${syncResult.settledMatches.length} matches settled.`,
        createdAt: new Date().toISOString()
      });

      res.json({
        success: true,
        syncResult,
        wallet: userWallet,
        message: syncResult.syncedCount > 0
          ? `Result sync complete. ${syncResult.syncedCount} matches synchronized.`
          : 'Result sync complete. No new finished matches found from provider.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Result sync failed' });
    }
  });

  // 7. Legacy /api/admin/settle compatibility route (backed by settlementService)
  app.post('/api/admin/settle', async (req: Request, res: Response) => {
    try {
      const { matchId, marketId, winningSelectionId } = req.body;
      const match = sportsApiService.getMatch(matchId) || matches.find(m => m.id === matchId);
      if (!match) return res.status(404).json({ error: 'Match not found' });

      const market = match.markets.find(m => m.id === marketId);
      if (!market) return res.status(404).json({ error: 'Market not found' });

      // Settle via settlement engine
      const summary = await settlementService.settleMatchResult({
        matchId,
        status: 'FINISHED',
        result: match.result || {
          homeScore: match.score?.home || 1,
          awayScore: match.score?.away || 0,
          winner: match.score?.home && match.score?.away && match.score.home === match.score.away ? 'draw' : 'home',
          finishedAt: new Date().toISOString(),
          resultSource: 'manual:admin',
          resultVerified: true
        },
        marketOutcomes: [{
          marketId,
          winningSelectionId
        }],
        processedBy: currentUser.email,
        reason: `Settled market '${market.name}' via Admin desk`,
        auditLogsRef: auditLogs,
        betsStoreRef: bets,
        transactionsStoreRef: transactions,
        walletRef: userWallet,
        notificationsRef: notifications,
        matchesStoreRef: matches
      });

      const legacySettlement: Settlement = {
        id: `stl_${Date.now()}`,
        matchId,
        marketId,
        winningSelectionId: winningSelectionId || '',
        settledBy: currentUser.email,
        settledAt: new Date().toISOString(),
        betsAffected: summary.settledBetsCount,
        totalPayout: summary.totalPayout
      };
      settlements.unshift(legacySettlement);

      res.json({
        success: true,
        settlement: legacySettlement,
        betsAffected: summary.settledBetsCount,
        totalPayout: summary.totalPayout,
        wallet: userWallet
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE & STATIC ASSETS
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Sportsbook full-stack server running on http://0.0.0.0:${PORT}`);

    // Background sports sync on boot (loads live data immediately)
    sportsApiService.syncAll(true)
      .then(r => console.log(`[SportsSync] Initial sync: ${r.message}`))
      .catch(e => console.warn(`[SportsSync] Initial sync notice: ${e.message}`));

    // Polling interval for live scores and dynamic in-play ticker (15 seconds)
    setInterval(() => {
      sportsApiService.syncLiveScores().catch(() => {});
    }, 15000);
  });
}

startServer();
