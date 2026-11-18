import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./carrito.scss";
export default function Carrito() {
  const tienda = useTienda();
  return (
    <>
      <aside className={["checkout"].filter(Boolean).join(" ")}>
        <div className={["checkout-heading"].filter(Boolean).join(" ")}>
          <div>
            <span className={["eyebrow"].filter(Boolean).join(" ")}>
              {"PUNTO DE VENTA"}
            </span>
            <h2>
              {" Nueva venta "}
              <span>
                {""}
                {tienda.itemCount()}{" "}
              </span>
            </h2>
          </div>
          <button
            disabled={!tienda.cart().length}
            onClick={async (event) => {
              tienda.clearCart();
              tienda.touch();
            }}
            className={["text-link danger"].filter(Boolean).join(" ")}
          >
            <Icono name={"trash"} />
            {" Limpiar "}
          </button>
        </div>
        <div className={["checkout-search"].filter(Boolean).join(" ")}>
          <Icono name={"search"} />
          <input
            aria-label={"Buscar o escanear producto"}
            placeholder={"Buscar o escanear producto…"}
            value={tienda.query() ?? ""}
            onChange={async (event) => {
              tienda.query.set(event.target.value);
              tienda.touch();
            }}
            onKeyDown={async (event) => {
              if (event.key !== "Enter") return;
              tienda.scan();
              tienda.touch();
            }}
          />
          <button
            aria-label={"Añadir producto por código"}
            title={"Escanea el código con tu lector USB y pulsa Enter"}
            onClick={async (event) => {
              tienda.scan();
              tienda.touch();
            }}
            className={["icon-button"].filter(Boolean).join(" ")}
          >
            <Icono name={"scan"} />
          </button>
        </div>
        {tienda.query() ? (
          <>
            <div className={["search-results"].filter(Boolean).join(" ")}>
              {tienda.filteredProducts().slice(0, 5).length ? (
                tienda
                  .filteredProducts()
                  .slice(0, 5)
                  .map((p, $index) => (
                    <React.Fragment key={p.id}>
                      <button
                        onClick={async (event) => {
                          tienda.add(p);
                          tienda.query.set("");
                          tienda.touch();
                        }}
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
                          {""}
                          {p.name}{" "}
                          <small>
                            {""}
                            {p.stock}
                            {" disponibles"}
                          </small>
                        </span>
                        <strong>
                          {""}
                          {tienda.money(p.price)}{" "}
                        </strong>
                      </button>
                    </React.Fragment>
                  ))
              ) : (
                <>
                  <p>{"Sin resultados."}</p>
                </>
              )}
            </div>
          </>
        ) : null}
        <div className={["cart-items"].filter(Boolean).join(" ")}>
          {tienda.cart().length ? (
            tienda.cart().map((i, $index) => (
              <React.Fragment key={i.id}>
                <div className={["cart-item"].filter(Boolean).join(" ")}>
                  <img
                    alt={""}
                    src={tienda.productImage(i.image)}
                    onError={async (event) => {
                      tienda.imageFallback(event);
                      tienda.touch();
                    }}
                  />
                  <div
                    className={["cart-item-details"].filter(Boolean).join(" ")}
                  >
                    <strong>
                      {""}
                      {i.name}{" "}
                    </strong>
                    <div>
                      <span>
                        {""}
                        {tienda.money(i.price)}{" "}
                      </span>
                      <div className={["stepper"].filter(Boolean).join(" ")}>
                        <button
                          aria-label={"Reducir cantidad"}
                          onClick={async (event) => {
                            tienda.change(i.id, -1);
                            tienda.touch();
                          }}
                        >
                          <Icono name={"minus"} />
                        </button>
                        <b>
                          {""}
                          {i.quantity}{" "}
                        </b>
                        <button
                          aria-label={"Aumentar cantidad"}
                          onClick={async (event) => {
                            tienda.change(i.id, 1);
                            tienda.touch();
                          }}
                        >
                          <Icono name={"plus"} />
                        </button>
                      </div>
                      <b>
                        {""}
                        {tienda.money(i.price * i.quantity)}{" "}
                      </b>
                    </div>
                  </div>
                  <button
                    aria-label={"Quitar producto"}
                    onClick={async (event) => {
                      tienda.remove(i.id);
                      tienda.touch();
                    }}
                    className={["remove-item"].filter(Boolean).join(" ")}
                  >
                    <Icono name={"close"} />
                  </button>
                </div>
              </React.Fragment>
            ))
          ) : (
            <>
              <div className={["cart-empty"].filter(Boolean).join(" ")}>
                <div className={["empty-bag"].filter(Boolean).join(" ")}>
                  <Icono name={"cart"} />
                </div>
                <h3>{"Una nueva venta te espera"}</h3>
                <p>
                  {"Busca un producto o elígelo"}
                  <br />
                  {"del catálogo para comenzar."}
                </p>
                <button
                  onClick={async (event) => {
                    tienda.navigate("caja");
                    tienda.touch();
                  }}
                  className={["ui-button ui-outline"].filter(Boolean).join(" ")}
                >
                  {" Explorar productos "}
                  <Icono name={"arrow"} />
                </button>
              </div>
            </>
          )}
        </div>
        <div className={["checkout-bottom"].filter(Boolean).join(" ")}>
          <label className={["customer-select"].filter(Boolean).join(" ")}>
            <Icono name={"users"} />
            <select
              aria-label={"Cliente de la venta"}
              value={tienda.customerId ?? ""}
              onChange={async (event) => {
                tienda.customerId = event.target.value;
                tienda.touch();
              }}
            >
              <option value={""}>{"Público general"}</option>
              {tienda.customers().map((c, $index) => (
                <React.Fragment key={c.id}>
                  <option value={c.id}>
                    {""}
                    {c.name}
                    {""}
                  </option>
                </React.Fragment>
              ))}
            </select>
            <button
              title={"Registrar cliente"}
              aria-label={"Registrar cliente"}
              onClick={async (event) => {
                tienda.openCustomer();
                tienda.touch();
              }}
              className={["icon-button"].filter(Boolean).join(" ")}
            >
              <Icono name={"plus"} />
            </button>
          </label>
          <div className={["totals-row"].filter(Boolean).join(" ")}>
            <span>{"Subtotal"}</span>
            <strong>
              {""}
              {tienda.money(tienda.subtotal())}{" "}
            </strong>
          </div>
          <div className={["totals-row"].filter(Boolean).join(" ")}>
            <label htmlFor={"discount"}>{"Descuento"}</label>
            {tienda.isAdmin() ? (
              <>
                <div className={["discount-input"].filter(Boolean).join(" ")}>
                  <span>{"S/"}</span>
                  <input
                    id={"discount"}
                    type={"number"}
                    min={"0"}
                    step={"0.01"}
                    value={tienda.discount ?? ""}
                    onChange={async (event) => {
                      tienda.discount =
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value);
                      tienda.changedCart();
                      tienda.touch();
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <strong>{"S/ 0.00"}</strong>
              </>
            )}
          </div>
          <div className={["total-box"].filter(Boolean).join(" ")}>
            <strong>{"Total"}</strong>
            <b>
              {""}
              {tienda.money(tienda.total())}{" "}
            </b>
          </div>
          <button
            disabled={
              !tienda.cart().length || tienda.busy() || tienda.total() <= 0
            }
            onClick={async (event) => {
              tienda.checkout();
              tienda.touch();
            }}
            className={["ui-button ui-flat", "pay-button"]
              .filter(Boolean)
              .join(" ")}
          >
            <Icono name={"cash"} />
            {" Cobrar venta "}
            <Icono name={"arrow"} />
          </button>
          <div className={["checkout-note"].filter(Boolean).join(" ")}>
            <Icono name={"lock"} />
            {" Venta y stock guardados juntos "}
          </div>
        </div>
      </aside>
    </>
  );
}
