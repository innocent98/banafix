-- AlterTable
ALTER TABLE "application_payments" ALTER COLUMN "amount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "enrollments" ALTER COLUMN "applicationFeeAmount" DROP NOT NULL,
ALTER COLUMN "applicationFeeAmount" DROP DEFAULT;
