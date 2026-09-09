import '@testing-library/jest-dom';

// Suprime los avisos de red esperados durante los tests.
// Los servicios intentan hacer fetch al backend, fallan (no hay servidor corriendo),
// y registran un console.warn antes de usar el fallback de localStorage.
// Es comportamiento correcto — solo eliminamos el ruido en la salida de tests.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('[InvitacionesApi]') || msg.includes('fallback')) return;
  originalWarn(...args);
};
