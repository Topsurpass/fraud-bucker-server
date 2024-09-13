/*
  Warnings:

  - Added the required column `channelId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `channelId` VARCHAR(191) NOT NULL;
