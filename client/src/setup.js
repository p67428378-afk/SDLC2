import "@testing-library/jest-dom";

// Mock ResizeObserver globally for tests (e.g. for charts or responsive components)
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
