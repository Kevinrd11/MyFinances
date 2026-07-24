import type { TransactionType, TransferDirection } from "@prisma/client";

export function transactionSign(
  type: TransactionType,
  transferDirection: TransferDirection | null,
) {
  if (type === "INCOME") return 1;
  if (type === "TRANSFER") return transferDirection === "IN" ? 1 : -1;
  return -1;
}

export function calculateAccountBalance(
  initialBalance: number,
  transactions: {
    amount: number;
    type: TransactionType;
    transferDirection: TransferDirection | null;
  }[],
) {
  return transactions.reduce(
    (balance, transaction) =>
      balance +
      transaction.amount * transactionSign(transaction.type, transaction.transferDirection),
    initialBalance,
  );
}
