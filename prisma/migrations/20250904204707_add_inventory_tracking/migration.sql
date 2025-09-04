-- CreateTable
CREATE TABLE "public"."inventory_items" (
    "id" TEXT NOT NULL,
    "cost_item_id" TEXT NOT NULL,
    "current_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorder_level" DOUBLE PRECISION,
    "last_restocked" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_usage_sessions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_usage_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_usage_entries" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "starting_quantity" DOUBLE PRECISION NOT NULL,
    "ending_quantity" DOUBLE PRECISION,
    "used_quantity" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_usage_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_cost_item_id_key" ON "public"."inventory_items"("cost_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_usage_sessions_date_key" ON "public"."inventory_usage_sessions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_usage_entries_session_id_inventory_item_id_key" ON "public"."inventory_usage_entries"("session_id", "inventory_item_id");

-- AddForeignKey
ALTER TABLE "public"."inventory_items" ADD CONSTRAINT "inventory_items_cost_item_id_fkey" FOREIGN KEY ("cost_item_id") REFERENCES "public"."inventory_costs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_usage_entries" ADD CONSTRAINT "inventory_usage_entries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."inventory_usage_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_usage_entries" ADD CONSTRAINT "inventory_usage_entries_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
