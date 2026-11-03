-- Assessment fee is charged ONCE PER STUDENT; duplicate/superseded fee payments are tracked.
-- Additive only: two nullable columns on application_payments, one nullable FK on enrollments.
-- No data change: legacy payments keep their status; legacy enrollments keep a NULL coverage link.

-- AlterTable
ALTER TABLE "application_payments" ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "refundedBy" TEXT;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "feeCoveredByPaymentId" TEXT;

-- CreateIndex
CREATE INDEX "enrollments_feeCoveredByPaymentId_idx" ON "enrollments"("feeCoveredByPaymentId");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_feeCoveredByPaymentId_fkey" FOREIGN KEY ("feeCoveredByPaymentId") REFERENCES "application_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

