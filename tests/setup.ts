import "@testing-library/jest-dom/vitest";

/**
 * jsdom does not implement the browser APIs framer-motion reaches for during
 * hydration (motion-preference queries, viewport observers, canvas decoding).
 * These shims keep component tests focused on behaviour rather than on
 * missing DOM APIs.
 */

// Route changes scroll the window to the top; jsdom ships a scrollTo that only
// logs a "not implemented" error, which buries real test failures in noise.
window.scrollTo = (() => undefined) as unknown as typeof window.scrollTo;

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// `globalThis` is addressed through a loosely typed view so the negative
// branch of the `in` checks does not narrow it to `never`.
const testGlobals = globalThis as unknown as Record<string, unknown>;

if (!testGlobals.IntersectionObserver) {
  class MockIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: number[] = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): unknown[] {
      return [];
    }
  }
  testGlobals.IntersectionObserver = MockIntersectionObserver;
}

if (!testGlobals.ResizeObserver) {
  class MockResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  testGlobals.ResizeObserver = MockResizeObserver;
}

if (!("createImageBitmap" in window)) {
  // Gallery/avatar compression falls back to the original file when this is
  // absent, which is exactly what the tests want.
  Object.defineProperty(window, "createImageBitmap", { value: undefined, writable: true });
}
