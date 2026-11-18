import { signal } from "./estado";
export class ApiService {
  user = signal<any>(null);
  async uploadProductImage(file: File) {
    const res = await fetch("/api/product-images", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const raw = await res.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(`No se pudo subir la fotografía (HTTP ${res.status}).`);
    }
    if (!res.ok) {
      if (res.status === 401) this.user.set(null);
      throw new Error(
        data.message || `No se pudo subir la fotografía (HTTP ${res.status}).`,
      );
    }
    return data as {
      image: string;
    };
  }
  async request(url: string, method = "GET", body?: any) {
    const res = await fetch("/api/" + url, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const raw = await res.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {
        message:
          raw.slice(0, 240) ||
          `El servidor respondió sin datos (HTTP ${res.status}).`,
      };
    }
    if (!res.ok) {
      if (res.status === 401) this.user.set(null);
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(" · ")
          : data.message || `Error del servidor (HTTP ${res.status}).`,
      );
    }
    if (!raw && method !== "POST") return data;
    return data;
  }
}
