import "@testing-library/jest-dom";

// Mock ResizeObserver for testing
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
