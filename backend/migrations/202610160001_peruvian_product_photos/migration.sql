-- Update only the original demonstration catalog. Preserve prices, stock and sales.
UPDATE "Product" SET "name" = 'Cheetos Boliqueso 160 g', "image" = 'cheetos', "category" = 'Snacks', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP001' AND "name" = 'Papas clásicas';
UPDATE "Product" SET "name" = 'Galletas Field Vainilla 37 g', "image" = 'field-vainilla', "category" = 'Galletas', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP002' AND "name" = 'Galletas de vainilla';
UPDATE "Product" SET "name" = 'Inca Kola lata 355 ml', "image" = 'inca-kola', "category" = 'Bebidas', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP003' AND "name" = 'Refresco de naranja';
UPDATE "Product" SET "name" = 'Gomitas Ambrosoli Ambrosito Ácido 90 g', "image" = 'ambrosoli-gomitas', "category" = 'Dulces', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP004' AND "name" = 'Gomitas frutales';
UPDATE "Product" SET "name" = 'Jabón Bolívar Limón 190 g', "image" = 'bolivar', "category" = 'Hogar', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP005' AND "name" = 'Jabón de tocador';
UPDATE "Product" SET "name" = 'Lapicero Faber-Castell 060 azul', "image" = 'faber-castell', "category" = 'Útiles', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP006' AND "name" = 'Lapicero azul';
UPDATE "Product" SET "name" = 'Galletas Casino Chocolate 43 g · sixpack', "image" = 'casino', "category" = 'Galletas', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP007' AND "name" = 'Galletas de chocolate';
UPDATE "Product" SET "name" = 'Agua Cielo Alcalina 650 ml', "image" = 'cielo', "category" = 'Bebidas', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP008' AND "name" = 'Agua personal';
UPDATE "Product" SET "name" = 'Mentitas Ambrosoli 19 g', "image" = 'ambrosoli-mentitas', "category" = 'Dulces', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP009' AND "name" = 'Caramelos surtidos';
UPDATE "Product" SET "name" = 'Maní Karinto Clásico Salado 100 g', "image" = 'karinto', "category" = 'Snacks', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP010' AND "name" = 'Maní tostado';
UPDATE "Product" SET "name" = 'Borrador Dúo Vinifan', "image" = 'vinifan', "category" = 'Útiles', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP011' AND "name" = 'Borrador escolar';
UPDATE "Product" SET "name" = 'Esponja Scotch-Brite Extrema', "image" = 'scotch-brite', "category" = 'Hogar', "updatedAt" = CURRENT_TIMESTAMP WHERE "sku" = 'DP012' AND "name" = 'Esponja de cocina';
