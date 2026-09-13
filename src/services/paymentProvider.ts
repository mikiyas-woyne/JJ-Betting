import { PaymentProvider } from '../types';

export interface DepositRequest {
  userId: string;
  amount: number;
  currency: string;
  customerPhoneOrEmail: string;
  referenceId: string;
  callbackUrl?: string;
}

export interface DepositResult {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  paymentUrl?: string;
  instructions?: string;
  requiresRedirect: boolean;
  providerReference?: string;
}

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  currency: string;
  destinationAccount: string;
  accountHolderName: string;
  referenceId: string;
}

export interface WithdrawalResult {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  providerReference?: string;
  estimatedSettlementMinutes: number;
  message: string;
}

export interface IPaymentGateway {
  readonly providerId: string;
  readonly providerName: string;
  isConfigured(): boolean;
  getMetadata(): PaymentProvider;
  initiateDeposit(req: DepositRequest): Promise<DepositResult>;
  initiateWithdrawal(req: WithdrawalRequest): Promise<WithdrawalResult>;
}

/**
 * Clean licensed payment provider catalog abstraction.
 * Real licensed API secrets remain securely on the server side via environment variables.
 */
export const AVAILABLE_PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: 'telebirr',
    name: 'Telebirr SuperApp',
    description: 'Licensed mobile money payment for Ethiopia (ETB)',
    supportedCurrencies: ['ETB'],
    status: 'sandbox',
    depositFeePercent: 0,
    withdrawalFeePercent: 0.5,
    minDeposit: 50,
    maxDeposit: 100000,
    minWithdrawal: 100,
    maxWithdrawal: 50000,
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    description: 'Commercial Bank of Ethiopia direct payment service',
    supportedCurrencies: ['ETB'],
    status: 'sandbox',
    depositFeePercent: 0,
    withdrawalFeePercent: 0,
    minDeposit: 100,
    maxDeposit: 200000,
    minWithdrawal: 200,
    maxWithdrawal: 100000,
  },
  {
    id: 'chapa',
    name: 'Chapa Direct Pay',
    description: 'Licensed payment gateway (Cards, Wallets, Local Banks)',
    supportedCurrencies: ['ETB', 'USD'],
    status: 'awaiting_credentials',
    depositFeePercent: 1.5,
    withdrawalFeePercent: 1.0,
    minDeposit: 50,
    maxDeposit: 150000,
    minWithdrawal: 100,
    maxWithdrawal: 50000,
  },
  {
    id: 'bank_transfer',
    name: 'Direct Bank Settlement (National Wire)',
    description: 'Regulated direct wire transfer with automated AML verification',
    supportedCurrencies: ['ETB'],
    status: 'active',
    depositFeePercent: 0,
    withdrawalFeePercent: 0,
    minDeposit: 500,
    maxDeposit: 500000,
    minWithdrawal: 500,
    maxWithdrawal: 250000,
  }
];
