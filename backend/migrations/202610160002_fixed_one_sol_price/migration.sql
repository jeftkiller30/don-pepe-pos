-- Set current catalog prices to one sol without changing historical sale items.
UPDATE "Product" SET "price" = 100, "updatedAt" = CURRENT_TIMESTAMP WHERE "price" <> 100;
ALTER TABLE "Product" ADD CONSTRAINT "Product_fixed_one_sol_price" CHECK ("price" = 100);
