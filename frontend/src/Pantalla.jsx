import React from "react";
import { useTienda } from "./servicios/tienda";
import Inicio from "./inicio/Inicio";
import Caja from "./caja/Caja";
import Inventario from "./inventario/Inventario";
import Ventas from "./ventas/Ventas";
import Clientes from "./clientes/Clientes";
import Reportes from "./reportes/Reportes";
import Configuracion from "./configuracion/Configuracion";
export default function Pantalla() {
  const tienda = useTienda();
  const Page =
    {
      inicio: Inicio,
      caja: Caja,
      inventario: Inventario,
      ventas: Ventas,
      clientes: Clientes,
      reportes: Reportes,
      configuracion: Configuracion,
    }[tienda.page()] || Inicio;
  return <Page />;
}
