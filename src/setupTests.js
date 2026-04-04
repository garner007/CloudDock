// jest-dom adds custom matchers: toBeInTheDocument, toHaveTextContent, etc.
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// ── TextEncoder/TextDecoder polyfill ───────────────────────────────────────────
// jsdom doesn't provide these; needed for AWS SDK and Lambda invoke payloads
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// ── MSW lifecycle ──────────────────────────────────────────────────────────────
// Start server before all tests, reset handlers after each, close after all
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Browser API stubs ──────────────────────────────────────────────────────────
// localStorage (CRA provides this but let's be explicit)
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// window.confirm — default to true (user confirmed) in tests
window.confirm = jest.fn(() => true);

// window.open — stub so download/link tests don't throw
window.open = jest.fn();

// AbortSignal.timeout — polyfill for Node < 20
if (!AbortSignal.timeout) {
  AbortSignal.timeout = (ms) => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl.signal;
  };
}

// Suppress noisy console.error in tests (e.g. React act() warnings)
const originalError = console.error.bind(console);
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('act(') || args[0].includes('not wrapped in act'))
  ) return;
  originalError(...args);
};
