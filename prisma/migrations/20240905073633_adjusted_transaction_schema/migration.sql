/*
  Warnings:

  - Added the required column `analystId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `analystId` VARCHAR(191) NOT NULL;
