import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./usuarios.scss";
export default function Usuarios() {
  const tienda = useTienda();
  return (
    <>
      {tienda.isAdmin() ? (
        <>
          <section className={["panel"].filter(Boolean).join(" ")}>
            <div className={["panel-heading"].filter(Boolean).join(" ")}>
              <h2>{"Equipo y permisos"}</h2>
              <button
                onClick={async (event) => {
                  tienda.openUser();
                  tienda.touch();
                }}
                className={["ui-button ui-flat", "primary"]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icono name={"plus"} />
                {" Nuevo usuario "}
              </button>
            </div>
            <div className={["table-scroll"].filter(Boolean).join(" ")}>
              <table>
                <thead>
                  <tr>
                    <th>{"Nombre"}</th>
                    <th>{"Correo"}</th>
                    <th>{"Rol"}</th>
                    <th>{"Estado"}</th>
                    <th className={["right"].filter(Boolean).join(" ")}>
                      {"Acciones"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tienda.users().map((u, $index) => (
                    <React.Fragment key={u.id}>
                      <tr>
                        <td>
                          {""}
                          {u.name}
                          {""}
                        </td>
                        <td>
                          {""}
                          {u.email}
                          {""}
                        </td>
                        <td>
                          {""}
                          {tienda.roleName(u.role)}
                          {""}
                        </td>
                        <td>
                          <span
                            className={[
                              "pill",
                              u.active ? "success" : "",
                              !u.active ? "neutral" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {""}
                            {u.active ? "Activo" : "Inactivo"}{" "}
                          </span>
                        </td>
                        <td className={["right"].filter(Boolean).join(" ")}>
                          <button
                            disabled={u.id === tienda.user().id}
                            onClick={async (event) => {
                              tienda.toggleUser(u);
                              tienda.touch();
                            }}
                            className={["ui-button ui-text"]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {" "}
                            {u.active ? "Desactivar" : "Activar"}{" "}
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
