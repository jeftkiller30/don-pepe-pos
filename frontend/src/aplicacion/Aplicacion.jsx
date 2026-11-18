import React from "react";
import { useTienda } from "../servicios/tienda";
import Acceso from "../acceso/Acceso";
import Estructura from "../estructura/Estructura";
import Dialogos from "../dialogos/Dialogos";
import "./aplicacion.scss";
export default function Aplicacion() {
  const tienda = useTienda();
  return (
    <>
      {tienda.loading() ? (
        <>
          <div className={["boot"].filter(Boolean).join(" ")}>
            <img
              src={"/assets/logo-don-pepe.png"}
              alt={"La Tiendita de Don Pepe"}
            />
            <div className={["loading-line"].filter(Boolean).join(" ")}></div>
            <p>{"Preparando tu tienda…"}</p>
          </div>
        </>
      ) : !tienda.user() ? (
        <>
          <Acceso />
        </>
      ) : (
        <>
          <Estructura />
        </>
      )}
      <Dialogos />
    </>
  );
}
