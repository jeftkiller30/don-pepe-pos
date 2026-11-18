# Fotografías del catálogo

Fotografías de referencia obtenidas del catálogo público de Metro Perú. Los archivos se guardan localmente en `frontend/public/assets/products/` para evitar dependencias de red durante la venta. Las marcas y fotografías pertenecen a sus respectivos titulares; su inclusión no implica afiliación.

Los nombres y las presentaciones corresponden a las fotografías seleccionadas. El precio del sistema es fijo en S/ 1.00; no es un precio consultado en Metro.

| Código | Producto | Fuente |
|---|---|---|
| DP001 | Cheetos Boliqueso 160 g | [Metro Perú](https://www.metro.pe/cheetos-boliqueso-160g-1014283/p) |
| DP002 | Galletas Field Vainilla 37 g | [Metro Perú](https://www.metro.pe/galletas-sabor-vainilla-field-paquete-37-g-2/p) |
| DP003 | Inca Kola lata 355 ml | [Metro Perú](https://www.metro.pe/gaseosa-inca-kola-lata-355-ml-2/p) |
| DP004 | Gomitas Ambrosoli Ambrosito Ácido 90 g | [Metro Perú](https://www.metro.pe/gomitas-ambrosoli-ambrosito-acido-90g-1006832/p) |
| DP005 | Jabón Bolívar Limón 190 g | [Metro Perú](https://www.metro.pe/jabon-para-ropa-bolivar-limon-190g/p) |
| DP006 | Lapicero Faber-Castell 060 azul | [Metro Perú](https://www.metro.pe/faber-castell-lapicero-tinta-seca-060-fine-azul-2/p) |
| DP007 | Galletas Casino Chocolate 43 g · sixpack | [Metro Perú](https://www.metro.pe/sixpack-galleta-casino-sabor-chocolate-43g-348641002/p) |
| DP008 | Agua Cielo Alcalina 650 ml | [Metro Perú](https://www.metro.pe/agua-cielo-alcalina-botella-650-ml-786716/p) |
| DP009 | Mentitas Ambrosoli 19 g | [Metro Perú](https://www.metro.pe/mentitas-ambrosoli-19g-1042943/p) |
| DP010 | Maní Karinto Clásico Salado 100 g | [Metro Perú](https://www.metro.pe/man-karinto-cl-sico-salado-100g-401997/p) |
| DP011 | Borrador Dúo Vinifan | [Metro Perú](https://www.metro.pe/borrador-duo-vinifan/p) |
| DP012 | Esponja Scotch-Brite Extrema | [Metro Perú](https://www.metro.pe/esponja-scotch-brite-extrema-2/p) |

La migración `202610160001_peruvian_product_photos` actualiza únicamente los productos iniciales cuyo código y nombre original coinciden. No modifica existencias, identificadores ni líneas de ventas históricas. Los productos personalizados se conservan. El formulario permite subir una fotografía JPG, PNG o WebP de hasta 5 MB desde el equipo. Las imágenes existentes se conservan al editar sin seleccionar otra. Se mantienen los recursos genéricos como respaldo para productos sin foto. La migración `202610160002_fixed_one_sol_price` fija el precio actual de todos los productos a S/ 1.00 y añade una restricción en PostgreSQL, conservando los importes de las ventas históricas.
