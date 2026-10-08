/*
  Warnings:

  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Response` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Worker` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkerSkill` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Milestone" DROP CONSTRAINT "Milestone_orderId_fkey";

-- DropForeignKey
ALTER TABLE "PortfolioCase" DROP CONSTRAINT "PortfolioCase_workerId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_workerId_fkey";

-- DropForeignKey
ALTER TABLE "TaskChange" DROP CONSTRAINT "TaskChange_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_orderId_fkey";

-- DropForeignKey
ALTER TABLE "WorkerSkill" DROP CONSTRAINT "WorkerSkill_workerId_fkey";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "Response";

-- DropTable
DROP TABLE "Worker";

-- DropTable
DROP TABLE "WorkerSkill";

-- CreateTable
CREATE TABLE "taisia_demidova_worker" (
    "id" TEXT NOT NULL,
    "tgId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "grade" TEXT NOT NULL DEFAULT 'JUNIOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taisia_demidova_worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taisia_demidova_worker_skill" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,

    CONSTRAINT "taisia_demidova_worker_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taisia_demidova_order" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "specification" TEXT NOT NULL,
    "stack" TEXT[],
    "gradeRequired" TEXT NOT NULL,
    "totalPriceRub" INTEGER NOT NULL,
    "role" TEXT[],
    "status" TEXT DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "taisia_demidova_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taisia_demidova_response" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "daysTerm" INTEGER NOT NULL,
    "vectorScore" DOUBLE PRECISION NOT NULL,
    "aiScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'INVITED',

    CONSTRAINT "taisia_demidova_response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taisia_demidova_worker_tgId_key" ON "taisia_demidova_worker"("tgId");

-- AddForeignKey
ALTER TABLE "taisia_demidova_worker_skill" ADD CONSTRAINT "taisia_demidova_worker_skill_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "taisia_demidova_worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioCase" ADD CONSTRAINT "PortfolioCase_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "taisia_demidova_worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taisia_demidova_response" ADD CONSTRAINT "taisia_demidova_response_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "taisia_demidova_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taisia_demidova_response" ADD CONSTRAINT "taisia_demidova_response_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "taisia_demidova_worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "taisia_demidova_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "taisia_demidova_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "taisia_demidova_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChange" ADD CONSTRAINT "TaskChange_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "taisia_demidova_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
