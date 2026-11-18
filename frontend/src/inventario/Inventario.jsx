import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./inventario.scss";
export default function Inventario() {
  const tienda = useTienda();
  return (
    <>
      <div className={["page-heading"].filter(Boolean).join(" ")}>
        <div>
          <span className={["eyebrow"].filter(Boolean).join(" ")}>
            {"CADA PRODUCTO CUENTA"}
          </span>
          <h1>{"Inventario"}</h1>
          <p>{"Controla tus productos y mantén tu tienda abastecida."}</p>
        </div>
        <div className={["heading-actions"].filter(Boolean).join(" ")}>
          <button
            onClick={async (event) => {
              tienda.exportInventory();
              tienda.touch();
            }}
            className={["ui-button ui-outline"].filter(Boolean).join(" ")}
          >
            <Icono name={"download"} />
            {" Exportar "}
          </button>
          {tienda.canStock() ? (
            <>
              <button
                onClick={async (event) => {
                  tienda.openProduct();
                  tienda.touch();
                }}
                className={["ui-button ui-flat", "primary"]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icono name={"plus"} />
                {" Nuevo producto "}
              </button>
            </>
          ) : null}
        </div>
      </div>
      <section className={["panel"].filter(Boolean).join(" ")}>
        <div className={["toolbar"].filter(Boolean).join(" ")}>
          <div className={["search-field"].filter(Boolean).join(" ")}>
            <Icono name={"search"} />
            <input
              aria-label={"Buscar en inventario"}
              placeholder={"Buscar nombre o código…"}
              value={tienda.query() ?? ""}
              onChange={async (event) => {
                tienda.query.set(event.target.value);
                tienda.touch();
              }}
            />
          </div>
          <select
            aria-label={"Categoría"}
            value={tienda.category() ?? ""}
            onChange={async (event) => {
              tienda.category.set(event.target.value);
              tienda.touch();
            }}
          >
            {tienda.categories().map((c, $index) => (
              <React.Fragment key={c}>
                <option>
                  {""}
                  {c}
                  {""}
                </option>
              </React.Fragment>
            ))}
          </select>
          <label className={["check-label"].filter(Boolean).join(" ")}>
            <input
              type={"checkbox"}
              checked={tienda.lowOnly() ?? false}
              onChange={async (event) => {
                tienda.lowOnly.set(event.target.checked);
                tienda.touch();
              }}
            />
            {" Solo stock bajo"}
          </label>
          <span className={["muted"].filter(Boolean).join(" ")}>
            {""}
            {tienda.filteredProducts().length}
            {" productos"}
          </span>
        </div>
        <div className={["table-scroll"].filter(Boolean).join(" ")}>
          <table>
            <thead>
              <tr>
                <th>{"Producto"}</th>
                <th>{"Código"}</th>
                <th>{"Categoría"}</th>
                <th>{"Precio"}</th>
                <th>{"Stock"}</th>
                <th>{"Estado"}</th>
                <th className={["right"].filter(Boolean).join(" ")}>
                  {"Acciones"}
                </th>
              </tr>
            </thead>
            <tbody>
              {tienda.filteredProducts().length ? (
                tienda.filteredProducts().map((p, $index) => (
                  <React.Fragment key={p.id}>
                    <tr>
                      <td>
                        <div
                          className={["product-cell"].filter(Boolean).join(" ")}
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
                      <td className={["muted"].filter(Boolean).join(" ")}>
                        {""}
                        {p.sku}
                        {""}
                      </td>
                      <td>
                        {""}
                        {p.category}
                        {""}
                      </td>
                      <td>
                        {""}
                        {tienda.money(p.price)}
                        {""}
                      </td>
                      <td>
                        <strong>
                          {""}
                          {p.stock}{" "}
                        </strong>
                        <small className={["muted"].filter(Boolean).join(" ")}>
                          {"/ mín. "}
                          {p.minStock}{" "}
                        </small>
                      </td>
                      <td>
                        <span
                          className={[
                            "pill",
                            p.stock > p.minStock ? "success" : "",
                            p.stock <= p.minStock ? "warning" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {""}
                          {p.stock === 0
                            ? "Agotado"
                            : p.stock <= p.minStock
                              ? "Stock bajo"
                              : "Disponible"}{" "}
                        </span>
                      </td>
                      <td>
                        <div
                          className={["row-actions"].filter(Boolean).join(" ")}
                        >
                          <button
                            title={"Movimientos de stock"}
                            aria-label={"Ver movimientos de stock"}
                            onClick={async (event) => {
                              tienda.showMovements(p);
                              tienda.touch();
                            }}
                            className={["icon-button"]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <Icono name={"clock"} />
                          </button>
                          {tienda.canStock() ? (
                            <>
                              <button
                                title={"Ajustar stock"}
                                aria-label={"Ajustar stock"}
                                onClick={async (event) => {
                                  tienda.openStock(p);
                                  tienda.touch();
                                }}
                                className={["icon-button"]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                <Icono name={"plus"} />
                              </button>
                              <button
                                title={"Editar producto"}
                                aria-label={"Editar producto"}
                                onClick={async (event) => {
                                  tienda.openProduct(p);
                                  tienda.touch();
                                }}
                                className={["icon-button"]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                <Icono name={"edit"} />
                              </button>
                              <button
                                title={"Archivar producto"}
                                aria-label={"Archivar producto"}
                                onClick={async (event) => {
                                  tienda.archiveProduct(p);
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
                      colSpan={"7"}
                      className={["empty-cell"].filter(Boolean).join(" ")}
                    >
                      {" No hay productos que coincidan con los filtros. "}
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
