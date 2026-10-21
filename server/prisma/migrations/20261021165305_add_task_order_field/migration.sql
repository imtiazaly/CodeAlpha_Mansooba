-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "order" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "tasks_order_idx" ON "tasks"("order");
