-- CreateTable
CREATE TABLE "public"."simple_inventory" (
    "id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "category" "public"."InventoryCategory" NOT NULL,
    "initial_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "reorder_level" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simple_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quantity_logs" (
    "id" TEXT NOT NULL,
    "simple_inventory_id" TEXT NOT NULL,
    "previous_quantity" DOUBLE PRECISION NOT NULL,
    "new_quantity" DOUBLE PRECISION NOT NULL,
    "change_amount" DOUBLE PRECISION NOT NULL,
    "change_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quantity_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."quantity_logs" ADD CONSTRAINT "quantity_logs_simple_inventory_id_fkey" FOREIGN KEY ("simple_inventory_id") REFERENCES "public"."simple_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
