import '@testing-library/jest-dom';

// Provide a minimal localStorage mock for test environments without it
if (typeof window === 'undefined') {
  // eslint-disable-next-line no-global-assign
  global.window = {};
}

if (typeof window !== 'undefined' && !window.localStorage) {
  let store = {};
  window.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

// Ensure global.localStorage references the mock as well
if (typeof global.localStorage === 'undefined' && typeof window !== 'undefined') {
  global.localStorage = window.localStorage;
}
