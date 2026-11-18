import { signal, computed, emit, useVersion } from "./estado";
import { ApiService } from "./api";
import productCatalog from "../../product-catalog.json";
export class TiendaService {
  productPhotos = productCatalog;
  imageFile: File | null = null;
  productImage(image: string) {
    if (/^upload-[0-9a-f-]{36}\.(jpg|png|webp)$/.test(image))
      return "/api/product-images/" + image;
    return (
      "/assets/products/" +
      (this.productPhotos.some((p) => p.image === image)
        ? image + ".jpg"
        : (/^(snack|cookie|drink|candy|soap|pencil|box)$/.test(image)
            ? image
            : "box") + ".svg")
    );
  }
  imageFallback(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith("/box.svg")) img.src = "/assets/products/box.svg";
  }
  api = new ApiService();
  router = {
    navigate: async (parts: string[]) => {
      history.pushState({}, "", parts[0]);
      this.route();
    },
  };
  toast = signal("");
  touch = emit;
  loading = signal(true);
  busy = signal(false);
  page = signal("inicio");
  modal = signal("");
  mobile = signal(false);
  bootError = signal("");
  error = signal("");
  user = this.api.user;
  products = signal<any[]>([]);
  customers = signal<any[]>([]);
  sales = signal<any[]>([]);
  users = signal<any[]>([]);
  movements = signal<any[]>([]);
  dashboard = signal<any>(null);
  report = signal<any>(null);
  settings = signal<any>({});
  cart = signal<any[]>([]);
  query = signal("");
  category = signal("Todos");
  lowOnly = signal(false);
  searchSales = signal("");
  searchCustomers = signal("");
  period = "today";
  from = this.today();
  to = this.today();
  reportFrom = this.today().slice(0, 8) + "01";
  reportTo = this.today();
  email = "admin@donpepe.local";
  password = "";
  showPassword = false;
  form: any = {};
  selected: any = null;
  receipt: any = null;
  pendingAction: (() => Promise<void>) | null = null;
  payment = "CASH";
  received: number | null = null;
  discount = 0;
  customerId = "";
  requestId = crypto.randomUUID();
  paymentAttempted = false;
  help = false;
  nav = [
    { id: "inicio", name: "Inicio", icon: "home" },
    { id: "caja", name: "Caja", icon: "cash" },
    { id: "inventario", name: "Inventario", icon: "box" },
    { id: "ventas", name: "Ventas", icon: "chart" },
    { id: "clientes", name: "Clientes", icon: "users" },
    { id: "reportes", name: "Reportes", icon: "file" },
  ];
  categories = computed(() => [
    "Todos",
    ...new Set(this.products().map((p) => p.category)),
  ]);
  filteredProducts = computed(() =>
    this.products().filter(
      (p) =>
        (p.name + " " + p.sku)
          .toLowerCase()
          .includes(this.query().toLowerCase()) &&
        (this.category() === "Todos" || p.category === this.category()) &&
        (!this.lowOnly() || p.stock <= p.minStock),
    ),
  );
  filteredCustomers = computed(() =>
    this.customers().filter((c) =>
      (c.name + " " + (c.document || "") + " " + (c.phone || ""))
        .toLowerCase()
        .includes(this.searchCustomers().toLowerCase()),
    ),
  );
  filteredSales = computed(() =>
    this.sales().filter((s) =>
      (
        this.ticket(s.id) +
        " " +
        s.customerName +
        " " +
        this.paymentName(s.payment)
      )
        .toLowerCase()
        .includes(this.searchSales().toLowerCase()),
    ),
  );
  subtotal = computed(() =>
    this.cart().reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
  itemCount = computed(() =>
    this.cart().reduce((sum, i) => sum + i.quantity, 0),
  );
  canSell = computed(() => ["ADMIN", "CASHIER"].includes(this.user()?.role));
  canStock = computed(() => ["ADMIN", "INVENTORY"].includes(this.user()?.role));
  isAdmin = computed(() => this.user()?.role === "ADMIN");
  route() {
    const id = location.pathname.split("/")[1] || "inicio";
    this.page.set(
      [
        "inicio",
        "caja",
        "inventario",
        "ventas",
        "clientes",
        "reportes",
        "configuracion",
      ].includes(id)
        ? id
        : "inicio",
    );
    this.mobile.set(false);
    this.query.set("");
    this.category.set("Todos");
    this.lowOnly.set(false);
    if (this.user()) this.loadPage();
  }
  start() {
    this.route();
    window.addEventListener("popstate", () => this.route());
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.escape();
    });
    window.addEventListener("beforeunload", (e) => this.preventLoss(e));
    this.init();
  }
  today(offset = 0) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(Date.now() + offset * 86400000));
  }
  money(cents: number) {
    return (
      "S/ " +
      ((cents || 0) / 100).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  date(value: any) {
    return new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }
  longDate() {
    return new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }
  ticket(id: number) {
    return "V-" + String(id).padStart(6, "0");
  }
  paymentName(s: string) {
    return (
      ({ CASH: "Efectivo", YAPE: "Yape / Plin", CARD: "Tarjeta" } as any)[s] ||
      s
    );
  }
  roleName(s: string) {
    return (
      (
        {
          ADMIN: "Administrador",
          CASHIER: "Cajero",
          INVENTORY: "Inventario",
        } as any
      )[s] || s
    );
  }
  initials() {
    return (this.user()?.name || "")
      .split(" ")
      .map((s: string) => s[0])
      .slice(0, 2)
      .join("");
  }
  allowed(id: string) {
    return !["caja", "ventas", "clientes"].includes(id) || this.canSell();
  }
  notify(text: string) {
    this.toast.set(text);
    setTimeout(() => {
      if (this.toast() === text) this.toast.set("");
    }, 4500);
  }
  async run(fn: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    try {
      await fn();
    } catch (e: any) {
      this.error.set(e.message);
      this.notify(e.message);
    } finally {
      this.busy.set(false);
    }
  }
  async init() {
    try {
      this.user.set(await this.api.request("auth/me"));
      await this.reload();
    } catch (e: any) {
      if (this.user()) this.bootError.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
  async login() {
    await this.run(async () => {
      this.user.set(
        await this.api.request("auth/login", "POST", {
          email: this.email,
          password: this.password,
        }),
      );
      this.password = "";
      await this.reload();
    });
  }
  async reload() {
    try {
      const [products, settings, customers] = await Promise.all([
        this.api.request("products"),
        this.api.request("settings"),
        this.canSell() ? this.api.request("customers") : Promise.resolve([]),
      ]);
      this.products.set(products);
      this.settings.set(settings);
      this.customers.set(customers);
      await this.loadPage();
      this.bootError.set("");
    } catch (e: any) {
      this.bootError.set(e.message);
      throw e;
    }
  }
  async loadPage() {
    try {
      if (!this.allowed(this.page())) {
        await this.router.navigate(["/inventario"]);
        return;
      }
      if (["inicio", "caja"].includes(this.page())) await this.loadDashboard();
      if (this.page() === "ventas") await this.loadSales();
      if (this.page() === "reportes") await this.loadReport();
      if (this.page() === "configuracion" && this.isAdmin())
        this.users.set(await this.api.request("users"));
    } catch (e: any) {
      this.notify(e.message);
    }
  }
  async loadDashboard() {
    const from =
      this.period === "week"
        ? this.today(-6)
        : this.period === "yesterday"
          ? this.today(-1)
          : this.today();
    const to = this.period === "yesterday" ? this.today(-1) : this.today();
    this.dashboard.set(
      await this.api.request(`dashboard?from=${from}&to=${to}`),
    );
  }
  async loadSales() {
    try {
      this.sales.set(
        await this.api.request(`sales?from=${this.from}&to=${this.to}`),
      );
    } catch (e: any) {
      this.notify(e.message);
    }
  }
  async loadReport() {
    try {
      this.report.set(
        await this.api.request(
          `dashboard?from=${this.reportFrom}&to=${this.reportTo}`,
        ),
      );
    } catch (e: any) {
      this.notify(e.message);
    }
  }
  navigate(id: string) {
    this.router.navigate(["/" + id]);
  }
  async showLow() {
    await this.router.navigate(["/inventario"]);
    this.lowOnly.set(true);
  }
  add(p: any) {
    if (!this.canSell()) return;
    const item = this.cart().find((i) => i.id === p.id);
    if ((item?.quantity || 0) >= p.stock) {
      this.notify("No hay más unidades disponibles.");
      return;
    }
    this.cart.update((items) =>
      item
        ? items.map((i) =>
            i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...items, { ...p, quantity: 1 }],
    );
    this.changedCart();
  }
  change(id: string, delta: number) {
    const p = this.products().find((p) => p.id === id);
    if (delta > 0) {
      if (p) this.add(p);
      return;
    }
    this.cart.update((items) =>
      items
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
    this.changedCart();
  }
  remove(id: string) {
    this.cart.update((items) => items.filter((i) => i.id !== id));
    this.changedCart();
  }
  changedCart() {
    this.requestId = crypto.randomUUID();
    this.paymentAttempted = false;
  }
  scan() {
    const p = this.products().find(
      (p) => p.sku.toLowerCase() === this.query().trim().toLowerCase(),
    );
    if (p) {
      this.add(p);
      this.query.set("");
      this.notify("Producto añadido.");
    } else this.notify("Escribe o escanea un código registrado en inventario.");
  }
  clearCart() {
    if (!this.cart().length) return;
    this.confirm(
      "Vaciar la venta",
      "Se quitarán los productos de la venta en curso.",
      async () => {
        this.cart.set([]);
        this.discount = 0;
        this.customerId = "";
        this.changedCart();
      },
    );
  }
  checkout() {
    if (!this.cart().length) return;
    this.payment = "CASH";
    this.received = this.total() / 100;
    this.error.set("");
    this.modal.set("payment");
  }
  total() {
    return Math.max(
      0,
      this.subtotal() - Math.round((this.discount || 0) * 100),
    );
  }
  changeDue() {
    return Math.max(0, Math.round((this.received || 0) * 100) - this.total());
  }
  async pay() {
    await this.run(async () => {
      if (this.paymentAttempted === false) {
        this.requestId = crypto.randomUUID();
        this.paymentAttempted = true;
      }
      const sale = await this.api.request("sales", "POST", {
        requestId: this.requestId,
        items: this.cart().map((i) => ({
          productId: i.id,
          quantity: i.quantity,
        })),
        payment: this.payment,
        received: Math.round((this.received || 0) * 100),
        discount: Math.round((this.discount || 0) * 100),
        ...(this.customerId ? { customerId: this.customerId } : {}),
      });
      this.receipt = sale;
      this.cart.set([]);
      this.discount = 0;
      this.customerId = "";
      this.changedCart();
      this.modal.set("receipt");
      this.notify("Venta registrada correctamente.");
      await this.reload();
    });
  }
  openProduct(p?: any) {
    this.selected = p;
    this.imageFile = null;
    this.form = p
      ? {
          name: p.name,
          sku: p.sku,
          category: p.category,
          minStock: p.minStock,
          image: p.image,
        }
      : {
          name: "",
          sku: "",
          category: this.categories().includes("Snacks")
            ? "Snacks"
            : this.categories()[1] || "",
          minStock: 10,
          image: "box",
        };
    this.error.set("");
    this.modal.set("product");
  }
  selectProductImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.imageFile = null;
    this.error.set("");
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      file.size === 0
    ) {
      input.value = "";
      this.error.set("Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.");
      return;
    }
    this.imageFile = file;
  }
  async saveProduct() {
    await this.run(async () => {
      if (this.imageFile) {
        const uploaded = await this.api.uploadProductImage(this.imageFile);
        this.form.image = uploaded.image;
        this.imageFile = null;
      }
      const body = {
        ...this.form,
        price: 100,
        minStock: Number(this.form.minStock),
      };
      await this.api.request(
        "products" + (this.selected ? "/" + this.selected.id : ""),
        this.selected ? "PATCH" : "POST",
        body,
      );
      this.modal.set("");
      await this.reload();
      this.notify(
        "Producto guardado a S/ 1.00. Registra sus existencias desde Ajustar stock.",
      );
    });
  }
  openStock(p: any) {
    this.selected = p;
    this.form = { quantity: 1, reason: "Reposición de mercadería" };
    this.error.set("");
    this.modal.set("stock");
  }
  async saveStock() {
    await this.run(async () => {
      await this.api.request(`products/${this.selected.id}/stock`, "POST", {
        quantity: Number(this.form.quantity),
        reason: this.form.reason,
      });
      this.modal.set("");
      await this.reload();
      this.notify("Stock actualizado.");
    });
  }
  archiveProduct(p: any) {
    this.confirm(
      "Archivar producto",
      `“${p.name}” dejará de aparecer en caja. Su historial se conservará.`,
      async () => {
        await this.api.request("products/" + p.id, "DELETE");
        this.remove(p.id);
        await this.reload();
        this.notify("Producto archivado.");
      },
    );
  }
  async showMovements(p: any) {
    await this.run(async () => {
      this.selected = p;
      this.movements.set(await this.api.request(`products/${p.id}/movements`));
      this.modal.set("movements");
    });
  }
  openCustomer(c?: any) {
    this.selected = c;
    this.form = c
      ? {
          name: c.name,
          document: c.document || "",
          phone: c.phone || "",
          email: c.email || "",
        }
      : { name: "", document: "", phone: "", email: "" };
    this.error.set("");
    this.modal.set("customer");
  }
  async saveCustomer() {
    await this.run(async () => {
      await this.api.request(
        "customers" + (this.selected ? "/" + this.selected.id : ""),
        this.selected ? "PATCH" : "POST",
        this.form,
      );
      this.modal.set("");
      await this.reload();
      this.notify("Cliente guardado.");
    });
  }
  archiveCustomer(c: any) {
    this.confirm(
      "Archivar cliente",
      `Se archivará a ${c.name}. Las ventas anteriores se conservarán.`,
      async () => {
        await this.api.request("customers/" + c.id, "DELETE");
        await this.reload();
      },
    );
  }
  viewReceipt(s: any) {
    this.receipt = s;
    this.modal.set("receipt");
  }
  cancelSale(s: any) {
    this.selected = s;
    this.form = { reason: "" };
    this.error.set("");
    this.modal.set("cancel");
  }
  async saveCancel() {
    await this.run(async () => {
      await this.api.request(
        `sales/${this.selected.id}/cancel`,
        "POST",
        this.form,
      );
      this.sales.set(
        await this.api.request(`sales?from=${this.from}&to=${this.to}`),
      );
      this.modal.set("");
      this.products.set(await this.api.request("products"));
      this.notify("Venta anulada y stock devuelto.");
    });
  }
  confirm(title: string, message: string, action: () => Promise<void>) {
    this.form = { title, message };
    this.pendingAction = action;
    this.modal.set("confirm");
  }
  async acceptConfirm() {
    await this.run(async () => {
      if (this.pendingAction) await this.pendingAction();
      this.modal.set("");
    });
  }
  closeModal() {
    if (!this.busy()) {
      this.modal.set("");
      this.error.set("");
    }
  }
  escape() {
    this.closeModal();
    this.mobile.set(false);
  }
  preventLoss(event: BeforeUnloadEvent) {
    if (this.cart().length) {
      event.preventDefault();
      event.returnValue = "";
    }
  }
  logout() {
    this.confirm(
      "Cerrar sesión",
      this.cart().length
        ? "La venta en curso se descartará al salir."
        : "Tu sesión se cerrará en este equipo.",
      async () => {
        await this.api.request("auth/logout", "POST");
        this.user.set(null);
        this.cart.set([]);
        this.products.set([]);
        this.customers.set([]);
        this.sales.set([]);
      },
    );
  }
  openSettings() {
    this.form = { ...this.settings() };
    delete this.form.id;
    this.error.set("");
    this.modal.set("settings");
  }
  async saveSettings() {
    await this.run(async () => {
      this.settings.set(await this.api.request("settings", "PATCH", this.form));
      this.modal.set("");
      this.notify("Datos de tienda actualizados.");
    });
  }
  openUser() {
    this.form = { name: "", email: "", password: "", role: "CASHIER" };
    this.error.set("");
    this.modal.set("user");
  }
  async saveUser() {
    await this.run(async () => {
      await this.api.request("users", "POST", this.form);
      this.users.set(await this.api.request("users"));
      this.modal.set("");
      this.notify("Usuario creado.");
    });
  }
  toggleUser(u: any) {
    this.confirm(
      u.active ? "Desactivar usuario" : "Activar usuario",
      `Cambiar el acceso de ${u.name}.`,
      async () => {
        await this.api.request("users/" + u.id, "PATCH", { active: !u.active });
        this.users.set(await this.api.request("users"));
      },
    );
  }
  openPassword() {
    this.form = { currentPassword: "", newPassword: "" };
    this.error.set("");
    this.modal.set("password");
  }
  async savePassword() {
    await this.run(async () => {
      await this.api.request("auth/password", "PATCH", this.form);
      this.modal.set("");
      this.notify("Contraseña actualizada.");
    });
  }
  bars() {
    const hours = this.dashboard()?.hours || [];
    return hours.filter((h: any) => h.hour >= 8 && h.hour <= 21);
  }
  barHeight(value: number) {
    const max = Math.max(...this.bars().map((h: any) => h.total), 100);
    return Math.max(0, (value / max) * 100);
  }
  reportHeight(value: number) {
    return (
      (value /
        Math.max(
          ...(this.report()?.daily || []).map((d: any) => d.total),
          100,
        )) *
      100
    );
  }
  csv(name: string, headers: string[], rows: any[][]) {
    const cell = (value: any) => {
      let str = String(value ?? "");
      if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
      return '"' + str.replaceAll('"', '""') + '"';
    };
    const blob = new Blob(
      [
        "\uFEFF" +
          [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.notify("Archivo CSV exportado.");
  }
  exportInventory() {
    this.csv(
      "inventario-don-pepe",
      ["Código", "Producto", "Categoría", "Precio S/", "Stock", "Mínimo"],
      this.filteredProducts().map((p) => [
        p.sku,
        p.name,
        p.category,
        p.price / 100,
        p.stock,
        p.minStock,
      ]),
    );
  }
  exportSales() {
    this.csv(
      "ventas-don-pepe",
      ["Ticket", "Fecha", "Cliente", "Pago", "Total S/", "Estado"],
      this.filteredSales().map((s) => [
        this.ticket(s.id),
        this.date(s.createdAt),
        s.customerName,
        this.paymentName(s.payment),
        s.total / 100,
        s.status === "COMPLETED" ? "Completada" : "Anulada",
      ]),
    );
  }
  exportCustomers() {
    this.csv(
      "clientes-don-pepe",
      ["Nombre", "Documento", "Teléfono", "Correo"],
      this.filteredCustomers().map((c) => [
        c.name,
        c.document,
        c.phone,
        c.email,
      ]),
    );
  }
  exportReport() {
    this.csv(
      "reporte-don-pepe",
      ["Fecha", "Ventas S/"],
      (this.report()?.daily || []).map((d: any) => [d.day, d.total / 100]),
    );
  }
  print() {
    window.print();
  }
}

export const tienda = new TiendaService();
export function useTienda() {
  useVersion();
  return tienda;
}
