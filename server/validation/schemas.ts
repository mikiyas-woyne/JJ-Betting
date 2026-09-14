import { z } from 'zod';

export const depositSchema = z.object({
  amount: z.number()
    .positive('Deposit amount must be a positive number')
    .max(1000000, 'Deposit exceeds maximum allowable transaction limit'),
  providerId: z.string().optional(),
  referenceId: z.string().optional(),
  paymentAccount: z.string().optional()
});

export const withdrawSchema = z.object({
  amount: z.number()
    .positive('Withdrawal amount must be a positive number')
    .max(1000000, 'Withdrawal exceeds maximum allowable transaction limit'),
  providerId: z.string().optional(),
  destinationAccount: z.string().optional(),
  accountHolderName: z.string().optional()
});

export const betSelectionSchema = z.object({
  matchId: z.string().min(1, 'matchId is required'),
  marketId: z.string().min(1, 'marketId is required'),
  selectionId: z.string().min(1, 'selectionId is required'),
  matchName: z.string().optional(),
  marketName: z.string().optional(),
  selectionName: z.string().optional(),
  acceptedOdds: z.number().positive('Odds must be positive'),
  oddsAtPlacement: z.number().optional(),
  oddsAtSelection: z.number().optional()
});

export const placeBetSchema = z.object({
  type: z.enum(['single', 'multiple']).default('single'),
  stake: z.number()
    .positive('Stake must be a positive number')
    .min(1, 'Minimum stake is 1 ETB'),
  selections: z.array(betSelectionSchema).min(1, 'At least one match selection is required'),
  idempotencyKey: z.string().optional()
});
