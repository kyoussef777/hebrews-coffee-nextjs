-- AlterTable
ALTER TABLE "public"."inventory_items" ADD COLUMN     "initial_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_cost" DOUBLE PRECISION;
