-- CreateTable
CREATE TABLE IF NOT EXISTS "community_invitations" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "invitedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "community_invitations_token_key" ON "community_invitations"("token");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "community_invitations_communityId_userId_key" ON "community_invitations"("communityId", "userId") WHERE "userId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "community_invitations_communityId_email_key" ON "community_invitations"("communityId", "email") WHERE "email" IS NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_invitations_token_idx" ON "community_invitations"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_invitations_status_idx" ON "community_invitations"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_invitations_communityId_idx" ON "community_invitations"("communityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_invitations_userId_idx" ON "community_invitations"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_invitations_email_idx" ON "community_invitations"("email");

-- AddForeignKey
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
