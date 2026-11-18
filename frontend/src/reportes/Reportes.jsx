import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./reportes.scss";
export default function Reportes() {
  const tienda = useTienda();
  return (
    <>
      <div className={["page-heading"].filter(Boolean).join(" ")}>
        <div>
          <span className={["eyebrow"].filter(Boolean).join(" ")}>
            {"CONOCE TU NEGOCIO"}
          </span>
          <h1>{"Reportes de ventas"}</h1>
          <p>{"Información para tomar mejores decisiones."}</p>
        </div>
        <div className={["heading-actions"].filter(Boolean).join(" ")}>
          <button
            disabled={!tienda.report()}
            onClick={async (event) => {
              tienda.exportReport();
              tienda.touch();
            }}
            className={["ui-button ui-outline"].filter(Boolean).join(" ")}
          >
            <Icono name={"download"} />
            {" Exportar CSV "}
          </button>
          <button
            onClick={async (event) => {
              tienda.print();
              tienda.touch();
            }}
            className={["ui-button ui-outline"].filter(Boolean).join(" ")}
          >
            <Icono name={"print"} />
            {" Imprimir / PDF "}
          </button>
        </div>
      </div>
      <div
        className={["panel toolbar report-toolbar"].filter(Boolean).join(" ")}
      >
        <label className={["date-label"].filter(Boolean).join(" ")}>
          {"Desde"}
          <input
            type={"date"}
            value={tienda.reportFrom ?? ""}
            onChange={async (event) => {
              tienda.reportFrom = event.target.value;
              tienda.touch();
            }}
          />
        </label>
        <label className={["date-label"].filter(Boolean).join(" ")}>
          {"Hasta"}
          <input
            type={"date"}
            value={tienda.reportTo ?? ""}
            onChange={async (event) => {
              tienda.reportTo = event.target.value;
              tienda.touch();
            }}
          />
        </label>
        <button
          onClick={async (event) => {
            tienda.loadReport();
            tienda.touch();
          }}
          className={["ui-button ui-flat", "primary"].filter(Boolean).join(" ")}
        >
          {" Consultar "}
        </button>
        <span className={["muted"].filter(Boolean).join(" ")}>
          {"Solo ventas completadas · Las anuladas se excluyen"}
        </span>
      </div>
      {tienda.report()
        ? ((r) => (
            <>
              <div
                className={["metrics report-metrics"].filter(Boolean).join(" ")}
              >
                <article className={["metric-card"].filter(Boolean).join(" ")}>
                  <span
                    className={["metric-icon orange"].filter(Boolean).join(" ")}
                  >
                    <Icono name={"chart"} />
                  </span>
                  <div>
                    <span>{"Ingresos netos"}</span>
                    <strong>
                      {""}
                      {tienda.money(r.revenue)}{" "}
                    </strong>
                    <small>{"Después de descuentos"}</small>
                  </div>
                </article>
                <article className={["metric-card"].filter(Boolean).join(" ")}>
                  <span
                    className={["metric-icon cyan"].filter(Boolean).join(" ")}
                  >
                    <Icono name={"receipt"} />
                  </span>
                  <div>
                    <span>{"Tickets"}</span>
                    <strong>
                      {""}
                      {r.tickets}{" "}
                    </strong>
                    <small>
                      {""}
                      {tienda.money(r.average)}
                      {" de promedio"}
                    </small>
                  </div>
                </article>
                <article className={["metric-card"].filter(Boolean).join(" ")}>
                  <span
                    className={["metric-icon yellow"].filter(Boolean).join(" ")}
                  >
                    <Icono name={"box"} />
                  </span>
                  <div>
                    <span>{"Unidades vendidas"}</span>
                    <strong>
                      {""}
                      {r.units}{" "}
                    </strong>
                    <small>{"En el período seleccionado"}</small>
                  </div>
                </article>
              </div>
              <div className={["report-grid"].filter(Boolean).join(" ")}>
                <section className={["panel"].filter(Boolean).join(" ")}>
                  <div className={["panel-heading"].filter(Boolean).join(" ")}>
                    <h2>{"Evolución diaria"}</h2>
                    <span
                      className={["pill neutral"].filter(Boolean).join(" ")}
                    >
                      {"Soles (PEN)"}
                    </span>
                  </div>
                  <div className={["daily-chart"].filter(Boolean).join(" ")}>
                    {r.daily.length ? (
                      r.daily.map((day, $index) => (
                        <React.Fragment key={day.day}>
                          <div
                            title={day.day + " · " + tienda.money(day.total)}
                            className={["daily-column"]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <strong>
                              {""}
                              {tienda.money(day.total)}{" "}
                            </strong>
                            <div
                              className={["daily-track"]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <div
                                style={{
                                  height: tienda.reportHeight(day.total) + "%",
                                }}
                              ></div>
                            </div>
                            <span>
                              {""}
                              {day.day.slice(5)}{" "}
                            </span>
                          </div>
                        </React.Fragment>
                      ))
                    ) : (
                      <>
                        <div
                          className={["empty-state"].filter(Boolean).join(" ")}
                        >
                          <Icono name={"chart"} />
                          <p>{"Aún no hay ventas para graficar."}</p>
                        </div>
                      </>
                    )}
                  </div>
                </section>
                <section className={["panel"].filter(Boolean).join(" ")}>
                  <div className={["panel-heading"].filter(Boolean).join(" ")}>
                    <h2>{"Medios de pago"}</h2>
                  </div>
                  {["CASH", "YAPE", "CARD"].map((method, $index) => (
                    <React.Fragment key={method}>
                      <div
                        className={["payment-report"].filter(Boolean).join(" ")}
                      >
                        <span
                          className={[
                            "metric-icon",
                            method === "CASH" ? "orange" : "",
                            method === "YAPE" ? "cyan" : "",
                            method === "CARD" ? "yellow" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <Icono
                            name={
                              method === "CASH"
                                ? "cash"
                                : method === "YAPE"
                                  ? "phone"
                                  : "card"
                            }
                          />
                        </span>
                        <div>
                          <span>
                            {""}
                            {tienda.paymentName(method)}{" "}
                          </span>
                          <strong>
                            {""}
                            {tienda.money(r.payments[method])}{" "}
                          </strong>
                        </div>
                        <b>
                          {""}
                          {r.revenue
                            ? Math.round((r.payments[method] / r.revenue) * 100)
                            : 0}
                          {"%"}
                        </b>
                      </div>
                    </React.Fragment>
                  ))}
                </section>
              </div>
              <section className={["panel"].filter(Boolean).join(" ")}>
                <div className={["panel-heading"].filter(Boolean).join(" ")}>
                  <h2>{"Productos más vendidos"}</h2>
                  <span className={["muted"].filter(Boolean).join(" ")}>
                    {"Importes antes de descuentos"}
                  </span>
                </div>
                <div className={["table-scroll"].filter(Boolean).join(" ")}>
                  <table>
                    <thead>
                      <tr>
                        <th>{"Producto"}</th>
                        <th>{"Cantidad"}</th>
                        <th className={["right"].filter(Boolean).join(" ")}>
                          {"Total bruto"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.topProducts.length ? (
                        r.topProducts.map((p, $index) => (
                          <React.Fragment key={p.id}>
                            <tr>
                              <td>
                                <div
                                  className={["product-cell"]
                                    .filter(Boolean)
                                    .join(" ")}
                                >
                                  <img
                                    alt={""}
                                    src={tienda.productImage(p.image)}
                                    onError={async (event) => {
                                      tienda.imageFallback(event);
                                      tienda.touch();
                                    }}
                                  />
                                  {""}
                                  {p.name}{" "}
                                </div>
                              </td>
                              <td>
                                {""}
                                {p.quantity}
                                {""}
                              </td>
                              <td
                                className={["right"].filter(Boolean).join(" ")}
                              >
                                {""}
                                {tienda.money(p.total)}
                                {""}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td
                              colSpan={"3"}
                              className={["empty-cell"]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              {" No hay ventas en este período. "}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ))(tienda.report())
        : null}
    </>
  );
}
