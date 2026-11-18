import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Aplicacion from "./aplicacion/Aplicacion";
import { tienda, useTienda } from "./servicios/tienda";
import "./styles.scss";
import "./react.scss";
function Root() {
  const s = useTienda();
  useEffect(() => {
    tienda.start();
  }, []);
  useEffect(() => {
    if (!s.modal()) return;
    const previous = document.activeElement;
    const dialog = document.querySelector('[role="dialog"]');
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
        ) || [],
      );
    focusables()[0]?.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      if (e.shiftKey && document.activeElement === list[0]) {
        e.preventDefault();
        list.at(-1).focus();
      }
      if (!e.shiftKey && document.activeElement === list.at(-1)) {
        e.preventDefault();
        list[0].focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus?.();
    };
  }, [s.modal()]);
  return (
    <>
      <Aplicacion />
      {s.toast() && (
        <div className="toast" role="status">
          {s.toast()}
          <button onClick={() => s.toast.set("")}>Cerrar</button>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<Root />);
