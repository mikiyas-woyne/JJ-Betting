import {
  DepositRecord,
  DepositStatus,
  ManualPaymentDestination,
  User,
  Wallet,
  WalletTransaction,
  AuditLog,
  Notification
} from '../../src/types';

/**
 * Concurrency Mutex Lock for atomic wallet and deposit processing
 */
class DepositAsyncLock {
  private queues = new Map<string, Promise<void>>();

  public async acquire<T>(key: string, task: () => Promise<T>): Promise<T> {
    const currentQueue = this.queues.get(key) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.queues.set(key, currentQueue.then(() => nextLock));

    try {
      await currentQueue;
      return await task();
    } finally {
      releaseLock!();
      if (this.queues.get(key) === currentQueue.then(() => nextLock)) {
        this.queues.delete(key);
      }
    }
  }
}

export class DepositService {
  private deposits: DepositRecord[] = [];
  private lock = new DepositAsyncLock();

  constructor() {
    this.seedInitialDeposits();
  }

  private seedInitialDeposits() {
    this.deposits = [
      {
        depositId: 'DEP-20260912-8812',
        userId: 'usr_licensed_01',
        username: 'Mikiyas W.',
        paymentMethod: 'telebirr',
        paymentMethodName: 'Telebirr',
        amount: 500,
        currency: 'ETB',
        screenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
        note: 'Sent from 0938014055 at 11:20 AM',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        adminNote: null
      },
      {
        depositId: 'DEP-20260911-5421',
        userId: 'usr_licensed_01',
        username: 'Mikiyas W.',
        paymentMethod: 'bank_of_abyssinia',
        paymentMethodName: 'Bank of Abyssinia',
        amount: 2500,
        currency: 'ETB',
        screenshotUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=800',
        note: 'BoA mobile banking transfer ref #FT262559012',
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        reviewedAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString(),
        reviewedBy: 'mikiyaswoyne@gmail.com',
        adminNote: 'Verified against bank settlement statement'
      }
    ];
  }

  /**
   * Configurable payment destination details
   */
  public getPaymentDestinations(): ManualPaymentDestination[] {
    const boaAccountName = process.env.BOA_ACCOUNT_NAME || 'Mikiyas Woyne Gebresenbet';
    const boaAccountNumber = process.env.BOA_ACCOUNT_NUMBER || '155832444';
    const telebirrAccountName = process.env.TELEBIRR_ACCOUNT_NAME || 'Mikiyas Woyne Gebresenbet';
    const telebirrPhoneNumber = process.env.TELEBIRR_PHONE_NUMBER || '0938014055';

    return [
      {
        id: 'bank_of_abyssinia',
        name: 'Bank of Abyssinia',
        accountName: boaAccountName,
        accountNumber: boaAccountNumber,
        instructions: `Transfer your deposit to Bank of Abyssinia Account ${boaAccountNumber} (${boaAccountName}). Take a screenshot of the confirmation receipt and upload it below.`
      },
      {
        id: 'telebirr',
        name: 'Telebirr',
        accountName: telebirrAccountName,
        phoneNumber: telebirrPhoneNumber,
        instructions: `Send money using Telebirr SuperApp or *127# to ${telebirrPhoneNumber} (${telebirrAccountName}). Take a screenshot of the completed payment SMS or receipt and upload it below.`
      }
    ];
  }

  /**
   * Submit a new deposit request (Always enters PENDING state; NEVER credits balance automatically)
   */
  public async submitDepositRequest(params: {
    user: User;
    paymentMethod: string;
    amount: number;
    screenshotUrl: string;
    note?: string;
    auditLogsRef: AuditLog[];
  }): Promise<DepositRecord> {
    const { user, paymentMethod, amount, screenshotUrl, note, auditLogsRef } = params;

    // Validate amount
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid deposit amount. Must be greater than 0 ETB.');
    }

    if (user.dailyDepositLimit && parsedAmount > user.dailyDepositLimit) {
      throw new Error(`Deposit amount exceeds your daily limit of ${user.dailyDepositLimit} ETB.`);
    }

    // Validate payment method
    const destinations = this.getPaymentDestinations();
    const destination = destinations.find(d => d.id === paymentMethod);
    if (!destination) {
      throw new Error('Invalid payment method selected.');
    }

    // Validate screenshot
    if (!screenshotUrl || typeof screenshotUrl !== 'string' || screenshotUrl.trim().length === 0) {
      throw new Error('Payment screenshot is required for manual verification.');
    }

