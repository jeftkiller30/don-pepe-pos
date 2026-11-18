import React from "react";
import { useTienda } from "../servicios/tienda";
import Usuarios from "../usuarios/Usuarios";
import Icono from "../icono/Icono";
import "./configuracion.scss";
export default function Configuracion() {
  const tienda = useTienda();
  return (
    <>
      <div className={["page-heading"].filter(Boolean).join(" ")}>
        <div>
          <span className={["eyebrow"].filter(Boolean).join(" ")}>
            {"A TU MANERA"}
          </span>
          <h1>{"Configuración"}</h1>
          <p>{"La información de tu tienda y los accesos de tu equipo."}</p>
        </div>
      </div>
      <div className={["settings-grid"].filter(Boolean).join(" ")}>
        <section className={["panel setting-card"].filter(Boolean).join(" ")}>
          <span className={["metric-icon orange"].filter(Boolean).join(" ")}>
            <Icono name={"store"} />
          </span>
          <h2>
            {""}
            {tienda.settings().name}
            {""}
          </h2>
          <p>
            {""}
            {tienda.settings().address}
            {""}
          </p>
          <p>
            {""}
            {tienda.settings().phone || "Sin teléfono registrado"}
            {""}
          </p>
          <div className={["receipt-message"].filter(Boolean).join(" ")}>
            {""}
            {tienda.settings().receiptMessage}
            {""}
          </div>
          {tienda.isAdmin() ? (
            <>
              <button
                onClick={async (event) => {
                  tienda.openSettings();
                  tienda.touch();
                }}
                className={["ui-button ui-outline"].filter(Boolean).join(" ")}
              >
                <Icono name={"edit"} />
                {" Editar tienda "}
              </button>
            </>
          ) : null}
        </section>
        <section className={["panel setting-card"].filter(Boolean).join(" ")}>
          <span className={["metric-icon cyan"].filter(Boolean).join(" ")}>
            <Icono name={"lock"} />
          </span>
          <h2>{"Mi cuenta"}</h2>
          <p>
            {""}
            {tienda.user().name}
            {" · "}
            {tienda.roleName(tienda.user().role)}
            {""}
          </p>
          <p>
            {""}
            {tienda.user().email}
            {""}
          </p>
          <button
            onClick={async (event) => {
              tienda.openPassword();
              tienda.touch();
            }}
            className={["ui-button ui-outline"].filter(Boolean).join(" ")}
          >
            {" Cambiar contraseña "}
          </button>
          <div className={["account-info"].filter(Boolean).join(" ")}>
            {" Los permisos se verifican en el servidor en cada operación. "}
          </div>
        </section>
      </div>
      <Usuarios />
    </>
  );
}
