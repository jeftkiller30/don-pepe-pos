import React from "react";
import { useTienda } from "../servicios/tienda";
import Carrito from "../carrito/Carrito";
import Icono from "../icono/Icono";
import Pantalla from "../Pantalla";
import "./estructura.scss";
export default function Estructura() {
  const tienda = useTienda();
  return (
    <>
      <div
        className={["app-shell", tienda.mobile() ? "menu-open" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {tienda.mobile() ? (
          <>
            <button
              aria-label={"Cerrar menú"}
              onClick={async (event) => {
                tienda.mobile.set(false);
                tienda.touch();
              }}
              className={["mobile-backdrop"].filter(Boolean).join(" ")}
            ></button>
          </>
        ) : null}
        <aside className={["sidebar"].filter(Boolean).join(" ")}>
          <a
            href="/inicio"
            aria-label={"Don Pepe, inicio"}
            onClick={async (event) => {
              event.preventDefault();
              tienda.navigate("inicio");
              tienda.touch();
            }}
            className={["brand"].filter(Boolean).join(" ")}
          >
            <img
              src={"/assets/logo-don-pepe-transparente.png"}
              alt={"La Tiendita de Don Pepe"}
            />
          </a>
          <div className={["sidebar-label"].filter(Boolean).join(" ")}>
            {"MI NEGOCIO"}
          </div>
          <nav>
            {tienda.nav.map((item, $index) => (
              <React.Fragment key={item.id}>
                {tienda.allowed(item.id) ? (
                  <>
                    <a
                      href={"/" + item.id}
                      onClick={async (event) => {
                        event.preventDefault();
                        tienda.navigate(item.id);
                        tienda.touch();
                      }}
                      className={[tienda.page() === item.id ? "active" : ""]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <Icono name={item.icon} />
                      <span>
                        {""}
                        {item.name}{" "}
                      </span>
                      {item.id === "inventario" &&
                      tienda.dashboard()?.lowStock?.length ? (
                        <>
                          <small>
                            {""}
                            {tienda.dashboard().lowStock.length}{" "}
                          </small>
                        </>
                      ) : null}
                    </a>
                  </>
                ) : null}
              </React.Fragment>
            ))}
          </nav>
          <div className={["sidebar-bottom"].filter(Boolean).join(" ")}>
            <a
              href="/configuracion"
              onClick={async (event) => {
                event.preventDefault();
                tienda.navigate("configuracion");
                tienda.touch();
              }}
              className={[tienda.page() === "configuracion" ? "active" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <Icono name={"settings"} />
              {" Configuración"}
            </a>
            <button
              onClick={async (event) => {
                tienda.logout();
                tienda.touch();
              }}
            >
              <Icono name={"logout"} />
              {" Cerrar sesión "}
            </button>
            <div className={["sidebar-foot"].filter(Boolean).join(" ")}>
              {"HECHO PARA TU DÍA A DÍA"}
            </div>
          </div>
        </aside>
        <div className={["workspace"].filter(Boolean).join(" ")}>
          <header className={["topbar"].filter(Boolean).join(" ")}>
            <button
              aria-label={"Abrir menú"}
              onClick={async (event) => {
                tienda.mobile.set(true);
                tienda.touch();
              }}
              className={["icon-button menu-toggle"].filter(Boolean).join(" ")}
            >
              <Icono name={"menu"} />
            </button>
            <div className={["global-search"].filter(Boolean).join(" ")}>
              <Icono name={"search"} />
              <input
                aria-label={"Buscar productos"}
                placeholder={"Buscar productos por nombre o código…"}
                value={tienda.query() ?? ""}
                onChange={async (event) => {
                  tienda.query.set(event.target.value);
                  tienda.touch();
                }}
                onKeyDown={async (event) => {
                  if (event.key !== "Enter") return;
                  tienda.page() === "caja"
                    ? tienda.scan()
                    : tienda.navigate("caja");
                  tienda.touch();
                }}
              />
              <kbd>{"↵"}</kbd>
            </div>
            <div className={["top-actions"].filter(Boolean).join(" ")}>
              <button
                title={"Ver productos con stock bajo"}
                aria-label={"Ver alertas de stock"}
                onClick={async (event) => {
                  tienda.showLow();
                  tienda.touch();
                }}
                className={["icon-button notification"]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icono name={"bell"} />
                {tienda.dashboard()?.lowStock?.length ? (
                  <>
                    <i></i>
                  </>
                ) : null}
              </button>
              <span
                className={["top-divider"].filter(Boolean).join(" ")}
              ></span>
              <button
                onClick={async (event) => {
                  tienda.navigate("configuracion");
                  tienda.touch();
                }}
                className={["profile"].filter(Boolean).join(" ")}
              >
                <span className={["avatar"].filter(Boolean).join(" ")}>
                  {""}
                  {tienda.initials()}{" "}
                </span>
                <span>
                  <strong>
                    {""}
                    {tienda.user().name.split(" ")[0]}{" "}
                  </strong>
                  <small>
                    {""}
                    {tienda.roleName(tienda.user().role)}{" "}
                  </small>
                </span>
                <Icono name={"down"} />
              </button>
            </div>
          </header>
          {tienda.bootError() ? (
            <>
              <div
                role={"alert"}
                className={["connection-error"].filter(Boolean).join(" ")}
              >
                {" "}
                {tienda.bootError()}{" "}
                <button
                  onClick={async (event) => {
                    tienda.reload();
                    tienda.touch();
                  }}
                  className={["ui-button ui-text"].filter(Boolean).join(" ")}
                >
                  {"Reintentar"}
                </button>
              </div>
            </>
          ) : null}
          <main
            className={[
              (tienda.page() === "inicio" || tienda.page() === "caja") &&
              tienda.canSell()
                ? "has-checkout"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className={["page-content"].filter(Boolean).join(" ")}>
              <Pantalla />
            </div>
            {(tienda.page() === "inicio" || tienda.page() === "caja") &&
            tienda.canSell() ? (
              <>
                <Carrito />
              </>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );
}
