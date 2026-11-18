import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./ventas.scss";
export default function Ventas() {
  const tienda = useTienda();
  return (
    <>
      <div className={["page-heading"].filter(Boolean).join(" ")}>
        <div>
          <span className={["eyebrow"].filter(Boolean).join(" ")}>
            {"CADA VENTA, EN SU LUGAR"}
          </span>
          <h1>{"Historial de ventas"}</h1>
          <p>
            {"Consulta tickets, imprime comprobantes y gestiona anulaciones."}
          </p>
        </div>
        <button
          onClick={async (event) => {
            tienda.exportSales();
            tienda.touch();
          }}
          className={["ui-button ui-outline"].filter(Boolean).join(" ")}
        >
          <Icono name={"download"} />
          {" Exportar "}
        </button>
      </div>
      <section className={["panel"].filter(Boolean).join(" ")}>
        <div className={["toolbar"].filter(Boolean).join(" ")}>
          <div className={["search-field"].filter(Boolean).join(" ")}>
            <Icono name={"search"} />
            <input
              aria-label={"Buscar venta"}
              placeholder={"Ticket o cliente…"}
              value={tienda.searchSales() ?? ""}
              onChange={async (event) => {
                tienda.searchSales.set(event.target.value);
                tienda.touch();
              }}
            />
          </div>
          <label className={["date-label"].filter(Boolean).join(" ")}>
            {"Desde"}
            <input
              type={"date"}
              value={tienda.from ?? ""}
              onChange={async (event) => {
                tienda.from = event.target.value;
                tienda.touch();
              }}
            />
          </label>
          <label className={["date-label"].filter(Boolean).join(" ")}>
            {"Hasta"}
            <input
              type={"date"}
              value={tienda.to ?? ""}
              onChange={async (event) => {
                tienda.to = event.target.value;
                tienda.touch();
              }}
            />
          </label>
          <button
            disabled={tienda.busy()}
            onClick={async (event) => {
              tienda.loadSales();
              tienda.touch();
            }}
            className={["ui-button ui-flat", "primary"]
              .filter(Boolean)
              .join(" ")}
          >
            {" Filtrar "}
          </button>
        </div>
        <div className={["table-scroll"].filter(Boolean).join(" ")}>
          <table>
            <thead>
              <tr>
                <th>{"Ticket"}</th>
                <th>{"Fecha"}</th>
                <th>{"Cliente"}</th>
                <th>{"Medio de pago"}</th>
                <th>{"Total"}</th>
                <th>{"Estado"}</th>
                <th className={["right"].filter(Boolean).join(" ")}>
                  {"Acciones"}
                </th>
              </tr>
            </thead>
            <tbody>
              {tienda.filteredSales().length ? (
                tienda.filteredSales().map((s, $index) => (
                  <React.Fragment key={s.id}>
                    <tr>
                      <td>
                        <strong>
                          {""}
                          {tienda.ticket(s.id)}{" "}
                        </strong>
                      </td>
                      <td>
                        {""}
                        {tienda.date(s.createdAt)}
                        {""}
                      </td>
                      <td>
                        {""}
                        {s.customerName}
                        {""}
                      </td>
                      <td>
                        {""}
                        {tienda.paymentName(s.payment)}
                        {""}
                      </td>
                      <td>
                        <strong>
                          {""}
                          {tienda.money(s.total)}{" "}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={[
                            "pill",
                            s.status === "COMPLETED" ? "success" : "",
                            s.status === "CANCELLED" ? "warning" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {""}
                          {s.status === "COMPLETED"
                            ? "Completada"
                            : "Anulada"}{" "}
                        </span>
                      </td>
                      <td>
                        <div
                          className={["row-actions"].filter(Boolean).join(" ")}
                        >
                          <button
                            aria-label={"Ver ticket"}
                            title={"Ver e imprimir ticket"}
                            onClick={async (event) => {
                              tienda.viewReceipt(s);
                              tienda.touch();
                            }}
                            className={["icon-button"]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <Icono name={"receipt"} />
                          </button>
                          {tienda.isAdmin() && s.status === "COMPLETED" ? (
                            <>
                              <button
                                aria-label={"Anular venta"}
                                title={"Anular venta"}
                                onClick={async (event) => {
                                  tienda.cancelSale(s);
                                  tienda.touch();
                                }}
                                className={["icon-button danger"]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                <Icono name={"close"} />
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
                      colSpan={"7"}
                      className={["empty-cell"].filter(Boolean).join(" ")}
                    >
                      <Icono name={"receipt"} />
                      <p>{"No hay ventas en este período."}</p>
                      <button
                        onClick={async (event) => {
                          tienda.navigate("caja");
                          tienda.touch();
                        }}
                        className={["ui-button ui-text"]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {" Registrar una venta "}
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
