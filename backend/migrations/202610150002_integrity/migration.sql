ALTER TABLE "Product" ADD CONSTRAINT "Product_positive_values" CHECK ("stock" >= 0 AND "price" > 0 AND "minStock" >= 0);
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_valid_amounts" CHECK ("subtotal" > 0 AND "discount" >= 0 AND "total" = "subtotal" - "discount" AND "total" > 0 AND "received" >= "total" AND "change" = "received" - "total");
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_valid_amounts" CHECK ("quantity" > 0 AND "price" > 0 AND "total" = "price" * "quantity");
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_nonzero" CHECK ("quantity" <> 0);
