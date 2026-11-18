import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./caja.scss";
export default function Caja() {
  const tienda = useTienda();
  return (
    <>
      <div className={["page-heading"].filter(Boolean).join(" ")}>
        <div>
          <span className={["eyebrow"].filter(Boolean).join(" ")}>
            {"ATENCIÓN RÁPIDA"}
          </span>
          <h1>{"Tu caja, lista para vender"}</h1>
          <p>{"Selecciona un producto o escanea su código."}</p>
        </div>
        <span className={["pill success"].filter(Boolean).join(" ")}>
          <i></i>
          {" Caja abierta"}
        </span>
      </div>
      <div className={["category-tabs"].filter(Boolean).join(" ")}>
        {tienda.categories().map((c, $index) => (
          <React.Fragment key={c}>
            <button
              onClick={async (event) => {
                tienda.category.set(c);
                tienda.touch();
              }}
              className={[tienda.category() === c ? "selected" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              {" "}
              {c}{" "}
            </button>
          </React.Fragment>
        ))}
      </div>
      <div className={["catalog"].filter(Boolean).join(" ")}>
        {tienda.filteredProducts().length ? (
          tienda.filteredProducts().map((p, $index) => (
            <React.Fragment key={p.id}>
              <button
                disabled={p.stock === 0}
                onClick={async (event) => {
                  tienda.add(p);
                  tienda.touch();
                }}
                className={["product-card"].filter(Boolean).join(" ")}
              >
                <div
                  data-type={p.image}
                  className={["product-visual"].filter(Boolean).join(" ")}
                >
                  <img
                    src={tienda.productImage(p.image)}
                    alt={p.name}
                    onError={async (event) => {
                      tienda.imageFallback(event);
                      tienda.touch();
                    }}
                  />
                  {p.stock <= p.minStock ? (
                    <>
                      <span
                        className={["pill warning"].filter(Boolean).join(" ")}
                      >
                        {""}
                        {p.stock === 0 ? "Agotado" : "Últimas unidades"}{" "}
                      </span>
                    </>
                  ) : null}
                </div>
                <small>
                  {""}
                  {p.category}
                  {" · "}
                  {p.sku}{" "}
                </small>
                <strong>
                  {""}
                  {p.name}{" "}
                </strong>
                <span className={["product-footer"].filter(Boolean).join(" ")}>
                  <b>
                    {""}
                    {tienda.money(p.price)}{" "}
                  </b>
                  <em>
                    {""}
                    {p.stock}
                    {" disponibles"}
                  </em>
                  <span className={["add-circle"].filter(Boolean).join(" ")}>
                    <Icono name={"plus"} />
                  </span>
                </span>
              </button>
            </React.Fragment>
          ))
        ) : (
          <>
            <div className={["empty-state"].filter(Boolean).join(" ")}>
              <Icono name={"search"} />
              <h3>{"No encontramos productos"}</h3>
              <p>{"Prueba con otro nombre o código."}</p>
              <button
                onClick={async (event) => {
                  tienda.query.set("");
                  tienda.category.set("Todos");
                  tienda.touch();
                }}
                className={["ui-button ui-text"].filter(Boolean).join(" ")}
              >
                {" Limpiar búsqueda "}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
