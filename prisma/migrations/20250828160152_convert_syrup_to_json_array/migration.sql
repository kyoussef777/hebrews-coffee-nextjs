/*
  Warnings:

  - You are about to drop the column `syrup` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "syrup",
ADD COLUMN     "syrups" JSONB DEFAULT '[]';
