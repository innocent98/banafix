-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "channels" TEXT[],
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "shortBody" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_messages" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "toName" TEXT,
    "toAddress" TEXT,
    "templateKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "html" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "provider" TEXT,
    "providerMessageId" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "batchId" TEXT,
    "enrollmentId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbound_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channels" TEXT[],
    "category" TEXT NOT NULL,
    "audience" JSONB NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "relationship" TEXT,
    "email" TEXT,
    "rating" INTEGER,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "allowTestimonial" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'new',
    "testimonialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_key_key" ON "message_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_messages_idempotencyKey_key" ON "outbound_messages"("idempotencyKey");

-- CreateIndex
CREATE INDEX "outbound_messages_status_scheduledFor_idx" ON "outbound_messages"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "outbound_messages_templateKey_idx" ON "outbound_messages"("templateKey");

-- CreateIndex
CREATE INDEX "outbound_messages_batchId_idx" ON "outbound_messages"("batchId");

-- CreateIndex
CREATE INDEX "outbound_messages_createdAt_idx" ON "outbound_messages"("createdAt");

-- CreateIndex
CREATE INDEX "feedback_status_createdAt_idx" ON "feedback"("status", "createdAt");
