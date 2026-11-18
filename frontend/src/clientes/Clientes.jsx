import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./clientes.scss";
export default function Clientes() {
  const tienda = useTienda();
  return (
    <>
      <div className={["page-heading"].filter(Boolean).join(" ")}>
        <div>
          <span className={["eyebrow"].filter(Boolean).join(" ")}>
            {"PERSONAS QUE VUELVEN"}
          </span>
          <h1>{"Tus clientes"}</h1>
          <p>{"Una atención más cercana empieza por conocerlos."}</p>
        </div>
        <div className={["heading-actions"].filter(Boolean).join(" ")}>
          <button
            onClick={async (event) => {
              tienda.exportCustomers();
              tienda.touch();
            }}
            className={["ui-button ui-outline"].filter(Boolean).join(" ")}
          >
            <Icono name={"download"} />
            {" Exportar "}
          </button>
          <button
            onClick={async (event) => {
              tienda.openCustomer();
              tienda.touch();
            }}
            className={["ui-button ui-flat", "primary"]
              .filter(Boolean)
              .join(" ")}
          >
            <Icono name={"plus"} />
            {" Nuevo cliente "}
          </button>
        </div>
      </div>
      <section className={["panel"].filter(Boolean).join(" ")}>
        <div className={["toolbar"].filter(Boolean).join(" ")}>
          <div className={["search-field"].filter(Boolean).join(" ")}>
            <Icono name={"search"} />
            <input
              placeholder={"Nombre, documento o teléfono…"}
              aria-label={"Buscar cliente"}
              value={tienda.searchCustomers() ?? ""}
              onChange={async (event) => {
                tienda.searchCustomers.set(event.target.value);
                tienda.touch();
              }}
            />
          </div>
          <span className={["muted"].filter(Boolean).join(" ")}>
            {""}
            {tienda.filteredCustomers().length}
            {" clientes"}
          </span>
        </div>
        <div className={["table-scroll"].filter(Boolean).join(" ")}>
          <table>
            <thead>
              <tr>
                <th>{"Cliente"}</th>
                <th>{"Documento"}</th>
                <th>{"Teléfono"}</th>
                <th>{"Correo"}</th>
                <th>{"Compras"}</th>
                <th className={["right"].filter(Boolean).join(" ")}>
                  {"Acciones"}
                </th>
              </tr>
            </thead>
            <tbody>
              {tienda.filteredCustomers().length ? (
                tienda.filteredCustomers().map((c, $index) => (
                  <React.Fragment key={c.id}>
                    <tr>
                      <td>
                        <strong>
                          {""}
                          {c.name}{" "}
                        </strong>
                      </td>
                      <td>
                        {""}
                        {c.document || "—"}
                        {""}
                      </td>
                      <td>
                        {""}
                        {c.phone || "—"}
                        {""}
                      </td>
                      <td>
                        {""}
                        {c.email || "—"}
                        {""}
                      </td>
                      <td>
                        {""}
                        {c._count.sales}
                        {""}
                      </td>
                      <td>
                        <div
                          className={["row-actions"].filter(Boolean).join(" ")}
                        >
                          <button
                            aria-label={"Editar cliente"}
                            title={"Editar cliente"}
                            onClick={async (event) => {
                              tienda.openCustomer(c);
                              tienda.touch();
                            }}
                            className={["icon-button"]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <Icono name={"edit"} />
                          </button>
                          {tienda.isAdmin() ? (
                            <>
                              <button
                                aria-label={"Archivar cliente"}
                                title={"Archivar cliente"}
                                onClick={async (event) => {
                                  tienda.archiveCustomer(c);
                                  tienda.touch();
                                }}
                                className={["icon-button danger"]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                <Icono name={"trash"} />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                <>
                  <tr>
                    <td
                      colSpan={"6"}
                      className={["empty-cell"].filter(Boolean).join(" ")}
                    >
                      <Icono name={"users"} />
                      <p>{"Tus clientes aparecerán aquí."}</p>
                      <button
                        onClick={async (event) => {
                          tienda.openCustomer();
                          tienda.touch();
                        }}
                        className={["ui-button ui-text"]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {" Registrar mi primer cliente "}
                      </button>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
