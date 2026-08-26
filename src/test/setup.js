import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver - recharts' <ResponsiveContainer> (and any
// future chart) needs one to measure its container, or it renders nothing.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
