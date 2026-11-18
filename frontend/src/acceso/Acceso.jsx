import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./acceso.scss";
export default function Acceso() {
  const tienda = useTienda();
  return (
    <>
      <div className={["login-page"].filter(Boolean).join(" ")}>
        <section className={["login-brand"].filter(Boolean).join(" ")}>
          <img
            src={"/assets/logo-don-pepe-transparente.png"}
            alt={"La Tiendita de Don Pepe"}
          />
          <h1>
            {"Todo lo que necesitas"}
            <br />
            <span>{"para vender mejor."}</span>
          </h1>
          <p>{"Caja, inventario y clientes en un solo lugar."}</p>
          <ul className={["login-benefits"].filter(Boolean).join(" ")}>
            <li>
              <span>
                <Icono name={"cart"} />
              </span>
              {"Ventas rápidas"}
            </li>
            <li>
              <span>
                <Icono name={"box"} />
              </span>
              {"Inventario ordenado"}
            </li>
            <li>
              <span>
                <Icono name={"chart"} />
              </span>
              {"Control diario"}
            </li>
          </ul>
          <div className={["login-badge"].filter(Boolean).join(" ")}>
            <Icono name={"store"} />
            {" Sistema de ventas · Tienda de S/ 1 "}
          </div>
        </section>
        <section className={["login-main"].filter(Boolean).join(" ")}>
          <span
            aria-hidden={"true"}
            className={["login-decoration"].filter(Boolean).join(" ")}
          ></span>
          <div className={["login-form"].filter(Boolean).join(" ")}>
            <span className={["mini-label"].filter(Boolean).join(" ")}>
              {"BIENVENIDO A DON PEPE"}
            </span>
            <h2>{"Inicia sesión"}</h2>
            <p className={["muted"].filter(Boolean).join(" ")}>
              {"Accede para continuar tu jornada."}
            </p>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                tienda.login();
                tienda.touch();
              }}
            >
              <label>
                {"Correo electrónico"}
                <input
                  name={"email"}
                  type={"email"}
                  required={true}
                  autoComplete={"username"}
                  placeholder={"tu@correo.com"}
                  value={tienda.email ?? ""}
                  onChange={async (event) => {
                    tienda.email = event.target.value;
                    tienda.touch();
                  }}
                />
              </label>
              <label>
                {"Contraseña "}
                <div className={["password-input"].filter(Boolean).join(" ")}>
                  <input
                    name={"password"}
                    required={true}
                    autoComplete={"current-password"}
                    type={tienda.showPassword ? "text" : "password"}
                    value={tienda.password ?? ""}
                    onChange={async (event) => {
                      tienda.password = event.target.value;
                      tienda.touch();
                    }}
                  />
                  <button
                    type={"button"}
                    aria-pressed={tienda.showPassword}
                    aria-label={
                      tienda.showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    onClick={async (event) => {
                      tienda.showPassword = !tienda.showPassword;
                      tienda.touch();
                    }}
                    className={["icon-button"].filter(Boolean).join(" ")}
                  >
                    <Icono name={tienda.showPassword ? "eyeoff" : "eye"} />
                  </button>
                </div>
              </label>
              {tienda.error() ? (
                <>
                  <p
                    role={"alert"}
                    className={["error"].filter(Boolean).join(" ")}
                  >
                    {""}
                    {tienda.error()}
                    {""}
                  </p>
                </>
              ) : null}
              <button
                type={"submit"}
                disabled={tienda.busy()}
                aria-busy={tienda.busy()}
                className={["ui-button ui-flat", "primary login-submit"]
                  .filter(Boolean)
                  .join(" ")}
              >
                {" "}
                {tienda.busy() ? "Ingresando…" : "Ingresar al sistema"}{" "}
                {tienda.busy() ? (
                  <>
                    <span
                      aria-hidden={"true"}
                      className={["login-spinner"].filter(Boolean).join(" ")}
                    ></span>
                  </>
                ) : (
                  <>
                    <Icono name={"arrow"} />
                  </>
                )}
              </button>
            </form>
            <div className={["login-note"].filter(Boolean).join(" ")}>
              <Icono name={"lock"} />
              {" Acceso seguro para tu equipo "}
            </div>
          </div>
          <footer>
            {"La Tiendita de Don Pepe © "}
            {tienda.today().slice(0, 4)}
            {""}
          </footer>
        </section>
      </div>
    </>
  );
}
