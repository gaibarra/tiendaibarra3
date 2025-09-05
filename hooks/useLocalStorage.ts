// src/hooks/useLocalStorage.ts
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Options = {
  /** Tiempo de vida (ms). Si expira, vuelve al initialValue y limpia el storage. */
  ttl?: number;
  /** Prefijo opcional para separar espacios (p.ej. 'tiendaibarra3'). */
  namespace?: string;
  /** Cambiar el backend de almacenamiento (por defecto localStorage). */
  storage?: Storage;
  /** Sincroniza entre pestañas y dentro del mismo tab (default: true). */
  sync?: boolean;
};

type Wrapped<T> =
  | { __ls_meta: { v: 1; expiresAt: number | null }; value: T }
  | T;

const CUSTOM_EVT = 'local-storage-sync';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function now() {
  return Date.now();
}

export default function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: Options
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const {
    ttl,
    namespace,
    storage = isBrowser() ? window.localStorage : undefined,
    sync = true,
  } = options || {};

  const fullKey = useMemo(
    () => (namespace ? `${namespace}:${key}` : key),
    [key, namespace]
  );

  const initialRef = useRef(initialValue);

  // --- helpers de (de)serialización con TTL
  const serialize = (val: T): string => {
    const payload: Wrapped<T> =
      typeof ttl === 'number'
        ? { __ls_meta: { v: 1, expiresAt: now() + ttl }, value: val }
        : val;
    return JSON.stringify(payload);
  };

  const deserialize = (raw: string | null): T | undefined => {
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw) as Wrapped<T>;
      if (
        parsed &&
        typeof parsed === 'object' &&
        '__ls_meta' in (parsed as any) &&
        (parsed as any).__ls_meta?.v === 1
      ) {
        const meta = (parsed as any).__ls_meta as { v: 1; expiresAt: number | null };
        if (typeof meta.expiresAt === 'number' && meta.expiresAt <= now()) {
          // Expirado → limpiar y devolver undefined para reponer initial
          try {
            storage?.removeItem(fullKey);
          } catch {}
          return undefined;
        }
        return (parsed as any).value as T;
      }
      // Formato simple sin meta
      return parsed as T;
    } catch {
      // JSON corrupto → ignorar y restaurar initial
      try {
        storage?.removeItem(fullKey);
      } catch {}
      return undefined;
    }
  };

  const getInitial = (): T => {
    const iv = initialRef.current;
    return iv instanceof Function ? (iv as () => T)() : (iv as T);
  };

  // --- estado inicial (SSR-safe)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!storage) return getInitial();
    const des = deserialize(storage.getItem(fullKey));
    return des !== undefined ? des : getInitial();
  });

  // --- setter compatible con React.SetStateAction
  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    setStoredValue((prev) => {
      const next = value instanceof Function ? (value as (v: T) => T)(prev) : (value as T);
      try {
        storage?.setItem(fullKey, serialize(next));
        // Notificar a otros componentes del mismo tab
        if (sync && isBrowser()) {
          window.dispatchEvent(new CustomEvent(CUSTOM_EVT, { detail: { key: fullKey } }));
        }
      } catch (err) {
        console.error('useLocalStorage: setItem error', err);
      }
      return next;
    });
  };

  // --- rehidratar si cambia la key/namespace
  useEffect(() => {
    if (!storage) return;
    try {
      const des = deserialize(storage.getItem(fullKey));
      setStoredValue(des !== undefined ? des : getInitial());
    } catch (err) {
      console.error('useLocalStorage: rehydrate error', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  // --- sincronización entre pestañas y entre componentes del mismo tab
  useEffect(() => {
    if (!sync || !isBrowser()) return;

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key !== fullKey) return;
      const des = deserialize(e.newValue);
      setStoredValue(des !== undefined ? des : getInitial());
    };

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string } | undefined;
      if (!detail || detail.key !== fullKey) return;
      try {
        const raw = storage?.getItem(fullKey) ?? null;
        const des = deserialize(raw);
        setStoredValue(des !== undefined ? des : getInitial());
      } catch {}
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(CUSTOM_EVT, onCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CUSTOM_EVT, onCustom as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey, sync]);

  return [storedValue, setValue];
}