    // Validate file size and format if base64 data url
    if (screenshotUrl.startsWith('data:image/')) {
      const mimeType = screenshotUrl.split(';')[0].split(':')[1] || '';
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(mimeType.toLowerCase())) {
        throw new Error('Unsupported image format. Accepted formats: JPG, JPEG, PNG, WebP.');
      }

      // 5 MB binary is approx 6.7 MB in base64 string
      if (screenshotUrl.length > 7 * 1024 * 1024) {
        throw new Error('Screenshot exceeds maximum allowed size of 5 MB.');
      }
    }

    const depositId = `DEP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDeposit: DepositRecord = {
      depositId,
      userId: user.id,
      username: user.displayName || user.email.split('@')[0],
      paymentMethod,
      paymentMethodName: destination.name,
      amount: parsedAmount,
      currency: 'ETB',
      screenshotUrl,
      note: note ? note.trim().slice(0, 300) : undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      adminNote: null
    };

    // Store deposit
    this.deposits.unshift(newDeposit);

    // Write audit log
    auditLogsRef.unshift({
      id: `audit-${Date.now()}`,
      actorId: user.id,
      actorEmail: user.email,
      action: 'DEPOSIT_REQUEST_SUBMITTED',
      entityType: 'deposit',
      entityId: depositId,
      details: `Player submitted manual deposit request for ${parsedAmount} ETB via ${destination.name}. Status: PENDING review.`,
      createdAt: new Date().toISOString()
    });

    return newDeposit;
  }

  /**
   * Get deposits with optional filters and role validation
   */
  public getDepositById(depositId: string): DepositRecord | undefined {
    return this.deposits.find(d => d.depositId === depositId);
  }

  public getDeposits(params: {
    userId?: string;
    isAdmin: boolean;
    status?: string;
    search?: string;
  }): DepositRecord[] {
    const { userId, isAdmin, status, search } = params;

    let list = this.deposits;

    // Strict privacy: Customers can only see their own deposits
    if (!isAdmin) {
      list = list.filter(d => d.userId === userId);
    }

    // Status filter
    if (status && status !== 'all') {
      list = list.filter(d => d.status === status.toUpperCase());
    }

    // Search query
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        d.depositId.toLowerCase().includes(q) ||
        d.username.toLowerCase().includes(q) ||
        d.paymentMethod.toLowerCase().includes(q)
      );
    }

    return list;
  }

  /**
   * Calculate summary metrics for the Admin Dashboard
   */
  public getSummary() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const pendingDeposits = this.deposits.filter(d => d.status === 'PENDING').length;

    const approvedToday = this.deposits.filter(d => {
      if (d.status !== 'APPROVED' || !d.reviewedAt) return false;
      return new Date(d.reviewedAt).getTime() >= todayStart;
    }).length;

    const rejectedToday = this.deposits.filter(d => {
      if (d.status !== 'REJECTED' || !d.reviewedAt) return false;
      return new Date(d.reviewedAt).getTime() >= todayStart;
    }).length;

    const totalApprovedAmount = this.deposits
      .filter(d => d.status === 'APPROVED')
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      pendingDeposits,
      approvedToday,
      rejectedToday,
      totalApprovedAmount
    };
  }

  /**
   * APPROVE FLOW (Admin Only, Atomic, Duplicate Protection)
   */
  public async approveDeposit(params: {
    depositId: string;
    adminUser: User;
    wallet: Wallet;
    transactionsRef: WalletTransaction[];
    auditLogsRef: AuditLog[];
    notificationsRef: Notification[];
  }): Promise<{ deposit: DepositRecord; wallet: Wallet; transaction: WalletTransaction }> {
    const { depositId, adminUser, wallet, transactionsRef, auditLogsRef, notificationsRef } = params;

    // Security check: Only admin
    if (adminUser.role !== 'admin' && adminUser.email !== 'mikiyaswoyne@gmail.com') {
      throw new Error('Unauthorized: Only administrators can verify and approve deposits.');
    }

    return await this.lock.acquire(depositId, async () => {
      const deposit = this.deposits.find(d => d.depositId === depositId);
      if (!deposit) {
        throw new Error(`Deposit ${depositId} not found.`);
      }

      // Duplicate approval protection
      if (deposit.status !== 'PENDING') {
        throw new Error(`Deposit is currently ${deposit.status} and cannot be approved again.`);
      }

      // Security check: Player cannot approve their own deposit if they are not explicitly acting as admin
      if (deposit.userId === adminUser.id && adminUser.role !== 'admin') {
        throw new Error('Security violation: Players cannot approve their own deposits.');
      }

      const balanceBefore = wallet.availableBalance;
      const balanceAfter = Math.round((balanceBefore + deposit.amount) * 100) / 100;

      // Update wallet balance atomically
      wallet.availableBalance = balanceAfter;
      wallet.totalDeposited = Math.round((wallet.totalDeposited + deposit.amount) * 100) / 100;
      wallet.updatedAt = new Date().toISOString();

      // Create immutable transaction ledger record
      const txn: WalletTransaction = {
        id: `txn_dep_${Date.now()}_${deposit.depositId}`,
        walletId: 'wlt_01',
        userId: deposit.userId,
        type: 'deposit',
        depositId: deposit.depositId,
        amount: deposit.amount,
        fee: 0,
        balanceBefore,
        balanceAfter,
        status: 'completed',
        referenceId: deposit.depositId,
        description: `Manual Deposit Approved (${deposit.paymentMethodName || deposit.paymentMethod})`,
        paymentMethod: deposit.paymentMethod,
        approvedBy: adminUser.email || adminUser.id,
        createdAt: new Date().toISOString()
      };
      transactionsRef.unshift(txn);

      // Update deposit status
      deposit.status = 'APPROVED';
      deposit.reviewedAt = new Date().toISOString();
      deposit.reviewedBy = adminUser.email || adminUser.id;
      deposit.adminNote = 'Approved by administrator after manual verification';

      // Write audit log
      auditLogsRef.unshift({
        id: `audit-${Date.now()}`,
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: 'MANUAL_DEPOSIT_APPROVED',
        entityType: 'deposit',
        entityId: deposit.depositId,
        details: `Admin ${adminUser.email} approved deposit of ${deposit.amount} ETB for user ${deposit.username}. Credited wallet: ${balanceBefore} -> ${balanceAfter}`,
        createdAt: new Date().toISOString()
      });

      // Send in-app notification to player
      notificationsRef.unshift({
        id: `notif-${Date.now()}`,
        userId: deposit.userId,
        title: 'Deposit Approved',
        message: 'Your deposit has been approved.',
        type: 'deposit',
        read: false,
        createdAt: new Date().toISOString()
      });

      return {
        deposit,
        wallet,
        transaction: txn
      };
    });
  }

  /**
   * REJECT FLOW (Admin Only)
   */
  public async rejectDeposit(params: {
    depositId: string;
    adminUser: User;
    reason?: string;
    auditLogsRef: AuditLog[];
    notificationsRef: Notification[];
  }): Promise<DepositRecord> {
    const { depositId, adminUser, reason, auditLogsRef, notificationsRef } = params;

    // Security check: Only admin
    if (adminUser.role !== 'admin' && adminUser.email !== 'mikiyaswoyne@gmail.com') {
      throw new Error('Unauthorized: Only administrators can reject deposits.');
    }

    return await this.lock.acquire(depositId, async () => {
      const deposit = this.deposits.find(d => d.depositId === depositId);
      if (!deposit) {
        throw new Error(`Deposit ${depositId} not found.`);
      }

      if (deposit.status !== 'PENDING') {
        throw new Error(`Deposit is currently ${deposit.status} and cannot be modified.`);
      }

      // Status becomes REJECTED. Wallet balance DOES NOT change.
      deposit.status = 'REJECTED';
      deposit.reviewedAt = new Date().toISOString();
      deposit.reviewedBy = adminUser.email || adminUser.id;
      deposit.adminNote = reason || 'Deposit rejected: receipt could not be verified.';

      // Write audit log
      auditLogsRef.unshift({
        id: `audit-${Date.now()}`,
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: 'MANUAL_DEPOSIT_REJECTED',
        entityType: 'deposit',
        entityId: deposit.depositId,
        details: `Admin ${adminUser.email} rejected deposit of ${deposit.amount} ETB for user ${deposit.username}. Reason: ${deposit.adminNote}`,
        createdAt: new Date().toISOString()
      });

      // Send in-app notification to player
      notificationsRef.unshift({
        id: `notif-${Date.now()}`,
        userId: deposit.userId,
        title: 'Deposit Rejected',
        message: 'Your deposit was rejected. Please check the deposit details.',
        type: 'deposit',
        read: false,
        createdAt: new Date().toISOString()
      });

      return deposit;
    });
  }
}

export const depositService = new DepositService();
