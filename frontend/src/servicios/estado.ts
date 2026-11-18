import { useSyncExternalStore } from "react";
let version = 0;
const listeners = new Set<() => void>();
export function emit() {
  version++;
  for (const notify of listeners) notify();
}
export function useVersion() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => version,
    () => version,
  );
}
export function signal<T>(initial: T) {
  let value = initial;
  const get = () => value;
  get.set = (next: T) => {
    value = next;
    emit();
  };
  get.update = (fn: (value: T) => T) => get.set(fn(value));
  return get;
}
export function computed<T>(fn: () => T) {
  return fn;
}
