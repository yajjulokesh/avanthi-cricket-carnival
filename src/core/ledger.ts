import { AuctionSaleRecord, Bucket, Franchise } from './types.js';

export interface FranchiseDerivedState {
  franchiseId: string;
  currentPurse: number;
  totalSpent: number;
  auctionPurchasesCount: number;
  bucketCounts: Record<Bucket, number>;
  purchasedPlayerIds: string[];
}

/**
 * Derives the exact financial and squad state of a franchise from the immutable ledger of sales.
 * Guarantees zero counter drift.
 */
export function deriveFranchiseState(
  franchiseId: string,
  startingPurse: number = 1000,
  salesLedger: AuctionSaleRecord[]
): FranchiseDerivedState {
  const bucketCounts: Record<Bucket, number> = {
    B1: 0,
    B2: 0,
    B3: 0,
    B4: 0,
    B5: 0,
    PG: 0,
  };

  let totalSpent = 0;
  let auctionPurchasesCount = 0;
  const purchasedPlayerIds: string[] = [];

  // Filter ONLY confirmed, active sales
  const activeSales = salesLedger.filter(
    (sale) => sale.franchiseId === franchiseId && sale.status === 'CONFIRMED'
  );

  for (const sale of activeSales) {
    totalSpent += sale.amount;
    auctionPurchasesCount += 1;
    bucketCounts[sale.bucket] = (bucketCounts[sale.bucket] || 0) + 1;
    purchasedPlayerIds.push(sale.playerId);
  }

  const currentPurse = startingPurse - totalSpent;

  return {
    franchiseId,
    currentPurse,
    totalSpent,
    auctionPurchasesCount,
    bucketCounts,
    purchasedPlayerIds,
  };
}

/**
 * Safely undoes an auction sale record (§12.4, Appendix A.4)
 * - Returns an error if the sale does not exist or has already been undone (prevents double refund)
 * - Marks the sale as UNDONE with audit timestamp and reason
 * - Does not mutate historical records in place destructively
 */
export function undoSale(
  salesLedger: AuctionSaleRecord[],
  saleId: string,
  undoneBy: string,
  reason: string
): {
  success: boolean;
  error?: string;
  updatedLedger: AuctionSaleRecord[];
  undoneSale?: AuctionSaleRecord;
} {
  const saleIndex = salesLedger.findIndex((s) => s.id === saleId);
  if (saleIndex === -1) {
    return {
      success: false,
      error: `Sale with ID ${saleId} not found in ledger.`,
      updatedLedger: salesLedger,
    };
  }

  const existingSale = salesLedger[saleIndex];
  if (existingSale.status === 'UNDONE') {
    return {
      success: false,
      error: `Sale ${saleId} has already been undone. Duplicate undo rejected (no double refund).`,
      updatedLedger: salesLedger,
    };
  }

  const undoneSale: AuctionSaleRecord = {
    ...existingSale,
    status: 'UNDONE',
    undoneAt: new Date().toISOString(),
    undoneBy,
    undoReason: reason,
  };

  const updatedLedger = [...salesLedger];
  updatedLedger[saleIndex] = undoneSale;

  return {
    success: true,
    updatedLedger,
    undoneSale,
  };
}
