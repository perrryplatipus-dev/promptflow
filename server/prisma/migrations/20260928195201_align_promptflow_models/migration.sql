/*
  Warnings:

  - The primary key for the `Project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PromptRun` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `PromptRun` table. All the data in the column will be lost.
  - You are about to drop the column `modelA` on the `PromptRun` table. All the data in the column will be lost.
  - You are about to drop the column `modelB` on the `PromptRun` table. All the data in the column will be lost.
  - You are about to drop the `Evaluation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tags` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `PromptRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectName` to the `PromptRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scores` to the `PromptRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variables` to the `PromptRun` table without a default value. This is not possible if the table is not empty.
  - Made the column `projectId` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `promptB` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `outputA` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `outputB` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tokensA` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tokensB` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `latencyA` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `latencyB` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `costA` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.
  - Made the column `costB` on table `PromptRun` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_runId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "PromptRun" DROP CONSTRAINT "PromptRun_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP CONSTRAINT "Project_pkey",
ADD COLUMN     "tags" JSONB NOT NULL,
ADD COLUMN     "versionsCount" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" DROP DEFAULT,
ADD CONSTRAINT "Project_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Project_id_seq";

-- AlterTable
ALTER TABLE "PromptRun" DROP CONSTRAINT "PromptRun_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "modelA",
DROP COLUMN "modelB",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "projectName" TEXT NOT NULL,
ADD COLUMN     "scores" JSONB NOT NULL,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "variables" JSONB NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET NOT NULL,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "promptB" SET NOT NULL,
ALTER COLUMN "outputA" SET NOT NULL,
ALTER COLUMN "outputB" SET NOT NULL,
ALTER COLUMN "tokensA" SET NOT NULL,
ALTER COLUMN "tokensB" SET NOT NULL,
ALTER COLUMN "latencyA" SET NOT NULL,
ALTER COLUMN "latencyB" SET NOT NULL,
ALTER COLUMN "costA" SET NOT NULL,
ALTER COLUMN "costB" SET NOT NULL,
ADD CONSTRAINT "PromptRun_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "PromptRun_id_seq";

-- DropTable
DROP TABLE "Evaluation";

-- AddForeignKey
ALTER TABLE "PromptRun" ADD CONSTRAINT "PromptRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
