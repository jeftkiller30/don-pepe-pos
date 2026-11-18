import React from "react";
import { useTienda } from "../servicios/tienda";
import Icono from "../icono/Icono";
import "./dialogos.scss";
export default function Dialogos() {
  const tienda = useTienda();
  return (
    <>
      {tienda.modal() ? (
        <>
          <div
            onClick={async (event) => {
              tienda.closeModal();
              tienda.touch();
            }}
            className={["modal-backdrop"].filter(Boolean).join(" ")}
          >
            <section
              role={"dialog"}
              aria-modal={"true"}
              aria-labelledby={"modal-title"}
              onClick={async (event) => {
                event.stopPropagation();
                tienda.touch();
              }}
              className={[
                "modal",
                tienda.modal() === "movements" ? "wide" : "",
                tienda.modal() === "receipt" ? "receipt-modal" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                aria-label={"Cerrar diálogo"}
                disabled={tienda.busy()}
                onClick={async (event) => {
                  tienda.closeModal();
                  tienda.touch();
                }}
                className={["modal-close icon-button"]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icono name={"close"} />
              </button>
              {tienda.modal() === "product" ? (
                <>
                  <span className={["eyebrow"].filter(Boolean).join(" ")}>
                    {"INVENTARIO"}
                  </span>
                  <h2 id={"modal-title"}>
                    {" "}
                    {tienda.selected
                      ? "Editar producto"
                      : "Nuevo producto"}{" "}
                  </h2>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      tienda.saveProduct();
                      tienda.touch();
                    }}
                  >
                    <label>
                      {"Nombre"}
                      <input
                        name={"name"}
                        required={true}
                        minLength={"2"}
                        maxLength={"100"}
                        value={tienda.form.name ?? ""}
                        onChange={async (event) => {
                          tienda.form.name = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <div className={["form-grid"].filter(Boolean).join(" ")}>
                      <label>
                        {"Código / código de barras"}
                        <input
                          name={"sku"}
                          required={true}
                          pattern={"[A-Za-z0-9_-]{1,40}"}
                          value={tienda.form.sku ?? ""}
                          onChange={async (event) => {
                            tienda.form.sku = event.target.value;
                            tienda.touch();
                          }}
                        />
                      </label>
                      <label>
                        {"Categoría"}
                        <select
                          name={"category"}
                          required={true}
                          disabled={tienda.busy()}
                          value={tienda.form.category ?? ""}
                          onChange={async (event) => {
                            tienda.form.category = event.target.value;
                            tienda.touch();
                          }}
                        >
                          <option value={""} disabled={true}>
                            {"Selecciona una categoría"}
                          </option>
                          {tienda
                            .categories()
                            .slice(1)
                            .map((c, $index) => (
                              <React.Fragment key={c}>
                                <option value={c}>
                                  {""}
                                  {c}
                                  {""}
                                </option>
                              </React.Fragment>
                            ))}
                        </select>
                      </label>
                      <label>
                        {"Precio fijo (S/)"}
                        <input
                          type={"text"}
                          value={"1.00"}
                          readOnly={true}
                          aria-label={"Precio fijo: un sol"}
                          className={["fixed-price"].filter(Boolean).join(" ")}
                        />
                      </label>
                      <label>
                        {"Stock mínimo"}
                        <input
                          name={"minStock"}
                          type={"number"}
                          min={"0"}
                          max={"100000"}
                          step={"1"}
                          required={true}
                          value={tienda.form.minStock ?? ""}
                          onChange={async (event) => {
                            tienda.form.minStock =
                              event.target.value === ""
                                ? ""
                                : Number(event.target.value);
                            tienda.touch();
                          }}
                        />
                      </label>
                    </div>
                    <label>
                      {"Subir fotografía (opcional)"}
                      <input
                        name={"photo"}
                        type={"file"}
                        accept={"image/jpeg,image/png,image/webp"}
                        disabled={tienda.busy()}
                        onChange={async (event) => {
                          tienda.selectProductImage(event);
                          tienda.touch();
                        }}
                      />
                      <small className={["muted"].filter(Boolean).join(" ")}>
                        {"JPG, PNG o WebP · Máximo 5 MB"}
                      </small>
                    </label>
                    {tienda.selected &&
                    !tienda.imageFile &&
                    tienda.form.image !== "box" ? (
                      <>
                        <p className={["form-note"].filter(Boolean).join(" ")}>
                          {
                            " Se conservará la fotografía actual si no seleccionas otra. "
                          }
                        </p>
                      </>
                    ) : null}
                    <p className={["form-note"].filter(Boolean).join(" ")}>
                      {
                        " El stock se registra desde “Ajustar stock” para mantener el historial. "
                      }
                    </p>
                    <button
                      disabled={tienda.busy()}
                      className={["ui-button ui-flat", "primary full"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Guardar producto "}
                    </button>
                  </form>
                </>
              ) : tienda.modal() === "stock" ? (
                <>
                  <span className={["eyebrow"].filter(Boolean).join(" ")}>
                    {"CONTROL DE EXISTENCIAS"}
                  </span>
                  <h2 id={"modal-title"}>{"Ajustar stock"}</h2>
                  <p>
                    {" "}
                    {tienda.selected.name}
                    {" · Stock actual: "}
                    <b>
                      {""}
                      {tienda.selected.stock}{" "}
                    </b>
                  </p>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      tienda.saveStock();
                      tienda.touch();
                    }}
                  >
                    <label>
                      {"Unidades a añadir o retirar"}
                      <input
                        name={"quantity"}
                        type={"number"}
                        step={"1"}
                        min={"-100000"}
                        max={"100000"}
                        required={true}
                        value={tienda.form.quantity ?? ""}
                        onChange={async (event) => {
                          tienda.form.quantity =
                            event.target.value === ""
                              ? ""
                              : Number(event.target.value);
                          tienda.touch();
                        }}
                      />
                    </label>
                    <small className={["muted"].filter(Boolean).join(" ")}>
                      {"Usa un número negativo para retirar unidades."}
                    </small>
                    <label>
                      {"Motivo"}
                      <textarea
                        name={"reason"}
                        required={true}
                        minLength={"3"}
                        maxLength={"200"}
                        value={tienda.form.reason ?? ""}
                        onChange={async (event) => {
                          tienda.form.reason = event.target.value;
                          tienda.touch();
                        }}
                      ></textarea>
                    </label>
                    <button
                      disabled={tienda.busy() || !tienda.form.quantity}
                      className={["ui-button ui-flat", "primary full"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Actualizar stock "}
                    </button>
                  </form>
                </>
              ) : tienda.modal() === "customer" ? (
                <>
                  <span className={["eyebrow"].filter(Boolean).join(" ")}>
                    {"CLIENTES"}
                  </span>
                  <h2 id={"modal-title"}>
                    {" "}
                    {tienda.selected ? "Editar cliente" : "Nuevo cliente"}{" "}
                  </h2>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      tienda.saveCustomer();
                      tienda.touch();
                    }}
                  >
                    <label>
                      {"Nombre completo"}
                      <input
                        name={"name"}
                        required={true}
                        minLength={"2"}
                        maxLength={"100"}
                        value={tienda.form.name ?? ""}
                        onChange={async (event) => {
                          tienda.form.name = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <label>
                      {"Documento (opcional)"}
                      <input
                        name={"document"}
                        maxLength={"20"}
                        placeholder={"DNI, RUC u otro documento"}
                        value={tienda.form.document ?? ""}
                        onChange={async (event) => {
                          tienda.form.document = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <div className={["form-grid"].filter(Boolean).join(" ")}>
                      <label>
                        {"Teléfono"}
                        <input
                          name={"phone"}
                          type={"tel"}
                          maxLength={"30"}
                          value={tienda.form.phone ?? ""}
                          onChange={async (event) => {
                            tienda.form.phone = event.target.value;
                            tienda.touch();
                          }}
                        />
                      </label>
                      <label>
                        {"Correo"}
                        <input
                          name={"email"}
                          type={"email"}
                          maxLength={"160"}
                          value={tienda.form.email ?? ""}
                          onChange={async (event) => {
                            tienda.form.email = event.target.value;
                            tienda.touch();
                          }}
                        />
                      </label>
                    </div>
                    <button
                      disabled={tienda.busy()}
                      className={["ui-button ui-flat", "primary full"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Guardar cliente "}
                    </button>
                  </form>
                </>
              ) : tienda.modal() === "payment" ? (
                <>
                  <span className={["eyebrow"].filter(Boolean).join(" ")}>
                    {"FINALIZAR VENTA"}
                  </span>
                  <h2 id={"modal-title"}>{"Todo listo para cobrar"}</h2>
                  <div className={["payment-total"].filter(Boolean).join(" ")}>
                    {" "}
                    {tienda.money(tienda.total())}{" "}
                    <span>
                      {""}
                      {tienda.itemCount()}
                      {" productos"}
                    </span>
                  </div>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      tienda.pay();
                      tienda.touch();
                    }}
                  >
                    <div
                      className={["payment-options"].filter(Boolean).join(" ")}
                    >
                      {["CASH", "YAPE", "CARD"].map((m, $index) => (
                        <React.Fragment key={m}>
                          <button
                            type={"button"}
                            onClick={async (event) => {
                              tienda.payment = m;
                              tienda.touch();
                            }}
                            className={[tienda.payment === m ? "selected" : ""]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <Icono
                              name={
                                m === "CASH"
                                  ? "cash"
                                  : m === "YAPE"
                                    ? "phone"
                                    : "card"
                              }
                            />
                            {""}
                            {tienda.paymentName(m)}{" "}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                    {tienda.payment === "CASH" ? (
                      <>
                        <label>
                          {"Efectivo recibido (S/)"}
                          <input
                            name={"received"}
                            type={"number"}
                            max={"1000000"}
                            step={"0.01"}
                            required={true}
                            min={tienda.total() / 100}
                            value={tienda.received ?? ""}
                            onChange={async (event) => {
                              tienda.received =
                                event.target.value === ""
                                  ? ""
                                  : Number(event.target.value);
                              tienda.touch();
                            }}
                          />
                        </label>
                        <div
                          className={["change-box"].filter(Boolean).join(" ")}
                        >
                          <span>{"Vuelto"}</span>
                          <strong>
                            {""}
                            {tienda.money(tienda.changeDue())}{" "}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <p
                          className={["payment-notice"]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <Icono name={"warning"} />
                          {
                            " Verifica el pago en tu billetera o terminal antes de confirmar. El sistema registra el medio de pago; no procesa el cargo. "
                          }
                        </p>
                      </>
                    )}
                    <button
                      disabled={
                        tienda.busy() ||
                        (tienda.payment === "CASH" &&
                          (tienda.received || 0) * 100 < tienda.total())
                      }
                      className={["ui-button ui-flat", "primary full"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" "}
                      {tienda.busy()
                        ? "Registrando…"
                        : "Confirmar y registrar venta"}{" "}
                    </button>
                  </form>
                </>
              ) : tienda.modal() === "receipt" ? (
                <>
                  <div className={["print-receipt"].filter(Boolean).join(" ")}>
                    <img
                      src={"/assets/logo-don-pepe.png"}
                      alt={"La Tiendita de Don Pepe"}
                      className={["receipt-logo"].filter(Boolean).join(" ")}
                    />
                    <h2 id={"modal-title"}>
                      {""}
                      {tienda.settings().name}
                      {""}
                    </h2>
                    <p>
                      {""}
                      {tienda.settings().address}
                      {""}
                    </p>
                    {tienda.settings().phone ? (
                      <>
                        <p>
                          {""}
                          {tienda.settings().phone}
                          {""}
                        </p>
                      </>
                    ) : null}
                    <h3>
                      {""}
                      {tienda.ticket(tienda.receipt.id)}
                      {""}
                    </h3>
                    <p>
                      {" "}
                      {tienda.date(tienda.receipt.createdAt)}
                      {" · "}
                      {tienda.receipt.cashier.name}{" "}
                    </p>
                    <p>
                      {"Cliente: "}
                      {tienda.receipt.customerName}
                      {""}
                    </p>
                    {tienda.receipt.status === "CANCELLED" ? (
                      <>
                        <div className={["error"].filter(Boolean).join(" ")}>
                          {" VENTA ANULADA · "}
                          {tienda.receipt.cancelReason}{" "}
                        </div>
                      </>
                    ) : null}
                    <div
                      className={["receipt-rule"].filter(Boolean).join(" ")}
                    ></div>
                    {tienda.receipt.items.map((i, $index) => (
                      <React.Fragment key={i.id}>
                        <div
                          className={["receipt-line"].filter(Boolean).join(" ")}
                        >
                          <span>
                            {""}
                            {i.quantity}
                            {" × "}
                            {i.name}{" "}
                            <small>
                              {""}
                              {tienda.money(i.price)}
                              {" c/u"}
                            </small>
                          </span>
                          <b>
                            {""}
                            {tienda.money(i.total)}{" "}
                          </b>
                        </div>
                      </React.Fragment>
                    ))}
                    <div
                      className={["receipt-rule"].filter(Boolean).join(" ")}
                    ></div>
                    <div className={["receipt-line"].filter(Boolean).join(" ")}>
                      <span>{"Subtotal"}</span>
                      <span>
                        {""}
                        {tienda.money(tienda.receipt.subtotal)}{" "}
                      </span>
                    </div>
                    <div className={["receipt-line"].filter(Boolean).join(" ")}>
                      <span>{"Descuento"}</span>
                      <span>
                        {""}
                        {tienda.money(tienda.receipt.discount)}{" "}
                      </span>
                    </div>
                    <div
                      className={["receipt-line receipt-total"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <strong>{"TOTAL"}</strong>
                      <strong>
                        {""}
                        {tienda.money(tienda.receipt.total)}{" "}
                      </strong>
                    </div>
                    <div className={["receipt-line"].filter(Boolean).join(" ")}>
                      <span>
                        {""}
                        {tienda.paymentName(tienda.receipt.payment)}{" "}
                      </span>
                      <span>
                        {""}
                        {tienda.money(tienda.receipt.received)}{" "}
                      </span>
                    </div>
                    <div className={["receipt-line"].filter(Boolean).join(" ")}>
                      <span>{"Vuelto"}</span>
                      <span>
                        {""}
                        {tienda.money(tienda.receipt.change)}{" "}
                      </span>
                    </div>
                    <div
                      className={["receipt-rule"].filter(Boolean).join(" ")}
                    ></div>
                    <p>
                      {""}
                      {tienda.settings().receiptMessage}
                      {""}
                    </p>
                    <small className={["muted"].filter(Boolean).join(" ")}>
                      {
                        "Ticket interno de venta · No es un comprobante electrónico SUNAT"
                      }
                    </small>
                  </div>
                  <button
                    onClick={async (event) => {
                      tienda.print();
                      tienda.touch();
                    }}
                    className={["ui-button ui-flat", "primary full no-print"]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <Icono name={"print"} />
                    {" Imprimir / guardar PDF "}
                  </button>
                </>
              ) : tienda.modal() === "cancel" ? (
                <>
                  <span className={["eyebrow"].filter(Boolean).join(" ")}>
                    {"ANULACIÓN"}
                  </span>
                  <h2 id={"modal-title"}>
                    {"Anular "}
                    {tienda.ticket(tienda.selected.id)}
                    {""}
                  </h2>
                  <p>
                    {
                      " Se devolverán las unidades al inventario y se conservará el registro de esta venta. "
                    }
                  </p>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      tienda.saveCancel();
                      tienda.touch();
                    }}
                  >
                    <label>
                      {"Motivo de anulación"}
                      <textarea
                        name={"reason"}
                        minLength={"5"}
                        maxLength={"200"}
                        required={true}
                        value={tienda.form.reason ?? ""}
                        onChange={async (event) => {
                          tienda.form.reason = event.target.value;
                          tienda.touch();
                        }}
                      ></textarea>
                    </label>
                    <button
                      disabled={tienda.busy()}
                      className={["ui-button ui-flat", "danger-button full"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Anular venta "}
                    </button>
                  </form>
                </>
              ) : tienda.modal() === "movements" ? (
                <>
                  <span className={["eyebrow"].filter(Boolean).join(" ")}>
                    {"TRAZABILIDAD"}
                  </span>
                  <h2 id={"modal-title"}>
                    {"Movimientos de "}
                    {tienda.selected.name}
                    {""}
                  </h2>
                  <p>{"Los últimos 100 movimientos registrados."}</p>
                  <div className={["table-scroll"].filter(Boolean).join(" ")}>
                    <table>
                      <thead>
                        <tr>
                          <th>{"Fecha"}</th>
                          <th>{"Unidades"}</th>
                          <th>{"Motivo"}</th>
                          <th>{"Responsable"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tienda.movements().length ? (
                          tienda.movements().map((m, $index) => (
                            <React.Fragment key={m.id}>
                              <tr>
                                <td>
                                  {""}
                                  {tienda.date(m.createdAt)}
                                  {""}
                                </td>
                                <td
                                  className={[m.quantity > 0 ? "positive" : ""]
                                    .filter(Boolean)
                                    .join(" ")}
                                >
                                  {" "}
                                  {m.quantity > 0 ? "+" : ""}
                                  {""}
                                  {m.quantity}{" "}
                                </td>
                                <td>
                                  {""}
                                  {m.reason}
                                  {""}
                                </td>
                                <td>
                                  {""}
                                  {m.user.name}
                                  {""}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))
                        ) : (
                          <>
                            <tr>
                              <td
                                colSpan={"4"}
                                className={["empty-cell"]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                {"Sin movimientos."}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : tienda.modal() === "settings" ? (
                <>
                  <h2 id={"modal-title"}>{"Datos de la tienda"}</h2>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      tienda.saveSettings();
                      tienda.touch();
                    }}
                  >
                    <label>
                      {"Nombre comercial"}
                      <input
                        name={"name"}
                        required={true}
                        minLength={"2"}
                        maxLength={"100"}
                        value={tienda.form.name ?? ""}
                        onChange={async (event) => {
                          tienda.form.name = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <label>
                      {"Dirección"}
                      <input
                        name={"address"}
                        required={true}
                        minLength={"2"}
                        maxLength={"200"}
                        value={tienda.form.address ?? ""}
                        onChange={async (event) => {
                          tienda.form.address = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <label>
                      {"Teléfono"}
                      <input
                        name={"phone"}
                        maxLength={"30"}
                        value={tienda.form.phone ?? ""}
                        onChange={async (event) => {
                          tienda.form.phone = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <label>
                      {"Mensaje en el ticket"}
                      <input
                        name={"receiptMessage"}
                        maxLength={"200"}
                        value={tienda.form.receiptMessage ?? ""}
                        onChange={async (event) => {
                          tienda.form.receiptMessage = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <button
                      disabled={tienda.busy()}
                      className={["ui-button ui-flat", "primary full"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Guardar cambios "}
                    </button>
                  </form>
                </>
              ) : tienda.modal() === "user" ? (
                <>
                  <h2 id={"modal-title"}>{"Nuevo integrante"}</h2>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      tienda.saveUser();
                      tienda.touch();
                    }}
                  >
                    <label>
                      {"Nombre"}
                      <input
                        name={"name"}
                        minLength={"2"}
                        maxLength={"80"}
                        required={true}
                        value={tienda.form.name ?? ""}
                        onChange={async (event) => {
                          tienda.form.name = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <label>
                      {"Correo"}
                      <input
                        name={"email"}
                        type={"email"}
                        required={true}
                        value={tienda.form.email ?? ""}
                        onChange={async (event) => {
                          tienda.form.email = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <label>
                      {"Contraseña"}
                      <input
                        name={"password"}
                        type={"password"}
                        minLength={"10"}
                        maxLength={"72"}
                        autoComplete={"new-password"}
                        required={true}
                        value={tienda.form.password ?? ""}
                        onChange={async (event) => {
                          tienda.form.password = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <label>
                      {"Rol"}
                      <select
                        name={"role"}
                        value={tienda.form.role ?? ""}
                        onChange={async (event) => {
                          tienda.form.role = event.target.value;
                          tienda.touch();
                        }}
                      >
                        <option value={"CASHIER"}>
                          {"Cajero · ventas y clientes"}
                        </option>
                        <option value={"INVENTORY"}>
                          {"Inventario · productos y stock"}
                        </option>
                        <option value={"ADMIN"}>
                          {"Administrador · acceso completo"}
                        </option>
                      </select>
                    </label>
                    <button
                      disabled={tienda.busy()}
                      className={["ui-button ui-flat", "primary full"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Crear usuario "}
                    </button>
                  </form>
                </>
              ) : tienda.modal() === "password" ? (
                <>
                  <h2 id={"modal-title"}>{"Cambiar contraseña"}</h2>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      tienda.savePassword();
                      tienda.touch();
                    }}
                  >
                    <label>
                      {"Contraseña actual"}
                      <input
                        name={"currentPassword"}
                        type={"password"}
                        autoComplete={"current-password"}
                        required={true}
                        value={tienda.form.currentPassword ?? ""}
                        onChange={async (event) => {
                          tienda.form.currentPassword = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <label>
                      {"Nueva contraseña"}
                      <input
                        name={"newPassword"}
                        type={"password"}
                        minLength={"10"}
                        maxLength={"72"}
                        autoComplete={"new-password"}
                        required={true}
                        value={tienda.form.newPassword ?? ""}
                        onChange={async (event) => {
                          tienda.form.newPassword = event.target.value;
                          tienda.touch();
                        }}
                      />
                    </label>
                    <p className={["muted"].filter(Boolean).join(" ")}>
                      {"Usa al menos 10 caracteres."}
                    </p>
                    <button
                      disabled={tienda.busy()}
                      className={["ui-button ui-flat", "primary full"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Actualizar contraseña "}
                    </button>
                  </form>
                </>
              ) : tienda.modal() === "confirm" ? (
                <>
                  <h2 id={"modal-title"}>
                    {""}
                    {tienda.form.title}
                    {""}
                  </h2>
                  <p>
                    {""}
                    {tienda.form.message}
                    {""}
                  </p>
                  <div className={["modal-actions"].filter(Boolean).join(" ")}>
                    <button
                      disabled={tienda.busy()}
                      onClick={async (event) => {
                        tienda.closeModal();
                        tienda.touch();
                      }}
                      className={["ui-button ui-outline"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Volver "}
                    </button>
                    <button
                      disabled={tienda.busy()}
                      onClick={async (event) => {
                        tienda.acceptConfirm();
                        tienda.touch();
                      }}
                      className={["ui-button ui-flat", "primary"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {" Confirmar "}
                    </button>
                  </div>
                </>
              ) : null}
              {tienda.error() ? (
                <>
                  <div
                    role={"alert"}
                    className={["error"].filter(Boolean).join(" ")}
                  >
                    {""}
                    {tienda.error()}
                    {""}
                  </div>
                </>
              ) : null}
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}
