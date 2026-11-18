import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./inicio.scss";
export default function Inicio() {
  const tienda = useTienda();
  return (
    <>
      <div className={["page-heading"].filter(Boolean).join(" ")}>
        <div>
          <span className={["eyebrow"].filter(Boolean).join(" ")}>
            {"RESUMEN DE TU TIENDA"}
          </span>
          <h1>
            {" Buenos días, "}
            {tienda.user().name.split(" ")[0]}{" "}
          </h1>
          <p>
            {""}
            {tienda.longDate()}
            {""}
          </p>
        </div>
        <button
          title={"Actualizar datos"}
          disabled={tienda.busy()}
          onClick={async (event) => {
            tienda.reload();
            tienda.touch();
          }}
          className={["ui-button ui-outline", "subtle-button"]
            .filter(Boolean)
            .join(" ")}
        >
          <Icono name={"refresh"} />
          <span>{"Actualizar"}</span>
        </button>
      </div>
      {tienda.dashboard()
        ? ((d) => (
            <>
              <div className={["metrics"].filter(Boolean).join(" ")}>
                <article className={["metric-card"].filter(Boolean).join(" ")}>
                  <span
                    className={["metric-icon orange"].filter(Boolean).join(" ")}
                  >
                    <Icono name={"cart"} />
                  </span>
                  <div>
                    <span>
                      {"Ventas "}
                      {tienda.period === "today"
                        ? "de hoy"
                        : "del período"}{" "}
                    </span>
                    <strong>
                      {""}
                      {tienda.money(d.revenue)}{" "}
                    </strong>
                    <small className={["positive"].filter(Boolean).join(" ")}>
                      {d.change !== null ? (
                        <>
                          <Icono name={"trend"} /> {d.change > 0 ? "+" : ""}
                          {""}
                          {d.change}
                          {"% "}
                          <em>{"vs. período anterior"}</em>
                        </>
                      ) : (
                        <>
                          <em>{"Ventas completadas"}</em>
                        </>
                      )}
                    </small>
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
                      {d.tickets}{" "}
                    </strong>
                    <small>{"Operaciones completadas"}</small>
                  </div>
                </article>
                <article className={["metric-card"].filter(Boolean).join(" ")}>
                  <span
                    className={["metric-icon yellow"].filter(Boolean).join(" ")}
                  >
                    <Icono name={"box"} />
                  </span>
                  <div>
                    <span>{"Productos vendidos"}</span>
                    <strong>
                      {""}
                      {d.units}{" "}
                    </strong>
                    <small>{"Unidades en el período"}</small>
                  </div>
                </article>
                <article className={["metric-card"].filter(Boolean).join(" ")}>
                  <span
                    className={["metric-icon green"].filter(Boolean).join(" ")}
                  >
                    <Icono name={"users"} />
                  </span>
                  <div>
                    <span>{"Clientes atendidos"}</span>
                    <strong>
                      {""}
                      {d.customers}{" "}
                    </strong>
                    <small>{"Clientes identificados"}</small>
                  </div>
                </article>
              </div>
              <div className={["dashboard-grid"].filter(Boolean).join(" ")}>
                <section
                  className={["panel chart-panel"].filter(Boolean).join(" ")}
                >
                  <div className={["panel-heading"].filter(Boolean).join(" ")}>
                    <h2>
                      {"Ventas "}
                      {tienda.period === "today" ? "de hoy" : "por hora"}
                      {""}
                    </h2>
                    <select
                      aria-label={"Período de estadísticas"}
                      value={tienda.period ?? ""}
                      onChange={async (event) => {
                        tienda.period = event.target.value;
                        tienda.loadDashboard();
                        tienda.touch();
                      }}
                    >
                      <option value={"today"}>{"Hoy"}</option>
                      <option value={"yesterday"}>{"Ayer"}</option>
                      <option value={"week"}>{"Últimos 7 días"}</option>
                    </select>
                  </div>
                  <div className={["chart-amount"].filter(Boolean).join(" ")}>
                    {""}
                    {tienda.money(d.revenue)}
                    {""}
                  </div>
                  <p className={["chart-caption"].filter(Boolean).join(" ")}>
                    {" "}
                    {d.tickets}
                    {" tickets · Promedio "}
                    {tienda.money(d.average)}{" "}
                  </p>
                  <div
                    aria-label={"Ventas agrupadas por hora"}
                    className={["sales-chart"].filter(Boolean).join(" ")}
                  >
                    <div className={["grid-lines"].filter(Boolean).join(" ")}>
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    {tienda.bars().map((bar, $index) => (
                      <React.Fragment key={bar.hour}>
                        <div
                          className={["chart-column"].filter(Boolean).join(" ")}
                        >
                          <div
                            className={["bar-track"].filter(Boolean).join(" ")}
                          >
                            <div
                              title={
                                bar.hour + ":00 · " + tienda.money(bar.total)
                              }
                              className={["bar"].filter(Boolean).join(" ")}
                              style={{
                                height: tienda.barHeight(bar.total) + "%",
                              }}
                            ></div>
                          </div>
                          <span>
                            {""}
                            {bar.hour % 2 === 0 ? bar.hour + ":00" : ""}{" "}
                          </span>
                        </div>
                      </React.Fragment>
                    ))}
                    {!d.tickets ? (
                      <>
                        <div
                          className={["chart-empty"].filter(Boolean).join(" ")}
                        >
                          <Icono name={"chart"} />
                          <strong>{"Tu primera venta empieza aquí"}</strong>
                          <span>
                            {
                              "El gráfico se actualizará cuando registres una venta."
                            }
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className={["chart-legend"].filter(Boolean).join(" ")}>
                    <i></i>
                    {" Ventas completadas en soles"}
                  </div>
                </section>
                <section
                  className={["panel alerts-panel"].filter(Boolean).join(" ")}
                >
                  <div className={["panel-heading"].filter(Boolean).join(" ")}>
                    <h2>
                      {" Stock bajo "}
                      <span
                        className={["count-badge"].filter(Boolean).join(" ")}
                      >
                        {""}
                        {d.lowStock.length}{" "}
                      </span>
                    </h2>
                    <button
                      onClick={async (event) => {
                        tienda.showLow();
                        tienda.touch();
                      }}
                      className={["text-link"].filter(Boolean).join(" ")}
                    >
                      {" Ver todos "}
                      <Icono name={"chevron"} />
                    </button>
                  </div>
                  {d.lowStock.slice(0, 5).map((p, $index) => (
                    <React.Fragment key={p.id}>
                      <button
                        onClick={async (event) => {
                          tienda.canStock()
                            ? tienda.openStock(p)
                            : tienda.showLow();
                          tienda.touch();
                        }}
                        className={["stock-row"].filter(Boolean).join(" ")}
                      >
                        <img
                          alt={""}
                          src={tienda.productImage(p.image)}
                          onError={async (event) => {
                            tienda.imageFallback(event);
                            tienda.touch();
                          }}
                        />
                        <span>
                          <strong>
                            {""}
                            {p.name}{" "}
                          </strong>
                          <small>
                            {"Stock actual: "}
                            <b>
                              {""}
                              {p.stock}{" "}
                            </b>
                          </small>
                        </span>
                        <em>
                          {""}
                          {p.stock}{" "}
                        </em>
                      </button>
                    </React.Fragment>
                  ))}
                  {!d.lowStock.length ? (
                    <>
                      <div
                        className={["compact-empty"].filter(Boolean).join(" ")}
                      >
                        <Icono name={"check"} />
                        <strong>{"Todo en orden"}</strong>
                        <span>{"Hay suficientes unidades en inventario."}</span>
                      </div>
                    </>
                  ) : null}
                  <div className={["stock-tip"].filter(Boolean).join(" ")}>
                    <Icono name={"warning"} />
                    <span>{"Repón a tiempo y sigue vendiendo."}</span>
                  </div>
                </section>
              </div>
              <section
                className={["panel top-products"].filter(Boolean).join(" ")}
              >
                <div className={["panel-heading"].filter(Boolean).join(" ")}>
                  <h2>{"Productos más vendidos"}</h2>
                  <button
                    onClick={async (event) => {
                      tienda.navigate("reportes");
                      tienda.touch();
                    }}
                    className={["text-link"].filter(Boolean).join(" ")}
                  >
                    {" Ver reporte "}
                    <Icono name={"chevron"} />
                  </button>
                </div>
                <div className={["table-scroll"].filter(Boolean).join(" ")}>
                  <table>
                    <thead>
                      <tr>
                        <th>{"#"}</th>
                        <th>{"Producto"}</th>
                        <th>{"Cantidad"}</th>
                        <th className={["right"].filter(Boolean).join(" ")}>
                          {"Total bruto"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.topProducts.slice(0, 5).map((p, idx) => (
                        <React.Fragment key={p.id}>
                          <tr>
                            <td className={["muted"].filter(Boolean).join(" ")}>
                              {""}
                              {idx + 1}
                              {""}
                            </td>
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
                                <strong>
                                  {""}
                                  {p.name}{" "}
                                </strong>
                              </div>
                            </td>
                            <td>
                              {""}
                              {p.quantity}
                              {" und."}
                            </td>
                            <td className={["right"].filter(Boolean).join(" ")}>
                              <strong>
                                {""}
                                {tienda.money(p.total)}{" "}
                              </strong>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!d.topProducts.length ? (
                  <>
                    <div className={["table-empty"].filter(Boolean).join(" ")}>
                      <Icono name={"box"} />
                      <span>
                        {"Los favoritos de tus clientes aparecerán aquí."}
                      </span>
                    </div>
                  </>
                ) : null}
              </section>
              <div className={["dashboard-foot"].filter(Boolean).join(" ")}>
                <span>
                  <i></i>
                  {" Datos conectados a tu tienda"}
                </span>
                <span>{"La Tiendita de Don Pepe"}</span>
              </div>
            </>
          ))(tienda.dashboard())
        : null}
    </>
  );
}
