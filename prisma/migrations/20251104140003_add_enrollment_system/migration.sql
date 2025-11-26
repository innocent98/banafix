-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_modes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instrument" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "session" TEXT,
    "sessionStartDate" TIMESTAMP(3),
    "availableModes" TEXT[],
    "pricing" JSONB NOT NULL,
    "totalSeats" INTEGER NOT NULL DEFAULT 20,
    "seatsLeft" INTEGER NOT NULL DEFAULT 20,
    "outcomes" TEXT[],
    "equipment" TEXT[],
    "image" TEXT,
    "sampleVideoUrl" TEXT,
    "sampleVideoTitle" TEXT,
    "sampleVideoDuration" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "credentials" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "experience" TEXT,
    "availability" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "module" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "weeks" TEXT NOT NULL,
    "outcomes" TEXT[],
    "tasks" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "curriculum_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_faqs" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "course_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "guardianEmail" TEXT,
    "address" TEXT,
    "landmark" TEXT,
    "selectedMode" TEXT NOT NULL,
    "priorLevel" TEXT,
    "schedulePreference" TEXT,
    "preferredDays" TEXT[],
    "musicExperience" TEXT,
    "goals" TEXT,
    "specialRequests" TEXT,
    "agreeToTerms" BOOLEAN NOT NULL DEFAULT false,
    "agreeToRefundPolicy" BOOLEAN NOT NULL DEFAULT false,
    "consentToEmails" BOOLEAN NOT NULL DEFAULT false,
    "applicationPaid" BOOLEAN NOT NULL DEFAULT false,
    "applicationFeeAmount" INTEGER NOT NULL DEFAULT 2000,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "couponCode" TEXT,
    "waitlistNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_payments" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 2000,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentMethod" TEXT NOT NULL,
    "paystackReference" TEXT,
    "paystackStatus" TEXT NOT NULL DEFAULT 'pending',
    "authorizationCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "receiptNumber" TEXT NOT NULL,
    "receiptGenerated" BOOLEAN NOT NULL DEFAULT false,
    "receiptSent" BOOLEAN NOT NULL DEFAULT false,
    "billingEmail" TEXT NOT NULL,
    "billingName" TEXT NOT NULL,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tuition_payments" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paymentMethod" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "receiptNumber" TEXT NOT NULL,
    "receiptGenerated" BOOLEAN NOT NULL DEFAULT false,
    "receiptSent" BOOLEAN NOT NULL DEFAULT false,
    "recordedBy" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tuition_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_modes_name_key" ON "delivery_modes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "instructors_courseId_key" ON "instructors"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "application_payments_paystackReference_key" ON "application_payments"("paystackReference");

-- CreateIndex
CREATE UNIQUE INDEX "application_payments_receiptNumber_key" ON "application_payments"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "tuition_payments_receiptNumber_key" ON "tuition_payments"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_modules" ADD CONSTRAINT "curriculum_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_faqs" ADD CONSTRAINT "course_faqs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_payments" ADD CONSTRAINT "application_payments_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuition_payments" ADD CONSTRAINT "tuition_payments_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
