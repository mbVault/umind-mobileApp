/** Hermes (some RN builds) lacks structuredClone; @dicebear/core requires it. */
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}

export {};
