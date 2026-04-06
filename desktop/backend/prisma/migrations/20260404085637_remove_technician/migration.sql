/*
  Warnings:

  - You are about to drop the column `technicianId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `technicianId` on the `SiteVisit` table. All the data in the column will be lost.
  - You are about to drop the `Technician` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_technicianId_fkey";

-- DropForeignKey
ALTER TABLE "SiteVisit" DROP CONSTRAINT "SiteVisit_technicianId_fkey";

-- DropForeignKey
ALTER TABLE "Technician" DROP CONSTRAINT "Technician_customerId_fkey";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "technicianId";

-- AlterTable
ALTER TABLE "SiteVisit" DROP COLUMN "technicianId";

-- DropTable
DROP TABLE "Technician";
