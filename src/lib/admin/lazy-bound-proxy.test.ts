import assert from "node:assert/strict";
import test from "node:test";

import { createLazyBoundProxy } from "./lazy-bound-proxy";

class MutableSdkClient {
  private initialized = false;

  initialize(): this {
    this.initialized = true;
    return this;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

test("lazy proxy resolves only when a property is read", () => {
  let resolutionCount = 0;
  const target = new MutableSdkClient();
  const proxy = createLazyBoundProxy(() => {
    resolutionCount += 1;
    return target;
  });

  assert.equal(resolutionCount, 0);
  assert.equal(proxy.isInitialized(), false);
  assert.equal(resolutionCount, 1);
});

test("lazy proxy binds SDK methods to the resolved target", () => {
  const target = new MutableSdkClient();
  const proxy = createLazyBoundProxy(() => target);

  assert.equal(proxy.initialize(), target);
  assert.equal(target.isInitialized(), true);
});
