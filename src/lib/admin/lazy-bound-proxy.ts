/**
 * Defers construction of a server client while preserving the client's method
 * receiver. SDK methods commonly mutate private instance state, so returning an
 * unbound method from a Proxy can make the Proxy itself become `this` and break
 * read-only SDK internals.
 */
export function createLazyBoundProxy<T extends object>(
  resolveTarget: () => T,
): T {
  return new Proxy({} as T, {
    get(_target, property) {
      const target = resolveTarget();
      const value = Reflect.get(target, property, target) as unknown;

      return typeof value === "function" ? value.bind(target) : value;
    },
    has(_target, property) {
      return property in resolveTarget();
    },
    ownKeys() {
      return Reflect.ownKeys(resolveTarget());
    },
    getOwnPropertyDescriptor(_target, property) {
      const descriptor = Object.getOwnPropertyDescriptor(resolveTarget(), property);
      if (!descriptor) {
        return undefined;
      }

      return {
        ...descriptor,
        configurable: true,
      };
    },
  });
}
