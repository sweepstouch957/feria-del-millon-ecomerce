import { useEffect, useState } from "react";

/** Espera a que dejen de escribir antes de soltar el valor.
 *  El buscador de obras pegaba una petición por tecla. */
export function useDebouncedValue<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);

  return settled;
}
