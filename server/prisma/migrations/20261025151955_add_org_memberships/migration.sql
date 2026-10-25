-- CreateTable
CREATE TABLE "user_organization_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_organization_memberships_userId_idx" ON "user_organization_memberships"("userId");

-- CreateIndex
CREATE INDEX "user_organization_memberships_organizationId_idx" ON "user_organization_memberships"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_organization_memberships_userId_organizationId_key" ON "user_organization_memberships"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "user_organization_memberships" ADD CONSTRAINT "user_organization_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organization_memberships" ADD CONSTRAINT "user_organization_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
