-- Defense in depth for a restricted PostgreSQL runtime role.
-- The application must set `app.current_user_id` locally for each transaction.
-- Prisma's development owner keeps BYPASSRLS semantics so migrations and seeds work.

ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TourType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tour" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebProject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavingsGoal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GoalContribution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Debt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DebtPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecurringTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExchangeRate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MonthlyClosing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialNote" ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_owner ON "Account"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY category_owner ON "Category"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY tag_owner ON "Tag"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY transaction_owner ON "Transaction"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY tour_type_owner ON "TourType"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY tour_owner ON "Tour"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY client_owner ON "Client"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY web_project_owner ON "WebProject"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY project_payment_owner ON "ProjectPayment"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY project_expense_owner ON "ProjectExpense"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY budget_owner ON "Budget"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY savings_goal_owner ON "SavingsGoal"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY goal_contribution_owner ON "GoalContribution"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY debt_owner ON "Debt"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY debt_payment_owner ON "DebtPayment"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY recurring_transaction_owner ON "RecurringTransaction"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY notification_owner ON "Notification"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY exchange_rate_owner ON "ExchangeRate"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY attachment_owner ON "Attachment"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY monthly_closing_owner ON "MonthlyClosing"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY audit_log_owner ON "AuditLog"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY financial_note_owner ON "FinancialNote"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));
