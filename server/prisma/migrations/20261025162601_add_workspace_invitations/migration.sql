-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WORKSPACE_INVITATION';

-- AlterTable
ALTER TABLE "user_organization_memberships" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'ACCEPTED';

-- CreateIndex
CREATE INDEX "user_organization_memberships_status_idx" ON "user_organization_memberships"("status");
